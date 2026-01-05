<template>
  <div class="teams-overview" :class="gridClass">
    <div 
      v-for="team in displayTeams" 
      :key="team"
      class="team-card"
      :class="[getTeamCardClass(team), { 'team-card--active': currentTeam === team }]"
    >
      <!-- Accent Bar (left) -->
      <div class="team-card-accent" :class="`team-card-accent--${team}`"></div>
      
      <!-- Card Content -->
      <div class="team-card-content">
        <!-- Team Header -->
        <div class="team-card-header" :class="`team-card-header--${team}`">
          <RiderToken
            :rider="{ id: 'header', name: '', type: 'rouleur', team, position: 0 }"
            :mini="true"
            :static="true"
          />
          <span class="team-card-name">{{ getTeamConfig(team).name }}</span>
          <span v-if="isAITeam(team)" class="team-badge team-badge--ai">
            <UIIcon type="ai" size="xs" />
            <UIIcon v-if="getAIProfileType(team)" :type="getAIProfileType(team)" size="xs" />
          </span>
          <span v-if="currentTeam === team" class="team-badge team-badge--active">
            <UIIcon type="start" size="xs" />
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
              :isActive="rider.id === selectedRiderId"
              :hasPlayed="playedRiders.includes(rider.id)"
              :mini="true"
              :static="true"
            />
            <span v-if="rider.id === selectedRiderId" class="active-marker active-marker--row" aria-hidden="true">
              <span class="active-marker__dot"></span>
            </span>

            <!-- Info -->
            <div class="rider-row-info">
              <span class="rider-row-name">{{ rider.name }}</span>
              <span class="rider-row-type">{{ getRiderTypeName(rider.type) }}</span>
            </div>

            <!-- Position -->
            <span class="rider-row-pos">{{ rider.position }}</span>

            <!-- Cards Count -->
            <div class="rider-row-cards">
              <span class="card-count" title="Main">
                <UIIcon type="card" size="xs" />
                {{ rider.hand?.length || 0 }}
              </span>
              <span class="card-count" title="Attaques">
                <UIIcon type="attack" size="xs" />
                {{ rider.attackCards?.length || 0 }}
              </span>
              <span class="card-count" title="Spécialités">
                <UIIcon type="star" size="xs" />
                {{ rider.specialtyCards?.length || 0 }}
              </span>
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

            <!-- Status Indicator -->
            <div class="rider-status">
              <span v-if="rider.hasFinished" class="rider-status-badge rider-status-badge--finish">
                <UIIcon type="finish" size="xs" />
              </span>
              <span v-else-if="rider.turnsToSkip > 0" class="rider-status-badge rider-status-badge--crash">
                <UIIcon type="crash" size="xs" />
              </span>
              <span v-else-if="playedRiders.includes(rider.id)" class="rider-status-badge rider-status-badge--done">
                <UIIcon type="check" size="xs" />
              </span>
            </div>
          </div>
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
import { UIIcon } from './icons';

const props = defineProps({
  riders: { type: Array, required: true, default: () => [] },
  currentTeam: { type: String, required: true },
  selectedRiderId: { type: [String, null], default: null },
  playedRiders: { type: Array, default: () => [] },
  teamIds: { type: Array, default: () => ['team_a', 'team_b'] },
  players: { type: Array, default: () => [] },
  aiProfiles: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['selectRider']);

// Map personality to icon type
const profileIconTypes = {
  conservateur: 'shield',
  equilibre: 'balance',
  opportuniste: 'target'
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
  return `team-card--${teamId}`;
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

function getAIProfileType(teamId) {
  const profile = props.aiProfiles[teamId];
  return profileIconTypes[profile] || null;
}

function getTeamRiders(team) {
  return props.riders.filter(r => r.team === team);
}

function getRiderTypeName(type) {
  return RiderConfig[type]?.name || type;
}

function isRiderPlayable(rider, team) {
  if (team !== props.currentTeam) return false;
  if (props.playedRiders.includes(rider.id)) return false;
  if (rider.hasFinished) return false;
  if (rider.turnsToSkip > 0) return false;
  return true;
}

// Allow clicking on any rider for viewing, but only playable ones have green highlight
function isRiderClickable(rider) {
  // Can't view finished or crashed riders
  if (rider.hasFinished) return false;
  if (rider.turnsToSkip > 0) return false;
  return true;
}

function getRiderRowClasses(rider, team) {
  const playable = isRiderPlayable(rider, team);
  const clickable = isRiderClickable(rider);
  
  return {
    'rider-row--playable': playable,
    'rider-row--clickable': clickable && !playable, // Clickable for viewing only
    'rider-row--selected': rider.id === props.selectedRiderId,
    'rider-row--played': props.playedRiders.includes(rider.id),
    'rider-row--skipping': rider.turnsToSkip > 0
  };
}

function onRiderClick(rider, team) {
  if (isRiderClickable(rider)) {
    // Emit with viewOnly flag if not playable
    const viewOnly = !isRiderPlayable(rider, team);
    emit('selectRider', { rider, viewOnly });
  }
}
</script>

<style scoped>
/* ===========================================
   TEAMS OVERVIEW - Phase 14 Grid Responsive
   Évite l'effet "tableur" avec grille 2 colonnes
   =========================================== */

.teams-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

/* 3 équipes: 2 colonnes, dernière centrée */
.teams-overview--3 {
  grid-template-columns: repeat(2, 1fr);
}

.teams-overview--3 .team-card:last-child {
  grid-column: 1 / -1;
  max-width: 50%;
  justify-self: center;
}

/* 4 équipes: grille 2x2 */
.teams-overview--4 {
  grid-template-columns: repeat(2, 1fr);
}

/* ---- Team Card ---- */
.team-card {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, transform 0.15s;
}

.team-card:hover {
  transform: translateY(-1px);
}

.team-card--active {
  box-shadow: var(--shadow-sm), 0 0 0 2px var(--color-accent);
}

/* Accent bar (left) - subtle tint */
.team-card-accent {
  width: 5px;
  flex-shrink: 0;
}

.team-card-accent--team_a { background: var(--team-red-print); opacity: 0.40; }
.team-card-accent--team_b { background: var(--team-blue-print); opacity: 0.40; }
.team-card-accent--team_c { background: var(--team-green-print); opacity: 0.40; }
.team-card-accent--team_d { background: var(--team-yellow-print); opacity: 0.40; }

.team-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ---- Header strip ---- */
.team-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--color-line-subtle);
}

