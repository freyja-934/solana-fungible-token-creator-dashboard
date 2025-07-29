'use client';

import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletConnectButton() {
  const { connected } = useWallet();

  return (
    <WalletMultiButton
      className={cn(
        'relative inline-flex items-center justify-center',
        'px-4 py-2 text-sm font-medium',
        'rounded-md',
        'transition-colors duration-200',
        connected
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      )}
    />
  );
} 