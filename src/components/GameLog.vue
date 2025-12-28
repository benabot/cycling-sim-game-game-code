<template>
  <div class="log-panel" :class="{ 'log-panel--expanded': isExpanded }">
    <div class="log-panel-header" @click="toggleExpand">
      <UIIcon type="history" size="sm" class="log-panel-icon" />
      <span class="log-panel-title">Historique</span>
      <span class="log-panel-count">{{ log.length }}</span>
      <button class="log-panel-toggle" :aria-expanded="isExpanded">
        <UIIcon :type="isExpanded ? 'chevron-down' : 'chevron-up'" size="sm" />
      </button>
    </div>
    <div class="log-panel-content" ref="logContainer">
      <div 
        v-for="(entry, i) in displayedLog" 
        :key="i" 
        class="log-entry"
        :class="getLogClass(entry)"
      >
        <span v-if="entry.team" class="log-entry-team" :class="`log-entry-team-${entry.team}`">
          {{ getTeamLabel(entry.team) }}
        </span>
        <UIIcon v-if="getEntryIcon(entry)" :type="getEntryIcon(entry)" size="xs" class="log-entry-icon" />
        <span class="log-entry-text">{{ getCleanText(entry) }}</span>
      </div>
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
const isExpanded = ref(false);

// Show last 5 entries when collapsed, all when expanded
const displayedLog = computed(() => {
  if (isExpanded.value) return props.log;
  return props.log.slice(-5);
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

watch(() => props.log.length, async () => {
  await nextTick();
  if (logContainer.value && isExpanded.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
});

function getEntryText(entry) {
  if (typeof entry === 'string') return entry;
  return entry.message || entry.text || '';
}

// Remove emojis from text for clean display
function getCleanText(entry) {
  const text = getEntryText(entry);
  return text
    .replace(/🏁|🏆|💨|🛡️|🌀|⚔️|🍌|🤕|⚠️|🎲|▶️/g, '')
    .replace(/\[FINISH\]|\[WINNER\]|\[WIND\]|\[SHELTER\]|\[ASPIRATION\]|\[ATTACK\]|\[REFUEL\]|\[CRASH\]/g, '')
    .trim();
}

function getTeamLabel(teamId) {
  const labels = {
    team_a: 'R',
    team_b: 'B',
    team_c: 'V',
    team_d: 'J'
  };
  return labels[teamId] || teamId;
}

function getEntryIcon(entry) {
  const text = getEntryText(entry);
  
  if (text.includes('🏁') || text.includes('[FINISH]') || text.includes('franchit')) return 'finish';
  if (text.includes('🏆') || text.includes('[WINNER]') || text.includes('gagne')) return 'finish';
  if (text.includes('💨') || text.includes('[WIND]') || text.includes('vent')) return 'wind';
  if (text.includes('🛡️') || text.includes('[SHELTER]') || text.includes('abri')) return 'shelter';
  if (text.includes('🌀') || text.includes('[ASPIRATION]') || text.includes('aspiration')) return 'aspiration';
  if (text.includes('⚔️') || text.includes('[ATTACK]') || text.includes('attaque')) return 'attack';
  if (text.includes('🍌') || text.includes('[REFUEL]') || text.includes('ravitaillement')) return 'refuel';
  if (text.includes('🤕') || text.includes('[CRASH]') || text.includes('chute')) return 'crash';
  if (text.includes('case pleine') || text.includes('bloqué')) return 'warning';
  if (text.includes('sommet') || text.includes('montagne')) return 'summit';
  if (text.includes('Tour') || text.includes('===')) return null;
  
  return null;
}

function getLogClass(entry) {
  const text = getEntryText(entry);
  
  if (text.includes('---')) return 'log-entry--separator';
  if (text.includes('===') || text.includes('Tour')) return 'log-entry--header';
  if (text.includes('🏁') || text.includes('[FINISH]') || text.includes('franchit')) return 'log-entry--finish';
  if (text.includes('💨') || text.includes('[WIND]') || text.includes('vent')) return 'log-entry--wind';
  if (text.includes('🛡️') || text.includes('[SHELTER]') || text.includes('abri')) return 'log-entry--shelter';
  if (text.includes('🌀') || text.includes('[ASPIRATION]') || text.includes('aspiration')) return 'log-entry--aspiration';
  if (text.includes('🏆') || text.includes('[WINNER]') || text.includes('gagne')) return 'log-entry--winner';
  if (text.includes('⚔️') || text.includes('[ATTACK]') || text.includes('attaque')) return 'log-entry--attack';
  if (text.includes('case pleine') || text.includes('bloqué')) return 'log-entry--blocked';
  if (text.includes('🍌') || text.includes('[REFUEL]') || text.includes('ravitaillement')) return 'log-entry--refuel';
  if (text.includes('🤕') || text.includes('[CRASH]') || text.includes('chute')) return 'log-entry--crash';
  return '';
}
</script>

<style scoped>
/* Slate Premium Style (softer than black) */
.log-panel {
  background: #3A3D42;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  /* Subtle grain texture */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-blend-mode: overlay;
  background-size: 150px;
}

.log-panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  user-select: none;
}

.log-panel-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-panel-icon {
  color: rgba(255, 255, 255, 0.45);
}

.log-panel-title {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-panel-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 5px;
  border-radius: 8px;
}

.log-panel-toggle {
  margin-left: auto;
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.40);
  display: flex;
  align-items: center;
  justify-content: center;
}

.log-panel-toggle:hover {
  color: rgba(255, 255, 255, 0.60);
}

/* Content: collapsed shows ~5 lines, expanded scrolls */
.log-panel-content {
  max-height: 110px;
  overflow: hidden;
  padding: var(--space-xs);
  transition: max-height 0.25s ease;
}

.log-panel--expanded .log-panel-content {
  max-height: 280px;
  overflow-y: auto;
}

/* Log Entry - compact density */
.log-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-xs);
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.50);
}

