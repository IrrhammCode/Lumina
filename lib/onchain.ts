import { getChainConfig, getStablecoinAddress } from "./chain-config";

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
] as const;

/** Stablecoin used for settlements (USDT on Arbitrum, USDC on Sepolia testnet). */
export const USDT_ARBITRUM = getStablecoinAddress();

export const USDT_DECIMALS = getChainConfig().stablecoinDecimals;

export function getArbitrumRpcUrl(): string {
  return getChainConfig().rpcUrl;
}

export function getStablecoinSymbol(): string {
  return getChainConfig().stablecoinSymbol;
}