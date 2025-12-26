# 🚴 Cycling Race Game - Prototype

Simulateur de jeu de plateau de course cycliste.

## Quick Start

```bash
cd GAME_CODE
npm install
npm run dev
```

Ouvre http://localhost:5173 dans ton navigateur.

## Structure du Code

```
GAME_CODE/
├── src/
│   ├── core/           # Logique métier (framework-agnostic)
│   │   ├── dice.js         # Lancers de dés
│   │   ├── terrain.js      # Types de terrain et bonus
│   │   ├── rider.js        # Gestion des coureurs
│   │   ├── cards.js        # Decks de cartes
│   │   ├── aspiration.js   # Mécanique d'aspiration/peloton
│   │   └── game_engine.js  # Moteur de jeu principal
│   ├── ui/             # Composants Vue.js
│   │   └── GameBoard.vue   # Interface de jeu
│   └── main.js         # Point d'entrée
├── index.html
├── package.json
└── vite.config.js
```

## Mécaniques Implémentées

- ✅ 5 types de coureurs (Grimpeur, Puncheur, Rouleur, Sprinteur, Polyvalent)
- ✅ 5 types de terrain avec bonus/malus
- ✅ Système de dés 2d6 + modificateurs
- ✅ Prise de vent et cartes Pénalité
- ✅ Pioche Bonus sur résultat 7
- ✅ Mécanique de descente (bonus +3, vitesse min 5, risque chute, récupération)
- ✅ Système de fatigue avec seuils
- ✅ Cartes Attaque (+3, 2 par coureur)
- ✅ Aspiration et regroupement automatique

## Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer le serveur de développement |
| `npm run build` | Build de production |
| `npm run test` | Lancer les tests |

## Roadmap

- [ ] Tests unitaires pour le moteur de jeu
- [ ] Mode multi-étapes
- [ ] IA pour adversaires
- [ ] Sauvegarde/chargement
- [ ] Animations
