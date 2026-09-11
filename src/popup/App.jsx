import React, { useEffect, useMemo, useState, useCallback } from "react";
import { SITE_LIST } from "../shared/siteConfigs.js";
import Header from "./components/Header.jsx";
import ProductCard from "./components/ProductCard.jsx";
import SiteToggles from "./components/SiteToggles.jsx";
import ManualSearch from "./components/ManualSearch.jsx";
import EmptyState from "./components/EmptyState.jsx";
import ResultsList from "./components/ResultsList.jsx";

const JOB_KEY = "kompare_job";

export default function App() {
  const [scan, setScan] = useState({ status: "loading" });
  const [selectedSites, setSelectedSites] = useState(new Set());
  const [manualQuery, setManualQuery] = useState("");
  const [job, setJob] = useState(null);
  const [starting, setStarting] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Scan the active tab once on open, and resume any comparison already
  // running in the background (e.g. the user closed and reopened the popup).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await chrome.runtime.sendMessage({ type: "SCRAPE_ACTIVE_TAB" });
        if (cancelled) return;
        if (res && res.ok) {
          setScan({ status: "detected", siteKey: res.siteKey, product: res.product });
          setSelectedSites(new Set(SITE_LIST.filter((s) => s.key !== res.siteKey).map((s) => s.key)));
        } else {
          setScan({ status: "unsupported" });
          setSelectedSites(new Set(SITE_LIST.map((s) => s.key)));
        }
      } catch (err) {
        if (cancelled) return;
        setScan({ status: "unsupported" });
        setSelectedSites(new Set(SITE_LIST.map((s) => s.key)));
        setScanError("Couldn't read the current tab.");
      }
    })();

    chrome.storage.local.get(JOB_KEY).then((store) => {
      if (!cancelled && store[JOB_KEY]) setJob(store[JOB_KEY]);
    });

    function onChanged(changes, area) {
      if (area === "local" && changes[JOB_KEY]) {
        setJob(changes[JOB_KEY].newValue || null);
      }
    }
    chrome.storage.onChanged.addListener(onChanged);

    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const toggleSite = useCallback((key) => {
    setSelectedSites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const detected = scan.status === "detected";
  const effectiveQuery = detected ? scan.product.title : manualQuery.trim();
  const canCompare = effectiveQuery.length > 0 && selectedSites.size > 0 && !starting;

  const handleCompare = useCallback(async () => {
    if (!canCompare) return;
    setStarting(true);
    try {
      const sourceEntry =
        detected && scan.product.price != null
          ? {
              title: scan.product.title,
              price: scan.product.price,
              image: scan.product.image,
              url: scan.product.url,
              confidence: scan.product.confidence,
            }
          : null;

      const payload = {
        query: effectiveQuery,
        siteKeys: Array.from(selectedSites),
        sourceEntry,
        sourceSiteKey: sourceEntry ? scan.siteKey : null,
      };

      await chrome.runtime.sendMessage({ type: "START_COMPARE", payload });
      const store = await chrome.storage.local.get(JOB_KEY);
      if (store[JOB_KEY]) setJob(store[JOB_KEY]);
    } catch (err) {
      // Surfaced via job state naturally on next storage read; keep this
      // path non-fatal so a transient messaging hiccup doesn't crash the UI.
    } finally {
      setStarting(false);
    }
  }, [canCompare, detected, effectiveQuery, scan, selectedSites]);

  const handleRetry = useCallback(
    async (siteKey) => {
      if (!job) return;
      await chrome.runtime.sendMessage({
        type: "RETRY_SITE",
        payload: { jobId: job.id, siteKey, query: job.query },
      });
    },
    [job]
  );

  const handleReset = useCallback(async () => {
    await chrome.storage.local.remove(JOB_KEY);
    setJob(null);
    setManualQuery("");
  }, []);

  const sourcePrice = useMemo(() => {
    if (!job || !job.sourceSiteKey) return null;
    const entry = job.results[job.sourceSiteKey];
    return entry && entry.status === "success" ? entry.price : null;
  }, [job]);

  return (
    <>
      <Header />
      <div className="k-body">
        {job ? (
          <>
            <div>
              <div className="section-label">Comparing "{job.query}"</div>
              <ResultsList job={job} sourceSiteKey={job.sourceSiteKey} sourcePrice={sourcePrice} onRetry={handleRetry} />
            </div>
            <button type="button" className="btn-text" onClick={handleReset} style={{ alignSelf: "flex-start" }}>
              Start a new comparison
            </button>
          </>
        ) : (
          <>
            {scan.status === "loading" && <div className="empty-state">Reading this page…</div>}

            {detected && <ProductCard site={SITE_LIST.find((s) => s.key === scan.siteKey)} product={scan.product} />}

            {scan.status === "unsupported" && <EmptyState />}

            {scan.status !== "loading" && !detected && <ManualSearch value={manualQuery} onChange={setManualQuery} />}

            {scan.status !== "loading" && (
              <SiteToggles excludeKey={detected ? scan.siteKey : null} selected={selectedSites} onToggle={toggleSite} />
            )}

            {scan.status !== "loading" && (
              <button type="button" className="btn-primary" onClick={handleCompare} disabled={!canCompare}>
                {starting ? "Starting…" : "Compare prices"}
              </button>
            )}

            {scanError && <div className="result-sub warn">{scanError}</div>}

            <div className="disclaimer">
              Kompare reads publicly visible prices from each site's own pages in the background. Delivery apps
              may need a delivery location already set in this browser to return a match.
            </div>
          </>
        )}
      </div>
    </>
  );
}
