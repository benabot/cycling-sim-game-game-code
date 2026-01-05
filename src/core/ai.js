/**
 * AI Module - v4.5 Advanced AI for cycling game
 * @module core/ai
 * 
 * Features:
 * - 3 difficulty levels (Easy, Normal, Hard)
 * - 4 AI personalities (Attacker, Conservative, Opportunist, Balanced)
 * - Team strategy (leader protection, relay work)
 * - Race situation analysis
 * - Energy management optimization
 */

import { RiderType, CardType } from './rider.js';
import { TerrainType, getTerrainBonus } from './terrain.js';
import { getEnergyEffects, getEnergyStatus, EnergyConfig } from './energy.js';
import { AIDifficulty } from './teams.js';
import { computeRiskCue, toRiskReading } from './risk_cues.js';
import { RaceWeather } from './race_weather.js';

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * AI Personality types - affects decision making style
 */
export const AIPersonality = {
  ATTACKER: 'attacker',       // Aggressive, uses attacks early, takes risks
  CONSERVATIVE: 'conservative', // Saves energy, attacks only when certain
  OPPORTUNIST: 'opportunist',  // Adapts to situation, exploits openings
  BALANCED: 'balanced'         // Default balanced approach
};

/**
 * AI Tactical profiles - risk posture and positioning preferences
 */
export const AITacticalProfile = {
  CONSERVATEUR: 'conservateur',
  EQUILIBRE: 'equilibre',
  OPPORTUNISTE: 'opportuniste'
};

const TacticalProfileModifiers = {
  [AITacticalProfile.CONSERVATEUR]: {
    attackBias: -0.2,
    riskTolerance: -0.25,
    windAcceptance: -0.2
  },
  [AITacticalProfile.EQUILIBRE]: {
    attackBias: 0,
    riskTolerance: 0,
    windAcceptance: 0
  },
  [AITacticalProfile.OPPORTUNISTE]: {
    attackBias: 0.2,
    riskTolerance: 0.25,
    windAcceptance: 0.2
  }
};

const TacticalProfileNames = {
  [AITacticalProfile.CONSERVATEUR]: 'Conservateur',
  [AITacticalProfile.EQUILIBRE]: 'Équilibré',
  [AITacticalProfile.OPPORTUNISTE]: 'Opportuniste'
};

/**
 * Team roles for strategy
 */
export const TeamRole = {
  LEADER: 'leader',           // Protected rider, priority for winning
  DOMESTIQUE: 'domestique',   // Support rider, works for leader
  FREE_RIDER: 'free_rider'    // Can go for opportunities
};

/**
 * AI decision result
 * @typedef {Object} AIDecision
 */

/**
 * Main AI class for making game decisions
 */
export class CyclingAI {
  constructor(difficulty = AIDifficulty.NORMAL, personality = null, options = {}) {
    this.random = options.random || Math.random;
    this.difficulty = difficulty;
    this.personality = personality || this.assignRandomPersonality();
    this.aiProfile = this.resolveTacticalProfile(options.aiProfile);
    this.profileModifiers = this.getTacticalProfileModifiers(this.aiProfile);
    this.thinkingDelay = this.getThinkingDelay();
    this.teamRoles = new Map(); // riderId -> role
    this.raceAnalysis = null;
  }

  /**
   * Assign random personality based on difficulty
   */
  assignRandomPersonality() {
    const personalities = Object.values(AIPersonality);
    if (this.difficulty === AIDifficulty.EASY) {
      // Easy AI is always balanced
      return AIPersonality.BALANCED;
    }
    // Normal/Hard get random personality
    return personalities[Math.floor(this.random() * personalities.length)];
  }

  /**
   * Resolve tactical profile, defaulting to equilibré.
   */
  resolveTacticalProfile(profile) {
    const profiles = Object.values(AITacticalProfile);
    if (profiles.includes(profile)) return profile;
    return AITacticalProfile.EQUILIBRE;
  }

  /**
   * Get tactical profile modifiers for decision biasing.
   */
  getTacticalProfileModifiers(profile = this.aiProfile) {
    return TacticalProfileModifiers[profile] || TacticalProfileModifiers[AITacticalProfile.EQUILIBRE];
  }

