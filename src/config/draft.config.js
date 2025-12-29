export const DraftConfig = {
  budgetTotal: 100,
  rosterSize: 5,
  roles: ['climber', 'puncher', 'rouleur', 'sprinter', 'versatile']
};

export const DraftAIConfig = {
  budgetByDifficulty: {
    easy: 90,
    normal: 100,
    hard: 115
  },
  difficultyTuning: {
    easy: { pricePenalty: 4.5, randomness: 0.35 },
    normal: { pricePenalty: 3, randomness: 0.2 },
    hard: { pricePenalty: 1.5, randomness: 0.1 }
  },
  personalityWeights: {
    attacker: { force: 1.05, endurance: 0.9, sprint: 1.15, climb: 0.95, punch: 1.2, rolling: 0.9 },
    conservative: { force: 0.95, endurance: 1.2, sprint: 0.85, climb: 1.05, punch: 0.9, rolling: 1.1 },
    opportunist: { force: 1.0, endurance: 1.0, sprint: 1.05, climb: 0.95, punch: 1.15, rolling: 1.0 },
    balanced: { force: 1, endurance: 1, sprint: 1, climb: 1, punch: 1, rolling: 1 }
  },
  personalityRolePriority: {
    attacker: ['sprinter', 'puncher', 'climber', 'rouleur', 'versatile'],
    conservative: ['rouleur', 'climber', 'versatile', 'puncher', 'sprinter'],
    opportunist: ['puncher', 'versatile', 'sprinter', 'rouleur', 'climber'],
    balanced: ['climber', 'puncher', 'rouleur', 'sprinter', 'versatile']
  }
};

export const DraftStatOrder = [
  'force',
  'endurance',
  'sprint',
  'climb',
  'punch',
  'rolling'
];

export const DraftStatLabels = {
  force: 'Force',
  endurance: 'Endurance',
  sprint: 'Sprint',
  climb: 'Grimpe',
  punch: 'Punch',
  rolling: 'Rouler'
};

