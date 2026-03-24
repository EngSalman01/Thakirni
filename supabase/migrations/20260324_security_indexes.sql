-- =============================================================================
-- Security & Performance Indexes
-- Created: 2026-03-24
-- Purpose: Index the most-queried fields to speed up RLS policy checks
--          and user data lookups.
-- =============================================================================

-- ─── plans ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plans_user_date
  ON plans (user_id, plan_date);

CREATE INDEX IF NOT EXISTS idx_plans_user_status
  ON plans (user_id, status);

-- ─── reminders ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at
  ON reminders (remind_at, is_sent)
  WHERE is_sent = false;

CREATE INDEX IF NOT EXISTS idx_reminders_user_id
  ON reminders (user_id);

-- ─── memories ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memories_user_id
  ON memories (user_id);

-- ─── user_facts ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_facts_user_category
  ON user_facts (user_id, category);

-- ─── conversations ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_user_created
  ON conversations (user_id, created_at DESC);

-- ─── timeline_events ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_timeline_user_date
  ON timeline_events (user_id, event_date DESC);

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- Fast lookup for subscription tier (used in plan feature checks)
CREATE INDEX IF NOT EXISTS idx_profiles_plan_tier
  ON profiles (plan_tier);

-- ─── subscriptions ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions (status)
  WHERE status = 'active';

-- ─── teams ────────────────────────────────────────────────────────────────────
-- team_members and teams already have indexes from 20260319_complete_schema.sql
-- Only add what is not already covered:
CREATE INDEX IF NOT EXISTS idx_teams_plan_tier
  ON teams (plan_tier);

-- ─── waitlist ─────────────────────────────────────────────────────────────────
-- email is UNIQUE (already indexed by the constraint), skip duplicate index.
-- Index status for admin filtering:
CREATE INDEX IF NOT EXISTS idx_waitlist_status
  ON waitlist (status);
