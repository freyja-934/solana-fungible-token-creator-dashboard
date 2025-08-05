'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Server, Shield, Wallet, X, Zap } from 'lucide-react';

interface AirdropExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseMethod: (method: 'direct' | 'server') => void;
}

export function AirdropExecutionModal({
  isOpen,
  onClose,
  onChooseMethod
}: AirdropExecutionModalProps) {
  return (
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
            className="relative w-full max-w-2xl"
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
                <h2 className="text-2xl font-bold mb-2">Choose Execution Method</h2>
                <p className="text-muted-foreground">
                  Select how you want to process your airdrop
                </p>
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Direct Execution */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-all" />
                  <button
                    onClick={() => onChooseMethod('direct')}
                    className="relative w-full p-6 bg-card border border-white/10 rounded-xl hover:border-primary/50 transition-all text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Wallet className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          Direct Execution
                          <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">Recommended</span>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Execute directly from your wallet. You maintain full control.
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-green-500">
                            <Zap className="h-3 w-3" />
                            <span>Instant execution</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-500">
                            <Shield className="h-3 w-3" />
                            <span>No custody risk</span>
                          </div>
                          <div className="flex items-center gap-2 text-yellow-500">
                            <X className="h-3 w-3" />
                            <span>Must keep browser open</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Server Execution */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-xl group-hover:bg-blue-500/30 transition-all" />
                  <button
                    onClick={() => onChooseMethod('server')}
                    className="relative w-full p-6 bg-card border border-white/10 rounded-xl hover:border-blue-500/50 transition-all text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Server className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          Server Execution
                          <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded">Reliable</span>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Pre-sign transactions for server execution. More reliable for large airdrops.
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-green-500">
                            <Shield className="h-3 w-3" />
                            <span>Can close browser</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-500">
                            <Zap className="h-3 w-3" />
                            <span>Automatic retries</span>
                          </div>
                          <div className="flex items-center gap-2 text-blue-500">
                            <Server className="h-3 w-3" />
                            <span>Background processing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg">
                <p className="text-sm text-blue-400">
                  <strong>Note:</strong> Both methods are secure. Your tokens never leave your wallet without your signature.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 