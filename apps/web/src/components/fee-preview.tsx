import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORM_FEES } from '@/lib/solana/custom-token';
import { Info } from 'lucide-react';

interface FeePreviewProps {
  treasuryBps: number;
  stakingBps: number;
  marketingBps: number;
  sampleAmount?: number;
  hasCustomWallets?: boolean;
}

export function FeePreview({ 
  treasuryBps, 
  stakingBps, 
  marketingBps,
  sampleAmount = 1000,
  hasCustomWallets = false
}: FeePreviewProps) {
  const totalTokenFeeBps = treasuryBps + stakingBps + marketingBps;
  const totalTokenFeePercent = totalTokenFeeBps / 100;
  const platformTransferFeePercent = PLATFORM_FEES.transferFeeBps / 100;
  const totalTransferFeePercent = totalTokenFeePercent + platformTransferFeePercent;

  // Calculate fee amounts for sample transfer
  const platformFee = (sampleAmount * platformTransferFeePercent) / 100;
  const treasuryFee = (sampleAmount * (treasuryBps / 100)) / 100;
  const stakingFee = (sampleAmount * (stakingBps / 100)) / 100;
  const marketingFee = (sampleAmount * (marketingBps / 100)) / 100;
  const totalFees = platformFee + treasuryFee + stakingFee + marketingFee;
  const amountAfterFees = sampleAmount - totalFees;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fee Structure Preview</CardTitle>
        <CardDescription>
          Understanding the fees applied to your token
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Creation Fees */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Token Creation Fees</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Creation Fee:</span>
              <span className="font-medium">{PLATFORM_FEES.creationFee} SOL</span>
            </div>
            <p className="text-xs text-muted-foreground">
              One-time fee paid when creating your token
            </p>
          </div>
        </div>

        {/* Transfer Fees */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Transfer Fees</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Transfer Fee:</span>
              <span className="font-medium">{platformTransferFeePercent}%</span>
            </div>
            {totalTokenFeeBps > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token-Specific Fees:</span>
                  <span className="font-medium">{totalTokenFeePercent}%</span>
                </div>
                <div className="ml-4 space-y-1 text-xs">
                  {treasuryBps > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">• Treasury:</span>
                      <span>{(treasuryBps / 100).toFixed(2)}%</span>
                    </div>
                  )}
                  {stakingBps > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">• Staking:</span>
                      <span>{(stakingBps / 100).toFixed(2)}%</span>
                    </div>
                  )}
                  {marketingBps > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">• Marketing:</span>
                      <span>{(marketingBps / 100).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
                {!hasCustomWallets && totalTokenFeeBps > 0 && (
                  <p className="text-xs text-muted-foreground italic mt-2">
                    All fees will be sent to your connected wallet
                  </p>
                )}
              </>
            )}
            <div className="flex justify-between text-sm font-semibold pt-1 border-t">
              <span>Total Transfer Fees:</span>
              <span>{totalTransferFeePercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Example Transfer</h4>
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer Amount:</span>
              <span>{sampleAmount.toLocaleString()} tokens</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee:</span>
                <span>-{platformFee.toFixed(4)} tokens</span>
              </div>
              {treasuryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Treasury Fee:</span>
                  <span>-{treasuryFee.toFixed(4)} tokens</span>
                </div>
              )}
              {stakingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staking Fee:</span>
                  <span>-{stakingFee.toFixed(4)} tokens</span>
                </div>
              )}
              {marketingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marketing Fee:</span>
                  <span>-{marketingFee.toFixed(4)} tokens</span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm font-semibold pt-2 border-t">
              <span>Recipient Receives:</span>
              <span>{amountAfterFees.toFixed(4)} tokens</span>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Transfer fees are automatically deducted during token transfers. 
            The platform fee supports infrastructure, while token-specific fees go to your designated wallets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
