#!/usr/bin/env node
/**
 * Sync Magic Dashboard allowlist from NEXT_PUBLIC_APP_URL.
 * Usage: node scripts/magic-setup-allowlist.mjs
 * Requires MAGIC_SECRET_KEY and NEXT_PUBLIC_APP_URL in .env.local
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const secret = env.MAGIC_SECRET_KEY;
const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

if (!secret || !appUrl) {
  console.error("Need MAGIC_SECRET_KEY and NEXT_PUBLIC_APP_URL in .env.local");
  process.exit(1);
}

const origin = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
const redirect = `${origin}/login/oauth`;

const res = await fetch("https://api.dashboard.magic.link/v1/admin/access_whitelist", {
  method: "POST",
  headers: {
    "X-Magic-Secret-Key": secret,
    "Content-Type": "application/json",
  },
  body: JSON.stringify([
    { access_type: "domain", value: origin },
    { access_type: "redirect_url", value: redirect },
  ]),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
console.log(`\nDomain: ${origin}`);
console.log(`Redirect: ${redirect}`);