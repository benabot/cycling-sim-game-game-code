<template>
  <div class="app-container app-container--centered">
    <div class="setup-panel">
      <!-- Header -->
      <div class="section-header section-header--centered">
        <svg class="section-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <h1 class="section-header-title type-display-h1">Course Cycliste</h1>
        <span class="section-header-subtitle">Configuration de la partie</span>
      </div>

      <!-- Number of teams -->
      <section class="setup-section">
        <label class="form-label">Nombre d'équipes</label>
        <div class="segmented segmented--stretch">
          <button 
            v-for="n in [2, 3, 4]" 
            :key="n"
            class="segmented-item"
            :class="{ 'segmented-item-active': numTeams === n }"
            @click="setNumTeams(n)"
          >
            {{ n }} équipes
          </button>
        </div>
      </section>

      <!-- Team configuration -->
      <section class="setup-section">
        <label class="form-label">Configuration des équipes</label>
        <div class="teams-grid">
          <div 
            v-for="(player, index) in players" 
            :key="player.teamId"
            class="card team-setup-card"
            :class="getTeamCardClass(player.teamId)"
          >
            <!-- Team Header -->
            <div class="team-setup-header">
              <RiderToken
                :rider="{ id: 'icon', name: '', type: 'rouleur', team: player.teamId, position: 0 }"
                :compact="true"
              />
              <input 
                type="text" 
                v-model="player.customName" 
                :placeholder="player.name"
                class="input input--inline"
                @input="updatePlayer(index)"
              />
            </div>

            <!-- Player Type -->
            <div class="team-setup-controls">
              <label class="toggle-row">
                <input 
                  type="checkbox" 
                  :checked="player.playerType === 'ai'"
                  @change="togglePlayerType(index)"
                  class="toggle-checkbox"
                />
                <span class="badge" :class="player.playerType === 'human' ? 'badge-blue' : 'badge-yellow'">
                  <UIIcon :type="player.playerType === 'human' ? 'human' : 'ai'" size="sm" />
                  {{ player.playerType === 'human' ? 'Humain' : 'IA' }}
                </span>
              </label>

              <!-- AI Options -->
              <div v-if="player.playerType === 'ai'" class="ai-options">
                <select v-model="player.difficulty" @change="updatePlayer(index)" class="select select--sm">
                  <option value="easy">Facile</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Difficile</option>
                </select>
                <select v-model="player.personality" @change="updatePlayer(index)" class="select select--sm">
                  <option value="">Aléatoire</option>
                  <option value="attacker">Attaquant</option>
                  <option value="conservative">Conservateur</option>
                  <option value="opportunist">Opportuniste</option>
                  <option value="balanced">Équilibré</option>
                </select>
              </div>
            </div>

            <!-- Riders Expand -->
            <div class="team-riders-section">
              <button 
                class="btn btn-ghost btn-sm btn--full-width" 
                @click="toggleRidersExpand(index)"
              >
                <RiderIcon type="rouleur" :size="16" />
                <span>Coureurs</span>
                <UIIcon :type="expandedTeams[index] ? 'chevron-up' : 'chevron-down'" size="sm" />
              </button>
              
              <div v-if="expandedTeams[index]" class="riders-edit-list">
                <div 
                  v-for="(rider, riderIndex) in riderTypes" 
                  :key="riderIndex"
                  class="rider-edit-row"
                >
                  <RiderIcon :type="rider.type" :size="18" class="rider-edit-icon" />
                  <input 
                    type="text" 
                    v-model="player.riderNames[riderIndex]"
                    :placeholder="rider.defaultName"
                    class="input input--sm"
                    @input="updatePlayer(index)"
                  />
                  <span class="type-caption">{{ rider.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Course length -->
      <section class="setup-section">
        <label class="form-label">Longueur du parcours</label>
        <div class="segmented segmented--stretch">
          <button 
            v-for="len in courseLengths" 
            :key="len.value"
            class="segmented-item segmented-item--col"
            :class="{ 'segmented-item-active': courseLength === len.value }"
            @click="courseLength = len.value"
          >
            <span class="type-body-medium">{{ len.value }} cases</span>
            <span class="type-caption">~{{ len.duration }}</span>
          </button>
        </div>
      </section>

      <!-- Summary -->
      <div class="setup-summary">
        <span class="badge badge-blue">
          <UIIcon type="human" size="xs" />
          {{ humanCount }} joueur(s)
        </span>
        <span class="type-caption">vs</span>
        <span class="badge badge-yellow">
          <UIIcon type="ai" size="xs" />
          {{ aiCount }} IA
        </span>
      </div>

      <!-- Start button -->
      <button 
        class="btn btn-success btn-lg btn--full-width" 
        @click="startGame" 
        :disabled="humanCount === 0"
      >
        <UIIcon type="finish" size="lg" />
        Lancer la course !
      </button>

      <p v-if="humanCount === 0" class="setup-warning type-caption">
        <UIIcon type="warning" size="sm" />
        Au moins un joueur humain requis
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { TeamId, PlayerType, AIDifficulty, getTeamIds, createPlayerConfig } from '../core/teams.js';
import RiderToken from './RiderToken.vue';
import { RiderIcon, UIIcon } from './icons';

const emit = defineEmits(['start']);

// Rider types configuration
const riderTypes = [
  { type: 'climber', label: 'Grimpeur', defaultName: 'Grimpeur', desc: 'Fort en montagne' },
  { type: 'puncher', label: 'Puncheur', defaultName: 'Puncheur', desc: 'Fort en côte' },
  { type: 'rouleur', label: 'Rouleur', defaultName: 'Rouleur', desc: 'Fort sur le plat' },
  { type: 'sprinter', label: 'Sprinteur', defaultName: 'Sprinteur', desc: 'Fort au sprint' },
  { type: 'versatile', label: 'Polyvalent', defaultName: 'Polyvalent', desc: 'Équilibré' }
];

const courseLengths = [
  { value: 60, duration: '18 min' },
  { value: 80, duration: '24 min' },
  { value: 100, duration: '30 min' }
];

// Configuration state
const numTeams = ref(2);
const courseLength = ref(80);
const players = ref([]);
const expandedTeams = reactive({});

// Get team card class
function getTeamCardClass(teamId) {
  const classes = {
    team_a: 'card-team-red',
    team_b: 'card-team-blue',
    team_c: 'card-team-green',
    team_d: 'card-team-yellow'
  };
  return classes[teamId] || '';
}

// Initialize players
function initializePlayers() {
  const teamIds = getTeamIds(numTeams.value);
  players.value = teamIds.map((teamId, index) => {
    const isHuman = index === 0;
    const config = createPlayerConfig(
      teamId,
      isHuman ? PlayerType.HUMAN : PlayerType.AI,
      AIDifficulty.NORMAL
    );
    return {
      ...config,
      customName: '',
      riderNames: ['', '', '', '', ''],
      personality: ''
    };
  });
  Object.keys(expandedTeams).forEach(k => delete expandedTeams[k]);
}

function setNumTeams(n) {
  numTeams.value = n;
  initializePlayers();
}

function toggleRidersExpand(index) {
  expandedTeams[index] = !expandedTeams[index];
}

function togglePlayerType(index) {
  const player = players.value[index];
  const newType = player.playerType === PlayerType.HUMAN ? PlayerType.AI : PlayerType.HUMAN;
  const newConfig = createPlayerConfig(
    player.teamId,
    newType,
    newType === PlayerType.AI ? AIDifficulty.NORMAL : null
  );
  players.value[index] = {
    ...newConfig,
    customName: player.customName,
    riderNames: player.riderNames,
    personality: player.personality || ''
  };
}

function updatePlayer(index) {
  // v-model handles the update
}

const humanCount = computed(() => 
  players.value.filter(p => p.playerType === PlayerType.HUMAN).length
);

const aiCount = computed(() => 
  players.value.filter(p => p.playerType === PlayerType.AI).length
);

function startGame() {
  if (humanCount.value === 0) return;
  emit('start', {
    numTeams: numTeams.value,
    players: players.value,
    courseLength: courseLength.value
  });
}

initializePlayers();
</script>

<style scoped>
.app-container--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-lg);
}

