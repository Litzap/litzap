"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Method = "email" | "google" | "passkey" | "wallet";
export type View = "home" | "send" | "request" | "receive" | "drops" | "activity";
export type SocialType = "x" | "discord" | "email";

export type Token = { symbol: string; name: string; decimals: number; address: `0x${string}`; native: boolean; stable?: boolean };
const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as `0x${string}`;
export const TOKENS: Token[] = [
  { symbol: "USDC", name: "USD Coin", decimals: 6, address: (process.env.NEXT_PUBLIC_USDC ?? ZERO_ADDR) as `0x${string}`, native: false, stable: true },
  { symbol: "zkLTC", name: "Litecoin", decimals: 18, address: ZERO_ADDR, native: true },
];
export const DEFAULT_TOKEN = "USDC";
export const CHAINS = ["LitVM", "Ethereum", "Base", "Arbitrum"];

export type Tx = {
  id: string;
  dir: "in" | "out" | "request";
  party: string;
  amount: number;
  token: string;
  chain?: string;
  note?: string;
  hash?: string;
  ts: number;
  status: "done" | "pending";
};

export type PendingClaim = {
  id: string;
  type: SocialType;
  value: string;
  amount: number;
  token: string;
  from: string;
  note?: string;
  ts: number;
  expiry: number;
};

export type Drop = {
  code: string;
  from: string;
  total: number;
  token: string;
  count: number;
  split: "equal" | "lucky";
  note?: string;
  claims: { by: string; amount: number; ts: number }[];
  ts: number;
  expiry: number;
};

export type Session = {
  method: Method;
  username: string;
  email?: string;
  socials: { x?: string; discord?: string };
  address: `0x${string}`;
  balances: Record<string, number>;
} | null;

type Ctx = {
  ready: boolean;
  session: Session;
  view: View;
  setView: (v: View) => void;
  txs: Tx[];
  incoming: PendingClaim[];
  myDrops: Drop[];
  signIn: (p: { method: Method; username: string; email?: string; socials?: { x?: string; discord?: string }; address?: string }) => void;
  signOut: () => void;
  setSocials: (s: { x?: string; discord?: string }) => void;
  send: (p: { to: string; amount: number; token: string; chain?: string; note?: string }) => { ok: true } | { ok: false; error: string };
  sendToSocial: (p: { type: SocialType; value: string; amount: number; token: string; note?: string }) => { ok: true } | { ok: false; error: string };
  request: (p: { from: string; amount: number; token: string; note?: string }) => { ok: boolean };
  claimIncoming: (id: string) => void;
  createDrop: (p: { total: number; token: string; count: number; split: "equal" | "lucky"; note?: string }) => { ok: true; code: string } | { ok: false; error: string };
  getDrop: (code: string) => Drop | undefined;
  claimDrop: (code: string) => { ok: true; amount: number; token: string } | { ok: false; error: string };
  addTx: (t: { dir: Tx["dir"]; party: string; amount: number; token: string; note?: string; hash?: string; chain?: string }) => void;
};

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

const LS_SESSION = "litzap.session";
const LS_TXS = "litzap.txs";
const LS_PENDING = "litzap.pending";
const LS_DROPS = "litzap.drops";

const norm = (s: string) => s.trim().toLowerCase().replace(/^@/, "");
const round2 = (n: number) => Math.round(n * 100) / 100;

function fakeAddress(seed: string): `0x${string}` {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let hex = "";
  for (let i = 0; i < 40; i++) hex += ((h = (h * 1103515245 + 12345) >>> 0) % 16).toString(16);
  return `0x${hex}` as `0x${string}`;
}

