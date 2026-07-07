import { createPublicClient, decodeEventLog, http, parseAbiItem, type Hash } from "viem";
import { arbitrum } from "viem/chains";
import { getCarePayoutAddress } from "@/lib/particle-config";

const USDT_ARBITRUM = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as const;
const USDT_DECIMALS = 6;

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

function getArbitrumClient() {
  const rpc = process.env.ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
  return createPublicClient({ chain: arbitrum, transport: http(rpc) });
}

export async function verifyArbitrumUsdtTransfer(input: {
  txHash: string;
  minAmountUsd: number;
  recipient?: `0x${string}`;
}): Promise<{ verified: boolean; reason?: string }> {
  try {
    const hash = input.txHash as Hash;
    const client = getArbitrumClient();
    const receipt = await client.getTransactionReceipt({ hash });
    if (!receipt || receipt.status !== "success") {
      return { verified: false, reason: "Transaction not successful" };
    }

    const treasury = (input.recipient ?? getCarePayoutAddress()).toLowerCase();
    const minUnits = BigInt(Math.round(input.minAmountUsd * 10 ** USDT_DECIMALS));
    let matched = false;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== USDT_ARBITRUM.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: [transferEvent], data: log.data, topics: log.topics });
        if (decoded.eventName !== "Transfer") continue;
        const to = String(decoded.args.to).toLowerCase();
        const value = decoded.args.value as bigint;
        if (to === treasury && value >= minUnits) {
          matched = true;
          break;
        }
      } catch {
        continue;
      }
    }

    return matched
      ? { verified: true }
      : { verified: false, reason: "No matching USDT transfer to treasury" };
  } catch (error) {
    return { verified: false, reason: error instanceof Error ? error.message : "RPC verification failed" };
  }
}

export function allowDemoSettlement(): boolean {
  return process.env.ALLOW_DEMO_SETTLEMENT === "true";
}