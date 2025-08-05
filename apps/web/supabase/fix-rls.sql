-- Drop existing policies
DROP POLICY
IF EXISTS "Users can insert their own tokens" ON tokens;

-- Create a more permissive insert policy for anonymous users
CREATE POLICY "Anyone can insert tokens" 
    ON tokens FOR
INSERT 
    WITH CHECK
  (true)
;

-- Alternative: If you want to require authentication but allow any authenticated user
-- CREATE POLICY "Authenticated users can insert tokens" 
--     ON tokens FOR INSERT 
--     WITH CHECK (auth.role() = 'authenticated'); 