-- ============================================================
-- [2/5] ESCALATION TRACKER - UPDATES 2026-02-13
-- ORDEN DE EJECUCIÓN: 2° (después de Consolidated-App-Schema.sql)
-- Incluye: paused_until y sort_order
-- ============================================================

DO $$ 
BEGIN 
    -- 1. Add paused_until column to support temporary pauses (TIMESTAMP)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'paused_until') THEN
        ALTER TABLE campaigns ADD COLUMN paused_until TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 2. Add sort_order column to support custom ordering (INTEGER, default 0)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'sort_order') THEN
        ALTER TABLE campaigns ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;
