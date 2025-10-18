-- Add chunks storage to lease_data table
ALTER TABLE lease_data
ADD COLUMN IF NOT EXISTS chunks JSONB,
ADD COLUMN IF NOT EXISTS suggested_questions TEXT[];

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_data_id UUID REFERENCES lease_data(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  messages JSONB NOT NULL, -- Array of {role: 'user'|'assistant', content: string, timestamp: string, sources?: array}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_history_lease_user 
  ON chat_history(lease_data_id, user_email);

-- Create index for user email lookups
CREATE INDEX IF NOT EXISTS idx_chat_history_email 
  ON chat_history(user_email);

-- Add RLS policies
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own chat history
CREATE POLICY "Users can view their own chat history"
  ON chat_history FOR SELECT
  USING (true); -- Public for now, can restrict by user_email later

-- Allow users to insert their own chat history
CREATE POLICY "Users can insert their own chat history"
  ON chat_history FOR INSERT
  WITH CHECK (true); -- Public for now

-- Allow users to update their own chat history
CREATE POLICY "Users can update their own chat history"
  ON chat_history FOR UPDATE
  USING (true); -- Public for now

COMMENT ON TABLE chat_history IS 'Stores chat conversation history between users and their lease documents';
COMMENT ON COLUMN lease_data.chunks IS 'Stores RAG chunks with embeddings for fast rebuild';
COMMENT ON COLUMN lease_data.suggested_questions IS 'AI-generated suggested questions for this lease';

