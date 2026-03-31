"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseLivePriceOptions {
  eventName?: string; // default: "message" - the SSE event name to listen to
}

interface UseLivePriceReturn {
  connected: boolean;
  lastUpdated: Date | null;
}

/**
 * Subscribe to a Server-Sent Events URL and call onUpdate with parsed data
 * on each event. Reconnects automatically via EventSource.
 */
export function useLivePrice<T = unknown>(
  url: string,
  onUpdate: (data: T) => void,
  options: UseLivePriceOptions = {}
): UseLivePriceReturn {
  const { eventName = "message" } = options;
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref fresh without re-subscribing
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener(eventName, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as T;
        onUpdateRef.current(data);
        setLastUpdated(new Date());
        setConnected(true);
      } catch {
        // malformed event – ignore
      }
    });

    es.onopen = () => setConnected(true);

    es.onerror = () => {
      setConnected(false);
      // EventSource will auto-reconnect; just reflect the state
    };

    return es;
  }, [url, eventName]);

  useEffect(() => {
    const es = connect();
    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [connect]);

  return { connected, lastUpdated };
}
