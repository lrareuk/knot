export const SIGNUP_STATE_COOKIE = "untie_signup_first_name";
const MAX_FIRST_NAME_LENGTH = 50;

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

export function serializeSignupFirstName(value: string) {
  return encodeURIComponent(value);
}

export function deserializeSignupFirstName(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return normalizeSignupFirstName(decodeURIComponent(value));
  } catch {
    return normalizeSignupFirstName(value);
  }
}

export function isSignupFirstNameValid(value: string | null | undefined) {
  return Boolean(normalizeSignupFirstName(value));
}