.setup-panel {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  max-width: 700px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.section-header--centered {
  flex-direction: column;
  text-align: center;
  margin-bottom: var(--space-xl);
}

.section-header--centered .section-header-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-sm);
}

.setup-section {
  margin-bottom: var(--space-xl);
}

/* Teams Grid */
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
}

.team-setup-card {
  padding: 0;
  overflow: hidden;
}

.team-setup-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  /* Background déjà géré par .card-team-* gradient */
}

.team-setup-header .input--inline {
  flex: 1;
  background: transparent;
  border-color: transparent;
  font-weight: 500;
}

.team-setup-header .input--inline:focus {
  background: var(--color-surface);
  border-color: var(--color-line);
}

.team-setup-controls {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
}

.toggle-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--color-accent);
}

.ai-options {
  display: flex;
  gap: var(--space-xs);
}

.ai-options .select--sm {
  flex: 1;
  font-size: 0.85em;
}

/* Riders Section */
.team-riders-section {
  border-top: 1px solid var(--color-line);
}

.team-riders-section .btn--full-width {
  border-radius: 0;
  justify-content: center;
  gap: var(--space-xs);
}

.riders-edit-list {
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-canvas);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.rider-edit-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.rider-edit-icon {
  color: var(--color-ink-muted);
  flex-shrink: 0;
}

.rider-edit-row .input--sm {
  flex: 1;
}

.rider-edit-row .type-caption {
  width: 70px;
  text-align: right;
  color: var(--color-ink-muted);
}

/* Segmented Variants */
.segmented--stretch {
  display: flex;
}

.segmented--stretch .segmented-item {
  flex: 1;
  justify-content: center;
}

.segmented-item--col {
  flex-direction: column;
  padding: var(--space-md) var(--space-sm);
  gap: 2px;
}

/* Summary */
.setup-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background-color: var(--color-canvas);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

/* Warning */
.setup-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  text-align: center;
  color: var(--color-danger);
  margin-top: var(--space-sm);
}

/* Responsive */
@media (max-width: 600px) {
  .setup-panel {
    padding: var(--space-lg);
  }
  
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .ai-options {
    flex-direction: column;
  }
}
</style>
