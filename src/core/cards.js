/**
 * Card decks and effects
 * @module core/cards
 */

/**
 * Card types
 */
export const CardType = {
  PENALTY: 'penalty',
  BONUS: 'bonus',
  EVENT: 'event',
  ATTACK: 'attack'
};

/**
 * Penalty cards definition
 */
export const PenaltyCards = [
  { id: 'effort_soutenu', name: 'Effort soutenu', effect: { fatigue: 1 }, quantity: 10 },
  { id: 'coup_de_pompe', name: 'Coup de pompe', effect: { fatigue: 2 }, quantity: 5 },
  { id: 'vent_de_face', name: 'Vent de face', effect: { movement: -2 }, quantity: 5 },
  { id: 'jambes_lourdes', name: 'Jambes lourdes', effect: { maxMove: 7, minMove: 2 }, quantity: 4 },
  { id: 'fringale_legere', name: 'Fringale légère', effect: { fatigue: 1, movement: -1 }, quantity: 3 },
  { id: 'crevaison', name: 'Crevaison', effect: { noMove: true, fatigue: 1 }, quantity: 2 },
  { id: 'chute_isolee', name: 'Chute isolée', effect: { moveBack: 2, fatigue: 2 }, quantity: 1 }
];

/**
 * Bonus cards definition
 */
export const BonusCards = [
  { id: 'second_souffle', name: 'Second souffle', effect: { fatigue: -1 }, quantity: 6 },
  { id: 'aspiration_parfaite', name: 'Aspiration parfaite', effect: { movement: 2 }, quantity: 4 },
  { id: 'concentration', name: 'Concentration', effect: { reroll: true }, quantity: 4 },
  { id: 'ravitaillement', name: 'Ravitaillement', effect: { fatigue: -2 }, quantity: 3 },
  { id: 'motivation_equipe', name: "Motivation d'équipe", effect: { teammateFatigue: -1 }, quantity: 2 },
  { id: 'coup_de_chance', name: 'Coup de chance', effect: { ignorePenalty: true }, quantity: 1 }
];

/**
 * Create a shuffled deck from card definitions
 * @param {Array} cardDefinitions - Array of card definitions with quantities
 * @returns {Array} Shuffled deck
 */
export function createDeck(cardDefinitions) {
  const deck = [];
  
  for (const card of cardDefinitions) {
    for (let i = 0; i < card.quantity; i++) {
      deck.push({ ...card });
    }
  }
  
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

/**
 * Draw a card from a deck
 * @param {Array} deck - The deck to draw from
 * @returns {{card: Object|null, deck: Array}} Drawn card and remaining deck
 */
export function drawCard(deck) {
  if (deck.length === 0) {
    return { card: null, deck: [] };
  }
  
  const [card, ...remaining] = deck;
  return { card, deck: remaining };
}

/**
 * Create initial game decks
 * @returns {{penaltyDeck: Array, bonusDeck: Array}}
 */
export function createGameDecks() {
  return {
    penaltyDeck: createDeck(PenaltyCards),
    bonusDeck: createDeck(BonusCards)
  };
}

/**
 * Apply card effect to movement calculation
 * @param {Object} card - The card to apply
 * @param {Object} moveState - Current movement state {baseMove, fatigue, ...}
 * @returns {Object} Updated movement state
 */
export function applyCardEffect(card, moveState) {
  const effect = card.effect;
  let newState = { ...moveState };
  
  if (effect.fatigue !== undefined) {
    newState.fatigue = (newState.fatigue || 0) + effect.fatigue;
  }
  
  if (effect.movement !== undefined) {
    newState.movementModifier = (newState.movementModifier || 0) + effect.movement;
  }
  
  if (effect.noMove) {
    newState.noMove = true;
  }
  
  if (effect.moveBack !== undefined) {
    newState.moveBack = effect.moveBack;
  }
  
  if (effect.maxMove !== undefined) {
    newState.maxMove = effect.maxMove;
  }
  
  if (effect.minMove !== undefined) {
    newState.minMove = effect.minMove;
  }
  
  if (effect.reroll) {
    newState.canReroll = true;
  }
  
  if (effect.ignorePenalty) {
    newState.ignorePenalty = true;
  }
  
  return newState;
}

/**
 * Get card description for display
 * @param {Object} card - Card object
 * @returns {string} Human-readable description
 */
export function getCardDescription(card) {
  const effect = card.effect;
  const parts = [];
  
  if (effect.fatigue > 0) parts.push(`+${effect.fatigue} fatigue`);
  if (effect.fatigue < 0) parts.push(`${effect.fatigue} fatigue`);
  if (effect.movement > 0) parts.push(`+${effect.movement} déplacement`);
  if (effect.movement < 0) parts.push(`${effect.movement} déplacement`);
  if (effect.noMove) parts.push('Pas de déplacement');
  if (effect.moveBack) parts.push(`Recule de ${effect.moveBack} cases`);
  if (effect.maxMove) parts.push(`Déplacement max ${effect.maxMove}`);
  if (effect.reroll) parts.push('Relancer 1 dé');
  if (effect.ignorePenalty) parts.push('Ignorer prochaine pénalité');
  if (effect.teammateFatigue) parts.push(`Coéquipier: ${effect.teammateFatigue} fatigue`);
  
  return parts.join(', ');
}
