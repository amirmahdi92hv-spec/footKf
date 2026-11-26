ALTER TABLE teams ADD COLUMN coach_name TEXT;
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_teams_name ON teams(name);
