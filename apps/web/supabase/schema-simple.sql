-- Simple version - run this first
CREATE TABLE tokens
(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  metadata_uri TEXT,
  mint_address TEXT NOT NULL UNIQUE,
  fee_enabled BOOLEAN DEFAULT false,
  fee_percent DECIMAL,
  fee_wallets JSONB,
  exempt_wallets JSONB,
  initial_supply TEXT NOT NULL,
  decimals INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
); 