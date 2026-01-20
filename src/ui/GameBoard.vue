<template>
  <div class="game-container">
    <div class="header-row">
      <div class="header-main">
        <RiderIcon type="rouleur" :size="32" class="header-icon" />
        <h1>{{ headerTitle }}</h1>
      </div>
      <div class="header-actions">
        <UserMenu
          :can-save="phase !== 'finished'"
          @load-game="handleLoadGame"
          @save-game="openSaveModal"
          @go-to-account="$emit('go-to-account')"
        />
        <button
          type="button"
          class="btn btn-ghost btn-sm rules-trigger"
          aria-label="Ouvrir les règles"
          @click="isRulesOpen = true"
        >
          <UIIcon type="book" size="sm" />
          Règles
        </button>
        <button v-if="phase === 'finished'" class="btn-back" @click="emit('backToSetup')">
          <UIIcon type="chevron-up" size="sm" style="transform: rotate(-90deg)" />
          Retour
        </button>
      </div>
    </div>
    
    <!-- AI Thinking Indicator -->
    <div v-if="isAIThinking" class="ai-thinking">
      <UIIcon type="ai" size="md" />
      IA en réflexion.
    </div>
    
    <!-- Status Bar -->
    <GameStatusBar 
      :turn="turn"
      :phase="phase"
      :turnPhase="turnPhase"
      :currentTeam="currentTeam"
      :isLastTurn="isLastTurn"
      :winningTeam="winningTeam"
      :stageRace="stageRace"
      :weather="weather"
      :nextWeather="nextWeather"
      :riskCue="riskCue"
    />

    <!-- Terrain Legend -->
    <TerrainLegend />

    <BoardMiniMap
      class="board-minimap--slate"
      :course="course"
      :leaderPosition="leaderPosition"
      :activePosition="activePosition"
    />

    <!-- Course Board -->
    <div
      id="course-board"
      class="course-board-shell"
    >
      <CourseBoard 
        ref="courseBoardRef"
        :course="course"
        :riders="allRiders"
        :selectedRiderId="selectedRiderId"
        :animatingRiders="animatingRiders"
        :aspirationAnimations="aspirationAnimations"
        :getLeaderAtPosition="getLeaderAt"
        :previewPositions="previewPositions"
        :aiMoveFlash="aiMoveFlash"
        :playedRiders="playedThisTurn"
      />
    </div>

    <!-- Effects Overlay -->
    <EffectsOverlay 
      v-if="isEffectsOverlayVisible"
      :turn="turn"
      :effects="endTurnEffects"
      @acknowledge="acknowledgeEffects"
    />

    <!-- Selected Rider Panel -->
    <template v-if="phase !== 'finished' && !isEffectsOverlayVisible">
      <div
        v-if="isMobile"
        class="rider-action-sheet"
        :class="`rider-action-sheet--${actionSheetState}`"
      >
        <button type="button" class="rider-action-sheet__handle" @click="toggleActionSheet">
          <span class="rider-action-sheet__grab"></span>
        </button>
        <div class="rider-action-sheet__summary" @click="toggleActionSheet">
          <template v-if="currentRider">
            <div class="rider-action-sheet__identity">
              <RiderToken :rider="currentRider" :mini="true" :static="true" />
              <div class="rider-action-sheet__identity-text">
                <span class="rider-action-sheet__name">{{ currentRider.name }}</span>
                <span class="rider-action-sheet__type">{{ riderTypeLabel }}</span>
              </div>
            </div>
            <div class="rider-action-sheet__meta">
              <span class="rider-action-sheet__energy">{{ currentRider.energy ?? 100 }}%</span>
              <span class="rider-action-sheet__terrain">
                <TerrainIcon :type="currentRider.terrain" :size="14" />
                {{ riderTerrainLabel }}
              </span>
            </div>
          </template>
          <template v-else>
            <span class="rider-action-sheet__empty">Sélectionnez un coureur</span>
          </template>
        </div>
        <div v-if="currentRider" class="rider-action-sheet__body">
          <RiderPanel
            :rider="currentRider"
            :terrain="currentRider.terrain"
            :terrainBonus="currentRider.terrainBonus"
            :canUseSpecialty="currentRider.availableCards?.canUseSpecialty"
            :turnPhase="turnPhase"
            :selectedCardId="selectedCardId"
            :viewOnly="isViewOnlySelection"
            :hasPlayedThisTurn="hasPlayedThisTurn"
            :decisionAid="decisionAid"
            :turnSummary="turnSummary"
            @cancel="guardedCancelRiderSelection"
            @selectCard="guardedSelectCard"
          >
            <template #actions>
              <!-- View-only mode: show info banner instead of actions -->
              <div v-if="isViewOnlySelection" class="view-only-banner">
                <UIIcon type="eye" size="sm" />
                <span>Lecture seule</span>
              </div>
              <!-- Normal mode: show action zone -->
              <ActionZone 
                v-else
                :turnPhase="turnPhase"
                :cardValue="getSelectedCardValue()"
                :isAttackCard="isSelectedCardAttack()"
                :diceResult="lastDiceRoll?.result || 0"
                :terrainBonus="currentRider.terrainBonus"
                :hasSpecialtyCards="currentRider.specialtyCards?.length > 0"
                :useSpecialty="!!selectedSpecialtyId"
                :totalMovement="calculatedMovement"
                :currentPosition="currentRider.position"
                @rollDice="guardedRollDice"
                @cancelCard="guardedCancelCardSelection"
                @useSpecialty="guardedUseSpecialty"
                @skipSpecialty="guardedSkipSpecialty"
                @resolve="guardedResolve"
              />
            </template>
          </RiderPanel>
        </div>
      </div>
      <template v-else>
        <RiderPanel
          v-if="currentRider"
          :rider="currentRider"
          :terrain="currentRider.terrain"
          :terrainBonus="currentRider.terrainBonus"
          :canUseSpecialty="currentRider.availableCards?.canUseSpecialty"
          :turnPhase="turnPhase"
          :selectedCardId="selectedCardId"
          :viewOnly="isViewOnlySelection"
          :hasPlayedThisTurn="hasPlayedThisTurn"
          :decisionAid="decisionAid"
          :turnSummary="turnSummary"
          @cancel="guardedCancelRiderSelection"
          @selectCard="guardedSelectCard"
        >
          <template #actions>
            <!-- View-only mode: show info banner instead of actions -->
            <div v-if="isViewOnlySelection" class="view-only-banner">
              <UIIcon type="eye" size="sm" />
              <span>Lecture seule</span>
            </div>
            <!-- Normal mode: show action zone -->
            <ActionZone 
              v-else
              :turnPhase="turnPhase"
              :cardValue="getSelectedCardValue()"
              :isAttackCard="isSelectedCardAttack()"
              :diceResult="lastDiceRoll?.result || 0"
              :terrainBonus="currentRider.terrainBonus"
              :hasSpecialtyCards="currentRider.specialtyCards?.length > 0"
              :useSpecialty="!!selectedSpecialtyId"
              :totalMovement="calculatedMovement"
              :currentPosition="currentRider.position"
              @rollDice="guardedRollDice"
              @cancelCard="guardedCancelCardSelection"
              @useSpecialty="guardedUseSpecialty"
              @skipSpecialty="guardedSkipSpecialty"
              @resolve="guardedResolve"
            />
          </template>
        </RiderPanel>

        <!-- No Selection Prompt -->
        <div v-else class="no-selection-prompt">
          <UIIcon type="target" size="lg" class="prompt-icon" />
          <span>Sélectionnez un coureur ({{ currentTeamConfig?.name }})</span>
        </div>
      </template>
    </template>

    <!-- Team Legend (dynamique) -->
    <div class="team-legend" v-if="!isEffectsOverlayVisible">
      <div 
        v-for="teamId in teamIds" 
        :key="teamId"
        class="team-item"
      >
        <span class="team-color" :style="{ background: getTeamColor(teamId) }"></span>
        {{ getTeamName(teamId) }}
        <UIIcon v-if="isTeamAI(teamId)" type="ai" size="sm" />
      </div>
    </div>

    <!-- Teams Overview - always visible for quick rider selection -->
    <TeamsOverview 
      v-if="phase !== 'finished'"
      :riders="allRiders"
      :currentTeam="currentTeam"
      :selectedRiderId="selectedRiderId"
      :playedRiders="playedThisTurn"
      :teamIds="teamIds"
      :players="players"
      :aiProfiles="aiProfiles"
      @selectRider="quickSelectRider"
    />

    <div v-if="isMobile" class="mobile-log-line">
      <span class="mobile-log-label">Dernier événement</span>
      <span class="mobile-log-text">{{ mobileLogPreview }}</span>
      <button
        type="button"
        class="btn btn-ghost btn-sm mobile-log-action"
        @click="isHistoryOpen = true"
      >
        <UIIcon type="history" size="sm" />
        Historique
      </button>
    </div>

    <!-- Game Over -->
    <GameOverPanel 
      v-if="phase === 'finished' && !showFinishModal"
      :winningTeam="winningTeam"
      :rankings="rankings"
      :stageRace="stageRace"
      @restart="restartGame"
    />

    <!-- Game Log (slate panel on all devices) -->
    <GameLog :log="gameLog" />

    <RulesModal v-model="isRulesOpen" />
    <CourseModal
      v-model="isCourseModalOpen"
      :course="course"
      :leaderPosition="leaderPosition"
      :activePosition="activePosition"
    />
    <HistoryModal v-model="isHistoryOpen" :log="gameLog" />
    <FinishResultsModal
      v-model="showFinishModal"
      :race-title="headerTitle"
      :rankings="finishModalRankings"
      :riders="allRiders"
      :turn="turn"
      :stage-race="stageRace"
      :can-restart="true"
      @restart="handleRestart"
      @new-course="handleNewCourse"
    />

    <!-- Save/Load modals -->
    <SaveGameModal
      v-model="showSaveModal"
      :gameState="rawGameState"
    />
    <LoadGameModal
      v-model="showLoadModal"
      @load="handleLoadGame"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { useGameEngine } from '../composables/useGameEngine.js';
