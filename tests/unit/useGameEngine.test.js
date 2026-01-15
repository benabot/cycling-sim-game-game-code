import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const baseState = {
  course: [{ terrain: 'mountain', isCobbles: false }],
  riders: [
    {
      id: 'r1',
      team: 'team_b',
      name: 'AI Rider',
      type: 'climber',
      position: 0,
      energy: 80,
      attackCards: [{ id: 'atk1', value: 6 }],
      specialtyCards: [{ id: 'spe1', value: 2 }],
      hand: [{ id: 'c1', value: 4, name: 'Test' }],
      windPenaltyNextMove: 0,
      hasFinished: false,
      attacksUsed: 0
    },
    {
      id: 'r2',
      team: 'team_a',
      name: 'Human Rider',
      type: 'rouleur',
      position: 0,
      energy: 80,
      attackCards: [],
      specialtyCards: [],
      hand: [],
      windPenaltyNextMove: 0,
      hasFinished: false,
      attacksUsed: 0
    }
  ],
  teamIds: ['team_a', 'team_b'],
  players: [
    { teamId: 'team_a', playerType: 'human' },
    {
      teamId: 'team_b',
      playerType: 'ai',
      difficulty: 'hard',
      aiProfile: 'opportuniste',
      personality: 'attacker'
    }
  ],
  currentTeam: 'team_b',
  currentTurn: 1,
  phase: 'playing',
  turnPhase: 'select_rider',
  selectedRiderId: null,
  selectedCardId: null,
  selectedSpecialtyId: null,
  lastDiceRoll: null,
  calculatedMovement: 0,
  ridersPlayedThisTurn: [],
  courseLength: 10,
  finishLine: 10,
  gameLog: [],
  endTurnEffects: [],
  raceEventState: { weather: 'clear', nextWeather: null }
};

const makeState = () => JSON.parse(JSON.stringify(baseState));

vi.mock('../../src/core/game_engine.js', () => {
  const TurnPhase = {
    SELECT_RIDER: 'select_rider',
    SELECT_CARD: 'select_card',
    ROLL_DICE: 'roll_dice',
    SELECT_SPECIALTY: 'select_specialty',
    RESOLVE: 'resolve',
    END_TURN_EFFECTS: 'end_turn_effects'
  };

  return {
    TurnPhase,
    createGameState: vi.fn(() => makeState()),
    getRidersAtPosition: vi.fn(() => []),
    getLeaderAtPosition: vi.fn(() => null),
    getTerrainAt: vi.fn(() => 'mountain'),
    selectRider: vi.fn((state, riderId) => ({
      ...state,
      selectedRiderId: riderId,
      turnPhase: TurnPhase.SELECT_CARD
    })),
    deselectRider: vi.fn(state => ({
      ...state,
      selectedRiderId: null,
      turnPhase: TurnPhase.SELECT_RIDER
    })),
    selectCard: vi.fn((state, cardId) => ({
      ...state,
      selectedCardId: cardId,
      turnPhase: TurnPhase.ROLL_DICE
    })),
    deselectCard: vi.fn(state => ({
      ...state,
      selectedCardId: null,
      turnPhase: TurnPhase.SELECT_CARD
    })),
    rollDice: vi.fn(state => ({
      ...state,
      lastDiceRoll: { result: 4, isOne: false }
    })),
    selectSpecialty: vi.fn((state, cardId) => ({
      ...state,
      selectedSpecialtyId: cardId,
      turnPhase: TurnPhase.RESOLVE
    })),
    calculateMovement: vi.fn(() => 7),
    calculatePreviewPositions: vi.fn(() => ({ positionWithout: 4, positionWith: 6 })),
    resolveMovement: vi.fn(state => {
      const riderId = state.selectedRiderId;
      const riders = state.riders.map(r =>
        r.id === riderId
          ? { ...r, position: r.position + 7, energy: r.energy - 3, attacksUsed: r.attacksUsed }
          : r
      );
      return {
        ...state,
        riders,
        turnPhase: TurnPhase.SELECT_RIDER,
        lastMovement: { type: 'move' }
      };
    }),
    acknowledgeEndTurnEffects: vi.fn(state => ({
      ...state,
      currentTurn: state.currentTurn + 1,
      turnPhase: TurnPhase.SELECT_RIDER
    })),
    isCurrentTeamAI: vi.fn(() => true),
    getCurrentTeamAIDifficulty: vi.fn(() => 'normal')
  };
});

