"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MarketingHeader, MarketingFooter } from "./MarketingChrome";
import { Zapster } from "@/components/Zapster";
import { LogoMark } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";

const TRUST: { icon: IconName; t: string }[] = [
  { icon: "bolt", t: "AI-native" },
  { icon: "key", t: "Non-custodial by design" },
  { icon: "globe", t: "Built on LitVM" },
  { icon: "at", t: "Open — pay anyone" },
];

const SEGMENTS: { id: string; href: string; eyebrow: string; title: string; body: string; icon: IconName; status?: string }[] = [
  { id: "people", href: "/people", eyebrow: "For people", title: "Your money, with your name on it.", body: "Get paid by your @handle or your socials. Send to anyone — even people who aren't on LitZap yet.", icon: "globe" },
  { id: "business", href: "/business", eyebrow: "For business", title: "Accept, pay out, settle.", body: "Built for checkout, subscriptions, payroll, and payouts — instant and non-custodial.", icon: "wallet", status: "In development" },
  { id: "developers", href: "/developers", eyebrow: "For developers", title: "Payments, in a few lines.", body: "One SDK for transfers, escrow, claim-links, and recurring payments.", icon: "capsules", status: "In development" },
  { id: "projects", href: "/projects", eyebrow: "For projects", title: "Make LitZap your money layer.", body: "White-label rails and shared liquidity, built on LitVM.", icon: "key", status: "Early access" },
];

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative">
      <MarketingHeader onGetStarted={onStart} />

      {/* hero — mascot-led */}
      <section className="relative mx-auto max-w-6xl px-5 pt-8 md:px-10 md:pt-12">
        <div className="pointer-events-none absolute -right-16 top-0 opacity-[0.05]">
          <LogoMark size={460} />
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-accent">The open money layer · Built on LitVM</p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="font-brand text-6xl font-semibold leading-[0.95] tracking-tight text-text md:text-8xl"
            >
              Money,
              <br />
              <span className="gradient-text italic">everywhere.</span>
            </motion.h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              Meet Zapster — the AI that moves your money. Just say who to pay; he sends it,
              requests it, or splits it. Non-custodial, and built on LitVM.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onStart} className="btn-primary px-7 py-4 text-base">Get started</button>
              <Link href="/developers" className="btn-ghost px-7 py-4 text-base">For developers</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted">
              {TRUST.map((x) => (
                <span key={x.t} className="inline-flex items-center gap-2">
                  <Icon name={x.icon} size={15} className="text-accent" />
                  {x.t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Zapster mood="idle" size={340} />
          </div>
        </div>
      </section>

      {/* segments → real pages */}
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-16">
        {SEGMENTS.map((s, i) => (
          <section key={s.id} className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-14">
            <div className={i % 2 ? "md:order-2" : ""}>
              <div className="mb-3 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{s.eyebrow}</p>
                {s.status && (
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                    {s.status}
                  </span>
                )}
              </div>
              <h2 className="font-brand text-4xl font-semibold leading-tight text-text md:text-5xl">{s.title}</h2>
              <p className="mt-4 max-w-md text-muted">{s.body}</p>
              <Link href={s.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                Explore {s.eyebrow.replace("For ", "")} <Icon name="arrowRight" size={15} strokeWidth={2.2} />
              </Link>
            </div>
            <div className={`flex justify-center ${i % 2 ? "md:order-1" : ""}`}>
              <div className="relative grid h-56 w-56 place-items-center">
                <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: "radial-gradient(closest-side, var(--accent-ring), transparent)" }} />
                <Icon name={s.icon} size={92} strokeWidth={1.2} className="text-accent" />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* partner band */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center md:px-10">
          <h2 className="font-brand text-5xl font-semibold text-text md:text-6xl">
            Build on the <span className="gradient-text italic">network.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted">
            LitZap is built for apps, businesses, and protocols to plug in as their money layer —
            an omnichain network on LitVM. Early partners welcome.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={onStart} className="btn-primary px-7 py-4 text-base">Get started</button>
            <Link href="/projects" className="btn-ghost px-7 py-4 text-base">Partner with us</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
