import React from "react";
import { SITE_LIST } from "../../shared/siteConfigs.js";
import Badge from "./Badge.jsx";

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="headline">No supported product page detected</div>
      <div className="sub">
        Open a product on one of these, or just search a product name below.
      </div>
      <div className="chip-row" style={{ justifyContent: "center" }}>
        {SITE_LIST.map((s) => (
          <Badge key={s.key} site={s} size={24} />
        ))}
      </div>
    </div>
  );
}
