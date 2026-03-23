-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_code TEXT NOT NULL DEFAULT 'main',
  coord_x FLOAT NOT NULL,
  coord_y FLOAT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_color TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Strokes table
CREATE TABLE IF NOT EXISTS strokes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_code TEXT NOT NULL DEFAULT 'main',
  points JSONB NOT NULL,
  author_id TEXT NOT NULL,
  author_color TEXT NOT NULL,
  stroke_width FLOAT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE strokes ENABLE ROW LEVEL SECURITY;

-- SELECT allowed for everyone
CREATE POLICY "Anyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Anyone can read strokes" ON strokes FOR SELECT USING (true);

-- INSERT allowed (validation done in API layer)
CREATE POLICY "Anyone can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert strokes" ON strokes FOR INSERT WITH CHECK (true);

-- No UPDATE or DELETE policies (enforces permanence)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_coords ON messages (board_code, coord_x, coord_y);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strokes_created ON strokes (created_at DESC);
