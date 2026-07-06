import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/api-utils";
import { runAutopilotSweep } from "@/lib/server/autopilot";
import { isAuthorizedCron } from "@/lib/server/cron-auth";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return jsonError("Unauthorized", 401);
  }

  const result = await runAutopilotSweep();
  return jsonOk(result);
}

export async function POST(request: NextRequest) {
  return GET(request);
}