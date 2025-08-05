'use client';

import { PageContainer } from '@/components/page-container';
import { ActionButton } from '@/components/ui/action-button';
import { ClickableCard } from '@/components/ui/clickable-card';
import { GlowCard } from '@/components/ui/glow-card';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCard } from '@/components/ui/stats-card';
import { supabase, Token } from '@/lib/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Coins, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTokens: 0,
    totalSupply: '0',
    activeTokens: 0,
    totalTransactions: 0,
  });

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  useEffect(() => {
    async function fetchTokens() {
      if (!publicKey) return;

      try {
        // Fetch user's tokens
        const { data: userTokens, error } = await supabase
          .from('tokens')
          .select('*')
          .eq('creator', publicKey.toBase58())
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTokens(userTokens || []);

        // Calculate stats
        if (userTokens && userTokens.length > 0) {
          const totalSupply = userTokens.reduce((sum, token) => {
            const supply = BigInt(token.initial_supply || '0');
            return sum + supply;
          }, BigInt(0));

          setStats({
            totalTokens: userTokens.length,
            totalSupply: formatTokenAmount(totalSupply.toString()),
            activeTokens: userTokens.length, // All tokens are considered active for now
            totalTransactions: userTokens.length * 2, // Creation + initial mint
          });
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    }

    if (connected && publicKey) {
      fetchTokens();
    }
  }, [connected, publicKey]);

  function formatTokenAmount(amount: string): string {
    const num = BigInt(amount);
    if (num >= BigInt('1000000000000')) {
      return `${(Number(num) / 1_000_000_000_000).toFixed(1)}T`;
    } else if (num >= BigInt('1000000000')) {
      return `${(Number(num) / 1_000_000_000).toFixed(1)}B`;
    } else if (num >= BigInt('1000000')) {
      return `${(Number(num) / 1_000_000).toFixed(1)}M`;
    } else if (num >= BigInt('1000')) {
      return `${(Number(num) / 1_000).toFixed(1)}K`;
    }
    return num.toString();
  }

  if (!connected) {
    return null;
  }

  const statsData = [
    {
      title: 'Total Tokens',
      value: stats.totalTokens,
      icon: Coins,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Total Supply',
      value: stats.totalSupply,
      description: 'Across all tokens',
    },
    {
      title: 'Active Tokens',
      value: stats.activeTokens,
      description: 'Currently active',
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      description: 'Token operations',
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
        {statsData.map((stat, index) => (
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold mb-6">Your Tokens</h3>
        
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <GlowCard className="p-12 text-center">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">No tokens yet</h4>
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
            {tokens.map((token, index) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <ClickableCard
                  onClick={() => router.push(`/token/${token.mint_address}`)}
                  className="h-full p-6"
                >
                  <div className="flex items-start gap-4">
                    {token.image_url ? (
                      <img
                        src={token.image_url}
                        alt={token.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold"
                      style={{ display: token.image_url ? 'none' : 'flex' }}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{token.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        Supply: {formatTokenAmount(token.initial_supply)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </ClickableCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
} 