  /**
   * Get tactical profile name for display.
   */
  getTacticalProfileName() {
    return TacticalProfileNames[this.aiProfile] || 'Inconnu';
  }

  /**
   * Get thinking delay based on difficulty
   */
  getThinkingDelay() {
    switch (this.difficulty) {
      case AIDifficulty.EASY: return 800;
      case AIDifficulty.NORMAL: return 600;
      case AIDifficulty.HARD: return 400;
      default: return 600;
    }
  }

  /**
   * Analyze race situation before making decisions
   */
  analyzeRace(state, teamId) {
    const myRiders = state.riders.filter(r => r.team === teamId && !r.hasFinished);
    const opponents = state.riders.filter(r => r.team !== teamId && !r.hasFinished);
    
    // Find positions
    const allPositions = state.riders
      .filter(r => !r.hasFinished)
      .map(r => r.position)
      .sort((a, b) => b - a);
    
    const leaderPosition = allPositions[0] || 0;
    const pelotonCenter = allPositions.length > 0 
      ? allPositions.reduce((a, b) => a + b, 0) / allPositions.length 
      : 0;
    
    // Find my best rider
    const myBestRider = myRiders.reduce((best, r) => 
      r.position > (best?.position || 0) ? r : best, null);
    
    // Find closest threat
    const closestOpponent = opponents.reduce((closest, r) => {
      if (!myBestRider) return r;
      const myDist = myBestRider.position;
      const oppDist = r.position;
      if (!closest) return r;
      return Math.abs(oppDist - myDist) < Math.abs(closest.position - myDist) ? r : closest;
    }, null);
    
    // Race phase analysis
    const distanceToFinish = state.courseLength - leaderPosition;
    let racePhase;
    if (distanceToFinish > state.courseLength * 0.7) {
      racePhase = 'early';
    } else if (distanceToFinish > state.courseLength * 0.3) {
      racePhase = 'middle';
    } else if (distanceToFinish > 10) {
      racePhase = 'final';
    } else {
      racePhase = 'sprint';
    }
    
    // Gap analysis
    const myPositions = myRiders.map(r => r.position).sort((a, b) => b - a);
    const gapToLeader = myBestRider ? leaderPosition - myBestRider.position : 999;
    
    this.raceAnalysis = {
      leaderPosition,
      pelotonCenter,
      myBestRider,
      myRiders,
      opponents,
      closestOpponent,
      racePhase,
      distanceToFinish,
      gapToLeader,
      isLeading: myBestRider?.position === leaderPosition,
      isChasing: gapToLeader > 3 && gapToLeader < 15,
      isDropped: gapToLeader > 15
    };
    
    // Assign team roles
    this.assignTeamRoles(myRiders, state);
    
    return this.raceAnalysis;
  }

  /**
   * Assign roles to team riders
   */
  assignTeamRoles(myRiders, state) {
    this.teamRoles.clear();
    
    if (myRiders.length === 0) return;
    
    // Sort by potential (position + energy + cards)
    const ranked = myRiders.map(r => ({
      rider: r,
      potential: this.calculateRiderPotential(r, state)
    })).sort((a, b) => b.potential - a.potential);
    
    // Best rider is leader
    if (ranked.length > 0) {
      this.teamRoles.set(ranked[0].rider.id, TeamRole.LEADER);
    }
    
    // Second best is free rider (can attack if opportunity)
    if (ranked.length > 1) {
      this.teamRoles.set(ranked[1].rider.id, TeamRole.FREE_RIDER);
    }
    
    // Rest are domestiques
    for (let i = 2; i < ranked.length; i++) {
      this.teamRoles.set(ranked[i].rider.id, TeamRole.DOMESTIQUE);
    }
  }

  /**
   * Calculate rider's winning potential
   */
  calculateRiderPotential(rider, state) {
    let potential = 0;
    
    // Position weight
    potential += rider.position * 2;
    
    // Energy weight
    potential += rider.energy * 0.5;
    
    // Cards weight
    potential += (rider.hand?.length || 0) * 5;
    potential += (rider.attackCards?.length || 0) * 15;
    potential += (rider.specialtyCards?.length || 0) * 8;
    
    // Type bonus for terrain ahead
    const upcomingTerrain = this.analyzeUpcomingTerrain(state, rider.position);
    if (upcomingTerrain.favorableDistance > 0) {
      potential += upcomingTerrain.favorableDistance * 3;
    }
    
    return potential;
  }

