<template>
  <div class="status-bar" :class="{ 'status-bar--last-turn': isLastTurn }">
    <div class="status-bar-item">
      <span class="status-bar-label">Tour</span>
      <span class="status-bar-value type-numeric-lg">{{ turn }}</span>
    </div>

    <div class="status-bar-divider"></div>

    <div class="status-bar-item">
      <span class="status-bar-label">Équipe</span>
      <span class="status-bar-value" :class="teamColorClass">
        {{ teamConfig?.playerName || teamConfig?.name }}
      </span>
    </div>

    <div class="status-bar-divider"></div>

    <div class="status-bar-item status-bar-phase">
      <span class="status-bar-label">Phase</span>
      <span class="status-bar-value phase-value" :title="phaseTooltip">
        <UIIcon :type="phaseIcon" :size="16" class="phase-icon" />
        {{ phaseLabel }}
      </span>
    </div>

    <span v-if="isLastTurn" class="badge badge-gold status-bar-badge">
      <UIIcon type="finish" :size="14" />
      DERNIER TOUR
    </span>

    <span v-if="phase === 'finished'" class="badge badge-gold status-bar-badge">
      <UIIcon type="trophy" :size="14" />
      {{ winnerName }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { TeamConfig } from '../config/game.config.js';
import { UIIcon } from './icons';

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

const teamColorClass = computed(() => ({
  'text-team-red': props.currentTeam === 'team_a',
  'text-team-blue': props.currentTeam === 'team_b',
  'text-team-green': props.currentTeam === 'team_c',
  'text-team-yellow': props.currentTeam === 'team_d'
}));

const phaseIcon = computed(() => {
  const icons = {
    select_rider: 'cursor',
    select_card: 'card',
    roll_dice: 'die',
    select_specialty: 'star',
    resolve: 'check'
  };
  return icons[props.turnPhase] || 'info';
});

const phaseLabel = computed(() => {
  if (props.phase === 'finished') return 'Course terminée';
  const labels = {
    select_rider: 'Choisir coureur',
    select_card: 'Choisir carte',
    roll_dice: 'Lancer dé',
    select_specialty: 'Spécialité ?',
    resolve: 'Valider'
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
/* Uses status-bar classes from layout.css */

.status-bar--last-turn {
  background: color-mix(in srgb, var(--color-gold) 15%, var(--color-surface));
  border-color: var(--color-gold);
}

.status-bar-phase {
  flex: 1;
}

.phase-value {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.phase-icon {
  color: var(--color-accent);
}

.status-bar-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: auto;
  animation: pulse 1.5s infinite;
}

.badge-gold {
  background: var(--color-gold);
  color: var(--color-ink);
}

/* Team colors */
.text-team-red { color: var(--team-red-ui); }
.text-team-blue { color: var(--team-blue-ui); }
.text-team-green { color: var(--team-green-ui); }
.text-team-yellow { color: var(--team-yellow-print); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
