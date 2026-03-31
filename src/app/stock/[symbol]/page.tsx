"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, StarOff, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Shield, Info, RefreshCw, WifiOff
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from "recharts";
import {
  computeFundamentalScore, computeInvestmentSignal,
  computeRiskLevel, computeStrengthsWeaknesses, computeAISummary,
  StockMetrics
} from "@/lib/scoring";
import {
  formatCurrency, formatPercent, formatMarketCap,
  getCapCategory, getCapBadgeColor, isPositive, cn
} from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StockData {
  symbol: string;
  shortName: string;
  longName: string;
  price: {
    current: number;
    previousClose: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    change: number;
    changePercent: number;
    volume: number;
    avgVolume: number;
    marketCap: number;
    currency: string;
  };
  keyStats: {
    pe?: number; forwardPE?: number; pb?: number; eps?: number;
    dividendYield?: number; fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number;
    beta?: number; bookValue?: number; roe?: number; roa?: number;
    debtToEquity?: number; revenueGrowth?: number; earningsGrowth?: number;
    grossMargins?: number; profitMargins?: number; operatingMargins?: number;
    freeCashflow?: number; totalCash?: number; totalDebt?: number;
  };
  profile: {
    sector?: string; industry?: string; website?: string;
    description?: string; fullTimeEmployees?: number;
  };
  analystRating: {
    recommendationKey?: string; recommendationMean?: number;
    numberOfAnalystOpinions?: number; targetHighPrice?: number;
    targetLowPrice?: number; targetMeanPrice?: number;
  };
}

type ChartPeriod = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";
type Tab = "overview" | "fundamentals" | "insights" | "news";

const PERIODS: { label: string; value: ChartPeriod }[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
];

const MOCK_NEWS = [
  { title: "Q3 Results Beat Expectations — Revenue Up 18% YoY", sentiment: "positive", source: "Economic Times", time: "2h ago", url: "#" },
  { title: "Company Announces Expansion into New Markets", sentiment: "positive", source: "Business Standard", time: "5h ago", url: "#" },
  { title: "Promoter Group Increases Stake by 0.5%", sentiment: "positive", source: "Mint", time: "1d ago", url: "#" },
  { title: "Global Headwinds May Impact Margins in Short Term", sentiment: "negative", source: "Financial Express", time: "2d ago", url: "#" },
  { title: "Board Meeting Scheduled for Q4 Earnings Discussion", sentiment: "neutral", source: "NSE India", time: "3d ago", url: "#" },
  { title: "Analyst Upgrades Stock to BUY with Revised Target", sentiment: "positive", source: "CNBC TV18", time: "4d ago", url: "#" },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 68 ? "#10B981" : score >= 45 ? "#F59E0B" : "#EF4444";
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--border-color)" strokeWidth="8" />
        <circle
          cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 54 54)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="54" y="50" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="700" fontFamily="Inter">{score}</text>
        <text x="54" y="66" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="Inter">/100</text>
      </svg>
      <p className="text-xs font-semibold mt-1" style={{ color }}>
        {score >= 68 ? "Strong" : score >= 45 ? "Average" : "Weak"}
      </p>
    </div>
  );
}

function BarMeter({ label, value, max = 100, color = "#3B82F6" }: {
  label: string; value: number; max?: number; color?: string
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: "var(--border-color)" }}>
        <motion.div
          className="h-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function SentimentGauge({ score }: { score: number }) {
  // score 0-100: 0=extreme bearish, 50=neutral, 100=extreme bullish
  const angle = (score / 100) * 180 - 90;
  const label = score >= 70 ? "Bullish" : score >= 55 ? "Slightly Bullish" : score >= 45 ? "Neutral" : score >= 30 ? "Slightly Bearish" : "Bearish";
  const color = score >= 60 ? "#10B981" : score >= 45 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" width="200" height="110">
        <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="#EF4444" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M10 100 A90 90 0 0 1 100 10" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <path d="M100 10 A90 90 0 0 1 190 100" fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <line
          x1="100" y1="100"
          x2={100 + 70 * Math.cos(((angle - 180) * Math.PI) / 180)}
          y2={100 + 70 * Math.sin(((angle - 180) * Math.PI) / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="6" fill={color} />
      </svg>
      <p className="font-bold text-base -mt-2" style={{ color }}>{label}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Sentiment Score: {score}/100</p>
    </div>
  );
}

