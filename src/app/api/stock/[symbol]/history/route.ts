import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

interface RouteParams {
  params: { symbol: string };
}

type Period = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";

function getYahooInterval(period: Period): string {
  const intervals: Record<Period, string> = {
    "1d": "5m",
    "5d": "15m",
    "1mo": "1d",
    "6mo": "1d",
    "1y": "1wk",
    "5y": "1mo",
  };
  return intervals[period] || "1d";
}

function getDateRange(period: Period): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (period === "1d") from.setDate(from.getDate() - 1);
  else if (period === "5d") from.setDate(from.getDate() - 5);
  else if (period === "1mo") from.setMonth(from.getMonth() - 1);
  else if (period === "6mo") from.setMonth(from.getMonth() - 6);
  else if (period === "1y") from.setFullYear(from.getFullYear() - 1);
  else if (period === "5y") from.setFullYear(from.getFullYear() - 5);
  return { from, to };
}

export async function GET(req: Request, { params }: RouteParams) {
  const { symbol } = params;
  const url = new URL(req.url);
  const period = (url.searchParams.get("period") || "1mo") as Period;

  const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.NS`;
  const interval = getYahooInterval(period);
  const { from, to } = getDateRange(period);

  try {
    const result = await yahooFinance.chart(yahooSymbol, {
      period1: from,
      period2: to,
      interval: interval as "1d" | "1wk" | "1mo" | "5m" | "15m",
    });

    const quotes = result.quotes || [];
    const data = quotes
      .filter((q) => q.close != null)
      .map((q) => ({
        date: q.date instanceof Date ? q.date.toISOString() : q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }));

    return NextResponse.json(
      { symbol: yahooSymbol, period, interval, data },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
