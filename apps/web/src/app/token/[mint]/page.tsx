'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMint } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TokenData {
  address: string;
  decimals: number;
  supply: string;
  mintAuthority?: string;
  freezeAuthority?: string;
}

export default function TokenDetailPage() {
  const params = useParams();
  const { connection } = useConnection();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mintAddress = params.mint as string;
  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet';

  useEffect(() => {
    async function fetchTokenData() {
      if (!mintAddress) return;

      setLoading(true);
      setError(null);

      try {
        const mintPubkey = new PublicKey(mintAddress);
        const mintInfo = await getMint(connection, mintPubkey);

        setTokenData({
          address: mintAddress,
          decimals: mintInfo.decimals,
          supply: (mintInfo.supply / BigInt(10 ** mintInfo.decimals)).toString(),
          mintAuthority: mintInfo.mintAuthority?.toBase58(),
          freezeAuthority: mintInfo.freezeAuthority?.toBase58(),
        });
      } catch (err) {
        console.error('Error fetching token data:', err);
        setError('Failed to fetch token data. Please check the mint address.');
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [mintAddress, connection]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Token Details</CardTitle>
              <CardDescription>
                Information about your SPL token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Token Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                      {mintAddress}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={copyToClipboard}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600">Copied!</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Decimals</p>
                  <p className="font-mono">{tokenData?.decimals}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Supply</p>
                  <p className="font-mono">{tokenData?.supply}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Network</p>
                  <p className="capitalize">{network}</p>
                </div>
              </div>

              {tokenData?.mintAuthority && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Mint Authority</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all block">
                    {tokenData.mintAuthority}
                  </code>
                </div>
              )}

              {tokenData?.freezeAuthority && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Freeze Authority</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all block">
                    {tokenData.freezeAuthority}
                  </code>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-4">
                <Button asChild>
                  <a
                    href={`https://explorer.solana.com/address/${mintAddress}?cluster=${network}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Explorer
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>

                <Button variant="outline">
                  Mint More Tokens
                </Button>

                <Button variant="outline">
                  Transfer Tokens
                </Button>

                <Button variant="outline" className="text-destructive">
                  Burn Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 