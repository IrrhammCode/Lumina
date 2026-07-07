const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const PINATA_LIST_URL = "https://api.pinata.cloud/data/pinList";

export type PinataKeyValues = Record<string, string | number>;

export type PinListItem = {
  ipfs_pin_hash: string;
  date_pinned: string;
  metadata?: {
    name?: string;
    keyvalues?: PinataKeyValues;
  };
};

function getPinataJwt(): string | null {
  return process.env.PINATA_JWT?.trim() || null;
}

export function isIpfsConfigured(): boolean {
  return Boolean(getPinataJwt());
}

export async function pinJson<T extends object>(
  content: T,
  name: string,
  keyvalues: PinataKeyValues
): Promise<string> {
  const jwt = getPinataJwt();
  if (!jwt) throw new Error("PINATA_JWT is not configured");

  const res = await fetch(PINATA_PIN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: content,
      pinataMetadata: { name, keyvalues },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata pin failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { IpfsHash?: string };
  if (!json.IpfsHash) throw new Error("Pinata pin returned no CID");
  return json.IpfsHash;
}

export async function fetchJson<T>(cid: string): Promise<T | null> {
  const gateway =
    process.env.IPFS_GATEWAY?.replace(/\/$/, "") ?? "https://gateway.pinata.cloud/ipfs";
  const res = await fetch(`${gateway}/${cid}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function listPins(filter: PinataKeyValues, limit = 50): Promise<PinListItem[]> {
  const jwt = getPinataJwt();
  if (!jwt) return [];

  const params = new URLSearchParams({
    status: "pinned",
    pageLimit: String(Math.min(limit, 100)),
  });

  for (const [key, value] of Object.entries(filter)) {
    params.set(`metadata[keyvalues][${key}]`, String(value));
  }

  const res = await fetch(`${PINATA_LIST_URL}?${params}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { rows?: PinListItem[] };
  return json.rows ?? [];
}