vi.mock('../../src/core/ai.js', () => {
  return {
    CyclingAI: class {},
    AITacticalProfile: {
      CONSERVATEUR: 'conservateur',
      EQUILIBRE: 'equilibre',
      OPPORTUNISTE: 'opportuniste'
    },
    createAI: vi.fn(() => ({
      aiProfile: 'opportuniste',
      thinkingDelay: 0,
      getTacticalProfileName: () => 'Opportuniste',
      makeDecision: vi.fn(() => ({ type: 'wait' }))
    }))
  };
});

import { useGameEngine } from '../../src/composables/useGameEngine.js';
import * as gameEngine from '../../src/core/game_engine.js';
import * as aiModule from '../../src/core/ai.js';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useGameEngine', () => {
  it('initializes state and AI instances', () => {
    const engine = useGameEngine();
    engine.initialize({ players: baseState.players });

    expect(gameEngine.createGameState).toHaveBeenCalled();
    expect(aiModule.createAI).toHaveBeenCalledWith(
      'hard',
      'attacker',
      expect.objectContaining({ aiProfile: 'opportuniste' })
    );
    expect(engine.aiProfiles.value.team_b).toBe('opportuniste');
    expect(engine.gameLog.value.length).toBeGreaterThan(0);
  });

  it('selects and cancels rider selection with view-only fallback', () => {
    const engine = useGameEngine();
    engine.initialize({ players: baseState.players });

    engine.selectRider('r1');
    expect(gameEngine.selectRider).toHaveBeenCalled();
    expect(engine.selectedRiderId.value).toBe('r1');

    engine.selectRider('r1', { viewOnly: true });
    gameEngine.deselectRider.mockClear();
    engine.cancelRiderSelection();

    expect(gameEngine.deselectRider).not.toHaveBeenCalled();
    expect(engine.selectedRiderId.value).toBeNull();
  });

  it('rolls dice and computes movement with specialty phase', () => {
    const engine = useGameEngine();
    engine.initialize({ players: baseState.players });

    engine.selectRider('r1');
    engine.selectCard('c1');
    engine.rollDice();

    expect(gameEngine.rollDice).toHaveBeenCalled();
    expect(gameEngine.calculateMovement).toHaveBeenCalled();
    expect(engine.calculatedMovement.value).toBe(7);
    expect(engine.turnPhase.value).toBe(gameEngine.TurnPhase.SELECT_SPECIALTY);
  });

  it('executes an AI turn and clears thinking state', async () => {
    const makeDecision = vi.fn((state, phase) => {
      if (phase === 'select_rider') {
        return { type: 'select_rider', riderId: 'r1' };
      }
      if (phase === 'select_card') {
        return { type: 'select_card', cardId: 'c1' };
      }
      if (phase === 'select_specialty') {
        return { type: 'use_specialty' };
      }
      return { type: 'resolve' };
    });

    aiModule.createAI.mockReturnValue({
      aiProfile: 'opportuniste',
      thinkingDelay: 0,
      getTacticalProfileName: () => 'Opportuniste',
      makeDecision
    });

    const engine = useGameEngine();
    engine.initialize({ players: baseState.players });

    vi.useFakeTimers();
    const promise = engine.executeAITurn();
    expect(engine.isAIThinking.value).toBe(true);
    vi.runAllTimers();
    await promise;

    expect(engine.isAIThinking.value).toBe(false);
    expect(makeDecision).toHaveBeenCalled();
    expect(gameEngine.selectRider).toHaveBeenCalledWith(expect.anything(), 'r1');
    expect(gameEngine.selectCard).toHaveBeenCalledWith(expect.anything(), 'c1');
    expect(gameEngine.rollDice).toHaveBeenCalled();
    expect(gameEngine.resolveMovement).toHaveBeenCalled();
  });

  it('acknowledges end-turn effects via engine', () => {
    const engine = useGameEngine();
    engine.initialize({ players: baseState.players });

    engine.acknowledgeEffects();
    expect(gameEngine.acknowledgeEndTurnEffects).toHaveBeenCalled();
    expect(engine.turn.value).toBe(2);
    expect(engine.gameLog.value.some(line => line.includes('=== Tour 2 ==='))).toBe(true);
  });
});
