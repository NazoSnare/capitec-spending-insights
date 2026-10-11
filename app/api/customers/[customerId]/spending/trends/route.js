import { respond, now, query } from "@/server/http";
import { getTrends } from "@/server/spending";

export const dynamic = "force-dynamic";

/** GET /api/customers/{customerId}/spending/trends?months= */
export async function GET(request, { params }) {
  const { customerId } = await params;
  return respond(() => getTrends(customerId, query(request), now()));
}
