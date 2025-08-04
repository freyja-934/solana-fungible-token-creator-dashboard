import { config } from '@/lib/config';

export interface HeliusTokenMetadata {
  mint: string;
  name?: string;
  symbol?: string;
  uri?: string;
  sellerFeeBasisPoints?: number;
  creators?: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  primarySaleHappened?: boolean;
  isMutable?: boolean;
  tokenStandard?: string;
  collection?: {
    verified: boolean;
    key: string;
  };
  uses?: any;
  programmableConfig?: any;
}

export interface HeliusAsset {
  id: string;
  content: {
    $schema: string;
    json_uri: string;
    files: Array<{
      uri: string;
      cdn_uri?: string;
      mime?: string;
    }>;
    metadata: {
      name: string;
      symbol: string;
      description?: string;
      image?: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    };
  };
  authorities: Array<{
    address: string;
    scopes: string[];
  }>;
  compression: {
    eligible: boolean;
    compressed: boolean;
  };
  grouping: any[];
  royalty: {
    royalty_model: string;
    target: any;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: any;
    ownership_model: string;
    owner: string;
  };
  supply: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: any;
  };
  mutable: boolean;
  burnt: boolean;
}

class HeliusClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.helius.apiKey;
    this.baseUrl = config.helius.dasApiUrl || 'https://mainnet.helius-rpc.com';
  }

  async getAsset(mintAddress: string): Promise<HeliusAsset | null> {
    try {
      const response = await fetch(`${this.baseUrl}/?api-key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-asset',
          method: 'getAsset',
          params: {
            id: mintAddress,
          },
        }),
      });

      const data = await response.json();
      return data.result || null;
    } catch (error) {
      console.error('Error fetching asset from Helius:', error);
      return null;
    }
  }

  async getAssetsByOwner(ownerAddress: string, page = 1, limit = 100): Promise<{
    items: HeliusAsset[];
    total: number;
    page: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/?api-key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-assets-by-owner',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress,
            page,
            limit,
          },
        }),
      });

      const data = await response.json();
      return data.result || { items: [], total: 0, page: 1 };
    } catch (error) {
      console.error('Error fetching assets by owner from Helius:', error);
      return { items: [], total: 0, page: 1 };
    }
  }

  async searchAssets(params: {
    ownerAddress?: string;
    creatorAddress?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: HeliusAsset[];
    total: number;
    page: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/?api-key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'search-assets',
          method: 'searchAssets',
          params: {
            ...params,
            page: params.page || 1,
            limit: params.limit || 100,
          },
        }),
      });

      const data = await response.json();
      return data.result || { items: [], total: 0, page: 1 };
    } catch (error) {
      console.error('Error searching assets from Helius:', error);
      return { items: [], total: 0, page: 1 };
    }
  }
}

export const heliusClient = new HeliusClient(); 