  /**
   * Analyze upcoming terrain for a rider
   */
  analyzeUpcomingTerrain(state, position) {
    let favorableDistance = 0;
    let unfavorableDistance = 0;
    
    const lookAhead = Math.min(20, state.courseLength - position);
    
    for (let i = 1; i <= lookAhead; i++) {
      const pos = position + i;
      if (pos >= state.courseLength) break;
      
      const terrain = state.course[pos]?.terrain || TerrainType.FLAT;
      // We don't know rider type here, so just track terrain changes
      if (terrain === TerrainType.MOUNTAIN || terrain === TerrainType.HILL) {
        favorableDistance++; // Assume checking for climbing potential
      }
    }
    
    return { favorableDistance, unfavorableDistance, lookAhead };
  }

  /**
   * Build a qualitative risk cue reading for a rider.
   */
  getRiskCueReading(state, rider) {
    if (!state || !rider) {
      return { level: 'low', reason: 'group' };
    }

    const position = rider.position || 0;
    const courseIndex = position - 1;
    const cell = state.course?.[courseIndex];
    const terrain = cell?.terrain || this.getTerrainAtPosition(state, position);
    const isCobbles = !!cell?.isCobbles;
    const groupSize = state.riders
      .filter(r => !r.hasFinished && r.position === position).length;
    const isExposed = groupSize <= 1 || (rider.windPenaltyNextMove || 0) > 0;
    const weather = state.raceEventState?.weather || RaceWeather.CLEAR;

    const cue = computeRiskCue({
      terrain,
      isCobbles,
      isExposed,
      weather
    });

    return toRiskReading(cue);
  }

  /**
   * Check if the rider is currently on a cobbles overlay cell.
   */
  isRiderOnCobbles(state, rider) {
    if (!state || !rider) return false;
    const position = rider.position || 0;
    const courseIndex = position - 1;
    return !!state.course?.[courseIndex]?.isCobbles;
  }

  /**
   * Adjust card index for cobbles positioning by tactical profile.
   */
  getCobblesCardAdjustment({ rider }) {
    if (!rider) return 0;
    if (this.aiProfile === AITacticalProfile.CONSERVATEUR) {
      if (rider.type === RiderType.CLIMBER) return -2;
      if (rider.type === RiderType.ROULEUR) return 1;
      return -1;
    }
    if (this.aiProfile === AITacticalProfile.OPPORTUNISTE) {
      if (rider.type === RiderType.SPRINTER) return 1;
      if (rider.type === RiderType.ROULEUR) return 1;
      return 0;
    }
    return 0;
  }

