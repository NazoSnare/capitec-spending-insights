import { respond, now, query } from "@/server/http";
import { getTransactions } from "@/server/spending";

export const dynamic = "force-dynamic";

/** GET /api/customers/{customerId}/transactions?limit=&offset=&category=&startDate=&endDate=&sortBy= */
export async function GET(request, { params }) {
  const { customerId } = await params;
  return respond(() => getTransactions(customerId, query(request), now()));
}
