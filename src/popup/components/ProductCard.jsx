import React from "react";
import { formatINR } from "../../shared/format.js";

export default function ProductCard({ site, product }) {
  return (
    <div className="product-card">
      {product.image ? (
        <img className="thumb" src={product.image} alt="" />
      ) : (
        <div className="thumb placeholder">No image</div>
      )}
      <div className="info">
        <span className="source-tag">Detected on {site.label}</span>
        <span className="title">{product.title}</span>
        {product.price != null ? (
          <span className="price tabular">{formatINR(product.price)}</span>
        ) : (
          <span className="price unknown">Couldn't read the price on this page</span>
        )}
      </div>
    </div>
  );
}
