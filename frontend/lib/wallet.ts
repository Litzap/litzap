"use client";

import { useEffect, useRef } from "react";
import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";

/**
 * Resolves the ONE wallet LitZap uses, consistently:
 *  - Email/Google users → Privy's canonical embedded wallet (user.wallet).
 *    Created once if missing (ref-guarded so it can never spawn duplicates),
 *    and forced active so an injected extension (Rabby) can't hijack/sign.
 *  - Wallet-connect users → their connected external wallet.
 */
export function useEmbeddedWallet(): `0x${string}` | undefined {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { setActiveWallet } = useSetActiveWallet();
  const creating = useRef(false);

  const emailUser = !!(user?.email || user?.google);
  const embeddedAddr =
    user?.wallet?.walletClientType === "privy" ? (user.wallet.address as `0x${string}`) : undefined;
  const external = wallets.find((w) => w.walletClientType !== "privy");

  // create exactly one embedded wallet, only if an email/google user has none
  useEffect(() => {
    if (authenticated && emailUser && !embeddedAddr && !creating.current) {
      creating.current = true;
      createWallet().catch(() => {});
    }
  }, [authenticated, emailUser, embeddedAddr, createWallet]);

  const targetAddr = emailUser ? embeddedAddr : (external?.address as `0x${string}` | undefined);

  // force the matching wallet active so signing uses it
  useEffect(() => {
    if (!targetAddr) return;
    const w = wallets.find((x) => x.address?.toLowerCase() === targetAddr.toLowerCase());
    if (w) setActiveWallet(w);
  }, [targetAddr, wallets, setActiveWallet]);

  return targetAddr;
}