  /**
   * Apply qualitative risk cues to tactical decisions.
   */
  riskAwareDecision(action, context = {}) {
    const { state, rider } = context;
    const riskCue = context.riskCue || this.getRiskCueReading(state, rider);
    const analysis = context.analysis || this.raceAnalysis;
    const modifiers = this.profileModifiers;
    const energy = rider?.energy ?? 100;
    const isCobbles = context.isCobbles ?? this.isRiderOnCobbles(state, rider);

    if (action === 'attack') {
      const baseDecision = !!context.baseDecision;
      if (!baseDecision) return { allow: false, riskCue };
      if (!rider || !state) return { allow: baseDecision, riskCue };

      const terrain = context.terrain || this.getTerrainAtPosition(state, rider.position);
      const terrainBonus = getTerrainBonus(rider.type, terrain);
      const favorableProfile = terrainBonus > 0 || (rider.energy || 0) > 70;
      const riskBias = modifiers.riskTolerance + modifiers.attackBias * 0.4;

      if (this.aiProfile === AITacticalProfile.OPPORTUNISTE && riskCue.level === 'high' && energy < 40) {
        return { allow: false, riskCue };
      }

      if (riskCue.level === 'low') {
        if (modifiers.attackBias < 0 && this.random() < Math.abs(modifiers.attackBias)) {
          return { allow: false, riskCue };
        }
        return { allow: true, riskCue };
      }

      if (riskCue.level === 'medium') {
        if (!favorableProfile) return { allow: false, riskCue };
        const avoidThreshold = clampValue(0.35 - riskBias, 0.1, 0.8);
        if (this.random() < avoidThreshold) return { allow: false, riskCue };
        return { allow: true, riskCue };
      }

      if (riskCue.level === 'high') {
        if (!favorableProfile) return { allow: false, riskCue };
        const isLateRace = context.distanceToFinish <= 12 || analysis?.racePhase === 'sprint';
        if (!isLateRace && this.personality !== AIPersonality.ATTACKER) {
          return { allow: false, riskCue };
        }
        const avoidThreshold = clampValue(0.8 - riskBias * 0.6, 0.4, 0.95);
        if (this.random() < avoidThreshold) return { allow: false, riskCue };
        return { allow: true, riskCue };
      }
    }

    if (action === 'wind') {
      if (riskCue.level === 'low') return { avoidWind: false, riskCue };
      const reasonSignals = riskCue.reason === 'group' || riskCue.reason === 'weather';
      const baseAvoid = riskCue.level === 'high' || reasonSignals;
      const chance = riskCue.level === 'high' ? 0.7 : 0.4;
      const adjustedChance = clampValue(chance - modifiers.windAcceptance * 0.3, 0.1, 0.9);
      const avoidWind = baseAvoid && this.random() < adjustedChance;
      return { avoidWind, riskCue };
    }

    if (action === 'card') {
      const { cards = [], selectedCard } = context;
      if (!selectedCard || cards.length === 0) return { card: selectedCard, riskCue };

      const sorted = [...cards].sort((a, b) => a.value - b.value);
      const baseIndex = sorted.findIndex(c => c.id === selectedCard.id);
      if (baseIndex < 0) return { card: selectedCard, riskCue };

      const protectLeader = riskCue.level !== 'low' &&
        context.role !== TeamRole.LEADER &&
        analysis?.myBestRider?.id &&
        analysis.myBestRider.id !== rider?.id;
      const baseDownshiftChance = riskCue.level === 'high' ? 0.75 : 0.4;
      const downshiftChance = clampValue(
        baseDownshiftChance - modifiers.riskTolerance - modifiers.attackBias * 0.3,
        0.1,
        0.95
      );
      let shouldDownshift = riskCue.level !== 'low' && this.random() < downshiftChance;
      if (context.avoidWind) shouldDownshift = true;
      if (protectLeader) shouldDownshift = true;
      if (this.aiProfile === AITacticalProfile.OPPORTUNISTE && riskCue.level === 'high' && energy < 40) {
        shouldDownshift = true;
      }

      let targetIndex = baseIndex;
      if (shouldDownshift) {
        const dropChanceBase = riskCue.level === 'high' ? 0.5 : 0.2;
        const dropChance = clampValue(
          dropChanceBase - modifiers.riskTolerance * 0.2,
          0.1,
          0.8
        );
        const dropSteps = this.random() < dropChance ? 2 : 1;
        targetIndex = Math.max(0, baseIndex - dropSteps);
      }

      if (isCobbles) {
        const cobblesAdjustment = this.getCobblesCardAdjustment({ rider });
        targetIndex = clampValue(targetIndex + cobblesAdjustment, 0, sorted.length - 1);
      }

      if (this.aiProfile === AITacticalProfile.OPPORTUNISTE && riskCue.level === 'high' && energy < 40) {
        targetIndex = 0;
      }

      if (targetIndex === baseIndex) return { card: selectedCard, riskCue };
      return { card: sorted[targetIndex], riskCue };
    }

    return { riskCue };
  }

  /**
   * Make a decision based on current game state and phase
   */
  makeDecision(state, phase, teamId) {
    // Analyze race before each decision
    this.analyzeRace(state, teamId);
    
    switch (phase) {
      case 'select_rider':
        return this.selectRider(state, teamId);
      case 'select_card':
        return this.selectCard(state, teamId);
      case 'roll_dice':
        return { type: 'roll_dice', reason: 'Lancer automatique' };
      case 'select_specialty':
        return this.decideSpecialty(state, teamId);
      case 'resolve':
        return { type: 'resolve', reason: 'Résolution automatique' };
      default:
        return { type: 'wait', reason: 'Phase non gérée' };
    }
  }