export const RiderPool = [
  {
    id: 'climber_01',
    name: 'A. Roche',
    portraitKey: 'r01',
    role: 'climber',
    style: 'Grimpeur pur',
    price: 26,
    stats: { force: 72, endurance: 80, sprint: 48, climb: 88, punch: 65, rolling: 54 }
  },
  {
    id: 'climber_02',
    name: 'M. Serrat',
    portraitKey: 'r02',
    role: 'climber',
    style: 'Grimpeur pur',
    price: 24,
    stats: { force: 68, endurance: 76, sprint: 45, climb: 85, punch: 62, rolling: 52 }
  },
  {
    id: 'climber_03',
    name: 'L. Alpine',
    portraitKey: 'r03',
    role: 'climber',
    style: 'Grimpeur pur',
    price: 22,
    stats: { force: 64, endurance: 72, sprint: 42, climb: 82, punch: 58, rolling: 50 }
  },
  {
    id: 'climber_04',
    name: 'R. Dumas',
    portraitKey: 'r04',
    role: 'climber',
    style: 'Grimpeur pur',
    price: 20,
    stats: { force: 60, endurance: 70, sprint: 40, climb: 78, punch: 55, rolling: 48 }
  },
  {
    id: 'climber_05',
    name: 'T. Lenoir',
    portraitKey: 'r05',
    role: 'climber',
    style: 'Grimpeur pur',
    price: 18,
    stats: { force: 58, endurance: 68, sprint: 38, climb: 75, punch: 52, rolling: 46 }
  },
  {
    id: 'puncher_01',
    name: 'S. Morel',
    portraitKey: 'r06',
    role: 'puncher',
    style: 'Attaquant',
    price: 24,
    stats: { force: 78, endurance: 70, sprint: 60, climb: 68, punch: 86, rolling: 58 }
  },
  {
    id: 'puncher_02',
    name: 'J. Caster',
    portraitKey: 'r07',
    role: 'puncher',
    style: 'Attaquant',
    price: 22,
    stats: { force: 74, endurance: 68, sprint: 58, climb: 65, punch: 82, rolling: 55 }
  },
  {
    id: 'puncher_03',
    name: 'N. Bertin',
    portraitKey: 'r08',
    role: 'puncher',
    style: 'Attaquant',
    price: 20,
    stats: { force: 70, endurance: 66, sprint: 55, climb: 62, punch: 78, rolling: 52 }
  },
  {
    id: 'puncher_04',
    name: 'P. Girard',
    portraitKey: 'r09',
    role: 'puncher',
    style: 'Attaquant',
    price: 18,
    stats: { force: 66, endurance: 64, sprint: 52, climb: 58, punch: 74, rolling: 50 }
  },
  {
    id: 'puncher_05',
    name: 'E. Lang',
    portraitKey: 'r10',
    role: 'puncher',
    style: 'Attaquant',
    price: 17,
    stats: { force: 64, endurance: 62, sprint: 50, climb: 56, punch: 72, rolling: 48 }
  },
  {
    id: 'rouleur_01',
    name: 'C. Martin',
    portraitKey: 'r11',
    role: 'rouleur',
    style: 'Rouleur',
    price: 25,
    stats: { force: 76, endurance: 78, sprint: 54, climb: 52, punch: 60, rolling: 88 }
  },
  {
    id: 'rouleur_02',
    name: 'H. Renard',
    portraitKey: 'r12',
    role: 'rouleur',
    style: 'Rouleur',
    price: 23,
    stats: { force: 72, endurance: 76, sprint: 52, climb: 50, punch: 58, rolling: 84 }
  },
  {
    id: 'rouleur_03',
    name: 'D. Perret',
    portraitKey: 'r13',
    role: 'rouleur',
    style: 'Rouleur',
    price: 21,
    stats: { force: 68, endurance: 74, sprint: 50, climb: 48, punch: 56, rolling: 80 }
  },
  {
    id: 'rouleur_04',
    name: 'F. Colin',
    portraitKey: 'r14',
    role: 'rouleur',
    style: 'Rouleur',
    price: 19,
    stats: { force: 64, endurance: 70, sprint: 48, climb: 46, punch: 54, rolling: 76 }
  },
  {
    id: 'rouleur_05',
    name: 'G. Aubert',
    portraitKey: 'r15',
    role: 'rouleur',
    style: 'Rouleur',
    price: 18,
    stats: { force: 62, endurance: 68, sprint: 46, climb: 44, punch: 52, rolling: 74 }
  },
  {
    id: 'sprinter_01',
    name: 'V. March',
    portraitKey: 'r16',
    role: 'sprinter',
    style: 'Finisseur',
    price: 26,
    stats: { force: 80, endurance: 66, sprint: 90, climb: 44, punch: 62, rolling: 60 }
  },
  {
    id: 'sprinter_02',
    name: 'I. Faure',
    portraitKey: 'r17',
    role: 'sprinter',
    style: 'Finisseur',
    price: 23,
    stats: { force: 76, endurance: 64, sprint: 86, climb: 42, punch: 60, rolling: 58 }
  },
  {
    id: 'sprinter_03',
    name: 'K. Rolland',
    portraitKey: 'r18',
    role: 'sprinter',
    style: 'Finisseur',
    price: 21,
    stats: { force: 72, endurance: 62, sprint: 82, climb: 40, punch: 58, rolling: 56 }
  },
  {
    id: 'sprinter_04',
    name: 'O. Denis',
    portraitKey: 'r19',
    role: 'sprinter',
    style: 'Finisseur',
    price: 19,
    stats: { force: 68, endurance: 60, sprint: 78, climb: 38, punch: 56, rolling: 54 }
  },
  {
    id: 'sprinter_05',
    name: 'Y. Petit',
    portraitKey: 'r20',
    role: 'sprinter',
    style: 'Finisseur',
    price: 18,
    stats: { force: 66, endurance: 58, sprint: 74, climb: 36, punch: 54, rolling: 52 }
  },
  {
    id: 'versatile_01',
    name: 'B. Laurent',
    portraitKey: 'r21',
    role: 'versatile',
    style: 'Équilibré',
    price: 24,
    stats: { force: 70, endurance: 74, sprint: 62, climb: 66, punch: 66, rolling: 66 }
  },
  {
    id: 'versatile_02',
    name: 'Q. Noel',
    portraitKey: 'r22',
    role: 'versatile',
    style: 'Équilibré',
    price: 22,
    stats: { force: 68, endurance: 72, sprint: 60, climb: 64, punch: 64, rolling: 64 }
  },
  {
    id: 'versatile_03',
    name: 'U. Pascal',
    portraitKey: 'r23',
    role: 'versatile',
    style: 'Équilibré',
    price: 20,
    stats: { force: 66, endurance: 70, sprint: 58, climb: 62, punch: 62, rolling: 62 }
  },
  {
    id: 'versatile_04',
    name: 'W. Thomas',
    portraitKey: 'r24',
    role: 'versatile',
    style: 'Équilibré',
    price: 18,
    stats: { force: 64, endurance: 68, sprint: 56, climb: 60, punch: 60, rolling: 60 }
  },
  {
    id: 'versatile_05',
    name: 'Z. Henry',
    portraitKey: 'r24',
    role: 'versatile',
    style: 'Équilibré',
    price: 17,
    stats: { force: 62, endurance: 66, sprint: 54, climb: 58, punch: 58, rolling: 58 }
  }
];
