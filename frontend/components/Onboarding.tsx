"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy, useLoginWithEmail, useLoginWithOAuth } from "@privy-io/react-auth";
import { useApp } from "@/lib/store";
import { isLive } from "@/lib/config";
import { useEmbeddedWallet } from "@/lib/wallet";
import { isNameAvailable, registerName, nameOfAddress } from "@/lib/onchain";
import { Logo } from "./Logo";
import { Zapster } from "./Zapster";
import { Icon, type IconName } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";

const TRUST: { icon: IconName; t: string }[] = [
  { icon: "key", t: "Non-custodial" },
  { icon: "globe", t: "Built on LitVM" },
  { icon: "at", t: "Open" },
];

const errText = (e: unknown) => (e as { message?: string })?.message || "Something went wrong.";

export function Onboarding({ onBack }: { onBack?: () => void }) {
  const { signIn } = useApp();
  const { ready, authenticated, user, login } = usePrivy();
  const addr = useEmbeddedWallet();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { initOAuth } = useLoginWithOAuth();

  const [mode, setMode] = useState<"choose" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const step: "auth" | "profile" = authenticated ? "profile" : "auth";

  // if this wallet already owns a ZapTag on-chain, restore it — no re-claiming every login
  useEffect(() => {
    (async () => {
      if (!authenticated || !addr || !isLive) return;
      try {
        const existing = await nameOfAddress(addr);
        if (existing) signIn({ method: "email", username: existing, email: user?.email?.address, socials: { x: user?.twitter?.username ?? undefined, discord: user?.discord?.username ?? undefined }, address: addr });
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, addr]);

  async function startEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email.");
    setErr("");
    setBusy(true);
    try {
      await sendCode({ email });
      setMode("code");
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setErr("");
    setBusy(true);
    try {
      await loginWithCode({ code });
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr("");
    try {
      await initOAuth({ provider: "google" });
    } catch (e) {
      setErr(errText(e));
    }
  }

  // Sign in directly with a social — verifies the handle at login, so any gift
  // sent to that handle is immediately claimable once they pick a ZapTag.
  async function social(provider: "twitter" | "discord") {
    setErr("");
    try {
      await initOAuth({ provider });
    } catch (e) {
      setErr(errText(e));
    }
  }

  function wallet() {
    setErr("");
    // Privy's login handles wallet connect + signature → real authentication.
    login({ loginMethods: ["wallet"] });
  }

  async function finish() {
    const u = username.trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setErr("Pick a username: 3–20 letters, numbers or _");
    setErr("");
    setBusy(true);
    try {
      if (!addr) {
        setErr("Your wallet is still being created — give it a second and try again.");
        setBusy(false);
        return;
      }
      if (isLive && !(await isNameAvailable(u))) {
        setErr(`${u}.zap is already taken — try another.`);
        setBusy(false);
        return;
      }
      // sponsor gas so the embedded wallet can pay to register, then claim on-chain (persists)
      await fetch("/api/gas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: addr }) }).catch(() => {});
      if (isLive) await registerName(u);
      const method = user?.wallet?.walletClientType && user.wallet.walletClientType !== "privy" ? "wallet" : "email";
      signIn({ method, username: u, email: user?.email?.address, socials: { x: user?.twitter?.username ?? undefined, discord: user?.discord?.username ?? undefined }, address: addr });
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* brand side */}
      <div className="relative hidden flex-col items-center justify-center p-10 text-center lg:flex">
        <div className="absolute left-10 top-10">
          <Logo markSize={34} />
        </div>
        <Zapster mood="idle" size={230} />
        <h2 className="font-brand mt-6 text-5xl font-semibold leading-[1.02] text-text">
          Money, <span className="gradient-text italic">everywhere.</span>
        </h2>
        <p className="mt-3 max-w-sm text-muted">
          Get paid by your @name. Send to anyone — instant, and always yours. Built on LitVM.
        </p>
        <div className="mt-7 flex gap-2">
          {TRUST.map((x) => (
            <span key={x.t} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-text" style={{ background: "var(--surface-2)" }}>
              <Icon name={x.icon} size={14} className="text-accent" />
              {x.t}
            </span>
          ))}
        </div>
      </div>

      {/* form side */}
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <div className="panel w-full max-w-md p-7 md:p-9">
          {onBack && (
            <button onClick={onBack} className="mb-3 text-xs font-semibold text-muted hover:text-text">
              ← Home
            </button>
          )}
          <div className="mb-4 flex flex-col items-center gap-1 lg:hidden">
            <Logo markSize={30} />
            <Zapster mood="idle" size={128} />
          </div>
          <div className="mb-6 mt-2 flex items-center gap-2">
            <Dot active={step === "auth"} />
            <Dot active={step === "profile"} />
          </div>

          <AnimatePresence mode="wait">
            {step === "profile" ? (
              <motion.div key="profile" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <h1 className="font-display text-2xl font-extrabold text-text">Claim your ZapTag</h1>
                <p className="mb-6 mt-1 text-sm text-muted">This is how people pay you — and your Zapster agent.</p>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Your ZapTag</label>
                <div className="flex items-center rounded-full px-5" style={{ background: "var(--field)" }}>
                  <input value={username} onChange={(e) => { setUsername(e.target.value); setErr(""); }} placeholder="yourname" className="w-full bg-transparent py-3.5 text-sm outline-none" />
                  <span className="font-semibold text-accent">.zap</span>
                </div>
                {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
                <button onClick={finish} disabled={busy} className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-4 text-base">
                  {busy ? "Claiming…" : "Enter LitZap"}
                  {!busy && <Icon name="arrowRight" size={18} strokeWidth={2} />}
                </button>
              </motion.div>
            ) : mode === "code" ? (
              <motion.div key="code" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <h1 className="font-display text-2xl font-extrabold text-text">Enter your code</h1>
                <p className="mb-6 mt-1 text-sm text-muted">We sent a 6-digit code to {email}.</p>
                <input value={code} onChange={(e) => { setCode(e.target.value); setErr(""); }} inputMode="numeric" placeholder="123456" className="field px-5 py-3.5 text-center text-lg font-bold tracking-[0.4em]" />
                {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
                <button onClick={verify} disabled={busy || code.length < 6} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 py-4 text-base">
                  {busy ? "Verifying…" : "Verify & continue"}
                </button>
                <button onClick={() => { setMode("choose"); setErr(""); }} className="mt-3 w-full text-center text-xs text-muted hover:text-text">
                  ← use a different method
                </button>
              </motion.div>
            ) : (
              <motion.div key="choose" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <h1 className="font-display text-2xl font-extrabold text-text">Create your LitZap</h1>
                <p className="mb-6 mt-1 text-sm text-muted">No seed phrase — we create your wallet.</p>

                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Email</label>
                <div className="mb-2.5 flex items-center gap-2 rounded-full pr-2" style={{ background: "var(--field)" }}>
                  <input value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && startEmail()} placeholder="you@email.com" className="w-full bg-transparent px-5 py-3.5 text-sm outline-none" />
                </div>
                <button onClick={startEmail} disabled={busy} className="btn-primary mb-5 flex w-full items-center justify-center gap-2 py-3.5 text-sm">
                  {busy ? "Sending…" : "Continue with email"}
                </button>
                {!ready && <p className="mb-3 text-center text-[11px] text-amber-400">Secure login still starting — if this stays, the Privy App ID or allowed origins need fixing.</p>}

                <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted">
                  <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                  or
                  <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                </div>

                <button onClick={google} className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-text" style={{ background: "var(--field)" }}>
                  <Icon name="globe" size={18} className="text-accent" /> Continue with Google
                </button>
                <div className="mb-2.5 grid grid-cols-2 gap-2.5">
                  <button onClick={() => social("twitter")} className="flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-text" style={{ background: "var(--field)" }}>
                    <Icon name="x" size={16} className="text-accent" /> X
                  </button>
                  <button onClick={() => social("discord")} className="flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-text" style={{ background: "var(--field)" }}>
                    <Icon name="discord" size={16} className="text-accent" /> Discord
                  </button>
                </div>
                <button onClick={wallet} className="btn-ghost flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm">
                  <Icon name="wallet" size={18} /> Connect a wallet
                </button>
                <p className="mt-3 text-center text-[11px] text-muted">Got a gift on X or Discord? Sign in with it to claim.</p>

                {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-[11px] text-muted">Non-custodial — your money is always yours.</p>
        </div>
      </div>
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return <span className="h-1.5 rounded-full transition-all" style={{ width: active ? 28 : 10, background: active ? "var(--accent)" : "var(--border)" }} />;
}
