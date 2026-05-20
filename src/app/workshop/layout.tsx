import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Second Quarter Comeback Workshop | Bill Korman",
  description: "Live 2-hour workshop with Bill Korman. Build your complete plan to own the rest of 2026 — audit lost time, map energy, and reverse-engineer revenue into weekly hours.",
  openGraph: {
    title: "The Second Quarter Comeback Workshop | Bill Korman",
    description: "Live 2-hour workshop with Bill Korman. Build your complete plan to own the rest of 2026.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Second Quarter Comeback Workshop | Bill Korman",
    description: "Live 2-hour workshop with Bill Korman. Build your complete plan to own the rest of 2026.",
  },
};

export default function WorkshopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
