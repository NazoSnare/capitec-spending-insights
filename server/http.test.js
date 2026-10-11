/** The HTTP edge: status codes, the error body and caching headers, through a real route handler. */
import { describe, expect, it, vi } from "vitest";
import { GET as transactions } from "@/app/api/customers/[customerId]/transactions/route";
import { GET as profile } from "@/app/api/customers/[customerId]/profile/route";
import { GET as customers } from "@/app/api/customers/route";

const call = (handler, url, customerId = "12345") => handler(new Request(`http://test${url}`), { params: Promise.resolve({ customerId }) });

describe("route handlers", () => {
  it("200 with the body, and never cached", async () => {
    const res = await call(transactions, "/api/customers/12345/transactions?limit=2");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect((await res.json()).transactions).toHaveLength(2);
  });
  it("400 with a code, a message and the offending field", async () => {
    const res = await call(transactions, "/api/customers/12345/transactions?sortBy=nope");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "INVALID_SORT", message: expect.any(String), details: { sortBy: "nope" } } });
  });
  it("404 for an unknown customer", async () => {
    const res = await call(profile, "/api/customers/nobody/profile", "nobody");
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("CUSTOMER_NOT_FOUND");
  });
  it("lists the demo customers without their budgets or internal fields", async () => {
    const res = await customers();
    const body = await res.json();
    expect(body.customers.length).toBeGreaterThanOrEqual(6);
    expect(Object.keys(body.customers[0]).sort()).toEqual(["accountType", "customerId", "joinDate", "name"]);
  });
  it("a crash is a 500 with a safe message, never a stack trace", async () => {
    const spending = await import("@/server/spending");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { respond } = await import("@/server/http");
    const res = await respond(() => { throw new Error("secret internals at line 42"); });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
    spy.mockRestore();
    expect(spending).toBeTruthy();
  });
});
