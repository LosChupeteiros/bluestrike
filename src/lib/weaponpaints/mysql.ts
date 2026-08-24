import mysql from "mysql2/promise";

let _pool: mysql.Pool | null = null;

/**
 * Verificação de certificado TLS do MySQL.
 *
 * Este banco é a fonte da verdade sobre placar, vencedor e ELO: quem conseguir
 * se pôr no meio dessa conexão decide quem ganhou o campeonato. Por isso a
 * verificação vem LIGADA quando a variável está **ausente** — ambiente novo
 * nasce seguro, em vez de nascer aberto, que era o comportamento anterior.
 *
 * Hoje o opt-out é necessário: o MySQL do Dathost (`burn.dathost.net`) apresenta
 * certificado que não valida — testado, o handshake falha com
 * `HANDSHAKE_SSL_ERROR`. Enquanto for assim, a conexão fica cifrada mas sem
 * autenticar a ponta, o que não protege contra MITM.
 *
 * Os valores de desligamento incluem `false`/`0`/`off` além de `insecure`
 * porque é isso que já está configurado nos ambientes existentes. Exigir
 * exatamente `insecure` derrubaria o placar ao vivo em produção no primeiro
 * deploy — trocar a postura de segurança não pode custar uma quebra silenciosa
 * de quem já estava rodando.
 */
const TLS_OPT_OUT = new Set(["insecure", "false", "0", "off", "no"]);

function shouldVerifyTls(): boolean {
  const bruto = process.env.WEAPONPAINTS_MYSQL_SSL?.trim().toLowerCase();

  // Ausente → verifica (postura segura para ambiente novo).
  if (bruto === undefined || bruto === "") return true;

  // `strict` era o valor que ligava a verificação no esquema antigo.
  if (bruto === "strict" || bruto === "true" || bruto === "1") return true;

  if (TLS_OPT_OUT.has(bruto)) {
    console.warn(
      `[mysql] WEAPONPAINTS_MYSQL_SSL=${bruto} — certificado do MySQL NÃO verificado. ` +
      "A conexão que decide placar e ELO está sujeita a MITM. Corrigir o certificado do servidor."
    );
    return false;
  }

  // Valor desconhecido: não adivinha, verifica.
  console.warn(`[mysql] WEAPONPAINTS_MYSQL_SSL="${bruto}" não reconhecido — verificando certificado.`);
  return true;
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
