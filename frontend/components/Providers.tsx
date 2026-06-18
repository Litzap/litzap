"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { wagmiConfig, litvm, PRIVY_APP_ID } from "@/lib/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // If no Privy app id is configured, render without auth (build/dev safety).
  if (!PRIVY_APP_ID) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        defaultChain: litvm,
        supportedChains: [litvm],
        embeddedWallets: { ethereum: { createOnLogin: "all-users" } },
        loginMethods: ["email", "google", "twitter", "discord", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#5b86ff",
          logo: "/zapster_raw/logo.svg",
          walletList: ["metamask", "rabby_wallet", "okx_wallet", "wallet_connect"],
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
