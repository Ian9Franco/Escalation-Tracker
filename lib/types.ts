export type CampaignType = 'campaign_budget' | 'adset_budget' | 'mixed_budget';

export type Platform = 'meta' | 'google';

export type STRATEGY_FREQUENCY = 'daily' | 'every_3_days' | 'weekly' | 'monthly';

export interface Client {
  id: string;
  name: string;
  created_at?: string;
}

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'deleted' | 'archived';
  type: CampaignType;
  platform: Platform;
  currency: string;
  initial_budget: number;
  current_week: number;
  initial_strategy: number;
  increment_strategy: number;
  strategy_frequency: STRATEGY_FREQUENCY;
  start_date?: string;
  estimated_target_date?: string;
  paused_until?: string | null;
  target_budget?: number;
  target_week?: number;
  created_at?: string;
}

export interface WeeklyRecord {
  id: string;
  campaign_id: string;
  label?: string;
  week_number: number;
  budget: number;
  cost_per_result?: number;
  is_projection: boolean;
  advanced_at?: string;
  override_strategy?: number;
  created_at?: string;
}

// Helper: frequency labels
export const FREQUENCY_LABELS: Record<STRATEGY_FREQUENCY, string> = {
  daily: 'Diario',
  every_3_days: 'Cada 3 Días',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

// Helper: frequency to days multiplier
export const FREQUENCY_DAYS: Record<STRATEGY_FREQUENCY, number> = {
  daily: 1,
  every_3_days: 3,
  weekly: 7,
  monthly: 30,
};

// Helper: period prefix for display
export const FREQUENCY_PREFIX: Record<STRATEGY_FREQUENCY, string> = {
  daily: 'E',
  every_3_days: 'E',
  weekly: 'E',
  monthly: 'E',
};

// Helper: platform labels
export const PLATFORM_LABELS: Record<Platform, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
};

export interface StrategyAdjustment {
  id: string;
  campaign_id: string;
  old_strategy: number;
  new_strategy: number;
  created_at: string;
}
