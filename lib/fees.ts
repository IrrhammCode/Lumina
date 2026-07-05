export const competitors = [
  { name: "Lumina", fee: 0, time: "~10 sec" },
  { name: "Wise", fee: 6.5, time: "1–2 days" },
  { name: "Western Union", fee: 12.0, time: "1–5 days" },
  { name: "Bank", fee: 25.0, time: "3–5 days" },
];

export function getWiseFee(amount: number): number {
  return Math.min(6.5, amount * 0.013);
}

export function getMaxCompetitorFee(amount: number): number {
  return Math.max(...competitors.map((c) => (c.name === "Wise" ? getWiseFee(amount) : c.fee)));
}