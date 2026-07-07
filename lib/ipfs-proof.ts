export function ipfsGatewayUrl(cid: string): string {
  const gateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY?.replace(/\/$/, "") ??
    "https://gateway.pinata.cloud/ipfs";
  return `${gateway}/${cid}`;
}

export function truncateCid(cid: string, head = 10, tail = 8): string {
  if (cid.length <= head + tail + 1) return cid;
  return `${cid.slice(0, head)}…${cid.slice(-tail)}`;
}