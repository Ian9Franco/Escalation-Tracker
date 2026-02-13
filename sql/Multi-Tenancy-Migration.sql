-- ============================================================
-- [4/5] MULTI-TENANCY & ADMIN ROLES MIGRATION
--
-- ORDEN DE EJECUCIÓN: 4° (después de Add-User-Profiles)
-- Agrega roles (admin/user) a user_profiles, user_id a clients,
-- y reconfigura RLS para multi-tenancy con permisos por ownership.
-- Seguro de ejecutar múltiples veces.
-- ============================================================

-- 1. Add role to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Add user_id to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Update existing data (optional but recommended for admins)
-- Assuming the user 'ianp' maps to ian9franco@gmail.com's UID
-- This would be handled by the app, but let's set 'ianp' as admin if exists
UPDATE user_profiles SET role = 'admin' WHERE username = 'ianp';

-- 4. Re-configure RLS for Clients
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for now" ON clients;
DROP POLICY IF EXISTS "Admins see all clients" ON clients;
DROP POLICY IF EXISTS "Users see own clients" ON clients;

-- Admins can see/do everything
CREATE POLICY "Admins see all clients" 
ON clients FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  )
);

-- Users see only their own
CREATE POLICY "Users see own clients" 
ON clients FOR ALL 
USING (auth.uid() = user_id);


-- 5. Re-configure RLS for Campaigns (Cascades from clients)
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for now" ON campaigns;
DROP POLICY IF EXISTS "Admins see all campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users see own campaigns" ON campaigns;

CREATE POLICY "Admins see all campaigns" 
ON campaigns FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Users see own campaigns" 
ON campaigns FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = campaigns.client_id AND clients.user_id = auth.uid()
  )
);

-- 6. Repeat for records and adjustments if needed, 
-- but they generally follow the campaign visibility.
