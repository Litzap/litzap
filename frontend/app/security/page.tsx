import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/landing/MarketingChrome";
import { MotionBackground } from "@/components/MotionBackground";
import { Icon, type IconName } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Security & trust",
  description:
    "How LitZap keeps your money yours: non-custodial embedded wallets, public on-chain contracts, gas sponsorship, and front-run-safe escrow. Built on LitVM.",
};

const EXPLORER = "https://liteforge.hub.caldera.xyz/address/";

const CONTRACTS: { name: string; purpose: string; address: string }[] = [
  { name: "LitZapRegistry", purpose: "name.zap identity", address: "0x5F98A240De0a92620Fad513525c4F5f046b4A81D" },
  { name: "LitZapPay", purpose: "payments + requests", address: "0xE5bF48f6b6Ea117Cac3Fa7B5E466441778E28c9A" },
  { name: "LitZapEscrow", purpose: "pay-by-social + hold-until-delivered", address: "0x315Fd6effBd3aDbd1CfBc53BE5d6CFB32A23fE30" },
  { name: "LitZapDrops", purpose: "group money drops", address: "0x1cF889Fd8e262b639Acf23B4E33c3cE5134b9d01" },
  { name: "LitZapSubscriptions", purpose: "recurring payments", address: "0x9C4E9902173fB14A0CdC5B60F74E4Dbd55D5344B" },
  { name: "LitZapCapsule", purpose: "collectibles (ERC-721)", address: "0x3F7b5DC6687761A8B49bC57B33183EB5150180b0" },
];

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "Non-custodial by design",
    body: "Signing in creates an embedded wallet that only you control. LitZap never holds your keys and cannot move, freeze, or spend your funds. There is no company account your money passes through.",
  },
  {
    icon: "globe",
    title: "Public, verifiable contracts",
    body: "Every action — send, request, escrow, drop — runs through open contracts on LitVM. Anyone can read them on the explorer and verify exactly what the code does. No hidden logic, no off-chain ledger.",
  },
  {
    icon: "bolt",
    title: "Gas sponsorship, not custody",
    body: "So you never need a gas token, a relayer pays network fees on your behalf. It only covers gas — it cannot touch your balance, approve transfers, or sign for you. Your transactions are still yours.",
  },
  {
    icon: "lock",
    title: "Front-run-safe escrow",
    body: "Pay-by-social locks money in escrow keyed to a handle. Funds release only to the verified owner, bound to their address at claim time so the link can't be stolen — and auto-refund to you if it goes unclaimed.",
  },
];

export default function SecurityPage() {
  return (
    <div className="relative min-h-screen">
      <MotionBackground />
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-12 md:px-10 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Security &amp; trust</p>
        <h1 className="mt-3 font-brand text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-5xl">
          Your money stays <span className="gradient-text italic">yours.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          LitZap is a money app, not a bank and not a custodian. We built it so the rules are enforced
          by public code on-chain — not by trusting us. Here&apos;s exactly how that works.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="card p-6">
              <span className="text-accent">
                <Icon name={p.icon} size={24} strokeWidth={1.7} />
              </span>
              <h2 className="mt-3 font-display text-lg font-semibold text-text">{p.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Honest scope */}
        <div className="mt-12 rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div className="flex items-center gap-2 text-text">
            <Icon name="key" size={18} className="text-accent" />
            <h2 className="font-display text-lg font-semibold">On a public testnet — be clear-eyed</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>• LitZap runs on <b>LitVM (LiteForge)</b>, an EVM Layer-2. Transactions are recorded on a public ledger — they are transparent, not private.</li>
            <li>• This is a <b>testnet</b> deployment. Treat balances as test funds and don&apos;t move value you can&apos;t afford to lose.</li>
            <li>• Self-custody means <b>responsibility</b>: keep access to your sign-in method. Recovery depends on it.</li>
            <li>• The contracts are unaudited as of today. We publish them openly precisely so they can be reviewed.</li>
          </ul>
        </div>

        {/* Contracts */}
        <h2 className="mt-12 font-display text-xl font-semibold text-text">Verify it yourself</h2>
        <p className="mt-1.5 text-sm text-muted">Every LitZap primitive, live on LitVM (chain 4441). Open any of them on the explorer.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
          {CONTRACTS.map((c, i) => (
            <a
              key={c.name}
              href={`${EXPLORER}${c.address}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm transition hover:bg-[var(--surface-2)]"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
            >
              <div className="min-w-0">
                <span className="font-semibold text-text">{c.name}</span>
                <span className="ml-2 text-muted">{c.purpose}</span>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-accent">
                <span className="hidden font-mono text-xs sm:inline">{c.address.slice(0, 6)}…{c.address.slice(-4)}</span>
                <Icon name="arrowRight" size={14} />
              </span>
            </a>
          ))}
        </div>

        {/* Disclosure */}
        <h2 className="mt-12 font-display text-xl font-semibold text-text">Found a vulnerability?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          We take reports seriously and would rather hear it from you first. Email{" "}
          <a href="mailto:flamingobuidl@gmail.com" className="text-accent underline">flamingobuidl@gmail.com</a>{" "}
          with details and steps to reproduce. Please give us a chance to fix it before disclosing publicly.
        </p>

        <div className="mt-10">
          <Link href="/" className="btn-primary inline-block px-6 py-3 text-sm">
            Back to LitZap
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
