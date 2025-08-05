'use client';

import { ActionButton } from '@/components/ui/action-button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase, Token } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    Copy,
    ExternalLink,
    Filter,
    Loader2,
    Plus,
    Search
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

function TokensPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const filter = searchParams.get('filter');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'initial_supply'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Fetch tokens from Supabase
  const {
    data: tokensData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<Token[]>({
    queryKey: ['tokens', filter, publicKey, feeFilter, sortBy, sortOrder, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const pageNumber = pageParam as number;
      let query = supabase
        .from('tokens')
        .select('*')
        .range(pageNumber * 20, (pageNumber + 1) * 20 - 1)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply filters
      if (filter === 'mine' && publicKey) {
        query = query.eq('creator', publicKey.toBase58());
      }

      if (feeFilter !== 'all') {
        query = query.eq('fee_enabled', feeFilter === 'yes');
      }

      // Apply search
      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,symbol.ilike.%${searchQuery}%,creator.ilike.%${searchQuery}%,mint_address.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Return tokens directly without fetching from Helius
      // The image_url is already in our database
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      return lastPage?.length === 20 ? pages.length : undefined;
    },
  });

  const allTokens = useMemo(
    () => tokensData?.pages.flatMap((page) => page) || [],
    [tokensData]
  );

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedAddress(`${type}-${text}`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatSupply = (supply: string, decimals: number) => {
    const value = Number(BigInt(supply)) / Math.pow(10, decimals);
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {filter === 'mine' ? 'My Tokens' : 'All Tokens'}
          </h1>
          <ActionButton
            size="lg"
            onClick={() => router.push('/create')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Token
          </ActionButton>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, symbol, creator, or mint address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Select value={feeFilter} onValueChange={(value: 'all' | 'yes' | 'no') => setFeeFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Fee Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tokens</SelectItem>
              <SelectItem value="yes">Fee Enabled</SelectItem>
              <SelectItem value="no">No Fees</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select 
            value={`${sortBy}-${sortOrder}`} 
            onValueChange={(value: string) => {
              const [field, order] = value.split('-');
              setSortBy(field as 'created_at' | 'initial_supply');
              setSortOrder(order as 'asc' | 'desc');
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="initial_supply-desc">Highest Supply</SelectItem>
              <SelectItem value="initial_supply-asc">Lowest Supply</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-destructive">
            Error loading tokens. Please try again.
          </div>
        ) : allTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">No tokens launched yet</h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'mine' 
                ? "You haven't created any tokens yet"
                : "Be the first to launch a token on our platform"}
            </p>
            <ActionButton onClick={() => router.push('/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Token
            </ActionButton>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Mint Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Supply
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fees
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {allTokens.map((token, index) => (
                      <motion.tr
                        key={token.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Token */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {token.image_url ? (
                              <img
                                src={token.image_url}
                                alt={token.name}
                                className="h-10 w-10 rounded-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  // Fallback to first letter if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={cn(
                              "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg",
                              token.image_url ? "hidden" : ""
                            )}>
                              {token.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{token.name}</div>
                              <div className="text-xs text-muted-foreground">{token.symbol}</div>
                            </div>
                          </div>
                        </td>

                        {/* Creator */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => copyToClipboard(token.creator, 'creator')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {token.creator.slice(0, 4)}...{token.creator.slice(-4)}
                            {copiedAddress === `creator-${token.creator}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </td>

                        {/* Mint Address */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => copyToClipboard(token.mint_address, 'mint')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {token.mint_address.slice(0, 4)}...{token.mint_address.slice(-4)}
                            {copiedAddress === `mint-${token.mint_address}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </td>

                        {/* Supply */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatSupply(token.initial_supply, token.decimals)}
                        </td>

                        {/* Fees */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {token.fee_enabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              <Check className="h-3 w-3" />
                              {token.fee_percent}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(token.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ActionButton
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/token/${token.mint_address}`)}
                            >
                              View
                            </ActionButton>
                            <ActionButton
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`https://explorer.solana.com/address/${token.mint_address}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </ActionButton>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="p-4 text-center border-t border-white/10">
                <ActionButton
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  loading={isFetchingNextPage}
                >
                  Load More
                </ActionButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TokensPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <TokensPageContent />
    </Suspense>
  );
} 