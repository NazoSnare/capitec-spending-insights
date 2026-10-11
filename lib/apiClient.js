/**
 * The HTTP client: one function, so every request is built, sent and checked the same
 * way.
 *
 * A failed response becomes an ApiRequestError carrying the status and the API's own
 * error body, so a screen can show "limit must be a whole number from 1 to 100" rather
 * than "Request failed".
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export class ApiRequestError extends Error {
  constructor(status, data, message) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Drop empty values so the URL only carries what was actually chosen. */
export const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/** @param {string} path @param {object} [params] @param {AbortSignal} [signal] */
export async function apiGet(path, params, signal) {
  const qs = new URLSearchParams(clean(params)).toString();
  let res;
  try {
    res = await fetch(`${API_BASE}/${path}${qs ? `?${qs}` : ""}`, { signal, headers: { Accept: "application/json" } });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ApiRequestError("FETCH_ERROR", null, "Network request failed");
  }
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) throw new ApiRequestError(res.status, body, body?.error?.message || `Request failed (${res.status})`);
  if (body === null) throw new ApiRequestError("PARSING_ERROR", null, "Response was not JSON");
  return body;
}

/** The API's own error message when there is one, else a plain sentence. */
export function errorMessage(error) {
  if (!error) return null;
  if (error.data?.error?.message) return error.data.error.message;
  if (error.status === "FETCH_ERROR") return "We could not reach the server. Check your connection and try again.";
  if (error.status === "PARSING_ERROR") return "The server sent something we could not read.";
  return "Something went wrong. Please try again.";
}
