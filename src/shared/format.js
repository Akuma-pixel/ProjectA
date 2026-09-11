const PRICE_RE = /(?:₹|Rs\.?|INR)?\s?([\d,]+(?:\.\d{1,2})?)/;

/** Turns "₹1,299.00", "Rs. 499", "1,299" etc into a plain number, or null. */
export function parsePrice(raw) {
  if (!raw || typeof raw !== "string") return null;
  const m = raw.match(PRICE_RE);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

export function formatINR(amount) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function cleanTitle(title) {
  if (!title) return "";
  return title.replace(/\s+/g, " ").trim();
}
