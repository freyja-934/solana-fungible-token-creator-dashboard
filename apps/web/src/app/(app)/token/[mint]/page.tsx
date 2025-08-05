'use client';

import { PageContainer } from '@/components/page-container';
import { ActionButton } from '@/components/ui/action-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCard } from '@/components/ui/stats-card';
import { supabase } from '@/lib/supabase/client';
import { getMint } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Coins, Copy, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TokenData {
  address: string;
  decimals: number;
  supply: string;
  mintAuthority?: string;
  freezeAuthority?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  description?: string;
  metadataUri?: string;
}

// Mock data for demonstration - same as dashboard
const mockTokensData: Record<string, TokenData> = {
  'Aqk3kFg8mF9ac7QJrPbVhDKi6BqMQRhQbNwL6MpSxk29': {
    address: 'Aqk3kFg8mF9ac7QJrPbVhDKi6BqMQRhQbNwL6MpSxk29',
    name: 'My Token',
    symbol: 'MTK',
    decimals: 9,
    supply: '1000000',
    logo: '🪙',
    mintAuthority: 'GkDg4Xwk3M5pLHPxjfNuWzPbWZSJqPxKERkPPjp5hQAy',
    freezeAuthority: 'GkDg4Xwk3M5pLHPxjfNuWzPbWZSJqPxKERkPPjp5hQAy',
  },
  'Bqk3yTg9nH8bc9RKsPcWhELj7CrNRShRcNxM7NqTyk29': {
    address: 'Bqk3yTg9nH8bc9RKsPcWhELj7CrNRShRcNxM7NqTyk29',
    name: 'Another Token',
    symbol: 'ATK',
    decimals: 6,
    supply: '500000',
    logo: '💎',
    mintAuthority: 'GkDg4Xwk3M5pLHPxjfNuWzPbWZSJqPxKERkPPjp5hQAy',
    freezeAuthority: undefined,
  },
};

export default function TokenDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { connection } = useConnection();
  const mintAddress = params.mint as string;
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMockData, setIsMockData] = useState(false);

  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet';

  useEffect(() => {
    async function fetchTokenData() {
      if (!mintAddress) return;

      setLoading(true);
      setError(null);

      // First check if it's mock data
      if (mockTokensData[mintAddress]) {
        setTokenData(mockTokensData[mintAddress]);
        setIsMockData(true);
        setLoading(false);
        return;
      }

      try {
        // First try to fetch from Supabase
        const { data: dbToken, error: dbError } = await supabase
          .from('tokens')
          .select('*')
          .eq('mint_address', mintAddress)
          .single();

        let tokenInfo: TokenData = {
          address: mintAddress,
          decimals: 0,
          supply: '0',
        };

        // If found in database, use that data
        if (dbToken && !dbError) {
          tokenInfo = {
            ...tokenInfo,
            name: dbToken.name,
            symbol: dbToken.symbol,
            logo: dbToken.image_url,
            description: dbToken.description,
            decimals: dbToken.decimals,
            supply: (BigInt(dbToken.initial_supply) / BigInt(10 ** dbToken.decimals)).toString(),
            metadataUri: dbToken.metadata_uri,
          };
        }

        // Fetch on-chain data
        const mintPubkey = new PublicKey(mintAddress);
        const mintInfo = await getMint(connection, mintPubkey);

        // Merge with on-chain data
        tokenInfo = {
          ...tokenInfo,
          decimals: mintInfo.decimals,
          supply: (mintInfo.supply / BigInt(10 ** mintInfo.decimals)).toString(),
          mintAuthority: mintInfo.mintAuthority?.toBase58(),
          freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
        };

        // If we don't have name/symbol from DB, try to fetch from metadata URI
        if (!tokenInfo.name && tokenInfo.metadataUri) {
          try {
            const metadataResponse = await fetch(tokenInfo.metadataUri);
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              tokenInfo = {
                ...tokenInfo,
                name: metadata.name || tokenInfo.name,
                symbol: metadata.symbol || tokenInfo.symbol,
                logo: metadata.image || tokenInfo.logo,
                description: metadata.description || tokenInfo.description,
              };
            }
          } catch (metadataError) {
            console.error('Error fetching metadata:', metadataError);
          }
        }

        setTokenData(tokenInfo);
        setIsMockData(false);
      } catch (err) {
        console.error('Error fetching token data:', err);
        setError('Token not found. This may be a mock token or the address is invalid.');
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [mintAddress, connection]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <PageContainer className="min-h-screen">
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Token Details' },
          ]}
        />
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="space-y-4"
          >
            <div className="h-32 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl" />
            <div className="grid gap-6 md:grid-cols-3">
              <div className="h-24 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl" />
              <div className="h-24 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl" />
              <div className="h-24 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl" />
            </div>
          </motion.div>
        </div>
      </PageContainer>
    );
  }

  if (error && !tokenData) {
    return (
      <PageContainer className="min-h-screen">
        <PageHeader
          title="Token Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Token Details' },
          ]}
          actions={
            <ActionButton
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </ActionButton>
          }
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="min-h-screen">
      <PageHeader
        title={tokenData?.name || 'Token Details'}
        description={tokenData?.symbol}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: tokenData?.name || 'Token Details' },
        ]}
        actions={
          <ActionButton
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </ActionButton>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {isMockData && (
          <Alert className="border-primary/50 bg-primary/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Mock Data</AlertTitle>
            <AlertDescription>
              This is demonstration data. Connect to a real token to see blockchain data.
            </AlertDescription>
          </Alert>
        )}

        {/* Token Header */}
        <GlowCard className="p-8">
          <div className="flex items-center gap-6">
            {tokenData?.logo ? (
              tokenData.logo.startsWith('http') || tokenData.logo.startsWith('data:') ? (
                <img
                  src={tokenData.logo}
                  alt={tokenData.name || 'Token'}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    // Fallback to first letter if image fails
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="text-6xl">{tokenData.logo}</div>
              )
            ) : null}
            <div 
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold"
              style={{ display: tokenData?.logo ? 'none' : 'flex' }}
            >
              {tokenData?.symbol?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {tokenData?.name || 'Unknown Token'}
              </h2>
              <p className="text-xl text-muted-foreground mb-2">
                {tokenData?.symbol || 'N/A'}
              </p>
              {tokenData?.description && (
                <p className="text-sm text-muted-foreground">
                  {tokenData.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white/5 px-3 py-1 rounded-lg">
                  {mintAddress}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(mintAddress)}
                >
                  {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </GlowCard>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Supply"
            value={tokenData?.supply || '0'}
            description={`${tokenData?.decimals || 0} decimals`}
            icon={Coins}
          />
          <StatsCard
            title="Mint Authority"
            value={tokenData?.mintAuthority ? 'Enabled' : 'Disabled'}
            description={tokenData?.mintAuthority ? `${tokenData.mintAuthority.slice(0, 4)}...${tokenData.mintAuthority.slice(-4)}` : 'No mint authority'}
          />
          <StatsCard
            title="Freeze Authority"
            value={tokenData?.freezeAuthority ? 'Enabled' : 'Disabled'}
            description={tokenData?.freezeAuthority ? `${tokenData.freezeAuthority.slice(0, 4)}...${tokenData.freezeAuthority.slice(-4)}` : 'No freeze authority'}
          />
        </div>

        {/* Explorer Link */}
        {!isMockData && (
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Explorer</CardTitle>
              <CardDescription>View this token on Solana Explorer</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => window.open(`https://explorer.solana.com/address/${mintAddress}?cluster=${network}`, '_blank')}
              >
                View on Solana Explorer
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </PageContainer>
  );
} 