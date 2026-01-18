<template>
  <div class="cloud-save-card" :class="{ 'cloud-save-card--loading': isLoading }">
    <div class="card-header">
      <UIIcon :type="raceIcon" class="card-icon" />
      <div class="card-title">{{ game.name }}</div>
    </div>

    <div class="card-details">
      <div class="card-row">
        <span class="card-label">Parcours</span>
        <span class="card-value">{{ raceName }} ({{ game.course_length }} cases)</span>
      </div>

      <div class="card-row">
        <span class="card-label">Progression</span>
        <span class="card-value">Tour {{ game.current_turn }}</span>
      </div>

      <div v-if="game.leader_name" class="card-row">
        <span class="card-label">Leader</span>
        <span class="card-value">
          {{ game.leader_name }}
          <span class="leader-position">case {{ game.leader_position }}</span>
        </span>
      </div>

      <div class="card-row card-row--muted">
        <span class="card-label">Modifié</span>
        <span class="card-value">{{ formattedDate }}</span>
      </div>
    </div>

    <div class="card-actions">
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        @click="$emit('delete', game)"
        :disabled="isLoading"
        title="Supprimer"
      >
        <UIIcon type="close" size="sm" />
      </button>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="$emit('load', game)"
        :disabled="isLoading"
      >
        <UIIcon type="play" size="sm" />
        Charger
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import UIIcon from './icons/UIIcon.vue';

const props = defineProps({
  game: {
    type: Object,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['load', 'delete']);

const raceName = computed(() => {
  if (props.game.race_mode === 'stage') {
    return 'Course à étapes';
  }

  if (props.game.race_preset) {
    const presetNames = {
      ardennaise: 'Ardennaise',
      lombarde: 'Lombarde',
      riviera: 'Riviera',
      nord: 'Nord'
    };
    return presetNames[props.game.race_preset] || props.game.race_preset;
  }

  return 'Course personnalisée';
});

const raceIcon = computed(() => {
  if (props.game.race_mode === 'stage') {
    return 'calendar';
  }
  return 'laurel';
});

const formattedDate = computed(() => {
  const dateStr = props.game.updated_at || props.game.created_at;
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
});
</script>

<style scoped>
.cloud-save-card {
  background: var(--color-canvas);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: var(--transition-fast);
}

.cloud-save-card:hover {
  border-color: var(--color-line-strong);
}

.cloud-save-card--loading {
  opacity: 0.6;
  pointer-events: none;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-line);
}

.card-icon {
  width: 18px;
  height: 18px;
  color: var(--color-ink-muted);
  flex-shrink: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-details {
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 3px 0;
}

.card-row--muted {
  opacity: 0.7;
  padding-top: var(--space-xs);
  margin-top: 2px;
  border-top: 1px solid var(--color-line-subtle);
}

.card-label {
  color: var(--color-ink-muted);
}

.card-value {
  color: var(--color-ink);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.leader-position {
  font-weight: 400;
  color: var(--color-ink-muted);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-line);
  background: var(--color-paper);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  font-family: var(--font-body, inherit);
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}

.btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  color: var(--color-ink-muted);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-canvas);
  border-color: var(--color-line-strong);
  color: var(--color-danger);
}

.btn-primary {
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
  color: var(--color-paper);
}

.btn-primary:hover:not(:disabled) {
  background: #2d3339;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn :deep(svg) {
  width: 14px;
  height: 14px;
}
</style>
