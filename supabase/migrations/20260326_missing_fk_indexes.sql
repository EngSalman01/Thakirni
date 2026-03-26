-- Add missing indexes on FK columns and high-traffic query paths
-- These were identified during a database audit on 2026-03-26

-- FK: focus_sessions.plan_id → plans.id
CREATE INDEX IF NOT EXISTS idx_focus_sessions_plan ON public.focus_sessions(plan_id);

-- FK: project_columns.project_id → projects.id
CREATE INDEX IF NOT EXISTS idx_project_columns_project ON public.project_columns(project_id);

-- FK: reminders.plan_id → plans.id
CREATE INDEX IF NOT EXISTS idx_reminders_plan ON public.reminders(plan_id);

-- FK: team_invitations.team_id → teams.id
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON public.team_invitations(team_id);

-- Lookup: team_invitations by email (for invite acceptance)
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);

-- NOTE: whatsapp_messages does not have a connection_id column — index removed

-- Lookup: whatsapp_connections by user_id
CREATE INDEX IF NOT EXISTS idx_wa_connections_user ON public.whatsapp_connections(user_id);

-- Lookup: all notifications by user (complements the partial unread-only index)
CREATE INDEX IF NOT EXISTS idx_notifications_user_all ON public.notifications(user_id, created_at DESC);

-- Lookup: project_tasks by user_id (for assigned tasks)
CREATE INDEX IF NOT EXISTS idx_project_tasks_user ON public.project_tasks(user_id) WHERE user_id IS NOT NULL;

-- Lookup: subscriptions by team_id (for team billing)
CREATE INDEX IF NOT EXISTS idx_subs_team ON public.subscriptions(team_id) WHERE team_id IS NOT NULL;
