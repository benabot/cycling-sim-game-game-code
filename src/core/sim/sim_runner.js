import {
  acknowledgeEndTurnEffects,
  createGameState,
  resolveMovement,
  rollDice,
  selectCard,
  selectRider,
  selectSpecialty,
  TurnPhase,
  GamePhase,
  getTerrainAt
} from '../game_engine.js';
import { createAI } from '../ai.js';
import { PlayerType } from '../teams.js';
import { EnergyConfig } from '../energy.js';
import { computeRiskCue } from '../risk_cues.js';
import { createSeededRng } from '../dice.js';
import { buildSetupConfig } from './setup_builder.js';
import { chooseAction, chooseCard, chooseRider, chooseSpecialty } from './autoplayer.js';

function deriveSeed(seed, tag) {
  const base = seed === null || seed === undefined ? '0' : String(seed);
  return `${base}:${tag}`;
}

function createAiContext(players, seed) {
  const aiByTeam = {};
  players
    .filter(player => player.playerType === PlayerType.AI)
    .forEach((player, index) => {
      const rng = createSeededRng(deriveSeed(seed, `ai:${player.teamId}:${index}`));
      aiByTeam[player.teamId] = createAI(
        player.difficulty,
        player.personality || null,
        { aiProfile: player.aiProfile, random: rng }
      );
    });
  return { aiByTeam };
}

function getRiskCue(state) {
  const teamRiders = state.riders.filter(r => r.team === state.currentTeam && !r.hasFinished);
  if (!teamRiders.length) return { level: 'Faible' };
  const focus = teamRiders.reduce((leader, rider) => (
    rider.position > leader.position ? rider : leader
  ), teamRiders[0]);
  const position = focus.position || 0;
  const courseIndex = position - 1;
  const cell = state.course?.[courseIndex];
  const terrain = cell?.terrain || getTerrainAt(state, position);
  const isCobbles = !!cell?.isCobbles;
  const groupSize = state.riders.filter(r => !r.hasFinished && r.position === position).length;
  const isExposed = groupSize <= 1 || (focus.windPenaltyNextMove || 0) > 0;

  return computeRiskCue({
    terrain,
    isCobbles,
    isExposed,
    weather: state.raceEventState?.weather
  });
}

function incrementRiskCounts(riskCounts, cue) {
  const level = cue?.level || 'Faible';
  if (level === 'Faible') {
    riskCounts.low += 1;
  } else if (String(level).toLowerCase().startsWith('mod')) {
    riskCounts.medium += 1;
  } else {
    riskCounts.high += 1;
  }
}

function validateState(state) {
  if (!state) return { ok: false, reason: 'state missing' };
  if (!Array.isArray(state.riders)) return { ok: false, reason: 'riders missing' };
  const maxEnergy = EnergyConfig.maxEnergy ?? 100;
  const riderIds = new Set();

  for (const rider of state.riders) {
    if (!rider || !rider.id) return { ok: false, reason: 'rider missing id' };
    if (riderIds.has(rider.id)) return { ok: false, reason: `duplicate rider id ${rider.id}` };
    riderIds.add(rider.id);
    if (!Number.isFinite(rider.position)) return { ok: false, reason: `invalid position ${rider.id}` };
    if (rider.position < 0) return { ok: false, reason: `negative position ${rider.id}` };
    if (!Number.isFinite(rider.energy)) return { ok: false, reason: `invalid energy ${rider.id}` };
    if (rider.energy < 0 || rider.energy > maxEnergy) {
      return { ok: false, reason: `energy out of bounds ${rider.id}` };
    }
  }

  if (state.selectedRiderId && !riderIds.has(state.selectedRiderId)) {
    return { ok: false, reason: `selected rider missing ${state.selectedRiderId}` };
  }

  if (state.teamIds && !state.teamIds.includes(state.currentTeam)) {
    return { ok: false, reason: `current team invalid ${state.currentTeam}` };
  }

  if (state.turnPhase === TurnPhase.END_TURN_EFFECTS) {
    const eventCount = (state.endTurnEffects || []).filter(e => e.type === 'race_event').length;
    if (eventCount > 1) {
      return { ok: false, reason: 'multiple race events in turn' };
    }
  }

  const seenPlayed = new Set();
  for (const riderId of state.ridersPlayedThisTurn || []) {
    if (seenPlayed.has(riderId)) {
      return { ok: false, reason: `duplicate ridersPlayedThisTurn ${riderId}` };
    }
    if (!riderIds.has(riderId)) {
      return { ok: false, reason: `unknown ridersPlayedThisTurn ${riderId}` };
    }
    seenPlayed.add(riderId);
  }

  return { ok: true };
}

function applyAction(state, action) {
  switch (action.type) {
    case 'select_rider':
      return selectRider(state, action.riderId);
    case 'select_card':
      return selectCard(state, action.cardId);
    case 'roll_dice':
      return rollDice(state);
    case 'select_specialty':
      return selectSpecialty(state, action.cardId);
    case 'skip_specialty':
      return selectSpecialty(state, null);
    case 'resolve':
      return resolveMovement(state);
    case 'acknowledge':
      return acknowledgeEndTurnEffects(state);
    default:
      return state;
  }
}

function ensureAction(state, ctx) {
  const action = chooseAction(state, ctx);
  if (action.type !== 'wait') return action;

  if (state.turnPhase === TurnPhase.SELECT_RIDER) {
    const riderId = chooseRider(state, ctx);
    if (riderId) return { type: 'select_rider', riderId };
  }
  if (state.turnPhase === TurnPhase.SELECT_CARD) {
    const cardId = chooseCard(state, ctx);
    if (cardId) return { type: 'select_card', cardId };
  }
  if (state.turnPhase === TurnPhase.SELECT_SPECIALTY) {
    return chooseSpecialty(state, ctx);
  }

  return action;
}

