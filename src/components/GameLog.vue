<template>
  <div class="log-panel">
    <div class="log-panel-header">
      <svg class="log-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
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
        <span class="log-entry-text">{{ getEntryText(entry) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

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

function getTeamLabel(teamId) {
  const labels = {
    team_a: 'Rouge',
    team_b: 'Bleu',
    team_c: 'Vert',
    team_d: 'Jaune'
  };
  return labels[teamId] || teamId;
}

function getLogClass(entry) {
  const text = typeof entry === 'string' ? entry : (entry.message || '');
  
  if (text.includes('---')) return 'log-entry--separator';
  if (text.includes('===')) return 'log-entry--header';
  if (text.includes('🏁') || text.includes('[FINISH]')) return 'log-entry--finish';
  if (text.includes('💨') || text.includes('[WIND]')) return 'log-entry--wind';
  if (text.includes('🛡️') || text.includes('[SHELTER]')) return 'log-entry--shelter';
  if (text.includes('🌀') || text.includes('[ASPIRATION]')) return 'log-entry--aspiration';
  if (text.includes('🏆') || text.includes('[WINNER]')) return 'log-entry--winner';
  if (text.includes('⚔️') || text.includes('[ATTACK]')) return 'log-entry--attack';
  if (text.includes('case pleine')) return 'log-entry--blocked';
  if (text.includes('🍌') || text.includes('[REFUEL]')) return 'log-entry--refuel';
  return '';
}
</script>

<style scoped>
/* Uses log-panel classes from layout.css */

/* Additional entry type colors */
.log-entry--separator {
  color: var(--log-muted);
  text-align: center;
  padding: var(--space-sm) 0;
  border: none;
}

.log-entry--header {
  color: var(--color-gold);
  text-align: center;
  padding: var(--space-sm) 0;
  font-weight: 600;
  background: rgba(215, 162, 26, 0.1);
  border: none;
  border-radius: var(--radius-xs);
}

.log-entry--finish .log-entry-text { color: #34d399; }
.log-entry--attack .log-entry-text { color: #fb923c; }
.log-entry--wind .log-entry-text { color: #fbbf24; }
.log-entry--shelter .log-entry-text { color: #4ade80; }
.log-entry--aspiration .log-entry-text { color: #60a5fa; }
.log-entry--winner .log-entry-text { color: var(--color-gold); font-weight: 600; }
.log-entry--blocked .log-entry-text { color: #f97316; }
.log-entry--refuel .log-entry-text { color: #fbbf24; }
</style>
