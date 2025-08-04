-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
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
    initial_supply BIGINT NOT NULL,
    decimals INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_tokens_creator ON tokens(creator);
CREATE INDEX idx_tokens_mint_address ON tokens(mint_address);
CREATE INDEX idx_tokens_created_at ON tokens(created_at DESC);
CREATE INDEX idx_tokens_name_symbol ON tokens(name, symbol);

-- Enable Row Level Security
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can read tokens
CREATE POLICY "Tokens are viewable by everyone" 
    ON tokens FOR SELECT 
    USING (true);

-- Only the creator can insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
    ON tokens FOR INSERT 
    WITH CHECK (auth.uid()::TEXT = creator OR auth.uid() IS NOT NULL);

-- Only the creator can update their own tokens
CREATE POLICY "Users can update their own tokens" 
    ON tokens FOR UPDATE 
    USING (auth.uid()::TEXT = creator);

-- Only the creator can delete their own tokens
CREATE POLICY "Users can delete their own tokens" 
    ON tokens FOR DELETE 
    USING (auth.uid()::TEXT = creator);

-- Create function to search tokens
CREATE OR REPLACE FUNCTION search_tokens(search_query TEXT)
RETURNS SETOF tokens AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM tokens
    WHERE 
        name ILIKE '%' || search_query || '%' OR
        symbol ILIKE '%' || search_query || '%' OR
        creator ILIKE '%' || search_query || '%' OR
        mint_address ILIKE '%' || search_query || '%'
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create realtime publication for tokens table
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR TABLE tokens; 