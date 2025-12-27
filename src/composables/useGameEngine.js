// Composable pour la logique du jeu
import { ref, computed } from 'vue';
import { 
  createGameState,
  getRidersAtPosition,
  getLeaderAtPosition,
  getTerrainAt,
  selectRider as selectRiderEngine,
  deselectRider as deselectRiderEngine,
  selectCard as selectCardEngine,
  deselectCard as deselectCardEngine,
  rollDice as rollDiceEngine,
  selectSpecialty as selectSpecialtyEngine,
  calculateMovement as calculateMovementEngine,
  resolveMovement as resolveMovementEngine,
  acknowledgeEndTurnEffects as acknowledgeEndTurnEffectsEngine,
  TurnPhase
} from '../core/game_engine.js';
import { FINISH_LINE, TeamConfig } from '../config/game.config.js';

export function useGameEngine() {
  // State
  const gameState = ref(null);
  const gameLog = ref([]);
  const animatingRiders = ref([]);
  const isAnimatingEffects = ref(false);

  // Initialize
  function initialize() {
    gameState.value = createGameState();
    gameLog.value = ['🏁 Départ de la course !', '=== Tour 1 ==='];
    animatingRiders.value = [];
    isAnimatingEffects.value = false;
  }

  // Computed from game state
  const course = computed(() => gameState.value?.course || []);
  const allRiders = computed(() => gameState.value?.riders || []);
  const currentTeam = computed(() => gameState.value?.currentTeam || 'team_a');
  const turn = computed(() => gameState.value?.currentTurn || 1);
  const phase = computed(() => gameState.value?.phase || 'playing');
  const isLastTurn = computed(() => gameState.value?.isLastTurn || false);
  const winningTeam = computed(() => gameState.value?.winningTeam);
  const rankings = computed(() => gameState.value?.rankings || []);
  const turnPhase = computed(() => gameState.value?.turnPhase || 'select_rider');
  const selectedRiderId = computed(() => gameState.value?.selectedRiderId);
  const selectedCardId = computed(() => gameState.value?.selectedCardId);
  const selectedSpecialtyId = computed(() => gameState.value?.selectedSpecialtyId);
  const lastDiceRoll = computed(() => gameState.value?.lastDiceRoll);
  const calculatedMovement = computed(() => gameState.value?.calculatedMovement || 0);
  const playedThisTurn = computed(() => gameState.value?.ridersPlayedThisTurn || []);
  
  // Show effects overlay when turnPhase is 'end_turn_effects' AND animations are done
  const showEffectsOverlay = computed(() => 
    turnPhase.value === 'end_turn_effects' && !isAnimatingEffects.value
  );
  
  // End turn effects from game state
  const endTurnEffects = computed(() => {
    const effects = gameState.value?.endTurnEffects || [];
    return {
      aspiration: effects.filter(e => e.type === 'aspiration').map(e => ({
        riderId: e.riderId,
        riderName: e.riderName,
        fromPosition: e.fromPosition,
        toPosition: e.toPosition
      })),
      wind: effects.filter(e => e.type === 'wind').map(e => ({
        riderId: e.riderId,
        riderName: e.riderName
      })),
      shelter: effects.filter(e => e.type === 'shelter').map(e => ({
        riderId: e.riderId,
        riderName: e.riderName
      }))
    };
  });

  const currentTeamConfig = computed(() => TeamConfig[currentTeam.value]);
  
  const currentRider = computed(() => {
    if (!selectedRiderId.value) return null;
    const rider = allRiders.value.find(r => r.id === selectedRiderId.value);
    if (!rider) return null;
    
    const terrain = getTerrainAt(gameState.value, rider.position);
    const terrainBonus = getTerrainBonus(rider.type, terrain);
    const canUseSpecialty = checkCanUseSpecialty(rider.type, terrain);
    
    return {
      ...rider,
      terrain,
      terrainBonus,
      teamConfig: TeamConfig[rider.team],
      availableCards: {
        canUseSpecialty,
        hasAttack: rider.attackCards.length > 0,
        hasSpecialty: rider.specialtyCards.length > 0
      }
    };
  });

  // Helper functions
  function getTerrainBonus(riderType, terrain) {
    const bonuses = {
      climber: { flat: 0, hill: 1, mountain: 2, descent: 2, sprint: -1 },
      puncher: { flat: 0, hill: 1, mountain: 1, descent: 2, sprint: 0 },
      rouleur: { flat: 1, hill: 0, mountain: -1, descent: 3, sprint: 0 },
      sprinter: { flat: 0, hill: -1, mountain: -2, descent: 3, sprint: 2 },
      versatile: { flat: 0, hill: 0, mountain: 0, descent: 2, sprint: 0 }
    };
    return bonuses[riderType]?.[terrain] || 0;
  }

  function checkCanUseSpecialty(riderType, terrain) {
    if (riderType === 'versatile') return true;
    const specialties = {
      climber: 'mountain',
      puncher: 'hill',
      rouleur: 'flat',
      sprinter: 'sprint'
    };
    return specialties[riderType] === terrain;
  }

  function log(message) {
    gameLog.value.push(message);
  }

  // Sleep helper
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Actions
  function selectRider(riderId) {
    const newState = selectRiderEngine(gameState.value, riderId);
    gameState.value = newState;
  }

  function cancelRiderSelection() {
    gameState.value = deselectRiderEngine(gameState.value);
  }

  function selectCard(cardId) {
    const newState = selectCardEngine(gameState.value, cardId);
    gameState.value = newState;
  }

  function cancelCardSelection() {
    gameState.value = deselectCardEngine(gameState.value);
  }

  function rollDice() {
    let newState = rollDiceEngine(gameState.value);
    
    if (newState.lastDiceRoll) {
      log(`🎲 ${currentRider.value?.name || 'Coureur'} lance le dé : ${newState.lastDiceRoll.result}`);
      
      const movement = calculateMovementEngine(newState);
      
      newState = {
        ...newState,
        calculatedMovement: movement,
        turnPhase: checkCanUseSpecialty(
          currentRider.value?.type, 
          getTerrainAt(newState, currentRider.value?.position)
        ) && currentRider.value?.specialtyCards?.length > 0
          ? TurnPhase.SELECT_SPECIALTY
          : TurnPhase.RESOLVE
      };
    }
    
    gameState.value = newState;
  }

  function useSpecialty() {
    if (!currentRider.value?.specialtyCards?.length) return;
    
    const cardId = currentRider.value.specialtyCards[0].id;
    let newState = selectSpecialtyEngine(gameState.value, cardId);
    
    log(`★ ${currentRider.value?.name} utilise sa carte Spécialité (+2)`);
    
    const movement = calculateMovementEngine(newState);
    
    newState = {
      ...newState,
      calculatedMovement: movement,
      turnPhase: TurnPhase.RESOLVE
    };
    
    gameState.value = newState;
  }

  function skipSpecialty() {
    gameState.value = {
      ...gameState.value,
      turnPhase: TurnPhase.RESOLVE
    };
  }

  async function resolve() {
    if (!currentRider.value) return;

    const riderId = selectedRiderId.value;
    const riderName = currentRider.value.name;
    const movement = calculatedMovement.value;
    const startPos = currentRider.value.position;

    // Animation du mouvement principal
    animatingRiders.value.push(riderId);
    
    // Apply movement
    const newState = resolveMovementEngine(gameState.value);
    
    // Log movement
    const actualPos = newState.riders.find(r => r.id === riderId)?.position;
    const targetPos = startPos + movement;
    
    if (actualPos < targetPos && actualPos <= FINISH_LINE) {
      log(`${riderName} avance de ${movement} cases → case ${actualPos} (case pleine)`);
    } else {
      log(`${riderName} avance de ${movement} cases → case ${actualPos}`);
    }

    if (actualPos > FINISH_LINE) {
      log(`🏁 ${riderName} franchit la ligne !`);
    }

    gameState.value = newState;

    // Fin animation du mouvement principal
    await sleep(300);
    animatingRiders.value = animatingRiders.value.filter(id => id !== riderId);
    
    // Si on entre dans la phase end_turn_effects, animer les aspirations
    if (newState.turnPhase === TurnPhase.END_TURN_EFFECTS) {
      await animateEndTurnEffects(newState);
    }
  }

  async function animateEndTurnEffects(state) {
    const effects = state.endTurnEffects || [];
    const aspirationEffects = effects.filter(e => e.type === 'aspiration');
    
    if (aspirationEffects.length === 0) {
      // Pas d'aspiration, on log directement les effets de vent/abri
      logEndTurnEffects(effects);
      return;
    }
    
    // Marquer qu'on anime les effets
    isAnimatingEffects.value = true;
    
    log(`--- Fin du tour ${state.currentTurn} ---`);
    
    // Pause initiale pour que le joueur voie ce qui se passe
    await sleep(800);
    
    // Animer chaque aspiration séquentiellement - LENTEMENT
    for (const effect of aspirationEffects) {
      // Log d'abord pour annoncer le mouvement
      log(`🌀 ${effect.riderName} rejoint le groupe (${effect.fromPosition} → ${effect.toPosition})`);
      
      // Petite pause avant l'animation
      await sleep(400);
      
      // Ajouter le coureur aux animations
      animatingRiders.value.push(effect.riderId);
      
      // Attendre l'animation complète (1.5 secondes)
      await sleep(1500);
      
      // Retirer de l'animation
      animatingRiders.value = animatingRiders.value.filter(id => id !== effect.riderId);
      
      // Pause entre chaque coureur
      await sleep(600);
    }
    
    // Pause avant les effets de vent/abri
    await sleep(500);
    
    // Log des effets de vent/abri
    effects.filter(e => e.type === 'wind').forEach(e => {
      log(`💨 ${e.riderName} prend le vent (+1)`);
    });
    effects.filter(e => e.type === 'shelter').forEach(e => {
      log(`🛡️ ${e.riderName} à l'abri (+2)`);
    });
    
    // Pause avant d'afficher l'overlay
    await sleep(600);
    
    // Animations terminées, afficher l'overlay
    isAnimatingEffects.value = false;
  }

  function logEndTurnEffects(effects) {
    log(`--- Fin du tour ${gameState.value.currentTurn} ---`);
    
    effects.filter(e => e.type === 'aspiration').forEach(e => {
      log(`🌀 ${e.riderName} rejoint le groupe (${e.fromPosition} → ${e.toPosition})`);
    });
    effects.filter(e => e.type === 'wind').forEach(e => {
      log(`💨 ${e.riderName} prend le vent (+1)`);
    });
    effects.filter(e => e.type === 'shelter').forEach(e => {
      log(`🛡️ ${e.riderName} à l'abri (+2)`);
    });
  }

  function acknowledgeEffects() {
    const newState = acknowledgeEndTurnEffectsEngine(gameState.value);
    gameState.value = newState;
    
    log(`=== Tour ${newState.currentTurn} ===`);
    
    if (newState.phase === 'finished') {
      const winner = newState.rankings?.[0];
      if (winner) {
        log(`🏆 ${TeamConfig[winner.team].name} remporte la course !`);
      }
    }
  }

  function restartGame() {
    initialize();
  }

  // Utility getters
  function getRidersAt(position) {
    return getRidersAtPosition(gameState.value, position);
  }

  function getLeaderAt(position) {
    return getLeaderAtPosition(gameState.value, position);
  }

  function getTeamRiders(team) {
    return allRiders.value.filter(r => r.team === team);
  }

  function hasRiderPlayed(rider) {
    return playedThisTurn.value.includes(rider.id);
  }

  function isRiderAnimating(riderId) {
    return animatingRiders.value.includes(riderId);
  }

  function getFinishedRiders() {
    return allRiders.value.filter(r => r.position > FINISH_LINE);
  }

  function getSelectedCard() {
    if (!currentRider.value || !selectedCardId.value) return null;
    
    const fromHand = currentRider.value.hand?.find(c => c.id === selectedCardId.value);
    if (fromHand) return fromHand;
    
    const fromAttack = currentRider.value.attackCards?.find(c => c.id === selectedCardId.value);
    return fromAttack;
  }

  return {
    // State
    gameLog,
    animatingRiders,
    showEffectsOverlay,
    endTurnEffects,
    isAnimatingEffects,
    
    // Computed
    course,
    allRiders,
    currentTeam,
    turn,
    phase,
    isLastTurn,
    winningTeam,
    rankings,
    turnPhase,
    selectedRiderId,
    selectedCardId,
    selectedSpecialtyId,
    lastDiceRoll,
    calculatedMovement,
    playedThisTurn,
    currentTeamConfig,
    currentRider,
    
    // Actions
    initialize,
    selectRider,
    cancelRiderSelection,
    selectCard,
    cancelCardSelection,
    rollDice,
    useSpecialty,
    skipSpecialty,
    resolve,
    acknowledgeEffects,
    restartGame,
    
    // Utils
    getRidersAt,
    getLeaderAt,
    getTeamRiders,
    hasRiderPlayed,
    isRiderAnimating,
    getFinishedRiders,
    getSelectedCard,
    log
  };
}
