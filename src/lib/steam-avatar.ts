// A Steam serve o avatar em três tamanhos a partir do mesmo hash:
//   {hash}.jpg         →  32x32
//   {hash}_medium.jpg  →  64x64
//   {hash}_full.jpg    → 184x184  (maior tamanho disponível na API pública)
//
// Perfis antigos foram gravados com `_medium`, e é isso que deixa a foto
// pixelada no header e no perfil. Esta função normaliza qualquer variante para
// `_full` na leitura, sem precisar de migração de dados.

const STEAM_AVATAR_HOSTS = [
  "avatars.steamstatic.com",
  "avatars.akamai.steamstatic.com",
  "avatars.cloudflare.steamstatic.com",
  "avatars.fastly.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "cdn.cloudflare.steamstatic.com",
];

export function normalizeSteamAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!STEAM_AVATAR_HOSTS.some((host) => parsed.hostname.endsWith(host))) {
    return url;
  }

  // .../<hash>[_medium|_full].<ext> → .../<hash>_full.<ext>
  parsed.pathname = parsed.pathname.replace(
    /\/([0-9a-f]{20,})(?:_(?:medium|full))?\.(jpg|jpeg|png)$/i,
    (_match, hash: string, ext: string) => `/${hash}_full.${ext}`
  );

  return parsed.toString();
}
