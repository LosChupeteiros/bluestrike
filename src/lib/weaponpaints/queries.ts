import type mysql from "mysql2/promise";
import type { CurrentSkins, CurrentGlove } from "./types";

interface SkinRow {
  weapon_defindex: number;
  weapon_paint_id: number;
  weapon_wear: number;
  weapon_seed: number;
}

interface KnifeRow {
  knife: string;
}

interface GloveRow {
  weapon_defindex: number;
}

interface MusicRow {
  music_id: number;
}

interface AgentRow {
  agent_ct: string;
  agent_t: string;
}

export async function getCurrentSkins(
  pool: mysql.Pool,
  steamId: string,
  team: number
): Promise<CurrentSkins> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed
     FROM wp_player_skins
     WHERE steamid = ? AND weapon_team = ?`,
    [steamId, team]
  );

  const result: CurrentSkins = {};
  for (const row of rows as SkinRow[]) {
    result[row.weapon_defindex] = {
      paintId: row.weapon_paint_id,
      wear: row.weapon_wear,
      seed: row.weapon_seed,
    };
  }
  return result;
}

export async function getCurrentKnife(
  pool: mysql.Pool,
  steamId: string,
  team: number
): Promise<string | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT knife FROM wp_player_knife WHERE steamid = ? AND weapon_team = ? LIMIT 1`,
    [steamId, team]
  );
  return ((rows as KnifeRow[])[0])?.knife ?? null;
}

export async function getCurrentGlove(
  pool: mysql.Pool,
  steamId: string,
  team: number
): Promise<CurrentGlove | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT weapon_defindex FROM wp_player_gloves WHERE steamid = ? AND weapon_team = ? LIMIT 1`,
    [steamId, team]
  );
  const row = (rows as GloveRow[])[0];
  if (!row) return null;
  return { defindex: row.weapon_defindex };
}

export async function getCurrentMusic(
  pool: mysql.Pool,
  steamId: string,
  team: number
): Promise<number | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT music_id FROM wp_player_music WHERE steamid = ? AND weapon_team = ? LIMIT 1`,
    [steamId, team]
  );
  return ((rows as MusicRow[])[0])?.music_id ?? null;
}

export async function getCurrentAgents(
  pool: mysql.Pool,
  steamId: string
): Promise<{ ct: string | null; t: string | null }> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT agent_ct, agent_t FROM wp_player_agents WHERE steamid = ? LIMIT 1`,
    [steamId]
  );
  const row = (rows as AgentRow[])[0];
  if (!row) return { ct: null, t: null };
  return {
    ct: row.agent_ct === "null" ? null : row.agent_ct,
    t: row.agent_t === "null" ? null : row.agent_t,
  };
}

// DELETE + INSERT ensures exactly one record per (steamid, team, defindex)
// regardless of what unique constraints the table has.
export async function upsertSkin(
  pool: mysql.Pool,
  steamId: string,
  defindex: number,
  paintId: number,
  wear: number,
  seed: number,
  team: number
): Promise<void> {
  await pool.execute(
    `DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = ?`,
    [steamId, team, defindex]
  );
  await pool.execute(
    `INSERT INTO wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [steamId, team, defindex, paintId, wear, seed]
  );
}

export async function deleteSkin(
  pool: mysql.Pool,
  steamId: string,
  defindex: number,
  team: number
): Promise<void> {
  await pool.execute(
    `DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_team = ? AND weapon_defindex = ?`,
    [steamId, team, defindex]
  );
}

export async function upsertKnife(
  pool: mysql.Pool,
  steamId: string,
  knifeWeaponName: string,
  team: number
): Promise<void> {
  await pool.execute(
    `DELETE FROM wp_player_knife WHERE steamid = ? AND weapon_team = ?`,
    [steamId, team]
  );
  await pool.execute(
    `INSERT INTO wp_player_knife (steamid, weapon_team, knife) VALUES (?, ?, ?)`,
    [steamId, team, knifeWeaponName]
  );
}

export async function upsertGlove(
  pool: mysql.Pool,
  steamId: string,
  defindex: number,
  team: number
): Promise<void> {
  await pool.execute(
    `DELETE FROM wp_player_gloves WHERE steamid = ? AND weapon_team = ?`,
    [steamId, team]
  );
  if (defindex === 0) return;
  await pool.execute(
    `INSERT INTO wp_player_gloves (steamid, weapon_team, weapon_defindex) VALUES (?, ?, ?)`,
    [steamId, team, defindex]
  );
}

export async function upsertMusic(
  pool: mysql.Pool,
  steamId: string,
  musicId: number,
  team: number
): Promise<void> {
  await pool.execute(
    `DELETE FROM wp_player_music WHERE steamid = ? AND weapon_team = ?`,
    [steamId, team]
  );
  await pool.execute(
    `INSERT INTO wp_player_music (steamid, weapon_team, music_id) VALUES (?, ?, ?)`,
    [steamId, team, musicId]
  );
}

export async function upsertAgents(
  pool: mysql.Pool,
  steamId: string,
  agentCt: string,
  agentT: string
): Promise<void> {
  await pool.execute(
    `INSERT INTO wp_player_agents (steamid, agent_ct, agent_t)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE agent_ct = VALUES(agent_ct), agent_t = VALUES(agent_t)`,
    [steamId, agentCt, agentT]
  );
}