import { TeamConfigs, PlayerType } from '../core/teams.js';
import { getClassicPreset } from '../config/race-presets.js';
import { RiderConfig, TerrainConfig } from '../config/game.config.js';
import { UIConfig } from '../config/ui.config.js';
import { calculateMovementConsumption, calculateRecovery } from '../core/energy.js';
import { isRefuelZone } from '../core/terrain.js';
import { createMoveAnimator, createMoveDiffHandler } from './anim/moveAnimator.js';
import {
  GameStatusBar,
  TerrainLegend,
  BoardMiniMap,
  CourseBoard,
  EffectsOverlay,
  RiderPanel,
  ActionZone,
  TeamsOverview,
  GameOverPanel,
  FinishResultsModal,
  GameLog,
  CourseModal,
  HistoryModal,
  RulesModal,
  UIIcon,
  RiderIcon,
  RiderToken,
  TerrainIcon
} from '../components';
import SaveGameModal from '../components/SaveGameModal.vue';
import LoadGameModal from '../components/LoadGameModal.vue';
import UserMenu from '../components/UserMenu.vue';

// Props and emits
const props = defineProps({
  gameConfig: { type: Object, default: null },
  savedState: { type: Object, default: null }
});

const emit = defineEmits(['backToSetup', 'restore', 'go-to-account']);

