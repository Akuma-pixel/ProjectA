import React from "react";

function contrastText(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#16181c" : "#ffffff";
}

export default function Badge({ site, size = 30 }) {
  return (
    <div
      className="badge"
      style={{
        background: site.color,
        color: contrastText(site.color),
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
      aria-hidden="true"
    >
      {site.initial}
    </div>
  );
}
