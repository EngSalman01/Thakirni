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
}

export interface Profile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  preferred_language: 'ar' | 'en';
  timezone: string;
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

export type SubscriptionType = 'individual' | 'team' | 'company';

export interface Subscription {
  id: string;
  user_id: string;
  team_id?: string | null;
  subscription_type: SubscriptionType;
  status: 'active' | 'inactive' | 'cancelled';
  plan_name: string;
  price?: number | null;
  billing_cycle?: 'monthly' | 'yearly' | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectColumn {
  id: string;
  project_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  column_id: string;
  project_id: string;
  title: string;
  description?: string | null;
  position: number;
  assigned_to?: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

