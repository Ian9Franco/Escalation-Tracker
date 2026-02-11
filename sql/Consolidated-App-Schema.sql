-- ============================================================
-- ESCALATION TRACKER - SCHEMA CONSOLIDADO
-- Última actualización: 2026-02-11 (Phase 3)
-- 
-- Copiar y pegar COMPLETO en Supabase SQL Editor.
-- Seguro de ejecutar múltiples veces (IF NOT EXISTS).
-- ============================================================

-- 1. Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Campañas (Con soporte para Clientes, Metas y Frecuencia)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',               -- 'active', 'paused', 'completed', 'deleted'
  type TEXT,                                   -- 'campaign_budget', 'adset_budget', 'mixed_budget'
  current_week INTEGER DEFAULT 1,
  increment_strategy DECIMAL DEFAULT 0.2,      -- Ej: 0.2 = 20%
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
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow all for now" ON clients;
    DROP POLICY IF EXISTS "Allow all for now" ON campaigns;
    DROP POLICY IF EXISTS "Allow all for now" ON weekly_records;
END $$;

CREATE POLICY "Allow all for now" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON campaigns FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON weekly_records FOR ALL USING (true);

-- 6. Indices para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_records_campaign ON weekly_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_records_week ON weekly_records(week_number);