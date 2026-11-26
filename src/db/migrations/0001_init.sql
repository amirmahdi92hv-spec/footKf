CREATE TABLE competitions (
  id INTEGER PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, name_fa TEXT,
  country TEXT, emblem_url TEXT, type TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE seasons (
  id INTEGER PRIMARY KEY, competition_id INTEGER NOT NULL REFERENCES competitions(id),
  start_date TEXT, end_date TEXT, current_matchday INTEGER, is_current INTEGER NOT NULL DEFAULT 0,
  UNIQUE (competition_id, start_date)
);
CREATE TABLE teams (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, name_fa TEXT, short_name TEXT, tla TEXT,
  country TEXT, crest_url TEXT, founded INTEGER, venue TEXT, updated_at TEXT
);
CREATE TABLE players (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, name_fa TEXT, position TEXT, nationality TEXT,
  birth_date TEXT, team_id INTEGER REFERENCES teams(id), updated_at TEXT
);
CREATE TABLE matches (
  id INTEGER PRIMARY KEY, season_id INTEGER NOT NULL REFERENCES seasons(id),
  competition_id INTEGER NOT NULL REFERENCES competitions(id),
  home_team_id INTEGER REFERENCES teams(id), away_team_id INTEGER REFERENCES teams(id),
  kickoff_utc TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled','live','paused','finished','postponed','cancelled','abandoned')),
  matchday INTEGER, stage TEXT,
  home_score INTEGER, away_score INTEGER, home_ht INTEGER, away_ht INTEGER,
  minute INTEGER, updated_at TEXT, provider_updated_at TEXT
);
CREATE INDEX idx_matches_kickoff ON matches(kickoff_utc);
CREATE INDEX idx_matches_comp_season ON matches(competition_id, season_id, kickoff_utc);
CREATE INDEX idx_matches_status ON matches(status);
CREATE TABLE standings (
  season_id INTEGER NOT NULL REFERENCES seasons(id), team_id INTEGER NOT NULL REFERENCES teams(id),
  position INTEGER NOT NULL, played INTEGER, won INTEGER, draw INTEGER, lost INTEGER,
  goals_for INTEGER, goals_against INTEGER, points INTEGER, form TEXT, updated_at TEXT,
  PRIMARY KEY (season_id, team_id)
);
CREATE TABLE scorers (
  season_id INTEGER NOT NULL REFERENCES seasons(id), player_id INTEGER NOT NULL REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id), goals INTEGER, assists INTEGER, penalties INTEGER, played INTEGER,
  PRIMARY KEY (season_id, player_id)
);
CREATE TABLE match_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, match_id INTEGER NOT NULL REFERENCES matches(id),
  minute INTEGER, kind TEXT NOT NULL CHECK (kind IN ('goal','own_goal','penalty','yellow','red','sub')),
  team_id INTEGER, player_name TEXT, related_player_name TEXT,
  provider_key TEXT NOT NULL, UNIQUE (match_id, provider_key)
);
CREATE TABLE transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, player_id INTEGER REFERENCES players(id),
  player_name TEXT NOT NULL, from_team TEXT, to_team TEXT, transfer_date TEXT,
  status TEXT NOT NULL CHECK (status IN ('confirmed','official_announced')) DEFAULT 'confirmed',
  source_name TEXT NOT NULL, source_url TEXT, verified_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, summary TEXT, source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE, published_at TEXT NOT NULL, competition_id INTEGER, team_id INTEGER,
  is_published INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_news_pub ON news(published_at DESC);
-- Provider identity: never match by name
CREATE TABLE provider_mappings (
  provider TEXT NOT NULL, entity TEXT NOT NULL CHECK (entity IN ('competition','season','team','player','match')),
  provider_id TEXT NOT NULL, internal_id INTEGER NOT NULL,
  PRIMARY KEY (provider, entity, provider_id)
);
CREATE INDEX idx_map_internal ON provider_mappings(entity, internal_id);
-- Field-level manual overrides; win over sync until removed
CREATE TABLE manual_overrides (
  entity TEXT NOT NULL, entity_id INTEGER NOT NULL, field TEXT NOT NULL, value TEXT,
  reason TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entity, entity_id, field)
);
CREATE TABLE sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, job TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running','ok','partial','error')),
  started_at TEXT NOT NULL, finished_at TEXT, upserted INTEGER DEFAULT 0, requests INTEGER DEFAULT 0, error TEXT
);
CREATE TABLE sync_locks (job TEXT PRIMARY KEY, locked_until TEXT NOT NULL);
CREATE TABLE api_usage (
  provider TEXT NOT NULL, day TEXT NOT NULL, requests INTEGER NOT NULL DEFAULT 0, last_remaining INTEGER,
  PRIMARY KEY (provider, day)
);
CREATE TABLE request_cache (
  key TEXT PRIMARY KEY, body TEXT NOT NULL, fetched_at INTEGER NOT NULL, ttl_s INTEGER NOT NULL
);
CREATE TABLE data_freshness (
  scope TEXT PRIMARY KEY, last_ok_at TEXT, last_error TEXT
);
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE favorites (
  user_id INTEGER NOT NULL REFERENCES users(id), entity TEXT NOT NULL CHECK (entity IN ('team','competition')),
  entity_id INTEGER NOT NULL, PRIMARY KEY (user_id, entity, entity_id)
);
CREATE TABLE admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT, detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
