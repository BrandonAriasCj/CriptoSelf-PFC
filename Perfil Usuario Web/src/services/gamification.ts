import api from './api';

export interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface MyInvitation {
  token: string;
  organization_id: string;
  organization_name: string;
  invitation_type: string;
  invited_by: string | null;
  message: string;
  expires_at: string;
  is_expired: boolean;
}

export interface MyChallenge {
  id: string;
  name: string;
  description: string;
  metric: string;
  target_value: string | number;
  unit: string;
  reward_points: number;
  reward_badge_id?: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  status: 'draft' | 'active' | 'completed' | 'archived';
  start_date: string;
  end_date: string;
  organization_id: string;
  organization_name: string;
  my_progress: {
    current_value: string;
    progress_percentage: number;
    status: 'in_progress' | 'completed' | 'failed';
    completed_at: string | null;
  };
}

export interface MyGamificationStats {
  organization_id: string;
  organization_name: string;
  member_id: number;
  member_name: string;
  total_points: number;
  level: number;
  level_name: string;
  points_to_next_level: number;
  level_progress_percentage: number;
  current_streak_days: number;
  longest_streak_days: number;
  challenges_completed: number;
  challenges_in_progress: number;
  rank?: number;
  total_pnl: string;
  win_rate: string;
  total_trades: number;
  total_backtests: number;
  badges: Array<{
    badge_id: string;
    badge: {
      id: string; name: string; icon: string; rarity: string;
      description: string; criteria: string;
    };
    awarded_at: string;
  }>;
}

export interface MyBadge {
  badge_id: string;
  badge: {
    id: string; name: string; icon: string; rarity: string;
    description: string; criteria: string;
  };
  awarded_at: string;
  organization_id: string;
  organization_name: string;
  challenge_name?: string;
}

export const gamificationService = {
  organizations:    () => api.get<MyOrganization[]>('/me/organizations/').then(r => r.data),
  invitations:      () => api.get<MyInvitation[]>('/me/organizations/invitations/').then(r => r.data),
  acceptInvitation: (token: string) =>
                      api.post(`/me/organizations/invitations/${token}/accept/`).then(r => r.data),
  declineInvitation:(token: string) =>
                      api.post(`/me/organizations/invitations/${token}/decline/`).then(r => r.data),
  challenges:       (status?: string) =>
                      api.get<MyChallenge[]>('/me/challenges/', { params: status ? { status } : {} }).then(r => r.data),
  gamification:     () => api.get<MyGamificationStats[]>('/me/gamification/').then(r => r.data),
  badges:           () => api.get<MyBadge[]>('/me/badges/').then(r => r.data),
};
