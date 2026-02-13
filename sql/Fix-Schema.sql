-- ============================================================
-- [2/5] FIX: Agregar columnas faltantes a tablas existentes
-- Última actualización: 2026-02-11 (Phase 3)
--
-- ORDEN DE EJECUCIÓN: 2° (después de Consolidated-App-Schema)
-- Agrega columnas que pueden faltar: strategy_frequency, start_date,
-- estimated_target_date, currency, advanced_at, override_strategy, etc.
-- EJECUTAR en Supabase SQL Editor si ya tenés las tablas creadas.
-- Seguro de ejecutar múltiples veces (IF NOT EXISTS).
-- ============================================================

-- Columnas originales que pueden faltar
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_budget DECIMAL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_week INTEGER;
ALTER TABLE weekly_records ADD COLUMN IF NOT EXISTS label TEXT;

-- Phase 3: Frecuencia, fechas y controles por campaña
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS strategy_frequency TEXT DEFAULT 'weekly';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS estimated_target_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ARS';
ALTER TABLE weekly_records ADD COLUMN IF NOT EXISTS advanced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE weekly_records ADD COLUMN IF NOT EXISTS override_strategy DECIMAL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS initial_budget DECIMAL DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS initial_strategy DECIMAL DEFAULT 0.2;

CREATE TABLE IF NOT EXISTS strategy_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  old_strategy DECIMAL,
  new_strategy DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE strategy_adjustments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for now on adjustments') THEN
    CREATE POLICY "Allow all for now on adjustments" ON strategy_adjustments FOR ALL USING (true);
  END IF;
END $$;
