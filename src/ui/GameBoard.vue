<template>
  <div class="game-container">
    <h1>🚴 Course Cycliste - v3.1</h1>
    
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
      :course="course"
      :riders="allRiders"
      :selectedRiderId="selectedRiderId"
      :animatingRiders="animatingRiders"
      :getLeaderAtPosition="getLeaderAt"
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
      <span class="prompt-icon">👆</span>
      <span>Cliquez sur un coureur de <strong>{{ currentTeamConfig?.name }}</strong> pour le jouer</span>
    </div>

    <!-- Team Legend -->
    <div class="team-legend" v-if="!showEffectsOverlay">
      <div class="team-item">
        <span class="team-color" style="background: #dc2626"></span>
        Équipe Rouge (Joueur 1)
      </div>
      <div class="team-item">
        <span class="team-color" style="background: #2563eb"></span>
        Équipe Bleue (Joueur 2)
      </div>
    </div>

    <!-- Teams Overview -->
    <TeamsOverview 
      v-if="phase !== 'finished' && !showEffectsOverlay"
      :riders="allRiders"
      :currentTeam="currentTeam"
      :selectedRiderId="selectedRiderId"
      :playedRiders="playedThisTurn"
      @selectRider="selectRider"
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

    <!-- Rules Section -->
    <RulesSection />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGameEngine } from '../composables/useGameEngine.js';
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
  RulesSection
} from '../components';

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
  getLeaderAt,
  getSelectedCard
} = useGameEngine();

// Card helpers
function getSelectedCardValue() {
  const card = getSelectedCard();
  return card?.value || 0;
}

function isSelectedCardAttack() {
  if (!currentRider.value) return false;
  return currentRider.value.attackCards?.some(c => c.id === selectedCardId.value);
}

// Initialize on mount
onMounted(() => {
  initialize();
});
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #1e293b;
}

.no-selection-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;
  color: #64748b;
  font-size: 1.1em;
}

.team-legend {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 15px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}
</style>
