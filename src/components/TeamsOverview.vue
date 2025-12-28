<template>
  <div class="teams-overview" :class="gridClass">
    <div 
      v-for="team in displayTeams" 
      :key="team"
      class="card team-card"
      :class="[getTeamCardClass(team), { 'team-card--active': currentTeam === team }]"
    >
      <!-- Team Header -->
      <div class="team-card-header">
        <RiderToken
          :rider="{ id: 'header', name: '', type: 'rouleur', team, position: 0 }"
          :mini="true"
        />
        <span class="team-card-name type-body-medium">{{ getTeamConfig(team).name }}</span>
        <span v-if="isAITeam(team)" class="badge badge-yellow badge-sm">
          🤖{{ getAIPersonalityIcon(team) }}
        </span>
        <span v-if="currentTeam === team" class="badge badge-blue badge-sm">
          ← Joue
        </span>
      </div>

      <!-- Riders List -->
      <div class="team-riders-list">
        <div 
          v-for="rider in getTeamRiders(team)" 
          :key="rider.id"
          class="rider-row"
          :class="getRiderRowClasses(rider, team)"
          @click="onRiderClick(rider, team)"
        >
          <!-- Token -->
          <RiderToken
            :rider="rider"
            :isSelected="rider.id === selectedRiderId"
            :hasPlayed="playedRiders.includes(rider.id)"
            :mini="true"
          />

          <!-- Info -->
          <div class="rider-row-info">
            <span class="rider-row-name type-body-medium">{{ rider.name }}</span>
            <span class="rider-row-type type-caption">{{ getRiderTypeName(rider.type) }}</span>
          </div>

          <!-- Position -->
          <span class="rider-row-pos type-numeric">{{ rider.position }}</span>

          <!-- Cards Count -->
          <div class="rider-row-cards">
            <span class="type-caption" title="Main">🃏{{ rider.hand?.length || 0 }}</span>
            <span class="type-caption" title="Attaques">⚔️{{ rider.attackCards?.length || 0 }}</span>
            <span class="type-caption" title="Spécialités">★{{ rider.specialtyCards?.length || 0 }}</span>
          </div>

          <!-- Energy Mini Bar -->
          <div class="rider-row-energy" :title="'Énergie: ' + (rider.energy || 100) + '%'">
            <div class="energy-bar-mini">
              <div 
                class="energy-fill-mini" 
                :style="{ 
                  width: (rider.energy || 100) + '%', 
                  backgroundColor: getEnergyColor(rider.energy || 100) 
                }"
              ></div>
            </div>
          </div>

          <!-- Status Badge -->
          <span v-if="rider.hasFinished" class="badge badge-green badge-sm">🏁</span>
          <span v-else-if="rider.turnsToSkip > 0" class="badge badge-red badge-sm">🤕</span>
          <span v-else-if="playedRiders.includes(rider.id)" class="badge badge-muted badge-sm">✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { TeamConfig, RiderConfig } from '../config/game.config.js';
import { getEnergyColor } from '../core/energy.js';
import { TeamConfigs, PlayerType } from '../core/teams.js';
import RiderToken from './RiderToken.vue';

