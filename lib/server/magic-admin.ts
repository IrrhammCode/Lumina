import { Magic } from "@magic-sdk/admin";

let magicAdmin: Awaited<ReturnType<typeof Magic.init>> | null = null;

export async function getMagicAdmin() {
  const secret = process.env.MAGIC_SECRET_KEY;
  if (!secret) return null;
  if (!magicAdmin) {
    magicAdmin = await Magic.init(secret);
  }
  return magicAdmin;
}

export type VerifiedMagicUser = {
  publicAddress: string;
  email: string;
  oauthProvider?: string | null;
};

export async function verifyMagicDidToken(didToken: string): Promise<VerifiedMagicUser | null> {
  const magic = await getMagicAdmin();
  if (!magic) return null;

  try {
    await magic.token.validate(didToken);
    const metadata = await magic.users.getMetadataByToken(didToken);
    const publicAddress =
      metadata.publicAddress ??
      metadata.wallets?.find((w) => w.walletType === "ETH" || w.network === "ethereum")?.publicAddress ??
      null;
    if (!publicAddress) return null;

    return {
      publicAddress,
      email: metadata.email || `${publicAddress.slice(0, 6)}@magic.user`,
      oauthProvider: metadata.oauthProvider,
    };
  } catch (error) {
    console.error("Magic DID validation failed:", error);
    return null;
  }
}