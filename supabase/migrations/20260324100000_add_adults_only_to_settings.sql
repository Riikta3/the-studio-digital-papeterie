-- Add adults_only field to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS adults_only boolean NOT NULL DEFAULT false;
