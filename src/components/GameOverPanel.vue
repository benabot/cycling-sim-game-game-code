<template>
  <div class="game-over-panel">
    <h2>🏆 Course Terminée!</h2>
    <div class="winning-team" v-if="winningTeam">
      <span class="winner-badge" :style="{ background: TeamConfig[winningTeam]?.color }">
        {{ TeamConfig[winningTeam]?.name }} gagne!
      </span>
    </div>
    <div class="final-rankings">
      <div 
        v-for="(rider, index) in rankings.slice(0, 10)" 
        :key="rider.id"
        class="ranking-row"
        :class="rider.team"
      >
        <span class="rank">{{ getMedal(index) }}</span>
        <span class="rider-name">{{ rider.name }}</span>
        <span class="team-badge" :style="{ background: TeamConfig[rider.team]?.color }">
          {{ rider.team === 'team_a' ? 'R' : 'B' }}
        </span>
        <span class="final-pos">Case {{ rider.position }}</span>
      </div>
    </div>
    <button @click="$emit('restart')" class="btn btn-restart">🔄 Nouvelle partie</button>
  </div>
</template>

<script setup>
import { TeamConfig, Medals } from '../config/game.config.js';

defineProps({
  winningTeam: { type: String, default: null },
  rankings: { type: Array, default: () => [] }
});

defineEmits(['restart']);

function getMedal(index) {
  return Medals[index] || `${index + 1}`;
}
</script>

<style scoped>
.game-over-panel {
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.winning-team { margin: 20px 0; }

.winner-badge {
  display: inline-block;
  padding: 15px 30px;
  border-radius: 30px;
  color: white;
  font-size: 1.5em;
  font-weight: bold;
}

.final-rankings {
  max-width: 400px;
  margin: 20px auto;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 15px;
  background: white;
  margin: 5px 0;
  border-radius: 6px;
  border-left: 4px solid #e2e8f0;
}
.ranking-row.team_a { border-left-color: #dc2626; }
.ranking-row.team_b { border-left-color: #2563eb; }

.ranking-row .rank { width: 30px; font-weight: bold; }
.ranking-row .rider-name { flex: 1; }

.ranking-row .team-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: bold;
}

.ranking-row .final-pos { color: #64748b; }

.btn-restart {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s;
}
.btn-restart:hover { background: #2563eb; }
</style>
