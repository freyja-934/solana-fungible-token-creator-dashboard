'use client';

import { ActionButton } from '@/components/ui/action-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AirdropProgress as AirdropProgressType, executeAirdrop } from '@/lib/solana/airdrop';
import { supabase, Token } from '@/lib/supabase/client';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AlertCircle, Coins, Send, Users, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AirdropConfirmModal } from './airdrop-confirm-modal';
import { AirdropProgressModal } from './airdrop-progress-modal';

interface AirdropSummaryProps {
  recipients: Array<{ wallet: string; amount: string }>;
  selectedToken: string;
  onSuccess?: () => void;
}

export function AirdropSummary({ recipients, selectedToken, onSuccess }: AirdropSummaryProps) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [token, setToken] = useState<Token | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [airdropProgress, setAirdropProgress] = useState<AirdropProgressType | null>(null);

  // Calculate totals
  const { totalAmount, uniqueRecipients, duplicates, invalidAmounts } = useMemo(() => {
    const seen = new Set<string>();
    const duplicateWallets = new Set<string>();
    let total = 0;
    let invalidCount = 0;

    recipients.forEach(r => {
      if (r.wallet) {
        if (seen.has(r.wallet)) {
          duplicateWallets.add(r.wallet);
        }
        seen.add(r.wallet);
      }

      const amount = parseFloat(r.amount);
      if (!isNaN(amount) && amount > 0) {
        total += amount;
      } else if (r.amount) {
        invalidCount++;
      }
    });

    return {
      totalAmount: total,
      uniqueRecipients: seen.size,
      duplicates: duplicateWallets.size,
      invalidAmounts: invalidCount
    };
  }, [recipients]);

  // Fetch token details
  useEffect(() => {
    async function fetchToken() {
      if (!selectedToken) {
        setToken(null);
        return;
      }

      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('mint_address', selectedToken)
        .single();

      if (!error && data) {
        setToken(data);
      }
    }

    fetchToken();
  }, [selectedToken]);

  // Fetch token balance
  const fetchBalance = async () => {
    if (!publicKey || !selectedToken || !token) return;

    try {
      const mintPubkey = new PublicKey(selectedToken);
      const ata = await getAssociatedTokenAddress(mintPubkey, publicKey);
      const account = await getAccount(connection, ata);
      
      const rawBalance = Number(account.amount);
      const actualBalance = rawBalance / Math.pow(10, token.decimals);
      setBalance(actualBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
    }
  };

  // Fetch balance when token changes
  useEffect(() => {
    if (token && publicKey) {
      fetchBalance();
    }
  }, [token, publicKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasEnoughBalance = balance >= totalAmount;
  const canProceed = selectedToken && 
    recipients.length > 0 && 
    uniqueRecipients > 0 && 
    duplicates === 0 && 
    invalidAmounts === 0 &&
    hasEnoughBalance;

  const estimatedTransactions = Math.ceil(recipients.length / 10);
  const estimatedFee = estimatedTransactions * 0.000005; // ~5000 lamports per tx

  const handleAirdrop = async () => {
    if (!publicKey || !token || !signTransaction) return;

    setShowProgressModal(true);
    setAirdropProgress(null);

    try {
      const result = await executeAirdrop(
        connection,
        publicKey,
        new PublicKey(token.mint_address),
        recipients,
        token.decimals,
        signTransaction,
        (progress) => {
          setAirdropProgress(progress);
        }
      );

      if (result.success) {
        toast.success(`Airdrop completed! Sent ${result.totalSent.toLocaleString()} ${token.symbol} to ${recipients.length} recipients`);
      } else {
        toast.warning(`Airdrop completed with ${result.failedRecipients.length} failures`);
      }

      // Save to Supabase
      try {
        const { error: insertError } = await supabase.from('airdrops').insert({
          creator: publicKey.toBase58(),
          token_mint: token.mint_address,
          recipients: recipients,
          tx_ids: result.transactionSignatures,
          status: result.success ? 'success' : 'partial'
        });
        
        if (insertError) {
          console.error('Failed to save airdrop to database:', insertError);
          toast.error('Failed to save airdrop history');
        } else {
          console.log('Airdrop saved successfully');
        }
      } catch (error) {
        console.error('Failed to save airdrop to database:', error);
        toast.error('Failed to save airdrop history');
      }

      // Refresh balance
      fetchBalance();
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Airdrop error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute airdrop');
      setShowProgressModal(false);
    }
  };

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle>Airdrop Summary</CardTitle>
          <CardDescription>
            Review your airdrop configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Info */}
          {token && (
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              {token.image_url && (
                <img 
                  src={token.image_url} 
                  alt={token.symbol}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{token.name}</p>
                <p className="text-sm text-muted-foreground">{token.symbol}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Recipients
              </div>
              <span className="font-medium">{uniqueRecipients}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                Total Amount
              </div>
              <span className="font-medium">
                {totalAmount.toLocaleString()} {token?.symbol || ''}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Your Balance
              </div>
              <span className={`font-medium ${!hasEnoughBalance ? 'text-red-500' : ''}`}>
                {balance.toLocaleString()} {token?.symbol || ''}
              </span>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Transactions</span>
                <span>{estimatedTransactions}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Estimated Fee</span>
                <span>~{estimatedFee.toFixed(6)} SOL</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {duplicates > 0 && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription>
                {duplicates} duplicate wallet{duplicates > 1 ? 's' : ''} found
              </AlertDescription>
            </Alert>
          )}

          {invalidAmounts > 0 && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>
                {invalidAmounts} invalid amount{invalidAmounts > 1 ? 's' : ''} found
              </AlertDescription>
            </Alert>
          )}

          {!hasEnoughBalance && totalAmount > 0 && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>
                Insufficient balance. You need {(totalAmount - balance).toLocaleString()} more {token?.symbol}
              </AlertDescription>
            </Alert>
          )}

          {recipients.length > 100 && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription>
                Large airdrop ({recipients.length} recipients) may take several minutes
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <ActionButton
            onClick={() => setShowConfirmModal(true)}
            disabled={!canProceed}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Start Airdrop
          </ActionButton>

          {!selectedToken && (
            <p className="text-xs text-center text-muted-foreground">
              Select a token to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {token && (
        <AirdropConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          token={token}
          recipients={recipients}
          totalAmount={totalAmount}
          onConfirm={() => {
            setShowConfirmModal(false);
            handleAirdrop();
          }}
        />
      )}

      {/* Progress Modal */}
      <AirdropProgressModal
        isOpen={showProgressModal}
        progress={airdropProgress}
        onClose={() => {
          setShowProgressModal(false);
          setAirdropProgress(null);
        }}
      />
    </>
  );
} 