import { respond, now, query } from "@/server/http";
import { getCategories } from "@/server/spending";

export const dynamic = "force-dynamic";

/** GET /api/customers/{customerId}/spending/categories?period=&startDate=&endDate= */
export async function GET(request, { params }) {
  const { customerId } = await params;
  return respond(() => getCategories(customerId, query(request), now()));
}
