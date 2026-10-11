import { respond, now, query } from "@/server/http";
import { getSummary } from "@/server/spending";

export const dynamic = "force-dynamic";

/** GET /api/customers/{customerId}/spending/summary?period= */
export async function GET(request, { params }) {
  const { customerId } = await params;
  return respond(() => getSummary(customerId, query(request), now()));
}
