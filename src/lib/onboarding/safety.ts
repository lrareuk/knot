export const FINANCIAL_ABUSE_ACK_VERSION = "2026-03-06";

export function hasFinancialAbuseAcknowledgement(
  value: string | null | undefined
): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

