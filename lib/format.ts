export function shortAddress(address: string, head = 6, tail = 4): string {
  if (!address || address.length < head + tail + 3) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}