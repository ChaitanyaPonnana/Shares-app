"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, TrendingUp, Plus } from "lucide-react";
import { isPositive } from "@/lib/utils";

interface WatchedStock {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  name?: string;
  marketCap?: number;
}

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [stocks, setStocks] = useState<WatchedStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wl: string[] = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setSymbols(wl);
    if (wl.length === 0) { setLoading(false); return; }

    Promise.all(
      wl.map(sym =>
        fetch(`/api/stock/${encodeURIComponent(sym)}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const data = results.map((r, i) => r ? {
        symbol: wl[i],
        name: r.shortName || r.longName,
        price: r.price?.current,
        change: r.price?.change,
        changePercent: r.price?.changePercent,
        marketCap: r.price?.marketCap,
      } : { symbol: wl[i] });
      setStocks(data);
      setLoading(false);
    });
  }, []);

  function removeFromWatchlist(sym: string) {
    const wl: string[] = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const updated = wl.filter(s => s !== sym);
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setSymbols(updated);
    setStocks(prev => prev.filter(s => s.symbol !== sym));
  }

  return (
    <div className="page-enter max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
          <Star size={18} className="text-amber-400" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Watchlist</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Track your favorite Indian stocks</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : symbols.length === 0 ? (
        <div className="card text-center py-16">
          <Star size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Your watchlist is empty</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Search for stocks and add them to track here</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Browse Stocks
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{symbols.length} stock{symbols.length > 1 ? "s" : ""} tracked</p>
          <AnimatePresence>
            {stocks.map((stock, i) => {
              const ticker = stock.symbol.replace(".NS", "").replace(".BO", "");
              const pos = isPositive(stock.changePercent);
              return (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.07 }}
                  className="card flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center font-bold text-blue-500 shrink-0">
                    {ticker.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/stock/${encodeURIComponent(stock.symbol)}`}>
                      <p className="font-bold text-sm hover:text-blue-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                        {ticker}
                      </p>
                    </Link>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {stock.name?.replace(" Ltd", "").replace(" Limited", "") ?? stock.symbol}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {stock.price ? (
                      <>
                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>₹{stock.price.toFixed(2)}</p>
                        <p className={`text-xs font-medium ${pos ? "text-emerald-500" : "text-red-500"}`}>
                          {pos ? "+" : ""}{stock.changePercent?.toFixed(2) ?? "—"}%
                        </p>
                      </>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading…</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Link href={`/stock/${encodeURIComponent(stock.symbol)}`}>
                      <motion.button whileHover={{ scale: 1.05 }} className="p-2 rounded-xl text-blue-500 hover:bg-blue-500/10 transition-colors">
                        <TrendingUp size={15} />
                      </motion.button>
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => removeFromWatchlist(stock.symbol)}
                      className="p-2 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
