import type { AllowanceRule, PaymentRecord } from "@/lib/allowances";
import type { FamilyMember } from "@/lib/family";
import type { LuminaPrefs } from "@/lib/prefs";
import type { CareRequest } from "@/lib/requests";

export type AuthProvider = "wallet";

export type UserRecord = {
  id: string;
  email: string;
  walletAddress: string;
  provider: AuthProvider;
  onboarded: boolean;
  portalToken: string;
  createdAt: string;
  prefs: LuminaPrefs;
  family: FamilyMember[];
  requests: CareRequest[];
  rules: AllowanceRule[];
  payments: PaymentRecord[];
  seeded: boolean;
  graphCid?: string;
};

export type OtpRecord = {
  email: string;
  code: string;
  expiresAt: number;
};

export type WalletChallengeRecord = {
  address: string;
  nonce: string;
  message: string;
  expiresAt: number;
};

export type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type LuminaDatabase = {
  users: Record<string, UserRecord>;
  otps: Record<string, OtpRecord>;
  emailToUserId: Record<string, string>;
  walletToUserId: Record<string, string>;
  walletChallenges: Record<string, WalletChallengeRecord>;
  rateLimits: Record<string, RateLimitRecord>;
};

export type SessionPayload = {
  sub: string;
  email: string;
  walletAddress?: string;
  provider: AuthProvider;
  onboarded: boolean;
  portalToken: string;
};

export type UserDataSnapshot = {
  prefs: LuminaPrefs;
  family: FamilyMember[];
  requests: CareRequest[];
  rules: AllowanceRule[];
  payments: PaymentRecord[];
};