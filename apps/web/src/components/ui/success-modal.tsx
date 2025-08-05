'use client';

import { Button } from '@/components/ui/button';
import { Portal } from '@/components/ui/portal';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Copy, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenData: {
    name: string;
    symbol: string;
    mintAddress: string;
    imageUrl?: string;
    description?: string;
    transactionSignature?: string;
  };
  onViewToken: () => void;
  onGoToDashboard: () => void;
}

export function SuccessModal({
  isOpen,
  onClose,
  tokenData,
  onViewToken,
  onGoToDashboard
}: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `https://explorer.solana.com/address/${tokenData.mintAddress}`;
  const txUrl = tokenData.transactionSignature 
    ? `https://explorer.solana.com/tx/${tokenData.transactionSignature}` 
    : null;

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
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="bg-background border border-white/10 rounded-2xl shadow-xl p-6">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Token Created Successfully!</h2>
                  <p className="text-muted-foreground">
                    Your token has been deployed to Solana mainnet
                  </p>
                </div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="flex justify-center my-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative bg-primary/10 rounded-full p-4">
                      <Check className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  {/* Token Info */}
                  <div className="bg-secondary/10 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {tokenData.imageUrl ? (
                        <img
                          src={tokenData.imageUrl}
                          alt={tokenData.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                          {tokenData.symbol.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{tokenData.name}</h4>
                        <p className="text-sm text-muted-foreground">{tokenData.symbol}</p>
                      </div>
                    </div>
                    
                    {tokenData.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {tokenData.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Mint Address</span>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-white/5 px-2 py-1 rounded">
                            {tokenData.mintAddress.slice(0, 4)}...{tokenData.mintAddress.slice(-4)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(tokenData.mintAddress)}
                          >
                            {copied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explorer Links */}
                  <div className="flex gap-2 text-sm justify-center">
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {txUrl && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <a
                          href={txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          View Transaction
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onGoToDashboard}
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={onViewToken}
                    >
                      View Token Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
} 