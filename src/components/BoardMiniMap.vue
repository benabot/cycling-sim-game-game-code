<template>
  <section class="board-minimap">
    <div class="board-minimap__meta">
      <span class="board-minimap__label">Parcours</span>
      <span class="board-minimap__value">Case {{ displayPosition }}</span>
    </div>

    <div class="board-minimap__track" role="img" aria-label="Mini parcours">
      <div class="mini-map-rail">
        <div
          v-for="cell in miniCells"
          :key="cell.position"
          class="mini-map-cell"
          :class="getCellClass(cell)"
        >
          <span
            v-if="cell.position === leaderMarker && leaderMarker !== activeMarker"
            class="mini-map-marker mini-map-marker--leader"
            aria-hidden="true"
          ></span>
          <span
            v-if="cell.position === activeMarker"
            class="mini-map-marker mini-map-marker--active"
            aria-hidden="true"
          ></span>
        </div>
      </div>
    </div>

    <button type="button" class="board-minimap__action" @click="$emit('focusCourse')">
      Voir le parcours
    </button>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  course: { type: Array, default: () => [] },
  leaderPosition: { type: Number, default: null },
  activePosition: { type: Number, default: null }
});

defineEmits(['focusCourse']);

const miniCells = computed(() => {
  const cells = [{ terrain: 'start', position: 0 }];
  (props.course || []).forEach((cell, index) => {
    cells.push({ terrain: cell.terrain, position: index + 1 });
  });
  return cells;
});

const displayPosition = computed(() => {
  if (props.activePosition === null || props.activePosition === undefined) {
    return Math.max(0, props.leaderPosition ?? 0);
  }
  return Math.max(0, props.activePosition);
});

const maxPosition = computed(() => (props.course || []).length);

const leaderMarker = computed(() => {
  if (!Number.isFinite(props.leaderPosition)) return null;
  return Math.min(maxPosition.value, Math.max(0, props.leaderPosition));
});

const activeMarker = computed(() => {
  if (!Number.isFinite(props.activePosition)) return null;
  return Math.min(maxPosition.value, Math.max(0, props.activePosition));
});

function getCellClass(cell) {
  if (!cell?.terrain || cell.terrain === 'start') return 'mini-map-cell--start';
  return `mini-map-cell--${cell.terrain}`;
}
</script>

<style scoped>
.board-minimap {
  position: sticky;
  top: var(--space-md);
  z-index: var(--z-sticky, 20);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-card);
  background: rgba(248, 247, 244, 0.92);
  border: 1px solid var(--color-line);
  box-shadow: 0 10px 24px rgba(31, 35, 40, 0.12);
  backdrop-filter: blur(8px);
}

.board-minimap__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 110px;
}

.board-minimap__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-ink-muted);
  font-weight: 600;
}

.board-minimap__value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink);
}

.board-minimap__track {
  overflow-x: auto;
}

.mini-map-rail {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 28px;
  padding: 2px 0;
}

.mini-map-cell {
  position: relative;
  width: 8px;
  height: 22px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid rgba(31, 35, 40, 0.08);
}

.mini-map-cell--start {
  background: var(--color-paper);
}

.mini-map-cell--flat { background: var(--terrain-flat); }
.mini-map-cell--hill { background: var(--terrain-hill); }
.mini-map-cell--mountain { background: var(--terrain-mountain); }
.mini-map-cell--descent { background: var(--terrain-descent); }
.mini-map-cell--sprint { background: var(--terrain-sprint); }

.mini-map-marker {
  position: absolute;
  top: -4px;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateX(-50%);
  border: 1px solid rgba(31, 35, 40, 0.25);
  box-shadow: 0 2px 6px rgba(31, 35, 40, 0.16);
}

.mini-map-marker--leader {
  background: #2f2418;
}

.mini-map-marker--active {
  background: var(--race-yellow);
}

.board-minimap__action {
  border: 1px solid rgba(31, 35, 40, 0.18);
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-ink);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.board-minimap__action:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(31, 35, 40, 0.32);
}

@media (max-width: 700px) {
  .board-minimap {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .board-minimap__meta {
    flex-direction: row;
    justify-content: space-between;
  }

  .board-minimap__track {
    overflow-x: auto;
  }

  .board-minimap__action {
    justify-self: start;
  }
}
</style>
