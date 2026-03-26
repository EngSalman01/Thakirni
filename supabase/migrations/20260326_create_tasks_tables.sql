-- ── task_columns ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_columns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title       text NOT NULL,
  position    integer NOT NULL DEFAULT 0,
  color       text NOT NULL DEFAULT '#2552ca',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_columns_team_id_idx ON public.task_columns(team_id);

ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_columns: team members" ON public.task_columns;
CREATE POLICY "task_columns: team members"
  ON public.task_columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = task_columns.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- ── tasks ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  column_id   uuid NOT NULL REFERENCES public.task_columns(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  position    integer NOT NULL DEFAULT 0,
  priority    text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date    date,
  status      text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','archived')),
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_team_id_idx     ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS tasks_column_id_idx   ON public.tasks(column_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks(assigned_to);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks: team members" ON public.tasks;
CREATE POLICY "tasks: team members"
  ON public.tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = tasks.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- ── task_comments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments(task_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_comments: task team members" ON public.task_comments;
CREATE POLICY "task_comments: task team members"
  ON public.task_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE t.id = task_comments.task_id
        AND tm.user_id = auth.uid()
    )
  );

-- ── updated_at triggers ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_task_columns_updated_at ON public.task_columns;
CREATE TRIGGER set_task_columns_updated_at
  BEFORE UPDATE ON public.task_columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
