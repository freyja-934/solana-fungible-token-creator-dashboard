'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export type TransactionState = 'idle' | 'loading' | 'success' | 'error';

interface TransactionStatusProps {
  state: TransactionState;
  message?: string;
  txSignature?: string;
  onClose?: () => void;
}

export function TransactionStatus({
  state,
  message,
  txSignature,
  onClose,
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
            {txSignature && (
              <p className="text-sm">
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  View on Solana Explorer
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