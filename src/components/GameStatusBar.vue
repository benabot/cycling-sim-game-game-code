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

    <template v-if="hasStageRace">
      <div class="status-bar-divider"></div>

      <div class="status-bar-item status-bar-stage">
        <span class="status-bar-label">Étape</span>
        <span class="status-bar-value type-numeric">{{ stageIndicator }}</span>
        <span v-if="stageName" class="status-bar-sub">{{ stageName }}</span>
      </div>

      <div class="status-bar-divider"></div>

      <div class="status-bar-item status-bar-jerseys">
        <span class="status-bar-label">Maillots</span>
        <div class="jersey-list">
          <div
            v-for="jersey in jerseyDisplay"
            :key="jersey.id"
            class="jersey-chip"
            :class="{ 'jersey-chip--empty': !jersey.leader }"
            :style="{ '--jersey-color': jersey.color }"
            :title="jersey.bonus"
          >
            <UIIcon :type="jersey.icon" :size="12" />
            <span class="jersey-chip__label">{{ jersey.shortLabel }}</span>
            <span class="jersey-chip__leader">{{ jersey.leader || '—' }}</span>
          </div>
        </div>
      </div>
    </template>

    <span v-if="isLastTurn" class="badge badge-gold status-bar-badge">
      <UIIcon type="finish" :size="14" />
      Dernier tour
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
import { JerseyConfig } from '../config/race-presets.js';
import { UIIcon } from './icons';

const props = defineProps({
  turn: { type: Number, required: true },
  phase: { type: String, required: true },
  turnPhase: { type: String, required: true },
  currentTeam: { type: String, required: true },
  isLastTurn: { type: Boolean, default: false },
  winningTeam: { type: String, default: null },
  stageRace: { type: Object, default: null }
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
    select_rider: 'Sélection coureur',
    select_card: 'Choix de carte',
    roll_dice: 'Lancer le dé',
    select_specialty: 'Spécialité',
    resolve: 'Résolution'
  };
  return labels[props.turnPhase] || '';
});

const phaseTooltip = computed(() => {
  const tooltips = {
    select_rider: 'Sélectionnez un coureur.',
    select_card: 'Choisissez une carte.',
    roll_dice: 'Lancez le dé.',
    select_specialty: 'Choisissez une spécialité.',
    resolve: 'Validez le déplacement.'
  };
  return tooltips[props.turnPhase] || '';
});

const hasStageRace = computed(() => !!props.stageRace);
const stageCount = computed(() => props.stageRace?.stages?.length || 0);
const stageIndex = computed(() => {
  if (!stageCount.value) return 0;
  const rawIndex = props.stageRace?.currentStageIndex ?? 0;
  return Math.min(rawIndex, stageCount.value - 1);
});
const currentStage = computed(() => props.stageRace?.stages?.[stageIndex.value] || null);
const stageIndicator = computed(() => {
  if (!stageCount.value) return '—';
  const number = currentStage.value?.number || stageIndex.value + 1;
  return `${number}/${stageCount.value}`;
});
const stageName = computed(() => currentStage.value?.name || '');

const jerseyDisplay = computed(() => {
  if (!props.stageRace) return [];
  const classificationMap = {
    yellow: 'general',
    green: 'sprint',
    polka: 'mountain'
  };

  return ['yellow', 'green', 'polka'].map((id) => {
    const jersey = JerseyConfig[id];
    const leaderId = props.stageRace?.jerseys?.[id] || null;
    const standings = props.stageRace?.standings?.[classificationMap[id]] || {};
    const leader = leaderId ? standings[leaderId]?.name : null;
    const shortLabel = jersey?.name?.replace('Maillot ', '') || id;
    return {
      id,
      icon: jersey?.icon || 'trophy',
      color: jersey?.color || '#CCCCCC',
      shortLabel,
      leader,
      bonus: jersey?.bonus?.description || ''
    };
  });
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

.status-bar-stage {
  min-width: 90px;
}

.status-bar-sub {
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--color-ink-muted);
}

.status-bar-jerseys {
  flex: 1.4;
}

.jersey-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.jersey-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-chip);
  border: 1px solid color-mix(in srgb, var(--jersey-color) 45%, transparent);
  background-color: color-mix(in srgb, var(--jersey-color) 15%, var(--color-surface));
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--color-ink);
  white-space: nowrap;
}

.jersey-chip--empty {
  opacity: 0.55;
}

.jersey-chip__label {
  font-weight: 600;
}

.jersey-chip__leader {
  color: var(--color-ink-soft);
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
