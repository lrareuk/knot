"use client";

import { useState } from "react";

const CONSENT_KEY = "untie-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const current = localStorage.getItem(CONSENT_KEY);
    return current !== "accepted" && current !== "rejected";
  });

  const choose = (value: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent("untie:cookie-consent", { detail: value }));
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <aside className="cookie-banner">
      <p>
        Untie uses essential cookies for authentication. Analytics cookies only load if you consent.
      </p>
      <div className="row-wrap">
        <button type="button" className="ui-btn-secondary" onClick={() => choose("rejected")}>
          Decline analytics
        </button>
        <button type="button" className="ui-btn-primary" onClick={() => choose("accepted")}>
          Accept analytics
        </button>
      </div>
    </aside>
  );
}
