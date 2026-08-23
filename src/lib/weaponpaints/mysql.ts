import mysql from "mysql2/promise";

let _pool: mysql.Pool | null = null;

/**
 * Verificação de certificado TLS do MySQL.
 *
 * Este banco é a fonte da verdade sobre placar, vencedor e ELO: quem conseguir
 * se pôr no meio dessa conexão decide quem ganhou o campeonato. Por isso a
 * verificação vem LIGADA por padrão — ambiente novo que esqueça a variável
 * nasce seguro, em vez de nascer aberto.
 *
 * O opt-out precisa ser a palavra exata `insecure`, para ninguém desligar sem
 * saber o que está fazendo. Hoje ele é necessário: o MySQL do Dathost
 * (burn.dathost.net) apresenta certificado que não valida — testado, o
 * handshake falha com HANDSHAKE_SSL_ERROR. Enquanto for assim, a conexão fica
 * cifrada mas sem autenticar a ponta, o que não protege contra MITM.
 */
function shouldVerifyTls(): boolean {
  const optOut = process.env.WEAPONPAINTS_MYSQL_SSL?.trim().toLowerCase() === "insecure";
  if (optOut) {
    console.warn(
      "[mysql] WEAPONPAINTS_MYSQL_SSL=insecure — certificado do MySQL NÃO verificado. " +
      "A conexão que decide placar e ELO está sujeita a MITM. Corrigir o certificado do servidor."
    );
  }
  return !optOut;
}

const verifyTls = shouldVerifyTls();

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
    ssl: { rejectUnauthorized: verifyTls },
    supportBigNumbers: true,
    bigNumberStrings: true,
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
