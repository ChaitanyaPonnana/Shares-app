import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50", label: "nifty50" },
  { symbol: "^BSESN", name: "SENSEX", label: "sensex" },
  { symbol: "^NSEBANK", name: "BANK NIFTY", label: "banknifty" },
  { symbol: "NIFTYMIDCAP150.NS", name: "NIFTY MIDCAP 150", label: "midcap" },
];

const POLL_INTERVAL_MS = 10_000; // 10 seconds
const HEARTBEAT_INTERVAL_MS = 5_000;

async function fetchIndices() {
  const results = await Promise.allSettled(
    INDICES.map((idx) => yahooFinance.quote(idx.symbol))
  );
  return INDICES.map((idx, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      const q = result.value;
      return {
        ...idx,
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChange ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
        dayHigh: q.regularMarketDayHigh ?? null,
        dayLow: q.regularMarketDayLow ?? null,
      };
    }
    return { ...idx, price: null, change: null, changePercent: null };
  });
}

export async function GET() {
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

      // Send initial data immediately
      try {
        const indices = await fetchIndices();
        send("indices", { indices });
      } catch (e) {
        send("error", { message: "Failed to fetch initial data" });
      }

      // Heartbeat to keep connection alive
      heartbeatTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Poll and push updates
      pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const indices = await fetchIndices();
          send("indices", { indices });
        } catch {
          // silently skip failed fetches
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
