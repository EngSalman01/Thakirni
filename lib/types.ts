// Memory Types
export interface Memory {
  id: string
  type: 'photo' | 'voice' | 'text'
  hijriDate: string
  gregorianDate: string
  contentUrl: string
  title?: string
  description?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  userId: string
}

// Plan/Reminder Types
export interface Plan {
  id: string
  user_id: string
  title: string
  description?: string
  reminder_date?: string
  is_recurring: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

// User Profile
export interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  preferred_language: 'ar' | 'en'
  timezone: string
  created_at: string
  updated_at: string
}

// Chat Message
export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// Family Member
export interface FamilyMember {
  id: string
  userId: string
  name: string
  relationship: string
  birthDate?: string
  deathDate?: string
  avatarUrl?: string
  notes?: string
}

// Sadaqah Link
export interface SadaqahLink {
  id: string
  userId: string
  memorialId: string
  charityName: string
  charityUrl: string
  totalDonations: number
  isActive: boolean
}
