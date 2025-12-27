<template>
  <div class="teams-overview">
    <div 
      v-for="team in ['team_a', 'team_b']" 
      :key="team"
      class="team-section"
      :class="{ 'active': currentTeam === team }"
    >
      <h3 :style="{ color: TeamConfig[team].color }">
        {{ TeamConfig[team].name }}
        <span v-if="currentTeam === team" class="active-badge">← Joue</span>
      </h3>
      
      <div class="riders-list">
        <div 
          v-for="rider in getTeamRiders(team)" 
          :key="rider.id"
          class="rider-row"
          :class="{ 
            'selected': rider.id === selectedRiderId,
            'played': playedRiders.includes(rider.id),
            'clickable': isRiderClickable(rider, team)
          }"
          @click="onRiderClick(rider, team)"
        >
          <span class="rider-emoji">{{ getRiderEmoji(rider.type) }}</span>
          <span class="rider-name">{{ rider.name }}</span>
          <span class="rider-pos">Case {{ rider.position }}</span>
          
          <div class="rider-cards-mini">
            <span class="hand-count" :title="'Main: ' + rider.hand.length + ' cartes'">
              🃏{{ rider.hand.length }}
            </span>
            <span class="attack-count" :title="'Attaques: ' + rider.attackCards.length">
              ⚔️{{ rider.attackCards.length }}
            </span>
            <span class="specialty-count" :title="'Spécialités: ' + rider.specialtyCards.length">
              ★{{ rider.specialtyCards.length }}
            </span>
          </div>

          <span v-if="rider.hasFinished" class="status-badge finished">🏁</span>
          <span v-else-if="playedRiders.includes(rider.id)" class="status-badge played">✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { TeamConfig, RiderConfig } from '../config/game.config.js';

const props = defineProps({
  riders: { type: Array, required: true, default: () => [] },
  currentTeam: { type: String, required: true },
  selectedRiderId: { type: [String, null], default: null },
  playedRiders: { type: Array, default: () => [] }
});

const emit = defineEmits(['selectRider']);

function getTeamRiders(team) {
  return props.riders.filter(r => r.team === team);
}

function getRiderEmoji(type) {
  return RiderConfig[type]?.emoji || '🚴';
}

function isRiderClickable(rider, team) {
  if (team !== props.currentTeam) return false;
  if (props.playedRiders.includes(rider.id)) return false;
  if (rider.hasFinished) return false;
  return true;
}

function onRiderClick(rider, team) {
  if (isRiderClickable(rider, team)) {
    emit('selectRider', rider.id);
  }
}
</script>

<style scoped>
.teams-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.team-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 2px solid #e2e8f0;
}
.team-section.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.team-section h3 {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.active-badge {
  font-size: 0.7em;
  background: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
}

.riders-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.15s;
}

.rider-row.clickable {
  cursor: pointer;
  border-color: #10b981;
}
.rider-row.clickable:hover { background: #ecfdf5; }
.rider-row.selected {
  border-color: #f59e0b;
  background: #fef3c7;
}
.rider-row.played {
  opacity: 0.6;
  background: #f1f5f9;
}

.rider-row .rider-emoji { font-size: 1.2em; }
.rider-row .rider-name { flex: 1; font-weight: 500; }
.rider-row .rider-pos { color: #64748b; font-size: 0.85em; }

.rider-cards-mini {
  display: flex;
  gap: 8px;
  font-size: 0.8em;
  color: #64748b;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75em;
}
.status-badge.finished { background: #10b981; color: white; }
.status-badge.played { background: #94a3b8; color: white; }

@media (max-width: 900px) {
  .teams-overview { grid-template-columns: 1fr; }
}
</style>
