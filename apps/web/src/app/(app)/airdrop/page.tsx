'use client';

import { AirdropForm } from '@/components/airdrop-form';
import { AirdropHistoryTable } from '@/components/airdrop-history-table';
import { AirdropSummary } from '@/components/airdrop-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AirdropRecipient {
  wallet: string;
  amount: string;
}

export default function AirdropPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState<AirdropRecipient[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleAirdropSuccess = () => {
    // Clear the form
    setRecipients([]);
    setSelectedToken('');
    // Trigger history refresh
    setRefreshHistory(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <PageHeader
        title="Token Airdrop"
        description="Send tokens to multiple recipients at once"
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/airdrop/history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            View Full History
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <AirdropForm 
              recipients={recipients}
              setRecipients={setRecipients}
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AirdropSummary 
            recipients={recipients}
            selectedToken={selectedToken}
            onSuccess={handleAirdropSuccess}
          />
        </div>
      </div>

      {/* Airdrop History Table */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Airdrops</h2>
          <AirdropHistoryTable refreshTrigger={refreshHistory} />
        </Card>
      </div>
    </div>
  );
} 