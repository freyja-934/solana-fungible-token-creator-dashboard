import { config } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';

// Configure BigInt serialization
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Type definitions for our database
export interface Token {
  id: string;
  creator: string;
  name: string;
  symbol: string;
  description?: string;
  image_url?: string;
  metadata_uri?: string;
  mint_address: string;
  fee_enabled: boolean;
  fee_percent?: number;
  fee_wallets?: Array<{
    address: string;
    percent: number;
  }>;
  exempt_wallets?: string[];
  initial_supply: string; // Changed from bigint to string for JSON compatibility
  decimals: number;
  created_at: string;
}

export type TokenInsert = Omit<Token, 'id' | 'created_at'>;

// Helper function to save token to Supabase
export async function saveToken(token: TokenInsert) {
  const { data, error } = await supabase
    .from('tokens')
    .insert(token)
    .select()
    .single();

  if (error) {
    console.error('Error saving token to Supabase:', error);
    throw error;
  }

  return data;
}

// Helper function to get tokens by creator
export async function getTokensByCreator(creatorAddress: string) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('creator', creatorAddress)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tokens:', error);
    throw error;
  }

  return data;
}

// Helper function to get a single token
export async function getToken(mintAddress: string) {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('mint_address', mintAddress)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching token:', error);
    throw error;
  }

  return data;
} 