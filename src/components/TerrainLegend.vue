<template>
  <div class="terrain-legend">
    <span class="legend-title">Terrains :</span>
    <span class="terrain-item flat">🟩 Plaine 31%</span>
    <span class="terrain-item hill">🟨 Côte 19%</span>
    <span class="terrain-item mountain">🟫 Montagne 25%</span>
    <span class="terrain-item descent">🟦 Descente 15%</span>
    <span class="terrain-item sprint">🟪 Sprint 10%</span>
    <span class="terrain-item refuel">🍌 Ravitaillement</span>
    <span class="legend-info">| Max 4 coureurs/case | Leader = droite</span>
  </div>
</template>

<style scoped>
.terrain-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.85em;
}
.legend-title { font-weight: 600; color: #475569; }
.terrain-item { padding: 3px 8px; border-radius: 4px; }
.terrain-item.flat { background: #dcfce7; }
.terrain-item.hill { background: #fef3c7; }
.terrain-item.mountain { background: #d4a574; color: white; }
.terrain-item.descent { background: #dbeafe; }
.terrain-item.sprint { background: #f3e8ff; }
.terrain-item.refuel { background: #fef3c7; border: 2px dashed #f59e0b; }
.legend-info { color: #94a3b8; font-size: 0.9em; margin-left: auto; }

@media (max-width: 900px) {
  .terrain-legend { justify-content: center; }
  .legend-info { display: none; }
}
</style>
