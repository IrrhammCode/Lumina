export function hasParticleConfig(): boolean {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY;
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  return (
    !!projectId &&
    !!clientKey &&
    !!appId &&
    projectId !== "dummy_project_id" &&
    clientKey !== "dummy_client_key" &&
    appId !== "dummy_app_id"
  );
}

export function getParticleCredentials() {
  return {
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_APP_ID!,
  };
}

export function getCarePayoutAddress(): `0x${string}` {
  const raw = process.env.NEXT_PUBLIC_UA_TREASURY;
  if (raw && raw.startsWith("0x") && raw.length === 42) return raw as `0x${string}`;
  return "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
}

export function universalXUrl(transactionId: string): string {
  return `https://universalx.app/activity/details?id=${transactionId}`;
}