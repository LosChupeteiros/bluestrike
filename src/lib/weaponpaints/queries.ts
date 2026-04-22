import type mysql from "mysql2/promise";
import type { CurrentSkins } from "./types";

interface SkinRow {
  weapon_defindex: number;
  weapon_paint_id: number;
  weapon_wear: number;
  weapon_seed: number;
}

interface KnifeRow {
  knife: string;
}

export async function getCurrentSkins(pool: mysql.Pool, steamId: string): Promise<CurrentSkins> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT weapon_defindex,
            MAX(weapon_paint_id) AS weapon_paint_id,
            MAX(weapon_wear)     AS weapon_wear,
            MAX(weapon_seed)     AS weapon_seed
     FROM wp_player_skins
     WHERE steamid = ?
     GROUP BY weapon_defindex`,
    [steamId]
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

export async function getCurrentKnife(pool: mysql.Pool, steamId: string): Promise<string | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT knife FROM wp_player_knife WHERE steamid = ? LIMIT 1`,
    [steamId]
  );

  const row = (rows as KnifeRow[])[0];
  return row?.knife ?? null;
}

export async function upsertSkin(
  pool: mysql.Pool,
  steamId: string,
  defindex: number,
  paintId: number,
  wear: number,
  seed: number
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sql = `
      INSERT INTO wp_player_skins (steamid, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_team)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE weapon_paint_id = VALUES(weapon_paint_id),
                              weapon_wear = VALUES(weapon_wear),
                              weapon_seed = VALUES(weapon_seed)
    `;
    await conn.execute(sql, [steamId, defindex, paintId, wear, seed, 2]);
    await conn.execute(sql, [steamId, defindex, paintId, wear, seed, 3]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function upsertKnife(
  pool: mysql.Pool,
  steamId: string,
  knifeWeaponName: string
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sql = `
      INSERT INTO wp_player_knife (steamid, knife, weapon_team)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE knife = VALUES(knife)
    `;
    await conn.execute(sql, [steamId, knifeWeaponName, 2]);
    await conn.execute(sql, [steamId, knifeWeaponName, 3]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
