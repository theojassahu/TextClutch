import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TextClutch • AI Conversational Reply Strategist",
  description:
    "Generate context-aware conversational replies (Rizz, Savage/Cold, Caring, Teasing, Tactical) from chat screenshots or text across English, Hinglish, and Hindi.",
  keywords: [
    "TextClutch",
    "Rizz generator",
    "Hinglish chat assistant",
    "AI texting assistant",
    "screenshot reply bot",
    "dating banter",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#07090e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#07090e] text-neutral-100 antialiased selection:bg-violet-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
