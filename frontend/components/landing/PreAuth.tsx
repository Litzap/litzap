"use client";

import { useEffect, useState } from "react";
import { Landing } from "./Landing";
import { Onboarding } from "@/components/Onboarding";

export function PreAuth() {
  const [mode, setMode] = useState<"landing" | "signup">("landing");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#start") setMode("signup");
  }, []);

  return mode === "landing" ? (
    <Landing onStart={() => setMode("signup")} />
  ) : (
    <Onboarding onBack={() => setMode("landing")} />
  );
}
