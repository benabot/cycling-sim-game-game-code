<template>
  <div class="race-notebook" :class="{ 'race-notebook--expanded': isExpanded }">
    <!-- Header -->
    <div class="notebook-header">
      <div class="notebook-header-left">
        <UIIcon type="history" size="sm" class="notebook-icon" />
        <span class="notebook-title">Historique</span>
      </div>
      <div class="notebook-header-right">
        <span v-if="currentTurn" class="notebook-turn-badge">Tour {{ currentTurn }}</span>
        <button 
          v-if="isExpanded" 
          class="notebook-toggle-autoscroll"
          :class="{ 'active': autoScroll }"
          @click.stop="autoScroll = !autoScroll"
          title="Auto-scroll"
        >
          <UIIcon type="chevron-down" size="xs" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="notebook-body" ref="logContainer">
      <!-- Left margin line (notebook effect) -->
      <div class="notebook-margin"></div>
      
      <!-- Entries -->
      <div class="notebook-entries">
        <template v-for="(entry, i) in displayedLog" :key="i">
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
      
      <!-- Fade overlay when collapsed -->
      <div v-if="!isExpanded && log.length > 5" class="notebook-fade"></div>
    </div>

    <!-- Expand/Collapse CTA -->
    <button class="notebook-cta" @click="toggleExpand">
      <span>{{ isExpanded ? 'Replier' : 'Déplier l\'historique' }}</span>
      <UIIcon :type="isExpanded ? 'chevron-up' : 'chevron-down'" size="sm" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import { UIIcon } from './icons';

const props = defineProps({
  log: { type: Array, required: true }
});

const logContainer = ref(null);
const isExpanded = ref(false);
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

// Show last 6 entries when collapsed, all when expanded
const displayedLog = computed(() => {
  if (isExpanded.value) return props.log;
  return props.log.slice(-6);
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
   RACE NOTEBOOK - "Carnet de course" style
   =========================================== */

.race-notebook {
  /* Warm slate background (not black) */
  background: #3D4147;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(31, 35, 40, 0.12);
  display: flex;
  flex-direction: column;
}

/* ---- Header ---- */
.notebook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.notebook-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.notebook-icon {
  color: rgba(235, 225, 210, 0.50);
}

.notebook-title {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  color: rgba(235, 225, 210, 0.65);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.notebook-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.notebook-turn-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(235, 225, 210, 0.45);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.notebook-toggle-autoscroll {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  padding: 3px;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(235, 225, 210, 0.35);
  display: flex;
  transition: all 0.15s;
}

.notebook-toggle-autoscroll:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(235, 225, 210, 0.55);
}

.notebook-toggle-autoscroll.active {
  color: rgba(140, 200, 160, 0.80);
}

/* ---- Body ---- */
.notebook-body {
  position: relative;
  display: flex;
  max-height: 160px;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.race-notebook--expanded .notebook-body {
  max-height: 400px;
  overflow-y: auto;
}

/* Left margin line (notebook effect) */
.notebook-margin {
  width: 18px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.015);
  border-right: 1px solid rgba(200, 180, 160, 0.12);
}

.notebook-entries {
  flex: 1;
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Fade overlay when collapsed */
.notebook-fade {
  position: absolute;
  bottom: 0;
  left: 18px;
  right: 0;
  height: 50px;
  background: linear-gradient(to bottom, transparent, #3D4147);
  pointer-events: none;
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
  color: rgba(220, 200, 160, 0.70);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.04);
  padding: 3px 12px;
  border-radius: 10px;
}

/* ---- Entry ---- */
.notebook-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 3px;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.4;
  color: rgba(235, 225, 210, 0.65);
  transition: background 0.1s;
}

.notebook-entry:hover {
  background: rgba(255, 255, 255, 0.035);
}

.notebook-entry--separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.03);
  margin: var(--space-xs) 0;
  padding: 0;
}

/* Event marker dot */
.notebook-entry-marker {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(235, 225, 210, 0.35);
  flex-shrink: 0;
}

.notebook-entry-marker.marker--success { background: rgba(130, 200, 150, 0.70); }
.notebook-entry-marker.marker--warning { background: rgba(220, 180, 120, 0.70); }
.notebook-entry-marker.marker--danger { background: rgba(200, 130, 130, 0.70); }

/* Team pip (mini badge) */
.notebook-team-pip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.notebook-team-pip--team_a { background: rgba(201, 100, 100, 0.70); }
.notebook-team-pip--team_b { background: rgba(100, 130, 201, 0.70); }
.notebook-team-pip--team_c { background: rgba(100, 170, 120, 0.70); }
.notebook-team-pip--team_d { background: rgba(200, 175, 90, 0.70); }

/* Entry icon */
.notebook-entry-icon {
  flex-shrink: 0;
  opacity: 0.55;
  color: rgba(235, 225, 210, 0.65);
}

.notebook-entry-icon.icon--success { color: rgba(130, 200, 150, 0.80); }
.notebook-entry-icon.icon--info { color: rgba(140, 180, 220, 0.75); }
.notebook-entry-icon.icon--warning { color: rgba(220, 180, 120, 0.80); }
.notebook-entry-icon.icon--danger { color: rgba(200, 130, 130, 0.80); }

/* Entry text */
.notebook-entry-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- CTA Button ---- */
.notebook-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: rgba(255, 255, 255, 0.03);
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 11px;
  color: rgba(235, 225, 210, 0.50);
  transition: all 0.15s;
}

.notebook-cta:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(235, 225, 210, 0.70);
}

/* ---- Scrollbar ---- */
.notebook-body::-webkit-scrollbar {
  width: 4px;
}

.notebook-body::-webkit-scrollbar-track {
  background: transparent;
}

.notebook-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.10);
  border-radius: 2px;
}

.notebook-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
