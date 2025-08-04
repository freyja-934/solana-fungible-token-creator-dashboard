'use client';

import { ActionButton } from '@/components/ui/action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Check, Copy, LogOut, Wallet } from 'lucide-react';
import { useState } from 'react';

export function WalletConnectButton() {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <ActionButton
        onClick={() => setVisible(true)}
        loading={connecting}
        loadingText="Connecting..."
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </ActionButton>
    );
  }

  const address = publicKey?.toBase58() || '';
  const displayAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2',
            'text-sm font-medium rounded-2xl',
            'bg-primary/10 text-primary',
            'border border-primary/20',
            'hover:bg-primary/20 hover:border-primary/30',
            'transition-all duration-300',
            'hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]'
          )}
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {displayAddress}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-card/95 backdrop-blur-md border-white/10"
      >
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCopyAddress}
          className="cursor-pointer"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="cursor-pointer text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 