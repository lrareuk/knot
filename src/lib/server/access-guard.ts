export type AccessInput = {
  pathname: string;
  isAuthenticated: boolean;
  paid: boolean;
  onboardingDone: boolean;
  financialAbuseAcknowledged: boolean;
  accountState: "active" | "panic_hidden";
  recoveryKeyRequired: boolean;
  hasSignupName: boolean;
};

export function resolveAccessRedirect(input: AccessInput): string | null {
  const {
    pathname,
    isAuthenticated,
    paid,
    onboardingDone,
    financialAbuseAcknowledged,
    accountState,
    recoveryKeyRequired,
    hasSignupName,
  } = input;
  const isSignupPaymentPath = pathname === "/signup/payment" || pathname.startsWith("/signup/payment/");
  const isSignupPaymentSuccessPath = pathname === "/signup/payment/success";
  const isAuthEntryPath = pathname === "/signup" || pathname === "/signup/email" || pathname === "/login" || pathname === "/login/reset";
  const isRecoveryKeyPath = pathname === "/recovery-key" || pathname.startsWith("/recovery-key/");
  const isOnboardingSafetyPath = pathname === "/onboarding/safety";
  const isSettingsPath = pathname.startsWith("/settings");
  const isAdminPath = pathname.startsWith("/admin");

  if (!isAuthenticated) {
    if (pathname === "/signup/email" && !hasSignupName) {
      return "/signup";
    }

    if (isSignupPaymentPath) {
      return "/signup";
    }

    if (
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/dashboard") ||
      isSettingsPath ||
      isRecoveryKeyPath ||
      isAdminPath
    ) {
      return "/login";
    }
    return null;
  }

  if (accountState === "panic_hidden") {
    if (pathname === "/login" || pathname === "/login/reset") {
      return null;
    }
    return "/login";
  }

  if (isRecoveryKeyPath) {
    if (!paid) return "/signup/payment";
    if (!onboardingDone) return "/onboarding";
    if (!recoveryKeyRequired) return "/dashboard";
    return null;
  }

  if (isAuthEntryPath) {
    if (!paid) return "/signup/payment";
    if (!onboardingDone) return "/onboarding";
    if (recoveryKeyRequired) return "/recovery-key";
    return "/dashboard";
  }

  if (isSignupPaymentPath) {
    if (isSignupPaymentSuccessPath) {
      return null;
    }

    if (!paid) return null;
    if (!onboardingDone) return "/onboarding";
    if (recoveryKeyRequired) return "/recovery-key";
    return "/dashboard";
  }

  if (pathname.startsWith("/onboarding")) {
    if (!paid) return "/signup/payment";
    if (!onboardingDone && !financialAbuseAcknowledged && !isOnboardingSafetyPath) return "/onboarding/safety";
    // During first-run onboarding, users may still require a recovery key but
    // must be allowed to complete onboarding first.
    if (onboardingDone && recoveryKeyRequired) return "/recovery-key";
    return null;
  }

  if (pathname.startsWith("/dashboard")) {
    if (!paid) return "/signup/payment";
    if (!onboardingDone) return "/onboarding";
    if (recoveryKeyRequired) return "/recovery-key";
    return null;
  }

  if (isSettingsPath) {
    if (!paid) return "/signup/payment";
    if (!onboardingDone) return "/onboarding";
    if (recoveryKeyRequired) return "/recovery-key";
    return null;
  }

  return null;
}
