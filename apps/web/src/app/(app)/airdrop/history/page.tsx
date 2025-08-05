'use client';

import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Airdrop, supabase } from '@/lib/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AirdropHistoryPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  useEffect(() => {
    async function fetchAirdrops() {
      if (!publicKey) return;

      try {
        const { data, error } = await supabase
          .from('airdrops')
          .select('*')
          .eq('creator', publicKey.toBase58())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAirdrops(data || []);
      } catch (error) {
        console.error('Error fetching airdrops:', error);
      } finally {
        setLoading(false);
      }
    }

    if (connected && publicKey) {
      fetchAirdrops();
    }
  }, [connected, publicKey]);

  if (!connected) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Completed';
      case 'partial':
        return 'Partial Success';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <PageContainer className="min-h-screen">
      <PageHeader
        title="Airdrop History"
        description="View your past airdrops"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Airdrop', href: '/airdrop' },
          { label: 'History' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/airdrop')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Airdrop
          </Button>
        }
      />

      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : airdrops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No airdrops yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start sending tokens to multiple recipients
              </p>
              <Button onClick={() => router.push('/airdrop')}>
                Create Airdrop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {airdrops.map((airdrop, index) => (
              <motion.div
                key={airdrop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(airdrop.status)}
                        <div>
                          <CardTitle className="text-lg">
                            {airdrop.recipients.length} Recipients
                          </CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(airdrop.created_at), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${
                        airdrop.status === 'success' ? 'text-green-500' :
                        airdrop.status === 'partial' ? 'text-yellow-500' :
                        airdrop.status === 'failed' ? 'text-red-500' :
                        'text-muted-foreground'
                      }`}>
                        {getStatusText(airdrop.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Token</span>
                        <span className="font-mono">
                          {airdrop.token_mint.slice(0, 4)}...{airdrop.token_mint.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span>
                          {airdrop.recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transactions</span>
                        <span>{airdrop.tx_ids.length}</span>
                      </div>
                      
                      {airdrop.tx_ids.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <p className="text-xs text-muted-foreground mb-2">Transaction Signatures:</p>
                          <div className="space-y-1">
                            {airdrop.tx_ids.slice(0, 3).map((sig) => (
                              <a
                                key={sig}
                                href={`https://explorer.solana.com/tx/${sig}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {sig.slice(0, 8)}...{sig.slice(-8)}
                              </a>
                            ))}
                            {airdrop.tx_ids.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                ...and {airdrop.tx_ids.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
} 