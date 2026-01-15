import { describe, it, expect } from 'vitest';
import { ClassicId } from '../src/config/race-presets.js';
import { runFullGame } from '../src/core/sim/sim_runner.js';

const PRESETS = [
  { label: 'baseline', id: ClassicId.RIVIERA },
  { label: 'cobbles', id: ClassicId.NORD },
  { label: 'mountain', id: ClassicId.LOMBARDE }
];
const SEEDS = [1, 2, 3];
const MAX_TURNS = 200;

describe('full game simulation (headless)', () => {
  PRESETS.forEach(preset => {
    SEEDS.forEach(seed => {
      it(`finishes ${preset.label} seed ${seed}`, () => {
        const result = runFullGame({
          presetName: preset.id,
          seed,
          maxTurns: MAX_TURNS
        });

        expect(result.finalState.phase).toBe('finished');
        expect(result.summary.turnsPlayed).toBeGreaterThan(0);
        expect(result.summary.turnsPlayed).toBeLessThanOrEqual(MAX_TURNS);
        expect(result.summary.eventsCount).toBeGreaterThanOrEqual(0);
        expect(result.summary.invalidActionsCount).toBeGreaterThanOrEqual(0);
        expect(result.summary.riskCue.low + result.summary.riskCue.medium + result.summary.riskCue.high)
          .toBeGreaterThan(0);
      });
    });
  });
});
