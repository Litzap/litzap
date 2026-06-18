import { AudiencePage } from "@/components/landing/AudiencePage";

export default function DevelopersPage() {
  return (
    <AudiencePage
      eyebrow="For developers"
      title="Payments, in a"
      accent="few lines."
      body="One SDK for transfers, escrow, claim-links, and recurring payments — omnichain by default, non-custodial by design. Ship money features without the plumbing."
      mood="idle"
      status="In development"
      cta="Join the waitlist"
      features={[
        { icon: "capsules", title: "Drop-in SDK & API", body: "Add send, request, and receive with a few calls. TypeScript-first." },
        { icon: "clock", title: "Escrow & programmable", body: "Claim-links, conditional release, and recurring payments out of the box." },
        { icon: "globe", title: "Omnichain settlement", body: "Built on LitVM; reaches other chains without you wiring bridges." },
      ]}
    />
  );
}
