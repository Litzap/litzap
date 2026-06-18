import { AudiencePage } from "@/components/landing/AudiencePage";

export default function ProjectsPage() {
  return (
    <AudiencePage
      eyebrow="For projects & partners"
      title="Make LitZap your"
      accent="money layer."
      body="White-label rails and shared liquidity on LitVM. Partner with the money layer the next wave of apps will run on."
      mood="idle"
      status="Early access"
      cta="Partner with us"
      features={[
        { icon: "key", title: "White-label & embed", body: "Run LitZap rails under your own brand, inside your own app." },
        { icon: "globe", title: "Shared liquidity", body: "Tap omnichain liquidity and routing instead of building your own." },
        { icon: "bolt", title: "Co-build & grants", body: "Ship together with ecosystem support and go-to-market backing." },
      ]}
    />
  );
}
