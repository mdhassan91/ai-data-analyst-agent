import type { ApiRequest, ApiResponse } from "@/types";

// Default: the app's own /api/chat route, which forwards to the backend server-side.
// Setting NEXT_PUBLIC_N8N_WEBHOOK_URL calls a backend directly instead (e.g. the
// n8n prototype on localhost) - then the token is sent from the browser.
const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "/api/chat";
const AUTH_HEADER_NAME = process.env.NEXT_PUBLIC_N8N_AUTH_HEADER_NAME ?? "X-API-Key";
const AUTH_TOKEN = process.env.NEXT_PUBLIC_N8N_AUTH_TOKEN ?? "";

const REQUEST_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiTimeoutError extends ApiError {
  constructor() {
    super("The request took too long to respond.");
    this.name = "ApiTimeoutError";
  }
}

export async function sendMessage(payload: ApiRequest): Promise<ApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AUTH_TOKEN ? { [AUTH_HEADER_NAME]: AUTH_TOKEN } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new ApiError(`Request failed with status ${res.status}.`);
    }

    const json = (await res.json()) as ApiResponse;
    return json;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiTimeoutError();
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError("Network error while contacting the agent.", err);
  } finally {
    clearTimeout(timeoutId);
  }
}
