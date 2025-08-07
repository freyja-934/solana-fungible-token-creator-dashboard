'use client';

import { FeePreview } from '@/components/fee-preview';
import { TransactionStatus } from '@/components/transaction-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SuccessModal } from '@/components/ui/success-modal';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TokenFormData, tokenFormSchema } from '@/lib/schemas';
import { createCustomTokenWithUmi, TOKEN_FACTORY_PROGRAM_ID } from '@/lib/solana/custom-token';
import { useUmi } from '@/lib/solana/umi-provider';
import { uploadToIPFS } from '@/lib/solana/upload';
import { supabase } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export function TokenForm() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const umi = useUmi();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [txState, setTxState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [txMessage, setTxMessage] = useState('');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [createdMint, setCreatedMint] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [successTokenData, setSuccessTokenData] = useState<{
    name: string;
    symbol: string;
    mintAddress: string;
    imageUrl?: string;
    description?: string;
    transactionSignature?: string;
  } | null>(null);

  const form = useForm<TokenFormData>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      name: '',
      symbol: '',
      decimals: 9,
      initialSupply: '',
      mintAuthority: 'self',
      freezeAuthority: false,
      description: '',
      imageFile: undefined,
      // Fee configuration defaults
      treasuryWallet: '',  // Defaults to connected wallet if empty
      stakingWallet: '',
      marketingWallet: '',
      treasuryBps: 200,  // 2% default to treasury
      stakingBps: 0,
      marketingBps: 0,
    },
  });

  const imageFile = form.watch('imageFile');

  // Handle image preview URL
  useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  const createTokenMutation = useMutation({
    mutationFn: async (data: TokenFormData) => {
      setTxState('loading');
      setTxMessage('Creating your token...');
      
      try {
        // Validate wallet connection
        if (!publicKey) {
          throw new Error('Please connect your wallet first');
        }

        let metadataUri: string | undefined;
        let imageUri: string | undefined;
        
        // Upload image if provided
        if (data.imageFile) {
          setTxMessage('Uploading image to IPFS...');
          
          const metadata = {
            name: data.name,
            symbol: data.symbol,
            description: data.description || '',
          };
          
          const { metadataUri: uploadedUri, imageUri: uploadedImageUri } = await uploadToIPFS(
            data.imageFile,
            metadata
          );
          
          metadataUri = uploadedUri;
          imageUri = uploadedImageUri;
        }
        
        setTxMessage('Creating token with custom program on Solana...');
        const result = await createCustomTokenWithUmi(umi, data, metadataUri);
        setCreatedMint(result.mint.toString());
        setTxSignature(result.transactionSignature);
        
        // Save to Supabase
        try {
          setTxMessage('Saving token information...');
          
          // Calculate total fee percentage
          const totalFeeBps = (data.treasuryBps || 0) + (data.stakingBps || 0) + (data.marketingBps || 0);
          const totalFeePercent = totalFeeBps / 100;
          
          // Build fee wallets object
          const feeWallets = {
            treasury: data.treasuryWallet || publicKey?.toBase58() || '',
            staking: data.stakingWallet || publicKey?.toBase58() || '',
            marketing: data.marketingWallet || publicKey?.toBase58() || '',
            treasuryBps: data.treasuryBps || 0,
            stakingBps: data.stakingBps || 0,
            marketingBps: data.marketingBps || 0,
            isCustomToken: true,
            programId: TOKEN_FACTORY_PROGRAM_ID.toBase58(),
          };
          
          const { error } = await supabase.from('tokens').insert({
            creator: publicKey?.toBase58() || '',
            name: data.name,
            symbol: data.symbol,
            description: data.description,
            image_url: imageUri,
            metadata_uri: metadataUri,
            mint_address: result.mint.toString(),
            fee_enabled: totalFeeBps > 0,
            fee_percent: totalFeePercent,
            fee_wallets: feeWallets,
            initial_supply: (BigInt(parseFloat(data.initialSupply) * Math.pow(10, data.decimals))).toString(),
            decimals: data.decimals,
          });
          
          if (error) {
            console.error('Error saving to Supabase:', error);
            // Don't throw - token was created successfully
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Don't throw - token was created successfully
        }
        
        setTxState('success');
        setTxMessage(`Token created successfully! Mint address: ${result.mint}`);
        
        // Prepare success modal data
        setSuccessTokenData({
          name: data.name,
          symbol: data.symbol,
          mintAddress: createdMint || result.mint.toString(),
          imageUrl: imageUri,
          description: data.description,
          transactionSignature: result.transactionSignature,
        });
        setShowSuccessModal(true);
        
        form.reset();
        return result;
      } catch (error) {
        setTxState('error');
        
        // Extract meaningful error message
        let errorMessage = 'Failed to create token';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Check for common errors
          if (error.message.includes('insufficient')) {
            errorMessage = 'Insufficient SOL balance. Please ensure you have enough SOL for transaction fees.';
          } else if (error.message.includes('User rejected')) {
            errorMessage = 'Transaction was cancelled by the user.';
          } else if (error.message.includes('Wallet not connected')) {
            errorMessage = 'Please connect your wallet first.';
          } else if (error.message.includes('signTransaction')) {
            errorMessage = 'Failed to sign transaction. Please try again or reconnect your wallet.';
          }
        }
        
        setTxMessage(errorMessage);
        throw error;
      }
    },
  });

  async function onSubmit(data: TokenFormData) {
    await createTokenMutation.mutateAsync(data);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Token</CardTitle>
        <CardDescription>
          Configure and deploy your SPL token on Solana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Token" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Symbol</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="MTK" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="decimals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimals</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="9"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of decimal places (0-9)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Supply</FormLabel>
                    <FormControl>
                      <Input placeholder="1000000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Total tokens to mint initially
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your token..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageFile"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Token Logo</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {imagePreviewUrl && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative w-32 h-32 mx-auto rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg"
                        >
                          <img
                            src={imagePreviewUrl}
                            alt="Token logo preview"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      )}
                      <Input 
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                        }}
                        {...field}
                        className="h-auto py-1.5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-colors file:duration-200 cursor-pointer"
                      />
                      {value && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{value.name} ({(value.size / 1024).toFixed(1)} KB)</span>
                        </motion.div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload your token&apos;s logo image (max 5MB, .jpg, .png, .webp, .gif)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  Advanced Settings
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="mintAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mint Authority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mint authority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="self">Keep mint authority (can mint more tokens)</SelectItem>
                          <SelectItem value="none">Revoke mint authority (fixed supply)</SelectItem>
                          <SelectItem value="custom">Transfer to custom address</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Control who can mint additional tokens in the future
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('mintAuthority') === 'custom' && (
                  <FormField
                    control={form.control}
                    name="customMintAuthority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Mint Authority Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter Solana wallet address"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The wallet address that will have mint authority
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="freezeAuthority"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Retain Freeze Authority
                        </FormLabel>
                        <FormDescription>
                          Keep the ability to freeze token accounts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Fee Configuration */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Fee Distribution</h4>
                    <p className="text-xs text-muted-foreground">
                      Configure how transfer fees are distributed. Platform fees (0.1 SOL creation + 0.1% transfers) are applied automatically.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> Empty wallet addresses default to your connected wallet. You can split fees across multiple wallets or keep 100% in treasury.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="treasuryWallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treasury Wallet</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={publicKey ? `Defaults to your wallet (${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)})` : "Solana wallet address"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="treasuryBps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treasury Fee %</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max="10"
                                step="0.01"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || '0') * 100))}
                                value={(field.value / 100).toFixed(2)}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Percentage of each transfer sent to treasury
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stakingWallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Staking Wallet <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={publicKey ? `Leave empty to use your wallet` : "Solana wallet address (optional)"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stakingBps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Staking Fee %</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max="10"
                                step="0.01"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || '0') * 100))}
                                value={(field.value / 100).toFixed(2)}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Percentage of each transfer sent to staking rewards
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="marketingWallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marketing Wallet <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={publicKey ? `Leave empty to use your wallet` : "Solana wallet address (optional)"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="marketingBps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marketing Fee %</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max="10"
                                step="0.01"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || '0') * 100))}
                                value={(field.value / 100).toFixed(2)}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Percentage of each transfer sent to marketing
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Total Fee Display */}
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Transfer Fees:</span>
                        <span className="text-sm font-semibold">
                          {((form.watch('treasuryBps', 0) + form.watch('stakingBps', 0) + form.watch('marketingBps', 0)) / 100).toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plus 0.1% platform fee on all transfers
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Fee Preview */}
            {(form.watch('treasuryBps', 0) > 0 || 
              form.watch('stakingBps', 0) > 0 || 
              form.watch('marketingBps', 0) > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FeePreview
                  treasuryBps={form.watch('treasuryBps', 0)}
                  stakingBps={form.watch('stakingBps', 0)}
                  marketingBps={form.watch('marketingBps', 0)}
                  hasCustomWallets={
                    !!form.watch('treasuryWallet') || 
                    !!form.watch('stakingWallet') || 
                    !!form.watch('marketingWallet')
                  }
                />
              </motion.div>
            )}

            {txState !== 'idle' && (
              <TransactionStatus
                state={txState}
                message={txMessage}
                transactionSignature={txSignature || ''}
                mintAddress={createdMint || ''}
              />
            )}

            <Button 
              type="submit" 
              className="w-full relative overflow-hidden" 
              disabled={createTokenMutation.isPending}
            >
              {createTokenMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Token...
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'linear'
                    }}
                  />
                </>
              ) : (
                'Create Token'
              )}
            </Button>

            {createdMint && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your token has been created!
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`/token/${createdMint}`, '_blank')}
                >
                  View Token Details
                </Button>
              </div>
            )}
          </form>
        </Form>
        
        {successTokenData && (
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              setSuccessTokenData(null);
            }}
            tokenData={successTokenData}
            onViewToken={() => {
              router.push(`/token/${successTokenData.mintAddress}`);
              setShowSuccessModal(false);
            }}
            onGoToDashboard={() => {
              router.push('/dashboard');
              setShowSuccessModal(false);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
} 