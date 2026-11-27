-- Automatic detection of players appearing in a different team's squad (NOT a confirmed transfer).
CREATE TABLE squad_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id),
  from_team_id INTEGER NOT NULL REFERENCES teams(id),
  to_team_id INTEGER NOT NULL REFERENCES teams(id),
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (player_id, from_team_id, to_team_id)
);
CREATE INDEX idx_squad_changes_at ON squad_changes(detected_at DESC);
