import { AudiencePage } from "@/components/landing/AudiencePage";

export default function BusinessPage() {
  return (
    <AudiencePage
      eyebrow="For business"
      title="Accept, pay out, and"
      accent="settle in seconds."
      body="Take payments, run payroll, and bill on subscription with instant finality and low fees. Non-custodial — your treasury stays yours."
      mood="success"
      status="In development"
      cta="Talk to us"
      features={[
        { icon: "wallet", title: "Checkout & subscriptions", body: "One-tap payments and recurring billing your customers actually finish." },
        { icon: "send", title: "Payroll & payouts", body: "Pay teams and contributors in batches — fast and low-fee." },
        { icon: "key", title: "Non-custodial treasury", body: "Move and hold value with rules enforced by contract — not by a custodian." },
      ]}
    />
  );
}
