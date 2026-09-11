import React from "react";
import { SITE_LIST, CATEGORY } from "../../shared/siteConfigs.js";

function Group({ label, sites, excludeKey, selected, onToggle }) {
  const visible = sites.filter((s) => s.key !== excludeKey);
  if (visible.length === 0) return null;
  return (
    <div>
      <div className="toggle-cat-label">{label}</div>
      <div className="chip-row">
        {visible.map((site) => {
          const checked = selected.has(site.key);
          return (
            <button
              key={site.key}
              type="button"
              className={`site-chip${checked ? " checked" : ""}`}
              onClick={() => onToggle(site.key)}
              aria-pressed={checked}
            >
              <span className="dot" style={{ background: site.color }} />
              {site.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SiteToggles({ excludeKey, selected, onToggle }) {
  const shopping = SITE_LIST.filter((s) => s.category === CATEGORY.SHOPPING);
  const delivery = SITE_LIST.filter((s) => s.category === CATEGORY.DELIVERY);
  return (
    <div className="toggle-group">
      <div className="section-label">Compare against</div>
      <Group label="Shopping" sites={shopping} excludeKey={excludeKey} selected={selected} onToggle={onToggle} />
      <Group label="Delivery apps" sites={delivery} excludeKey={excludeKey} selected={selected} onToggle={onToggle} />
    </div>
  );
}
