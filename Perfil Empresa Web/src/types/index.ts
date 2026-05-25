// Tipos del dominio empresa
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_type: 'company';
  avatar?: string;
  company_profile?: CompanyProfile;
}

export interface CompanyProfile {
  company_name: string;
  tax_id?: string;
  industry?: string;
  company_size?: '1-10' | '11-50' | '51-200' | '200+';
  company_website?: string;
  company_logo?: string;
  company_address?: string;
  company_country?: string;
  company_city?: string;
  notify_reports: boolean;
  notify_students: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  email: string;
  phone?: string;
  website?: string;
  country: string;
  city: string;
  logo?: string;
  primary_color: string;
  subscription_plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_students: number;
  max_instructors: number;
  is_active: boolean;
  current_students_count: number;
  current_instructors_count: number;
  days_until_expiration: number;
  is_trial: boolean;
  subscription_end: string;
}

export type MemberStatus = 'enrolled' | 'active' | 'dropped' | 'suspended';

export interface StudentEnrollment {
  id: string;
  student: number;
  student_name: string;
  student_email: string;
  institutional_id: string;
  status: MemberStatus;
  enrollment_date: string;
  instructor_notes?: string;
  // Campos legacy del backend que seguimos recibiendo pero ya no se muestran en empresa.
  overall_grade?: number;
  lessons_completed?: number;
  completion_percentage?: number;
  performance_level?: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';
  is_at_risk?: boolean;
}

// Fila enriquecida para la tabla de Integrantes: enrollment + stats de gamificación.
export interface MemberRow extends StudentEnrollment {
  total_points: number;
  level: number;
  level_name: string;
  level_progress_percentage: number;
  points_to_next_level: number;
  current_streak_days: number;
  longest_streak_days: number;
  badges_count: number;
  challenges_completed: number;
  challenges_in_progress: number;
  rank?: number;
}

export interface StudentPerformanceRow {
  id: string;
  student_name: string;
  student_email: string;
  overall_grade: number;
  completion_percentage: number;
  lessons_completed: number;
  quizzes_passed?: number;
  time_spent_minutes?: number;
}

export interface GradeBucket {
  range: string;
  count: number;
}

export interface Analytics {
  organization: string;
  summary: {
    total_students: number;
    active_students: number;
    students_at_risk: number;
    average_grade: number;
    average_completion: number;
    completion_rate?: number;
    total_time_invested_minutes?: number;
    average_time_per_student_minutes?: number;
    total_quizzes_passed?: number;
    total_backtests_performed?: number;
  };
  performance_distribution: Record<string, number>;
  grade_histogram?: GradeBucket[];
  top_performers?: StudentPerformanceRow[];
  at_risk_students?: StudentPerformanceRow[];
  monthly_enrollments: { month: string; count: number }[];
  subscription: {
    plan: string;
    days_until_expiration: number;
    is_trial: boolean;
    max_students: number;
    max_instructors: number;
  };
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user: User;
}

// ── Retos / Desafíos ─────────────────────────────────────────────────────────
export type ChallengeMetric =
  | 'trades'
  | 'backtests'
  | 'active_days'
  | 'streak_days'
  | 'distinct_assets'
  | 'win_rate'
  | 'sharpe_ratio'
  | 'pnl'
  | 'roi'
  | 'custom';

export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  metric: ChallengeMetric;
  target_value: number;
  unit: string;
  reward_points: number;
  reward_badge_id?: string;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  is_global: boolean;
  assigned_member_ids: string[];
  total_participants: number;
  completed_count: number;
  in_progress_count: number;
  average_progress: number;
}

export interface ChallengeParticipant {
  member_id: string;
  member_name: string;
  member_email: string;
  current_value: number;
  progress_percentage: number;
  status: 'in_progress' | 'completed' | 'failed';
  completed_at?: string;
  rank?: number;
}

// ── Gamificación ─────────────────────────────────────────────────────────────
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  criteria: string;
  holders_count: number;
}

export interface MemberBadge {
  badge_id: string;
  badge: Badge;
  awarded_at: string;
}

export interface MemberStats {
  member_id: string;
  member_name: string;
  member_email: string;
  total_points: number;
  level: number;
  level_name: string;
  points_to_next_level: number;
  level_progress_percentage: number;
  current_streak_days: number;
  longest_streak_days: number;
  badges: MemberBadge[];
  challenges_completed: number;
  challenges_in_progress: number;
  rank: number;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  total_backtests: number;
}

export interface LeaderboardEntry {
  rank: number;
  member_id: string;
  member_name: string;
  member_email: string;
  total_points: number;
  level: number;
  level_name: string;
  badges_count: number;
  current_streak_days: number;
  rank_change?: number;
}

export interface TeamRecord {
  id: string;
  category: 'best_pnl' | 'longest_streak' | 'most_trades' | 'highest_win_rate' | 'fastest_completion';
  category_label: string;
  member_id: string;
  member_name: string;
  value: number;
  unit: string;
  achieved_at: string;
  icon: string;
}
