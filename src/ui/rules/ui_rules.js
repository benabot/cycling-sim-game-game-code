// Source de vérité: PROJECT_DOCS/01_RULES/RULES_CURRENT.md
export const RulesUIContent = {
  source: 'PROJECT_DOCS/01_RULES/RULES_CURRENT.md',
  drawerLabel: 'Règles',
  cards: [
    {
      id: 'objectif',
      title: 'Objectif',
      icon: 'target',
      lines: [
        "Dernier tour: déclenché par une action joueur (position >= arrivée).",
        "L'aspiration ne déclenche pas le dernier tour.",
        'Vainqueur: plus loin à la fin du dernier tour.'
      ]
    },
    {
      id: 'equipes',
      title: 'Équipes',
      icon: 'team',
      intro: '5 coureurs:',
      profiles: [
        { type: 'climber', label: 'Grimpeur' },
        { type: 'puncher', label: 'Puncheur' },
        { type: 'rouleur', label: 'Rouleur' },
        { type: 'sprinter', label: 'Sprinteur' },
        { type: 'versatile', label: 'Polyvalent' }
      ]
    },
    {
      id: 'sequence',
      title: 'Séquence',
      icon: 'die',
      list: [
        'Choisir une carte',
        'Lancer 1d6',
        'Spécialité (si dispo)',
        'Résoudre le déplacement'
      ],
      listType: 'ordered'
    },
    {
      id: 'main',
      title: 'Cartes & main',
      icon: 'card',
      lines: [
        'Main initiale: +2, +3, +3, +4, +4, +5.',
        'Fin de tour (deck infini): Montagne/Descente +2 ; sinon +2, sous vent +1 (Rouleur +2).',
        'Défausse: toutes les cartes, jamais recyclées.'
      ]
    },
    {
      id: 'energie',
      title: 'Énergie (seuils)',
      icon: 'energy',
      lines: [
        'Déplacement possible si coût <= énergie restante.',
        'Fatigué 26-50: Attaque -1, Spécialité -1.',
        'Épuisé 1-25: Attaque, Spécialité, Bonus spécialité indisponibles (bonus terrain ok).',
        'Fringale 0: Récupérer uniquement (0 déplacement, +10).'
      ]
    },
    {
      id: 'recuperation',
      title: 'Récupération',
      icon: 'shelter',
      lines: [
        'Descente: +1 énergie/case si départ en descente.',
        'Abri: +3 énergie fin de tour si pas sous vent et position finale ≠ montagne.',
        'Ravitaillement: case finale du déplacement, +25 après dépense.',
        'Cumulable: descente, abri, ravito (cap 100).'
      ]
    },
    {
      id: 'cases',
      title: 'Cases (max 4)',
      icon: 'info',
      lines: [
        'Max 4 coureurs par case.',
        'Case pleine: arrêt derrière.',
        'Dans une case: plus à droite = devant.'
      ]
    },
    {
      id: 'aspiration',
      title: 'Aspiration',
      icon: 'aspiration',
      lines: [
        "Écart d'1 case vide: avance d'1 case.",
        'Ne rejoint pas la case du groupe devant.',
        'Pas en descente.',
        'Montagne: possible si le coureur derrière termine hors montagne.',
        'Résolution en cascade (arrière vers avant).'
      ]
    },
    {
      id: 'vent',
      title: 'Vent',
      icon: 'wind',
      lines: [
        'Seul ou plus à droite + case devant vide.',
        'Hors Montagne/Descente, évalué après aspiration.',
        'Carte fin de tour: +1 (+2 rouleur).',
        'Surcoût énergie au tour suivant: +3 / +5 rouleur.'
      ]
    },
    {
      id: 'evenements',
      title: 'Événements',
      icon: 'event',
      lines: [
        '1 tirage max par tour global, cooldown 1 tour.',
        'Crevaison: +2 énergie sur le prochain déplacement.',
        'Chute: mouvement réduit (cap 1 case) +5 énergie.',
        'Incident mécanique: carte fin de tour -1 (min 1).'
      ]
    },
    {
      id: 'meteo',
      title: 'Météo & risque',
      icon: 'wind',
      lines: [
        'Météo: Ciel clair, Vent latéral, Pluie.',
        'Vent: pénalité sous vent ↑, abri ↓.',
        'Pluie: chutes (descente/pavés) ↑, crevaison pavés ↑.',
        'Indice risque: type + niveau + raison (qualitatif).'
      ]
    },
    {
      id: 'paves',
      title: 'Pavés',
      icon: 'cobbles',
      lines: [
        'Overlay sur plat/côte/descente (4–6 secteurs, 4–6 cases).',
        'Risques crevaison/chute ↑; rouleur favorisé, grimpeur pénalisé.',
        'Bonus pavés: Rouleur +1, Sprinteur +1, Grimpeur -1.',
        'Aucun pavé sur montagne/sprint/ravitaillement.'
      ]
    },
    {
      id: 'fin-de-tour',
      title: 'Fin de tour',
      icon: 'info',
      lines: [
        'Ordre: action, aspiration, vent (hors Montagne/Descente), cartes fin de tour, abri.',
        'Ravitaillement: pendant le mouvement, pas en fin de tour.',
        'Abri: +3 énergie si pas sous vent et position finale ≠ montagne.'
      ]
    },
    {
      id: 'classements',
      title: 'Classements',
      icon: 'trophy',
      lines: [
        'Classique: positions finales (droite = devant).',
        'Étapes: retard = écart x 10 s, GC cumulée.',
        'Même position: retard 0.'
      ]
    }
  ],
  bonusTable: {
    title: 'Tableau des bonus terrain',
    headers: [
      { id: 'flat', label: 'Plat', icon: 'flat' },
      { id: 'hill', label: 'Côte', icon: 'hill' },
      { id: 'mountain', label: 'Montagne', icon: 'mountain' },
      { id: 'descent', label: 'Descente', icon: 'descent' },
      { id: 'sprint', label: 'Sprint', icon: 'sprint' },
      { id: 'cobbles', label: 'Pavés', icon: 'cobbles' }
    ],
    rows: [
      { id: 'climber', label: 'Grimpeur', icon: 'climber', values: [0, 1, 2, 2, -1, -1] },
      { id: 'puncher', label: 'Puncheur', icon: 'puncher', values: [0, 2, 1, 2, 0, 0] },
      { id: 'rouleur', label: 'Rouleur', icon: 'rouleur', values: [2, 0, -1, 3, 0, 1] },
      { id: 'sprinter', label: 'Sprinteur', icon: 'sprinter', values: [0, -1, -2, 3, 3, 1] },
      { id: 'versatile', label: 'Polyvalent', icon: 'versatile', values: [0, 0, 0, 2, 0, 0] }
    ]
  }
};
