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
import { EnergyConfig } from '../core/energy.js';
import { isRefuelZone } from '../core/terrain.js';

export function useGameEngine() {
  // State
  const gameState = ref(null);
  const gameLog = ref([]);
  const animatingRiders = ref([]);
  const isAnimatingEffects = ref(false);
  const lastActionSummaries = ref({});
  
  // v4.0: AI instances (one per AI team)
  const aiInstances = ref({});
  const isAIThinking = ref(false);
  
  // v4.0: Track AI move flashes (position → timestamp)
  const aiMoveFlash = ref(null);
  
  // v3.2.2: Track aspiration animations with position info
  const aspirationAnimations = ref([]);
  
  // View-only mode: allows viewing rider info without playing them
  const isViewOnlySelection = ref(false);

  // Initialize with optional game configuration
  function initialize(gameConfig = null) {
    gameState.value = createGameState({ gameConfig });
    gameLog.value = ['🏁 Départ de la course !', '=== Tour 1 ==='];
    animatingRiders.value = [];
    isAnimatingEffects.value = false;
    aspirationAnimations.value = [];
    isAIThinking.value = false;
    lastActionSummaries.value = {};
    
    // v4.0: Create AI instances for AI-controlled teams
    aiInstances.value = {};
    if (gameConfig?.players) {
      gameConfig.players
        .filter(p => p.playerType === PlayerType.AI)
        .forEach(p => {
          // v4.5: Pass personality (empty = random)
          const personality = p.personality || null;
          const ai = createAI(p.difficulty, personality);
          aiInstances.value[p.teamId] = ai;
          // Store personality for display
          if (!gameState.value.aiPersonalities) {
            gameState.value.aiPersonalities = {};
          }
          gameState.value.aiPersonalities[p.teamId] = ai.personality;
        });
    }
    
    // Log team setup
    const numTeams = gameState.value.teamIds?.length || 2;
    const numAI = Object.keys(aiInstances.value).length;
    if (numAI > 0) {
      log(`🤖 ${numAI} équipe(s) IA sur ${numTeams}`);
      // Log personalities
      Object.entries(aiInstances.value).forEach(([teamId, ai]) => {
        log(`   ${teamId}: ${ai.getPersonalityName()}`);
      });
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
  const aiPersonalities = computed(() => gameState.value?.aiPersonalities || {});
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
  const players = computed(() => gameState.value?.players || []);
  const stageRace = computed(() => gameState.value?.stageRace || null);
  
  // Preview positions for UI highlighting (v3.2)
  const previewPositions = computed(() => {
    if (!gameState.value) return null;
    return calculatePreviewPositionsEngine(gameState.value);
  });
  
  // Show effects overlay when turnPhase is 'end_turn_effects' AND animations are done
  // v4.0: Don't show if game is finished
  const showEffectsOverlay = computed(() => 
    turnPhase.value === 'end_turn_effects' && 
    !isAnimatingEffects.value && 
    phase.value !== 'finished'
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
        riderName: e.riderName,
        cardValue: e.cardValue
      })),
      shelter: effects.filter(e => e.type === 'shelter').map(e => ({
        riderId: e.riderId,
        riderName: e.riderName,
        cardValue: e.cardValue
      })),
      refuel: effects.filter(e => e.type === 'refuel').map(e => ({
        riderId: e.riderId,
        riderName: e.riderName,
        energyRecovered: e.energyRecovered
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

  function buildRecoveryBreakdown({ startTerrain, startPosition, endPosition }) {
    const actualDistance = Number.isFinite(endPosition) ? endPosition - startPosition : 0;
    const descentRecovery = startTerrain === 'descent' && actualDistance > 0
      ? actualDistance * EnergyConfig.recovery.descentMovement
      : 0;
    const refuelRecovery = Number.isFinite(endPosition) && isRefuelZone(gameState.value?.course || [], endPosition)
      ? EnergyConfig.recovery.refuelZone
      : 0;
    return {
      descent: descentRecovery,
      refuel: refuelRecovery,
      shelter: 0
    };
  }

  function recordActionSummary({
    riderId,
    type,
    cardLabel,
    cardValue,
    dice,
    total,
    usedSpecialty,
    energyBefore,
    energyAfter,
    startTerrain,
    startPosition,
    endPosition
  }) {
    lastActionSummaries.value = {
      ...lastActionSummaries.value,
      [riderId]: {
        type,
        cardLabel,
        cardValue,
        dice,
        total,
        usedSpecialty,
        energyBefore,
        energyAfter,
        recovery: buildRecoveryBreakdown({ startTerrain, startPosition, endPosition })
      }
    };
  }

  // Sleep helper
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Actions
  function selectRider(riderId, options = {}) {
    const { viewOnly = false } = options;
    
    if (viewOnly) {
      // View-only mode: bypass game engine validation, just set selectedRiderId directly
      // This allows viewing any rider's info without affecting game state
      gameState.value = {
        ...gameState.value,
        selectedRiderId: riderId
        // Don't change turnPhase or any other state
      };
      isViewOnlySelection.value = true;
    } else {
      // Normal mode: use game engine validation
      const newState = selectRiderEngine(gameState.value, riderId);
      gameState.value = newState;
      isViewOnlySelection.value = false;
    }
  }

  function cancelRiderSelection() {
    if (isViewOnlySelection.value) {
      // View-only mode: just clear the selection without changing game state
      gameState.value = {
        ...gameState.value,
        selectedRiderId: null
      };
      isViewOnlySelection.value = false;
    } else {
      // Normal mode: use game engine
      gameState.value = deselectRiderEngine(gameState.value);
    }
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
    const startTerrain = currentRider.value.terrain;
    const energyBefore = currentRider.value.energy ?? EnergyConfig.startEnergy;
    const selectedCard = getSelectedCard();
    const isAttack = currentRider.value.attackCards?.some(c => c.id === selectedCardId.value);
    const cardLabel = isAttack ? 'Attaque' : selectedCard?.name || 'Carte';
    const cardValue = selectedCard?.value ?? null;
    const diceResult = lastDiceRoll.value?.result ?? null;
    const usedSpecialty = !!selectedSpecialtyId.value;

    // Animation du mouvement principal
    animatingRiders.value.push(riderId);
    
    // Apply movement
    const newState = resolveMovementEngine(gameState.value);

    if (newState.lastMovement?.type === 'recover') {
      const delta = newState.lastMovement.energyDelta ?? 0;
      log(`⚡ ${riderName} récupère (+${delta} énergie)`);
      const updatedRider = newState.riders.find(r => r.id === riderId);
      recordActionSummary({
        riderId,
        type: 'recover',
        cardLabel: 'Récupérer',
        cardValue: null,
        dice: null,
        total: 0,
        usedSpecialty: false,
        energyBefore,
        energyAfter: updatedRider?.energy ?? energyBefore,
        startTerrain,
        startPosition: startPos,
        endPosition: null
      });
      gameState.value = newState;
      animatingRiders.value = animatingRiders.value.filter(id => id !== riderId);
      return;
    }

    if (newState.lastMovement?.type === 'invalid' || newState.turnPhase === TurnPhase.SELECT_CARD) {
      const required = newState.lastMovement?.energyRequired;
      const suffix = Number.isFinite(required) ? ` (${required} requis)` : '';
      log(`⚡ ${riderName} manque d'énergie${suffix}`);
      recordActionSummary({
        riderId,
        type: 'invalid',
        cardLabel,
        cardValue,
        dice: diceResult,
        total: movement || 0,
        usedSpecialty,
        energyBefore,
        energyAfter: energyBefore,
        startTerrain,
        startPosition: startPos,
        endPosition: null
      });
      gameState.value = newState;
      animatingRiders.value = animatingRiders.value.filter(id => id !== riderId);
      return;
    }
    
    // Log movement
    const updatedRider = newState.riders.find(r => r.id === riderId);
    const actualPos = updatedRider?.position;
    const targetPos = startPos + movement;
    const finishLine = newState.finishLine ?? gameState.value?.finishLine ?? FINISH_LINE;
    const energyAfter = updatedRider?.energy ?? energyBefore;
    
    if (actualPos < targetPos && actualPos <= finishLine) {
      log(`${riderName} avance de ${movement} cases → case ${actualPos} (case pleine)`);
    } else {
      log(`${riderName} avance de ${movement} cases → case ${actualPos}`);
    }

    if (actualPos > finishLine) {
      log(`🏁 ${riderName} franchit la ligne !`);
    }

    recordActionSummary({
      riderId,
      type: 'move',
      cardLabel,
      cardValue,
      dice: diceResult,
      total: movement,
      usedSpecialty,
      energyBefore,
      energyAfter,
      startTerrain,
      startPosition: startPos,
      endPosition: actualPos ?? startPos
    });

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

  watch(
    () => gameState.value?.endTurnEffects,
    (effects) => {
      if (!effects?.length) return;
      const shelterEffects = effects.filter(effect => effect.type === 'shelter');
      if (!shelterEffects.length) return;
      const updates = { ...lastActionSummaries.value };
      shelterEffects.forEach(effect => {
        const existing = updates[effect.riderId];
        if (!existing) return;
        updates[effect.riderId] = {
          ...existing,
          recovery: {
            ...existing.recovery,
            shelter: effect.energyRecovered ?? EnergyConfig.recovery.shelterBonus
          }
        };
      });
      lastActionSummaries.value = updates;
    },
    { deep: true }
  );

  function restartGame() {
    initialize();
  }

  // v4.0: Execute AI turn - complete rider move without visible intermediate steps
  async function executeAITurn() {
    if (!isAITurn.value || !currentAI.value || isAIThinking.value) return;
    if (phase.value === 'finished') return;
    
    isAIThinking.value = true;
    const ai = currentAI.value;
    const teamId = gameState.value.currentTeam;
    
    try {
      // Small delay for visibility
      await sleep(ai.thinkingDelay);
      
      // Get current state phase
      const currentPhase = turnPhase.value;
      
      // If we're at select_rider, execute full rider turn at once
      if (currentPhase === 'select_rider') {
        await executeFullAIRiderTurn(ai, teamId);
      } 
      // Handle end_turn_effects phase (just acknowledge)
      else if (currentPhase === 'end_turn_effects') {
        acknowledgeEffects();
      }
      // Fallback for other phases (shouldn't happen often)
      else {
        const decision = ai.makeDecision(gameState.value, currentPhase, teamId);
        await handleAIDecision(decision);
      }
    } catch (err) {
      console.error('AI turn error:', err);
    } finally {
      isAIThinking.value = false;
    }
  }
  
  // Execute a complete rider turn for AI (select → card → dice → specialty → resolve)
  async function executeFullAIRiderTurn(ai, teamId) {
    // 1. Select rider
    const riderDecision = ai.makeDecision(gameState.value, 'select_rider', teamId);
    if (riderDecision.type !== 'select_rider' || !riderDecision.riderId) {
      return; // No rider available
    }
    
    // Apply rider selection silently
    gameState.value = selectRiderEngine(gameState.value, riderDecision.riderId);
    const rider = gameState.value.riders.find(r => r.id === riderDecision.riderId);
    if (!rider) return;
    
    // 2. Select card
    const cardDecision = ai.makeDecision(gameState.value, 'select_card', teamId);
    if (cardDecision.type !== 'select_card' || !cardDecision.cardId) return;
    
    gameState.value = selectCardEngine(gameState.value, cardDecision.cardId);
    const card = rider.hand?.find(c => c.id === cardDecision.cardId) || 
                 rider.attackCards?.find(c => c.id === cardDecision.cardId);
    const isAttack = rider.attackCards?.some(c => c.id === cardDecision.cardId);
    
    // 3. Roll dice
    gameState.value = rollDiceEngine(gameState.value);
    const diceResult = gameState.value.lastDiceRoll?.result || 0;
    
    // Calculate movement after dice
    let movement = calculateMovementEngine(gameState.value);
    gameState.value = { ...gameState.value, calculatedMovement: movement };
    
    // 4. Decide specialty (if applicable)
    const terrain = getTerrainAt(gameState.value, rider.position);
    const canUseSpec = checkCanUseSpecialtyForAI(rider.type, terrain) && rider.specialtyCards?.length > 0;
    let usedSpecialty = false;
    
    if (canUseSpec) {
      const specDecision = ai.makeDecision(gameState.value, 'select_specialty', teamId);
      if (specDecision.type === 'use_specialty' && rider.specialtyCards.length > 0) {
        const specCard = rider.specialtyCards[0];
        gameState.value = selectSpecialtyEngine(gameState.value, specCard.id);
        movement = calculateMovementEngine(gameState.value);
        gameState.value = { ...gameState.value, calculatedMovement: movement };
        usedSpecialty = true;
      }
    }
    
    // Set phase to resolve
    gameState.value = { ...gameState.value, turnPhase: TurnPhase.RESOLVE };
    
    // 5. Resolve movement (apply position change)
    const startPos = rider.position;
    const startTerrain = getTerrainAt(gameState.value, rider.position);
    const energyBefore = rider.energy ?? EnergyConfig.startEnergy;
    const newState = resolveMovementEngine(gameState.value);
    const updatedRider = newState.riders.find(r => r.id === rider.id);
    const finalPos = updatedRider?.position || startPos;
    const energyAfter = updatedRider?.energy ?? energyBefore;
    
    // Log the complete action
    const cardText = isAttack ? `Attaque (+${card?.value || 6})` : `carte +${card?.value || 0}`;
    const specText = usedSpecialty ? ' + Spécialité' : '';
    log(`🤖 ${rider.name}: ${cardText}${specText}, 🎲${diceResult} → case ${finalPos}`);
    
    const finishLine = gameState.value?.finishLine ?? FINISH_LINE;
    if (finalPos > finishLine) {
      log(`🏁 ${rider.name} franchit la ligne !`);
    }
    
    // Trigger flash effect on the target position
    triggerAIMoveFlash(finalPos, rider.team);

    recordActionSummary({
      riderId: rider.id,
      type: 'move',
      cardLabel: isAttack ? 'Attaque' : card?.name || 'Carte',
      cardValue: card?.value ?? null,
      dice: diceResult,
      total: movement,
      usedSpecialty,
      energyBefore,
      energyAfter,
      startTerrain,
      startPosition: startPos,
      endPosition: finalPos
    });
    
    // Update state
    gameState.value = newState;
    
    // Handle end turn effects if needed (will be picked up by watcher)
  }
  
  // Trigger a brief flash effect at a position for AI moves
  function triggerAIMoveFlash(position, teamId) {
    aiMoveFlash.value = { position, teamId, timestamp: Date.now() };
    // Clear after animation
    setTimeout(() => {
      if (aiMoveFlash.value?.position === position) {
        aiMoveFlash.value = null;
      }
    }, 600);
  }
  
  // Helper for AI specialty check
  function checkCanUseSpecialtyForAI(riderType, terrain) {
    if (riderType === 'versatile') return true;
    const specialties = { climber: 'mountain', puncher: 'hill', rouleur: 'flat', sprinter: 'sprint' };
    return specialties[riderType] === terrain;
  }
  
  // Handle single AI decision (fallback)
  async function handleAIDecision(decision) {
    switch (decision.type) {
      case 'select_rider':
        if (decision.riderId) selectRider(decision.riderId);
        break;
      case 'select_card':
        if (decision.cardId) selectCard(decision.cardId);
        break;
      case 'roll_dice':
        rollDice();
        break;
      case 'use_specialty':
        useSpecialty();
        break;
      case 'skip_specialty':
        skipSpecialty();
        break;
      case 'resolve':
        await resolve();
        break;
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
    aiMoveFlash,
    isViewOnlySelection,
    lastActionSummaries,
    
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
    players,
    stageRace,
    aiPersonalities,
    
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