// Initialize game engine
const {
  // State
  gameLog,
  turnPhase,
  selectedRiderId,
  selectedCardId,
  selectedSpecialtyId,
  lastDiceRoll,
  calculatedMovement,
  playedThisTurn,
  animatingRiders,
  aspirationAnimations,
  showEffectsOverlay,
  endTurnEffects,
  isAnimatingEffects,
  isAIThinking,
  aiMoveFlash,
  isViewOnlySelection,
  lastActionSummaries,
  rawGameState,
  
  // Computed
  course,
  allRiders,
  currentTeam,
  turn,
  phase,
  isLastTurn,
  winningTeam,
  rankings,
  currentTeamConfig,
  currentRider,
  previewPositions,
  isAITurn,
  numTeams,
  teamIds,
  players,
  aiProfiles,
  stageRace,
  weather,
  nextWeather,
  riskCue,
  
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
  restoreFromSave,
  
  // Utils
  getLeaderAt,
  getSelectedCard
} = useGameEngine();

// Ref for course board scrolling
const courseBoardRef = ref(null);
const isRulesOpen = ref(false);
const isCourseModalOpen = ref(false);
const isHistoryOpen = ref(false);
const showSaveModal = ref(false);
const showLoadModal = ref(false);
const showFinishModal = ref(false);
const finishModalRankings = ref([]);
const isMobile = ref(false);
const isMoveAnimating = ref(false);
const prefersReducedMotion = ref(false);
const moveAnimator = ref(null);
let reducedMotionMedia = null;
let moveDiffHandler = null;
const actionSheetState = ref('collapsed');
const lastActionSheetRiderId = ref(null);
const headerTitle = computed(() => {
  if (stageRace.value) {
    const stageIndex = stageRace.value.currentStageIndex ?? 0;
    const stage = stageRace.value.stages?.[stageIndex];
    if (stage?.name) {
      const prefix = stage.number ? `Étape ${stage.number} — ` : '';
      return `${prefix}${stage.name}`;
    }
    return 'Course à étapes';
  }

  const classicPreset = getClassicPreset(props.gameConfig?.classicId);
  return classicPreset?.name || 'Course Cycliste';
});