// ─── CustomTooltip for Chart ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        ₹{payload[0].value?.toFixed(2)}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawSymbol = decodeURIComponent(params.symbol as string);
  const symbol = rawSymbol.includes(".") ? rawSymbol : `${rawSymbol}.NS`;

  const [stock, setStock] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<{ date: string; close: number }[]>([]);
  const [period, setPeriod] = useState<ChartPeriod>("1mo");
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlisted, setWatchlisted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [priceRefreshing, setPriceRefreshing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [priceFlash, setPriceFlash] = useState<"" | "flash-green" | "flash-red">("")
  const prevPriceRef = useRef<number | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // Check watchlist
  useEffect(() => {
    const wl = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setWatchlisted(wl.includes(symbol));
  }, [symbol]);

  // ── Full stock fetch (on mount / symbol change) ─────────────────────────────
  useEffect(() => {
    async function fetchStock() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Stock not found");
        const data = await res.json();
        setStock(data);
        prevPriceRef.current = data.price?.current ?? null;
        setLastUpdated(new Date());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    fetchStock();

    // ── SSE for live price stream ─────────────────────────────────────────────
    const es = new EventSource(`/api/live/${encodeURIComponent(symbol)}`);
    esRef.current = es;

    es.onopen = () => setLiveConnected(true);
    es.onerror = () => setLiveConnected(false);

    es.addEventListener("price", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        setLiveConnected(true);
        setLastUpdated(new Date());
        setPriceRefreshing(false);

        // Flash animation
        if (prevPriceRef.current !== null && d.price !== prevPriceRef.current) {
          const cls = d.price > prevPriceRef.current ? "flash-green" : "flash-red";
          setPriceFlash(cls);
          setTimeout(() => setPriceFlash(""), 700);
        }
        prevPriceRef.current = d.price;

        setStock(prev => prev ? {
          ...prev,
          price: {
            ...prev.price,
            current: d.price,
            change: d.change,
            changePercent: d.changePercent,
            volume: d.volume ?? prev.price.volume,
            dayHigh: d.dayHigh ?? prev.price.dayHigh,
            dayLow: d.dayLow ?? prev.price.dayLow,
            open: d.open ?? prev.price.open,
            previousClose: d.previousClose ?? prev.price.previousClose,
            marketCap: d.marketCap ?? prev.price.marketCap,
          },
        } : prev);
      } catch { /* ignore */ }
    });

    return () => {
      es.close();
      esRef.current = null;
      setLiveConnected(false);
    };
  }, [symbol]);

  // Fetch chart data
  useEffect(() => {
    async function fetchChart() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/history?period=${period}`);
        const data = await res.json();
        if (data.data) {
          setChartData(data.data.map((d: { date: string; close: number }) => ({
            date: new Date(d.date).toLocaleDateString("en-IN", {
              month: "short", day: "numeric",
              ...(period === "5y" || period === "1y" ? { year: "2-digit" } : {})
            }),
            close: d.close,
          })));
        }
      } catch { }
      finally { setChartLoading(false); }
    }
    fetchChart();
  }, [symbol, period]);

  // Toggle watchlist
  function toggleWatchlist() {
    const wl: string[] = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const updated = watchlisted ? wl.filter(s => s !== symbol) : [...wl, symbol];
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setWatchlisted(!watchlisted);
  }

  if (loading) return <StockDetailSkeleton />;
  if (error || !stock) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertTriangle size={40} className="text-amber-500" />
      <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Stock not found</p>
      <p style={{ color: "var(--text-muted)" }}>{error || "Could not load data for this symbol."}</p>
      <button onClick={() => router.back()} className="btn-primary flex items-center gap-2">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  const pos = isPositive(stock.price.changePercent);
  const cap = getCapCategory(stock.price.marketCap);
  const ticker = symbol.replace(".NS", "").replace(".BO", "");

  // Compute AI Scores
  const metrics: StockMetrics = {
    pe: stock.keyStats.pe,
    pb: stock.keyStats.pb,
    roe: stock.keyStats.roe,
    debtToEquity: stock.keyStats.debtToEquity,
    revenueGrowth: stock.keyStats.revenueGrowth,
    profitMargins: stock.keyStats.profitMargins,
    dividendYield: stock.keyStats.dividendYield,
    freeCashflow: stock.keyStats.freeCashflow,
    beta: stock.keyStats.beta,
    earningsGrowth: stock.keyStats.earningsGrowth,
    marketCap: stock.price.marketCap,
  };
  const fundamentalScore = computeFundamentalScore(metrics);
  const signal = computeInvestmentSignal(metrics, fundamentalScore.total);
  const risk = computeRiskLevel(metrics);
  const sw = computeStrengthsWeaknesses(metrics);
  const aiSummary = computeAISummary(metrics, fundamentalScore.total, signal, risk);
  const sentimentScore = Math.min(100, Math.max(0,
    50 +
    (pos ? 12 : -12) +
    (fundamentalScore.total >= 60 ? 15 : fundamentalScore.total < 40 ? -15 : 0) +
    (stock.analystRating.recommendationKey === "buy" ? 12 : stock.analystRating.recommendationKey === "sell" ? -12 : 0)
  ));

  const chartMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.close)) * 0.995 : 0;
  const chartMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.close)) * 1.005 : 0;
  const chartColor = chartData.length >= 2
    ? chartData[chartData.length - 1].close >= chartData[0].close ? "#10B981" : "#EF4444"
    : "#3B82F6";

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "fundamentals", label: "Fundamentals" },
    { key: "insights", label: "AI Insights" },
    { key: "news", label: "News" },
  ];

  return (
    <div className="page-enter max-w-5xl mx-auto space-y-5">
      {/* Back + Watchlist */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={toggleWatchlist} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${watchlisted ? "text-amber-400" : "text-[var(--text-muted)]"}`}>
          {watchlisted ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
          {watchlisted ? "Watchlisted" : "Add to Watchlist"}
        </button>
      </div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center font-bold text-lg text-blue-500 shrink-0">
              {ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{ticker}</h1>
                <span className={`badge ${getCapBadgeColor(cap)}`}>{cap}</span>
                {stock.profile.sector && <span className="badge badge-blue">{stock.profile.sector}</span>}
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {stock.longName || stock.shortName}
              </p>
              {stock.profile.industry && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{stock.profile.industry}</p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex sm:justify-end items-center gap-2">
              <p className={`text-3xl font-bold transition-all ${priceFlash}`} style={{ color: "var(--text-primary)" }}>
                ₹{stock.price.current?.toFixed(2) ?? "—"}
              </p>
              {/* LIVE indicator */}
              <span
                title={liveConnected ? "Live prices streaming" : "Connecting…"}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold transition-all duration-500"
                style={{
                  backgroundColor: liveConnected ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.1)",
                  color: liveConnected ? "#10B981" : "#64748B",
                }}
              >
                {liveConnected
                  ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: "pulse-dot 1.4s infinite" }} />LIVE</>
                  : <WifiOff size={10} />}
              </span>
            </div>
            <div className={`flex sm:justify-end items-center gap-1 mt-1 font-semibold ${pos ? "text-emerald-500" : "text-red-500"}`}>
              {pos ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(stock.price.change)?.toFixed(2)} ({Math.abs(stock.price.changePercent)?.toFixed(2)}%)
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Prev Close: ₹{stock.price.previousClose?.toFixed(2)}
              {lastUpdated && (
                <span className="ml-2 opacity-60">
                  · {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Market Cap</p>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{formatMarketCap(stock.price.marketCap)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>52W High</p>
            <p className="font-semibold text-sm text-emerald-500">₹{stock.keyStats.fiftyTwoWeekHigh?.toFixed(2) ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>52W Low</p>
            <p className="font-semibold text-sm text-red-500">₹{stock.keyStats.fiftyTwoWeekLow?.toFixed(2) ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Volume</p>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{stock.price.volume?.toLocaleString("en-IN") ?? "—"}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide rounded-2xl p-1" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tab-btn whitespace-nowrap flex-1 ${tab === t.key ? "tab-btn-active" : "tab-btn-inactive"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-5">
              {/* Price Chart */}
              <div className="card">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Price Chart</h2>
                  <div className="flex gap-1">
                    {PERIODS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${period === p.value ? "bg-blue-500 text-white" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {chartLoading ? (
                  <div className="skeleton h-52 rounded-xl" />
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} domain={[chartMin, chartMax]} tickFormatter={v => `₹${v.toFixed(0)}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#chartGrad)" dot={false} activeDot={{ r: 4, fill: chartColor }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                    No chart data available
                  </div>
                )}
              </div>

              {/* Key Stats Grid */}
              <div className="card">
                <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Key Metrics</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <StatCard label="P/E Ratio" value={stock.keyStats.pe?.toFixed(2) ?? "—"} />
                  <StatCard label="P/B Ratio" value={stock.keyStats.pb?.toFixed(2) ?? "—"} />
                  <StatCard label="EPS (TTM)" value={stock.keyStats.eps?.toFixed(2) ?? "—"} />
                  <StatCard label="ROE" value={stock.keyStats.roe != null ? `${((stock.keyStats.roe > 1 ? stock.keyStats.roe : stock.keyStats.roe * 100)).toFixed(1)}%` : "—"} />
                  <StatCard label="Dividend Yield" value={stock.keyStats.dividendYield != null ? `${(stock.keyStats.dividendYield * 100).toFixed(2)}%` : "—"} />
                  <StatCard label="Beta" value={stock.keyStats.beta?.toFixed(2) ?? "—"} sub="Market Volatility" />
                  <StatCard label="Book Value" value={stock.keyStats.bookValue?.toFixed(2) ?? "—"} />
                  <StatCard label="Debt/Equity" value={stock.keyStats.debtToEquity?.toFixed(2) ?? "—"} />
                </div>
              </div>

              {/* Company Description */}
              {stock.profile.description && (
                <div className="card">
                  <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>About</h2>
                  <p className="text-sm leading-relaxed line-clamp-5" style={{ color: "var(--text-secondary)" }}>
                    {stock.profile.description}
                  </p>
                  {stock.profile.website && (
                    <a href={stock.profile.website} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 text-sm mt-2 inline-block hover:underline">
                      {stock.profile.website}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── FUNDAMENTALS TAB ──────────────────────────────────────────── */}
          {tab === "fundamentals" && (
            <div className="space-y-5">
              {/* Score + Breakdown */}
              <div className="card">
                <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Fundamental Score</h2>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ScoreRing score={fundamentalScore.total} />
                  <div className="flex-1 w-full">
                    <BarMeter label="Valuation" value={fundamentalScore.breakdown.valuation} max={25} color="#3B82F6" />
                    <BarMeter label="Profitability" value={fundamentalScore.breakdown.profitability} max={25} color="#10B981" />
                    <BarMeter label="Growth" value={fundamentalScore.breakdown.growth} max={20} color="#8B5CF6" />
                    <BarMeter label="Solvency" value={fundamentalScore.breakdown.solvency} max={20} color="#F59E0B" />
                    <BarMeter label="Shareholding" value={fundamentalScore.breakdown.shareholding} max={10} color="#EC4899" />
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="card">
                <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Financial Metrics</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard label="Revenue Growth" value={stock.keyStats.revenueGrowth != null ? formatPercent(stock.keyStats.revenueGrowth) : "—"} />
                  <StatCard label="Earnings Growth" value={stock.keyStats.earningsGrowth != null ? formatPercent(stock.keyStats.earningsGrowth) : "—"} />
                  <StatCard label="Gross Margin" value={stock.keyStats.grossMargins != null ? formatPercent(stock.keyStats.grossMargins) : "—"} />
                  <StatCard label="Profit Margin" value={stock.keyStats.profitMargins != null ? formatPercent(stock.keyStats.profitMargins) : "—"} />
                  <StatCard label="Operating Margin" value={stock.keyStats.operatingMargins != null ? formatPercent(stock.keyStats.operatingMargins) : "—"} />
                  <StatCard label="Return on Assets" value={stock.keyStats.roa != null ? formatPercent(stock.keyStats.roa) : "—"} />
                  <StatCard label="Free Cash Flow" value={stock.keyStats.freeCashflow != null ? formatCurrency(stock.keyStats.freeCashflow) : "—"} />
                  <StatCard label="Total Cash" value={stock.keyStats.totalCash != null ? formatCurrency(stock.keyStats.totalCash) : "—"} />
                  <StatCard label="Total Debt" value={stock.keyStats.totalDebt != null ? formatCurrency(stock.keyStats.totalDebt) : "—"} />
                </div>
              </div>

              {/* Analyst Ratings */}
              {stock.analystRating.numberOfAnalystOpinions && (
                <div className="card">
                  <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Analyst Consensus</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Rating" value={stock.analystRating.recommendationKey?.toUpperCase() ?? "—"} />
                    <StatCard label="Analysts" value={String(stock.analystRating.numberOfAnalystOpinions)} />
                    <StatCard label="Target (Mean)" value={stock.analystRating.targetMeanPrice ? `₹${stock.analystRating.targetMeanPrice.toFixed(0)}` : "—"} />
                    <StatCard label="Target Range" value={stock.analystRating.targetLowPrice && stock.analystRating.targetHighPrice
                      ? `₹${stock.analystRating.targetLowPrice?.toFixed(0)} – ₹${stock.analystRating.targetHighPrice?.toFixed(0)}`
                      : "—"} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INSIGHTS TAB ──────────────────────────────────────────────── */}
          {tab === "insights" && (
            <div className="space-y-5">
              {/* Investment Signal */}
              <div className="card">
                <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Investment Signal</h2>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center font-bold text-2xl shadow-lg ${
                      signal.signal === "Buy" ? "bg-emerald-500/20 text-emerald-500 ring-2 ring-emerald-500/40"
                      : signal.signal === "Hold" ? "bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/40"
                      : "bg-red-500/20 text-red-500 ring-2 ring-red-500/40"
                    }`}>
                      {signal.signal === "Buy" ? "🟢" : signal.signal === "Hold" ? "🟡" : "🔴"}
                      <span className="text-sm font-bold mt-1">{signal.signal}</span>
                    </div>
                    <span className="badge badge-blue text-xs">{signal.horizon}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Confidence: {signal.confidence}%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Reasoning:</p>
                    <ul className="space-y-2">
                      {signal.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card">
                  <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <TrendingUp size={16} className="text-emerald-500" /> Strengths
                  </h2>
                  {sw.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {sw.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <span className="text-emerald-500 shrink-0 mt-0.5">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Insufficient data</p>}
                </div>
                <div className="card">
                  <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <TrendingDown size={16} className="text-red-500" /> Weaknesses
                  </h2>
                  {sw.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {sw.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <span className="text-red-500 shrink-0 mt-0.5">✗</span> {w}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>No significant weaknesses detected</p>}
                </div>
              </div>

              {/* Risk Meter */}
              <div className="card">
                <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Shield size={16} className="text-blue-500" /> Risk Analysis
                </h2>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold text-sm ${
                      risk.level === "Low" ? "bg-emerald-500/20 text-emerald-500"
                      : risk.level === "Moderate" ? "bg-amber-500/20 text-amber-500"
                      : "bg-red-500/20 text-red-500"
                    }`}>
                      {risk.level === "Low" ? "🛡️" : risk.level === "Moderate" ? "⚠️" : "🔥"}
                      <span className="mt-1">{risk.level}</span>
                      <span className="text-xs opacity-70">Risk</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Risk Score</span>
                        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{risk.score}/100</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-color)" }}>
                        <motion.div
                          className="h-3 rounded-full"
                          style={{ background: `linear-gradient(to right, #10B981, ${risk.level === "High" ? "#EF4444" : risk.level === "Moderate" ? "#F59E0B" : "#10B981"})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.score}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    <div>
                      {risk.factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm py-1" style={{ color: "var(--text-secondary)" }}>
                          <Info size={12} className="shrink-0" style={{ color: "var(--text-muted)" }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment */}
              <div className="card">
                <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Market Sentiment</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <SentimentGauge score={sentimentScore} />
                  <div className="flex-1 text-sm space-y-2" style={{ color: "var(--text-secondary)" }}>
                    <p>Sentiment is derived from price action, fundamental strength, and analyst consensus data.</p>
                    {stock.analystRating.recommendationKey && (
                      <p>Analyst consensus: <span className="font-semibold text-blue-500">{stock.analystRating.recommendationKey.toUpperCase()}</span></p>
                    )}
                    {stock.analystRating.targetMeanPrice && (
                      <p>Analyst price target: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>₹{stock.analystRating.targetMeanPrice.toFixed(0)}</span> (current: ₹{stock.price.current?.toFixed(0)})</p>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="card bg-gradient-to-br from-blue-500/10 to-purple-500/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-lg">✨</span>
                  </div>
                  <div>
                    <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>AI Stock Summary</h2>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{aiSummary}</p>
                  </div>
                </div>
              </div>

              {/* Future Outlook */}
              <div className="card">
                <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Future Outlook</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Growth Potential", value: fundamentalScore.total >= 65 ? "High" : fundamentalScore.total >= 45 ? "Moderate" : "Low", color: fundamentalScore.total >= 65 ? "text-emerald-500" : fundamentalScore.total >= 45 ? "text-amber-500" : "text-red-500" },
                    { label: "Sector Outlook", value: "Neutral to Positive", color: "text-blue-500" },
                    { label: "Risk Level", value: risk.level, color: risk.level === "Low" ? "text-emerald-500" : risk.level === "Moderate" ? "text-amber-500" : "text-red-500" },
                  ].map(item => (
                    <div key={item.label} className="stat-card text-center">
                      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                      <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  ⚠️ Future outlook is algorithmic and for informational purposes only. Not financial advice.
                  Please consult a SEBI-registered financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          )}

          {/* ── NEWS TAB ──────────────────────────────────────────────────── */}
          {tab === "news" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Latest News</h2>
                <div className="flex gap-2">
                  <span className="badge badge-green">🟢 Positive</span>
                  <span className="badge badge-red">🔴 Negative</span>
                  <span className="badge" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}>⚪ Neutral</span>
                </div>
              </div>
              {MOCK_NEWS.map((news, i) => (
                <motion.a
                  key={i}
                  href={news.url}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ x: 3 }}
                  className="card flex items-start gap-3 no-underline block"
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    news.sentiment === "positive" ? "bg-emerald-500"
                    : news.sentiment === "negative" ? "bg-red-500"
                    : "bg-gray-400"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{news.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{news.source}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{news.time}</span>
                      <span className={`badge text-xs ${
                        news.sentiment === "positive" ? "badge-green"
                        : news.sentiment === "negative" ? "badge-red"
                        : ""
                      }`} style={news.sentiment === "neutral" ? { backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" } : {}}>
                        {news.sentiment}
                      </span>
                    </div>
                  </div>
                </motion.a>
              ))}
              <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
                News shown is for demonstration. Live news integration requires a GNews API key.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StockDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="skeleton h-8 w-24 rounded-lg" />
      <div className="skeleton h-40 rounded-2xl" />
      <div className="skeleton h-12 rounded-2xl" />
      <div className="skeleton h-72 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
    </div>
  );
}
