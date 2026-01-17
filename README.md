# Chasse-Patate / Cycling Race Game

Prototype jouable de course cycliste tour par tour (jeu de plateau), moteur JS + UI Vue 3.

## Sommaire

- Démarrage rapide
- Ce que le projet fait
- Tests
- Structure du projet
- Contribution et workflow
- Roadmap

## Démarrage rapide

Installer :

```bash
cd GAME_CODE
npm install
```

Développement :

```bash
npm run dev
```

Tests :

```bash
npm test
npm run test:ui
```

Build + preview :

```bash
npm run build
npm run preview
```

## Ce que le projet fait

### Gameplay

- Course tour par tour avec déplacement via carte + 1d6 + bonus terrain.
- 5 types de coureurs : grimpeur, puncheur, rouleur, sprinteur, polyvalent.
- 5 terrains : plaine, côte, montagne, descente, sprint.
- Énergie avec seuils (fatigué / épuisé / fringale), récupération (descente, abri, ravitaillement).
- Aspiration/peloton + prise de vent en tête de groupe.
- Événements de course (crevaison, chute, incident mécanique) et météo (clair / vent / pluie).
- Secteurs pavés avec logique dédiée (risque de crevaison, modifs météo/profil).

### Parcours & presets

- 4 classiques : Ardennaise, Lombarde, Riviera, Nord (config + génération de parcours).
- Courses à étapes : profils (équilibré / montagne / sprinteurs) + types d’étape.
- Longueur de course configurable (défaut 80 cases).

### IA

- Multi-équipes (2 à 4) avec joueurs IA/humains.
- Difficultés IA : easy / normal / hard.
- Personnalités IA : attacker / conservative / opportunist / balanced.
- Rôles d’équipe : leader, domestique, free rider (priorités de décision).

### UI

- Setup guidé (type de course, parcours, longueur, équipes, IA).
- Draft d’équipe avec budget, rôles et stats coureurs.
- Plateau de course + mini-carte + barres d’état + historique.
- Règles accessibles depuis l’UI (modal) et indicateurs météo/risque.

## Tests

Couverture actuelle (Vitest) :

| Fichier | Couverture principale |
|---|---|
| `tests/mechanics.test.js` | Vent, énergie, fringale, refuel, règles de fin de tour |
| `tests/cobbles_puncture.test.js` | Pavés + crevaison (énergie, météo, profils) |
| `tests/race_events.test.js` | Événements (chute/crevaison/incident), cooldown, pénalités |
| `tests/race_presets.test.js` | Contraintes de génération des parcours/presets |
| `tests/risk_cues.test.js` | Indicateurs de risque (terrain/météo/exposition) |
| `tests/balance.test.js` | Placeholder |
| `tests/game_engine.test.js` | Placeholder |

Commandes utiles :

```bash
npm test
npm run test:ui
```

Relancer un fichier précis :

```bash
npm test -- tests/race_presets.test.js
```

Exécution ponctuelle (sans UI) :

```bash
npx vitest run
```

Interpréter un échec :

- Vitest affiche le fichier + le nom du test en échec.
- Relancer le même fichier reproduit le comportement (les tests injectent leur RNG quand nécessaire).

## Supabase Auth (profiles)

- Les profils sont crees automatiquement via trigger `auth.users` -> `public.profiles`.
- RLS est active et limitee a l'utilisateur courant (self only).
- Migration: `supabase/migrations/002_profiles_rls_trigger.sql`
- Variables requises: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Structure du projet

```
GAME_CODE/
├── docs/                 # Docs (API.md, ARCHITECTURE.md)
├── public/               # Assets statiques (portraits coureurs)
├── src/
│   ├── components/       # Composants UI Vue (setup, board, panels)
│   ├── composables/      # useGameEngine (orchestration moteur + UI)
│   ├── config/           # Presets, draft, config UI/jeu
│   ├── core/             # Moteur (terrain, énergie, IA, événements, etc.)
│   ├── styles/           # Design system + styles UI
│   ├── ui/               # Vues principales (GameBoard) + règles UI
│   ├── utils/            # Helpers, validators, portraits
│   ├── App.vue
│   └── main.js
├── tests/                # Suites Vitest
├── index.html
├── package.json
└── vite.config.js
```

Docs internes : `docs/ARCHITECTURE.md`, `docs/API.md`.

## Contribution et workflow

- Conventions de branches observées : `feat/*`, `fix/*`.
- Avant commit :

```bash
npm test
```

- Déploiement du subtree (repo GitHub = dossier `GAME_CODE/`) :

```bash
git subtree push --prefix=GAME_CODE gamecode main
```

## Roadmap

- DONE — Presets classiques + génération de parcours.
- DONE — Courses à étapes (profils, types d’étape, classement).
- DONE — Système énergie + récupération + aspiration/vent.
- DONE — Événements de course + météo.
- DONE — Draft d’équipe (budget, stats, portraits).
- DONE — IA multi-équipes (difficulté + personnalités).
- TODO — Animations de déplacement sur le plateau.
- TODO — Renforcer la couverture tests (balance/moteur).
- TODO — Tests UI end-to-end (Playwright).
