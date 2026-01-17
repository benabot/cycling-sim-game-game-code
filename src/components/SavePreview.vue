<template>
  <div class="save-preview">
    <div class="preview-header">
      <UIIcon type="save" class="preview-icon" />
      <div class="preview-title">{{ meta.name }}</div>
    </div>

    <div class="preview-details">
      <div class="preview-row">
        <span class="preview-label">Parcours</span>
        <span class="preview-value">{{ meta.raceName }} ({{ meta.courseLength }} cases)</span>
      </div>

      <div class="preview-row">
        <span class="preview-label">Progression</span>
        <span class="preview-value">
          Tour {{ meta.currentTurn }}
          <span v-if="meta.isLastTurn" class="badge badge-warning">Dernier tour</span>
        </span>
      </div>

      <div v-if="meta.leaderName" class="preview-row">
        <span class="preview-label">Leader</span>
        <span class="preview-value">
          {{ meta.leaderName }}
          <span class="leader-position">case {{ meta.leaderPosition }}</span>
        </span>
      </div>

      <div class="preview-row">
        <span class="preview-label">Équipes</span>
        <span class="preview-value">
          {{ meta.numTeams }} équipe{{ meta.numTeams > 1 ? 's' : '' }}
          <span v-if="aiCount > 0" class="ai-indicator">({{ aiCount }} IA)</span>
        </span>
      </div>

      <div v-if="meta.currentStage" class="preview-row">
        <span class="preview-label">Étape</span>
        <span class="preview-value">{{ meta.currentStage }} / {{ meta.totalStages }}</span>
      </div>

      <div v-if="formattedDate" class="preview-row preview-row--muted">
        <span class="preview-label">Sauvegardé</span>
        <span class="preview-value">{{ formattedDate }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import UIIcon from './icons/UIIcon.vue';

const props = defineProps({
  meta: {
    type: Object,
    required: true
  }
});

const aiCount = computed(() => {
  return props.meta.teams?.filter(t => t.type === 'ai').length || 0;
});

const formattedDate = computed(() => {
  if (!props.meta.savedAt) return null;
  
  try {
    const date = new Date(props.meta.savedAt);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return null;
  }
});
</script>

<style scoped>
.save-preview {
  background: var(--color-canvas);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-line);
}

.preview-icon {
  width: 20px;
  height: 20px;
  color: var(--color-ink-muted);
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-details {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 4px 0;
}

.preview-row--muted {
  opacity: 0.7;
  padding-top: var(--space-sm);
  margin-top: var(--space-xs);
  border-top: 1px solid var(--color-line);
}

.preview-label {
  color: var(--color-ink-muted);
}

.preview-value {
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

.ai-indicator {
  font-weight: 400;
  color: var(--color-ink-muted);
}

.badge {
  display: inline-flex;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-sm);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
}
</style>
