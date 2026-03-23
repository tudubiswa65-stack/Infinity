-- Add reply_to_id to allow threading messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id);

-- Index for efficient lookup of replies to a given message
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages (reply_to_id);
