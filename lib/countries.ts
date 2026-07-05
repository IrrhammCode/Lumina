export type CountryMeta = {
  code: string;
  name: string;
  color: string;
  pale: string;
};

export const COUNTRIES: Record<string, CountryMeta> = {
  PH: { code: "PH", name: "Philippines", color: "#1E4D8C", pale: "#E8EEF8" },
  IN: { code: "IN", name: "India", color: "#C45C26", pale: "#FBF0E8" },
  KE: { code: "KE", name: "Kenya", color: "#1B6B3A", pale: "#E8F4EC" },
  NG: { code: "NG", name: "Nigeria", color: "#1B7A45", pale: "#E8F5EE" },
  MX: { code: "MX", name: "Mexico", color: "#1B5E4A", pale: "#E8F2EE" },
  VN: { code: "VN", name: "Vietnam", color: "#B83230", pale: "#FBEAEA" },
  ID: { code: "ID", name: "Indonesia", color: "#B83230", pale: "#FBEAEA" },
  US: { code: "US", name: "United States", color: "#2C3E6B", pale: "#ECEEF5" },
};

export const COUNTRY_BY_NAME: Record<string, string> = {
  Philippines: "PH",
  India: "IN",
  Kenya: "KE",
  Nigeria: "NG",
  Mexico: "MX",
  Vietnam: "VN",
  Indonesia: "ID",
  "United States": "US",
  Home: "XX",
};

const FALLBACK: CountryMeta = {
  code: "—",
  name: "International",
  color: "#454745",
  pale: "#E8EBE6",
};

export function countryCodeFromName(country: string): string {
  return COUNTRY_BY_NAME[country] ?? "XX";
}

export function getCountryMeta(code: string): CountryMeta {
  if (code === "XX") return FALLBACK;
  return COUNTRIES[code] ?? FALLBACK;
}

/** Migrate legacy emoji flags stored in localStorage */
export function normalizeCountryCode(value: string): string {
  const emojiMap: Record<string, string> = {
    "🇵🇭": "PH",
    "🇮🇳": "IN",
    "🇰🇪": "KE",
    "🇳🇬": "NG",
    "🇲🇽": "MX",
    "🇻🇳": "VN",
    "🇮🇩": "ID",
    "🇺🇸": "US",
    "🌍": "XX",
  };
  if (emojiMap[value]) return emojiMap[value];
  if (value.length === 2 && value.toUpperCase() === value) return value;
  return countryCodeFromName(value) || "XX";
}