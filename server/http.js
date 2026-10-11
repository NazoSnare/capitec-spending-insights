/**
 * The one place a request becomes a response.
 *
 * Every route handler is `respond(() => getSomething(...))`, so status codes, the error
 * shape and caching are decided here once and cannot differ between endpoints.
 */
import { ApiError } from "./spending.js";

/**
 * "Now" for the mock API. MOCK_NOW pins it (the end-to-end tests use this so their
 * assertions do not change with the calendar); otherwise it is the real time.
 */
export const now = () => (process.env.MOCK_NOW ? new Date(process.env.MOCK_NOW) : new Date());

/** Optional artificial latency, so loading states can be seen and tested. */
const latency = () => Number(process.env.MOCK_LATENCY_MS) || 0;

/** Query parameters as a plain object. */
export const query = (request) => Object.fromEntries(new URL(request.url).searchParams.entries());

/** @param {() => object} produce */
export async function respond(produce) {
  if (latency()) await new Promise((r) => setTimeout(r, latency()));
  try {
    return Response.json(produce(), {
      // Account data is personal and changes with every purchase: never cache it in a
      // shared cache, and never serve a stale copy.
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return Response.json({ error: { code: e.code, message: e.message, ...(e.details ? { details: e.details } : {}) } }, { status: e.status });
    }
    // Never leak a stack trace to the client; log it for whoever runs the service.
    console.error(e);
    return Response.json({ error: { code: "INTERNAL", message: "Something went wrong on our side. Please try again." } }, { status: 500 });
  }
}
