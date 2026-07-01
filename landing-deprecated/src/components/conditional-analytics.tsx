"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect, useState } from "react";

export function ConditionalAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => {
      setConsented(localStorage.getItem("cookie_consent") === "accepted");
    };

    check();

    // Listen for consent changes (bannière acceptée dans la même session)
    window.addEventListener("cookie_consent_updated", check);
    return () => window.removeEventListener("cookie_consent_updated", check);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
