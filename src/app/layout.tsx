import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "The 168 Game | Bill Korman - Time Ownership vs Time Management",
  description: "Reclaim 20+ hours per week without sacrificing revenue. The proven framework entrepreneurs use to scale past 6-figures while working less. By Bill Korman, Navy Veteran & Best-Selling Author.",
  keywords: ["time management", "time ownership", "entrepreneur coaching", "productivity", "Bill Korman", "168 game", "business coaching"],
  authors: [{ name: "Bill Korman" }],
  openGraph: {
    title: "The 168 Game | Time Ownership Framework by Bill Korman",
    description: "Stop managing time. Start owning it. The proven framework entrepreneurs use to reclaim 20+ hours weekly.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The 168 Game | Bill Korman",
    description: "Reclaim 20+ hours per week without sacrificing revenue.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1292313596390978');
fbq('track', 'PageView');`}
        </Script>
        {/* End Meta Pixel Code */}
      </head>
      <body className="antialiased bg-[#000000] text-[#f8f8fa]">
        {/* Meta Pixel (noscript) */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1292313596390978&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel (noscript) */}

        {children}
      </body>
    </html>
  );
}
