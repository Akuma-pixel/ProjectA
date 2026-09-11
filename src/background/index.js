import { SITES, siteForHostname } from "../shared/siteConfigs.js";
import { extractProductFromPage, extractSearchResultFromPage } from "../shared/scrapers.js";
import { parsePrice, cleanTitle } from "../shared/format.js";

const JOB_KEY = "kompare_job";
const TAB_LOAD_TIMEOUT_MS = 20000;
const PER_SITE_HARD_TIMEOUT_MS = 26000;

// Serializes all reads/writes of the job record so concurrent site
// completions can't clobber each other (classic lost-update problem).
let writeQueue = Promise.resolve();
function serialize(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function getJob() {
  const store = await chrome.storage.local.get(JOB_KEY);
  return store[JOB_KEY] || null;
}

async function setJob(job) {
  await chrome.storage.local.set({ [JOB_KEY]: job });
}

async function updateJobResult(jobId, siteKey, patch) {
  return serialize(async () => {
    const job = await getJob();
    if (!job || job.id !== jobId) return; // superseded by a newer job
    job.results[siteKey] = { ...(job.results[siteKey] || {}), ...patch };
    job.updatedAt = Date.now();
    await setJob(job);
  });
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    function finish(fn, arg) {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      clearTimeout(timer);
      fn(arg);
    }
    function onUpdated(id, changeInfo) {
      if (id === tabId && changeInfo.status === "complete") finish(resolve);
    }
    function onRemoved(id) {
      if (id === tabId) finish(reject, new Error("Tab closed before the page finished loading"));
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    const timer = setTimeout(
      () => finish(reject, new Error("Timed out waiting for the page to load")),
      timeoutMs
    );
    // Covers the race where the tab already finished loading before we
    // attached the listener.
    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab && tab.status === "complete") finish(resolve);
      })
      .catch(() => {});
  });
}

async function closeTabQuietly(tabId) {
  try {
    await chrome.tabs.remove(tabId);
  } catch (e) {
    /* already closed, ignore */
  }
}

async function fetchSiteResult(jobId, siteKey, query) {
  const site = SITES[siteKey];
  if (!site) {
    await updateJobResult(jobId, siteKey, { status: "error", message: "Unknown site" });
    return;
  }

  let tabId = null;
  const timeoutGuard = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("This site took too long to respond")), PER_SITE_HARD_TIMEOUT_MS)
  );

  try {
    const work = (async () => {
      const url = site.buildSearchUrl(query);
      const tab = await chrome.tabs.create({ url, active: false });
      tabId = tab.id;
      await waitForTabComplete(tabId, TAB_LOAD_TIMEOUT_MS);
      const injection = await chrome.scripting.executeScript({
        target: { tabId },
        func: extractSearchResultFromPage,
        args: [site.search],
      });
      return injection && injection[0] ? injection[0].result : null;
    })();

    // If the timeout guard wins, `work` may still resolve/reject later with
    // nobody awaiting it — swallow that so it doesn't surface as an
    // unhandled rejection in the service worker console.
    work.catch(() => {});
    const scraped = await Promise.race([work, timeoutGuard]);

    if (!scraped || !scraped.found) {
      await updateJobResult(jobId, siteKey, {
        status: "not_found",
        message: site.locationGated
          ? "Couldn't read a result — this app may need a delivery location set in this browser first"
          : "Couldn't find a matching result",
        searchUrl: site.buildSearchUrl(query),
      });
      return;
    }

    const price = parsePrice(scraped.priceRaw);
    if (price == null) {
      await updateJobResult(jobId, siteKey, {
        status: "not_found",
        message: "Found a result but couldn't read its price",
        title: cleanTitle(scraped.title),
        searchUrl: site.buildSearchUrl(query),
      });
      return;
    }

    await updateJobResult(jobId, siteKey, {
      status: "success",
      title: cleanTitle(scraped.title) || query,
      price,
      image: scraped.image || null,
      url: scraped.url || site.buildSearchUrl(query),
      confidence: scraped.confidence,
    });
  } catch (err) {
    await updateJobResult(jobId, siteKey, {
      status: "error",
      message: err && err.message ? err.message : "Something went wrong",
      searchUrl: site.buildSearchUrl(query),
    });
  } finally {
    if (tabId != null) await closeTabQuietly(tabId);
  }
}

async function startCompare({ query, siteKeys, sourceEntry, sourceSiteKey }) {
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const results = {};

  if (sourceSiteKey && sourceEntry) {
    results[sourceSiteKey] = { status: "success", ...sourceEntry };
  }
  for (const key of siteKeys) {
    if (key === sourceSiteKey) continue;
    results[key] = { status: "pending" };
  }

  const job = {
    id: jobId,
    query,
    sourceSiteKey: sourceSiteKey || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    results,
  };
  await setJob(job);

  for (const key of siteKeys) {
    if (key === sourceSiteKey) continue;
    fetchSiteResult(jobId, key, query); // intentionally not awaited — runs concurrently
  }

  return jobId;
}

async function scrapeActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return { ok: false, reason: "no_active_tab" };

  let hostname;
  try {
    hostname = new URL(tab.url).hostname;
  } catch (e) {
    return { ok: false, reason: "unsupported" };
  }

  const site = siteForHostname(hostname);
  if (!site) return { ok: false, reason: "unsupported" };

  try {
    const injection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractProductFromPage,
      args: [site.product],
    });
    const scraped = injection && injection[0] ? injection[0].result : null;
    if (!scraped) return { ok: false, reason: "scrape_failed", siteKey: site.key };

    const price = parsePrice(scraped.priceRaw);
    return {
      ok: true,
      siteKey: site.key,
      product: {
        title: cleanTitle(scraped.title) || tab.title || "",
        price,
        image: scraped.image || null,
        url: scraped.url || tab.url,
        confidence: scraped.confidence,
      },
    };
  } catch (err) {
    return {
      ok: false,
      reason: "scrape_failed",
      siteKey: site.key,
      message: err && err.message ? err.message : "Couldn't read this page",
    };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;

  if (message.type === "SCRAPE_ACTIVE_TAB") {
    scrapeActiveTab().then(sendResponse);
    return true; // keep the channel open for the async response
  }

  if (message.type === "START_COMPARE") {
    startCompare(message.payload)
      .then((jobId) => sendResponse({ ok: true, jobId }))
      .catch((err) => sendResponse({ ok: false, message: err.message }));
    return true;
  }

  if (message.type === "RETRY_SITE") {
    const { jobId, siteKey, query } = message.payload;
    updateJobResult(jobId, siteKey, { status: "pending" })
      .then(() => fetchSiteResult(jobId, siteKey, query))
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "GET_JOB") {
    getJob().then((job) => sendResponse({ ok: true, job }));
    return true;
  }

  return false;
});
