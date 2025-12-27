<template>
  <div class="game-log">
    <h3>📜 Historique</h3>
    <div class="log-entries" ref="logContainer">
      <div 
        v-for="(entry, i) in log" 
        :key="i" 
        class="log-entry"
        :class="getLogClass(entry)"
      >
        {{ entry }}
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

function getLogClass(entry) {
  if (entry.includes('---')) return 'turn-separator';
  if (entry.includes('===')) return 'last-turn-header';
  if (entry.includes('🏁') || entry.includes('[FINISH]')) return 'finish';
  if (entry.includes('💨') || entry.includes('[WIND]')) return 'wind';
  if (entry.includes('🛡️') || entry.includes('[SHELTER]')) return 'shelter';
  if (entry.includes('🌀') || entry.includes('[ASPIRATION]')) return 'aspiration';
  if (entry.includes('🏆') || entry.includes('[WINNER]')) return 'winner';
  if (entry.includes('⚔️') || entry.includes('[ATTACK]')) return 'attack';
  if (entry.includes('case pleine')) return 'blocked';
  return '';
}
</script>

<style scoped>
.game-log {
  background: #1f2937;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 30px;
}

.game-log h3 {
  color: #9ca3af;
  margin: 0 0 10px 0;
  font-size: 0.9em;
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8em;
}

.log-entry {
  color: #d1d5db;
  padding: 2px 0;
  border-bottom: 1px solid #374151;
}

.log-entry.turn-separator {
  color: #6b7280;
  text-align: center;
  padding: 6px 0;
  border: none;
}

.log-entry.last-turn-header {
  color: #fbbf24;
  text-align: center;
  padding: 8px 0;
  font-weight: bold;
  background: rgba(251, 191, 36, 0.1);
  border: none;
}

.log-entry.finish { color: #34d399; }
.log-entry.fall { color: #f87171; }
.log-entry.attack { color: #fb923c; }
.log-entry.wind { color: #fbbf24; }
.log-entry.shelter { color: #4ade80; }
.log-entry.aspiration { color: #60a5fa; }
.log-entry.winner { color: #fbbf24; font-weight: bold; }
.log-entry.blocked { color: #f97316; }
</style>
