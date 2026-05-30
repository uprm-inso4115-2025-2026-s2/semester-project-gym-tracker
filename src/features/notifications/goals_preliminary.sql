-- =============================================================
-- Preliminary Schema: goals
-- Issue:#191 - Goals Data Model Definition
-- Module: Feedback
-- Note: This is a design reference only, NOT a migration file.
-- =============================================================

CREATE TABLE goals (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type            TEXT            NOT NULL CHECK (type IN ('daily', 'weekly')),
    title           TEXT            NOT NULL,
    description     TEXT,
    target_value    INTEGER         NOT NULL CHECK (target_value > 0),
    recorded_value  INTEGER         NOT NULL DEFAULT 0 CHECK (recorded_value >= 0),
    status          TEXT            NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    period_date     DATE            NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- Notes
--
-- type:
--   'daily'  -> period_date is the specific calendar day
--   'weekly' -> period_date is the Monday that starts the week
--
-- status:
--   'pending'   -> goal is active, not yet evaluated
--   'completed' -> recorded_value met or exceeded target_value
--   'failed'    -> period ended without reaching target_value
--
-- recorded_value starts at 0 and is updated as user logs progress
-- RLS policies to be defined in further issues.
-- Team members are expected to add to this table as needed for their specific use cases, but should follow the general structure and constraints outlined here.
-- =============================================================

