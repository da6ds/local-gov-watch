-- Add columns to watchlist table for list management
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Add columns to watchlist_item table for ordering and notes
ALTER TABLE watchlist_item ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE watchlist_item ADD COLUMN IF NOT EXISTS notes text;