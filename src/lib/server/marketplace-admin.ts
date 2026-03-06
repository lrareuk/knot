const DEFAULT_MARKETPLACE_ADMIN_EMAIL = "alex@lrare.co.uk";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseMarketplaceAdminAllowlist() {
  const raw = process.env.MARKETPLACE_ADMIN_EMAILS ?? process.env.PANIC_RECOVERY_ADMIN_EMAILS ?? DEFAULT_MARKETPLACE_ADMIN_EMAIL;
  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

export function isMarketplaceAdminEmail(email: string) {
  const normalized = normalizeEmail(email);
  return parseMarketplaceAdminAllowlist().includes(normalized);
}
