# Plano — Seção "Skins" (integração cs2-WeaponPaints) no BlueStrike

> Documento de briefing para uma IA-implementadora (Sonnet) executar a tarefa sem precisar reinterpretar o pedido. Tudo que ela precisa saber está aqui. Identidade do produto vem do `GUIA_IA.md` (dark-first, HUD competitivo, ciano `#00c8ff`, sem cara de IA).

---

## 1. Contexto

O usuário vai instalar o plugin [cs2-WeaponPaints](https://github.com/Nereziel/cs2-WeaponPaints) no servidor CS2 do Dathost. Esse plugin usa **MySQL** próprio (ele cria as tabelas `wp_player_skins`, `wp_player_knife`, `wp_player_gloves`, `wp_player_agents`, `wp_player_music`, `wp_player_pins` automaticamente no primeiro boot).

O repositório do plugin inclui em `WeaponPaints-Website/website/` um **web panel PHP + Bootstrap** para o jogador escolher skin/faca — login via Steam OpenID, leitura/escrita direto no MySQL. O objetivo é **portar esse painel para dentro do site Next.js do BlueStrike**, reutilizando o login Steam que já existe, e adicionando uma nova entrada no header/nav ("Skins").

Infra de MySQL: **não** é Supabase (Supabase é Postgres). O plugin exige MySQL. A decisão de onde hospedar (PlanetScale, Railway, etc.) está fora do escopo deste plano — o código deve assumir variáveis de ambiente `WEAPONPAINTS_MYSQL_*` e funcionar com qualquer provider MySQL externo.

Resultado esperado: jogador loga com Steam (já logado no site → zero fricção), acessa `/skins`, escolhe faca/skins/wear/seed por arma, salva, e o plugin no servidor CS2 aplica no próximo spawn.

---

## 2. Stack do BlueStrike (o que a IA precisa lembrar)

- **Next.js 16.2.3** (App Router, React 19). ⚠️ Breaking changes vs. Next 13/14 — sempre ler `node_modules/next/dist/docs/` antes de assumir API.
- **TypeScript strict**, Tailwind v4, Radix UI, `lucide-react` (ícones).
- **Supabase** como DB principal (profiles). **Não mexer** — o MySQL do WeaponPaints é paralelo.
- **Login Steam OpenID** já implementado:
  - `src/lib/auth/steam.ts` — helpers OpenID.
  - `src/lib/auth/session.ts` — JWT via `jose` no cookie `bluestrike_session` (payload: `{ profileId, steamId }`).
  - `src/app/api/auth/steam/route.ts` + `callback/route.ts` — fluxo de login.
  - `src/lib/profiles.ts::getCurrentProfile()` / `requireCurrentProfile()` — SSR helpers.
- **Header global**: [src/components/layout/header.tsx](../../src/components/layout/header.tsx) — array `navLinks` linhas 13-18. Novo item de nav entra aí. Componente `HeaderWithUser` ([header-with-user.tsx](../../src/components/layout/header-with-user.tsx)) injeta o `user`.
- **Design tokens** (globals.css): `--primary` (#00c8ff), `--background`, `--card`, `--border`, `--foreground`, `--secondary`, `--destructive`. Sempre usar `var(--*)`.
- **UI components disponíveis**: `Button`, `Card`, `Avatar`, `Badge`, `Input`, `Tabs`, `Separator`, `Progress`, `Textarea` em [src/components/ui/](../../src/components/ui/).

---

## 3. O que o PHP original faz (referência de comportamento)

Arquivos em `WeaponPaints-Website/website/`:

- **`index.php`** — página única. Se não logado → botão Steam. Se logado:
  1. Carrega JSON de skins do idioma configurado (`data/skins_<lang>.json`).
  2. Query em `wp_player_skins` para pegar o loadout atual do `steamid`:
     ```sql
     SELECT weapon_defindex, MAX(weapon_paint_id), MAX(weapon_wear), MAX(weapon_seed)
     FROM wp_player_skins
     WHERE steamid = :steamid
     GROUP BY weapon_defindex, steamid
     ```
  3. Query em `wp_player_knife` (faca atual).
  4. Renderiza grid de cards (uma por arma) com `<select>` de skins + modal de wear/seed.
  5. POST `forma=<defindex>-<paint>` + `wear` + `seed` → UPSERT em `wp_player_skins` para `weapon_team=2` E `weapon_team=3` (CT e T).
  6. POST `forma=knife-<defindex>` → UPSERT em `wp_player_knife` para os dois times.
- **`class/utils.php`** — parser do JSON: `skinsFromJson()`, `getWeaponsFromArray()`, `getKnifeTypes()` (filtra defindex de facas: 500, 503, 505-509, 512, 514-523, 525, 526).
- **`class/database.php`** — wrapper PDO MySQL simples.
- **`steamauth/*`** — LightOpenID PHP (não precisa portar; usamos nosso).
- **`data/`** — 28 idiomas × {skins, gloves, agents, stickers, music, keychains, collectibles}. Só usaremos **skins_pt-BR.json** na primeira versão (o resto é opcional/futuro).

### Schema MySQL inferido do PHP

```sql
-- wp_player_skins
-- PK efetiva: (steamid, weapon_defindex, weapon_team)
steamid VARCHAR(64), weapon_defindex INT, weapon_paint_id INT,
weapon_wear FLOAT, weapon_seed INT, weapon_team TINYINT  -- 2=T, 3=CT

-- wp_player_knife
-- PK efetiva: (steamid, weapon_team)
steamid VARCHAR(64), knife VARCHAR(64), weapon_team TINYINT
```

⚠️ A IA **não cria** o schema. O plugin cria automaticamente. Só consumir.

---

## 4. Entregáveis concretos

### 4.1. Nav — novo item "Skins"

Editar [src/components/layout/header.tsx](../../src/components/layout/header.tsx):

```ts
const navLinks = [
  { href: "/live", label: "Ao vivo", badge: null, live: true },
  { href: "/teams", label: "Times", badge: null, live: false },
  { href: "/players", label: "Players", badge: null, live: false },
  { href: "/ranking", label: "Ranking", badge: null, live: false },
  { href: "/skins", label: "Skins", badge: null, live: false }, // novo
];
```

Sem badge, sem destaque visual diferente. Entra naturalmente na lista.

### 4.2. Cliente MySQL do WeaponPaints

Criar `src/lib/weaponpaints/mysql.ts`:

- Pool `mysql2/promise` (adicionar `mysql2` ao `package.json`) — **não** usar Supabase aqui.
- Ler de env: `WEAPONPAINTS_MYSQL_HOST`, `_PORT`, `_USER`, `_PASSWORD`, `_DATABASE`, `_SSL` (boolean opcional).
- Exportar `getWeaponPaintsPool()` singleton. Conexão lazy; falhar cedo com mensagem clara se env faltar.
- **Nada de DDL.** Só SELECT/INSERT/UPDATE.

Queries (em `src/lib/weaponpaints/queries.ts`):

```ts
// Loadout atual por arma (agrupado como o PHP faz)
getCurrentSkins(steamId): Promise<Record<defindex, { paintId, wear, seed }>>
getCurrentKnife(steamId): Promise<{ knife: string } | null>

// UPSERT para weapon_team 2 e 3 em uma transação
upsertSkin(steamId, defindex, paintId, wear, seed): Promise<void>
upsertKnife(steamId, knifeWeaponName): Promise<void>
```

SQL espelhando o PHP (usar `ON DUPLICATE KEY UPDATE`). Um único `upsertSkin` roda os dois INSERTs (team 2 e team 3) numa transação.

**Validação de input** (zod):
- `wear`: float entre 0 e 1.
- `seed`: int entre 0 e 1000.
- `paintId`, `defindex`: int positivo, **precisa existir** no JSON (checar antes de escrever — replicar a guarda `array_key_exists` do PHP).
- `steamId`: obrigatório, vem só da sessão (nunca do body).

### 4.3. Catálogo de skins

Portar o parser. Criar `src/lib/weaponpaints/catalog.ts`:

- Copiar **apenas** `WeaponPaints-Website/website/data/skins_pt-BR.json` para `src/data/weaponpaints/skins_pt-BR.json` (o arquivo tem ~640KB — aceitável como asset estático do app).
- Exportar:
  - `getSkinsByWeapon()` → `Record<defindex, Record<paintId, { weaponName, paintName, imageUrl }>>`
  - `getWeaponList()` → lista ordenada de armas (defindex → default skin) exceto facas.
  - `getKnifeList()` → só os defindex de faca listados em `getskins.php`/`utils.php` (500, 503, 505-509, 512, 514-523, 525, 526) + default id `0`.
- Carregar o JSON com `import` estático (Next bundla; `next.config.ts` já aceita). Ou `fs.readFileSync` no server apenas, e `export const skins = ...` no módulo — sem re-parsear por request.

### 4.4. Página `/skins` (SSR)

Criar `src/app/skins/page.tsx`:

- Server component. Usar `getCurrentProfile()` de `@/lib/profiles`.
- Se sem sessão → redirect `"/auth/login?next=/skins"` (mesmo padrão das outras áreas protegidas; ver `requireCurrentProfile`).
- Se sem MySQL configurado (env ausente) → renderizar estado "Skins indisponíveis" elegante (tom: manutenção, não erro técnico).
- Carregar em paralelo: `getCurrentSkins(steamId)`, `getCurrentKnife(steamId)`, catálogo do módulo.
- Renderizar:
  - Hero curto: título "Skins", copy enxuta ("Escolha suas skins. São aplicadas automaticamente quando você entra no servidor BlueStrike."). **Zero cara de IA** (nada de "🎨 Personalize sua experiência").
  - Card da faca (defindex 0, comportamento especial — knife form).
  - Grid de cards por arma (`grid-cols-2 md:grid-cols-4 lg:grid-cols-6`), cada card com: imagem da skin atual, nome, `<select>` nativo ou `Select` Radix com todas as paints, botão "Ajustes" abrindo dialog com wear/seed.
- Usar componentes existentes: `Card`, `Avatar` (nope, `next/image`), `Button`, Radix `Dialog` (adicionar wrapper shadcn-like em `ui/` se não existir — verificar).

### 4.5. Server actions

Criar `src/app/skins/actions.ts` com `"use server"`:

```ts
export async function saveSkin(formData: FormData) {
  const profile = await requireCurrentProfile("/skins");
  // validar com zod, chamar upsertSkin, revalidatePath("/skins")
}
export async function saveKnife(formData: FormData) { ... }
```

Vantagem: elimina a necessidade de API routes separadas; o PHP original é POST-redirect-GET, server actions fazem exatamente isso. Ao final, `revalidatePath("/skins")` para forçar refetch do loadout.

**Não criar** endpoints `/api/weaponpaints/*` a menos que a IA identifique necessidade genuína de chamada client-side (ex.: preview ao vivo antes de salvar). Server actions cobrem tudo.

### 4.6. Identidade visual

- Fundo da página: `bg-[var(--background)]`. Cards: `bg-[var(--card)] border border-[var(--border)]`. Hover: `hover:border-[var(--primary)]/40`.
- Tipografia: `font-black tracking-tight` para nome da skin selecionada, `text-xs text-[var(--muted-foreground)]` para metadata (wear, seed).
- Imagens: `next/image` com `unoptimized` (raw.githubusercontent.com já é CDN, e o domínio ainda não está em `next.config.ts` — **adicionar** `raw.githubusercontent.com` aos `remotePatterns`).
- Selects: usar Radix `Select` já instalado (`@radix-ui/react-select`) — evitar `<select>` nativo para coerência.
- Wear presets como chips (Factory New, Minimal Wear, etc.), não dropdown — cabe mais ao HUD.
- Seed: input numérico 1-1000, com botão "🎲" (ícone `Dices` do lucide) que randomiza — substitui o JS do PHP.
- Copy em **pt-BR**, direto, sem emoji. Exemplos: "Aplicar", "Padrão", "Sem faca personalizada". Não: "Personalize sua experiência de jogo 🎮".

### 4.7. Env vars

Adicionar ao `.env.example`:

```
# WeaponPaints plugin (MySQL separado — não é Supabase)
WEAPONPAINTS_MYSQL_HOST=
WEAPONPAINTS_MYSQL_PORT=3306
WEAPONPAINTS_MYSQL_USER=
WEAPONPAINTS_MYSQL_PASSWORD=
WEAPONPAINTS_MYSQL_DATABASE=
WEAPONPAINTS_MYSQL_SSL=true
```

---

## 5. Arquivos a criar/modificar (checklist)

**Modificar:**
- [src/components/layout/header.tsx](../../src/components/layout/header.tsx) — adicionar `navLinks` entry.
- [next.config.ts](../../next.config.ts) — `raw.githubusercontent.com` em `images.remotePatterns`.
- [package.json](../../package.json) — dependência `mysql2`.
- [.env.example](../../.env.example) — `WEAPONPAINTS_MYSQL_*`.

**Criar:**
- `src/app/skins/page.tsx`
- `src/app/skins/actions.ts`
- `src/app/skins/components/weapon-card.tsx`
- `src/app/skins/components/knife-card.tsx`
- `src/app/skins/components/skin-dialog.tsx`
- `src/lib/weaponpaints/mysql.ts`
- `src/lib/weaponpaints/queries.ts`
- `src/lib/weaponpaints/catalog.ts`
- `src/lib/weaponpaints/types.ts`
- `src/data/weaponpaints/skins_pt-BR.json` (cópia do arquivo do repo)
- `src/components/ui/dialog.tsx` (se ainda não existir — usar Radix Dialog, que já está nas deps).

**Não tocar:**
- Nada em `WeaponPaints-Website/` — preservar como referência.
- Supabase / profiles / auth existente.
- Header-elo, footer, outras páginas.

---

## 6. Regras de ouro (anti-cara-de-IA)

Consultar [GUIA_IA.md](../../GUIA_IA.md) antes de escrever copy ou escolher tom visual. Resumo aplicado aqui:

- Sem emoji na UI.
- Sem frase genérica ("Personalize sua experiência", "Customize seu arsenal", etc.).
- Sem badge "NEW" no item de nav.
- Sem gradiente/neon gratuito. Manter dark-first, ciano como acento.
- Copy: direto, pt-BR natural, tom de painel operacional.
- Nenhum comentário supérfluo no código. Sem docstring multi-linha.

---

## 7. Verificação / teste end-to-end

1. **Build sem MySQL configurado** (env ausentes): `npm run build` deve passar. A página `/skins` logada deve renderizar o estado "indisponível" sem derrubar o app.
2. **Com MySQL de teste** (pode ser um container local `mysql:8` ou PlanetScale):
   - Rodar o plugin uma vez no servidor CS2 para ele criar as tabelas. Alternativa para dev: rodar manualmente os CREATEs inferidos do PHP.
   - Setar envs em `.env.local`.
   - `npm run dev`, logar com Steam, acessar `/skins`.
   - Selecionar uma AK-47 skin, ajustar wear/seed, aplicar → verificar `SELECT * FROM wp_player_skins WHERE steamid = ?` retorna 2 linhas (team 2 e 3) com os valores corretos.
   - Selecionar faca → `wp_player_knife` 2 linhas.
   - Entrar no servidor CS2, dar `!wp` → skins aplicam no próximo spawn.
3. **Regressão do header**: testar nav em mobile (menu hamburger) e desktop — item "Skins" aparece nos dois, estado ativo funciona em `/skins` e em rotas filhas.
4. **TypeScript**: `npx tsc --noEmit` limpo.
5. **Lint**: `npm run lint` limpo.

---

## 8. Fora de escopo (não fazer agora)

- Gloves, agents, music, pins, stickers, keychains (features extras do plugin — cada um tem tabela e JSON próprios; portáveis no futuro com o mesmo padrão).
- i18n (só pt-BR por ora).
- Provisionamento do MySQL (responsabilidade do usuário: PlanetScale/Railway/etc.).
- Migração do MySQL p/ Supabase (plugin não suporta Postgres).
- Deletar a pasta `WeaponPaints-Website/` — manter como referência viva.
