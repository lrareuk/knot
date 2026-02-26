"use client";

import { useEffect } from "react";

const CONSENT_KEY = "untie-cookie-consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function enableAnalytics(measurementId: string) {
  if (document.getElementById("gtag-script")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "gtag-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true,
  });
}

export default function Analytics() {
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!measurementId) {
      return;
    }

    const evaluate = () => {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (consent === "accepted") {
        enableAnalytics(measurementId);
      }
    };

    evaluate();

    const handler = () => evaluate();
    window.addEventListener("untie:cookie-consent", handler);
    return () => window.removeEventListener("untie:cookie-consent", handler);
  }, []);

  return null;
}
