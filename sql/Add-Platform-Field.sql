-- Add Platform Field to Campaigns
-- Run this migration to add platform support for Meta/Google Ads split

-- Add platform column with 'meta' default (existing campaigns are Meta)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'meta';

-- Update any existing campaigns that don't have a platform set
UPDATE campaigns SET platform = 'meta' WHERE platform IS NULL;

-- Add NOT NULL constraint after backfilling
ALTER TABLE campaigns ALTER COLUMN platform SET NOT NULL;

-- Optional: add a check constraint for valid values
ALTER TABLE campaigns ADD CONSTRAINT campaigns_platform_check 
  CHECK (platform IN ('meta', 'google'));