function makeCode() {
  const c = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

const startingBalances = (): Record<string, number> => ({});

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [pending, setPending] = useState<PendingClaim[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [view, setView] = useState<View>("home");

  useEffect(() => {
    try {
      // wipe stale demo data cached from earlier builds (fake balance/activity)
      if (localStorage.getItem("litzap.ver") !== "2") {
        [LS_SESSION, LS_TXS, LS_PENDING, LS_DROPS].forEach((k) => localStorage.removeItem(k));
        localStorage.setItem("litzap.ver", "2");
      }
      const s = localStorage.getItem(LS_SESSION);
      const t = localStorage.getItem(LS_TXS);
      const p = localStorage.getItem(LS_PENDING);
      const d = localStorage.getItem(LS_DROPS);
      if (s) setSession(JSON.parse(s));
      setTxs(t ? JSON.parse(t) : []);
      if (p) setPending(JSON.parse(p));
      if (d) setDrops(JSON.parse(d));
    } catch {
      setTxs([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (session) localStorage.setItem(LS_SESSION, JSON.stringify(session));
      else localStorage.removeItem(LS_SESSION);
      localStorage.setItem(LS_TXS, JSON.stringify(txs));
      localStorage.setItem(LS_PENDING, JSON.stringify(pending));
      localStorage.setItem(LS_DROPS, JSON.stringify(drops));
    } catch {}
  }, [session, txs, pending, drops, ready]);

  const incoming = useMemo<PendingClaim[]>(() => {
    if (!session) return [];
    return pending.filter((c) => {
      if (c.type === "email") return !!session.email && norm(session.email) === c.value;
      if (c.type === "x") return !!session.socials.x && norm(session.socials.x) === c.value;
      if (c.type === "discord") return !!session.socials.discord && norm(session.socials.discord) === c.value;
      return false;
    });
  }, [pending, session]);

  const myDrops = useMemo<Drop[]>(() => (session ? drops.filter((d) => d.from === session.username) : []), [drops, session]);

  const api = useMemo<Ctx>(() => {
    const credit = (token: string, amount: number) =>
      setSession((s) => (s ? { ...s, balances: { ...s.balances, [token]: round2((s.balances[token] ?? 0) + amount) } } : s));

    return {
      ready,
      session,
      view,
      setView,
      txs,
      incoming,
      myDrops,
      signIn: ({ method, username, email, socials, address }) => {
        const u = norm(username);
        setSession({ method, username: u, email, socials: socials ?? {}, address: (address as `0x${string}`) ?? fakeAddress(u), balances: startingBalances() });
        setView("home");
      },
      signOut: () => {
        setSession(null);
        setView("home");
      },
      setSocials: (s) =>
        setSession((cur) => (cur ? { ...cur, socials: { ...cur.socials, ...s } } : cur)),
      addTx: (t) => setTxs((p) => [{ id: crypto.randomUUID(), ts: Date.now(), status: "done", ...t }, ...p]),
      send: ({ to, amount, token, chain, note }) => {
        if (!session) return { ok: false, error: "Sign in first." };
        if (amount <= 0) return { ok: false, error: "Enter an amount." };
        if (amount > (session.balances[token] ?? 0)) return { ok: false, error: `Not enough ${token}.` };
        setSession({ ...session, balances: { ...session.balances, [token]: round2((session.balances[token] ?? 0) - amount) } });
        setTxs((p) => [{ id: crypto.randomUUID(), dir: "out", party: to, amount, token, chain, note, ts: Date.now(), status: "done" }, ...p]);
        return { ok: true };
      },
      sendToSocial: ({ type, value, amount, token, note }) => {
        if (!session) return { ok: false, error: "Sign in first." };
        if (!value.trim()) return { ok: false, error: "Enter who to pay." };
        if (amount <= 0) return { ok: false, error: "Enter an amount." };
        if (amount > (session.balances[token] ?? 0)) return { ok: false, error: `Not enough ${token}.` };
        setSession({ ...session, balances: { ...session.balances, [token]: round2((session.balances[token] ?? 0) - amount) } });
        const v = norm(value);
        const label = type === "email" ? v : `${type}:${v}`;
        setPending((p) => [{ id: crypto.randomUUID(), type, value: v, amount, token, from: session.username, note, ts: Date.now(), expiry: Date.now() + 864e5 }, ...p]);
        setTxs((p) => [{ id: crypto.randomUUID(), dir: "out", party: label, amount, token, note, ts: Date.now(), status: "pending" }, ...p]);
        return { ok: true };
      },
      request: ({ from, amount, token, note }) => {
        if (!session) return { ok: false };
        setTxs((p) => [{ id: crypto.randomUUID(), dir: "request", party: from, amount, token, note, ts: Date.now(), status: "pending" }, ...p]);
        return { ok: true };
      },
      claimIncoming: (id) => {
        setPending((prev) => {
          const c = prev.find((x) => x.id === id);
          if (c && session) {
            credit(c.token, c.amount);
            setTxs((t) => [{ id: crypto.randomUUID(), dir: "in", party: `${c.from}.zap`, amount: c.amount, token: c.token, note: c.note, ts: Date.now(), status: "done" }, ...t]);
          }
          return prev.filter((x) => x.id !== id);
        });
      },
      createDrop: ({ total, token, count, split, note }) => {
        if (!session) return { ok: false, error: "Sign in first." };
        if (total <= 0 || count <= 0) return { ok: false, error: "Enter an amount and number of people." };
        if (total > (session.balances[token] ?? 0)) return { ok: false, error: `Not enough ${token}.` };
        const code = makeCode();
        setSession({ ...session, balances: { ...session.balances, [token]: round2((session.balances[token] ?? 0) - total) } });
        setDrops((p) => [{ code, from: session.username, total, token, count, split, note, claims: [], ts: Date.now(), expiry: Date.now() + 864e5 }, ...p]);
        setTxs((p) => [{ id: crypto.randomUUID(), dir: "out", party: `drop · ${note ?? code}`, amount: total, token, note, ts: Date.now(), status: "pending" }, ...p]);
        return { ok: true, code };
      },
      getDrop: (code) => drops.find((d) => d.code === code),
      claimDrop: (code) => {
        const d = drops.find((x) => x.code === code);
        if (!d) return { ok: false, error: "Drop not found." };
        if (!session) return { ok: false, error: "Sign in to grab your share." };
        if (Date.now() > d.expiry) return { ok: false, error: "This drop expired." };
        if (d.claims.length >= d.count) return { ok: false, error: "This drop is all gone." };
        if (d.claims.some((c) => c.by === session.username)) return { ok: false, error: "You already grabbed yours." };

        const claimed = d.claims.reduce((s, c) => s + c.amount, 0);
        const remaining = round2(d.total - claimed);
        const left = d.count - d.claims.length;
        let amount: number;
        if (left === 1) amount = remaining;
        else if (d.split === "equal") amount = round2(d.total / d.count);
        else {
          const max = (remaining / left) * 2;
          amount = Math.max(0.01, round2(Math.random() * max));
          amount = Math.min(amount, round2(remaining - (left - 1) * 0.01));
        }

        setDrops((prev) => prev.map((x) => (x.code === code ? { ...x, claims: [...x.claims, { by: session.username, amount, ts: Date.now() }] } : x)));
        credit(d.token, amount);
        setTxs((t) => [{ id: crypto.randomUUID(), dir: "in", party: `${d.from}.zap · drop`, amount, token: d.token, ts: Date.now(), status: "done" }, ...t]);
        return { ok: true, amount, token: d.token };
      },
    };
  }, [ready, session, txs, incoming, myDrops, drops, view]);

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}
