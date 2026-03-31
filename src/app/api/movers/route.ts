export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { POPULAR_STOCKS } from "@/lib/stocks-list";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeQuote(symbol: string): Promise<any | null> {
  try {
    return await yahooFinance.quote(symbol);
  } catch {
    return null;
  }
}

export async function GET() {
  // Pick 20 popular stocks and return their quotes
  const symbols = POPULAR_STOCKS.slice(0, 20).map((s) => s.symbol);
  try {
    const quotes = await Promise.all(symbols.map(safeQuote));

    const stocks = quotes
      .map((q, i) => {
        if (!q || !q.regularMarketPrice) return null;
        return {
          symbol: symbols[i],
          name: q.shortName || q.longName || symbols[i],
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
          marketCap: q.marketCap,
          volume: q.regularMarketVolume,
        };
      })
      .filter(Boolean);

    const gainers = [...stocks]
      .sort((a, b) => (b!.changePercent ?? 0) - (a!.changePercent ?? 0))
      .slice(0, 5);
    const losers = [...stocks]
      .sort((a, b) => (a!.changePercent ?? 0) - (b!.changePercent ?? 0))
      .slice(0, 5);
    const trending = [...stocks]
      .sort((a, b) => (b!.volume ?? 0) - (a!.volume ?? 0))
      .slice(0, 5);

    return NextResponse.json(
      { gainers, losers, trending, all: stocks },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Movers API error:", error);
    return NextResponse.json({ error: "Failed to fetch movers" }, { status: 500 });
  }
}
