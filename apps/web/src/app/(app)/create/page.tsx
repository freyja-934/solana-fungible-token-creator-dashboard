'use client';

import { PageContainer } from '@/components/page-container';
import { TokenForm } from '@/components/token-form';
import { ActionButton } from '@/components/ui/action-button';
import { PageHeader } from '@/components/ui/page-header';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreateTokenPage() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create Token"
        description="Launch your SPL token on Solana"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Create Token' },
        ]}
        actions={
          <ActionButton
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </ActionButton>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-center"
      >
        <TokenForm />
      </motion.div>
    </PageContainer>
  );
} 