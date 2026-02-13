-- ============================================================
-- [3/5] ADD USER PROFILES TABLE
--
-- ORDEN DE EJECUCIÓN: 3° (después de Fix-Schema)
-- Crea la tabla user_profiles (si no existe) y sus políticas RLS
-- para acceso por usuario, update, insert y búsqueda pública.
-- Seguro de ejecutar múltiples veces.
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
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Public access to username mapping (needed for login search)
DROP POLICY IF EXISTS "Public can search profiles by username" ON user_profiles;
CREATE POLICY "Public can search profiles by username"
ON user_profiles FOR SELECT
USING (true);

-- Function to handle initial profile creation to map username to UID
-- This is optional but helpful if we want to pre-populate.
-- For now, we'll handle creation in the app logic.
