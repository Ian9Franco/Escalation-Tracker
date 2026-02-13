-- Add paused_until column to support temporary pauses
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'paused_until') THEN
        ALTER TABLE campaigns ADD COLUMN paused_until TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
