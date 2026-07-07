import type { UserRecord } from "./types";

/** Fresh users start empty — family is chosen during onboarding. */
export function buildEmptySeed(): Pick<UserRecord, "family" | "requests" | "rules" | "payments" | "seeded"> {
  return {
    family: [],
    requests: [],
    rules: [],
    payments: [],
    seeded: false,
  };
}