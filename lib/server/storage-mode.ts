export type StorageMode = "ipfs" | "postgres" | "json";

/** IPFS (Pinata) = wallet-owned graph. Postgres = legacy. JSON = local dev fallback. */
export function getStorageMode(): StorageMode {
  if (process.env.STORAGE_MODE === "postgres" && process.env.DATABASE_URL) {
    return "postgres";
  }
  if (process.env.STORAGE_MODE === "json") {
    return "json";
  }
  if (process.env.PINATA_JWT || process.env.STORAGE_MODE === "ipfs") {
    return "ipfs";
  }
  if (process.env.DATABASE_URL) {
    return "postgres";
  }
  return "json";
}

export function useIpfsStorage(): boolean {
  return getStorageMode() === "ipfs";
}

export function usePostgresStorage(): boolean {
  return getStorageMode() === "postgres";
}