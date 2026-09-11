import React from "react";
import { SITES } from "../../shared/siteConfigs.js";
import { formatINR } from "../../shared/format.js";
import ResultRow from "./ResultRow.jsx";

export default function ResultsList({ job, sourceSiteKey, sourcePrice, onRetry }) {
  const entries = Object.entries(job.results).filter(([key]) => SITES[key]);

  const resolved = entries
    .filter(([, e]) => e.status === "success")
    .sort((a, b) => a[1].price - b[1].price);
  const pending = entries.filter(([, e]) => e.status === "pending");
  const unresolved = entries.filter(([, e]) => e.status === "not_found" || e.status === "error");

  const ordered = [...resolved, ...pending, ...unresolved];
  const bestKey = resolved.length > 0 ? resolved[0][0] : null;
  const bestPrice = resolved.length > 0 ? resolved[0][1].price : null;

  const showSavings =
    bestKey &&
    bestKey !== sourceSiteKey &&
    sourcePrice != null &&
    bestPrice != null &&
    bestPrice < sourcePrice;

  return (
    <div>
      {showSavings && (
        <div className="savings-banner">
          💸 Save {formatINR(sourcePrice - bestPrice)} on {SITES[bestKey].label} instead
        </div>
      )}
      <div className="results-list">
        {ordered.map(([key, entry]) => (
          <ResultRow
            key={key}
            site={SITES[key]}
            entry={entry}
            isBest={key === bestKey}
            onRetry={entry.status === "error" ? onRetry : null}
          />
        ))}
      </div>
    </div>
  );
}
