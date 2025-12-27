// Composable pour la logique du jeu
import { ref, computed, nextTick } from 'vue';
import { 
  createGameState,
  getRidersAtPosition,
  getLeaderAtPosition,
  getTerrainAt,
  selectRider as selectRiderEngine,
  deselectRider,
  selectCard as selectCardEngine,
  deselectCard,
  rollDice as rollDiceEngine,
  selectSpecialty,
  calculateMovement,
  resolveMovement,
  moveToNextPlayer,
  applyEndOfTurnEffects,
  acknowledgeEndTurnEffects,
  getGameStatus
} from '../core/game_engine.js';
import { FINISH_LINE, TeamConfig, RiderConfig, TerrainConfig } from '../config/game.config.js';

export function useGameEngine() {
  // State
  const gameState = ref(null);
  const gameLog = ref([]);
  const animatingRiders = ref([]);
  const showEffectsOverlay = ref(false);
  const endTurnEffects = ref({ aspiration: [], wind: [], shelter: [] });

  // Initialize
  function initialize() {
    gameState.value = createGameState();
    gameLog.value = ['🏁 Départ de la course !'];
    animatingRiders.value = [];
    showEffectsOverlay.value = false;
    endTurnEffects.value = { aspiration: [], wind: [], shelter: [] };
  }

  // Computed from game state
  const course = computed(() => gameState.value?.course || []);
  const allRiders = computed(() => gameState.value?.riders || []);
  const currentTeam = computed(() => gameState.value?.currentTeam || 'team_a');
  const turn = computed(() => gameState.value?.turn || 1);
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
  const playedThisTurn = computed(() => gameState.value?.playedThisTurn || []);

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

  function log(message, type = '') {
    const prefix = type ? `[${type.toUpperCase()}] ` : '';
    gameLog.value.push(prefix + message);
  }

  // Actions
  function selectRider(riderId) {
    const result = selectRiderEngine(gameState.value, riderId);
    if (result.success) {
      gameState.value = result.newState;
    }
  }

  function cancelRiderSelection() {
    const result = deselectRider(gameState.value);
    gameState.value = result.newState;
  }

  function selectCard(cardId, isAttack = false) {
    const result = selectCardEngine(gameState.value, cardId);
    if (result.success) {
      gameState.value = result.newState;
    }
  }

  function cancelCardSelection() {
    const result = deselectCard(gameState.value);
    gameState.value = result.newState;
  }

  function rollDice() {
    const result = rollDiceEngine(gameState.value);
    if (result.success) {
      gameState.value = result.newState;
      log(`🎲 ${currentRider.value?.name || 'Coureur'} lance le dé : ${result.diceResult}`);
      
      // Auto-calculate movement
      const calcResult = calculateMovement(gameState.value);
      gameState.value = calcResult.newState;
    }
  }

  function useSpecialty() {
    if (!currentRider.value?.specialtyCards?.length) return;
    
    const result = selectSpecialty(gameState.value, currentRider.value.specialtyCards[0].id);
    if (result.success) {
      gameState.value = result.newState;
      log(`★ ${currentRider.value?.name} utilise sa carte Spécialité (+2)`);
      
      // Recalculate movement
      const calcResult = calculateMovement(gameState.value);
      gameState.value = calcResult.newState;
    }
  }

  function skipSpecialty() {
    // Just move to resolve phase
    gameState.value = {
      ...gameState.value,
      turnPhase: 'resolve'
    };
  }

  async function resolve() {
    if (!currentRider.value) return;

    const riderId = selectedRiderId.value;
    const riderName = currentRider.value.name;
    const movement = calculatedMovement.value;
    const startPos = currentRider.value.position;

    // Animation
    animatingRiders.value.push(riderId);
    
    // Apply movement
    const result = resolveMovement(gameState.value);
    gameState.value = result.newState;
    
    // Log
    const targetPos = startPos + movement;
    const actualPos = result.newState.riders.find(r => r.id === riderId)?.position;
    
    if (actualPos < targetPos && actualPos <= FINISH_LINE) {
      log(`${riderName} avance de ${movement} cases → case ${actualPos} (case pleine, arrêt forcé)`, 'blocked');
    } else {
      log(`${riderName} avance de ${movement} cases → case ${actualPos}`);
    }

    if (actualPos > FINISH_LINE) {
      log(`🏁 ${riderName} franchit la ligne !`, 'finish');
    }

    // Animation end
    await new Promise(r => setTimeout(r, 300));
    animatingRiders.value = animatingRiders.value.filter(id => id !== riderId);

    // Move to next player or end turn
    const moveResult = moveToNextPlayer(gameState.value);
    gameState.value = moveResult.newState;
    
    if (moveResult.turnEnded) {
      applyEndTurn();
    }
  }

  function applyEndTurn() {
    log(`--- Fin du tour ${turn.value} ---`, 'turn-separator');
    
    const result = applyEndOfTurnEffects(gameState.value);
    gameState.value = result.newState;
    
    endTurnEffects.value = {
      aspiration: result.aspirationMoves || [],
      wind: result.windCards || [],
      shelter: result.shelterCards || []
    };

    // Log effects
    result.aspirationMoves?.forEach(m => {
      log(`🌀 ${m.riderName} rejoint le groupe (${m.fromPosition} → ${m.toPosition})`, 'aspiration');
    });
    result.windCards?.forEach(w => {
      log(`💨 ${w.riderName} prend le vent (+1)`, 'wind');
    });
    result.shelterCards?.forEach(s => {
      log(`🛡️ ${s.riderName} à l'abri (+2)`, 'shelter');
    });

    showEffectsOverlay.value = true;
  }

  function acknowledgeEffects() {
    showEffectsOverlay.value = false;
    
    const result = acknowledgeEndTurnEffects(gameState.value);
    gameState.value = result.newState;
    
    log(`=== Tour ${gameState.value.turn} ===`, 'last-turn-header');
    
    // Check game end
    if (gameState.value.phase === 'finished') {
      const winner = gameState.value.rankings?.[0];
      if (winner) {
        log(`🏆 ${TeamConfig[winner.team].name} remporte la course !`, 'winner');
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
