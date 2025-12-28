<template>
  <div class="game-container">
    <div class="header-row">
      <RiderIcon type="rouleur" :size="32" class="header-icon" />
      <h1>Course Cycliste - v4.0</h1>
      <button v-if="phase === 'finished'" class="btn-back" @click="$emit('backToSetup')">
        <UIIcon type="chevron-up" size="sm" style="transform: rotate(-90deg)" />
        Nouvelle partie
      </button>
    </div>
    
    <!-- AI Thinking Indicator -->
    <div v-if="isAIThinking" class="ai-thinking">
      <UIIcon type="ai" size="md" />
      L'IA réfléchit...
    </div>
    
    <!-- Status Bar -->
    <GameStatusBar 
      :turn="turn"
      :phase="phase"
      :turnPhase="turnPhase"
      :currentTeam="currentTeam"
      :isLastTurn="isLastTurn"
      :winningTeam="winningTeam"
    />

    <!-- Terrain Legend -->
    <TerrainLegend />

    <!-- Course Board -->
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

    <!-- Effects Overlay -->
    <EffectsOverlay 
      v-if="showEffectsOverlay"
      :turn="turn"
      :effects="endTurnEffects"
      @acknowledge="acknowledgeEffects"
    />

    <!-- Selected Rider Panel -->
    <template v-if="currentRider && phase !== 'finished' && !showEffectsOverlay">
      <RiderPanel
        :rider="currentRider"
        :terrain="currentRider.terrain"
        :terrainBonus="currentRider.terrainBonus"
        :canUseSpecialty="currentRider.availableCards?.canUseSpecialty"
        :turnPhase="turnPhase"
        :selectedCardId="selectedCardId"
        @cancel="cancelRiderSelection"
        @selectCard="selectCard"
      >
        <template #actions>
          <ActionZone 
            :turnPhase="turnPhase"
            :cardValue="getSelectedCardValue()"
            :isAttackCard="isSelectedCardAttack()"
            :diceResult="lastDiceRoll?.result || 0"
            :terrainBonus="currentRider.terrainBonus"
            :hasSpecialtyCards="currentRider.specialtyCards?.length > 0"
            :useSpecialty="!!selectedSpecialtyId"
            :totalMovement="calculatedMovement"
            :currentPosition="currentRider.position"
            @rollDice="rollDice"
            @cancelCard="cancelCardSelection"
            @useSpecialty="useSpecialty"
            @skipSpecialty="skipSpecialty"
            @resolve="resolve"
          />
        </template>
      </RiderPanel>
    </template>

    <!-- No Selection Prompt -->
    <div v-else-if="phase !== 'finished' && !showEffectsOverlay" class="no-selection-prompt">
      <UIIcon type="target" size="lg" class="prompt-icon" />
      <span>Cliquez sur un coureur de <strong>{{ currentTeamConfig?.name }}</strong> pour le jouer</span>
    </div>

    <!-- Team Legend (dynamique) -->
    <div class="team-legend" v-if="!showEffectsOverlay">
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
      :aiPersonalities="aiPersonalities"
      @selectRider="quickSelectRider"
    />

    <!-- Game Over -->
    <GameOverPanel 
      v-if="phase === 'finished'"
      :winningTeam="winningTeam"
      :rankings="rankings"
      @restart="restartGame"
    />

    <!-- Game Log -->
    <GameLog :log="gameLog" />

    <!-- Rules Drawer (collapsed by default) -->
    <RulesDrawer :courseLength="course?.length || 80" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useGameEngine } from '../composables/useGameEngine.js';
import { TeamConfigs, PlayerType } from '../core/teams.js';
import {
  GameStatusBar,
  TerrainLegend,
  CourseBoard,
  EffectsOverlay,
  RiderPanel,
  ActionZone,
  TeamsOverview,
  GameOverPanel,
  GameLog,
  RulesDrawer,
  UIIcon,
  RiderIcon
} from '../components';

// Props and emits
const props = defineProps({
  gameConfig: { type: Object, default: null }
});

defineEmits(['backToSetup']);

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
  isAIThinking,
  aiMoveFlash,
  
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
  getLeaderAt,
  getSelectedCard
} = useGameEngine();

// Ref for course board scrolling
const courseBoardRef = ref(null);

// Scroll to rider position on the course
function scrollToRider(riderId) {
  const rider = allRiders.value.find(r => r.id === riderId);
  if (!rider || !courseBoardRef.value) return;
  
  nextTick(() => {
    const courseEl = courseBoardRef.value.$el?.querySelector('.course');
    if (!courseEl) return;
    
    // Find the cell at rider's position
    const cells = courseEl.querySelectorAll('.cell');
    const targetCell = cells[rider.position];
    
    if (targetCell) {
      targetCell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });
}

// Quick rider selection from TeamsOverview
function quickSelectRider(rider) {
  if (phase.value === 'finished') return;
  if (rider.hasFinished || rider.turnsToSkip > 0) return;
  if (playedThisTurn.value.includes(rider.id)) return;
  if (rider.team !== currentTeam.value) return;
  
  // If already selected, just scroll
  if (selectedRiderId.value === rider.id) {
    scrollToRider(rider.id);
    return;
  }
  
  // Cancel current selection if needed and select new rider
  if (selectedRiderId.value && turnPhase.value !== 'select_rider') {
    cancelRiderSelection();
  }
  
  selectRider(rider.id);
  scrollToRider(rider.id);
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

// Initialize on mount with game config
onMounted(() => {
  initialize(props.gameConfig);
});

// v4.0: Watch for AI turns and execute automatically
watch(
  [isAITurn, turnPhase, showEffectsOverlay, phase, currentTeam],
  ([aiTurn, tPhase, effectsShowing, gamePhase, team]) => {
    // Only execute AI if:
    // - It's an AI turn
    // - Game is still playing
    // - Not showing effects overlay
    // - Valid turn phase
    if (aiTurn && gamePhase !== 'finished' && !effectsShowing) {
      const validPhases = ['select_rider', 'end_turn_effects'];
      if (validPhases.includes(tPhase)) {
        // Small delay before AI action for visibility
        setTimeout(() => executeAITurn(), 300);
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
  padding: 20px;
  font-family: var(--font-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif);
}

h1 {
  text-align: center;
  margin: 0;
  color: var(--color-ink, #1e293b);
}

.header-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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
  gap: 12px;
  padding: 30px;
  background: var(--color-paper, #f8fafc);
  border: 1px solid var(--color-line, #e2e8f0);
  border-radius: var(--radius-card, 12px);
  margin-bottom: 20px;
  color: var(--color-muted, #64748b);
  font-size: 1.1em;
}

.prompt-icon {
  color: var(--color-ink-muted, rgba(31, 35, 40, 0.5));
}

.team-legend {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 15px;
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
  gap: 10px;
  text-align: center;
  padding: 12px 20px;
  background: var(--team-yellow-light, #fef3c7);
  border: 1px solid rgba(242, 201, 76, 0.3);
  border-radius: var(--radius-md, 8px);
  margin-bottom: 15px;
  color: #92400e;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
