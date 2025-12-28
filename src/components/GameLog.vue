<template>
  <div class="log-panel">
    <div class="log-panel-header">
      <UIIcon type="history" size="sm" class="log-panel-icon" />
      <span class="log-panel-title">Historique</span>
    </div>
    <div class="log-panel-content" ref="logContainer">
      <div 
        v-for="(entry, i) in log" 
        :key="i" 
        class="log-entry"
        :class="getLogClass(entry)"
      >
        <span v-if="entry.time" class="log-entry-time">{{ entry.time }}</span>
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
import { ref, watch, nextTick } from 'vue';
import { UIIcon } from './icons';

const props = defineProps({
  log: { type: Array, required: true }
});

const logContainer = ref(null);

watch(() => props.log.length, async () => {
  await nextTick();
  if (logContainer.value) {
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
  // Remove common emojis used in log messages
  return text
    .replace(/🏁|🏆|💨|🛡️|🌀|⚔️|🍌|🤕|⚠️|🎲|▶️/g, '')
    .replace(/\[FINISH\]|\[WINNER\]|\[WIND\]|\[SHELTER\]|\[ASPIRATION\]|\[ATTACK\]|\[REFUEL\]|\[CRASH\]/g, '')
    .trim();
}

function getTeamLabel(teamId) {
  const labels = {
    team_a: 'Rouge',
    team_b: 'Bleu',
    team_c: 'Vert',
    team_d: 'Jaune'
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
  if (text.includes('Tour') || text.includes('===')) return null; // Headers don't need icon
  
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
/* Terminal Premium Style */
.log-panel {
  background: #2A2D32;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.log-panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.log-panel-icon {
  color: rgba(255, 255, 255, 0.60);
}

.log-panel-title {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-panel-content {
  max-height: 300px;
  overflow-y: auto;
  padding: var(--space-sm);
}

/* Log Entry */
.log-entry {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.70);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry-time {
  color: rgba(255, 255, 255, 0.40);
  font-size: 10px;
  min-width: 40px;
}

.log-entry-team {
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.log-entry-team-team_a {
  background: rgba(201, 75, 75, 0.25);
  color: #F08A8A;
}

.log-entry-team-team_b {
  background: rgba(63, 96, 201, 0.25);
  color: #8AA8F0;
}

.log-entry-team-team_c {
  background: rgba(58, 164, 98, 0.25);
  color: #8AE0A8;
}

.log-entry-team-team_d {
  background: rgba(221, 187, 74, 0.25);
  color: #E8D68A;
}

.log-entry-icon {
  flex-shrink: 0;
  opacity: 0.75;
}

.log-entry-text {
  flex: 1;
}

/* Entry Type Styles */
.log-entry--separator {
  color: rgba(255, 255, 255, 0.30);
  justify-content: center;
  padding: var(--space-xs) 0;
  border: none;
}

.log-entry--header {
  background: rgba(215, 162, 26, 0.12);
  color: #E8C860;
  justify-content: center;
  font-weight: 600;
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  margin: var(--space-xs) 0;
  border: none;
}

.log-entry--finish .log-entry-text,
.log-entry--finish .log-entry-icon { color: #6EE7B7; }

.log-entry--winner .log-entry-text,
.log-entry--winner .log-entry-icon { 
  color: #F6D55C; 
  font-weight: 600;
}

.log-entry--attack .log-entry-text,
.log-entry--attack .log-entry-icon { color: #FCA578; }

.log-entry--wind .log-entry-text,
.log-entry--wind .log-entry-icon { color: #FCD34D; }

.log-entry--shelter .log-entry-text,
.log-entry--shelter .log-entry-icon { color: #86EFAC; }

.log-entry--aspiration .log-entry-text,
.log-entry--aspiration .log-entry-icon { color: #93C5FD; }

.log-entry--blocked .log-entry-text,
.log-entry--blocked .log-entry-icon { color: #FB923C; }

.log-entry--refuel .log-entry-text,
.log-entry--refuel .log-entry-icon { color: #FDE047; }

.log-entry--crash .log-entry-text,
.log-entry--crash .log-entry-icon { color: #FCA5A5; }

/* Scrollbar styling for dark theme */
.log-panel-content::-webkit-scrollbar {
  width: 6px;
}

.log-panel-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}

.log-panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.log-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
