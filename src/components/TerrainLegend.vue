<template>
  <div class="terrain-legend">
    <span class="legend-title">Terrains</span>
    
    <div class="legend-items">
      <span class="terrain-badge terrain-badge--flat">
        <TerrainIcon type="flat" :size="14" />
        <span>Plaine</span>
        <span class="terrain-pct">{{ terrainStats.flat }}%</span>
      </span>
      
      <span class="terrain-badge terrain-badge--hill">
        <TerrainIcon type="hill" :size="14" />
        <span>Côte</span>
        <span class="terrain-pct">{{ terrainStats.hill }}%</span>
      </span>
      
      <span class="terrain-badge terrain-badge--mountain">
        <TerrainIcon type="mountain" :size="14" />
        <span>Montagne</span>
        <span class="terrain-pct">{{ terrainStats.mountain }}%</span>
      </span>
      
      <span class="terrain-badge terrain-badge--descent">
        <TerrainIcon type="descent" :size="14" />
        <span>Descente</span>
        <span class="terrain-pct">{{ terrainStats.descent }}%</span>
      </span>
      
      <span class="terrain-badge terrain-badge--sprint">
        <TerrainIcon type="sprint" :size="14" />
        <span>Sprint</span>
        <span class="terrain-pct">{{ terrainStats.sprint }}%</span>
      </span>
      
      <span class="terrain-badge terrain-badge--refuel">
        <TerrainIcon type="refuel" :size="14" />
        <span>Ravitaillement</span>
      </span>
    </div>
    
    <span class="legend-info">Max 4 coureurs/case · Leader = droite</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { TerrainIcon } from './icons';

const props = defineProps({
  course: { type: Array, default: () => [] }
});

// Calculate terrain percentages from course data
const terrainStats = computed(() => {
  if (!props.course || props.course.length === 0) {
    // Default percentages for typical course
    return {
      flat: 31,
      hill: 19,
      mountain: 25,
      descent: 15,
      sprint: 10
    };
  }
  
  const counts = {
    flat: 0,
    hill: 0,
    mountain: 0,
    descent: 0,
    sprint: 0
  };
  
  props.course.forEach(cell => {
    if (counts.hasOwnProperty(cell.terrain)) {
      counts[cell.terrain]++;
    }
  });
  
  const total = props.course.length;
  return {
    flat: Math.round((counts.flat / total) * 100),
    hill: Math.round((counts.hill / total) * 100),
    mountain: Math.round((counts.mountain / total) * 100),
    descent: Math.round((counts.descent / total) * 100),
    sprint: Math.round((counts.sprint / total) * 100)
  };
});
</script>

<style scoped>
.terrain-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.legend-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--color-ink);
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

.terrain-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-ink);
  border: 1px solid transparent;
}

.terrain-badge--flat {
  background: var(--terrain-flat);
}

.terrain-badge--hill {
  background: var(--terrain-hill);
}

.terrain-badge--mountain {
  background: var(--terrain-mountain);
}

.terrain-badge--descent {
  background: var(--terrain-descent);
}

.terrain-badge--sprint {
  background: var(--terrain-sprint);
}

.terrain-badge--refuel {
  background: var(--terrain-hill);
  border: 2px dashed var(--state-warning);
}

.terrain-pct {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-ink-muted);
  font-weight: 400;
}

.legend-info {
  color: var(--color-muted);
  font-size: 12px;
  margin-left: auto;
}

@media (max-width: 900px) {
  .terrain-legend {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .legend-info {
    margin-left: 0;
    margin-top: var(--space-xs);
  }
}
</style>
