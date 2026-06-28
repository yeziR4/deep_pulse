"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

type InjectedSuiWallet = {
  name?: string;
  requestPermissions?: (input?: { permissions?: string[] }) => Promise<unknown>;
  getAccounts?: () => Promise<string[]>;
  connect?: () => Promise<{ accounts?: string[]; address?: string } | string[] | void>;
};

type WalletStatus = "idle" | "connecting" | "connected" | "missing" | "error";

const walletKeys = ["suiWallet", "sui", "suiet", "martianSuiWallet"] as const;

function getInjectedWallet(): InjectedSuiWallet | null {
  if (typeof window === "undefined") {
    return null;
  }

  const walletWindow = window as typeof window & Record<string, InjectedSuiWallet | undefined>;
  for (const key of walletKeys) {
    if (walletWindow[key]) {
      return walletWindow[key] ?? null;
    }
  }

  return null;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function YetiOperatorMark() {
  return (
    <img
      src="/yeti-operator.png"
      alt="Lofi Yeti operator"
      className="hidden h-16 w-16 shrink-0 object-contain sm:block"
    />
  );
}

export function Header() {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("idle");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const wallet = getInjectedWallet();
    if (!wallet?.getAccounts) {
      return;
    }

    wallet
      .getAccounts()
      .then((accounts) => {
        if (accounts[0]) {
          setWalletAddress(accounts[0]);
          setWalletStatus("connected");
        }
      })
      .catch(() => undefined);
  }, []);

  const connectWallet = async () => {
    const wallet = getInjectedWallet();
    if (!wallet) {
      setWalletStatus("missing");
      return;
    }

    setWalletStatus("connecting");

    try {
      if (wallet.requestPermissions) {
        await wallet.requestPermissions({ permissions: ["viewAccount"] });
      }

      let accounts = wallet.getAccounts ? await wallet.getAccounts() : [];

      if (!accounts.length && wallet.connect) {
        const result = await wallet.connect();
        if (Array.isArray(result)) {
          accounts = result;
        } else if (result?.accounts) {
          accounts = result.accounts;
        } else if (result?.address) {
          accounts = [result.address];
        }
      }

      if (!accounts[0]) {
        setWalletStatus("error");
        return;
      }

      setWalletAddress(accounts[0]);
      setWalletStatus("connected");
    } catch {
      setWalletStatus("error");
    }
  };

  const walletLabel =
    walletStatus === "connected" && walletAddress
      ? shortAddress(walletAddress)
      : walletStatus === "connecting"
        ? "Confirming"
        : walletStatus === "missing"
          ? "Install Sui Wallet"
          : walletStatus === "error"
            ? "Try Again"
            : "Connect Wallet";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mt-3 flex items-center justify-between gap-4 bg-slate-950/95 px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.34)] xl:mx-4"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <YetiOperatorMark />
          <div>
            <h1 className="yeti-title text-xl font-black text-white md:text-2xl">DeepPulse</h1>
            <p className="text-sm font-semibold text-blue-100/85">Watch DeepBook liquidity move before the market does.</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-100/45">
              Built for CLAY Hackathon / Code Like a Yeti
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200 sm:flex">
          <span className="size-2 rounded-full bg-emerald-300 shadow-neon-green" />
          Mainnet
        </div>
        <button
          onClick={connectWallet}
          className="ice-button flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
          disabled={walletStatus === "connecting"}
          aria-live="polite"
        >
          {walletStatus === "connected" ? <CheckCircle2 className="size-4 text-emerald-200" /> : <Wallet className="size-4" />}
          {walletLabel}
        </button>
      </div>
    </motion.header>
  );
}
