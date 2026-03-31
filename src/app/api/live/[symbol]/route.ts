import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const POLL_INTERVAL_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 5_000;

interface RouteParams {
  params: { symbol: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchQuote(symbol: string): Promise<any | null> {
  try {
    return await yahooFinance.quote(symbol);
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: RouteParams) {
  const rawSymbol = decodeURIComponent(params.symbol);
  const symbol = rawSymbol.includes(".") ? rawSymbol : `${rawSymbol}.NS`;

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // controller already closed
        }
      }

      // Initial fetch
      try {
        const q = await fetchQuote(symbol);
        if (q && q.regularMarketPrice) {
          send("price", {
            price: q.regularMarketPrice,
            change: q.regularMarketChange,
            changePercent: q.regularMarketChangePercent,
            volume: q.regularMarketVolume,
            dayHigh: q.regularMarketDayHigh,
            dayLow: q.regularMarketDayLow,
            open: q.regularMarketOpen,
            previousClose: q.regularMarketPreviousClose,
            marketCap: q.marketCap,
          });
        }
      } catch {
        send("error", { message: "Symbol not found" });
      }

      // Heartbeat
      heartbeatTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Poll
      pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const q = await fetchQuote(symbol);
          if (q && q.regularMarketPrice) {
            send("price", {
              price: q.regularMarketPrice,
              change: q.regularMarketChange,
              changePercent: q.regularMarketChangePercent,
              volume: q.regularMarketVolume,
              dayHigh: q.regularMarketDayHigh,
              dayLow: q.regularMarketDayLow,
              open: q.regularMarketOpen,
              previousClose: q.regularMarketPreviousClose,
              marketCap: q.marketCap,
            });
          }
        } catch {
          // silently skip
        }
      }, POLL_INTERVAL_MS);
    },

    cancel() {
      closed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