const hasPlayedThisTurn = computed(() => {
  if (!currentRider.value) return false;
  return playedThisTurn.value.includes(currentRider.value.id);
});

const turnSummary = computed(() => {
  if (!currentRider.value) return null;
  return lastActionSummaries.value?.[currentRider.value.id] || null;
});

const decisionAid = computed(() => {
  if (!currentRider.value) return null;
  const energyEstimate = estimateEnergyAfterMove(currentRider.value);
  const windRisk = getWindRisk(currentRider.value);
  return {
    energyEstimate,
    windRisk,
    coachNote: buildCoachNote({ rider: currentRider.value, energyEstimate, windRisk })
  };
});

const leaderPosition = computed(() => {
  if (!allRiders.value?.length) return 0;
  return allRiders.value.reduce((max, rider) => Math.max(max, rider.position ?? 0), 0);
});

const activePosition = computed(() => {
  if (!currentRider.value) return leaderPosition.value;
  return currentRider.value.position ?? leaderPosition.value;
});

const riderTypeLabel = computed(() => {
  if (!currentRider.value) return '';
  return RiderConfig[currentRider.value.type]?.name || currentRider.value.type;
});

const riderTerrainLabel = computed(() => {
  if (!currentRider.value) return '';
  return TerrainConfig[currentRider.value.terrain]?.name || currentRider.value.terrain;
});

const mobileLogPreview = computed(() => {
  if (!gameLog.value?.length) return 'Aucun événement';
  const lastEntry = gameLog.value[gameLog.value.length - 1];
  const cleaned = normalizeLogText(getEntryText(lastEntry));
  return truncateText(cleaned || 'Événement', 72);
});

const shouldSkipEndTurnOverlay = computed(() => {
  if (phase.value !== 'last_turn') return false;
  if (!stageRace.value) return true;
  return stageRace.value.currentStageIndex >= stageRace.value.numStages - 1;
});

const isEffectsOverlayVisible = computed(() => (
  showEffectsOverlay.value && !shouldSkipEndTurnOverlay.value
));

const autoEndTurnAck = ref(false);
const DEBUG_FINISH_MODAL = true;
const finishModalLogOnce = ref(false);
const finishPanelLogOnce = ref(false);

watch(
  [turnPhase, phase, isAnimatingEffects, shouldSkipEndTurnOverlay],
  ([tPhase, gamePhase, animating, skipOverlay]) => {
    if (!skipOverlay) {
      autoEndTurnAck.value = false;
      return;
    }
    if (gamePhase !== 'last_turn') return;
    if (tPhase !== 'end_turn_effects') return;
    if (animating) return;
    if (autoEndTurnAck.value) return;
    autoEndTurnAck.value = true;
    nextTick(() => {
      acknowledgeEffects();
    });
  }
);

watch([phase, rankings], async ([newPhase, rankingsList]) => {
  if (newPhase === 'finished') {
    if (rankingsList?.length) {
      // Capture rankings at the moment we decide to open the modal
      finishModalRankings.value = [...rankingsList];
      console.info('[GameBoard] captured rankings:', {
        length: rankingsList.length,
        captured: finishModalRankings.value.length,
        first: finishModalRankings.value[0]
      });
      // Wait for Vue to process the rankings update before opening modal
      await nextTick();
      showFinishModal.value = true;
      console.info('[GameBoard] modal opened');
    }
    return;
  }

  showFinishModal.value = false;
  finishModalRankings.value = [];
});

