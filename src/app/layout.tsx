import type { Metadata } from "next";
import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { WalletProviders } from "@/components/WalletProviders";

export const metadata: Metadata = {
  title: "DeepPulse // Liquidity Sonar",
  description: "A scientific DeepBook V3 liquidity scanner for Sui traders."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <WalletProviders>{children}</WalletProviders>
      </body>
    </html>
  );
}
