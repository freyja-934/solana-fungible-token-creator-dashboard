-- PostgreSQL schema updates for custom token factory features
-- Note: This file uses PostgreSQL-specific syntax
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS is_custom_token BOOLEAN DEFAULT false;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS program_id TEXT;

-- Fee configuration columns
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS treasury_wallet TEXT;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS staking_wallet TEXT;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS marketing_wallet TEXT;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS treasury_bps INTEGER;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS staking_bps INTEGER;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS marketing_bps INTEGER;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS total_fee_bps INTEGER;

-- Update fee_wallets column to store split fee configuration
COMMENT ON COLUMN tokens.fee_wallets IS 'Legacy column - use individual wallet columns for custom tokens';

-- Create index for custom tokens
CREATE INDEX
IF NOT EXISTS idx_tokens_is_custom ON tokens
(is_custom_token) WHERE is_custom_token = true;
CREATE INDEX
IF NOT EXISTS idx_tokens_program_id ON tokens
(program_id) WHERE program_id IS NOT NULL;

-- Update existing fee configuration to new format
UPDATE tokens 
SET 
  is_custom_token = false,
  program_id = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
WHERE program_id IS NULL;

-- Add RLS policies for new columns (inherits existing policies)

-- Platform fee tracking columns
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS platform_creation_fee_paid BIGINT DEFAULT 0;
ALTER TABLE tokens ADD COLUMN
IF NOT EXISTS platform_transfer_fee_bps INTEGER DEFAULT 0;

-- Create platform fee tracking table
CREATE TABLE
IF NOT EXISTS platform_fees
(
    id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK
(transaction_type IN
('creation', 'transfer')),
    token_mint TEXT,
    fee_amount BIGINT NOT NULL,
    payer_wallet TEXT NOT NULL,
    treasury_wallet TEXT NOT NULL,
    transaction_signature TEXT NOT NULL,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT TIMEZONE
('utc', NOW
())
);

-- Create indexes for platform fees
CREATE INDEX
IF NOT EXISTS idx_platform_fees_type ON platform_fees
(transaction_type);
CREATE INDEX
IF NOT EXISTS idx_platform_fees_token ON platform_fees
(token_mint);
CREATE INDEX
IF NOT EXISTS idx_platform_fees_created ON platform_fees
(created_at DESC);

-- Enable RLS for platform fees
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

-- Platform fee policies - readable by all, writable by service
CREATE POLICY "Platform fees are viewable by everyone" 
    ON platform_fees FOR
SELECT
  USING (true);

-- Function to get platform fee statistics
CREATE OR REPLACE FUNCTION get_platform_fee_stats
()
RETURNS TABLE
(
    total_creation_fees BIGINT,
    total_transfer_fees BIGINT,
    tokens_created_count BIGINT,
    last_fee_collected TIMESTAMP
WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'creation' THEN fee_amount ELSE 0 END), 0) as total_creation_fees,
    COALESCE(SUM(CASE WHEN transaction_type = 'transfer' THEN fee_amount ELSE 0 END), 0) as total_transfer_fees,
    COUNT(DISTINCT token_mint) FILTER
  (WHERE transaction_type = 'creation') as tokens_created_count,
        MAX
  (created_at) as last_fee_collected
    FROM platform_fees;
END;
$$ LANGUAGE plpgsql; 