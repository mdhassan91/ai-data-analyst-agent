import { NextResponse } from "next/server";

// The browser talks only to this route; the route talks to the FastAPI backend.
// An https page can't call an http backend directly (mixed content), and the
// API key stays on the server instead of being shipped to every visitor.
export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL ?? "";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY ?? "";

export async function POST(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json({ error: "BACKEND_URL is not configured." }, { status: 500 });
  }
  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(BACKEND_API_KEY ? { "X-API-Key": BACKEND_API_KEY } : {}),
      },
      body: await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "The agent backend could not be reached." }, { status: 502 });
  }
}
