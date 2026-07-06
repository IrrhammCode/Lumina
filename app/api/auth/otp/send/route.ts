import { jsonError } from "@/lib/server/api-utils";

export async function POST() {
  return jsonError("Email OTP is disabled. Connect your wallet to sign in.", 410);
}