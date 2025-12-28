<template>
  <div class="track-container">
    <!-- Track -->
    <div class="track">
      <!-- Start cell (0) -->
      <div 
        class="track-cell track-cell--start"
        :class="{ 'track-cell--selected': hasSelectedAt(0) }"
        title="Départ (case 0)"
      >
        <span class="track-cell-number">0</span>
        <div class="track-cell-riders track-cell-riders--start">
          <div 
            v-for="rider in getRidersAt(0)" 
            :key="rider.id"
            class="track-rider-wrapper"
            :class="{ 'track-rider-wrapper--aspiration': getAspirationInfo(rider.id) }"
          >
            <div v-if="getAspirationInfo(rider.id)" class="track-aspiration-badge">
              Aspiration
            </div>
            <RiderToken 
              :rider="rider"
              :isSelected="rider.id === selectedRiderId"
              :isAnimating="animatingRiders.includes(rider.id)"
              :isLeader="isLeader(rider, 0)"
              :hasPlayed="hasPlayed(rider.id)"
              compact
            />
          </div>
        </div>
        <span v-if="countAt(0) > 1" class="track-cell-count">{{ countAt(0) }}/4</span>
      </div>
      
      <!-- Course cells -->
      <div 
        v-for="(cell, index) in course" 
        :key="index"
        class="track-cell"
        :class="getCellClasses(cell, index)"
        :title="getCellTooltip(cell, index + 1)"
      >
        <span class="track-cell-number">{{ index + 1 }}</span>
        
        <!-- Preview badges -->
        <div 
          v-if="isPreviewWithout(index + 1) && !isPreviewWith(index + 1)" 
          class="track-preview-badge track-preview-badge--without"
        >
          <template v-if="previewPositions?.summitStopWithout">
            <UIIcon type="summit" :size="10" />
          </template>
          Sans spé
        </div>
        <div 
          v-if="isPreviewWith(index + 1) && !isPreviewWithout(index + 1)" 
          class="track-preview-badge track-preview-badge--with"
        >
          <template v-if="previewPositions?.summitStopWith">
            <UIIcon type="summit" :size="10" />
          </template>
          Avec spé
        </div>
        <div 
          v-if="isPreviewBoth(index + 1)" 
          class="track-preview-badge track-preview-badge--both"
        >
          Cible
        </div>
        
        <!-- Riders -->
        <div class="track-cell-riders">
          <div 
            v-for="rider in getRidersAt(index + 1)" 
            :key="rider.id"
            class="track-rider-wrapper"
            :class="{ 'track-rider-wrapper--aspiration': getAspirationInfo(rider.id) }"
          >
            <div v-if="getAspirationInfo(rider.id)" class="track-aspiration-badge">
              Aspiration
            </div>
            <RiderToken 
              :rider="rider"
              :isSelected="rider.id === selectedRiderId"
              :isAnimating="animatingRiders.includes(rider.id)"
              :isLeader="isLeader(rider, index + 1)"
              :hasPlayed="hasPlayed(rider.id)"
            />
          </div>
        </div>
        
        <span v-if="countAt(index + 1) > 1" class="track-cell-count">{{ countAt(index + 1) }}/4</span>
      </div>
      
      <!-- Finish zone -->
      <div 
        class="track-finish-zone"
        :class="{ 'track-finish-zone--preview': isPreviewWithoutFinish || isPreviewWithFinish }"
      >
        <UIIcon type="finish" :size="28" class="track-finish-icon" />
        <span class="track-finish-label">Arrivée</span>
        <div 
          v-if="isPreviewWithoutFinish || isPreviewWithFinish" 
          class="track-preview-badge track-preview-badge--finish"
        >
          <UIIcon type="trophy" :size="12" /> Arrivée!
        </div>
        <div class="track-finished-riders">
          <RiderToken 
            v-for="rider in finishedRiders" 
            :key="rider.id"
            :rider="rider"
            :hasPlayed="hasPlayed(rider.id)"
            compact
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import RiderToken from './RiderToken.vue';
import { UIIcon } from './icons';
import { TerrainConfig, FINISH_LINE } from '../config/game.config.js';

const props = defineProps({
  course: { type: Array, required: true },
  riders: { type: Array, required: true },
  selectedRiderId: { type: String, default: null },
  animatingRiders: { type: Array, default: () => [] },
  aspirationAnimations: { type: Array, default: () => [] },
  getLeaderAtPosition: { type: Function, required: true },
  previewPositions: { type: Object, default: null },
  aiMoveFlash: { type: Object, default: null },
  playedRiders: { type: Array, default: () => [] }
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

// Generate cell classes based on terrain and state
function getCellClasses(cell, index) {
  const position = index + 1;
  const classes = [];
  
  // Terrain class
  const terrainMap = {
    flat: 'track-cell--flat',
    hill: 'track-cell--hill',
    mountain: 'track-cell--mountain',
    descent: 'track-cell--descent',
    sprint: 'track-cell--sprint'
  };
  if (terrainMap[cell.terrain]) {
    classes.push(terrainMap[cell.terrain]);
  }
  
  // Special cells
  if (index === finishLine - 1) {
    classes.push('track-cell--finish');
  }
  if (cell.isRefuelZone) {
    classes.push('track-cell--refuel');
  }
  
  // States
  if (hasSelectedAt(position)) {
    classes.push('track-cell--selected');
  }
  if (countAt(position) >= 4) {
    classes.push('track-cell--full');
  }
  if (hasAIMoveFlash(position)) {
    classes.push('track-cell--ai-flash');
  }
  
  // Preview states
  const previewWithout = isPreviewWithout(position);
  const previewWith = isPreviewWith(position);
  
  if (previewWithout && previewWith) {
    classes.push('track-cell--preview-both');
  } else if (previewWithout) {
    classes.push('track-cell--preview-without');
  } else if (previewWith) {
    classes.push('track-cell--preview-with');
  }
  
  return classes;
}

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

// AI move flash check
function hasAIMoveFlash(position) {
  return props.aiMoveFlash?.position === position;
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

function hasPlayed(riderId) {
  return props.playedRiders.includes(riderId);
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
  if (cell.isRefuelZone) {
    tip += ' RAVITAILLEMENT (+15⚡)';
  }
  if (riders.length > 0) {
    tip += '\n' + riders.map((r, i) => `${i === 0 ? '→ ' : '  '}${r.name}`).join('\n');
  }
  return tip;
}

// Get aspiration animation info for a rider
function getAspirationInfo(riderId) {
  return props.aspirationAnimations.find(a => a.riderId === riderId);
}
</script>

<style scoped>
/* Local overrides only - main styles in track.css */

/* Fixed height for cells: can fit 2x2 tokens */
.track-cell {
  height: 100px;
}

/* Riders container: 2x2 grid for max 4 tokens */
.track-cell-riders {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
  justify-items: center;
  align-items: center;
  flex: 1;
  padding: 2px;
}

/* Start cell: can stack more, compact tokens */
.track-cell-riders--start {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(auto-fill, minmax(28px, 1fr));
}

/* Finish icon */
.track-finish-icon {
  color: var(--state-success);
}
</style>
