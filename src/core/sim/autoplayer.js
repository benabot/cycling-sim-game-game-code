import { getEnergyEffects } from '../energy.js';
import { computeRiskCue } from '../risk_cues.js';
import { getTerrainAt, TurnPhase } from '../game_engine.js';

const DEFAULT_PRESET = 'riviera';

function getAvailableRiders(state, teamId) {
  return state.riders.filter(rider =>
    rider.team === teamId &&
    !state.ridersPlayedThisTurn.includes(rider.id) &&
    !rider.hasFinished &&
    !(rider.turnsToSkip > 0)
  );
}

function getCurrentRider(state) {
  if (!state.selectedRiderId) return null;
  return state.riders.find(rider => rider.id === state.selectedRiderId) || null;
}

function getFallbackRider(state, teamId) {
  const candidates = getAvailableRiders(state, teamId);
  if (!candidates.length) return null;
  return candidates.reduce((best, rider) => {
    if (!best) return rider;
    if (rider.position > best.position) return rider;
    if (rider.position === best.position && rider.energy > best.energy) return rider;
    return best;
  }, null);
}

function isSpecialtyAllowed(rider, terrain) {
  if (!rider?.specialtyCards?.length) return false;
  if (rider.type === 'versatile') return true;
  const map = {
    climber: 'mountain',
    puncher: 'hill',
    rouleur: 'flat',
    sprinter: 'sprint'
  };
  return map[rider.type] === terrain;
}

function getRiskReading(state, rider) {
  if (!rider) return { level: 'Faible' };
  const position = rider.position || 0;
  const courseIndex = position - 1;
  const cell = state.course?.[courseIndex];
  const terrain = cell?.terrain || getTerrainAt(state, position);
  const isCobbles = !!cell?.isCobbles;
  const groupSize = state.riders.filter(r => !r.hasFinished && r.position === position).length;
  const isExposed = groupSize <= 1 || (rider.windPenaltyNextMove || 0) > 0;

  return computeRiskCue({
    terrain,
    isCobbles,
    isExposed,
    weather: state.raceEventState?.weather
  });
}

export function chooseRider(state, ctx = {}) {
  const teamId = state.currentTeam;
  const ai = ctx.aiByTeam?.[teamId];
  if (ai) {
    const decision = ai.makeDecision(state, 'select_rider', teamId);
    if (decision?.type === 'select_rider') {
      const candidates = getAvailableRiders(state, teamId);
      if (candidates.some(rider => rider.id === decision.riderId)) {
        return decision.riderId;
      }
    }
  }

  return getFallbackRider(state, teamId)?.id || null;
}

export function chooseCard(state, ctx = {}) {
  const teamId = state.currentTeam;
  const rider = getCurrentRider(state);
  if (!rider) return null;
  const energyEffects = getEnergyEffects(rider.energy);
  const ai = ctx.aiByTeam?.[teamId];

  if (ai) {
    const decision = ai.makeDecision(state, 'select_card', teamId);
    if (decision?.type === 'select_card') {
      const cardInHand = rider.hand?.find(card => card.id === decision.cardId);
      const cardInAttack = rider.attackCards?.find(card => card.id === decision.cardId);
      if (cardInHand) return cardInHand.id;
      if (cardInAttack && energyEffects.canUseAttack) return cardInAttack.id;
    }
  }

  const handCards = rider.hand || [];
  if (handCards.length) {
    const best = handCards.reduce((bestCard, card) => {
      if (!bestCard || card.value > bestCard.value) return card;
      return bestCard;
    }, null);
    return best?.id || handCards[0]?.id || null;
  }

  const attackCards = energyEffects.canUseAttack ? (rider.attackCards || []) : [];
  return attackCards[0]?.id || null;
}

export function chooseSpecialty(state, ctx = {}) {
  const teamId = state.currentTeam;
  const rider = getCurrentRider(state);
  if (!rider) return { type: 'skip_specialty' };
  const terrain = getTerrainAt(state, rider.position);
  const canUse = isSpecialtyAllowed(rider, terrain);
  if (!canUse) return { type: 'skip_specialty' };

  const ai = ctx.aiByTeam?.[teamId];
  if (ai) {
    const decision = ai.makeDecision(state, 'select_specialty', teamId);
    if (decision?.type === 'use_specialty' && rider.specialtyCards?.length) {
      return { type: 'select_specialty', cardId: rider.specialtyCards[0].id };
    }
  }

  const riskCue = getRiskReading(state, rider);
  const shouldUse = riskCue.level === 'Faible' && rider.energy > 30;
  if (shouldUse && rider.specialtyCards?.length) {
    return { type: 'select_specialty', cardId: rider.specialtyCards[0].id };
  }

  return { type: 'skip_specialty' };
}

export function chooseAction(state, ctx = {}) {
  switch (state.turnPhase) {
    case TurnPhase.SELECT_RIDER: {
      const riderId = chooseRider(state, ctx);
      return riderId ? { type: 'select_rider', riderId } : { type: 'wait' };
    }
    case TurnPhase.SELECT_CARD: {
      const cardId = chooseCard(state, ctx);
      return cardId ? { type: 'select_card', cardId } : { type: 'wait' };
    }
    case TurnPhase.ROLL_DICE:
      return { type: 'roll_dice' };
    case TurnPhase.SELECT_SPECIALTY:
      return chooseSpecialty(state, ctx);
    case TurnPhase.RESOLVE:
      return { type: 'resolve' };
    case TurnPhase.END_TURN_EFFECTS:
      return { type: 'acknowledge' };
    default:
      return { type: 'wait' };
  }
}

export function chooseSetupChoices(setupState = {}) {
  return {
    presetName: setupState.presetName || DEFAULT_PRESET,
    numTeams: setupState.numTeams || 2
  };
}
