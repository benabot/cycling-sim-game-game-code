// Composable pour la logique du jeu - v4.0 Multi-teams + AI
import { ref, computed, watch } from 'vue';
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
  calculatePreviewPositions as calculatePreviewPositionsEngine,
  resolveMovement as resolveMovementEngine,
  acknowledgeEndTurnEffects as acknowledgeEndTurnEffectsEngine,
  isCurrentTeamAI,
  getCurrentTeamAIDifficulty,
  TurnPhase
} from '../core/game_engine.js';
import { CyclingAI, createAI } from '../core/ai.js';
import { PlayerType } from '../core/teams.js';
import { FINISH_LINE, TeamConfig } from '../config/game.config.js';

export function useGameEngine() {
  // State
  const gameState = ref(null);
  const gameLog = ref([]);
  const animatingRiders = ref([]);
  const isAnimatingEffects = ref(false);
  
  // v4.0: AI instances (one per AI team)
  const aiInstances = ref({});
  const isAIThinking = ref(false);
  
  // v3.2.2: Track aspiration animations with position info
  const aspirationAnimations = ref([]);

  // Initialize with optional game configuration
  function initialize(gameConfig = null) {
    gameState.value = createGameState({ gameConfig });
    gameLog.value = ['🏁 Départ de la course !', '=== Tour 1 ==='];
    animatingRiders.value = [];
    isAnimatingEffects.value = false;
    aspirationAnimations.value = [];
    isAIThinking.value = false;
    
    // v4.0: Create AI instances for AI-controlled teams
    aiInstances.value = {};
    if (gameConfig?.players) {
      gameConfig.players
        .filter(p => p.playerType === PlayerType.AI)
        .forEach(p => {
          aiInstances.value[p.teamId] = createAI(p.difficulty);
        });
    }
    
    // Log team setup
    const numTeams = gameState.value.teamIds?.length || 2;
    const numAI = Object.keys(aiInstances.value).length;
    if (numAI > 0) {
      log(`🤖 ${numAI} équipe(s) IA sur ${numTeams}`);
    }
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
  
  // v4.0: AI computed properties
  const isAITurn = computed(() => {
    if (!gameState.value) return false;
    return isCurrentTeamAI(gameState.value);
  });
  
  const currentAI = computed(() => {
    if (!isAITurn.value) return null;
    return aiInstances.value[gameState.value.currentTeam] || null;
  });
  
  const numTeams = computed(() => gameState.value?.teamIds?.length || 2);
  const teamIds = computed(() => gameState.value?.teamIds || []);
  
  // Preview positions for UI highlighting (v3.2)
  const previewPositions = computed(() => {
    if (!gameState.value) return null;
    return calculatePreviewPositionsEngine(gameState.value);
  });
  
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

  // Helper functions - v3.2 balanced bonuses
  function getTerrainBonus(riderType, terrain) {
    const bonuses = {
      climber: { flat: 0, hill: 1, mountain: 2, descent: 2, sprint: -1 },
      puncher: { flat: 0, hill: 2, mountain: 1, descent: 2, sprint: 0 },   // v3.2: +2 hill
      rouleur: { flat: 2, hill: 0, mountain: -1, descent: 3, sprint: 0 },  // v3.2: +2 flat
      sprinter: { flat: 0, hill: -1, mountain: -2, descent: 3, sprint: 3 }, // v3.2: +3 sprint
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
    
    // Marquer qu'on anime les effets AVANT tout
    isAnimatingEffects.value = true;
    
    log(`--- Fin du tour ${state.currentTurn} ---`);
    
    // Pause initiale pour que le joueur voie ce qui se passe
    await sleep(500);
    
    // v3.2.2: Animer chaque aspiration avec déplacement visible
    for (const effect of aspirationEffects) {
      // Log d'abord pour annoncer le mouvement
      log(`🌀 ${effect.riderName} rejoint le groupe (${effect.fromPosition} → ${effect.toPosition})`);
      
      // Ajouter l'animation avec les positions pour l'overlay
      aspirationAnimations.value.push({
        riderId: effect.riderId,
        riderName: effect.riderName,
        fromPosition: effect.fromPosition,
        toPosition: effect.toPosition
      });
      
      // Ajouter le coureur aux animations visuelles
      animatingRiders.value.push(effect.riderId);
      
      // Attendre l'animation (visible sur le plateau)
      await sleep(1200);
      
      // Retirer de l'animation
      animatingRiders.value = animatingRiders.value.filter(id => id !== effect.riderId);
      aspirationAnimations.value = aspirationAnimations.value.filter(a => a.riderId !== effect.riderId);
      
      // Pause entre chaque coureur
      await sleep(400);
    }
    
    // Pause avant les effets relais/tempo
    await sleep(300);
    
    // Log des effets relais/tempo
    effects.filter(e => e.type === 'wind').forEach(e => {
      log(`💨 ${e.riderName} fait le relais (+1)`);
    });
    effects.filter(e => e.type === 'shelter').forEach(e => {
      log(`🎵 ${e.riderName} tempo (+2)`);
    });
    
    // Pause avant d'afficher l'overlay
    await sleep(400);
    
    // Animations terminées, afficher l'overlay
    isAnimatingEffects.value = false;
  }

  function logEndTurnEffects(effects) {
    log(`--- Fin du tour ${gameState.value.currentTurn} ---`);
    
    effects.filter(e => e.type === 'aspiration').forEach(e => {
      log(`🌀 ${e.riderName} rejoint le groupe (${e.fromPosition} → ${e.toPosition})`);
    });
    effects.filter(e => e.type === 'wind').forEach(e => {
      log(`💨 ${e.riderName} fait le relais (+1)`);
    });
    effects.filter(e => e.type === 'shelter').forEach(e => {
      log(`🎵 ${e.riderName} tempo (+2)`);
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

  // v4.0: Execute AI turn automatically
  async function executeAITurn() {
    if (!isAITurn.value || !currentAI.value || isAIThinking.value) return;
    if (phase.value === 'finished') return;
    
    isAIThinking.value = true;
    const ai = currentAI.value;
    const teamId = gameState.value.currentTeam;
    
    try {
      // Wait for thinking delay
      await sleep(ai.thinkingDelay);
      
      const currentPhase = turnPhase.value;
      const decision = ai.makeDecision(gameState.value, currentPhase, teamId);
      
      switch (decision.type) {
        case 'select_rider':
          if (decision.riderId) {
            log(`🤖 IA sélectionne ${decision.reason || decision.riderId}`);
            selectRider(decision.riderId);
          }
          break;
          
        case 'select_card':
          if (decision.cardId) {
            log(`🤖 IA joue ${decision.reason}`);
            selectCard(decision.cardId);
          }
          break;
          
        case 'roll_dice':
          await sleep(300);
          rollDice();
          break;
          
        case 'use_specialty':
          log(`🤖 IA utilise spécialité`);
          useSpecialty();
          break;
          
        case 'skip_specialty':
          skipSpecialty();
          break;
          
        case 'resolve':
          await resolve();
          break;
          
        case 'no_rider':
        case 'error':
          console.warn('AI decision error:', decision.reason);
          break;
      }
    } catch (err) {
      console.error('AI turn error:', err);
    } finally {
      isAIThinking.value = false;
    }
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
    aspirationAnimations,
    showEffectsOverlay,
    endTurnEffects,
    isAnimatingEffects,
    isAIThinking,
    
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
    previewPositions,
    currentTeamConfig,
    currentRider,
    // v4.0: AI
    isAITurn,
    numTeams,
    teamIds,
    
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
    executeAITurn,
    
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
