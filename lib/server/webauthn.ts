import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { SignJWT, jwtVerify } from "jose";
import {
  getWebAuthnOrigin,
  getWebAuthnRpId,
  getWebAuthnRpName,
} from "./webauthn-config";
import { getUserById, updateUser } from "./db";
import type { PasskeyCredential, UserRecord } from "./types";

const CHALLENGE_TTL_SEC = 5 * 60;

export type WebAuthnPurpose = "unlock" | "approve" | "activate" | "pay" | "default";

type ChallengePayload = {
  challenge: string;
  userId: string;
  type: "register" | "auth";
  purpose?: WebAuthnPurpose;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "lumina-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

async function signChallengeToken(payload: ChallengePayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_TTL_SEC}s`)
    .sign(getSecret());
}

async function verifyChallengeToken(token: string): Promise<ChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.challenge !== "string" ||
      typeof payload.userId !== "string" ||
      (payload.type !== "register" && payload.type !== "auth")
    ) {
      return null;
    }
    return {
      challenge: payload.challenge,
      userId: payload.userId,
      type: payload.type,
      purpose:
        typeof payload.purpose === "string"
          ? (payload.purpose as WebAuthnPurpose)
          : undefined,
    };
  } catch {
    return null;
  }
}

function toServerCredential(cred: PasskeyCredential) {
  return {
    id: cred.id,
    publicKey: Buffer.from(cred.publicKey, "base64url"),
    counter: cred.counter,
    transports: cred.transports as AuthenticatorTransportFuture[] | undefined,
  };
}

export function userHasPasskey(user: UserRecord): boolean {
  return (user.passkeys?.length ?? 0) > 0;
}

export async function createRegistrationOptions(user: UserRecord) {
  const options = await generateRegistrationOptions({
    rpName: getWebAuthnRpName(),
    rpID: getWebAuthnRpId(),
    userName: user.email,
    userDisplayName: user.email.split("@")[0] ?? "Lumina user",
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: (user.passkeys ?? []).map((cred) => ({
      id: cred.id,
      transports: cred.transports as AuthenticatorTransportFuture[] | undefined,
    })),
  });

  const challengeToken = await signChallengeToken({
    challenge: options.challenge,
    userId: user.id,
    type: "register",
  });

  return { options, challengeToken };
}

export async function verifyRegistration(
  user: UserRecord,
  response: RegistrationResponseJSON,
  challengeToken: string,
  deviceName?: string
): Promise<{ ok: true; credential: PasskeyCredential } | { ok: false; error: string }> {
  const challengePayload = await verifyChallengeToken(challengeToken);
  if (!challengePayload || challengePayload.type !== "register" || challengePayload.userId !== user.id) {
    return { ok: false, error: "Registration challenge expired" };
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challengePayload.challenge,
    expectedOrigin: getWebAuthnOrigin(),
    expectedRPID: getWebAuthnRpId(),
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: "Could not verify passkey" };
  }

  const { credential, credentialDeviceType } = verification.registrationInfo;
  const passkey: PasskeyCredential = {
    id: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    deviceName: deviceName?.trim() || (credentialDeviceType === "multiDevice" ? "This device" : "Security key"),
    createdAt: new Date().toISOString(),
    transports: credential.transports,
  };

  const existing = user.passkeys ?? [];
  await updateUser(user.id, { passkeys: [...existing, passkey] });

  return { ok: true, credential: passkey };
}

export async function createAuthenticationOptions(
  user: UserRecord,
  purpose: WebAuthnPurpose = "default"
) {
  const passkeys = user.passkeys ?? [];
  if (passkeys.length === 0) {
    return null;
  }

  const options = await generateAuthenticationOptions({
    rpID: getWebAuthnRpId(),
    allowCredentials: passkeys.map((cred) => ({
      id: cred.id,
      transports: cred.transports as AuthenticatorTransportFuture[] | undefined,
    })),
    userVerification: "required",
  });

  const challengeToken = await signChallengeToken({
    challenge: options.challenge,
    userId: user.id,
    type: "auth",
    purpose,
  });

  return { options, challengeToken };
}

export async function verifyAuthentication(
  user: UserRecord,
  response: AuthenticationResponseJSON,
  challengeToken: string,
  expectedPurpose?: WebAuthnPurpose
): Promise<{ ok: true; purpose?: WebAuthnPurpose } | { ok: false; error: string }> {
  const challengePayload = await verifyChallengeToken(challengeToken);
  if (!challengePayload || challengePayload.type !== "auth" || challengePayload.userId !== user.id) {
    return { ok: false, error: "Authentication challenge expired" };
  }

  if (expectedPurpose && challengePayload.purpose && challengePayload.purpose !== expectedPurpose) {
    return { ok: false, error: "Challenge purpose mismatch" };
  }

  const passkeys = user.passkeys ?? [];
  const matched = passkeys.find((cred) => cred.id === response.id);
  if (!matched) {
    return { ok: false, error: "Passkey not recognized" };
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challengePayload.challenge,
    expectedOrigin: getWebAuthnOrigin(),
    expectedRPID: getWebAuthnRpId(),
    credential: toServerCredential(matched),
    requireUserVerification: true,
  });

  if (!verification.verified) {
    return { ok: false, error: "Face ID verification failed" };
  }

  const newCounter = verification.authenticationInfo.newCounter;
  if (newCounter > matched.counter) {
    const updated = passkeys.map((cred) =>
      cred.id === matched.id ? { ...cred, counter: newCounter } : cred
    );
    await updateUser(user.id, { passkeys: updated });
  }

  return { ok: true, purpose: challengePayload.purpose };
}

export async function removePasskeys(userId: string): Promise<void> {
  await updateUser(userId, { passkeys: [] });
}

export async function getPasskeyStatus(userId: string) {
  const user = await getUserById(userId);
  if (!user) return { enrolled: false, count: 0, devices: [] as string[] };
  const passkeys = user.passkeys ?? [];
  return {
    enrolled: passkeys.length > 0,
    count: passkeys.length,
    devices: passkeys.map((p) => p.deviceName ?? "This device"),
  };
}