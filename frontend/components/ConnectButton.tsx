"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { motion } from "framer-motion";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button onClick={() => disconnect()} className="btn-ghost px-4 py-2 text-sm">
        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: "var(--positive)" }} />
        {short(address)}
      </button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="btn-primary px-5 py-2.5 text-sm"
    >
      {isPending ? "Connecting…" : "Connect"}
    </motion.button>
  );
}
