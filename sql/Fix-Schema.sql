-- ============================================================
-- FIX: Agregar columnas faltantes a tablas existentes
-- Última actualización: 2026-02-11 (Phase 3)
--
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
ALTER TABLE weekly_records ADD COLUMN IF NOT EXISTS advanced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE weekly_records ADD COLUMN IF NOT EXISTS override_strategy DECIMAL;