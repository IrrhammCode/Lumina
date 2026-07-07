/** Chain + stablecoin config — mainnet (Arbitrum One) or testnet (Ethereum Sepolia). */

export type LuminaChainMode = "mainnet" | "testnet";

export type LuminaChainConfig = {
  mode: LuminaChainMode;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  stablecoinSymbol: "USDT" | "USDC";
  stablecoinAddress: `0x${string}`;
  stablecoinDecimals: number;
  explorerTxUrl: (txHash: string) => string;
  gasLabel: string;
};

const ARBITRUM_MAINNET: LuminaChainConfig = {
  mode: "mainnet",
  chainId: 42161,
  chainName: "Arbitrum One",
  rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc",
  stablecoinSymbol: "USDT",
  stablecoinAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  stablecoinDecimals: 6,
  explorerTxUrl: (tx) => `https://arbiscan.io/tx/${tx}`,
  gasLabel: "ETH on Arbitrum",
};

const SEPOLIA_TESTNET: LuminaChainConfig = {
  mode: "testnet",
  chainId: 11155111,
  chainName: "Ethereum Sepolia",
  rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org",
  stablecoinSymbol: "USDC",
  stablecoinAddress: "0x1c7D4B196Cb0C7B29Dadc79aAf5906a56D552884",
  stablecoinDecimals: 6,
  explorerTxUrl: (tx) => `https://sepolia.etherscan.io/tx/${tx}`,
  gasLabel: "Sepolia ETH",
};

export function getChainMode(): LuminaChainMode {
  // Default mainnet — only Sepolia when explicitly NEXT_PUBLIC_USE_TESTNET=true
  if (process.env.NEXT_PUBLIC_USE_TESTNET === "true") return "testnet";
  return "mainnet";
}

export function getChainConfig(): LuminaChainConfig {
  return getChainMode() === "testnet" ? SEPOLIA_TESTNET : ARBITRUM_MAINNET;
}

export function isTestnetMode(): boolean {
  return getChainMode() === "testnet";
}

/** @deprecated use getChainConfig().stablecoinAddress */
export function getStablecoinAddress(): `0x${string}` {
  return getChainConfig().stablecoinAddress;
}

/** @deprecated use getChainConfig().rpcUrl */
export function getChainRpcUrl(): string {
  return getChainConfig().rpcUrl;
}