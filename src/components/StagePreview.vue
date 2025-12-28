<!--
  StagePreview.vue - Small card preview for a stage
  v5.0 - Phase 3
-->
<template>
  <div class="stage-preview">
    <div class="stage-preview__header">
      <div class="stage-preview__icon">
        <UIIcon :type="stage.icon" size="sm" />
      </div>
      <div class="stage-preview__meta">
        <span class="stage-preview__label">Étape {{ stage.number }}</span>
        <span class="stage-preview__type">{{ stage.name }}</span>
      </div>
      <span v-if="length" class="stage-preview__length">{{ length }} cases</span>
    </div>

    <div class="stage-preview__terrain terrain-bar">
      <div
        v-for="segment in terrainSegments"
        :key="segment.terrain"
        class="terrain-bar__segment"
        :class="`terrain-bar__segment--${segment.terrain}`"
        :style="{ width: segment.percent + '%' }"
        :title="`${segment.label}: ${segment.percent}%`"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import { TerrainConfig, TerrainType } from '../core/terrain.js';

const props = defineProps({
  stage: {
    type: Object,
    required: true
  },
  length: {
    type: Number,
    default: null
  }
});

const terrainOrder = [
  TerrainType.FLAT,
  TerrainType.HILL,
  TerrainType.MOUNTAIN,
  TerrainType.DESCENT,
  TerrainType.SPRINT
];

const terrainSegments = computed(() => {
  const distribution = props.stage?.distribution || {};
  return terrainOrder
    .map(terrain => ({
      terrain,
      percent: distribution[terrain] || 0,
      label: TerrainConfig[terrain]?.name || terrain
    }))
    .filter(segment => segment.percent > 0);
});
</script>

<style scoped>
.stage-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}

.stage-preview__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.stage-preview__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: var(--color-paper);
  border-radius: var(--radius-sm);
  color: var(--color-ink-soft);
  flex-shrink: 0;
}

.stage-preview__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stage-preview__label {
  font-family: var(--font-ui);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--color-ink-muted);
}

.stage-preview__type {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.stage-preview__length {
  margin-left: auto;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-ink-muted);
}
</style>
