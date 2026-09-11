import React from "react";
import { formatINR } from "../../shared/format.js";
import Badge from "./Badge.jsx";

export default function ResultRow({ site, entry, isBest, onRetry }) {
  const status = entry.status;

  return (
    <div className={`result-row${isBest ? " best" : ""}`}>
      <Badge site={site} />
      <div className="result-main">
        <div className="result-site-line">
          <span className="result-site-name">{site.label}</span>
        </div>

        {status === "pending" && <div className="result-sub">Checking live price…</div>}

        {status === "success" && entry.confidence === "low" && (
          <div className="result-sub">Approximate match — worth a quick check</div>
        )}

        {status === "not_found" && (
          <div className="result-sub warn">{entry.message || "No match found"}</div>
        )}

        {status === "error" && <div className="result-sub danger">{entry.message}</div>}

        {(status === "not_found" || status === "error") && entry.searchUrl && (
          <a className="link-btn" href={entry.searchUrl} target="_blank" rel="noreferrer">
            Check on {site.label} ↗
          </a>
        )}

        {status === "error" && onRetry && (
          <>
            {" · "}
            <button type="button" className="retry-btn" onClick={() => onRetry(site.key)}>
              Retry
            </button>
          </>
        )}
      </div>

      <div className="result-right">
        {status === "pending" && <div className="spinner" />}
        {status === "success" && (
          <>
            <span className="result-price tabular">{formatINR(entry.price)}</span>
            {isBest && <span className="best-tag">Best price</span>}
            {entry.url && (
              <a className="link-btn" href={entry.url} target="_blank" rel="noreferrer">
                Open ↗
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
