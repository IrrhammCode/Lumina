declare module "@particle-network/universal-account-sdk" {
  export enum CHAIN_ID {
    SOLANA_MAINNET = 101,
    ETHEREUM_MAINNET = 1,
    BSC_MAINNET = 56,
    BASE_MAINNET = 8453,
    XLAYER_MAINNET = 196,
    ARBITRUM_MAINNET_ONE = 42161,
  }

  export interface IBasicToken {
    chainId: number;
    address: string;
  }

  export interface ITransferTransaction {
    token: IBasicToken;
    amount: string;
    receiver: string;
  }

  export interface IUserOpWithChain {
    userOpHash: string;
    chainId: number;
  }

  export interface EIP7702Authorization {
    userOpHash: string;
    signature: string;
  }

  export interface ITransaction {
    rootHash: string;
    userOps?: IUserOpWithChain[];
  }

  export interface IAsset {
    tokenType: string;
    amountInUSD: number;
  }

  export interface IAssetsResponse {
    assets: IAsset[];
    totalAmountInUSD: number;
  }

  export interface ISmartAccountOptions {
    ownerAddress: string;
    smartAccountAddress?: string;
    solanaSmartAccountAddress?: string;
    useEIP7702?: boolean;
    options?: { eip7702Delegated?: boolean };
  }

  export interface IUniversalAccountConfig {
    projectId: string;
    projectClientKey: string;
    projectAppUuid: string;
    smartAccountOptions?: {
      ownerAddress: string;
      useEIP7702?: boolean;
    };
    tradeConfig?: {
      slippageBps?: number;
      universalGas?: boolean;
    };
  }

  export class UniversalAccount {
    constructor(config: IUniversalAccountConfig);
    getPrimaryAssets(): Promise<IAssetsResponse>;
    createTransferTransaction(payload: ITransferTransaction): Promise<ITransaction>;
    getSmartAccountOptions(): Promise<ISmartAccountOptions>;
    sendTransaction(
      transaction: ITransaction,
      signature: string,
      authorizations?: EIP7702Authorization[]
    ): Promise<{ transactionId?: string }>;
  }
}