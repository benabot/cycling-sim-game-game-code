export const DraftConfig = {
  budgetTotal: 100,
  rosterSize: 5,
  roles: ['climber', 'puncher', 'rouleur', 'sprinter', 'versatile']
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
    role: 'climber',
    price: 26,
    stats: { force: 72, endurance: 80, sprint: 48, climb: 88, punch: 65, rolling: 54 }
  },
  {
    id: 'climber_02',
    name: 'M. Serrat',
    role: 'climber',
    price: 24,
    stats: { force: 68, endurance: 76, sprint: 45, climb: 85, punch: 62, rolling: 52 }
  },
  {
    id: 'climber_03',
    name: 'L. Alpine',
    role: 'climber',
    price: 22,
    stats: { force: 64, endurance: 72, sprint: 42, climb: 82, punch: 58, rolling: 50 }
  },
  {
    id: 'climber_04',
    name: 'R. Dumas',
    role: 'climber',
    price: 20,
    stats: { force: 60, endurance: 70, sprint: 40, climb: 78, punch: 55, rolling: 48 }
  },
  {
    id: 'climber_05',
    name: 'T. Lenoir',
    role: 'climber',
    price: 18,
    stats: { force: 58, endurance: 68, sprint: 38, climb: 75, punch: 52, rolling: 46 }
  },
  {
    id: 'puncher_01',
    name: 'S. Morel',
    role: 'puncher',
    price: 24,
    stats: { force: 78, endurance: 70, sprint: 60, climb: 68, punch: 86, rolling: 58 }
  },
  {
    id: 'puncher_02',
    name: 'J. Caster',
    role: 'puncher',
    price: 22,
    stats: { force: 74, endurance: 68, sprint: 58, climb: 65, punch: 82, rolling: 55 }
  },
  {
    id: 'puncher_03',
    name: 'N. Bertin',
    role: 'puncher',
    price: 20,
    stats: { force: 70, endurance: 66, sprint: 55, climb: 62, punch: 78, rolling: 52 }
  },
  {
    id: 'puncher_04',
    name: 'P. Girard',
    role: 'puncher',
    price: 18,
    stats: { force: 66, endurance: 64, sprint: 52, climb: 58, punch: 74, rolling: 50 }
  },
  {
    id: 'puncher_05',
    name: 'E. Lang',
    role: 'puncher',
    price: 17,
    stats: { force: 64, endurance: 62, sprint: 50, climb: 56, punch: 72, rolling: 48 }
  },
  {
    id: 'rouleur_01',
    name: 'C. Martin',
    role: 'rouleur',
    price: 25,
    stats: { force: 76, endurance: 78, sprint: 54, climb: 52, punch: 60, rolling: 88 }
  },
  {
    id: 'rouleur_02',
    name: 'H. Renard',
    role: 'rouleur',
    price: 23,
    stats: { force: 72, endurance: 76, sprint: 52, climb: 50, punch: 58, rolling: 84 }
  },
  {
    id: 'rouleur_03',
    name: 'D. Perret',
    role: 'rouleur',
    price: 21,
    stats: { force: 68, endurance: 74, sprint: 50, climb: 48, punch: 56, rolling: 80 }
  },
  {
    id: 'rouleur_04',
    name: 'F. Colin',
    role: 'rouleur',
    price: 19,
    stats: { force: 64, endurance: 70, sprint: 48, climb: 46, punch: 54, rolling: 76 }
  },
  {
    id: 'rouleur_05',
    name: 'G. Aubert',
    role: 'rouleur',
    price: 18,
    stats: { force: 62, endurance: 68, sprint: 46, climb: 44, punch: 52, rolling: 74 }
  },
  {
    id: 'sprinter_01',
    name: 'V. March',
    role: 'sprinter',
    price: 26,
    stats: { force: 80, endurance: 66, sprint: 90, climb: 44, punch: 62, rolling: 60 }
  },
  {
    id: 'sprinter_02',
    name: 'I. Faure',
    role: 'sprinter',
    price: 23,
    stats: { force: 76, endurance: 64, sprint: 86, climb: 42, punch: 60, rolling: 58 }
  },
  {
    id: 'sprinter_03',
    name: 'K. Rolland',
    role: 'sprinter',
    price: 21,
    stats: { force: 72, endurance: 62, sprint: 82, climb: 40, punch: 58, rolling: 56 }
  },
  {
    id: 'sprinter_04',
    name: 'O. Denis',
    role: 'sprinter',
    price: 19,
    stats: { force: 68, endurance: 60, sprint: 78, climb: 38, punch: 56, rolling: 54 }
  },
  {
    id: 'sprinter_05',
    name: 'Y. Petit',
    role: 'sprinter',
    price: 18,
    stats: { force: 66, endurance: 58, sprint: 74, climb: 36, punch: 54, rolling: 52 }
  },
  {
    id: 'versatile_01',
    name: 'B. Laurent',
    role: 'versatile',
    price: 24,
    stats: { force: 70, endurance: 74, sprint: 62, climb: 66, punch: 66, rolling: 66 }
  },
  {
    id: 'versatile_02',
    name: 'Q. Noel',
    role: 'versatile',
    price: 22,
    stats: { force: 68, endurance: 72, sprint: 60, climb: 64, punch: 64, rolling: 64 }
  },
  {
    id: 'versatile_03',
    name: 'U. Pascal',
    role: 'versatile',
    price: 20,
    stats: { force: 66, endurance: 70, sprint: 58, climb: 62, punch: 62, rolling: 62 }
  },
  {
    id: 'versatile_04',
    name: 'W. Thomas',
    role: 'versatile',
    price: 18,
    stats: { force: 64, endurance: 68, sprint: 56, climb: 60, punch: 60, rolling: 60 }
  },
  {
    id: 'versatile_05',
    name: 'Z. Henry',
    role: 'versatile',
    price: 17,
    stats: { force: 62, endurance: 66, sprint: 54, climb: 58, punch: 58, rolling: 58 }
  }
];
