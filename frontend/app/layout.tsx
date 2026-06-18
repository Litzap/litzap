import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "LitZap — open money for the world",
  description:
    "Send to anyone, anywhere, on any chain — even by their @. Instant, non-custodial, built on LitVM.",
};

// applied before paint to avoid a theme flash
const themeBoot = `(function(){try{var t=localStorage.getItem('litzap-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/zapster_raw/favicon_512.png" type="image/png" />
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
