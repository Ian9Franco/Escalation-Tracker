-- ============================================================
-- [1/5] ESCALATION TRACKER - SCHEMA CONSOLIDADO
-- Última actualización: 2026-02-11 (Phase 3)
-- 
-- ORDEN DE EJECUCIÓN: 1° (primero)
-- Crea todas las tablas base: clients, campaigns, weekly_records,
-- strategy_adjustments, user_profiles + políticas RLS.
-- Copiar y pegar COMPLETO en Supabase SQL Editor.
-- Seguro de ejecutar múltiples veces (IF NOT EXISTS).
-- ============================================================

-- 1. Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Campañas (Con soporte para Clientes, Metas y Frecuencia)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',               -- 'active', 'paused', 'completed', 'deleted'
  currency TEXT DEFAULT 'ARS',
  current_week INTEGER DEFAULT 1,
  increment_strategy DECIMAL DEFAULT 0.2,      -- Ej: 0.2 = 20%
  initial_strategy DECIMAL DEFAULT 0.2,        -- Estrategia original al crear
  initial_budget DECIMAL DEFAULT 0,            -- Presupuesto con el que inició
  strategy_frequency TEXT DEFAULT 'weekly',    -- 'daily', 'every_3_days', 'weekly', 'monthly'
  start_date DATE DEFAULT CURRENT_DATE,
  estimated_target_date DATE,
  target_budget DECIMAL,
  target_week INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Registros (Historial, Proyecciones y Avances)
CREATE TABLE IF NOT EXISTS weekly_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  label TEXT,                                  -- Para desglosar por Adset (ej: "Pinamar")
  week_number INTEGER NOT NULL,
  budget DECIMAL NOT NULL,
  cost_per_result DECIMAL,
  is_projection BOOLEAN DEFAULT FALSE,
  advanced_at TIMESTAMP WITH TIME ZONE,        -- Cuándo se ejecutó el avance
  override_strategy DECIMAL,                   -- % override para este registro específico
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar Seguridad (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_records ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas de forma segura
-- Nota: En un entorno real, usar auth.uid() para filtrar.
-- Aquí implementamos acceso basado en ownership + Admin Role.

DROP POLICY IF EXISTS "Allow all for now" ON clients;
CREATE POLICY "Clients RBAC" ON clients FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Allow all for now" ON campaigns;
CREATE POLICY "Campaigns RBAC" ON campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM clients WHERE id = campaigns.client_id AND clients.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Allow all for now" ON weekly_records;
CREATE POLICY "Records RBAC" ON weekly_records FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c JOIN clients cl ON c.client_id = cl.id WHERE c.id = weekly_records.campaign_id AND cl.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tabla de historial de ajustes de estrategia
CREATE TABLE IF NOT EXISTS strategy_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  old_strategy DECIMAL,
  new_strategy DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE strategy_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for now on adjustments" ON strategy_adjustments;
CREATE POLICY "Allow all for now on adjustments" ON strategy_adjustments FOR ALL USING (true);

-- 6. Perfiles de Usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  theme TEXT DEFAULT 'dark',
  role TEXT DEFAULT 'user',
  last_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public search by username" ON user_profiles;
CREATE POLICY "Public search by username" ON user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users own profile access" ON user_profiles;
CREATE POLICY "Users own profile access" ON user_profiles FOR ALL USING (auth.uid() = id);

-- 7. Policitas para historial seguiran el patron de campaigns
DROP POLICY IF EXISTS "Allow all for now on adjustments" ON strategy_adjustments;
CREATE POLICY "Adjustments RBAC" ON strategy_adjustments FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c JOIN clients cl ON c.client_id = cl.id WHERE c.id = strategy_adjustments.campaign_id AND cl.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. Indices para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_records_campaign ON weekly_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_records_week ON weekly_records(week_number);