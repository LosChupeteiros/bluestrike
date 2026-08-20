# BlueStrike repository napkin

## Execution & validation

1. **[2026-08-20] This repository uses a breaking Next.js build**
   Do instead: read the relevant guide under `node_modules/next/dist/docs/` before framework edits, then run focused lint, TypeScript, build, and representative desktop/mobile browser QA.
2. **[2026-08-20] Preserve user-owned worktree changes**
   Do instead: use `apply_patch` for hand edits, inspect overlapping diffs, and never reset unrelated files.

## Product guardrails

1. **[2026-08-20] BlueStrike identity and behavior are non-negotiable**
   Do instead: preserve the installed typography, logo, cyan brand accent, routes, auth, APIs, real data, and business rules while changing presentation.
2. **[2026-08-20] Real data outranks visual mockups**
   Do instead: derive metrics, prizes, competition states, and rankings from the repository/database; use references only for hierarchy, layout, harmony, and interaction.
3. **[2026-08-20] Visual polish cannot remove product flows**
   Do instead: retain filters, payments, matchmaking, tournament, profile, skins, and live behaviors and validate their existing actions after UI changes.
4. **[2026-08-20] Demo-volume records must remain recoverable**
   Do instead: preserve teams and profiles marked `DEMO:BLUESTRIKE_VOLUME_2026_08`, keep the marker out of public copy, and never delete them during ordinary redesign work.
5. **[2026-08-20] Legacy ELO history can be internally inconsistent**
   Do instead: reconstruct the visual trend from match deltas anchored to the current profile ELO, include the pre-match baseline so the curve agrees with the aggregate delta, and do not trust stale `elo_history.elo_after` values.
6. **[2026-08-20] Match history must use immutable team identity**
   Do instead: persist and partition MatchZy player stats by `team_id`; team names and tags are presentation fields that can change and must only be legacy fallbacks.

## Design direction

1. **[2026-08-20] Avoid visibly generated dashboard compositions**
   Do instead: prefer aligned editorial structures, larger decisive numbers, restrained borders, fewer equal KPI cards, and matching geometry across BlueStrike/FACEIT comparisons.
2. **[2026-08-20] Motion must explain state or progression**
   Do instead: use short counter, reveal, bracket-flow, and page-transition motion with reduced-motion fallbacks; avoid ambient cursor effects, scroll-jacking, decorative stacks without meaning, and looping gimmicks.
3. **[2026-08-20] Theme support must preserve semantic colors**
   Do instead: implement token-driven light/dark themes while keeping BlueStrike cyan, FACEIT orange, success green, live/loss red, and PIX/prize yellow semantically stable.
4. **[2026-08-20] Bento Pro is a component language, not a narrow page frame**
   Do instead: let the application occupy the full viewport while using capsule navigation, layered structural shadows, generous rounded cards, and cohesive object-like compositions in both themes.
5. **[2026-08-20] The home hero must sell competition and instant PIX payout immediately**
   Do instead: keep BlueStrike and FACEIT tournament actions above the fold, use the real hero video under a controlled dark scrim, and emphasize PIX in semantic yellow without sacrificing copy contrast.
6. **[2026-08-20] The home hero ends with actions, not platform counters**
   Do instead: keep the hero sequence as brand → competitive promise → BlueStrike/FACEIT modes → a deliberately separated “Explorar campeonatos”/“Ver ranking” action row; do not restore player, team, tournament, or prize KPI trays there.
7. **[2026-08-20] Bracket and payout are one stateful story**
   Do instead: render semifinals → final → champion → prize processing → PIX sent inside one card and one animation timeline, with connectors anchored to the exact match-row centers and no decorative lines crossing content.
8. **[2026-08-20] Liquid Glass belongs to the navigation shell**
   Do instead: use one adaptive translucent navbar shell with controlled blur, specular inset highlights, strong contrast, and solid fallbacks; distribute links directly in that shell and do not nest them inside a bordered or shaded rail.

## Shell reliability

1. **[2026-08-20] PowerShell treats route brackets specially**
   Do instead: use `-LiteralPath` for paths containing `[id]`, `[slug]`, or other special characters.
