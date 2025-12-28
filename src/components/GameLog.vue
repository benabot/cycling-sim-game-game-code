<template>
  <div class="race-notebook" :class="{ 'race-notebook--expanded': isExpanded }">
    <!-- Header (always visible, clickable to expand) -->
    <button class="notebook-header" @click="toggleExpand">
      <div class="notebook-header-left">
        <UIIcon type="history" size="sm" class="notebook-icon" />
        <span class="notebook-title">Historique</span>
        <span v-if="log.length > 0" class="notebook-count">{{ log.length }}</span>
      </div>
      <div class="notebook-header-right">
        <span v-if="currentTurn" class="notebook-turn-badge">Tour {{ currentTurn }}</span>
        <span class="notebook-expand-hint">{{ isExpanded ? 'Replier' : 'Déplier' }}</span>
        <UIIcon :type="isExpanded ? 'chevron-up' : 'chevron-down'" size="sm" class="notebook-chevron" />
      </div>
    </button>

    <!-- Body (drawer, hidden by default) -->
    <div v-if="isExpanded" class="notebook-body" ref="logContainer">
      <!-- Controls -->
      <div class="notebook-controls">
        <button 
          class="notebook-toggle-autoscroll"
          :class="{ 'active': autoScroll }"
          @click.stop="autoScroll = !autoScroll"
          title="Auto-scroll vers le bas"
        >
          <UIIcon type="chevron-down" size="xs" />
          <span>Auto</span>
        </button>
      </div>
      
      <!-- Left margin line (notebook effect) -->
      <div class="notebook-margin"></div>
      
      <!-- Entries -->
      <div class="notebook-entries">
        <template v-for="(entry, i) in log" :key="i">
          <!-- Tour separator -->
          <div v-if="isTourHeader(entry)" class="notebook-tour-cartouche">
            <span>{{ getTourLabel(entry) }}</span>
          </div>
          
          <!-- Regular entry -->
          <div 
            v-else
            class="notebook-entry"
            :class="getEntryClass(entry)"
          >
            <!-- Event marker (dot) -->
            <span v-if="isImportantEvent(entry)" class="notebook-entry-marker" :class="getMarkerClass(entry)"></span>
            
            <!-- Team badge (mini) -->
            <span v-if="entry.team" class="notebook-team-pip" :class="`notebook-team-pip--${entry.team}`"></span>
            
            <!-- Icon -->
            <UIIcon v-if="getEntryIcon(entry)" :type="getEntryIcon(entry)" size="xs" class="notebook-entry-icon" :class="getIconClass(entry)" />
            
            <!-- Text -->
            <span class="notebook-entry-text">{{ getCleanText(entry) }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Collapsed preview (when closed) -->
    <div v-else-if="log.length > 0" class="notebook-preview">
      <span class="notebook-preview-text">{{ getLastEntryPreview() }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import { UIIcon } from './icons';

const props = defineProps({
  log: { type: Array, required: true }
});

const logContainer = ref(null);
const isExpanded = ref(false);  // Drawer closed by default
const autoScroll = ref(true);

// Extract current turn from log
const currentTurn = computed(() => {
  for (let i = props.log.length - 1; i >= 0; i--) {
    const text = getEntryText(props.log[i]);
    const match = text.match(/Tour\s+(\d+)/i);
    if (match) return parseInt(match[1]);
  }
  return null;
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

watch(() => props.log.length, async () => {
  await nextTick();
  if (logContainer.value && isExpanded.value && autoScroll.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
});

function getEntryText(entry) {
  if (typeof entry === 'string') return entry;
  return entry.message || entry.text || '';
}

function getLastEntryPreview() {
  if (props.log.length === 0) return '';
  const lastEntry = props.log[props.log.length - 1];
  const text = getCleanText(lastEntry);
  return text.length > 60 ? text.substring(0, 57) + '...' : text;
}

function isTourHeader(entry) {
  const text = getEntryText(entry);
  return text.includes('===') || (text.includes('Tour') && text.includes('---'));
}

function getTourLabel(entry) {
  const text = getEntryText(entry);
  const match = text.match(/Tour\s+(\d+)/i);
  if (match) return `— TOUR ${match[1]} —`;
  return '— TOUR —';
}

// Remove emojis and markers from text
function getCleanText(entry) {
  const text = getEntryText(entry);
  return text
    .replace(/🏁|🏆|💨|🛡️|🌀|⚔️|🍌|🤕|⚠️|🎲|▶️/g, '')
    .replace(/\[FINISH\]|\[WINNER\]|\[WIND\]|\[SHELTER\]|\[ASPIRATION\]|\[ATTACK\]|\[REFUEL\]|\[CRASH\]/g, '')
    .replace(/={3,}|-{3,}/g, '')
    .replace(/Tour\s+\d+/i, '')
    .trim();
}

function isImportantEvent(entry) {
  const text = getEntryText(entry);
  return text.includes('franchit') || 
         text.includes('gagne') || 
         text.includes('attaque') ||
         text.includes('chute');
}

function getEntryIcon(entry) {
  const text = getEntryText(entry);
  
  if (text.includes('franchit') || text.includes('[FINISH]')) return 'finish';
  if (text.includes('gagne') || text.includes('[WINNER]')) return 'trophy';
  if (text.includes('vent') || text.includes('[WIND]')) return 'wind';
  if (text.includes('abri') || text.includes('[SHELTER]')) return 'shelter';
  if (text.includes('aspiration') || text.includes('[ASPIRATION]')) return 'aspiration';
  if (text.includes('attaque') || text.includes('[ATTACK]')) return 'attack';
  if (text.includes('ravitaillement') || text.includes('[REFUEL]')) return 'refuel';
  if (text.includes('chute') || text.includes('[CRASH]')) return 'crash';
  if (text.includes('bloqué') || text.includes('case pleine')) return 'warning';
  if (text.includes('sommet')) return 'summit';
  
  return null;
}

function getEntryClass(entry) {
  const text = getEntryText(entry);
  if (text.includes('---')) return 'notebook-entry--separator';
  return '';
}

function getMarkerClass(entry) {
  const text = getEntryText(entry);
  if (text.includes('gagne') || text.includes('franchit')) return 'marker--success';
  if (text.includes('attaque')) return 'marker--warning';
  if (text.includes('chute')) return 'marker--danger';
  return '';
}

function getIconClass(entry) {
  const text = getEntryText(entry);
  if (text.includes('gagne') || text.includes('franchit')) return 'icon--success';
  if (text.includes('abri') || text.includes('aspiration')) return 'icon--info';
  if (text.includes('attaque') || text.includes('vent')) return 'icon--warning';
  if (text.includes('chute') || text.includes('bloqué')) return 'icon--danger';
  return '';
}
</script>

<style scoped>
/* ===========================================
   RACE NOTEBOOK - Drawer "Carnet de course"
   Phase 14: Closed by default, lighter tones
   =========================================== */

.race-notebook {
  /* Lighter warm slate (less charcoal) */
  background: #4A4E54;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(31, 35, 40, 0.10);
  display: flex;
  flex-direction: column;
}

/* ---- Header (clickable to toggle) ---- */
.notebook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.03);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.notebook-header:hover {
  background: rgba(255, 255, 255, 0.06);
}

.notebook-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.notebook-icon {
  color: rgba(240, 232, 220, 0.55);
}

.notebook-title {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: rgba(240, 232, 220, 0.70);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.notebook-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(240, 232, 220, 0.45);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 8px;
}

.notebook-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.notebook-turn-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(240, 232, 220, 0.50);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.notebook-expand-hint {
  font-family: var(--font-ui);
  font-size: 11px;
  color: rgba(240, 232, 220, 0.45);
}

.notebook-chevron {
  color: rgba(240, 232, 220, 0.50);
  transition: transform 0.2s;
}

.race-notebook--expanded .notebook-chevron {
  transform: rotate(180deg);
}

/* ---- Collapsed preview ---- */
.notebook-preview {
  padding: var(--space-xs) var(--space-md);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.notebook-preview-text {
  font-family: var(--font-ui);
  font-size: 11px;
  color: rgba(240, 232, 220, 0.50);
  font-style: italic;
}

/* ---- Body (drawer content) ---- */
.notebook-body {
  position: relative;
  display: flex;
  max-height: 300px;  /* Reduced from 400px */
  overflow-y: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

/* Controls bar */
.notebook-controls {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-sm);
  z-index: 5;
}

.notebook-toggle-autoscroll {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 10px;
  color: rgba(240, 232, 220, 0.40);
  transition: all 0.15s;
}

.notebook-toggle-autoscroll:hover {
  background: rgba(255, 255, 255, 0.10);
  color: rgba(240, 232, 220, 0.60);
}

.notebook-toggle-autoscroll.active {
  color: rgba(140, 200, 160, 0.85);
}

/* Left margin line (notebook effect) */
.notebook-margin {
  width: 16px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.015);
  border-right: 1px solid rgba(210, 190, 170, 0.10);
}

.notebook-entries {
  flex: 1;
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ---- Tour Cartouche ---- */
.notebook-tour-cartouche {
  display: flex;
  justify-content: center;
  padding: var(--space-xs) 0;
  margin: var(--space-xs) 0;
}

.notebook-tour-cartouche span {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 600;
  color: rgba(225, 210, 180, 0.70);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 14px;
  border-radius: 10px;
}

/* ---- Entry ---- */
.notebook-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.4;
  color: rgba(240, 232, 220, 0.72);
  transition: background 0.1s;
}

.notebook-entry:hover {
  background: rgba(255, 255, 255, 0.04);
}

.notebook-entry--separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.04);
  margin: var(--space-xs) 0;
  padding: 0;
}

/* Event marker dot */
.notebook-entry-marker {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(240, 232, 220, 0.40);
  flex-shrink: 0;
}

.notebook-entry-marker.marker--success { background: rgba(140, 210, 160, 0.75); }
.notebook-entry-marker.marker--warning { background: rgba(230, 190, 130, 0.75); }
.notebook-entry-marker.marker--danger { background: rgba(210, 140, 140, 0.75); }

/* Team pip (mini badge) */
.notebook-team-pip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.notebook-team-pip--team_a { background: rgba(201, 100, 100, 0.75); }
.notebook-team-pip--team_b { background: rgba(100, 130, 201, 0.75); }
.notebook-team-pip--team_c { background: rgba(100, 175, 125, 0.75); }
.notebook-team-pip--team_d { background: rgba(210, 185, 100, 0.75); }

/* Entry icon */
.notebook-entry-icon {
  flex-shrink: 0;
  opacity: 0.60;
  color: rgba(240, 232, 220, 0.70);
}

.notebook-entry-icon.icon--success { color: rgba(140, 210, 160, 0.85); }
.notebook-entry-icon.icon--info { color: rgba(150, 190, 230, 0.80); }
.notebook-entry-icon.icon--warning { color: rgba(230, 190, 130, 0.85); }
.notebook-entry-icon.icon--danger { color: rgba(210, 140, 140, 0.85); }

/* Entry text */
.notebook-entry-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- Scrollbar ---- */
.notebook-body::-webkit-scrollbar {
  width: 5px;
}

.notebook-body::-webkit-scrollbar-track {
  background: transparent;
}

.notebook-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}

.notebook-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.20);
}
</style>
