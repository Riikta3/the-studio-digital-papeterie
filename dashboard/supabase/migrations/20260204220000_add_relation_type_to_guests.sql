-- Migration: Add relation_type column to guests table
-- Created: 2026-02-04
-- Description: Adds a relation_type column to track the relationship of each guest to the couple
-- This enables better organization and statistics for the wedding guest list

-- Add the relation_type column (nullable to support existing guests)
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS relation_type TEXT;

-- Add a check constraint to validate relation types
-- This ensures data integrity by only allowing valid relation type values
ALTER TABLE guests
DROP CONSTRAINT IF EXISTS valid_relation_type;

ALTER TABLE guests
ADD CONSTRAINT valid_relation_type 
CHECK (
  relation_type IS NULL OR 
  relation_type IN (
    'partner',      -- Conjoint(e) / Partenaire
    'spouse',       -- Époux/Épouse
    'child',        -- Enfant
    'parent',       -- Parent
    'sibling',      -- Frère/Sœur
    'grandparent',  -- Grand-parent
    'grandchild',   -- Petit-enfant
    'family',       -- Autre famille (oncle, tante, cousin, etc.)
    'friend',       -- Ami(e)
    'colleague',    -- Collègue
    'plus_one',     -- Plus-un / Accompagnant(e)
    'other'         -- Autre
  )
);

-- Add an index for faster queries filtering by relation type
CREATE INDEX IF NOT EXISTS idx_guests_relation_type ON guests(relation_type);

-- Add comment for documentation
COMMENT ON COLUMN guests.relation_type IS 'Type of relationship of the guest to the couple (partner, child, friend, etc.)';
