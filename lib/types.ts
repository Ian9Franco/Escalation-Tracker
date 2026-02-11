export interface Client {
  id: string;
  name: string;
  created_at?: string;
}

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'deleted';
  type: 'campaign_budget' | 'adset_budget' | 'mixed_budget';
  current_week: number;
  increment_strategy: number;
  strategy_frequency: 'daily' | 'every_3_days' | 'weekly' | 'monthly';
  start_date?: string;
  estimated_target_date?: string;
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
export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diario',
  every_3_days: 'Cada 3 Días',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

// Helper: frequency to days multiplier
export const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  every_3_days: 3,
  weekly: 7,
  monthly: 30,
};

// Helper: period prefix for display
export const FREQUENCY_PREFIX: Record<string, string> = {
  daily: 'D',
  every_3_days: 'P',
  weekly: 'S',
  monthly: 'M',
};
