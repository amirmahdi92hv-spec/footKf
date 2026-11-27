import { db } from "@/db/client";
import { NormEvent, NormPlayer, NormTeamDetail, type ProviderAdapter } from "../providers/types";
import { upsertMapped } from "./store";

async function pidOf(provider: string, entity: string, internalId: number) {
  const r = await db().execute({ sql: "SELECT provider_id FROM provider_mappings WHERE provider=? AND entity=? AND internal_id=?", args: [provider, entity, internalId] });
  return r.rows[0] ? String(r.rows[0].provider_id) : null;
}

/** Events only come from the provider; a failure leaves previously stored events untouched. */
export async function syncMatchDetail(p: ProviderAdapter, matchId: number): Promise<number> {
  if (!p.fetchMatchDetail) return 0;
  const pid = await pidOf(p.name, "match", matchId);
  if (!pid) return 0;
  const raw = (await p.fetchMatchDetail(pid)) as { events?: unknown[] };
  let n = 0;
  for (const e of raw.events ?? []) {
    const ev = NormEvent.safeParse(e);
    if (!ev.success) continue;
    const teamId = ev.data.teamPid ? await db().execute({ sql: "SELECT internal_id FROM provider_mappings WHERE provider=? AND entity='team' AND provider_id=?", args: [p.name, ev.data.teamPid] }) : null;
    const r = await db().execute({
      sql: "INSERT OR IGNORE INTO match_events(match_id, minute, kind, team_id, player_name, related_player_name, provider_key) VALUES (?,?,?,?,?,?,?)",
      args: [matchId, ev.data.minute, ev.data.kind, teamId?.rows[0] ? Number(teamId.rows[0].internal_id) : null, ev.data.player, ev.data.related, `${ev.data.kind}-${ev.data.minute}-${ev.data.player}`],
    });
    n += r.rowsAffected;
  }
  return n;
}

export async function syncTeam(p: ProviderAdapter, teamId: number): Promise<number> {
  if (!p.fetchTeam) return 0;
  const pid = await pidOf(p.name, "team", teamId);
  if (!pid) return 0;
  const t = NormTeamDetail.parse(await p.fetchTeam(pid));
  const row = (await db().execute({ sql: "SELECT name FROM teams WHERE id=?", args: [teamId] })).rows[0];
  if (!row) return 0;
  await upsertMapped(db(), p.name, "team", pid, { name: String(row.name), founded: t.founded, venue: t.venue, coach_name: t.coach, updated_at: new Date().toISOString() });
  let n = 0;
  for (const raw of t.squad) {
    const pl = NormPlayer.safeParse(raw);
    if (!pl.success) continue;
    const prev = (await db().execute({ sql: "SELECT p.id, p.team_id FROM provider_mappings m JOIN players p ON p.id=m.internal_id WHERE m.provider=? AND m.entity='player' AND m.provider_id=?", args: [p.name, pl.data.pid] })).rows[0];
    if (prev && prev.team_id != null && Number(prev.team_id) !== teamId) {
      await db().execute({ sql: "INSERT OR IGNORE INTO squad_changes(player_id, from_team_id, to_team_id) VALUES (?,?,?)", args: [Number(prev.id), Number(prev.team_id), teamId] });
    }
    await upsertMapped(db(), p.name, "player", pl.data.pid, { name: pl.data.name, position: pl.data.position, nationality: pl.data.nationality, birth_date: pl.data.birthDate, team_id: teamId, updated_at: new Date().toISOString() });
    n++;
  }
  return n;
}
