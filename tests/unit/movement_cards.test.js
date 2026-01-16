import { describe, it, expect } from 'vitest';
import { formatMovementCardName, sortMovementCards } from '../../src/utils/movement_cards.js';

describe('movement card helpers', () => {
  it('formats +1 and +5 movement card names', () => {
    expect(formatMovementCardName({ value: 1, name: 'Any' })).toBe('Fatigue');
    expect(formatMovementCardName({ value: 5, name: 'Sprint' })).toBe('Pointe');
    expect(formatMovementCardName({ value: 3, name: 'Rythme' })).toBe('Rythme');
  });

  it('sorts movement cards ascending and keeps ties stable', () => {
    const cards = [
      { id: 'c1', value: 3, name: 'Rythme' },
      { id: 'c2', value: 2, name: 'Tempo' },
      { id: 'c3', value: 3, name: 'Rythme' },
      { id: 'c4', value: 5, name: 'Sprint' },
      { id: 'c5', value: 1, name: 'Fatigue' }
    ];

    const sorted = sortMovementCards(cards);

    expect(sorted.map(card => card.id)).toEqual(['c5', 'c2', 'c1', 'c3', 'c4']);
    expect(cards.map(card => card.id)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
  });
});
