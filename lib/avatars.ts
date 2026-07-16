/** Deterministic portrait URLs + initials fallback for people in Lumina */

const DICEBEAR_STYLE = "lorelei";

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function avatarSeed(name: string, id?: string): string {
  const base = (id ?? name).trim().toLowerCase();
  return base || "lumina";
}

export function personAvatarUrl(name: string, id?: string, pixelSize = 96): string {
  const seed = avatarSeed(name, id);
  const params = new URLSearchParams({
    seed,
    size: String(pixelSize),
    backgroundColor: "fdf4e0,ede9fe,e2f6d5",
    backgroundType: "gradientLinear",
  });
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/png?${params}`;
}

export function avatarPixelSize(size: "sm" | "md" | "lg" | "xl" | "hero"): number {
  switch (size) {
    case "sm":
      return 64;
    case "md":
      return 80;
    case "lg":
      return 96;
    case "xl":
      return 128;
    case "hero":
      return 160;
    default:
      return 80;
  }
}

export function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}