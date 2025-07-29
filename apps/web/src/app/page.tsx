'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { TokenForm } from '@/components/token-form';
import { WalletConnectButton } from '@/components/wallet-connect-button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Solana Token Creator</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Create Your SPL Token
            </h2>
            <p className="text-muted-foreground">
              Deploy your own fungible token on Solana with custom metadata
            </p>
          </div>

          <div className="flex justify-center">
            <TokenForm />
          </div>
        </div>
      </main>
    </div>
  );
}
