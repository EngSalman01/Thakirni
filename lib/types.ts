export interface Memory {
  id: string;
  type: 'photo' | 'voice' | 'text';
  hijri_date: string;
  gregorian_date: string;
  content_url: string;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  user_id: string;
  // Multi-tenant fields
  team_id?: string | null;
  is_shared?: boolean;
}

export interface Plan {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category?: 'task' | 'grocery' | 'meeting' | 'general';
  location?: string | null;
  reminder_date?: string | null; // ISO date/time string
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  // Multi-tenant fields
  team_id?: string | null;
  project_id?: string | null;
  assigned_to?: string | null;
}

export interface Profile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  preferred_language: 'ar' | 'en';
  timezone: string;
  plan_tier?: 'FREE' | 'INDIVIDUAL' | 'COMPANY';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Multi-tenant types
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TeamTier = 'starter' | 'pro' | 'enterprise';

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  tier: TeamTier;
  subscription_status: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  // Joined data from queries
  profile?: Profile;
}

export interface Project {
  id: string;
  team_id: string;
  name: string;
  description?: string | null;
  color: string;
  created_by: string;
  created_at: string;
}

// Extended Plan type with assignee profile
export interface PlanWithAssignee extends Plan {
  assignee?: Profile | null;
}