  /**
   * Select which rider to play
   */
  selectRider(state, teamId) {
    const availableRiders = state.riders.filter(r => 
      r.team === teamId && 
      !state.ridersPlayedThisTurn.includes(r.id) &&
      !r.hasFinished &&
      !r.turnsToSkip
    );

    if (availableRiders.length === 0) {
      return { type: 'no_rider', reason: 'Aucun coureur disponible' };
    }

    // Score each rider based on situation and personality
    const scoredRiders = availableRiders.map(rider => ({
      rider,
      score: this.scoreRiderSelection(rider, state),
      role: this.teamRoles.get(rider.id) || TeamRole.FREE_RIDER
    }));

    // Sort by score descending
    scoredRiders.sort((a, b) => b.score - a.score);

    // Selection logic based on difficulty and personality
    let selectedRider;
    
    if (this.difficulty === AIDifficulty.EASY && this.random() < 0.3) {
      // 30% chance to pick randomly
      selectedRider = availableRiders[Math.floor(this.random() * availableRiders.length)];
    } else if (this.personality === AIPersonality.CONSERVATIVE) {
      // Conservative: play domestiques first to protect leader
      const domestiques = scoredRiders.filter(s => s.role === TeamRole.DOMESTIQUE);
      if (domestiques.length > 0 && this.raceAnalysis?.racePhase !== 'sprint') {
        selectedRider = domestiques[0].rider;
      } else {
        selectedRider = scoredRiders[0].rider;
      }
    } else if (this.personality === AIPersonality.ATTACKER && this.raceAnalysis?.racePhase === 'final') {
      // Attacker in final: play leader first
      const leader = scoredRiders.find(s => s.role === TeamRole.LEADER);
      selectedRider = leader?.rider || scoredRiders[0].rider;
    } else {
      selectedRider = scoredRiders[0].rider;
    }

    const role = this.teamRoles.get(selectedRider.id);
    return {
      type: 'select_rider',
      riderId: selectedRider.id,
      reason: `${selectedRider.name} (${role || 'coureur'})`
    };
  }

  /**
   * Score a rider for selection priority
   */
  scoreRiderSelection(rider, state) {
    let score = 50;
    const terrain = this.getTerrainAtPosition(state, rider.position);
    const terrainBonus = getTerrainBonus(rider.type, terrain);
    const role = this.teamRoles.get(rider.id);
    const analysis = this.raceAnalysis;

    // Terrain advantage
    score += terrainBonus * 10;

    // Position bonus
    score += rider.position * 0.5;

    // Energy status
    const energyStatus = getEnergyStatus(rider.energy);
    if (energyStatus === 'normal') score += 10;
    if (energyStatus === 'tired') score -= 5;
    if (energyStatus === 'exhausted') score -= 15;
    if (energyStatus === 'fringale') score -= 30;

    // Specialty cards on right terrain
    if (rider.specialtyCards?.length > 0) {
      const specialtyTerrain = this.getSpecialtyTerrain(rider.type);
      if (terrain === specialtyTerrain) {
        score += 15;
      }
    }

    // Role-based scoring
    if (role === TeamRole.LEADER) {
      if (analysis?.racePhase === 'final' || analysis?.racePhase === 'sprint') {
        score += 25; // Leader priority in final
      }
    } else if (role === TeamRole.DOMESTIQUE) {
      if (analysis?.isChasing && rider.energy > 50) {
        score += 15; // Domestique to chase
      }
    }

    // Personality modifiers
    if (this.personality === AIPersonality.ATTACKER) {
      if (rider.attackCards?.length > 0) score += 10;
      if (rider.position > analysis?.pelotonCenter) score += 5;
    } else if (this.personality === AIPersonality.CONSERVATIVE) {
      if (rider.energy > 70) score += 10;
      if (role === TeamRole.DOMESTIQUE) score += 5;
    } else if (this.personality === AIPersonality.OPPORTUNIST) {
      // Check for breakaway opportunity
      const ridersAhead = state.riders.filter(r => 
        r.position > rider.position && !r.hasFinished
      ).length;
      if (ridersAhead < 3 && terrainBonus > 0) {
        score += 20; // Good opportunity to break
      }
    }

    // Hard AI: consider attack cards for strategic moments
    if (this.difficulty === AIDifficulty.HARD) {
      const distanceToFinish = state.courseLength - rider.position;
      if (distanceToFinish < 20 && rider.attackCards?.length > 0) {
        score += 20;
      }
    }

    return score;
  }

