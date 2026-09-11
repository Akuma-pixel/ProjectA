// ---------------------------------------------------------------------------
// These two functions are passed directly to chrome.scripting.executeScript
// as the `func` argument, which means Chrome re-serializes them and runs
// them inside the target page's isolated world. They must be fully
// self-contained: no references to outer closures, imports, or module
// scope — only `document`/`window` and whatever is passed through `args`.
// That's why every helper is nested inside instead of imported.
// ---------------------------------------------------------------------------

/**
 * Runs inside a product page. Tries curated selectors first, then Open
 * Graph / microdata meta tags, then a last-resort text scan for a rupee
 * amount near the top of the page. Returns a confidence flag so the UI can
 * tell the user when a number is a best guess rather than a confirmed read.
 */
export function extractProductFromPage(selectors) {
  function textOf(el) {
    if (!el) return null;
    const v = el.tagName === "META" ? el.getAttribute("content") : el.innerText || el.textContent;
    return v && v.trim() ? v.trim() : null;
  }

  function firstMatch(list) {
    for (const sel of list || []) {
      try {
        const el = document.querySelector(sel);
        const v = textOf(el);
        if (v) return v;
      } catch (e) {
        /* invalid selector on this page, skip */
      }
    }
    return null;
  }

  function firstImage(list) {
    for (const sel of list || []) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const src = el.getAttribute("src") || el.getAttribute("content");
          if (src) return src;
        }
      } catch (e) {
        /* skip */
      }
    }
    return null;
  }

  function metaContent(names) {
    for (const name of names) {
      const el =
        document.querySelector(`meta[property="${name}"]`) ||
        document.querySelector(`meta[name="${name}"]`);
      if (el) {
        const v = el.getAttribute("content");
        if (v && v.trim()) return v.trim();
      }
    }
    return null;
  }

  function genericPriceScan() {
    const rupeeRe = /(?:₹|Rs\.?|INR)\s?([\d,]+(?:\.\d{1,2})?)/;
    const body = document.body ? document.body.innerText || document.body.textContent || "" : "";
    const m = body.match(rupeeRe);
    return m ? m[0] : null;
  }

  let confidence = "high";

  let title = firstMatch(selectors.title);
  if (!title) {
    title = metaContent(["og:title"]) || (document.title || "").trim() || null;
    confidence = "low";
  }

  let priceRaw = firstMatch(selectors.price);
  if (!priceRaw) {
    priceRaw = metaContent(["product:price:amount", "og:price:amount"]);
    if (priceRaw) priceRaw = "₹" + priceRaw;
    confidence = "low";
  }
  if (!priceRaw) {
    priceRaw = genericPriceScan();
    confidence = "low";
  }

  let image = firstImage(selectors.image);
  if (!image) {
    image = metaContent(["og:image"]);
  }

  return {
    title,
    priceRaw,
    image,
    url: location.href,
    confidence,
  };
}

/**
 * Runs inside a search-results page opened in a background tab. Polls
 * briefly for client-rendered content (most of these sites are SPAs) before
 * giving up, since a fixed "wait for tab complete" isn't enough for
 * JS-heavy result lists.
 */
export async function extractSearchResultFromPage(selectors) {
  function textOf(el) {
    if (!el) return null;
    const v = el.innerText || el.textContent;
    return v && v.trim() ? v.trim() : null;
  }

  function within(root, list) {
    for (const sel of list || []) {
      try {
        const el = root.querySelector(sel);
        const v = textOf(el);
        if (v) return v;
      } catch (e) {
        /* skip */
      }
    }
    return null;
  }

  function withinImage(root, list) {
    for (const sel of list || []) {
      try {
        const el = root.querySelector(sel);
        if (el) {
          const src = el.getAttribute("src") || el.getAttribute("data-src");
          if (src) return src;
        }
      } catch (e) {
        /* skip */
      }
    }
    return null;
  }

  function withinLink(root, list) {
    for (const sel of list || []) {
      try {
        const el = root.querySelector(sel);
        const href = el && el.getAttribute("href");
        if (href) return href;
      } catch (e) {
        /* skip */
      }
    }
    return null;
  }

  function findContainer() {
    for (const sel of selectors.resultItem || []) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch (e) {
        /* skip */
      }
    }
    return null;
  }

  function genericPriceScan(scope) {
    const rupeeRe = /(?:₹|Rs\.?|INR)\s?([\d,]+(?:\.\d{1,2})?)/;
    const el = scope || document.body;
    const text = el ? el.innerText || el.textContent || "" : "";
    const m = text.match(rupeeRe);
    return m ? m[0] : null;
  }

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  let container = null;
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    container = findContainer();
    if (container) break;
    await sleep(500);
  }

  if (!container) {
    // Nothing matched even after polling — last resort: scan whole page.
    const priceRaw = genericPriceScan(null);
    return {
      title: null,
      priceRaw,
      image: null,
      url: null,
      confidence: "low",
      found: false,
    };
  }

  let confidence = "high";
  let title = within(container, selectors.title);
  let priceRaw = within(container, selectors.price);
  if (!priceRaw) {
    priceRaw = genericPriceScan(container);
    confidence = "low";
  }
  const image = withinImage(container, selectors.image);
  const href = withinLink(container, selectors.link);
  const url = href ? new URL(href, location.href).href : location.href;

  return { title, priceRaw, image, url, confidence, found: true };
}
