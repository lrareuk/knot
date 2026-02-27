"use client";

import { createContext, useContext } from "react";

type OnboardingUIContextValue = {
  openGuidance: () => void;
};

const OnboardingUIContext = createContext<OnboardingUIContextValue>({
  openGuidance: () => {},
});

export const OnboardingUIProvider = OnboardingUIContext.Provider;

export function useOnboardingUI() {
  return useContext(OnboardingUIContext);
}
