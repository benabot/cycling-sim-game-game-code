// Source de vérité: PROJECT_DOCS/01_RULES/RULES_CURRENT.md
export const RulesUIContent = {
  source: 'PROJECT_DOCS/01_RULES/RULES_CURRENT.md',
  drawerLabel: 'Règles du jeu',
  cards: [
    {
      id: 'objectif',
      title: 'But du jeu',
      icon: 'target',
      lines: [
        "Amenez vos coureurs le plus loin possible avant la fin de la course.",
        "Le dernier tour se déclenche quand un coureur franchit la ligne d'arrivée par son action (pas par aspiration).",
        "Le vainqueur est le coureur ayant parcouru la plus grande distance à la fin du dernier tour."
      ]
    },
    {
      id: 'equipes',
      title: 'Votre équipe',
      icon: 'team',
      intro: 'Vous dirigez 5 coureurs aux spécialités différentes :',
      profiles: [
        { type: 'climber', label: 'Grimpeur' },
        { type: 'puncher', label: 'Puncheur' },
        { type: 'rouleur', label: 'Rouleur' },
        { type: 'sprinter', label: 'Sprinteur' },
        { type: 'versatile', label: 'Polyvalent' }
      ],
      footer: "Chaque profil excelle sur certains terrains et reçoit des bonus adaptés."
    },
    {
      id: 'sequence',
      title: "Déroulement d'un tour",
      icon: 'die',
      list: [
        'Choisissez une carte de votre main (+2 à +5) ou une carte Attaque (+6)',
        'Lancez le dé pour ajouter 1 à 6 cases',
        'Activez votre carte Spécialité (+2) si le terrain correspond à votre profil',
        'Votre coureur avance du total : carte + dé + bonus terrain + spécialité'
      ],
      listType: 'ordered'
    },
    {
      id: 'main',
      title: 'Gestion des cartes',
      icon: 'card',
      lines: [
        "Chaque coureur commence avec 6 cartes : +2, +3, +3, +4, +4, +5.",
        "Les cartes jouées vont en défausse et ne reviennent jamais.",
        "À chaque fin de tour, vous recevez une nouvelle carte (+2 normalement, ou +1 si vous êtes exposé au vent).",
        "Astuce : gardez vos grosses cartes pour les moments décisifs !"
      ]
    },
    {
      id: 'energie',
      title: "Système d'énergie",
      icon: 'energy',
      lines: [
        "Chaque coureur dispose de 100 points d'énergie. Se déplacer coûte de l'énergie selon la distance et le terrain.",
        "Entre 51 et 100% : tout va bien, aucune pénalité.",
        "Entre 26 et 50% (Fatigué) : vos cartes Attaque et Spécialité perdent 1 point d'efficacité.",
        "Entre 1 et 25% (Épuisé) : impossible d'utiliser les cartes Attaque ou Spécialité.",
        "À 0% (Fringale) : votre coureur doit se reposer (aucun déplacement, récupère 10 points)."
      ]
    },
    {
      id: 'recuperation',
      title: "Récupérer de l'énergie",
      icon: 'shelter',
      lines: [
        "En descente : récupérez +1 énergie par case parcourue si vous partez d'une case descente.",
        "À l'abri : +3 énergie en fin de tour si vous n'êtes pas exposé au vent (sauf en montagne).",
        "Au ravitaillement : +25 énergie si vous terminez votre déplacement sur une case ravitaillement.",
        "Ces bonus sont cumulables (maximum 100 points)."
      ]
    },
    {
      id: 'cases',
      title: 'Occupation des cases',
      icon: 'info',
      lines: [
        "Maximum 4 coureurs par case.",
        "Si une case est pleine, le coureur s'arrête sur la première case libre derrière.",
        "Dans une même case, le coureur le plus à droite est considéré \"devant\" (avantage en cas d'égalité)."
      ]
    },
    {
      id: 'aspiration',
      title: 'Aspiration (drafting)',
      icon: 'aspiration',
      lines: [
        "Quand une seule case vide sépare deux groupes, le groupe arrière avance automatiquement d'une case.",
        "L'aspiration ne permet jamais de rejoindre directement la case du groupe devant.",
        "Pas d'aspiration en descente (trop rapide pour profiter de l'abri).",
        "Aspiration possible vers un groupe en montagne, mais uniquement si vous restez hors montagne.",
        "L'aspiration se résout en cascade, de l'arrière vers l'avant."
      ]
    },
    {
      id: 'vent',
      title: 'Exposition au vent',
      icon: 'wind',
      lines: [
        "Un coureur est exposé au vent s'il est seul (ou le plus à droite de sa case) ET que la case devant est vide.",
        "Le vent est évalué après l'aspiration, et ne s'applique ni en montagne ni en descente.",
        "Conséquences : carte de fin de tour réduite à +1 (sauf Rouleur : +2), et surcoût d'énergie au tour suivant (+3, ou +5 pour le Rouleur)."
      ]
    },
    {
      id: 'evenements',
      title: 'Incidents de course',
      icon: 'event',
      lines: [
        "Des incidents peuvent survenir aléatoirement (1 par tour maximum, avec un délai d'un tour entre deux).",
        "Crevaison : coûte +2 énergie sur votre prochain déplacement.",
        "Chute : déplacement limité à 1 case maximum + coût de +5 énergie.",
        "Incident mécanique : votre carte de fin de tour perd 1 point."
      ]
    },
    {
      id: 'meteo',
      title: 'Météo',
      icon: 'wind',
      lines: [
        "Ciel clair : conditions normales.",
        "Vent latéral : pénalité au vent augmentée, bonus d'abri réduit.",
        "Pluie : risque de chute accru en descente et sur pavés, crevaisons plus fréquentes sur pavés."
      ]
    },
    {
      id: 'paves',
      title: 'Secteurs pavés',
      icon: 'cobbles',
      lines: [
        "Les pavés sont des zones dangereuses superposées au terrain normal (4 à 6 secteurs de 4 à 6 cases).",
        "Risques accrus de crevaison et de chute sur ces secteurs.",
        "Rouleurs et Sprinteurs sont avantagés (+1), les Grimpeurs sont pénalisés (-1).",
        "Conseil : restez groupés et évitez les efforts excessifs sur les pavés !"
      ]
    },
    {
      id: 'fin-de-tour',
      title: 'Ordre de fin de tour',
      icon: 'info',
      lines: [
        "1. Tous les joueurs effectuent leur action.",
        "2. L'aspiration regroupe automatiquement les coureurs proches.",
        "3. Le vent est évalué (hors montagne et descente).",
        "4. Chaque coureur reçoit une carte de fin de tour.",
        "5. Les coureurs à l'abri récupèrent +3 énergie."
      ]
    },
    {
      id: 'classements',
      title: 'Classement final',
      icon: 'trophy',
      lines: [
        "Course classique : le classement correspond aux positions finales (le plus loin = le meilleur).",
        "Course par étapes : le retard est calculé en secondes (10 secondes par case d'écart avec le leader).",
        "En cas d'égalité de position, le coureur le plus à droite dans la case est considéré devant."
      ]
    }
  ],
  bonusTable: {
    title: 'Bonus par terrain et profil',
    description: 'Chaque profil de coureur reçoit des bonus (ou malus) selon le terrain traversé.',
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
