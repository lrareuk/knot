"use client";

import { createContext, useContext } from "react";

type OnboardingUIContextValue = {
  openGuidance: () => void;
  currencyCode: "GBP" | "USD" | "CAD";
  jurisdiction: string;
};

const OnboardingUIContext = createContext<OnboardingUIContextValue>({
  openGuidance: () => {},
  currencyCode: "GBP",
  jurisdiction: "GB-SCT",
});

export const OnboardingUIProvider = OnboardingUIContext.Provider;

export function useOnboardingUI() {
  return useContext(OnboardingUIContext);
}
