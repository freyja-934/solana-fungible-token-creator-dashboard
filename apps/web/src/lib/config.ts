export const config = {
  // Network Configuration
  network: (process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta') as 'mainnet-beta' | 'devnet' | 'testnet',
  
  // RPC Configuration
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 
    (process.env.NEXT_PUBLIC_HELIUS_API_KEY 
      ? `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
      : 'https://api.mainnet-beta.solana.com'),
  
  // Helius Configuration
  helius: {
    apiKey: process.env.NEXT_PUBLIC_HELIUS_API_KEY || '',
    dasApiUrl: process.env.NEXT_PUBLIC_HELIUS_API_KEY 
      ? `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
      : null,
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Explorer URLs
  explorer: {
    base: 'https://explorer.solana.com',
    getAddressUrl: (address: string) => 
      `https://explorer.solana.com/address/${address}${config.network === 'mainnet-beta' ? '' : `?cluster=${config.network}`}`,
    getTransactionUrl: (signature: string) => 
      `https://explorer.solana.com/tx/${signature}${config.network === 'mainnet-beta' ? '' : `?cluster=${config.network}`}`,
  },
} as const; 