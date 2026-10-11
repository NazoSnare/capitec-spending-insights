import { respond } from "@/server/http";
import { listCustomers } from "@/server/catalogue";

export const dynamic = "force-dynamic";

/**
 * GET /api/customers: the demo customers, for the "Viewing as" picker.
 *
 * An addition to the brief, for the demo only. In production there is no such list:
 * the customer is whoever is signed in, decided on the server.
 */
export async function GET() {
  return respond(() => ({ customers: listCustomers() }));
}
