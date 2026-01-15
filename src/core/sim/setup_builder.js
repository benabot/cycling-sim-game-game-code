import { DraftConfig, DraftAIConfig, DraftStatOrder, RiderPool } from '../../config/draft.config.js';
import { ClassicId, getClassicPreset } from '../../config/race-presets.js';
import { createPlayerConfig, getTeamIds, PlayerType, AIDifficulty } from '../teams.js';
import { AIPersonality, AITacticalProfile } from '../ai.js';
import { createSeededRng } from '../dice.js';

const DEFAULT_PRESET = ClassicId.RIVIERA;

function resolveClassicId(presetName) {
  if (!presetName) return DEFAULT_PRESET;
  if (Object.values(ClassicId).includes(presetName)) return presetName;
  const normalized = String(presetName).toLowerCase();
  if (Object.values(ClassicId).includes(normalized)) return normalized;
  const alias = {
    baseline: ClassicId.RIVIERA,
    flat: ClassicId.RIVIERA,
    sprint: ClassicId.RIVIERA,
    hills: ClassicId.ARDENNAISE,
    hilly: ClassicId.ARDENNAISE,
    mountain: ClassicId.LOMBARDE,
    cobbles: ClassicId.NORD,
    paves: ClassicId.NORD
  };
  return alias[normalized] || DEFAULT_PRESET;
}

function resolveDraftPersonality(player, rng) {
  if (player?.personality) return player.personality;
  if (player?.difficulty === AIDifficulty.EASY) return AIPersonality.BALANCED;
  const personalities = Object.values(AIPersonality);
  return personalities[Math.floor(rng() * personalities.length)];
}

function getTeamBudgetTotal(player) {
  if (player?.playerType === PlayerType.AI) {
    return DraftAIConfig.budgetByDifficulty[player.difficulty] ?? DraftConfig.budgetTotal;
  }
  return DraftConfig.budgetTotal;
}

function getDraftPersonalityWeights(personality) {
  return DraftAIConfig.personalityWeights[personality] || DraftAIConfig.personalityWeights.balanced;
}

function getDraftRolePriority(personality) {
  return DraftAIConfig.personalityRolePriority[personality] || DraftConfig.roles;
}

function getAIDifficultyTuning(difficulty) {
  return DraftAIConfig.difficultyTuning[difficulty] || DraftAIConfig.difficultyTuning.normal;
}

function getCheapestPriceForRole(pool, role) {
  const candidates = pool.filter(rider => rider.role === role);
  if (!candidates.length) return 0;
  return Math.min(...candidates.map(rider => rider.price || 0));
}

function scoreDraftRider(rider, weights, tuning, rng) {
  const stats = rider.stats || {};
  const baseScore = DraftStatOrder.reduce((sum, key) => {
    const weight = weights[key] ?? 1;
    return sum + (stats[key] || 0) * weight;
  }, 0);
  const pricePenalty = (rider.price || 0) * tuning.pricePenalty;
  const jitter = (rng() * 2 - 1) * tuning.randomness * 10;
  return baseScore - pricePenalty + jitter;
}

function pickDraftRider(pool, role, budgetRemaining, reserveBudget, weights, tuning, rng) {
  const candidates = pool.filter(rider => rider.role === role);
  if (!candidates.length) return null;
  const scored = candidates
    .map(rider => ({ rider, score: scoreDraftRider(rider, weights, tuning, rng) }))
    .sort((a, b) => b.score - a.score);
  const maxPrice = budgetRemaining - reserveBudget;
  const affordable = scored.find(entry => entry.rider.price <= maxPrice);
  if (affordable) return affordable.rider;
  const withinBudget = scored.find(entry => entry.rider.price <= budgetRemaining);
  return withinBudget?.rider || scored[0].rider;
}

