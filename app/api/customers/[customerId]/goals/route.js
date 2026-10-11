import { respond, now } from "@/server/http";
import { getGoals } from "@/server/spending";

export const dynamic = "force-dynamic";

/** GET /api/customers/{customerId}/goals */
export async function GET(request, { params }) {
  const { customerId } = await params;
  return respond(() => getGoals(customerId, now()));
}
