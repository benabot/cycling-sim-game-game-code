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
          <div 
            v-for="rider in getRidersAt(0)" 
            :key="rider.id"
            class="rider-wrapper"
            :class="{ 'aspiration-active': getAspirationInfo(rider.id) }"
          >
            <div v-if="getAspirationInfo(rider.id)" class="aspiration-label">
              🌀 Aspiration
            </div>
            <RiderToken 
              :rider="rider"
              :isSelected="rider.id === selectedRiderId"
              :isAnimating="animatingRiders.includes(rider.id)"
              :isLeader="isLeader(rider, 0)"
            />
          </div>
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
            'cell-full': countAt(index + 1) >= 4,
            'preview-without': isPreviewWithout(index + 1),
            'preview-with': isPreviewWith(index + 1),
            'preview-both': isPreviewBoth(index + 1)
          }
        ]"
        :title="getCellTooltip(cell, index + 1)"
      >
        <span class="cell-number">{{ index + 1 }}</span>
        <!-- Preview indicator -->
        <div v-if="isPreviewWithout(index + 1) && !isPreviewWith(index + 1)" class="preview-indicator without">
          {{ previewPositions?.summitStopWithout ? '⛰️' : '' }} Sans spé
        </div>
        <div v-if="isPreviewWith(index + 1) && !isPreviewWithout(index + 1)" class="preview-indicator with">
          {{ previewPositions?.summitStopWith ? '⛰️' : '' }} Avec spé
        </div>
        <div v-if="isPreviewBoth(index + 1)" class="preview-indicator both">
          🎯 Cible
        </div>
        <div class="riders-on-cell" :style="{ flexDirection: 'row-reverse' }">
          <div 
            v-for="rider in getRidersAt(index + 1)" 
            :key="rider.id"
            class="rider-wrapper"
            :class="{ 'aspiration-active': getAspirationInfo(rider.id) }"
          >
            <div v-if="getAspirationInfo(rider.id)" class="aspiration-label">
              🌀 Aspiration
            </div>
            <RiderToken 
              :rider="rider"
              :isSelected="rider.id === selectedRiderId"
              :isAnimating="animatingRiders.includes(rider.id)"
              :isLeader="isLeader(rider, index + 1)"
            />
          </div>
        </div>
        <span v-if="countAt(index + 1) > 1" class="cell-count">{{ countAt(index + 1) }}/4</span>
      </div>
      
      <!-- Finish zone -->
      <div 
        class="finish-zone"
        :class="{
          'preview-without': isPreviewWithoutFinish,
          'preview-with': isPreviewWithFinish
        }"
      >
        <span class="finish-flag">🏁</span>
        <div v-if="isPreviewWithoutFinish || isPreviewWithFinish" class="preview-indicator finish">
          🏆 Arrivée!
        </div>
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
  aspirationAnimations: { type: Array, default: () => [] },
  getLeaderAtPosition: { type: Function, required: true },
  previewPositions: { type: Object, default: null }
});

const finishLine = FINISH_LINE;

const finishedRiders = computed(() => props.riders.filter(r => r.position > FINISH_LINE));

// Preview position checks
const isPreviewWithoutFinish = computed(() => 
  props.previewPositions?.crossingFinishWithout && !props.previewPositions?.crossingFinishWith
);
const isPreviewWithFinish = computed(() => 
  props.previewPositions?.crossingFinishWith
);

function isPreviewWithout(position) {
  if (!props.previewPositions) return false;
  return props.previewPositions.positionWithout === position && !props.previewPositions.crossingFinishWithout;
}

function isPreviewWith(position) {
  if (!props.previewPositions) return false;
  if (!props.previewPositions.canUseSpecialty) return false;
  return props.previewPositions.positionWith === position && !props.previewPositions.crossingFinishWith;
}

function isPreviewBoth(position) {
  return isPreviewWithout(position) && isPreviewWith(position);
}

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

// v3.2.2: Get aspiration animation info for a rider
function getAspirationInfo(riderId) {
  return props.aspirationAnimations.find(a => a.riderId === riderId);
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
.cell.mountain { background: #d4a574; }
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

/* v3.2.2: Aspiration animation wrapper */
.rider-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rider-wrapper.aspiration-active {
  z-index: 100;
}

.aspiration-label {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  font-size: 9px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  animation: aspiration-label-pulse 0.8s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
  z-index: 101;
}

@keyframes aspiration-label-pulse {
  0%, 100% { 
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
  50% { 
    transform: translateX(-50%) scale(1.1);
    opacity: 0.9;
  }
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

/* Preview highlighting (v3.2) */
.cell.preview-without:not(.preview-with) {
  animation: preview-pulse-orange 1s ease-in-out infinite;
  box-shadow: 0 0 0 3px #f97316, 0 0 15px rgba(249, 115, 22, 0.5);
}

.cell.preview-with:not(.preview-without) {
  animation: preview-pulse-green 1s ease-in-out infinite;
  box-shadow: 0 0 0 3px #22c55e, 0 0 15px rgba(34, 197, 94, 0.5);
}

.cell.preview-both {
  animation: preview-pulse-blue 1s ease-in-out infinite;
  box-shadow: 0 0 0 3px #3b82f6, 0 0 15px rgba(59, 130, 246, 0.5);
}

.finish-zone.preview-without,
.finish-zone.preview-with {
  animation: preview-pulse-gold 1s ease-in-out infinite;
  box-shadow: 0 0 0 4px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.6);
}

.preview-indicator {
  font-size: 8px;
  font-weight: bold;
  padding: 1px 3px;
  border-radius: 3px;
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  z-index: 10;
}

.preview-indicator.without {
  background: #f97316;
  color: white;
}

.preview-indicator.with {
  background: #22c55e;
  color: white;
}

.preview-indicator.both {
  background: #3b82f6;
  color: white;
}

.preview-indicator.finish {
  background: #fbbf24;
  color: #1f2937;
  font-size: 10px;
  position: relative;
  top: 0;
  margin-bottom: 4px;
}

@keyframes preview-pulse-orange {
  0%, 100% { box-shadow: 0 0 0 3px #f97316, 0 0 15px rgba(249, 115, 22, 0.5); }
  50% { box-shadow: 0 0 0 5px #f97316, 0 0 25px rgba(249, 115, 22, 0.8); }
}

@keyframes preview-pulse-green {
  0%, 100% { box-shadow: 0 0 0 3px #22c55e, 0 0 15px rgba(34, 197, 94, 0.5); }
  50% { box-shadow: 0 0 0 5px #22c55e, 0 0 25px rgba(34, 197, 94, 0.8); }
}

@keyframes preview-pulse-blue {
  0%, 100% { box-shadow: 0 0 0 3px #3b82f6, 0 0 15px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 0 5px #3b82f6, 0 0 25px rgba(59, 130, 246, 0.8); }
}

@keyframes preview-pulse-gold {
  0%, 100% { box-shadow: 0 0 0 4px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.6); }
  50% { box-shadow: 0 0 0 6px #fbbf24, 0 0 30px rgba(251, 191, 36, 0.9); }
}

@media (max-width: 900px) {
  .cell { width: 35px; min-height: 55px; }
  .preview-indicator { font-size: 6px; }
}
</style>