function buildDraftRosters(players, rng) {
  const pool = RiderPool.map(rider => ({
    ...rider,
    stats: { ...rider.stats }
  }));
  const rosters = {};

  players.forEach(player => {
    const teamId = player.teamId;
    const roster = [];
    const rosterRoles = new Set();
    const personality = resolveDraftPersonality(player, rng);
    const weights = getDraftPersonalityWeights(personality);
    const tuning = getAIDifficultyTuning(player.difficulty);
    const rolePriority = getDraftRolePriority(personality)
      .filter(role => DraftConfig.roles.includes(role));

    let budgetRemaining = getTeamBudgetTotal(player);

    rolePriority.forEach((role, index) => {
      if (rosterRoles.has(role)) return;
      const remainingRoles = rolePriority.slice(index + 1).filter(nextRole => !rosterRoles.has(nextRole));
      const reserveBudget = remainingRoles.reduce(
        (sum, remainingRole) => sum + getCheapestPriceForRole(pool, remainingRole),
        0
      );
      const rider = pickDraftRider(pool, role, budgetRemaining, reserveBudget, weights, tuning, rng);
      if (!rider) return;
      roster.push({
        id: rider.id,
        name: rider.name,
        role: rider.role,
        price: rider.price,
        stats: { ...rider.stats }
      });
      rosterRoles.add(role);
      budgetRemaining -= rider.price || 0;
      const poolIndex = pool.findIndex(entry => entry.id === rider.id);
      if (poolIndex !== -1) pool.splice(poolIndex, 1);
    });

    DraftConfig.roles.forEach(role => {
      if (rosterRoles.has(role)) return;
      const fallback = pool.find(rider => rider.role === role) || pool[0];
      if (!fallback) return;
      roster.push({
        id: fallback.id,
        name: fallback.name,
        role: fallback.role,
        price: fallback.price,
        stats: { ...fallback.stats }
      });
      rosterRoles.add(role);
      budgetRemaining -= fallback.price || 0;
      const poolIndex = pool.findIndex(entry => entry.id === fallback.id);
      if (poolIndex !== -1) pool.splice(poolIndex, 1);
    });

    rosters[teamId] = roster;
  });

  return rosters;
}

export function buildSetupConfig({ presetName, seed = 1, options = {} } = {}) {
  const classicId = resolveClassicId(options.classicId || presetName);
  const preset = getClassicPreset(classicId);
  const numTeams = options.numTeams ?? 2;
  const numHumans = options.numHumans ?? 0;
  const aiDifficulty = options.aiDifficulty ?? AIDifficulty.NORMAL;
  const aiProfile = options.aiProfile ?? AITacticalProfile.EQUILIBRE;

  const setupRng = createSeededRng(`${seed}:setup`);
  const gameRng = createSeededRng(`${seed}:game`);
  const courseRng = createSeededRng(`${seed}:course`);
  const eventRng = createSeededRng(`${seed}:events`);
  const weatherRng = createSeededRng(`${seed}:weather`);

  const teamIds = getTeamIds(numTeams);
  const players = teamIds.map((teamId, index) => {
    const isHuman = index < numHumans;
    const config = createPlayerConfig(teamId, isHuman ? PlayerType.HUMAN : PlayerType.AI, aiDifficulty);
    const personality = isHuman ? null : resolveDraftPersonality({ difficulty: aiDifficulty }, setupRng);
    return {
      ...config,
      playerType: isHuman ? PlayerType.HUMAN : PlayerType.AI,
      difficulty: isHuman ? null : aiDifficulty,
      personality,
      aiProfile: isHuman ? null : aiProfile
    };
  });

  const raceType = options.raceType || 'classic';
  const stageRace = raceType === 'stage'
    ? {
        numStages: options.stageRace?.numStages ?? 3,
        profile: options.stageRace?.profile ?? 'balanced',
        stageLength: options.courseLength ?? preset?.defaultLength ?? 80
      }
    : null;
  const raceMode = raceType === 'stage' ? 'STAGE_RACE' : 'CLASSIC';
  const courseLength = options.courseLength ?? preset?.defaultLength ?? 80;
  const draftRosters = buildDraftRosters(players, setupRng);

  const gameConfig = {
    numTeams,
    numHumans,
    players,
    courseLength,
    raceType,
    classicId,
    raceMode,
    stageRace,
    draftRosters,
    seed,
    rng: gameRng,
    courseRng,
    eventRng,
    weatherRng
  };

  if (options.weather) gameConfig.weather = options.weather;
  if (options.weatherNext) gameConfig.weatherNext = options.weatherNext;

  return gameConfig;
}
