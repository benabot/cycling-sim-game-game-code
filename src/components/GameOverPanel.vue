<template>
  <div class="game-over-panel">
    <h2 class="game-over-title">
      <UIIcon type="trophy" :size="28" />
      Course terminée
    </h2>
    <div class="winning-team" v-if="winningTeam">
      <span class="winner-badge" :style="{ background: TeamConfig[winningTeam]?.color }">
        Vainqueur : {{ TeamConfig[winningTeam]?.name }}
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
          {{ getTeamInitial(rider.team) }}
        </span>
        <span class="final-pos">{{ getResultLabel(rider) }}</span>
      </div>
    </div>
    <button @click="$emit('restart')" class="btn btn-restart">
      <UIIcon type="restart" :size="18" />
      Nouvelle course
    </button>
  </div>
</template>

<script setup>
import { TeamConfig, Medals } from '../config/game.config.js';
import { UIIcon } from './icons';

const props = defineProps({
  winningTeam: { type: String, default: null },
  rankings: { type: Array, default: () => [] },
  stageRace: { type: Object, default: null }
});

defineEmits(['restart']);

function getMedal(index) {
  return Medals[index] || `${index + 1}`;
}

function getTeamInitial(teamId) {
  const initials = {
    team_a: 'R',
    team_b: 'B',
    team_c: 'V',
    team_d: 'J'
  };
  return initials[teamId] || '?';
}

function getResultLabel(rider) {
  if (props.stageRace) {
    const seconds = Number.isFinite(rider.gcSeconds) ? rider.gcSeconds : 0;
    return seconds === 0 ? '0s' : `+${seconds}s`;
  }
  return `Case ${rider.position}`;
}
</script>

<style scoped>
.game-over-panel {
  text-align: center;
  background: var(--color-surface, #f8fafc);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-xl, 30px);
  margin-bottom: var(--space-lg, 20px);
}

.game-over-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm, 8px);
  margin: 0 0 var(--space-lg, 20px) 0;
  color: var(--color-gold, #d97706);
}

.winning-team { margin: var(--space-lg, 20px) 0; }

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
  margin: var(--space-lg, 20px) auto;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 10px);
  padding: var(--space-sm, 8px) var(--space-md, 15px);
  background: white;
  margin: 5px 0;
  border-radius: var(--radius-sm, 6px);
  border-left: 4px solid var(--color-line, #e2e8f0);
}

.ranking-row.team_a { border-left-color: var(--team-red-ui, #dc2626); }
.ranking-row.team_b { border-left-color: var(--team-blue-ui, #2563eb); }
.ranking-row.team_c { border-left-color: var(--team-green-ui, #16a34a); }
.ranking-row.team_d { border-left-color: var(--team-yellow-print, #d97706); }

.ranking-row .rank { 
  width: 30px; 
  font-weight: bold;
  font-family: var(--font-mono);
}

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

.ranking-row .final-pos { 
  color: var(--color-ink-muted, #64748b);
  font-family: var(--font-mono);
}

.btn-restart {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: var(--color-accent, #3b82f6);
  color: white;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  margin-top: var(--space-lg, 20px);
  transition: all var(--transition-fast, 0.2s);
}

.btn-restart:hover { 
  background: var(--color-accent-hover, #2563eb); 
}
</style>
