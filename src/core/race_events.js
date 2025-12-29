/**
 * Race events - v2.0 (light realism)
 * @module core/race_events
 */

import { TerrainType } from './terrain.js';

export const RaceWeather = {
  CLEAR: 'clear',
  RAIN: 'rain',
  WIND: 'wind'
};

export const RaceEventId = {
  PUNCTURE: 'puncture',
  CRASH: 'crash',
  MECHANICAL: 'mechanical'
};

export const RaceEventDefinitions = {
  [RaceEventId.PUNCTURE]: {
    id: RaceEventId.PUNCTURE,
    label: 'Crevaison',
    iconKey: 'warning',
    effects: { extraEnergyCost: 2 }
  },
  [RaceEventId.CRASH]: {
    id: RaceEventId.CRASH,
    label: 'Chute',
    iconKey: 'crash',
    effects: { maxMovement: 1, extraEnergyCost: 5 }
  },
  [RaceEventId.MECHANICAL]: {
    id: RaceEventId.MECHANICAL,
    label: 'Incident mécanique',
    iconKey: 'event',
    effects: { endTurnCardPenalty: 1 }
  }
};

const BASE_EVENT_CHANCE = 0.12;
const MAX_EVENT_CHANCE = 0.25;
const MIN_EVENT_CHANCE = 0.05;
const MAX_ENERGY_PENALTY = 5;
const COBBLES_PUNCTURE_BASE = 0.1;
const COBBLES_PUNCTURE_MIN = 0.02;
const COBBLES_PUNCTURE_MAX = 0.2;
const COBBLES_LOW_ENERGY_BONUS = 0.03;
const COBBLES_CRITICAL_ENERGY_BONUS = 0.06;
const COBBLES_SHELTER_REDUCTION = 0.03;

export function getRaceEventChance({ terrain, weather }) {
  let chance = BASE_EVENT_CHANCE;

  if (terrain === TerrainType.HILL) chance += 0.03;
  if (terrain === TerrainType.DESCENT) chance += 0.05;
  if (terrain === TerrainType.SPRINT) chance -= 0.02;

  if (weather === RaceWeather.RAIN) chance += 0.04;
  if (weather === RaceWeather.WIND) chance += 0.02;

  return Math.max(MIN_EVENT_CHANCE, Math.min(MAX_EVENT_CHANCE, chance));
}

export function pickRaceEvent({ terrain, weather, rng = Math.random }) {
  const weights = [];
  const add = (id, weight) => {
    if (weight > 0) weights.push({ id, weight });
  };

  if (terrain === TerrainType.DESCENT) {
    add(RaceEventId.CRASH, weather === RaceWeather.RAIN ? 0.7 : 0.55);
    add(RaceEventId.PUNCTURE, 0.25);
    add(RaceEventId.MECHANICAL, 0.2);
  } else if (terrain === TerrainType.HILL) {
    add(RaceEventId.PUNCTURE, 0.5);
    add(RaceEventId.MECHANICAL, 0.3);
    add(RaceEventId.CRASH, weather === RaceWeather.RAIN ? 0.3 : 0.2);
  } else {
    add(RaceEventId.MECHANICAL, 0.4);
    add(RaceEventId.PUNCTURE, 0.4);
    add(RaceEventId.CRASH, weather === RaceWeather.RAIN ? 0.25 : 0.2);
  }

  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;
  const roll = rng() * total;

  let cursor = 0;
  for (const entry of weights) {
    cursor += entry.weight;
    if (roll <= cursor) {
      return RaceEventDefinitions[entry.id];
    }
  }

  return RaceEventDefinitions[weights[weights.length - 1].id];
}

