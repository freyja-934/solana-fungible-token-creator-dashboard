'use client';

import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import type { Umi } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import React, { createContext, useContext, useMemo } from 'react';

const UmiContext = createContext<Umi | null>(null);

export function UmiProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const umi = useMemo(() => {
    const umi = createUmi(connection.rpcEndpoint)
      .use(walletAdapterIdentity(wallet))
      .use(mplTokenMetadata());
    
    return umi;
  }, [connection, wallet]);

  return <UmiContext.Provider value={umi}>{children}</UmiContext.Provider>;
}

export function useUmi() {
  const context = useContext(UmiContext);
  if (!context) {
    throw new Error('useUmi must be used within a UmiProvider');
  }
  return context;
} 