// Configuration centralisée du jeu

export const FINISH_LINE = 80;

export const TeamConfig = {
  team_a: {
    id: 'team_a',
    name: 'Équipe Rouge',
    playerName: 'Joueur 1',
    color: '#dc2626',
    bgColor: '#fef2f2'
  },
  team_b: {
    id: 'team_b',
    name: 'Équipe Bleue',
    playerName: 'Joueur 2',
    color: '#2563eb',
    bgColor: '#eff6ff'
  }
};

export const RiderConfig = {
  climber: { 
    name: 'Grimpeur', 
    emoji: '🧗', 
    specialty: 'mountain',
    specialtyName: 'Montagne'
  },
  puncher: { 
    name: 'Puncheur', 
    emoji: '💥', 
    specialty: 'hill',
    specialtyName: 'Côte'
  },
  rouleur: { 
    name: 'Rouleur', 
    emoji: '🚴', 
    specialty: 'flat',
    specialtyName: 'Plaine'
  },
  sprinter: { 
    name: 'Sprinteur', 
    emoji: '⚡', 
    specialty: 'sprint',
    specialtyName: 'Sprint'
  },
  versatile: { 
    name: 'Polyvalent', 
    emoji: '🎯', 
    specialty: 'all',
    specialtyName: 'Tous terrains'
  }
};

export const TerrainConfig = {
  flat: { 
    name: 'Plaine', 
    emoji: '🟩', 
    cssClass: 'flat',
    hasAspiration: true,
    hasWind: true
  },
  hill: { 
    name: 'Côte', 
    emoji: '🟨', 
    cssClass: 'hill',
    hasAspiration: true,
    hasWind: true
  },
  mountain: { 
    name: 'Montagne', 
    emoji: '🟫', 
    cssClass: 'mountain',
    hasAspiration: false,
    hasWind: false
  },
  descent: { 
    name: 'Descente', 
    emoji: '🟦', 
    cssClass: 'descent',
    hasAspiration: false,
    hasWind: false
  },
  sprint: { 
    name: 'Sprint', 
    emoji: '🟪', 
    cssClass: 'sprint',
    hasAspiration: true,
    hasWind: true
  }
};

export const CardColors = {
  tempo: '#f8fafc',
  rythme: '#fef3c7',
  acceleration: '#fed7aa',
  sprint: '#fecaca',
  attack: '#c4b5fd',
  specialty: '#bbf7d0',
  wind: '#e5e7eb',
  shelter: '#d1fae5'
};

export const Medals = ['🥇', '🥈', '🥉', '4', '5', '6', '7', '8', '9', '10'];
