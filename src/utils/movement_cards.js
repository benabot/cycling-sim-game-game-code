export function formatMovementCardName(card) {
  if (!card) return '';
  if (card.value === 1) return 'Fatigue';
  if (card.value === 5) return 'Pointe';
  return card.name || '';
}