  /**
   * Select which card to play
   */
  selectCard(state, teamId) {
    const rider = state.riders.find(r => r.id === state.selectedRiderId);
    if (!rider) {
      return { type: 'error', reason: 'Coureur non trouvé' };
    }

    const terrain = this.getTerrainAtPosition(state, rider.position);
    const energyEffects = getEnergyEffects(rider.energy);
    const distanceToFinish = state.courseLength - rider.position;
    const role = this.teamRoles.get(rider.id);
    const riskCue = this.getRiskCueReading(state, rider);
    const courseIndex = (rider.position || 0) - 1;
    const isCobbles = !!state.course?.[courseIndex]?.isCobbles;

    // Get available cards
    const movementCards = rider.hand || [];
    const attackCards = energyEffects.canUseAttackCard ? (rider.attackCards || []) : [];

    // Decision: use attack card?
    if (attackCards.length > 0 && this.shouldUseAttack(rider, state, distanceToFinish, role, riskCue)) {
      const attackCard = attackCards[0];
      return {
        type: 'select_card',
        cardId: attackCard.id,
        isAttack: true,
        reason: `Attaque ${this.personality} ! (${distanceToFinish} cases)`
      };
    }

    // Select best movement card
    if (movementCards.length === 0) {
      return { type: 'error', reason: 'Aucune carte disponible' };
    }

    const selectedCard = this.selectBestMovementCard(movementCards, rider, state, terrain, role, riskCue, isCobbles);
    return {
      type: 'select_card',
      cardId: selectedCard.id,
      reason: `Carte +${selectedCard.value}`
    };
  }

  /**
   * Decide whether to use attack card
   */
  shouldUseAttack(rider, state, distanceToFinish, role, riskCue = null) {
    const baseDecision = this.shouldUseAttackBase(rider, state, distanceToFinish, role);
    const riskDecision = this.riskAwareDecision('attack', {
      baseDecision,
      rider,
      state,
      role,
      distanceToFinish,
      analysis: this.raceAnalysis,
      riskCue
    });
    return riskDecision.allow;
  }

  shouldUseAttackBase(rider, state, distanceToFinish, role) {
    const analysis = this.raceAnalysis;
    
    // Domestiques rarely attack (unless opportunity)
    if (role === TeamRole.DOMESTIQUE && this.difficulty !== AIDifficulty.EASY) {
      if (this.personality !== AIPersonality.OPPORTUNIST) {
        return false;
      }
      // Opportunist domestique can attack if breakaway possible
      if (analysis?.gapToLeader < 5) return false;
    }

    // Easy: rarely attacks
    if (this.difficulty === AIDifficulty.EASY) {
      return distanceToFinish < 10 && this.random() < 0.3;
    }

    // Personality-based attack decisions
    if (this.personality === AIPersonality.ATTACKER) {
      // Attackers attack earlier and more often
      if (distanceToFinish < 25) return true;
      if (analysis?.racePhase === 'middle' && rider.energy > 60) {
        return this.random() < 0.4;
      }
      // Attack in mountains if climber
      const terrain = this.getTerrainAtPosition(state, rider.position);
      if (terrain === TerrainType.MOUNTAIN && rider.type === RiderType.CLIMBER) {
        return this.random() < 0.5;
      }
    } else if (this.personality === AIPersonality.CONSERVATIVE) {
      // Conservative only attacks when sure
      if (distanceToFinish > 15) return false;
      if (rider.energy < 50) return false;
      if (analysis?.isLeading) return false; // Don't attack when leading
      return distanceToFinish < 10 && this.random() < 0.6;
    } else if (this.personality === AIPersonality.OPPORTUNIST) {
      // Opportunist attacks when opening appears
      if (analysis?.gapToLeader > 3 && analysis?.gapToLeader < 10) {
        return this.random() < 0.5; // Bridge the gap
      }
      if (distanceToFinish < 20) return true;
    }

    // Normal: attacks in final
    if (this.difficulty === AIDifficulty.NORMAL) {
      return distanceToFinish < 15 && this.random() < 0.5;
    }

    // Hard: strategic attacks
    if (this.difficulty === AIDifficulty.HARD) {
      if (distanceToFinish < 20) return true;
      
      if (rider.energy > 60) {
        const terrain = this.getTerrainAtPosition(state, rider.position);
        const bonus = getTerrainBonus(rider.type, terrain);
        if (bonus > 0) return this.random() < 0.4;
      }
    }

    return false;
  }

