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
        <span class="notebook-expand-hint">{{ isExpanded ? 'Fermer' : 'Ouvrir' }}</span>
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
          title="Suivre le bas"
        >
          <UIIcon type="chevron-down" size="xs" />
          <span>Suivi</span>
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
            :class="getEntryClass(entry, i)"
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
function normalizeLogText(text) {
  let cleaned = text
    .replace(/🏁|🏆|💨|🛡️|🌀|⚔️|🍌|🤕|⚠️|🎲|▶️|➡️/g, '')
    .replace(/\[FINISH\]|\[WINNER\]|\[WIND\]|\[SHELTER\]|\[ASPIRATION\]|\[ATTACK\]|\[REFUEL\]|\[CRASH\]/g, '')
    .replace(/[=═-]{3,}/g, '')
    .replace(/!+/g, '')
    .trim();

  cleaned = cleaned
    .replace(/lance le dé\s*:\s*(\d+)/i, 'dé $1')
    .replace(/utilise sa carte spécialité \(\+2\)/i, 'spécialité (+2)')
    .replace(/avance de (\d+) cases → case (\d+)(?: \(case pleine\))?/i, 'déplacement $1 → case $2')
    .replace(/rejoint le groupe \((\d+) → (\d+)\)/i, 'aspiration $1 → $2')
    .replace(/fait le relais/i, 'vent')
    .replace(/tempo/i, 'cartes fin de tour');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/Tour\s+\d+/i, '').trim();
  return cleaned;
}

function getCleanText(entry) {
  return normalizeLogText(getEntryText(entry));
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
  if (text.includes('vent') || text.includes('relais') || text.includes('[WIND]')) return 'wind';
  if (text.includes('abri') || text.includes('tempo') || text.includes('[SHELTER]')) return 'shelter';
  if (text.includes('aspiration') || text.includes('[ASPIRATION]')) return 'aspiration';
  if (text.includes('attaque') || text.includes('[ATTACK]')) return 'attack';
  if (text.includes('ravitaillement') || text.includes('[REFUEL]')) return 'refuel';
  if (text.includes('chute') || text.includes('[CRASH]')) return 'crash';
  if (text.includes('bloqué') || text.includes('case pleine')) return 'warning';
  if (text.includes('sommet')) return 'summit';
  
  return null;
}

function getEntryClass(entry, index) {
  const text = getEntryText(entry);
  const isSeparator = text.includes('---');
  const isHeader = /Départ/i.test(text);
  const isSub = /^\s+/.test(text);
  return {
    'notebook-entry--separator': isSeparator,
    'notebook-entry--header': isHeader,
    'notebook-entry--sub': isSub,
    'notebook-entry--latest': !isSeparator && index === props.log.length - 1
  };
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
  if (text.includes('abri') || text.includes('tempo') || text.includes('aspiration')) return 'icon--info';
  if (text.includes('attaque') || text.includes('vent') || text.includes('relais')) return 'icon--warning';
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
  background: #2F3134;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(18, 19, 20, 0.35);
  display: flex;
  flex-direction: column;
  position: relative;
}

.race-notebook::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIyIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjYiLz48L3N2Zz4=");
  opacity: 0.05;
  pointer-events: none;
}

.race-notebook > * {
  position: relative;
  z-index: 1;
}

/* ---- Header (clickable to toggle) ---- */
.notebook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: rgba(0, 0, 0, 0.25);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.notebook-header:hover {
  background: rgba(0, 0, 0, 0.35);
}

.notebook-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.notebook-icon {
  color: rgba(230, 231, 232, 0.75);
}

.notebook-title {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: rgba(230, 231, 232, 0.85);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.notebook-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(181, 184, 188, 0.85);
  background: rgba(255, 255, 255, 0.08);
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
  color: rgba(181, 184, 188, 0.85);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 10px;
}

.notebook-expand-hint {
  font-family: var(--font-ui);
  font-size: 11px;
  color: rgba(181, 184, 188, 0.8);
}

.notebook-chevron {
  color: rgba(230, 231, 232, 0.7);
  transition: transform 0.2s;
}

.race-notebook--expanded .notebook-chevron {
  transform: rotate(180deg);
}

/* ---- Collapsed preview ---- */
.notebook-preview {
  padding: var(--space-xs) var(--space-md);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.notebook-preview-text {
  font-family: var(--font-ui);
  font-size: 11px;
  color: rgba(181, 184, 188, 0.85);
  font-style: italic;
}

/* ---- Body (drawer content) ---- */
.notebook-body {
  position: relative;
  display: flex;
  max-height: 300px;  /* Reduced from 400px */
  overflow-y: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 10px;
  color: rgba(181, 184, 188, 0.85);
  transition: all 0.15s;
}

.notebook-toggle-autoscroll:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(230, 231, 232, 0.9);
}

.notebook-toggle-autoscroll.active {
  color: rgba(140, 200, 160, 0.95);
}

/* Left margin line (notebook effect) */
.notebook-margin {
  width: 16px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
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
  color: rgba(230, 231, 232, 0.85);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.08);
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
  color: rgba(230, 231, 232, 0.9);
  transition: background 0.1s;
}

.notebook-entry:hover {
  background: rgba(255, 255, 255, 0.05);
}

.notebook-entry--separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: var(--space-xs) 0;
  padding: 0;
}

.notebook-entry--header {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(230, 231, 232, 0.95);
}

.notebook-entry--sub {
  padding-left: 18px;
  color: rgba(181, 184, 188, 0.9);
  font-size: 11px;
}

.notebook-entry--latest {
  animation: logPulse 1s ease-out;
}

@keyframes logPulse {
  0% { background: rgba(255, 255, 255, 0.10); }
  100% { background: transparent; }
}

/* Event marker dot */
.notebook-entry-marker {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(230, 231, 232, 0.4);
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
  opacity: 0.75;
  color: rgba(230, 231, 232, 0.85);
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
  background: rgba(255, 255, 255, 0.18);
  border-radius: 3px;
}

.notebook-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}
</style>
