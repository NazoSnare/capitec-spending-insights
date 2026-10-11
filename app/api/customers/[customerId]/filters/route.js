import { respond, now } from "@/server/http";
import { getFilters } from "@/server/spending";

export const dynamic = "force-dynamic";

/** GET /api/customers/{customerId}/filters */
export async function GET(request, { params }) {
  const { customerId } = await params;
  return respond(() => getFilters(customerId, now()));
}