  /**
   * Select best movement card from hand
   */
  selectBestMovementCard(cards, rider, state, terrain, role, riskCue = null, isCobbles = false) {
    const baseCard = this.selectBestMovementCardBase(cards, rider, state, terrain, role);
    const windDecision = this.riskAwareDecision('wind', {
      rider,
      state,
      role,
      analysis: this.raceAnalysis,
      riskCue
    });
    const riskDecision = this.riskAwareDecision('card', {
      rider,
      state,
      role,
      analysis: this.raceAnalysis,
      cards,
      selectedCard: baseCard,
      terrain,
      riskCue,
      avoidWind: windDecision.avoidWind,
      isCobbles
    });
    return riskDecision.card || baseCard;
  }

  selectBestMovementCardBase(cards, rider, state, terrain, role) {
    const energyStatus = getEnergyStatus(rider.energy);
    const analysis = this.raceAnalysis;
    
    // If fringale, play lowest card to conserve
    if (energyStatus === 'fringale') {
      return cards.reduce((min, c) => c.value < min.value ? c : min, cards[0]);
    }

    // Domestique strategy: manage energy for later
    if (role === TeamRole.DOMESTIQUE && this.difficulty !== AIDifficulty.EASY) {
      if (analysis?.racePhase === 'early' || analysis?.racePhase === 'middle') {
        // Play medium cards to stay with peloton
        const sorted = [...cards].sort((a, b) => a.value - b.value);
        const midIndex = Math.floor(sorted.length / 2);
        return sorted[midIndex];
      }
    }

    // If exhausted, prefer medium cards
    if (energyStatus === 'exhausted') {
      const sorted = [...cards].sort((a, b) => a.value - b.value);
      return sorted[Math.floor(sorted.length / 2)];
    }

    // Easy: random card
    if (this.difficulty === AIDifficulty.EASY) {
      return cards[Math.floor(this.random() * cards.length)];
    }

    // Check terrain advantage
    const bonus = getTerrainBonus(rider.type, terrain);
    
    // Personality-based card selection
    if (this.personality === AIPersonality.ATTACKER) {
      // Always play high cards
      return cards.reduce((max, c) => c.value > max.value ? c : max, cards[0]);
    } else if (this.personality === AIPersonality.CONSERVATIVE) {
      // Save high cards for final
      if (analysis?.racePhase === 'early' || analysis?.racePhase === 'middle') {
        const sorted = [...cards].sort((a, b) => a.value - b.value);
        return sorted[0]; // Play lowest
      }
      // In final, play high
      return cards.reduce((max, c) => c.value > max.value ? c : max, cards[0]);
    }
    
    // Hard with favorable terrain
    if (this.difficulty === AIDifficulty.HARD && bonus > 0) {
      return cards.reduce((max, c) => c.value > max.value ? c : max, cards[0]);
    }

    // Normal: play medium-high card
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const index = Math.min(1, sorted.length - 1);
    return sorted[index];
  }

