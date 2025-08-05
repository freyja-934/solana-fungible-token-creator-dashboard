'use client';

import { AirdropForm } from '@/components/airdrop-form';
import { AirdropSummary } from '@/components/airdrop-summary';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AirdropPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [recipients, setRecipients] = useState<Array<{ wallet: string; amount: string }>>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  return (
    <PageContainer className="min-h-screen">
      <PageHeader
        title="Token Airdrop"
        description="Send tokens to multiple recipients at once"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Airdrop' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/airdrop/history')}
            >
              View History
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form - 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Configure Airdrop</CardTitle>
                <CardDescription>
                  Select a token and add recipient addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AirdropForm
                  onRecipientsChange={setRecipients}
                  onTokenChange={setSelectedToken}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Panel - 1 column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AirdropSummary
              recipients={recipients}
              selectedToken={selectedToken}
            />
          </motion.div>
        </div>
      </div>
    </PageContainer>
  );
} 