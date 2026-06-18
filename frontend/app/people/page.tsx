import { AudiencePage } from "@/components/landing/AudiencePage";

export default function PeoplePage() {
  return (
    <AudiencePage
      eyebrow="For people"
      title="Your money, with your"
      accent="name on it."
      body="Get paid by your @handle or your socials. Send to anyone, on any chain — no banks, no borders, no custodians."
      mood="idle"
      cta="Create your LitZap"
      features={[
        { icon: "at", title: "Pay by name", body: "Send and receive with a @username or a social handle — no long addresses." },
        { icon: "send", title: "Pay anyone — even non-users", body: "Send by email or social; they claim it when they join. Unclaimed sends auto-return in 24h." },
        { icon: "globe", title: "Any chain", body: "Money arrives wherever the recipient wants it — you never think about chains." },
      ]}
    />
  );
}
