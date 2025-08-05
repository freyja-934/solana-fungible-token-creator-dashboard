'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FileText, Plus, Trash2, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AirdropRecipient {
  wallet: string;
  amount: string;
}

interface TokenData {
  mint_address: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url?: string;
}

interface AirdropFormProps {
  recipients: AirdropRecipient[];
  setRecipients: (recipients: AirdropRecipient[]) => void;
  selectedToken: string;
  setSelectedToken: (token: string) => void;
}

interface RecipientRow {
  id: string;
  wallet: string;
  amount: string;
}

export function AirdropForm({ 
  setRecipients, 
  setSelectedToken 
}: AirdropFormProps) {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [selectedTokenState, setSelectedTokenState] = useState<TokenData | null>(null);
  const [method, setMethod] = useState<'manual' | 'csv'>('manual');
  const [recipientsState, setRecipientsState] = useState<RecipientRow[]>([
    { id: '1', wallet: '', amount: '' }
  ]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

  // Fetch user's tokens
  useEffect(() => {
    async function fetchTokens() {
      if (!publicKey) return;

      try {
        const { data, error } = await supabase
          .from('tokens')
          .select('*')
          .eq('creator', publicKey.toBase58())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTokens(data || []);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast.error('Failed to load tokens');
      } finally {
        setIsLoadingTokens(false);
      }
    }

    fetchTokens();
  }, [publicKey]);

  // Update parent when recipients change
  useEffect(() => {
    const validRecipients = recipientsState
      .filter(r => r.wallet && r.amount)
      .map(r => ({ wallet: r.wallet, amount: r.amount }));
    setRecipients(validRecipients);
  }, [recipientsState, setRecipients]);

  const handleTokenChange = (tokenMint: string) => {
    const token = tokens.find(t => t.mint_address === tokenMint);
    setSelectedTokenState(token || null);
    setSelectedToken(tokenMint);
  };

  const addRecipient = () => {
    setRecipientsState([...recipientsState, { 
      id: Date.now().toString(), 
      wallet: '', 
      amount: '' 
    }]);
  };

  const removeRecipient = (id: string) => {
    setRecipientsState(recipientsState.filter(r => r.id !== id));
  };

  const updateRecipient = (id: string, field: 'wallet' | 'amount', value: string) => {
    setRecipientsState(recipientsState.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const validateWallet = (wallet: string): boolean => {
    try {
      new PublicKey(wallet);
      return true;
    } catch {
      return false;
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Array<{wallet?: string; address?: string; amount?: string}>;
        const newRecipients: RecipientRow[] = [];
        const errors: string[] = [];

        data.forEach((row, i) => {
          const wallet = row.wallet || row.address || '';
          const amount = row.amount || '';

          if (!wallet || !amount) {
            toast.error(`Row ${i + 1}: Missing wallet or amount`);
            errors.push(`Row ${i + 1}: Missing wallet or amount`);
            return;
          }

          if (!validateWallet(wallet)) {
            toast.error(`Row ${i + 1}: Invalid wallet address`);
            errors.push(`Row ${i + 1}: Invalid wallet address`);
            return;
          }

          const numAmount = parseFloat(amount);
          if (isNaN(numAmount) || numAmount <= 0) {
            toast.error(`Row ${i + 1}: Invalid amount`);
            errors.push(`Row ${i + 1}: Invalid amount`);
            return;
          }

          newRecipients.push({
            id: Date.now().toString() + i,
            wallet,
            amount: amount.toString()
          });
        });

        if (errors.length === 0 && newRecipients.length > 0) {
          setRecipientsState(newRecipients);
          toast.success(`Loaded ${newRecipients.length} recipients from CSV`);
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        toast.error('Failed to parse CSV file');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Token Selector */}
      <div>
        <Label htmlFor="token">Select Token</Label>
        <Select
          value={selectedTokenState?.mint_address || ''}
          onValueChange={handleTokenChange}
          disabled={isLoadingTokens}
        >
          <SelectTrigger id="token" className="mt-2">
            <SelectValue placeholder={isLoadingTokens ? "Loading tokens..." : "Select a token"} />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token.mint_address} value={token.mint_address}>
                <div className="flex items-center gap-2">
                  {token.image_url && (
                    <img 
                      src={token.image_url} 
                      alt={token.symbol}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>{token.name} ({token.symbol})</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {token.mint_address.slice(0, 4)}...{token.mint_address.slice(-4)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Method Tabs */}
      <Tabs value={method} onValueChange={(v) => setMethod(v as 'manual' | 'csv')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        </TabsList>

        {/* Manual Entry */}
        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-3">
            {recipientsState.map((recipient) => (
              <div key={recipient.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Label className="sr-only">Wallet Address</Label>
                  <Input
                    placeholder="Wallet address"
                    value={recipient.wallet}
                    onChange={(e) => updateRecipient(recipient.id, 'wallet', e.target.value)}
                    className={recipient.wallet && !validateWallet(recipient.wallet) ? 'border-red-500' : ''}
                  />
                  {recipient.wallet && !validateWallet(recipient.wallet) && (
                    <p className="text-xs text-red-500 mt-1">Invalid wallet address</p>
                  )}
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={recipient.amount}
                    onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRecipient(recipient.id)}
                  disabled={recipientsState.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            onClick={addRecipient}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recipient
          </Button>
        </TabsContent>

        {/* CSV Upload */}
        <TabsContent value="csv" className="space-y-4">
          <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Upload CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columns: wallet, amount
                </p>
              </div>
              {csvFile && (
                <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                  <FileText className="h-4 w-4" />
                  {csvFile.name}
                </div>
              )}
            </label>
          </div>

          {/* CSV Preview */}
          {recipientsState.length > 0 && method === 'csv' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview (first 10 entries):</p>
              <div className="bg-secondary/10 rounded-lg p-3 space-y-1 text-sm">
                {recipientsState.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {r.wallet.slice(0, 4)}...{r.wallet.slice(-4)}
                    </span>
                    <span>{r.amount} {selectedTokenState?.symbol || 'tokens'}</span>
                  </div>
                ))}
                {recipientsState.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    ...and {recipientsState.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 