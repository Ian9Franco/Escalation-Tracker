-- ============================================================
-- ADD USER PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  theme TEXT DEFAULT 'dark',
  last_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Public access to username mapping (needed for login search)
CREATE POLICY "Public can search profiles by username"
ON user_profiles FOR SELECT
USING (true);

-- Function to handle initial profile creation to map username to UID
-- This is optional but helpful if we want to pre-populate.
-- For now, we'll handle creation in the app logic.
