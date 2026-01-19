import { describe, it, expect } from 'vitest';
import { buildFinalStandingsViewModel } from '../../src/utils/standings.js';

describe('buildFinalStandingsViewModel', () => {
  it('returns a non-empty standings list from rankings', () => {
    const rankings = [
      { id: 'team_a_1', name: 'Rider One', team: 'team_a', finalRank: 1 }
    ];
    const riders = [
      { id: 'team_a_1', name: 'Rider One', team: 'team_a', type: 'rouleur', portraitKey: 'r11' }
    ];

    const standings = buildFinalStandingsViewModel({ rankings, riders });

    expect(standings.length).toBe(1);
    expect(standings[0].rank).toBe(1);
    expect(standings[0].name).toBe('Rider One');
    expect(standings[0].teamName).toBeTruthy();
  });
});
