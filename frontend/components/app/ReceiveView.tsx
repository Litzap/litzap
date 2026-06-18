"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useEmbeddedWallet } from "@/lib/wallet";
import { Icon } from "@/components/Icon";
import { ConnectSocials } from "./ConnectSocials";

function QR({ data, size = 224 }: { data: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data)}`;
  return <img src={src} width={size} height={size} alt="Payment QR code" className="rounded-2xl" style={{ background: "#fff" }} />;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="flex w-full items-center gap-3 rounded-full px-5 py-3 text-left"
      style={{ background: "var(--field)" }}
    >
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
        <div className="truncate text-sm font-semibold text-text">{value}</div>
      </div>
      <span className="ml-auto text-muted">
        <Icon name={copied ? "check" : "copy"} size={16} />
      </span>
    </button>
  );
}

export function ReceiveView() {
  const { session } = useApp();
  const walletAddress = useEmbeddedWallet();
  const [origin, setOrigin] = useState("https://litzap.me");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  if (!session) return null;
  const tag = `${session.username}.zap`;
  const payLink = `${origin}/u/${session.username}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pay me on LitZap", text: `Pay me at ${tag}`, url: payLink });
      } catch {}
    } else {
      navigator.clipboard?.writeText(payLink);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-brand text-4xl font-semibold text-text">Get paid</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Anyone can pay you with these — even if they're not on LitZap yet.</p>

      <div className="panel flex flex-col items-center p-7">
        <QR data={payLink} />
        <div className="mt-4 font-brand text-2xl font-semibold text-text">{tag}</div>
        <div className="text-xs text-muted">Scan to pay · or share your link</div>
        <button onClick={share} className="btn-primary mt-4 flex items-center gap-2 px-6 py-3 text-sm">
          <Icon name="send" size={16} strokeWidth={2} /> Share
        </button>
      </div>

      <div className="mt-5 space-y-2.5">
        <CopyRow label="Your ZapTag" value={tag} />
        <CopyRow label="Payment link" value={payLink} />
        {session.socials.x && <CopyRow label="Pay me on X" value={`x.com/${session.socials.x}`} />}
        {session.socials.discord && <CopyRow label="Pay me on Discord" value={session.socials.discord} />}
        {walletAddress && <CopyRow label="Wallet address" value={walletAddress} />}
      </div>

      <ConnectSocials />
    </div>
  );
}
