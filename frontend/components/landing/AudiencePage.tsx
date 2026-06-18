"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MarketingHeader, MarketingFooter } from "./MarketingChrome";
import { MotionBackground } from "@/components/MotionBackground";
import { Zapster, type Mood } from "@/components/Zapster";
import { Icon, type IconName } from "@/components/Icon";

export type Feature = { icon: IconName; title: string; body: string };

export function AudiencePage({
  eyebrow,
  title,
  accent,
  body,
  mood = "idle",
  features,
  cta,
  status,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  mood?: Mood;
  features: Feature[];
  cta: string;
  status?: string;
}) {
  return (
    <div className="relative min-h-screen">
      <MotionBackground />
      <MarketingHeader />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 md:px-10 md:py-20">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
            {status && (
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                {status}
              </span>
            )}
          </div>
          <h1 className="font-brand text-5xl font-semibold leading-[1.02] tracking-tight text-text md:text-6xl">
            {title} <span className="gradient-text italic">{accent}</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">{body}</p>
          <Link href="/#start" className="btn-primary mt-8 inline-block px-7 py-4 text-base">
            {cta}
          </Link>
        </div>
        <div className="flex justify-center">
          <Zapster mood={mood} size={280} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-10">
        <div className="grid gap-10 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="text-accent">
                <Icon name={f.icon} size={26} strokeWidth={1.6} />
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-text">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