  /**
   * Decide whether to use specialty card
   */
  decideSpecialty(state, teamId) {
    const rider = state.riders.find(r => r.id === state.selectedRiderId);
    if (!rider) {
      return { type: 'skip_specialty', reason: 'Coureur non trouvé' };
    }

    const terrain = this.getTerrainAtPosition(state, rider.position);
    const specialtyTerrain = this.getSpecialtyTerrain(rider.type);
    const energyEffects = getEnergyEffects(rider.energy);
    const role = this.teamRoles.get(rider.id);
    const analysis = this.raceAnalysis;

    // Can't use if no cards or energy restrictions
    if (!rider.specialtyCards || rider.specialtyCards.length === 0) {
      return { type: 'skip_specialty', reason: 'Pas de carte spécialité' };
    }

    if (!energyEffects.canUseSpecialty) {
      return { type: 'skip_specialty', reason: 'Énergie insuffisante' };
    }

    // Only use on matching terrain
    if (terrain !== specialtyTerrain) {
      return { type: 'skip_specialty', reason: 'Mauvais terrain' };
    }

    const distanceToFinish = state.courseLength - rider.position;
    const cardsRemaining = rider.specialtyCards.length;

    // Domestique: save specialty for leader if possible
    if (role === TeamRole.DOMESTIQUE && this.difficulty === AIDifficulty.HARD) {
      if (analysis?.racePhase !== 'final' && cardsRemaining <= 1) {
        return { type: 'skip_specialty', reason: 'Garde pour plus tard' };
      }
    }

    // Easy: 50% chance
    if (this.difficulty === AIDifficulty.EASY) {
      if (this.random() < 0.5) {
        return { type: 'use_specialty', useSpecialty: true, reason: 'Utilisation spécialité' };
      }
      return { type: 'skip_specialty', reason: 'Économie de carte' };
    }

    // Personality-based specialty use
    if (this.personality === AIPersonality.ATTACKER) {
      // Attackers always use specialty
      return { type: 'use_specialty', useSpecialty: true, reason: 'Attaque spécialité !' };
    } else if (this.personality === AIPersonality.CONSERVATIVE) {
      // Save for final
      if (distanceToFinish > 20 && cardsRemaining <= 1) {
        return { type: 'skip_specialty', reason: 'Garde pour le final' };
      }
      if (distanceToFinish <= 15) {
        return { type: 'use_specialty', useSpecialty: true, reason: 'Moment clé' };
      }
      return { type: 'skip_specialty', reason: 'Économie' };
    } else if (this.personality === AIPersonality.OPPORTUNIST) {
      // Use if good opportunity
      if (analysis?.isChasing || distanceToFinish < 25) {
        return { type: 'use_specialty', useSpecialty: true, reason: 'Opportunité !' };
      }
    }

    // Normal: use if close to finish or on good terrain segment
    if (this.difficulty === AIDifficulty.NORMAL) {
      if (distanceToFinish < 30 || this.random() < 0.6) {
        return { type: 'use_specialty', useSpecialty: true, reason: 'Utilisation spécialité' };
      }
    }

    // Hard: strategic use
    if (this.difficulty === AIDifficulty.HARD) {
      if (cardsRemaining === 1 && distanceToFinish > 25) {
        return { type: 'skip_specialty', reason: 'Garde pour le final' };
      }
      return { type: 'use_specialty', useSpecialty: true, reason: 'Terrain favorable' };
    }

    return { type: 'skip_specialty', reason: 'Par défaut' };
  }

  /**
   * Get terrain at position from state
   */
  getTerrainAtPosition(state, position) {
    if (position < 0) return TerrainType.FLAT;
    if (position >= state.courseLength) return TerrainType.SPRINT;
    return state.course[position]?.terrain || TerrainType.FLAT;
  }

  /**
   * Get specialty terrain for rider type
   */
  getSpecialtyTerrain(riderType) {
    const map = {
      [RiderType.CLIMBER]: TerrainType.MOUNTAIN,
      [RiderType.PUNCHEUR]: TerrainType.HILL,
      [RiderType.ROULEUR]: TerrainType.FLAT,
      [RiderType.SPRINTER]: TerrainType.SPRINT
    };
    return map[riderType] || TerrainType.FLAT;
  }

  /**
   * Get AI personality name for display
   */
  getPersonalityName() {
    const names = {
      [AIPersonality.ATTACKER]: 'Attaquant',
      [AIPersonality.CONSERVATIVE]: 'Conservateur',
      [AIPersonality.OPPORTUNIST]: 'Opportuniste',
      [AIPersonality.BALANCED]: 'Équilibré'
    };
    return names[this.personality] || 'Inconnu';
  }
}

/**
 * Create AI instance with given difficulty and optional personality
 */
export function createAI(difficulty = AIDifficulty.NORMAL, personality = null, options = {}) {
  return new CyclingAI(difficulty, personality, options);
}

/**
 * Execute AI turn with delays for animation
 */
export async function executeAITurn(ai, state, phase, teamId, callback) {
  await new Promise(resolve => setTimeout(resolve, ai.thinkingDelay));
  const decision = ai.makeDecision(state, phase, teamId);
  callback(decision);
}

/**
 * Get all available personalities
 */
export function getPersonalities() {
  return Object.values(AIPersonality);
}
