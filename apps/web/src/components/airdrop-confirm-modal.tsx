'use client';

import { Button } from '@/components/ui/button';
import { Portal } from '@/components/ui/portal';
import { Token } from '@/lib/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Send, X } from 'lucide-react';

interface AirdropConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  recipients: Array<{ wallet: string; amount: string }>;
  totalAmount: number;
  onConfirm: () => void;
}

export function AirdropConfirmModal({
  isOpen,
  onClose,
  token,
  recipients,
  totalAmount,
  onConfirm
}: AirdropConfirmModalProps) {
  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md"
            >
              <div className="bg-background border border-white/10 rounded-2xl shadow-xl p-6 relative">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Confirm Airdrop</h2>
                  <p className="text-muted-foreground">
                    Review and confirm your airdrop details
                  </p>
                </div>

                {/* Token Info */}
                <div className="bg-secondary/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    {token.image_url && (
                      <img 
                        src={token.image_url} 
                        alt={token.symbol}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{token.name}</p>
                      <p className="text-sm text-muted-foreground">{token.symbol}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipients</span>
                      <span className="font-medium">{recipients.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-medium">
                        {totalAmount.toLocaleString()} {token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Fee</span>
                      <span className="font-medium">
                        ~{(Math.ceil(recipients.length / 10) * 0.000005).toFixed(6)} SOL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg mb-6">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-500">Important</p>
                    <p className="text-muted-foreground mt-1">
                      This action cannot be undone. Make sure all recipient addresses and amounts are correct.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Airdrop
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
} 