watch(showFinishModal, (isOpen) => {
  if (!DEBUG_FINISH_MODAL) return;
  if (isOpen && !finishModalLogOnce.value) {
    finishModalLogOnce.value = true;
    const length = rankings.value?.length || 0;
    console.info('[finish-modal] rankings on open', {
      length,
      first: rankings.value?.[0]
    });
  }
  if (!isOpen) {
    finishModalLogOnce.value = false;
  }
});

watch([phase, showFinishModal, rankings], ([gamePhase, isModalOpen, rankingsList]) => {
  if (!DEBUG_FINISH_MODAL) return;
  if (gamePhase === 'finished' && !isModalOpen) {
    if (!finishPanelLogOnce.value) {
      finishPanelLogOnce.value = true;
      const length = rankingsList?.length || 0;
      console.info('[game-over-panel] rankings visible', {
        length,
        first: rankingsList?.[0]
      });
    }
    return;
  }
  finishPanelLogOnce.value = false;
});

const animationSpeed = computed(() => {
  const speed = Number(UIConfig.animationSpeed ?? 1);
  return Number.isFinite(speed) ? speed : 1;
});

const riderSnapshots = computed(() => {
  if (!allRiders.value?.length) return [];
  return allRiders.value.map(rider => ({
    id: rider.id,
    position: rider.position,
    teamId: rider.teamId || rider.team
  }));
});

