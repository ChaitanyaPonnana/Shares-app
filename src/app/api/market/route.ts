export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50", label: "nifty50" },
  { symbol: "^BSESN", name: "SENSEX", label: "sensex" },
  { symbol: "^NSEBANK", name: "BANK NIFTY", label: "banknifty" },
  { symbol: "NIFTYMIDCAP150.NS", name: "NIFTY MIDCAP 150", label: "midcap" },
];

export async function GET() {
  try {
    const results = await Promise.allSettled(
      INDICES.map((idx) => yahooFinance.quote(idx.symbol))
    );

    const indices = INDICES.map((idx, i) => {
      const result = results[i];
      if (result.status === "fulfilled") {
        const q = result.value;
        return {
          ...idx,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
          previousClose: q.regularMarketPreviousClose,
          dayHigh: q.regularMarketDayHigh,
          dayLow: q.regularMarketDayLow,
        };
      }
      return { ...idx, price: null, change: null, changePercent: null };
    });

    return NextResponse.json({ indices }, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
