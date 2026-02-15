import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Shell from "@/components/layout/shell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Now",
  description:
    "Homemade campus food from student chefs. Order fast, pick up on time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${fraunces.variable}`}
    >
      <body
        suppressHydrationWarning
        className={`${geistMono.variable} font-sans antialiased`}
      >
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
