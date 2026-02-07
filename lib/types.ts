export interface Memory {
  id: string;
  user_id: string;
  content: string;
  tags?: string[] | null;
  is_favorite: boolean;
  created_at: string; // ISO timestamp
}

export interface Plan {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  
  // Timing
  start_datetime: string; // ISO timestamp
  end_datetime?: string | null;
  is_all_day: boolean;
  
  // Context
  location?: string | null;
  participants?: string[] | null;
  
  // Metadata
  category?: 'task' | 'meeting' | 'grocery' | 'work' | 'personal' | 'other';
  recurrence_rule?: string | null;
  color_code?: string | null;
  reminder_minutes?: number | null;
  notification_sent: boolean;
  
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string; // Optional if not in DB select
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
