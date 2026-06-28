"use client";

import { ConnectModal, useCurrentAccount, useCurrentWallet, useDisconnectWallet, useSignPersonalMessage } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import { CheckCircle2, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WalletControl() {
  const account = useCurrentAccount();
  const { currentWallet, isConnecting } = useCurrentWallet();
  const { mutate: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();
  const { mutate: signPersonalMessage, isPending: isSigning } = useSignPersonalMessage();
  const [isVerified, setIsVerified] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const confirmationMessage = useMemo(() => {
    const timestamp = new Date().toISOString();
    return `DeepPulse wallet confirmation\nAddress: ${account?.address ?? "unknown"}\nTime: ${timestamp}`;
  }, [account?.address]);

  if (!account) {
    return (
      <ConnectModal
        trigger={
          <button className="ice-button flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] transition hover:-translate-y-0.5">
            <Wallet className="size-4" />
            {isConnecting ? "Connecting" : "Connect Wallet"}
          </button>
        }
      />
    );
  }

  const confirmWallet = () => {
    setSignError(null);
    signPersonalMessage(
      {
        message: new TextEncoder().encode(confirmationMessage)
      },
      {
        onSuccess: (result) => {
          setIsVerified(true);
          setSignaturePreview(result.signature.slice(0, 10));
        },
        onError: (error) => {
          setIsVerified(false);
          setSignaturePreview(null);
          setSignError(error.message || "Wallet confirmation failed");
        }
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden bg-slate-900/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-blue-100/75 shadow-inner lg:block">
        <p className="text-blue-100/45">{currentWallet?.name ?? "Sui Wallet"}</p>
        <p className="font-black text-cyan-100">{shortAddress(account.address)}</p>
        {signError ? <p className="mt-1 normal-case tracking-normal text-pink-200">{signError}</p> : null}
      </div>

      <button
        onClick={confirmWallet}
        disabled={isSigning}
        className="ice-button flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-75"
        title={signaturePreview ? `Signature starts ${signaturePreview}` : "Ask the connected wallet to sign a DeepPulse confirmation message"}
      >
        {isVerified ? <CheckCircle2 className="size-4 text-emerald-200" /> : <ShieldCheck className="size-4" />}
        {isSigning ? "Confirming" : isVerified ? "Verified" : shortAddress(account.address)}
      </button>

      <button
        onClick={() => {
          setIsVerified(false);
          setSignaturePreview(null);
          disconnectWallet();
        }}
        disabled={isDisconnecting}
        className="grid size-9 place-items-center bg-slate-900/85 text-blue-100/70 shadow-inner transition hover:-translate-y-0.5 hover:bg-pink-500/15 hover:text-pink-100 disabled:cursor-wait disabled:opacity-70"
        aria-label="Disconnect wallet"
        title="Disconnect wallet"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
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
        <WalletControl />
      </div>
    </motion.header>
  );
}
