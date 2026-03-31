// lib/utils.ts

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number | undefined | null, currency = "INR"): string {
  if (value == null) return "—";
  if (currency === "INR" || currency === "INd") {
    if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`;
    return `₹${value.toLocaleString("en-IN")}`;
  }
  return `${value.toLocaleString()}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null) return "—";
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  return value.toLocaleString("en-IN");
}

export function formatPercent(value: number | undefined | null, decimals = 2): string {
  if (value == null) return "—";
  const pct = value > 1 ? value : value * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(decimals)}%`;
}

export function formatMarketCap(value: number | undefined | null): string {
  if (value == null) return "—";
  // Yahoo returns in actual currency value
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export function getCapCategory(marketCap: number | undefined | null): string {
  if (!marketCap) return "—";
  const crores = marketCap / 1e7;
  if (crores >= 20000) return "Large Cap";
  if (crores >= 5000) return "Mid Cap";
  return "Small Cap";
}

export function getCapBadgeColor(cap: string): string {
  if (cap === "Large Cap") return "badge-blue";
  if (cap === "Mid Cap") return "badge-purple";
  return "badge-amber";
}

export function isPositive(value: number | undefined | null): boolean {
  return (value ?? 0) >= 0;
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
