-- Multi-tenant sharing and organizations support
-- Based on: PRPs-agentic-eng/PRPs/ai_docs/pgvector_rls_patterns.md
-- Priority: Production Gap #1 (Teams/Sharing ACL)

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization memberships (junction table)
CREATE TABLE IF NOT EXISTS org_memberships (
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- Individual note sharing (fine-grained access)
CREATE TABLE IF NOT EXISTS note_shares (
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('viewer', 'editor')) NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  shared_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (meeting_id, user_id)
);

-- Add org_id to meetings (optional organization membership)
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_user ON note_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_meeting ON note_shares(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(org_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view orgs they belong to"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
        AND org_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can update their orgs"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
        AND org_memberships.user_id = auth.uid()
        AND org_memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Org owners can delete their orgs"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
        AND org_memberships.user_id = auth.uid()
        AND org_memberships.role = 'owner'
    )
  );

-- RLS Policies for org_memberships
CREATE POLICY "Users can view their memberships"
  ON org_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view org members"
  ON org_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can add members"
  ON org_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can remove members"
  ON org_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for note_shares
CREATE POLICY "Users can view shares of their notes"
  ON note_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = note_shares.meeting_id
        AND meetings.owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Owners can share their notes"
  ON note_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = note_shares.meeting_id
        AND meetings.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can revoke shares"
  ON note_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = note_shares.meeting_id
        AND meetings.owner_id = auth.uid()
    )
  );

-- Enhanced meeting access policy (replaces owner-only policy)
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;

CREATE POLICY "Users can view accessible meetings"
  ON meetings FOR SELECT
  USING (
    -- Owner has access
    owner_id = auth.uid() 
    OR
    -- Organization member has access
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = meetings.org_id
        AND om.user_id = auth.uid()
    )
    OR
    -- Explicitly shared with user
    EXISTS (
      SELECT 1 FROM note_shares ns
      WHERE ns.meeting_id = meetings.id
        AND ns.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and editors can update meetings"
  ON meetings FOR UPDATE
  USING (
    -- Owner can update
    owner_id = auth.uid()
    OR
    -- Editors can update
    EXISTS (
      SELECT 1 FROM note_shares ns
      WHERE ns.meeting_id = meetings.id
        AND ns.user_id = auth.uid()
        AND ns.role = 'editor'
    )
  );

-- Segments inherit meeting access
DROP POLICY IF EXISTS "Users can view own segments" ON segments;

CREATE POLICY "Users can view accessible segments"
  ON segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = segments.meeting_id
        AND (
          m.owner_id = auth.uid()
          OR
          EXISTS (
            SELECT 1 FROM org_memberships om
            WHERE om.org_id = m.org_id
              AND om.user_id = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM note_shares ns
            WHERE ns.meeting_id = m.id
              AND ns.user_id = auth.uid()
          )
        )
    )
  );

-- AI suggestions inherit meeting access
CREATE POLICY "Users can view accessible ai_suggestions"
  ON ai_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = ai_suggestions.meeting_id
        AND (
          m.owner_id = auth.uid()
          OR
          EXISTS (
            SELECT 1 FROM org_memberships om
            WHERE om.org_id = m.org_id
              AND om.user_id = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM note_shares ns
            WHERE ns.meeting_id = m.id
              AND ns.user_id = auth.uid()
          )
        )
    )
  );

-- Tasks inherit meeting access
CREATE POLICY "Users can view accessible tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = tasks.meeting_id
        AND (
          m.owner_id = auth.uid()
          OR
          EXISTS (
            SELECT 1 FROM org_memberships om
            WHERE om.org_id = m.org_id
              AND om.user_id = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM note_shares ns
            WHERE ns.meeting_id = m.id
              AND ns.user_id = auth.uid()
          )
        )
    )
  );

-- Function to automatically add creator as owner when creating org
CREATE OR REPLACE FUNCTION add_org_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO org_memberships (org_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_add_org_creator_as_owner
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_org_creator_as_owner();

-- Function to prevent removing last owner
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INT;
BEGIN
  IF OLD.role = 'owner' THEN
    SELECT COUNT(*) INTO owner_count
    FROM org_memberships
    WHERE org_id = OLD.org_id AND role = 'owner' AND user_id != OLD.user_id;
    
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner of an organization';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_last_owner_removal
  BEFORE DELETE ON org_memberships
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Organizations for team-based collaboration';
COMMENT ON TABLE org_memberships IS 'User membership in organizations with roles';
COMMENT ON TABLE note_shares IS 'Individual note sharing with specific users';
COMMENT ON COLUMN meetings.org_id IS 'Optional organization ownership for team meetings';
