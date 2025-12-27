<template>
  <div class="status-bar" :class="{ 'last-turn': isLastTurn }" :style="{ borderColor: teamConfig?.color }">
    <span class="turn" title="Tour actuel">Tour {{ turn }}</span>
    <span v-if="isLastTurn" class="last-turn-badge">🏁 DERNIER TOUR</span>
    <span class="current-player" :style="{ background: teamConfig?.color }" :title="`C'est au tour de ${teamConfig?.playerName}`">
      {{ teamConfig?.playerName }}
    </span>
    <span class="phase" :title="phaseTooltip">{{ phaseLabel }}</span>
    <span v-if="phase === 'finished'" class="winner">🏆 {{ winnerName }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { TeamConfig } from '../config/game.config.js';

const props = defineProps({
  turn: { type: Number, required: true },
  phase: { type: String, required: true },
  turnPhase: { type: String, required: true },
  currentTeam: { type: String, required: true },
  isLastTurn: { type: Boolean, default: false },
  winningTeam: { type: String, default: null }
});

const teamConfig = computed(() => TeamConfig[props.currentTeam]);
const winnerName = computed(() => props.winningTeam ? TeamConfig[props.winningTeam]?.name : 'Égalité');

const phaseLabel = computed(() => {
  if (props.phase === 'finished') return 'Course terminée';
  const labels = {
    select_rider: '👆 Choisir un coureur',
    select_card: '🃏 Choisir une carte',
    roll_dice: '🎲 Lancer le dé',
    select_specialty: '★ Spécialité ?',
    resolve: '✓ Valider'
  };
  return labels[props.turnPhase] || '';
});

const phaseTooltip = computed(() => {
  const tooltips = {
    select_rider: 'Sélectionnez un coureur de votre équipe',
    select_card: 'Choisissez une carte mouvement ou attaque',
    roll_dice: 'Lancez le dé pour déterminer le déplacement',
    select_specialty: 'Utilisez une carte spécialité si disponible',
    resolve: 'Confirmez le mouvement'
  };
  return tooltips[props.turnPhase] || '';
});
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #3b82f6;
}
.status-bar.last-turn { background: #fef3c7; border-color: #f59e0b; }
.turn { font-weight: bold; font-size: 1.1em; }
.last-turn-badge { background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; animation: pulse 1s infinite; }
.current-player { padding: 6px 16px; border-radius: 20px; color: white; font-weight: 500; }
.phase { color: #64748b; font-size: 0.95em; }
.winner { color: #f59e0b; font-weight: bold; font-size: 1.1em; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
