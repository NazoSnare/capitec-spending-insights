import { respond, now } from "@/server/http";
import { getProfile } from "@/server/spending";

export const dynamic = "force-dynamic";

/** GET /api/customers/{customerId}/profile */
export async function GET(request, { params }) {
  const { customerId } = await params;
  return respond(() => getProfile(customerId, now()));
}
