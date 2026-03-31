"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, Star, Shield, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { isPositive, getCapCategory, getCapBadgeColor } from "@/lib/utils";
import { POPULAR_STOCKS } from "@/lib/stocks-list";

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
}

type ActiveTab = "gainers" | "losers" | "trending" | "longterm" | "undervalued";

const SECTIONS: { key: ActiveTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "gainers", label: "🔥 Top Gainers", icon: <TrendingUp size={16} className="text-emerald-500" />, desc: "Stocks with best % gains today" },
  { key: "losers", label: "📉 Top Losers", icon: <TrendingDown size={16} className="text-red-500" />, desc: "Stocks with largest % decline today" },
  { key: "trending", label: "⚡ Trending", icon: <Zap size={16} className="text-amber-500" />, desc: "Highest trading volume today" },
  { key: "longterm", label: "🌟 Long Term Picks", icon: <Star size={16} className="text-blue-500" />, desc: "Large-cap stable compounders" },
  { key: "undervalued", label: "🛡️ Value Picks", icon: <Shield size={16} className="text-purple-500" />, desc: "Potentially undervalued stocks" },
];

function StockCard({ stock, rank }: { stock: StockQuote; rank: number }) {
  const ticker = stock.symbol.replace(".NS", "").replace(".BO", "");
  const pos = isPositive(stock.changePercent);
  const cap = getCapCategory(stock.marketCap);

  return (
    <Link href={`/stock/${encodeURIComponent(stock.symbol)}`}>
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.06 }}
        className="card flex items-center gap-3 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}>
          {rank}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center font-bold text-sm text-blue-500 shrink-0">
          {ticker.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{ticker}</p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {stock.name?.replace(" Ltd", "").replace(" Limited", "")}
          </p>
        </div>
        <span className={`badge hidden sm:inline-flex ${getCapBadgeColor(cap)}`}>{cap.split(" ")[0]}</span>
        <div className="text-right shrink-0">
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>₹{stock.price?.toFixed(2) ?? "—"}</p>
          <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${pos ? "text-emerald-500" : "text-red-500"}`}>
            {pos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(stock.changePercent)?.toFixed(2) ?? "—"}%
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Curated long-term / value picks from the static list
const LONGTERM_SYMBOLS = ["TCS.NS", "INFY.NS", "HDFCBANK.NS", "RELIANCE.NS", "ICICIBANK.NS", "HINDUNILVR.NS", "TITAN.NS", "ASIANPAINT.NS"];
const UNDERVALUED_SYMBOLS = ["SBIN.NS", "NTPC.NS", "ONGC.NS", "COALINDIA.NS", "BPCL.NS", "BANKBARODA.NS", "POWERGRID.NS", "TATASTEEL.NS"];

export default function TopStocksPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("gainers");
  const [moversData, setMoversData] = useState<{ gainers: StockQuote[]; losers: StockQuote[]; trending: StockQuote[] } | null>(null);
  const [staticData, setStaticData] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [staticLoading, setStaticLoading] = useState(false);

  useEffect(() => {
    fetch("/api/movers")
      .then(r => r.json())
      .then(data => { setMoversData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "longterm" && activeTab !== "undervalued") return;
    const syms = activeTab === "longterm" ? LONGTERM_SYMBOLS : UNDERVALUED_SYMBOLS;
    setStaticLoading(true);
    setStaticData([]);
    Promise.all(
      syms.map(sym =>
        fetch(`/api/stock/${encodeURIComponent(sym)}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const data = results
        .filter(Boolean)
        .map(r => ({
          symbol: r.symbol,
          name: r.shortName || r.longName || r.symbol,
          price: r.price?.current,
          change: r.price?.change,
          changePercent: r.price?.changePercent,
          marketCap: r.price?.marketCap,
          volume: r.price?.volume,
        }));
      setStaticData(data);
      setStaticLoading(false);
    });
  }, [activeTab]);

  const displayData: StockQuote[] = (() => {
    if (activeTab === "gainers") return moversData?.gainers ?? [];
    if (activeTab === "losers") return moversData?.losers ?? [];
    if (activeTab === "trending") return moversData?.trending ?? [];
    return staticData;
  })();

  const isStaticTab = activeTab === "longterm" || activeTab === "undervalued";
  const isDataLoading = loading || (isStaticTab && staticLoading);

  const currentSection = SECTIONS.find(s => s.key === activeTab);

  return (
    <div className="page-enter max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Top Stocks</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Discover top performing and curated Indian stocks</p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {SECTIONS.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActiveTab(sec.key)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === sec.key ? "bg-blue-500 text-white" : "text-[var(--text-secondary)]"
            }`}
            style={activeTab !== sec.key ? { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" } : {}}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section description */}
      {currentSection && (
        <p className="text-sm -mt-2" style={{ color: "var(--text-muted)" }}>{currentSection.desc}</p>
      )}

      {/* Stock List */}
      <div className="space-y-3">
        {isDataLoading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
        ) : displayData.length > 0 ? (
          displayData.map((stock, i) => <StockCard key={stock.symbol} stock={stock} rank={i + 1} />)
        ) : (
          <div className="card text-center py-12">
            <p style={{ color: "var(--text-muted)" }}>No data available. Try again in a moment.</p>
          </div>
        )}
      </div>

      {(activeTab === "longterm" || activeTab === "undervalued") && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          ⚠️ Curated lists are for educational reference. Not financial advice.
        </p>
      )}
    </div>
  );
}
