'use client';

import { PageContainer } from '@/components/page-container';
import { ActionButton } from '@/components/ui/action-button';
import { ClickableCard } from '@/components/ui/clickable-card';
import { GlowCard } from '@/components/ui/glow-card';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCard } from '@/components/ui/stats-card';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Coins, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Mock data - replace with actual API calls
const mockTokens = [
  {
    address: 'Aqk3kFg8mF9ac7QJrPbVhDKi6BqMQRhQbNwL6MpSxk29',
    name: 'My Token',
    symbol: 'MTK',
    supply: '1,000,000',
    logo: '🪙',
    created: '2024-01-15',
  },
  {
    address: 'Bqk3yTg9nH8bc9RKsPcWhELj7CrNRShRcNxM7NqTyk29',
    name: 'Another Token',
    symbol: 'ATK',
    supply: '500,000',
    logo: '💎',
    created: '2024-01-10',
  },
];

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  const stats = [
    {
      title: 'Total Tokens',
      value: mockTokens.length,
      icon: Coins,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Total Supply',
      value: '1.5M',
      description: 'Across all tokens',
    },
    {
      title: 'Active Tokens',
      value: mockTokens.length,
      description: 'Currently active',
    },
    {
      title: 'Total Holders',
      value: '2,345',
      trend: { value: 8, isPositive: true },
    },
  ];

  return (
    <PageContainer className="min-h-screen">
      <PageHeader
        title="Token Dashboard"
        description={`Welcome back, ${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}`}
        actions={
          <ActionButton onClick={() => router.push('/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Token
          </ActionButton>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Tokens Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Tokens</h2>
        
        {mockTokens.length === 0 ? (
          <GlowCard className="p-12 text-center">
            <Coins className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tokens yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first token to get started
            </p>
            <ActionButton onClick={() => router.push('/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Token
            </ActionButton>
          </GlowCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockTokens.map((token, index) => (
              <motion.div
                key={token.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ClickableCard
                  className="p-6"
                  onClick={() => router.push(`/token/${token.address}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{token.logo}</div>
                    <span className="text-xs text-muted-foreground">
                      {token.created}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-1">{token.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{token.symbol}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Supply</span>
                      <span className="font-medium">{token.supply}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Address</span>
                      <span className="font-mono">
                        {token.address.slice(0, 4)}...{token.address.slice(-4)}
                      </span>
                    </div>
                  </div>
                </ClickableCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <ActionButton
          size="lg"
          className="rounded-full h-16 w-16 pulse-glow"
          onClick={() => router.push('/create')}
        >
          <Plus className="h-6 w-6" />
        </ActionButton>
      </motion.div>
    </PageContainer>
  );
} 