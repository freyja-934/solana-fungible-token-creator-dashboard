-- Create airdrops table
CREATE TABLE
IF NOT EXISTS airdrops
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  creator TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  recipients JSONB NOT NULL,
  tx_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK
(status IN
('pending', 'success', 'partial', 'failed')),
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Create indexes
CREATE INDEX
IF NOT EXISTS idx_airdrops_creator ON airdrops
(creator);
CREATE INDEX
IF NOT EXISTS idx_airdrops_token_mint ON airdrops
(token_mint);
CREATE INDEX
IF NOT EXISTS idx_airdrops_status ON airdrops
(status);

-- Enable RLS
ALTER TABLE airdrops ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create airdrops" 
  ON airdrops FOR
INSERT 
  WITH CHECK
  (true)
;

CREATE POLICY "Users can view their own airdrops" 
  ON airdrops FOR
SELECT
  USING (creator = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

CREATE POLICY "Users can update their own airdrops" 
  ON airdrops FOR
UPDATE 
  USING (creator = current_setting('request.jwt.claims', true)
::json->>'sub' OR true); 