// Scroll to rider position on the course
function scrollToRider(riderId) {
  const rider = allRiders.value.find(r => r.id === riderId);
  if (!rider || !courseBoardRef.value) return;
  
  nextTick(() => {
    // Get the track-container (scrollable parent)
    const container = courseBoardRef.value.$el;
    if (!container) return;
    
    // Find all track cells (including start cell)
    const cells = container.querySelectorAll('.track-cell');
    const targetCell = cells[rider.position];
    
    if (targetCell && container) {
      // Calculate scroll position to center the cell
      const containerRect = container.getBoundingClientRect();
      const cellRect = targetCell.getBoundingClientRect();
      const scrollLeft = targetCell.offsetLeft - (containerRect.width / 2) + (cellRect.width / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  });
}


// Quick rider selection from TeamsOverview
// Allows viewing any rider's info (scroll + panel), but only playable riders can be played
function quickSelectRider({ rider, viewOnly = false }) {
  if (phase.value === 'finished') return;
  if (isMoveAnimating.value) return;
  if (rider.hasFinished || rider.turnsToSkip > 0) return;
  
  // Always scroll to rider position
  scrollToRider(rider.id);
  
  // If already selected, just scroll (already done above)
  if (selectedRiderId.value === rider.id) {
    return;
  }
  
  // Cancel current selection if in progress
  if (selectedRiderId.value && turnPhase.value !== 'select_rider') {
    cancelRiderSelection();
  }
  
  // Select rider for viewing (even if from another team or already played)
  // The game engine and UI will handle whether actions are available
  selectRider(rider.id, { viewOnly });
}

function updateViewport() {
  if (typeof window === 'undefined') return;
  isMobile.value = window.matchMedia('(max-width: 900px)').matches;
}

function updateReducedMotionPreference() {
  if (!reducedMotionMedia) return;
  prefersReducedMotion.value = reducedMotionMedia.matches;
}

function setupReducedMotionListener() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  updateReducedMotionPreference();
  if (typeof reducedMotionMedia.addEventListener === 'function') {
    reducedMotionMedia.addEventListener('change', updateReducedMotionPreference);
  } else if (typeof reducedMotionMedia.addListener === 'function') {
    reducedMotionMedia.addListener(updateReducedMotionPreference);
  }
}

function teardownReducedMotionListener() {
  if (!reducedMotionMedia) return;
  if (typeof reducedMotionMedia.removeEventListener === 'function') {
    reducedMotionMedia.removeEventListener('change', updateReducedMotionPreference);
  } else if (typeof reducedMotionMedia.removeListener === 'function') {
    reducedMotionMedia.removeListener(updateReducedMotionPreference);
  }
  reducedMotionMedia = null;
}

function getMoveAnimationMode(moves) {
  if (!moves?.length) return 'sequential';
  return moves.length > 3 ? 'batch' : 'sequential';
}

function setupMoveAnimator() {
  if (!courseBoardRef.value || moveAnimator.value) return;
  moveAnimator.value = createMoveAnimator({
    getOverlay: () => courseBoardRef.value?.getOverlayElement?.(),
    getRiderElement: riderId => courseBoardRef.value?.getRiderElement?.(riderId),
    getCellElement: position => courseBoardRef.value?.getCellElement?.(position),
    getReducedMotion: () => prefersReducedMotion.value,
    onStart: () => {
      isMoveAnimating.value = true;
    },
    onEnd: () => {
      isMoveAnimating.value = false;
    }
  });

  moveDiffHandler = createMoveDiffHandler({
    animator: moveAnimator.value,
    getFromRect: move => {
      const element = courseBoardRef.value?.getRiderElement?.(move.riderId);
      return element?.getBoundingClientRect ? element.getBoundingClientRect() : null;
    },
    getToRect: move => {
      const element = courseBoardRef.value?.getRiderElement?.(move.riderId);
      return element?.getBoundingClientRect ? element.getBoundingClientRect() : null;
    },
    getMode: getMoveAnimationMode,
    getSpeed: () => animationSpeed.value
  });
}

function toggleActionSheet() {
  if (!isMobile.value || !currentRider.value) return;
  if (actionSheetState.value === 'collapsed') {
    actionSheetState.value = 'peek';
    return;
  }
  actionSheetState.value = actionSheetState.value === 'expanded' ? 'peek' : 'expanded';
}

function getEntryText(entry) {
  if (typeof entry === 'string') return entry;
  return entry?.message || entry?.text || '';
}

function normalizeLogText(text) {
  if (!text) return '';
  let cleaned = text
    .replace(/🏁|🏆|💨|🛡️|🌀|⚔️|🍌|🤕|⚠️|🎲|▶️|➡️/g, '')
    .replace(/\[FINISH\]|\[WINNER\]|\[WIND\]|\[SHELTER\]|\[ASPIRATION\]|\[ATTACK\]|\[REFUEL\]|\[CRASH\]|\[EVENT\]/g, '')
    .replace(/[=═-]{3,}/g, '')
    .replace(/!+/g, '')
    .trim();

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/Tour\s+\d+/i, '').trim();
  return cleaned;
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

// Card helpers
function getSelectedCardValue() {
  const card = getSelectedCard();
  return card?.value || 0;
}

function isSelectedCardAttack() {
  if (!currentRider.value) return false;
  return currentRider.value.attackCards?.some(c => c.id === selectedCardId.value);
}

function guardAction(action) {
  return (...args) => {
    if (isMoveAnimating.value) return;
    return action(...args);
  };
}

const guardedCancelRiderSelection = guardAction(cancelRiderSelection);
const guardedSelectCard = guardAction(selectCard);
const guardedCancelCardSelection = guardAction(cancelCardSelection);
const guardedRollDice = guardAction(rollDice);
const guardedUseSpecialty = guardAction(useSpecialty);
const guardedSkipSpecialty = guardAction(skipSpecialty);
const guardedResolve = guardAction(resolve);

// Team helpers for dynamic legend
function getTeamColor(teamId) {
  return TeamConfigs[teamId]?.color || '#666';
}

function getTeamName(teamId) {
  return TeamConfigs[teamId]?.name || teamId;
}

function isTeamAI(teamId) {
  const player = players.value?.find(p => p.teamId === teamId);
  return player?.playerType === PlayerType.AI;
}

// Save/Load handlers
function openSaveModal() {
  showSaveModal.value = true;
}

function openLoadModal() {
  // Confirm if game is in progress
  if (phase.value !== 'finished' && turn.value > 1) {
    if (!confirm('Charger une partie remplacera la partie en cours. Continuer ?')) {
      return;
    }
  }
  showLoadModal.value = true;
}

function handleRestart() {
  showFinishModal.value = false;
  const config = rawGameState.value?.gameConfig || props.gameConfig || null;
  initialize(config);
}

function handleNewCourse() {
  showFinishModal.value = false;
  emit('backToSetup');
}

function handleLoadGame({ meta, state }) {
  showLoadModal.value = false;
  emit('restore', { meta, state });
}

function getWindRisk(rider) {
  if (!rider || rider.hasFinished) return null;
  if (rider.terrain === 'mountain' || rider.terrain === 'descent') return false;
  const leader = getLeaderAt(rider.position);
  if (!leader || leader.id !== rider.id) return false;
  const cellAheadEmpty = !allRiders.value.some(r => r.position === rider.position + 1 && !r.hasFinished);
  return cellAheadEmpty;
}

function estimateEnergyAfterMove(rider) {
  if (!rider || !selectedCardId.value || !lastDiceRoll.value) return null;
  if (!Number.isFinite(calculatedMovement.value) || calculatedMovement.value <= 0) return null;
  const usedAttack = rider.attackCards?.some(c => c.id === selectedCardId.value);
  const usedSpecialty = !!selectedSpecialtyId.value;
  const energyBefore = rider.energy ?? 100;
  const energyConsumed = calculateMovementConsumption({
    distance: calculatedMovement.value,
    terrain: rider.terrain,
    riderType: rider.type,
    usedAttack,
    usedSpecialty,
    isLeading: false
  }) + (rider.windPenaltyNextMove || 0);
  const targetPosition = rider.position + calculatedMovement.value;
  const recovery = calculateRecovery({
    terrain: rider.terrain,
    distance: rider.terrain === 'descent' ? calculatedMovement.value : 0,
    isSheltered: false,
    inRefuelZone: isRefuelZone(course.value || [], targetPosition)
  });
  return Math.max(0, Math.min(100, energyBefore - energyConsumed + recovery));
}

function buildCoachNote({ rider, energyEstimate, windRisk }) {
  if (!rider) return '';
  if ((rider.energy ?? 100) <= 25) return 'Priorité à la récupération.';
  if (windRisk) return 'Rester abrité pour limiter le vent.';
  if (rider.terrain === 'mountain' && rider.type === 'climber') return 'Montée favorable, garder le tempo.';
  if (rider.terrain === 'sprint' && rider.type === 'sprinter') return 'Garder de la marge pour le sprint.';
  if (energyEstimate !== null && energyEstimate <= 30) return 'Gestion prudente de l’énergie.';
  return 'Construire l’effort sans sur-risque.';
}

// Initialize on mount with game config or restore from saved state
onMounted(() => {
  updateViewport();
  window.addEventListener('resize', updateViewport);
  setupReducedMotionListener();
  setupMoveAnimator();

  // Check if we're restoring a saved game
  if (props.savedState) {
    restoreFromSave(props.savedState);
  } else {
    initialize(props.gameConfig);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport);
  teardownReducedMotionListener();
  moveAnimator.value?.cancel();
});

watch(
  () => currentRider.value?.id,
  (riderId) => {
    if (!isMobile.value) return;
    if (riderId && riderId !== lastActionSheetRiderId.value) {
      actionSheetState.value = 'peek';
    }
    if (!riderId) {
      actionSheetState.value = 'collapsed';
    }
    lastActionSheetRiderId.value = riderId || null;
  }
);

watch(isMobile, (mobile) => {
  if (!mobile) {
    actionSheetState.value = 'collapsed';
    return;
  }
  if (currentRider.value?.id) {
    actionSheetState.value = 'peek';
  }
});

watch(courseBoardRef, () => {
  setupMoveAnimator();
});

watch(
  riderSnapshots,
  (next, prev) => {
    if (!moveDiffHandler) return;
    if (!prev?.length || !next?.length) return;
    const effects = (endTurnEffects.value?.aspiration || []).map(effect => ({
      ...effect,
      type: 'aspiration'
    }));
    const batchId = moveDiffHandler.capture(prev, next, effects);
    if (!batchId) return;
    nextTick(() => {
      moveDiffHandler?.playPending(batchId);
    });
  },
  { flush: 'pre' }
);

// v4.0: Watch for AI turns and execute automatically
watch(
  [isAITurn, turnPhase, isEffectsOverlayVisible, phase, currentTeam, isMoveAnimating],
  ([aiTurn, tPhase, effectsShowing, gamePhase, team, animating]) => {
    // Only execute AI if:
    // - It's an AI turn
    // - Game is still playing
    // - Not showing effects overlay
    // - Valid turn phase
    if (animating) return;
    if (aiTurn && gamePhase !== 'finished' && !effectsShowing) {
      const validPhases = ['select_rider', 'end_turn_effects'];
      if (validPhases.includes(tPhase)) {
        // Small delay before AI action for visibility
        setTimeout(() => {
          if (!isMoveAnimating.value) {
            executeAITurn();
          }
        }, 300);
      }
    }
  },
  { immediate: true }
);
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
}

