import { describe, it, expect } from 'vitest';
import { createGameState, acknowledgeEndTurnEffects } from '../src/core/game_engine.js';

describe('game engine tests', () => {
  it('produces final rankings when last turn ends', () => {
    const initial = createGameState();
    const riders = initial.riders.map((rider, index) => ({
      ...rider,
      position: index * 5,
      arrivalOrder: index
    }));

    const finished = acknowledgeEndTurnEffects({
      ...initial,
      riders,
      isLastTurn: true
    });

    expect(finished.phase).toBe('finished');
    expect(finished.rankings.length).toBeGreaterThan(0);
    expect(finished.rankings.length).toBe(riders.length);

    const ranks = finished.rankings.map(r => r.finalRank);
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });
});
