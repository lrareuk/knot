export const LEGAL_DOC_KEYS = ["privacy", "terms"] as const;

export type LegalDocKey = (typeof LEGAL_DOC_KEYS)[number];

function normalizeRawDoc(raw: string | string[] | undefined): string | null {
  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return null;
}

export function resolveLegalDocKey(raw: string | string[] | undefined): LegalDocKey {
  const normalized = normalizeRawDoc(raw);

  return normalized === "terms" ? "terms" : "privacy";
}
