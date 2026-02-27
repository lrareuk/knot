export const SIGNUP_STATE_COOKIE = "untie_signup_first_name";
const MAX_FIRST_NAME_LENGTH = 50;
const DEFAULT_JURISDICTION = "GB-SCT";

export type SignupState = {
  firstName: string;
  jurisdiction: string;
};

export function normalizeSignupFirstName(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_FIRST_NAME_LENGTH) {
    return null;
  }

  return trimmed;
}

function normalizeSignupJurisdiction(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_JURISDICTION;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed || DEFAULT_JURISDICTION;
}

export function normalizeSignupState(input: { firstName?: string | null; jurisdiction?: string | null } | null | undefined): SignupState | null {
  const firstName = normalizeSignupFirstName(input?.firstName);
  if (!firstName) {
    return null;
  }

  return {
    firstName,
    jurisdiction: normalizeSignupJurisdiction(input?.jurisdiction),
  };
}

export function serializeSignupState(value: SignupState) {
  return encodeURIComponent(JSON.stringify(value));
}

export function deserializeSignupState(value: string | null | undefined): SignupState | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("{")) {
      const parsed = JSON.parse(decoded) as { firstName?: string; jurisdiction?: string };
      return normalizeSignupState(parsed);
    }

    // Backward compatibility for previously serialized first-name-only cookie values.
    const firstName = normalizeSignupFirstName(decoded);
    return firstName ? { firstName, jurisdiction: DEFAULT_JURISDICTION } : null;
  } catch {
    const firstName = normalizeSignupFirstName(value);
    return firstName ? { firstName, jurisdiction: DEFAULT_JURISDICTION } : null;
  }
}

export function isSignupFirstNameValid(value: string | null | undefined) {
  return Boolean(normalizeSignupFirstName(value));
}
