export function formatMovementCardName(card) {
  if (!card) return '';
  if (card.value === 1) return 'Fatigue';
  if (card.value === 5) return 'Pointe';
  return card.name || '';
}

export function sortMovementCards(cards) {
  if (!Array.isArray(cards)) return [];

  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const valueDiff = a.card.value - b.card.value;
      if (valueDiff !== 0) return valueDiff;
      return a.index - b.index;
    })
    .map(({ card }) => card);
}
