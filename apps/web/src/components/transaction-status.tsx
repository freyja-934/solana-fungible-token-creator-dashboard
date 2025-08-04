'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export type TransactionState = 'idle' | 'loading' | 'success' | 'error';

interface TransactionStatusProps {
  state: TransactionState;
  message?: string;
  transactionSignature?: string;
  mintAddress?: string;
}

export function TransactionStatus({
  state,
  message,
  transactionSignature,
  mintAddress,
}: TransactionStatusProps) {
  if (state === 'idle') return null;

  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet';

  return (
    <div className="space-y-2">
      {state === 'loading' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Transaction in Progress</AlertTitle>
          <AlertDescription>
            {message || 'Please wait while we process your transaction...'}
          </AlertDescription>
        </Alert>
      )}

      {state === 'success' && (
        <Alert className="border-green-500/50 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{message || 'Transaction completed successfully.'}</p>
            {transactionSignature && (
              <p className="text-sm">
                <a
                  href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=${network}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View on Solana Explorer →
                </a>
              </p>
            )}
            {mintAddress && (
              <p className="text-sm">
                <a
                  href={`/token/${mintAddress}`}
                  className="text-primary hover:underline"
                >
                  View Token Details →
                </a>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {state === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Transaction Failed</AlertTitle>
          <AlertDescription>
            {message || 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 