import { describe, it, expect } from 'vitest';
import { formatMovementCardName } from '../../src/utils/movement_cards.js';

describe('movement card helpers', () => {
  it('formats +1 and +5 movement card names', () => {
    expect(formatMovementCardName({ value: 1, name: 'Any' })).toBe('Fatigue');
    expect(formatMovementCardName({ value: 5, name: 'Sprint' })).toBe('Pointe');
    expect(formatMovementCardName({ value: 3, name: 'Rythme' })).toBe('Rythme');
  });
});
