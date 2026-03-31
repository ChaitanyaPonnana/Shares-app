"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { searchStocks } from "@/lib/stocks-list";
import {
  TrendingUp, Search, Star, BarChart2, Sun, Moon, X, ChevronRight
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReturnType<typeof searchStocks>>([]);
  const [open, setOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 1) {
      const r = searchStocks(query);
      setResults(r);
      setOpen(r.length > 0);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(symbol: string) {
    setQuery("");
    setOpen(false);
    setShowMobileSearch(false);
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0].symbol);
    }
  }

  const navLinks = [
    { href: "/", label: "Dashboard", icon: <BarChart2 size={16} /> },
    { href: "/top-stocks", label: "Top Stocks", icon: <TrendingUp size={16} /> },
    { href: "/watchlist", label: "Watchlist", icon: <Star size={16} /> },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav
        style={{
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
        }}
        className="sticky top-0 z-50 w-full"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:block" style={{ color: "var(--text-primary)" }}>
                Stockwise<span className="text-blue-500">IN</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1 ml-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-blue-500/15 text-blue-500"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Search — Desktop */}
            <div className="flex-1 max-w-md mx-auto hidden sm:block relative" ref={dropdownRef}>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => results.length > 0 && setOpen(true)}
                  placeholder="Search RELIANCE, TCS, HDFC..."
                  className="input-field pl-9 pr-4 text-sm h-10"
                />
                {query && (
                  <button
                    onClick={() => { setQuery(""); setOpen(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Dropdown */}
              {open && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-50"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}
                >
                  {results.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock.symbol)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {stock.nseSymbol || stock.symbol}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {stock.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-blue text-xs">{stock.exchange}</span>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Mobile search toggle */}
              <button
                onClick={() => setShowMobileSearch(true)}
                className="sm:hidden p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <Search size={18} />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-all duration-200"
                style={{ color: "var(--text-secondary)" }}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Links */}
      <div
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
        className="md:hidden flex items-center px-4 gap-1 py-2"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive(link.href) ? "bg-blue-500/15 text-blue-500" : "text-[var(--text-secondary)]"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div
          className="fixed inset-0 z-50 p-4 flex flex-col gap-4"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-1" ref={dropdownRef}>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stocks..."
                className="input-field pl-9 pr-4 text-sm h-11"
              />
            </div>
            <button
              onClick={() => { setShowMobileSearch(false); setQuery(""); setOpen(false); }}
              className="p-2 rounded-xl hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>
          </div>
          {open && results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock.symbol)}
              className="flex items-center justify-between p-4 rounded-2xl card text-left"
            >
              <div>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {stock.nseSymbol}
                </div>
                <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {stock.name}
                </div>
              </div>
              <span className="badge badge-blue">{stock.sector}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