const props = defineProps({
  riders: { type: Array, required: true, default: () => [] },
  currentTeam: { type: String, required: true },
  selectedRiderId: { type: [String, null], default: null },
  playedRiders: { type: Array, default: () => [] },
  teamIds: { type: Array, default: () => ['team_a', 'team_b'] },
  players: { type: Array, default: () => [] },
  aiPersonalities: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['selectRider']);

const personalityIcons = {
  attacker: '⚔️',
  conservative: '🛡️',
  opportunist: '🎯',
  balanced: '⚖️'
};

const displayTeams = computed(() => {
  if (props.teamIds?.length > 0) return props.teamIds;
  const teams = [...new Set(props.riders.map(r => r.team))];
  return teams.length > 0 ? teams : ['team_a', 'team_b'];
});

const gridClass = computed(() => ({
  'teams-overview--3': displayTeams.value.length === 3,
  'teams-overview--4': displayTeams.value.length === 4
}));

function getTeamCardClass(teamId) {
  return {
    team_a: 'card-team-red',
    team_b: 'card-team-blue',
    team_c: 'card-team-green',
    team_d: 'card-team-yellow'
  }[teamId] || '';
}

function getTeamConfig(teamId) {
  const baseConfig = TeamConfigs[teamId] || TeamConfig[teamId] || { name: teamId, color: '#666' };
  const player = props.players.find(p => p.teamId === teamId);
  if (player?.customName) {
    return { ...baseConfig, name: player.customName };
  }
  return baseConfig;
}

function isAITeam(teamId) {
  const player = props.players.find(p => p.teamId === teamId);
  return player?.playerType === PlayerType.AI;
}

function getAIPersonalityIcon(teamId) {
  const personality = props.aiPersonalities[teamId];
  return personalityIcons[personality] || '';
}

function getTeamRiders(team) {
  return props.riders.filter(r => r.team === team);
}

function getRiderTypeName(type) {
  return RiderConfig[type]?.name || type;
}

function isRiderClickable(rider, team) {
  if (team !== props.currentTeam) return false;
  if (props.playedRiders.includes(rider.id)) return false;
  if (rider.hasFinished) return false;
  if (rider.turnsToSkip > 0) return false;
  return true;
}

function getRiderRowClasses(rider, team) {
  return {
    'rider-row--clickable': isRiderClickable(rider, team),
    'rider-row--selected': rider.id === props.selectedRiderId,
    'rider-row--played': props.playedRiders.includes(rider.id),
    'rider-row--skipping': rider.turnsToSkip > 0
  };
}

function onRiderClick(rider, team) {
  if (isRiderClickable(rider, team)) {
    emit('selectRider', rider);
  }
}
</script>

<style scoped>
.teams-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.teams-overview--3 {
  grid-template-columns: repeat(3, 1fr);
}

.teams-overview--4 {
  grid-template-columns: repeat(2, 1fr);
}

/* Team Card */
.team-card {
  padding: 0;
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.team-card--active {
  box-shadow: var(--shadow-md), 0 0 0 2px var(--color-accent);
}

.team-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-canvas);
  border-bottom: 1px solid var(--color-line);
}

.team-card-name {
  flex: 1;
}

/* Riders List */
.team-riders-list {
  display: flex;
  flex-direction: column;
}

.rider-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-bottom: 1px solid var(--color-line-light);
  transition: background 0.15s;
}

.rider-row:last-child {
  border-bottom: none;
}

.rider-row--clickable {
  cursor: pointer;
  background: color-mix(in srgb, var(--color-success) 5%, transparent);
}

.rider-row--clickable:hover {
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
}

.rider-row--selected {
  background: color-mix(in srgb, var(--color-gold) 15%, transparent);
}

.rider-row--played {
  opacity: 0.55;
}

.rider-row--skipping {
  opacity: 0.5;
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
}

.rider-row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rider-row-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-row-type {
  color: var(--color-ink-muted);
}

.rider-row-pos {
  color: var(--color-ink-muted);
  font-size: 0.85em;
  min-width: 24px;
  text-align: right;
}

.rider-row-cards {
  display: flex;
  gap: var(--space-xs);
  color: var(--color-ink-muted);
  font-size: 0.75em;
}

/* Energy Mini Bar */
.rider-row-energy {
  width: 40px;
}

.energy-bar-mini {
  width: 100%;
  height: 5px;
  background: var(--color-line);
  border-radius: 2px;
  overflow: hidden;
}

.energy-fill-mini {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Badge variants */
.badge-muted {
  background: var(--color-ink-muted);
  color: white;
}

.badge-sm {
  font-size: 0.7em;
  padding: 2px 6px;
}

/* Responsive */
@media (max-width: 900px) {
  .teams-overview,
  .teams-overview--3,
  .teams-overview--4 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .rider-row-cards {
    display: none;
  }
}
</style>
