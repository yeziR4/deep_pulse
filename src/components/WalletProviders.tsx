"use client";

import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl, JsonRpcHTTPTransport } from "@mysten/sui/jsonRpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const { networkConfig } = createNetworkConfig({
  mainnet: {
    network: "mainnet",
    transport: new JsonRpcHTTPTransport({ url: getJsonRpcFullnodeUrl("mainnet") })
  },
  testnet: {
    network: "testnet",
    transport: new JsonRpcHTTPTransport({ url: getJsonRpcFullnodeUrl("testnet") })
  }
});

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
