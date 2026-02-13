-- ============================================================
-- [5/5] ADD PLATFORM FIELD TO CAMPAIGNS
--
-- ORDEN DE EJECUCIÓN: 5° (último)
-- Agrega la columna 'platform' a campaigns con default 'meta'.
-- Backfill de campañas existentes a 'meta' + constraint de validación.
-- Seguro de ejecutar múltiples veces (IF NOT EXISTS).
-- ============================================================

-- Add platform column with 'meta' default (existing campaigns are Meta)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'meta';

-- Update any existing campaigns that don't have a platform set
UPDATE campaigns SET platform = 'meta' WHERE platform IS NULL;

-- Add NOT NULL constraint after backfilling
ALTER TABLE campaigns ALTER COLUMN platform SET NOT NULL;

-- Optional: add a check constraint for valid values
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_platform_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_platform_check 
  CHECK (platform IN ('meta', 'google'));
