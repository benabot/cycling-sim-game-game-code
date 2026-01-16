<template>
  <section class="board-minimap">
    <div class="board-minimap__meta">
      <span class="board-minimap__label">Profil de l’étape</span>
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

  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  course: { type: Array, default: () => [] },
  leaderPosition: { type: Number, default: null },
  activePosition: { type: Number, default: null }
});

const miniCells = computed(() => {
  const cells = [{ terrain: 'start', position: 0 }];
  (props.course || []).forEach((cell, index) => {
    cells.push({
      terrain: cell.terrain,
      position: index + 1,
      isCobbles: !!cell.isCobbles
    });
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
  const classes = [`mini-map-cell--${cell.terrain}`];
  if (cell.isCobbles) classes.push('mini-map-cell--cobbles');
  return classes.join(' ');
}
</script>

<style scoped>
.board-minimap {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-card);
  background: rgba(248, 247, 244, 0.92);
  border: 1px solid var(--color-line);
  box-shadow: 0 10px 24px rgba(31, 35, 40, 0.12);
  backdrop-filter: blur(8px);
}

.board-minimap--slate {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 10px var(--space-md);
  gap: var(--space-sm);
  background: linear-gradient(135deg, #2e3540 0%, #232a33 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 22px rgba(16, 18, 22, 0.28);
  backdrop-filter: none;
}

.board-minimap--slate .board-minimap__meta {
  gap: 1px;
  min-width: 120px;
}

.board-minimap--slate .board-minimap__label {
  font-size: 9px;
  letter-spacing: 0.5px;
  color: rgba(232, 238, 246, 0.7);
}

.board-minimap--slate .board-minimap__value {
  font-size: 12px;
  color: #f8fafc;
}

.board-minimap--slate .mini-map-rail {
  gap: 1px;
  min-height: 18px;
  padding: 1px 0;
}

.board-minimap--slate .mini-map-cell {
  width: 7px;
  height: 16px;
  border-radius: 3px;
  border-color: rgba(255, 255, 255, 0.16);
}

.board-minimap--slate .mini-map-marker {
  top: -3px;
  width: 6px;
  height: 6px;
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

.mini-map-cell--cobbles::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 3px;
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='4' height='4' fill='%231F2328' fill-opacity='0.22'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%231F2328' fill-opacity='0.22'/%3E%3C/svg%3E");
  background-size: 6px 6px;
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}

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
  z-index: 1;
}

.mini-map-marker--leader {
  background: #2f2418;
}

.mini-map-marker--active {
  background: var(--race-yellow);
}

@media (max-width: 1100px) {
  .board-minimap--slate {
    max-width: 90vw;
  }
}

@media (max-width: 700px) {
  .board-minimap {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .board-minimap--slate {
    max-width: 100%;
    padding: 10px var(--space-sm);
  }

  .board-minimap__meta {
    flex-direction: row;
    justify-content: space-between;
  }

  .board-minimap__track {
    overflow-x: auto;
  }

}
</style>
