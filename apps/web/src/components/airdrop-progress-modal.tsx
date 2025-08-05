'use client';

import { Button } from '@/components/ui/button';
import { Portal } from '@/components/ui/portal';
import { AirdropProgress } from '@/lib/solana/airdrop';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface AirdropProgressModalProps {
  isOpen: boolean;
  progress: AirdropProgress | null;
  onClose: () => void;
}

export function AirdropProgressModal({ isOpen, progress, onClose }: AirdropProgressModalProps) {
  const progressPercentage = progress 
    ? (progress.processedRecipients / progress.totalRecipients) * 100 
    : 0;

  const isComplete = progress && progress.processedRecipients === progress.totalRecipients;
  const hasFailures = progress && progress.failedRecipients.length > 0;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="bg-background border border-white/10 rounded-2xl shadow-xl p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {isComplete ? 'Airdrop Complete' : 'Processing Airdrop'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isComplete 
                      ? hasFailures 
                        ? 'Airdrop completed with some failures'
                        : 'All tokens sent successfully!'
                      : 'Sending tokens to recipients...'
                    }
                  </p>
                </div>

                {/* Progress Icon */}
                <div className="flex justify-center mb-6">
                  {!isComplete ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="h-12 w-12 text-primary" />
                    </motion.div>
                  ) : hasFailures ? (
                    <div className="relative">
                      <AlertCircle className="h-12 w-12 text-yellow-500" />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </motion.div>
                  )}
                </div>

                {/* Progress Bar */}
                {progress && (
                  <div className="mb-6">
                    <div className="bg-secondary/20 rounded-full h-3 overflow-hidden mb-2">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {progress.processedRecipients} of {progress.totalRecipients} recipients
                    </p>
                  </div>
                )}

                {/* Stats */}
                {progress && (
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Batch Progress</span>
                      <span>{progress.currentBatch} / {progress.totalBatches}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Successful Transactions</span>
                      <span className="text-green-500">{progress.successfulTransactions.length}</span>
                    </div>
                    {progress.failedRecipients.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed Recipients</span>
                        <span className="text-red-500">{progress.failedRecipients.length}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction Links */}
                {isComplete && progress && progress.successfulTransactions.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Transaction Signatures:</p>
                    <div className="bg-secondary/10 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
                      {progress.successfulTransactions.map((sig, index) => (
                        <a
                          key={sig}
                          href={`https://explorer.solana.com/tx/${sig}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-primary hover:underline truncate"
                        >
                          Tx {index + 1}: {sig.slice(0, 8)}...{sig.slice(-8)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed Recipients */}
                {isComplete && progress && progress.failedRecipients.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2 text-red-500">Failed Recipients:</p>
                    <div className="bg-red-500/10 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
                      {progress.failedRecipients.map((recipient, index) => (
                        <div key={index} className="text-xs">
                          {recipient.wallet.slice(0, 4)}...{recipient.wallet.slice(-4)} - {recipient.amount} tokens
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {isComplete && (
                  <Button onClick={onClose} className="w-full">
                    Done
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
} 