export function rollRaceEvent({
  riders = [],
  ridersPlayedThisTurn = [],
  getTerrainForRider,
  weather = RaceWeather.CLEAR,
  cooldownTurns = 0,
  rng = Math.random
} = {}) {
  if (cooldownTurns > 0) {
    return { event: null, riderId: null, cooldownTurns: cooldownTurns - 1 };
  }

  const eligible = riders.filter(rider =>
    ridersPlayedThisTurn.includes(rider.id) &&
    !rider.hasFinished &&
    !rider.raceEvent &&
    !rider.hasFallenThisTurn &&
    (rider.turnsToSkip || 0) === 0
  );

  if (eligible.length === 0) {
    return { event: null, riderId: null, cooldownTurns: 0 };
  }

  const candidate = eligible[Math.floor(rng() * eligible.length)];
  const terrain = getTerrainForRider ? getTerrainForRider(candidate) : TerrainType.FLAT;
  const chance = getRaceEventChance({ terrain, weather });

  if (rng() > chance) {
    return { event: null, riderId: null, cooldownTurns: 0 };
  }

  const event = pickRaceEvent({ terrain, weather, rng });
  if (!event) {
    return { event: null, riderId: null, cooldownTurns: 0 };
  }

  return { event, riderId: candidate.id, cooldownTurns: 1 };
}

export function attachRaceEvent(rider, event, options = {}) {
  if (!event) return rider;
  return {
    ...rider,
    raceEvent: {
      id: event.id,
      label: event.label,
      iconKey: event.iconKey,
      effects: { ...event.effects },
      turnsLeft: options.turns ?? 1,
      source: options.source || null
    }
  };
}

export function applyRaceEventMovement(movement, rider) {
  const effects = rider?.raceEvent?.effects;
  if (!effects) return movement;

  let adjusted = movement;
  if (effects.movementPenalty) {
    adjusted -= effects.movementPenalty;
  }
  if (effects.maxMovement !== null && effects.maxMovement !== undefined) {
    adjusted = Math.min(adjusted, effects.maxMovement);
  }
  return Math.max(1, adjusted);
}

export function getRaceEventEnergyPenalty(rider) {
  const penalty = rider?.raceEvent?.effects?.extraEnergyCost || 0;
  return Math.min(penalty, MAX_ENERGY_PENALTY);
}

export function getRaceEventCardPenalty(rider) {
  return rider?.raceEvent?.effects?.endTurnCardPenalty || 0;
}

export function tickRaceEvent(rider) {
  if (!rider?.raceEvent) return rider;
  const remaining = (rider.raceEvent.turnsLeft ?? 1) - 1;
  if (remaining <= 0) {
    return { ...rider, raceEvent: null };
  }
  return {
    ...rider,
    raceEvent: {
      ...rider.raceEvent,
      turnsLeft: remaining
    }
  };
}

export function rollPunctureOnCobbleStep(rider, context = {}) {
  const rng = context.rng || Math.random;
  const energy = context.energy ?? rider.energy ?? 100;
  const isSheltered = context.isSheltered || false;
  const baseChance = context.baseChance ?? COBBLES_PUNCTURE_BASE;

  let chance = baseChance;
  if (energy < 25) {
    chance += COBBLES_CRITICAL_ENERGY_BONUS;
  } else if (energy < 50) {
    chance += COBBLES_LOW_ENERGY_BONUS;
  }
  if (isSheltered) {
    chance -= COBBLES_SHELTER_REDUCTION;
  }

  chance = Math.max(COBBLES_PUNCTURE_MIN, Math.min(COBBLES_PUNCTURE_MAX, chance));
  return rng() < chance;
}

export function formatRaceEventLog(event, riderName) {
  if (!event) return '';
  const base = `${event.label} — ${riderName}`;
  if (event.id === RaceEventId.PUNCTURE) return `⚠️ ${base} (+2 énergie)`;
  if (event.id === RaceEventId.CRASH) return `⚠️ ${base} (mouvement réduit)`;
  if (event.id === RaceEventId.MECHANICAL) return `⚠️ ${base} (carte fin de tour dégradée)`;
  return `⚠️ ${base}`;
}