export function buildGameFromPreset({ presetName, seed = 1, options = {} } = {}) {
  const gameConfig = buildSetupConfig({ presetName, seed, options });
  const gameState = createGameState({ gameConfig });
  const aiContext = createAiContext(gameConfig.players || [], seed);
  return {
    gameConfig,
    gameState,
    ctx: {
      ...aiContext,
      seed
    }
  };
}

export function runFullGame({ presetName, seed = 1, maxTurns = 200, debug = false, options = {} } = {}) {
  const { gameState, gameConfig, ctx } = buildGameFromPreset({ presetName, seed, options });
  let state = gameState;
  const stats = {
    steps: 0,
    turnsPlayed: state.currentTurn || 1,
    attacksCount: 0,
    eventsCount: 0,
    invalidActionsCount: 0,
    riskCue: { low: 0, medium: 0, high: 0 }
  };

  const maxSteps = Math.max(500, maxTurns * (state.riders.length * 6 + 10));
  let lastTurn = state.currentTurn;
  let lastAction = null;
  let stallCount = 0;

  while (state.phase !== GamePhase.FINISHED) {
    if (stats.steps++ > maxSteps) {
      const reason = `max steps exceeded (${maxSteps})`;
      if (debug) {
        console.error('[sim] failure', { presetName, seed, turn: state.currentTurn, lastAction, reason });
      }
      throw new Error(`[sim] ${presetName} seed=${seed} turn=${state.currentTurn} action=${lastAction?.type || 'none'} ${reason}`);
    }

    if (state.currentTurn !== lastTurn) {
      lastTurn = state.currentTurn;
      stats.turnsPlayed = state.currentTurn;
    }

    if (state.currentTurn > maxTurns) {
      const reason = `max turns exceeded (${maxTurns})`;
      if (debug) {
        console.error('[sim] failure', { presetName, seed, turn: state.currentTurn, lastAction, reason });
      }
      throw new Error(`[sim] ${presetName} seed=${seed} turn=${state.currentTurn} action=${lastAction?.type || 'none'} ${reason}`);
    }

    const invariant = validateState(state);
    if (!invariant.ok) {
      const reason = invariant.reason || 'invariant failed';
      if (debug) {
        console.error('[sim] failure', { presetName, seed, turn: state.currentTurn, lastAction, reason });
      }
      throw new Error(`[sim] ${presetName} seed=${seed} turn=${state.currentTurn} action=${lastAction?.type || 'none'} ${reason}`);
    }

    if (state.turnPhase === TurnPhase.SELECT_RIDER) {
      incrementRiskCounts(stats.riskCue, getRiskCue(state));
    }

    const action = ensureAction(state, ctx);
    lastAction = action;

    if (action.type === 'wait') {
      stallCount += 1;
      if (stallCount > 5) {
        const reason = 'no valid action';
        if (debug) {
          console.error('[sim] failure', { presetName, seed, turn: state.currentTurn, lastAction, reason });
        }
        throw new Error(`[sim] ${presetName} seed=${seed} turn=${state.currentTurn} action=wait ${reason}`);
      }
    } else {
      stallCount = 0;
    }

    const beforeState = state;
    state = applyAction(state, action);

    if (action.type === 'resolve') {
      const riderId = beforeState.selectedRiderId;
      const beforeRider = beforeState.riders.find(r => r.id === riderId);
      const afterRider = state.riders.find(r => r.id === riderId);
      if (beforeRider && afterRider) {
        const beforeAttacks = beforeRider.attacksUsed || 0;
        const afterAttacks = afterRider.attacksUsed || 0;
        if (afterAttacks > beforeAttacks) {
          stats.attacksCount += afterAttacks - beforeAttacks;
        }
      }

      if (state.lastMovement?.type === 'invalid') {
        stats.invalidActionsCount += 1;
        if (state.turnPhase !== TurnPhase.SELECT_CARD) {
          const reason = 'invalid move did not reset phase';
          if (debug) {
            console.error('[sim] failure', { presetName, seed, turn: state.currentTurn, lastAction, reason });
          }
          throw new Error(`[sim] ${presetName} seed=${seed} turn=${state.currentTurn} action=${lastAction?.type || 'none'} ${reason}`);
        }
      }

      if (
        state.turnPhase === TurnPhase.END_TURN_EFFECTS &&
        beforeState.turnPhase !== TurnPhase.END_TURN_EFFECTS
      ) {
        const events = (state.endTurnEffects || []).filter(effect => effect.type === 'race_event');
        stats.eventsCount += events.length;
      }
    }
  }

  stats.turnsPlayed = state.currentTurn || stats.turnsPlayed;

  const summary = {
    presetName: gameConfig.classicId || presetName,
    seed,
    turnsPlayed: stats.turnsPlayed,
    winnerTeamId: state.winningTeam || null,
    eventsCount: stats.eventsCount,
    attacksCount: stats.attacksCount,
    invalidActionsCount: stats.invalidActionsCount,
    riskCue: { ...stats.riskCue }
  };

  return {
    summary,
    finalState: state,
    stats
  };
}

export function runBatch({ presets = [], seeds = [], maxTurns = 200, options = {} } = {}) {
  const results = [];
  presets.forEach(presetName => {
    seeds.forEach(seed => {
      const result = runFullGame({ presetName, seed, maxTurns, options });
      results.push(result);
    });
  });
  return results;
}
