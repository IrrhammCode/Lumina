import { clearSessionCookieOptions } from "@/lib/server/auth";
import { jsonOk } from "@/lib/server/api-utils";

export async function POST() {
  const response = jsonOk({ loggedOut: true });
  response.cookies.set(clearSessionCookieOptions());
  return response;
}