export type Tier = "hard" | "medium" | "soft" | "custom";
export type CommitmentType = "boolean" | "numeric";
export type CommitmentCategory =
  | "workout"
  | "diet"
  | "reading"
  | "water"
  | "photo"
  | "custom";
export type ChallengeStatus = "active" | "completed" | "failed";

export interface CommitmentItem {
  id: string;
  challenge_id: string;
  label: string;
  type: CommitmentType;
  target_value: number | null;
  unit: string | null;
  category: CommitmentCategory;
  optional: boolean;
  sort_order: number;
}

export interface Challenge {
  id: string;
  user_id: string;
  tier: Tier;
  start_date: string; // ISO yyyy-mm-dd
  length_days: number;
  status: ChallengeStatus;
  restart_on_miss: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;
  challenge_id: string;
  log_date: string;
  complete: boolean;
  notes: string | null;
}

export interface DailyLogEntry {
  id: string;
  daily_log_id: string;
  commitment_item_id: string;
  bool_value: boolean | null;
  numeric_value: number | null;
}

export interface Profile {
  id: string;
  display_name: string;
  reminders_enabled: boolean;
}

// Draft used in the setup wizard before persistence
export interface CommitmentDraft {
  label: string;
  type: CommitmentType;
  target_value: number | null;
  unit: string | null;
  category: CommitmentCategory;
  optional: boolean;
}
