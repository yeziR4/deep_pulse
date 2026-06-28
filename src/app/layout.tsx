import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepPulse // Liquidity Sonar",
  description: "A scientific DeepBook V3 liquidity scanner for Sui traders."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