.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-lg);
  --status-bar-offset: 64px;
  font-family: var(--font-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.rules-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
}

.course-board-shell {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow:
    0 0 0 1px var(--color-line),
    0 8px 20px rgba(31, 35, 40, 0.08);
  scroll-margin-top: 120px;
}

h1 {
  margin: 0;
  color: var(--color-ink, #1e293b);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.header-main {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.header-main h1 {
  text-align: left;
  font-size: 22px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.header-icon {
  color: var(--team-blue-print, #3F60C9);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-muted, #64748b);
  color: white;
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.15s;
}

.btn-back:hover {
  background: #475569;
}

.no-selection-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: var(--color-paper, #f8fafc);
  border: 1px solid var(--color-line, #e2e8f0);
  border-radius: var(--radius-card, 12px);
  color: var(--color-muted, #64748b);
  font-size: 1.1em;
}

.prompt-icon {
  color: var(--color-ink-muted, rgba(31, 35, 40, 0.5));
}

.team-legend {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  flex-wrap: wrap;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-ink, #1e293b);
}

.team-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
}

/* AI Thinking indicator */
.ai-thinking {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  text-align: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--team-yellow-light, #fef3c7);
  border: 1px solid rgba(242, 201, 76, 0.3);
  border-radius: var(--radius-md, 8px);
  color: #92400e;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* View-only banner for consulted riders */
.view-only-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-canvas, #f1f5f9);
  border: 1px dashed var(--color-line, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  color: var(--color-muted, #64748b);
  font-size: 0.9em;
  font-style: italic;
}

.mobile-log-line {
  display: none;
}

@media (max-width: 900px) {
  .game-container {
    padding-bottom: calc(240px + env(safe-area-inset-bottom));
  }

  .header-row {
    flex-wrap: wrap;
  }

  .header-main h1 {
    font-size: 20px;
  }

  .rider-action-sheet {
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: min(100%, 1200px);
    background: var(--color-surface);
    border-radius: 18px 18px 0 0;
    border: 1px solid var(--color-line);
    box-shadow: 0 -8px 24px rgba(31, 35, 40, 0.18);
    display: flex;
    flex-direction: column;
    z-index: var(--z-sticky);
    overflow: hidden;
  }

  .rider-action-sheet__handle {
    background: transparent;
    border: none;
    padding: 10px 0 4px;
    cursor: pointer;
  }

  .rider-action-sheet__grab {
    display: block;
    width: 48px;
    height: 4px;
    border-radius: 999px;
    background: rgba(31, 35, 40, 0.2);
    margin: 0 auto;
  }

  .rider-action-sheet__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: 8px var(--space-md) var(--space-sm);
    border-bottom: 1px solid var(--color-line-subtle);
    cursor: pointer;
  }

  .rider-action-sheet__identity {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .rider-action-sheet__identity-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .rider-action-sheet__name {
    font-weight: 600;
    color: var(--color-ink);
  }

  .rider-action-sheet__type {
    font-size: 12px;
    color: var(--color-ink-muted);
  }

  .rider-action-sheet__meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: 12px;
    color: var(--color-ink-muted);
    flex-shrink: 0;
  }

  .rider-action-sheet__terrain {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .rider-action-sheet__body {
    padding: var(--space-sm) var(--space-md) var(--space-lg);
    overflow: auto;
    min-height: 0;
  }

  .rider-action-sheet__body .btn-close {
    display: none;
  }

  .rider-action-sheet__empty {
    color: var(--color-ink-muted);
    font-size: 14px;
  }

  .rider-action-sheet--collapsed {
    height: 96px;
  }

  .rider-action-sheet--collapsed .rider-action-sheet__body {
    display: none;
  }

  .rider-action-sheet--peek {
    height: min(45vh, 360px);
  }

  .rider-action-sheet--expanded {
    height: min(85vh, 720px);
  }

  .mobile-log-line {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 8px var(--space-md);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    background: var(--color-paper);
  }

  .mobile-log-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-ink-muted);
    font-weight: 600;
  }

  .mobile-log-text {
    flex: 1;
    font-size: 13px;
    color: var(--color-ink);
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mobile-log-action {
    flex-shrink: 0;
  }
}
</style>
