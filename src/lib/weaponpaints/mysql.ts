import mysql from "mysql2/promise";

let _pool: mysql.Pool | null = null;

function getMysqlConfig() {
  const host = process.env.WEAPONPAINTS_MYSQL_HOST;
  const user = process.env.WEAPONPAINTS_MYSQL_USER;
  const password = process.env.WEAPONPAINTS_MYSQL_PASSWORD;
  const database = process.env.WEAPONPAINTS_MYSQL_DATABASE;

  if (!host || !user || !password || !database) {
    return null;
  }

  return {
    host,
    port: parseInt(process.env.WEAPONPAINTS_MYSQL_PORT ?? "3306", 10),
    user,
    password,
    database,
    ssl: { rejectUnauthorized: process.env.WEAPONPAINTS_MYSQL_SSL === "strict" },
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };
}

export function getWeaponPaintsPool(): mysql.Pool | null {
  if (_pool) return _pool;

  const config = getMysqlConfig();
  if (!config) return null;

  _pool = mysql.createPool(config);
  return _pool;
}
