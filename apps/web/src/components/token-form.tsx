'use client';

import { TransactionState, TransactionStatus } from '@/components/transaction-status';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TokenFormData, tokenFormSchema } from '@/lib/schemas';
import { createSplToken } from '@/lib/solana/token';
import { useUmi } from '@/lib/solana/umi-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function TokenForm() {
  const { connected } = useWallet();
  const umi = useUmi();
  const [isOpen, setIsOpen] = useState(false);
  const [txState, setTxState] = useState<TransactionState>('idle');
  const [txMessage, setTxMessage] = useState<string>('');
  const [txSignature, setTxSignature] = useState<string>('');
  const [createdMint, setCreatedMint] = useState<string>('');

  const form = useForm<TokenFormData>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      name: '',
      symbol: '',
      decimals: 9,
      initialSupply: '',
      freezeAuthority: false,
      mintAuthority: false,
      description: '',
      imageUrl: '',
    },
  });

  const createTokenMutation = useMutation({
    mutationFn: async (data: TokenFormData) => {
      setTxState('loading');
      setTxMessage('Creating your token...');
      
      try {
        const result = await createSplToken(umi, data);
        setCreatedMint(result.mint);
        setTxSignature(result.transactionSignature);
        setTxState('success');
        setTxMessage(`Token created successfully! Mint address: ${result.mint}`);
        form.reset();
        return result;
      } catch (error) {
        setTxState('error');
        setTxMessage(error instanceof Error ? error.message : 'Failed to create token');
        throw error;
      }
    },
  });

  async function onSubmit(data: TokenFormData) {
    await createTokenMutation.mutateAsync(data);
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Your Token</CardTitle>
        <CardDescription>
          Configure and deploy your SPL token on Solana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/token-logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL to your token's logo image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  Advanced Settings
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="mintAuthority"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Retain Mint Authority
                        </FormLabel>
                        <FormDescription>
                          Keep the ability to mint more tokens in the future
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
              </CollapsibleContent>
            </Collapsible>

            <TransactionStatus
              state={txState}
              message={txMessage}
              txSignature={txSignature}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!connected || createTokenMutation.isPending}
            >
              {createTokenMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Token...
                </>
              ) : !connected ? (
                'Connect Wallet to Create Token'
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
      </CardContent>
    </Card>
  );
} 