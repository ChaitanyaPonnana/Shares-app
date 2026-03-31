import { NextResponse } from "next/server";
import { searchStocks } from "@/lib/stocks-list";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }
  const results = searchStocks(query);
  return NextResponse.json({ results });
}
