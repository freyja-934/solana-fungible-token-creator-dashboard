'use client';

import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import type { Umi } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createContext, useContext, useMemo } from 'react';

const UmiContext = createContext<Umi | undefined>(undefined);

export function UmiProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const umi = useMemo(() => {
    const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());

    if (wallet.publicKey) {
      umi.use(walletAdapterIdentity(wallet));
    }

    return umi;
  }, [connection.rpcEndpoint, wallet]);

  return <UmiContext.Provider value={umi}>{children}</UmiContext.Provider>;
}

export function useUmi() {
  const umi = useContext(UmiContext);
  if (!umi) {
    throw new Error('useUmi must be used within UmiProvider');
  }
  return umi;
} 