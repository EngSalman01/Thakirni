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