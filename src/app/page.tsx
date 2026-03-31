"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, Star, ChevronRight, Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { isPositive, getCapCategory } from "@/lib/utils";


interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
}

interface IndexData {
  symbol: string;
  name: string;
  label: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
}

// ── Index card with flash animation ──────────────────────────────────────────
function IndexCard({ idx }: { idx: IndexData }) {
  const pos = isPositive(idx.changePercent);
  const [flashClass, setFlashClass] = useState("");
  const prevPrice = useRef<number | null>(null);

  useEffect(() => {
    if (idx.price == null) return;
    if (prevPrice.current !== null && prevPrice.current !== idx.price) {
      const cls = idx.price > prevPrice.current ? "flash-green" : "flash-red";
      setFlashClass(cls);
      const t = setTimeout(() => setFlashClass(""), 700);
      prevPrice.current = idx.price;
      return () => clearTimeout(t);
    }
    prevPrice.current = idx.price;
  }, [idx.price]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card p-4 flex-1 min-w-[160px]"
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
        {idx.name}
      </p>
      <p className={`text-xl font-bold ${flashClass}`} style={{ color: "var(--text-primary)" }}>
        {idx.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "—"}
      </p>
      <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${pos ? "text-emerald-500" : "text-red-500"}`}>
        {pos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {idx.changePercent != null ? `${pos ? "+" : ""}${idx.changePercent.toFixed(2)}%` : "—"}
      </div>
      {idx.dayHigh && idx.dayLow && (
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          H: {idx.dayHigh.toLocaleString("en-IN")} · L: {idx.dayLow.toLocaleString("en-IN")}
        </p>
      )}
    </motion.div>
  );
}

function StockRow({ stock }: { stock: StockQuote }) {
  const ticker = stock.symbol.replace(".NS", "").replace(".BO", "");
  const pos = isPositive(stock.changePercent);
  const cap = getCapCategory(stock.marketCap);

  return (
    <Link href={`/stock/${encodeURIComponent(stock.symbol)}`}>
      <motion.div
        whileHover={{ x: 3, backgroundColor: "var(--bg-hover)" }}
        className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}
        >
          {ticker.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
            {ticker}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {stock.name?.replace(" Ltd", "").replace(" Limited", "")}
          </p>
        </div>
        {cap !== "—" && (
          <span className={`badge text-xs hidden sm:inline-flex ${cap === "Large Cap" ? "badge-blue" : cap === "Mid Cap" ? "badge-purple" : "badge-amber"}`}>
            {cap.split(" ")[0]}
          </span>
        )}
        <div className="text-right shrink-0">
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            ₹{stock.price?.toFixed(2) ?? "—"}
          </p>
          <p className={`text-xs font-medium ${pos ? "text-emerald-500" : "text-red-500"}`}>
            {pos ? "+" : ""}{stock.changePercent?.toFixed(2) ?? "—"}%
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

const POPULAR_SEARCHES = [
  { symbol: "RELIANCE.NS", label: "Reliance" },
  { symbol: "TCS.NS", label: "TCS" },
  { symbol: "HDFCBANK.NS", label: "HDFC Bank" },
  { symbol: "INFY.NS", label: "Infosys" },
  { symbol: "ZOMATO.NS", label: "Zomato" },
  { symbol: "TATAMOTORS.NS", label: "Tata Motors" },
];

const REFRESH_INTERVAL = 30_000;

export default function HomePage() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [gainers, setGainers] = useState<StockQuote[]>([]);
  const [losers, setLosers] = useState<StockQuote[]>([]);
  const [trending, setTrending] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gainers" | "losers" | "trending">("gainers");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const moversIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Full REST fetch (includes movers) ────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [marketRes, moversRes] = await Promise.all([
        fetch("/api/market", { cache: "no-store" }),
        fetch("/api/movers", { cache: "no-store" }),
      ]);
      const marketData = await marketRes.json();
      const moversData = await moversRes.json();
      if (marketData.indices) setIndices(marketData.indices);
      if (moversData.gainers) setGainers(moversData.gainers);
      if (moversData.losers) setLosers(moversData.losers);
      if (moversData.trending) setTrending(moversData.trending);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── SSE for live index ticks + movers polling ────────────────────────────────
  useEffect(() => {
    fetchData(false); // initial load

    // SSE: live index updates every ~10s from server
    const es = new EventSource("/api/live");
    esRef.current = es;

    es.onopen = () => setLiveConnected(true);
    es.onerror = () => setLiveConnected(false);

    es.addEventListener("indices", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.indices) {
          setIndices(data.indices);
          setLastUpdated(new Date());
          setLiveConnected(true);
        }
      } catch { /* ignore */ }
    });

    // Movers refresh every 30s (they change less frequently)
    moversIntervalRef.current = setInterval(() => fetchData(true), REFRESH_INTERVAL);

    return () => {
      es.close();
      esRef.current = null;
      setLiveConnected(false);
      if (moversIntervalRef.current) clearInterval(moversIntervalRef.current);
    };
  }, [fetchData]);

  const tabData = activeTab === "gainers" ? gainers : activeTab === "losers" ? losers : trending;

  return (
    <div className="page-enter space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8 px-4"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Indian Stock <span className="gradient-text">Intelligence</span>
        </h1>
        <p className="text-base max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
          Research, analyze &amp; understand NSE &amp; BSE stocks — powered by real-time data and AI insights.
        </p>

        {/* Quick search pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {POPULAR_SEARCHES.map((s) => (
            <Link key={s.symbol} href={`/stock/${encodeURIComponent(s.symbol)}`}>
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="badge badge-blue cursor-pointer text-sm py-1.5 px-3"
              >
                {s.label}
              </motion.span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Market Indices */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Market Overview
            </h2>
            {/* LIVE badge */}
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors duration-500"
              style={{
                backgroundColor: liveConnected ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                color: liveConnected ? "#10B981" : "#64748B",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: liveConnected ? "#10B981" : "#64748B",
                  animation: liveConnected ? "pulse-dot 1.4s infinite" : "none",
                }}
              />
              {liveConnected ? "LIVE" : "CONNECTING…"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              style={{ color: "var(--text-muted)" }}
              title="Refresh now"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 flex-1 min-w-[160px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {indices.map((idx) => <IndexCard key={idx.label} idx={idx} />)}
          </div>
        )}
      </section>

      {/* Movers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
            {(["gainers", "losers", "trending"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-blue-500 text-white rounded-xl"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {tab === "gainers" ? "🔥 Top Gainers" : tab === "losers" ? "📉 Top Losers" : "⚡ Trending"}
              </button>
            ))}
          </div>
          <Link
            href="/top-stocks"
            className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="card">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : tabData.length > 0 ? (
            <div>
              {tabData.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <StockRow stock={stock} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
              No data available
            </p>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/top-stocks",
            icon: <TrendingUp size={20} className="text-blue-500" />,
            title: "Top Stocks",
            desc: "Gainers, losers, undervalued picks",
            bg: "from-blue-500/10 to-blue-600/5",
          },
          {
            href: "/watchlist",
            icon: <Star size={20} className="text-amber-500" />,
            title: "My Watchlist",
            desc: "Track your favorite stocks",
            bg: "from-amber-500/10 to-amber-600/5",
          },
          {
            href: `/stock/RELIANCE.NS`,
            icon: <Zap size={20} className="text-purple-500" />,
            title: "Analyze a Stock",
            desc: "Deep dive: fundamentals, news, AI",
            bg: "from-purple-500/10 to-purple-600/5",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              className={`card bg-gradient-to-br ${item.bg} cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </section>
    </div>
  );
}
