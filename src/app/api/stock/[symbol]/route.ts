export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

interface RouteParams {
  params: { symbol: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeQuoteSummary(symbol: string, modules: string[]): Promise<any> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (yahooFinance as any).quoteSummary(symbol, { modules }, { validateResult: false });
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: RouteParams) {
  const { symbol } = params;

  // Normalize symbol: if no suffix, try .NS
  const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.NS`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteData: any = await yahooFinance.quote(yahooSymbol).catch(() => null);
    if (!quoteData || !quoteData.regularMarketPrice) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const [sdRes, dksRes, fdRes, apRes] = await Promise.all([
      safeQuoteSummary(yahooSymbol, ["summaryDetail"]),
      safeQuoteSummary(yahooSymbol, ["defaultKeyStatistics"]),
      safeQuoteSummary(yahooSymbol, ["financialData"]),
      safeQuoteSummary(yahooSymbol, ["assetProfile"]),
    ]);

    const sd = sdRes?.summaryDetail ?? null;
    const dks = dksRes?.defaultKeyStatistics ?? null;
    const fd = fdRes?.financialData ?? null;
    const ap = apRes?.assetProfile ?? null;

    const response = {
      symbol: yahooSymbol,
      shortName: quoteData.shortName || quoteData.longName || symbol,
      longName: quoteData.longName || quoteData.shortName || symbol,
      price: {
        current: quoteData.regularMarketPrice,
        previousClose: quoteData.regularMarketPreviousClose,
        open: quoteData.regularMarketOpen,
        dayHigh: quoteData.regularMarketDayHigh,
        dayLow: quoteData.regularMarketDayLow,
        change: quoteData.regularMarketChange,
        changePercent: quoteData.regularMarketChangePercent,
        volume: quoteData.regularMarketVolume,
        avgVolume: quoteData.averageDailyVolume3Month,
        marketCap: quoteData.marketCap,
        currency: quoteData.currency || "INR",
      },
      keyStats: {
        pe: quoteData.trailingPE ?? sd?.trailingPE,
        forwardPE: quoteData.forwardPE,
        pb: dks?.priceToBook,
        eps: quoteData.epsTrailingTwelveMonths,
        dividendYield: sd?.dividendYield ?? quoteData.dividendYield,
        fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh ?? sd?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow ?? sd?.fiftyTwoWeekLow,
        beta: sd?.beta ?? quoteData.beta,
        bookValue: dks?.bookValue,
        roe: fd?.returnOnEquity,
        roa: fd?.returnOnAssets,
        debtToEquity: fd?.debtToEquity,
        revenueGrowth: fd?.revenueGrowth,
        earningsGrowth: fd?.earningsGrowth,
        grossMargins: fd?.grossMargins,
        profitMargins: fd?.profitMargins,
        operatingMargins: fd?.operatingMargins,
        freeCashflow: fd?.freeCashflow,
        totalCash: fd?.totalCash,
        totalDebt: fd?.totalDebt,
      },
      profile: {
        sector: ap?.sector,
        industry: ap?.industry,
        website: ap?.website,
        description: ap?.longBusinessSummary,
        fullTimeEmployees: ap?.fullTimeEmployees,
        country: ap?.country,
        city: ap?.city,
        state: ap?.state,
      },
      analystRating: {
        recommendationKey: fd?.recommendationKey,
        recommendationMean: fd?.recommendationMean,
        numberOfAnalystOpinions: fd?.numberOfAnalystOpinions,
        targetHighPrice: fd?.targetHighPrice,
        targetLowPrice: fd?.targetLowPrice,
        targetMeanPrice: fd?.targetMeanPrice,
      },
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Stock API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data. Check the symbol and try again." },
      { status: 500 }
    );
  }
}
