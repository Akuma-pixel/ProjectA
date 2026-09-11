import React from "react";

export default function ManualSearch({ value, onChange }) {
  return (
    <div>
      <div className="section-label">Or search a product by name</div>
      <div className="manual-search">
        <input
          type="text"
          placeholder="e.g. Amul Butter 500g"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