.team-card-header--team_a { background: var(--team-red-strip); }
.team-card-header--team_b { background: var(--team-blue-strip); }
.team-card-header--team_c { background: var(--team-green-strip); }
.team-card-header--team_d { background: var(--team-yellow-strip); }

.team-card-name {
  flex: 1;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Team badges */
.team-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  font-size: 10px;
}

.team-badge--ai {
  background: var(--color-canvas);
  color: var(--color-ink-muted);
  border: 1px solid var(--color-line);
}

.team-badge--active {
  background: var(--color-accent-light);
  color: var(--color-accent);
}

/* ---- Riders List ---- */
.team-riders-list {
  display: flex;
  flex-direction: column;
}

.rider-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 3px var(--space-sm);
  transition: background 0.15s;
}

.rider-row .active-marker--row {
  width: 12px;
  height: 12px;
  box-shadow: none;
  border-color: rgba(31, 35, 40, 0.25);
}

.rider-row .active-marker--row .active-marker__dot {
  width: 4px;
  height: 4px;
}

.rider-row--playable {
  cursor: pointer;
  background: var(--color-action-light);
}

.rider-row--playable:hover {
  background: rgba(58, 164, 98, 0.15);
}

/* Clickable but view-only (other team or already played) */
.rider-row--clickable {
  cursor: pointer;
}

.rider-row--clickable:hover {
  background: rgba(31, 35, 40, 0.04);
}

.rider-row--selected {
  background: color-mix(in srgb, var(--race-yellow) 18%, white);
  box-shadow: inset 3px 0 0 var(--race-yellow);
}

/* Played/disabled state */
.rider-row--played .rider-row-info,
.rider-row--played .rider-row-pos,
.rider-row--played .rider-row-cards,
.rider-row--played .rider-row-energy {
  opacity: 0.50;
}

.rider-row--skipping {
  background: rgba(216, 74, 74, 0.06);
}

.rider-row--skipping .rider-row-info,
.rider-row--skipping .rider-row-pos,
.rider-row--skipping .rider-row-cards,
.rider-row--skipping .rider-row-energy {
  opacity: 0.45;
}

.rider-row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rider-row-name {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-row-type {
  font-size: 9px;
  color: var(--color-ink-muted);
}

.rider-row-pos {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-ink-muted);
  min-width: 18px;
  text-align: right;
}

/* Cards Count */
.rider-row-cards {
  display: flex;
  gap: 3px;
}

.card-count {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  color: var(--color-ink-subtle);
  font-size: 9px;
  font-family: var(--font-mono);
}

/* Energy Mini Bar */
.rider-row-energy {
  width: 32px;
}

.energy-bar-mini {
  width: 100%;
  height: 3px;
  background: var(--color-canvas);
  border-radius: 2px;
  overflow: hidden;
}

.energy-fill-mini {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Status Indicator */
.rider-status {
  width: 18px;
  display: flex;
  justify-content: center;
}

.rider-status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
}

.rider-status-badge--finish {
  color: var(--color-success);
  border-color: var(--color-action-light);
}

.rider-status-badge--crash {
  color: var(--color-danger);
  border-color: rgba(216, 74, 74, 0.20);
}

.rider-status-badge--done {
  color: var(--color-ink-subtle);
}

/* ---- Responsive ---- */
@media (max-width: 900px) {
  .teams-overview,
  .teams-overview--3,
  .teams-overview--4 {
    grid-template-columns: 1fr 1fr;
  }
  
  .teams-overview--3 .team-card:last-child {
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .teams-overview,
  .teams-overview--3,
  .teams-overview--4 {
    grid-template-columns: 1fr;
  }
  
  .teams-overview--3 .team-card:last-child {
    max-width: 100%;
    justify-self: stretch;
  }
  
  .rider-row-cards {
    display: none;
  }

  .rider-row {
    min-height: 44px;
    padding: 8px var(--space-sm);
    border-radius: var(--radius-sm);
  }

  .rider-row--selected {
    border: 1px solid var(--race-yellow);
    box-shadow: inset 3px 0 0 var(--race-yellow);
  }

  .rider-row-name {
    font-size: 13px;
  }

  .rider-row-type {
    font-size: 11px;
  }

  .rider-row-pos {
    display: none;
  }

  .rider-row-energy {
    width: 46px;
  }
}
</style>
