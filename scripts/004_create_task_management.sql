-- Create task_columns table for Kanban boards
CREATE TABLE IF NOT EXISTS task_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'bg-slate-50',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES task_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_reminders table (integration with memories)
CREATE TABLE IF NOT EXISTS task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_columns
CREATE POLICY "task_columns_select" ON task_columns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  );

CREATE POLICY "task_columns_insert" ON task_columns
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  );

CREATE POLICY "task_columns_update" ON task_columns
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  );

-- RLS Policies for tasks
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid())
  );

-- RLS Policies for task_comments
CREATE POLICY "task_comments_select" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN team_members tm ON tm.team_id = t.team_id 
      WHERE t.id = task_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "task_comments_insert" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks t 
      JOIN team_members tm ON tm.team_id = t.team_id 
      WHERE t.id = task_id AND tm.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_columns_team ON task_columns(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
