/**
 * Teams configuration - v4.0 Multi-teams support
 * @module core/teams
 */

/**
 * Team identifiers (up to 4 teams)
 */
export const TeamId = {
  TEAM_A: 'team_a',
  TEAM_B: 'team_b',
  TEAM_C: 'team_c',
  TEAM_D: 'team_d'
};

/**
 * Player types
 */
export const PlayerType = {
  HUMAN: 'human',
  AI: 'ai'
};

/**
 * AI difficulty levels
 */
export const AIDifficulty = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

/**
 * Team configurations with colors and names
 */
export const TeamConfigs = {
  [TeamId.TEAM_A]: {
    id: TeamId.TEAM_A,
    name: 'Équipe Rouge',
    shortName: 'Rouge',
    prefix: 'A',
    color: '#dc2626',
    bgColor: '#fecaca',
    borderColor: '#b91c1c',
    emoji: '🔴'
  },
  [TeamId.TEAM_B]: {
    id: TeamId.TEAM_B,
    name: 'Équipe Bleue',
    shortName: 'Bleue',
    prefix: 'B',
    color: '#2563eb',
    bgColor: '#bfdbfe',
    borderColor: '#1d4ed8',
    emoji: '🔵'
  },
  [TeamId.TEAM_C]: {
    id: TeamId.TEAM_C,
    name: 'Équipe Verte',
    shortName: 'Verte',
    prefix: 'C',
    color: '#16a34a',
    bgColor: '#bbf7d0',
    borderColor: '#15803d',
    emoji: '🟢'
  },
  [TeamId.TEAM_D]: {
    id: TeamId.TEAM_D,
    name: 'Équipe Jaune',
    shortName: 'Jaune',
    prefix: 'D',
    color: '#ca8a04',
    bgColor: '#fef08a',
    borderColor: '#a16207',
    emoji: '🟡'
  }
};

/**
 * Get ordered list of team IDs based on number of teams
 * @param {number} numTeams - Number of teams (2-4)
 * @returns {string[]} Array of team IDs
 */
export function getTeamIds(numTeams) {
  const allTeams = [TeamId.TEAM_A, TeamId.TEAM_B, TeamId.TEAM_C, TeamId.TEAM_D];
  return allTeams.slice(0, Math.min(Math.max(numTeams, 2), 4));
}

/**
 * Get team configuration
 * @param {string} teamId - Team identifier
 * @returns {Object} Team configuration
 */
export function getTeamConfig(teamId) {
  return TeamConfigs[teamId] || TeamConfigs[TeamId.TEAM_A];
}

/**
 * Create player configuration for a team
 * @param {string} teamId - Team identifier
 * @param {string} playerType - 'human' or 'ai'
 * @param {string} difficulty - AI difficulty (if AI)
 * @returns {Object} Player configuration
 */
export function createPlayerConfig(teamId, playerType = PlayerType.HUMAN, difficulty = AIDifficulty.NORMAL) {
  const teamConfig = getTeamConfig(teamId);
  return {
    teamId,
    playerType,
    difficulty: playerType === PlayerType.AI ? difficulty : null,
    aiProfile: playerType === PlayerType.AI ? 'equilibre' : null,
    name: playerType === PlayerType.HUMAN 
      ? `Joueur ${teamConfig.shortName}` 
      : `IA ${teamConfig.shortName}`,
    ...teamConfig
  };
}

/**
 * Create default game configuration
 * @param {number} numTeams - Number of teams
 * @param {number} numHumans - Number of human players
 * @returns {Object} Game configuration
 */
export function createDefaultGameConfig(numTeams = 2, numHumans = 1) {
  const teamIds = getTeamIds(numTeams);
  const players = teamIds.map((teamId, index) => {
    const isHuman = index < numHumans;
    return createPlayerConfig(
      teamId, 
      isHuman ? PlayerType.HUMAN : PlayerType.AI,
      AIDifficulty.NORMAL
    );
  });
  
  return {
    numTeams,
    numHumans,
    players,
    courseLength: 80
  };
}

/**
 * Check if a team is controlled by AI
 * @param {Object} gameConfig - Game configuration
 * @param {string} teamId - Team to check
 * @returns {boolean} True if AI controlled
 */
export function isAITeam(gameConfig, teamId) {
  const player = gameConfig.players.find(p => p.teamId === teamId);
  return player?.playerType === PlayerType.AI;
}

/**
 * Get next team in turn order
 * @param {string} currentTeam - Current team ID
 * @param {string[]} teamIds - All team IDs in order
 * @returns {string} Next team ID
 */
export function getNextTeam(currentTeam, teamIds) {
  const currentIndex = teamIds.indexOf(currentTeam);
  const nextIndex = (currentIndex + 1) % teamIds.length;
  return teamIds[nextIndex];
}
