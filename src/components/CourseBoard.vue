<template>
  <div class="board-container">
    <div class="course">
      <!-- Start case (0) -->
      <div 
        class="cell start"
        :class="{ 'has-selected': hasSelectedAt(0) }"
        title="Départ (case 0)"
      >
        <span class="cell-number">🏁 0</span>
        <div class="riders-on-cell">
          <RiderToken 
            v-for="rider in getRidersAt(0)" 
            :key="rider.id"
            :rider="rider"
            :isSelected="rider.id === selectedRiderId"
            :isAnimating="animatingRiders.includes(rider.id)"
            :isLeader="isLeader(rider, 0)"
          />
        </div>
        <span v-if="countAt(0) > 1" class="cell-count">{{ countAt(0) }}/4</span>
      </div>
      
      <!-- Course cells -->
      <div 
        v-for="(cell, index) in course" 
        :key="index"
        class="cell"
        :class="[
          cell.terrain, 
          { 
            'finish': index === finishLine - 1,
            'has-selected': hasSelectedAt(index + 1),
            'cell-full': countAt(index + 1) >= 4
          }
        ]"
        :title="getCellTooltip(cell, index + 1)"
      >
        <span class="cell-number">{{ index + 1 }}</span>
        <div class="riders-on-cell" :style="{ flexDirection: 'row-reverse' }">
          <RiderToken 
            v-for="rider in getRidersAt(index + 1)" 
            :key="rider.id"
            :rider="rider"
            :isSelected="rider.id === selectedRiderId"
            :isAnimating="animatingRiders.includes(rider.id)"
            :isLeader="isLeader(rider, index + 1)"
          />
        </div>
        <span v-if="countAt(index + 1) > 1" class="cell-count">{{ countAt(index + 1) }}/4</span>
      </div>
      
      <!-- Finish zone -->
      <div class="finish-zone">
        <span class="finish-flag">🏁</span>
        <div class="finished-riders">
          <RiderToken 
            v-for="rider in finishedRiders" 
            :key="rider.id"
            :rider="rider"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import RiderToken from './RiderToken.vue';
import { TerrainConfig, FINISH_LINE } from '../config/game.config.js';

const props = defineProps({
  course: { type: Array, required: true },
  riders: { type: Array, required: true },
  selectedRiderId: { type: String, default: null },
  animatingRiders: { type: Array, default: () => [] },
  getLeaderAtPosition: { type: Function, required: true }
});

const finishLine = FINISH_LINE;

const finishedRiders = computed(() => props.riders.filter(r => r.position > FINISH_LINE));

function getRidersAt(position) {
  return props.riders
    .filter(r => r.position === position)
    .sort((a, b) => (a.arrivalOrder || 0) - (b.arrivalOrder || 0));
}

function countAt(position) {
  return props.riders.filter(r => r.position === position).length;
}

function hasSelectedAt(position) {
  return props.riders.some(r => r.position === position && r.id === props.selectedRiderId);
}

function isLeader(rider, position) {
  const leader = props.getLeaderAtPosition(position);
  return leader?.id === rider.id;
}

function getCellTooltip(cell, position) {
  const terrain = TerrainConfig[cell.terrain];
  const count = countAt(position);
  const riders = getRidersAt(position);
  
  let tip = `Case ${position}: ${terrain?.name || cell.terrain} (${count}/4)`;
  if (riders.length > 0) {
    tip += '\n' + riders.map((r, i) => `${i === 0 ? '→ ' : '  '}${r.name}`).join('\n');
  }
  return tip;
}
</script>

<style scoped>
.board-container {
  overflow-x: auto;
  padding: 10px 0;
  margin-bottom: 20px;
}

.course {
  display: flex;
  gap: 2px;
  min-width: max-content;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 8px;
}

.cell {
  width: 50px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s;
}

/* Terrain colors */
.cell.flat { background: #dcfce7; }
.cell.hill { background: #fef3c7; }
.cell.mountain { background: #fde2e2; }
.cell.descent { background: #dbeafe; }
.cell.sprint { background: #f3e8ff; }
.cell.start { background: #e0e7ff; border: 2px dashed #6366f1; }
.cell.finish { border: 2px solid #10b981; }
.cell.has-selected { box-shadow: 0 0 0 2px #f59e0b; }
.cell.cell-full { box-shadow: inset 0 0 0 2px #ef4444; }

.cell-number {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
}

.riders-on-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  flex: 1;
  align-items: center;
}

.cell-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 9px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
}

.finish-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: linear-gradient(90deg, #dcfce7, #bbf7d0);
  border-radius: 8px;
  min-width: 60px;
}

.finish-flag { font-size: 24px; }

.finished-riders {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

@media (max-width: 900px) {
  .cell { width: 35px; min-height: 55px; }
}
</style>