.log-entry-team {
  font-weight: 600;
  padding: 0 3px;
  border-radius: 2px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  flex-shrink: 0;
}

.log-entry-team-team_a {
  background: rgba(201, 75, 75, 0.20);
  color: #E08080;
}

.log-entry-team-team_b {
  background: rgba(63, 96, 201, 0.20);
  color: #8098E0;
}

.log-entry-team-team_c {
  background: rgba(58, 164, 98, 0.20);
  color: #80D098;
}

.log-entry-team-team_d {
  background: rgba(221, 187, 74, 0.20);
  color: #D8C878;
}

.log-entry-icon {
  flex-shrink: 0;
  opacity: 0.60;
}

.log-entry-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Entry Type Styles - softer colors */
.log-entry--separator {
  color: rgba(255, 255, 255, 0.20);
  justify-content: center;
  padding: 1px 0;
}

.log-entry--header {
  background: rgba(200, 160, 60, 0.10);
  color: rgba(220, 190, 100, 0.85);
  justify-content: center;
  font-weight: 500;
  font-family: var(--font-ui);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  margin: 2px 0;
}

.log-entry--finish .log-entry-text,
.log-entry--finish .log-entry-icon { color: rgba(110, 200, 150, 0.85); }

.log-entry--winner .log-entry-text,
.log-entry--winner .log-entry-icon { 
  color: rgba(220, 190, 100, 0.90); 
  font-weight: 500;
}

.log-entry--attack .log-entry-text,
.log-entry--attack .log-entry-icon { color: rgba(220, 150, 100, 0.80); }

.log-entry--wind .log-entry-text,
.log-entry--wind .log-entry-icon { color: rgba(220, 190, 100, 0.75); }

.log-entry--shelter .log-entry-text,
.log-entry--shelter .log-entry-icon { color: rgba(130, 200, 150, 0.80); }

.log-entry--aspiration .log-entry-text,
.log-entry--aspiration .log-entry-icon { color: rgba(140, 180, 220, 0.80); }

.log-entry--blocked .log-entry-text,
.log-entry--blocked .log-entry-icon { color: rgba(220, 160, 100, 0.75); }

.log-entry--refuel .log-entry-text,
.log-entry--refuel .log-entry-icon { color: rgba(220, 200, 100, 0.75); }

.log-entry--crash .log-entry-text,
.log-entry--crash .log-entry-icon { color: rgba(220, 140, 140, 0.80); }

/* Scrollbar styling */
.log-panel-content::-webkit-scrollbar {
  width: 4px;
}

.log-panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.log-panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

.log-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.20);
}
</style>
