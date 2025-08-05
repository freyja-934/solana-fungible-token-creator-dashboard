'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, ExternalLink, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Airdrop {
  id: string;
  creator: string;
  token_mint: string;
  recipients: Array<{ wallet: string; amount: string }>;
  tx_ids: string[];
  status: 'pending' | 'success' | 'partial' | 'failed';
  created_at: string;
  token?: {
    name: string;
    symbol: string;
    image_url?: string;
  };
}

interface AirdropHistoryTableProps {
  refreshTrigger?: number;
}

const ITEMS_PER_PAGE = 10;

export function AirdropHistoryTable({ refreshTrigger }: AirdropHistoryTableProps) {
  const { publicKey } = useWallet();
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [tokens, setTokens] = useState<Array<{ mint_address: string; name: string; symbol: string }>>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Copy wallet address
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Fetch user's tokens for filter
  useEffect(() => {
    async function fetchTokens() {
      if (!publicKey) return;

      const { data } = await supabase
        .from('tokens')
        .select('mint_address, name, symbol')
        .eq('creator', publicKey.toBase58())
        .order('created_at', { ascending: false });

      if (data) {
        setTokens(data);
      }
    }

    fetchTokens();
  }, [publicKey]);

  // Fetch airdrops with pagination and filtering
  useEffect(() => {
    async function fetchAirdrops() {
      if (!publicKey) return;

      setLoading(true);
      try {
        let query = supabase
          .from('airdrops')
          .select('*', { count: 'exact' })
          .eq('creator', publicKey.toBase58())
          .order('created_at', { ascending: false });

        // Apply token filter
        if (selectedToken) {
          query = query.eq('token_mint', selectedToken);
        }

        // Apply search filter (search in recipient addresses)
        if (searchQuery) {
          // This is a simplified search - in production you might want to use a more sophisticated search
          query = query.filter('recipients', 'cs', `{"wallet":"${searchQuery}`);
        }

        // Apply pagination
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (!error && data) {
          // Fetch token data for each airdrop
          const tokenMints = [...new Set(data.map(a => a.token_mint))];
          const { data: tokenData } = await supabase
            .from('tokens')
            .select('mint_address, name, symbol, image_url')
            .in('mint_address', tokenMints);

          // Map token data to airdrops
          const airdropsWithTokens = data.map(airdrop => ({
            ...airdrop,
            token: tokenData?.find(t => t.mint_address === airdrop.token_mint)
          }));

          setAirdrops(airdropsWithTokens);
          if (count) {
            setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
          }
        }
      } catch (error) {
        console.error('Error fetching airdrops:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAirdrops();
  }, [publicKey, currentPage, selectedToken, searchQuery, refreshTrigger]);

  const getStatusBadge = (status: Airdrop['status']) => {
    const variants = {
      pending: { className: 'bg-yellow-500/10 text-yellow-500', label: 'Pending' },
      success: { className: 'bg-green-500/10 text-green-500', label: 'Success' },
      partial: { className: 'bg-orange-500/10 text-orange-500', label: 'Partial' },
      failed: { className: 'bg-red-500/10 text-red-500', label: 'Failed' },
    };

    const variant = variants[status];
    return (
      <Badge className={cn('font-medium', variant.className)}>
        {variant.label}
      </Badge>
    );
  };

  const calculateTotalAmount = (recipients: Airdrop['recipients']) => {
    return recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
  };

  if (!publicKey) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Connect your wallet to view airdrop history
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient address..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedToken || 'all'}
          onValueChange={(value) => {
            setSelectedToken(value === 'all' ? '' : value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All tokens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tokens</SelectItem>
            {tokens.map((token) => (
              <SelectItem key={token.mint_address} value={token.mint_address}>
                {token.symbol} - {token.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50 text-left">
              <th className="px-4 py-3 font-medium w-10"></th>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">Recipients</th>
              <th className="px-4 py-3 font-medium">Total Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Transactions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : airdrops.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No airdrops found
                </td>
              </tr>
            ) : (
              airdrops.flatMap((airdrop) => {
                const isExpanded = expandedRows.has(airdrop.id);
                const rows = [];
                
                // Main row
                rows.push(
                  <tr key={airdrop.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(airdrop.id)}
                        className="p-0 h-6 w-6"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {airdrop.token?.image_url && (
                          <img
                            src={airdrop.token.image_url}
                            alt={airdrop.token.name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">{airdrop.token?.symbol}</div>
                          <div className="text-xs text-muted-foreground">{airdrop.token?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{airdrop.recipients.length}</td>
                    <td className="px-4 py-3">
                      {calculateTotalAmount(airdrop.recipients).toLocaleString()} {airdrop.token?.symbol}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(airdrop.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(airdrop.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{airdrop.tx_ids.length}</span>
                        {airdrop.tx_ids.length > 0 && (
                          <a
                            href={`https://explorer.solana.com/tx/${airdrop.tx_ids[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );

                // Expanded recipient details
                if (isExpanded) {
                  rows.push(
                    <tr key={`${airdrop.id}-details`}>
                      <td colSpan={7} className="bg-secondary/10 px-4 py-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium mb-3">Recipient Details</h4>
                          <div className="grid gap-2">
                            {airdrop.recipients.map((recipient, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-8">
                                    #{index + 1}
                                  </span>
                                  <code className="text-sm font-mono">
                                    {recipient.wallet.slice(0, 4)}...{recipient.wallet.slice(-4)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(recipient.wallet)}
                                    className="p-0 h-6 w-6"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {parseFloat(recipient.amount).toLocaleString()} {airdrop.token?.symbol}
                                  </span>
                                  <a
                                    href={`https://explorer.solana.com/address/${recipient.wallet}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                          {airdrop.tx_ids.length > 1 && (
                            <div className="mt-4">
                              <h5 className="text-xs font-medium mb-2">All Transaction IDs</h5>
                              <div className="space-y-1">
                                {airdrop.tx_ids.map((txId, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Tx {index + 1}:</span>
                                    <a
                                      href={`https://explorer.solana.com/tx/${txId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline"
                                    >
                                      {txId.slice(0, 8)}...{txId.slice(-8)}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return rows;
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 