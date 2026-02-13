-- ============================================================
-- ADD ADSET TARGETS TO CAMPAIGNS
--
-- Agrega una columna JSONB para almacenar presupuestos objetivo
-- específicos por conjunto de anuncios/plataforma.
-- ============================================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS adset_targets JSONB DEFAULT '{}'::jsonb;
