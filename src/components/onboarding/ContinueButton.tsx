"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { moduleFromPathname, moduleHasData, nextIncompleteModuleRoute } from "@/lib/onboarding/progress";
import { useFinancialStore } from "@/stores/financial-position";

type ContinueButtonProps = {
  className?: string;
};

export default function ContinueButton({ className }: ContinueButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const position = useFinancialStore((state) => state.position);
  const [showSoftWarning, setShowSoftWarning] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, []);

  const handleContinue = () => {
    if (!position) {
      return;
    }

    const currentModule = moduleFromPathname(pathname);
    const nextRoute = nextIncompleteModuleRoute(position, currentModule);

    const shouldWarn = currentModule ? !moduleHasData(currentModule, position) : false;
    if (shouldWarn) {
      setShowSoftWarning(true);
      navTimerRef.current = setTimeout(() => {
        router.push(nextRoute);
      }, 500);
      return;
    }

    setShowSoftWarning(false);
    router.push(nextRoute);
  };

  return (
    <div className={`onboarding-continue-wrap ${className ?? ""}`.trim()}>
      <button type="button" onClick={handleContinue} className="onboarding-continue-button">
        Continue
      </button>
      {showSoftWarning ? (
        <p className="onboarding-continue-warning">
          This section is still empty. You can continue now and add details later.
        </p>
      ) : null}
    </div>
  );
}
