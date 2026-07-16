import { api } from "./api-client";
import { isLoggedIn } from "./auth";
import { countryCodeFromName, normalizeCountryCode } from "./countries";

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  countryCode: string;
  country: string;
  method: string;
  currency: string;
  photoUrl?: string;
};

export const defaultFamily: FamilyMember[] = [
  { id: "1", name: "Maria Santos", relation: "Mom", countryCode: "PH", country: "Philippines", method: "GCash", currency: "PHP" },
  { id: "2", name: "Juan Santos", relation: "Brother", countryCode: "PH", country: "Philippines", method: "GCash", currency: "PHP" },
  { id: "3", name: "Priya Sharma", relation: "Aunt", countryCode: "IN", country: "India", method: "Paytm", currency: "INR" },
  { id: "4", name: "James Mwangi", relation: "Uncle", countryCode: "KE", country: "Kenya", method: "M-Pesa", currency: "KES" },
];

const STORAGE_KEY = "lumina_family";
const PHOTOS_KEY = "lumina_family_photos";

function readPhotoMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PHOTOS_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writePhotoMap(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(map));
}

function attachPhotos(members: FamilyMember[]): FamilyMember[] {
  const map = readPhotoMap();
  return members.map((m) => ({
    ...m,
    photoUrl: map[m.id] ?? m.photoUrl,
  }));
}

function persistPhotos(members: FamilyMember[]): void {
  const map = readPhotoMap();
  for (const m of members) {
    if (m.photoUrl) map[m.id] = m.photoUrl;
    else delete map[m.id];
  }
  writePhotoMap(map);
}

function migrateMember(raw: Record<string, unknown>): FamilyMember {
  const country = String(raw.country ?? "Home");
  const legacyFlag = raw.flag as string | undefined;
  const countryCode = raw.countryCode
    ? normalizeCountryCode(String(raw.countryCode))
    : legacyFlag
      ? normalizeCountryCode(legacyFlag)
      : countryCodeFromName(country);

  return {
    id: String(raw.id),
    name: String(raw.name),
    relation: String(raw.relation),
    countryCode,
    country,
    method: String(raw.method),
    currency: String(raw.currency),
    photoUrl: raw.photoUrl ? String(raw.photoUrl) : undefined,
  };
}

export function getFamily(): FamilyMember[] {
  if (typeof window === "undefined") return defaultFamily;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultFamily;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return attachPhotos(parsed.map(migrateMember));
  } catch {
    return defaultFamily;
  }
}

function syncFamily(members: FamilyMember[]): void {
  if (!isLoggedIn()) return;
  const lean = members.map(({ photoUrl: _photo, ...rest }) => rest);
  void api.putFamily(lean);
}

export function saveFamily(members: FamilyMember[]): void {
  persistPhotos(members);
  const lean = members.map(({ photoUrl: _photo, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
  syncFamily(members);
}

export function getMemberById(id: string): FamilyMember | undefined {
  return getFamily().find((m) => m.id === id);
}

export function addMember(input: Omit<FamilyMember, "id">): FamilyMember {
  const member: FamilyMember = { ...input, id: `fam_${Date.now()}` };
  saveFamily([...getFamily(), member]);
  return member;
}

export function removeMember(id: string): void {
  saveFamily(getFamily().filter((m) => m.id !== id));
}

export function updateMember(
  id: string,
  patch: Partial<Omit<FamilyMember, "id">>,
): FamilyMember | undefined {
  const members = getFamily();
  const index = members.findIndex((m) => m.id === id);
  if (index < 0) return undefined;
  const updated: FamilyMember = { ...members[index], ...patch };
  const next = [...members];
  next[index] = updated;
  saveFamily(next);
  return updated;
}

export function updateMemberPhoto(id: string, photoUrl?: string): FamilyMember | undefined {
  return updateMember(id, { photoUrl: photoUrl || undefined });
}

export function setFamily(members: FamilyMember[]): void {
  saveFamily(members.length > 0 ? members : defaultFamily);
}