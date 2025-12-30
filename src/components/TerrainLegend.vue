<template>
  <div class="terrain-legend">
    <span class="legend-title">Terrains</span>
    
    <div class="legend-items">
      <span class="terrain-badge terrain-badge--flat">
        <TerrainIcon type="flat" :size="14" />
        <span>Plaine</span>
      </span>
      
      <span class="terrain-badge terrain-badge--hill">
        <TerrainIcon type="hill" :size="14" />
        <span>Côte</span>
      </span>
      
      <span class="terrain-badge terrain-badge--mountain">
        <TerrainIcon type="mountain" :size="14" />
        <span>Montagne</span>
      </span>
      
      <span class="terrain-badge terrain-badge--descent">
        <TerrainIcon type="descent" :size="14" />
        <span>Descente</span>
      </span>
      
      <span
        class="terrain-badge terrain-badge--cobbles"
        title="Secteur pavé : risque accru, favorise rouleurs."
        aria-label="Secteur pavé : risque accru, favorise rouleurs."
      >
        <span class="terrain-swatch terrain-swatch--cobbles" aria-hidden="true"></span>
        <span>Pavés</span>
      </span>

      <span class="terrain-badge terrain-badge--sprint">
        <TerrainIcon type="sprint" :size="14" />
        <span>Sprint</span>
      </span>
      
      <span class="terrain-badge terrain-badge--refuel">
        <span class="terrain-swatch terrain-swatch--refuel" aria-hidden="true"></span>
        <span>Ravitaillement</span>
      </span>
    </div>
    
    <span class="legend-info">Max 4 coureurs/case · Leader = droite</span>
  </div>
</template>

<script setup>
import { TerrainIcon } from './icons';

defineProps({});
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

.terrain-badge--cobbles {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
}

.terrain-badge--refuel {
  background: #fff;
  border: 2px dashed var(--color-warning);
}

.terrain-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  display: inline-flex;
  flex-shrink: 0;
  box-sizing: border-box;
}

.terrain-swatch--refuel {
  background: #fff;
  border: 2px dashed var(--color-warning);
}

.terrain-swatch--cobbles {
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='4' height='4' fill='%231F2328' fill-opacity='0.18'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%231F2328' fill-opacity='0.18'/%3E%3C/svg%3E");
  background-size: 8px 8px;
  border: 1px solid var(--color-line);
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
