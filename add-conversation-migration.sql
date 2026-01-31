-- Migration: Add conversation threads support for multi-turn brew feedback dialogues
-- Date: 2026-01-31
-- Description: Creates conversation_threads table and adds ai_provider column to equipment table

-- Create conversation_threads table
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brew_session_id UUID REFERENCES brew_sessions(id) ON DELETE CASCADE,

  coffee_hash TEXT NOT NULL,
  brew_method TEXT NOT NULL,

  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ role: 'user'|'assistant', content: string, timestamp: string }]

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_conversation_threads_user ON conversation_threads(user_id);
CREATE INDEX idx_conversation_threads_session ON conversation_threads(brew_session_id);
CREATE INDEX idx_conversation_threads_coffee ON conversation_threads(coffee_hash);

-- Enable Row Level Security
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversation threads"
  ON conversation_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation threads"
  ON conversation_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation threads"
  ON conversation_threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation threads"
  ON conversation_threads FOR DELETE
  USING (auth.uid() = user_id);

-- Add ai_provider column to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'anthropic';

-- Add comment for documentation
COMMENT ON TABLE conversation_threads IS 'Stores multi-turn conversation history for brew feedback dialogues';
COMMENT ON COLUMN conversation_threads.messages IS 'JSONB array of conversation messages with role (user/assistant), content, and timestamp';
COMMENT ON COLUMN equipment.ai_provider IS 'User preferred AI provider: anthropic (Claude) or gemini (Google Gemini)';
