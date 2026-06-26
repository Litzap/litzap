import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/lib/store";

const SITE = "https://litzap.xyz";
const TITLE = "LitZap — open money for the world";
const DESCRIPTION =
  "Send money to anyone, anywhere — even by their @. Non-custodial, gas-free, no seed phrase. Built on LitVM, Litecoin's programmable layer.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s · LitZap",
  },
  description: DESCRIPTION,
  applicationName: "LitZap",
  keywords: [
    "LitZap",
    "Litecoin",
    "LitVM",
    "money app",
    "non-custodial wallet",
    "pay by username",
    "crypto payments",
    "Zapster",
    "stablecoin",
    "gas-free",
  ],
  authors: [{ name: "LitZap" }],
  creator: "LitZap",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "LitZap",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@litzap_xyz",
    creator: "@litzap_xyz",
    title: TITLE,
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: "LitZap",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/zapster_raw/favicon_512.png",
    shortcut: "/zapster_raw/favicon_512.png",
    apple: "/zapster_raw/logo_appicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6fc" },
    { media: "(prefers-color-scheme: dark)", color: "#07080d" },
  ],
  colorScheme: "dark light",
};

// applied before paint to avoid a theme flash
const themeBoot = `(function(){try{var t=localStorage.getItem('litzap-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500;1,9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="font-body">
        <ThemeProvider>
          <Providers>
            <AppProvider>{children}</AppProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
