-- Migration: Add Multi-Tenant Schema for Teams/Companies
-- Created: 2026-02-14
-- Description: Transforms Thakirni from single-user to multi-tenant system
--              Adds Teams, Projects, and Team Members while preserving Personal Vault

-- 1. Create TEAMS (Workspaces)
-- We added 'tier' to prepare for future Pro/Enterprise plans
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. thakirni.com/team/acme
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tier TEXT DEFAULT 'starter', -- 'starter' (5 users) or 'pro' (unlimited)
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create MEMBERS (Who is in the team?)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 3. Create PROJECTS (Asana-style containers)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#10b981', 
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UPDATE PLANS (Add Team capabilities)
-- We use DO blocks to avoid errors if columns already exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'team_id') THEN
        ALTER TABLE plans ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
        ALTER TABLE plans ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
        ALTER TABLE plans ADD COLUMN assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. UPDATE MEMORIES (Shared Brain)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memories' AND column_name = 'team_id') THEN
        ALTER TABLE memories ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
        ALTER TABLE memories ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 6. SECURITY (RLS) - The Critical Update
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: I can see teams I belong to
DROP POLICY IF EXISTS "View my teams" ON teams;
CREATE POLICY "View my teams" ON teams
FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid())
);

-- Policy: I can see projects in my teams
DROP POLICY IF EXISTS "View team projects" ON projects;
CREATE POLICY "View team projects" ON projects
FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = projects.team_id AND user_id = auth.uid())
);

-- Policy: HYBRID ACCESS for Plans (Personal + Team)
DROP POLICY IF EXISTS "Users can CRUD their own plans" ON plans;
DROP POLICY IF EXISTS "Access Plans" ON plans;

CREATE POLICY "Access Plans" ON plans
FOR ALL USING (
    user_id = auth.uid() -- My personal plan (Creator)
    OR 
    assigned_to = auth.uid() -- Assigned to me
    OR 
    (team_id IS NOT NULL AND EXISTS ( -- Plan belongs to my team
        SELECT 1 FROM team_members WHERE team_id = plans.team_id AND user_id = auth.uid()
    ))
);

-- Add policies for team_members table
DROP POLICY IF EXISTS "View team members" ON team_members;
CREATE POLICY "View team members" ON team_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
CREATE POLICY "Team admins can manage members" ON team_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role IN ('owner', 'admin')
    )
);

-- Add policy for team members to insert themselves (when invited)
-- CRITICAL: Keep this simple to avoid infinite recursion when creating first member!
DROP POLICY IF EXISTS "Users can join teams when invited" ON team_members;
CREATE POLICY "Users can join teams when invited" ON team_members
FOR INSERT WITH CHECK (
    user_id = auth.uid()  -- Users can only insert themselves
);

-- Add policies for teams table
DROP POLICY IF EXISTS "Team owners can update teams" ON teams;
CREATE POLICY "Team owners can update teams" ON teams
FOR UPDATE USING (
    owner_id = auth.uid()
);

DROP POLICY IF EXISTS "Anyone can create teams" ON teams;
CREATE POLICY "Anyone can create teams" ON teams
FOR INSERT WITH CHECK (
    owner_id = auth.uid()
);

-- Add policies for projects table
DROP POLICY IF EXISTS "Team members can create projects" ON projects;
CREATE POLICY "Team members can create projects" ON projects
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = projects.team_id 
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Team admins can modify projects" ON projects;
CREATE POLICY "Team admins can modify projects" ON projects
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = projects.team_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);
