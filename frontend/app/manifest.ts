import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LitZap — open money for the world",
    short_name: "LitZap",
    description:
      "Send money to anyone, anywhere — even by their @. Non-custodial, gas-free, built on LitVM.",
    start_url: "/",
    display: "standalone",
    background_color: "#07080d",
    theme_color: "#07080d",
    orientation: "portrait",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/zapster_raw/favicon_512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/zapster_raw/logo_appicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
