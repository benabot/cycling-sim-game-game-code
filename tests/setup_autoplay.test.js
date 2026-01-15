import { describe, it, expect } from 'vitest';
import { DraftAIConfig, DraftConfig } from '../src/config/draft.config.js';
import { ClassicId } from '../src/config/race-presets.js';
import { createMovementCard } from '../src/core/rider.js';
import {
  acknowledgeEndTurnEffects,
  createGameState,
  resolveMovement,
  rollDice,
  selectCard,
  selectRider,
  selectSpecialty,
  TurnPhase
} from '../src/core/game_engine.js';
import { PlayerType } from '../src/core/teams.js';
import { chooseAction } from '../src/core/sim/autoplayer.js';
import { buildGameFromPreset } from '../src/core/sim/sim_runner.js';
import { buildSetupConfig } from '../src/core/sim/setup_builder.js';

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

describe('setup builder (headless)', () => {
  it('builds a valid setup config with budgets and roles', () => {
    const gameConfig = buildSetupConfig({
      presetName: ClassicId.RIVIERA,
      seed: 11,
      options: { numTeams: 2 }
    });

    expect(gameConfig.players.length).toBe(2);
    expect(Object.keys(gameConfig.draftRosters)).toHaveLength(2);

    Object.entries(gameConfig.draftRosters).forEach(([teamId, roster]) => {
      expect(roster).toHaveLength(DraftConfig.rosterSize);
      const roles = new Set(roster.map(rider => rider.role));
      expect(roles.size).toBe(DraftConfig.roles.length);

      const totalPrice = roster.reduce((sum, rider) => sum + (rider.price || 0), 0);
      const player = gameConfig.players.find(p => p.teamId === teamId);
      const budget = player?.playerType === PlayerType.AI
        ? (DraftAIConfig.budgetByDifficulty[player.difficulty] ?? DraftConfig.budgetTotal)
        : DraftConfig.budgetTotal;

      expect(totalPrice).toBeLessThanOrEqual(budget);
    });
  });

  it('plays at least five turns headlessly', () => {
    const { gameState, ctx } = buildGameFromPreset({
      presetName: ClassicId.RIVIERA,
      seed: 12,
      options: { numTeams: 2 }
    });

    let state = gameState;
    const targetTurn = 5;
    const maxSteps = 4000;

    for (let steps = 0; steps < maxSteps; steps++) {
      if (state.phase === 'finished') break;
      if (state.currentTurn >= targetTurn) break;
      const action = chooseAction(state, ctx);
      state = applyAction(state, action);
    }

    expect(state.currentTurn >= targetTurn || state.phase === 'finished').toBe(true);
  });

  it('rejects invalid moves when energy is insufficient', () => {
    const gameConfig = buildSetupConfig({
      presetName: ClassicId.RIVIERA,
      seed: 13,
      options: { numTeams: 2 }
    });
    const baseState = createGameState({ gameConfig });
    const rider = baseState.riders[0];
    const moveCard = createMovementCard(5, 'Test', '#999999');

    const riders = baseState.riders.map(r =>
      r.id === rider.id
        ? {
            ...r,
            energy: 2,
            hand: [moveCard]
          }
        : r
    );

    const invalidState = {
      ...baseState,
      riders,
      currentTeam: rider.team,
      selectedRiderId: rider.id,
      selectedCardId: moveCard.id,
      selectedSpecialtyId: null,
      lastDiceRoll: { result: 6, isOne: false },
      turnPhase: TurnPhase.RESOLVE
    };

    const after = resolveMovement(invalidState);
    const updated = after.riders.find(r => r.id === rider.id);

    expect(after.lastMovement?.type).toBe('invalid');
    expect(after.turnPhase).toBe(TurnPhase.SELECT_CARD);
    expect(updated.energy).toBe(2);
  });
});
