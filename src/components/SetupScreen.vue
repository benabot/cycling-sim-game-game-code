<template>
  <div class="setup-screen">
    <div class="setup-panel">
      <!-- Header -->
      <div class="section-header section-header--centered">
        <svg class="section-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <h1 class="section-header-title type-display-h1">Course Cycliste</h1>
        <span class="section-header-subtitle">Préparation de course · Brief</span>
      </div>

      <div class="setup-stepper">
        <button
          v-for="step in stepItems"
          :key="step.id"
          type="button"
          class="stepper-item"
          :class="{
            'stepper-item--active': activeStep === step.id,
            'stepper-item--complete': step.complete,
            'stepper-item--locked': step.locked
          }"
          :disabled="step.locked"
          @click="setActiveStep(step.id)"
        >
          <span class="stepper-index">{{ step.id }}</span>
          <div class="stepper-text">
            <span class="stepper-title">{{ step.title }}</span>
            <span class="stepper-status">{{ step.status }}</span>
          </div>
          <UIIcon v-if="step.complete" type="check" size="sm" class="stepper-check" />
        </button>
      </div>

      <!-- Step 1: Race -->
      <section ref="raceStepRef" class="setup-step" :class="getStepClass(1)">
        <header class="setup-step-header">
          <div class="setup-step-heading">
            <span class="setup-step-index">1</span>
            <div>
              <h2 class="setup-step-title">Choisir l'épreuve</h2>
              <p class="setup-step-subtitle">Type de course et parcours.</p>
            </div>
          </div>
          <button v-if="activeStep !== 1" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(1)">
            Modifier
          </button>
        </header>
        <div v-show="activeStep === 1" class="setup-step-body">
          <RaceTypeSelector v-model="raceType" />

          <div class="race-config-block">
            <div v-if="raceType === 'classic'" class="race-config-block">
              <ClassicRaceSelector v-model="selectedClassic" />
              <div v-if="selectedClassicPreset" class="race-summary">
                <UIIcon :type="selectedClassicPreset.icon" size="sm" />
                <span>Sélection : {{ selectedClassicPreset.name }} — avantage {{ selectedClassicPreset.advantageLabel.toLowerCase() }}</span>
              </div>
            </div>
            <div v-else-if="raceType === 'stage'" class="race-config-block">
              <StageRaceConfigurator
                v-model="stageConfig"
                :stageLength="courseLength"
              />
            </div>
            <div v-else class="race-placeholder">
              <UIIcon type="info" size="sm" />
              <span>Choisissez un format.</span>
            </div>
          </div>

          <div class="course-length">
            <label class="form-label">{{ lengthLabel }}</label>
            <div class="segmented segmented--stretch">
              <button 
                v-for="len in courseLengths" 
                :key="len.value"
                class="segmented-item segmented-item--col"
                :class="{ 'segmented-item-active': courseLength === len.value }"
                @click="courseLength = len.value"
              >
                <span class="type-body-medium">{{ len.value }} cases</span>
                <span class="type-caption">
                  ~{{ len.duration }}<span v-if="isStageRace"> par étape</span>
                </span>
              </button>
            </div>
            <p v-if="lengthHint" class="form-hint">{{ lengthHint }}</p>
          </div>
        </div>
      </section>

      <!-- Step 2: Teams -->
      <section ref="teamsStepRef" class="setup-step" :class="getStepClass(2)">
        <header class="setup-step-header">
          <div class="setup-step-heading">
            <span class="setup-step-index">2</span>
            <div>
              <h2 class="setup-step-title">Choisir les équipes</h2>
              <p class="setup-step-subtitle">Humain ou IA, niveau et style.</p>
            </div>
          </div>
          <button v-if="activeStep !== 2" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(2)">
            Modifier
          </button>
        </header>
        <div v-show="activeStep === 2" class="setup-step-body">
          <div class="teams-count">
            <label class="form-label">Nombre d'équipes</label>
            <p class="form-hint">Jusqu'à 4 équipes.</p>
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
          </div>

          <div class="teams-grid">
            <div 
              v-for="(player, index) in players" 
              :key="player.teamId"
              class="card team-setup-card"
              :class="getTeamCardClass(player.teamId)"
            >
              <div class="team-setup-header">
                <RiderToken
                  :rider="{ id: 'icon', name: '', type: 'rouleur', team: player.teamId, position: 0 }"
                  :compact="true"
                />
                <div class="team-setup-header-text">
                  <span class="team-setup-title">{{ getTeamLabel(player.teamId) }}</span>
                  <span class="team-setup-meta">{{ player.playerType === 'human' ? 'Humain' : 'IA (recommandé)' }}</span>
                </div>
              </div>

              <div class="team-setup-body">
                <div class="segmented segmented--stretch team-toggle">
                  <button
                    type="button"
                    class="segmented-item"
                    :class="{ 'segmented-item-active': player.playerType === 'ai' }"
                    @click="setPlayerType(index, PlayerType.AI)"
                  >
                    IA (recommandé)
                  </button>
                  <button
                    type="button"
                    class="segmented-item"
                    :class="{ 'segmented-item-active': player.playerType === 'human' }"
                    @click="setPlayerType(index, PlayerType.HUMAN)"
                  >
                    Humain
                  </button>
                </div>

                <p v-if="player.playerType === 'ai'" class="team-microcopy">
                  Auto-sélection des coureurs selon difficulté.
                </p>
                <p v-else class="team-microcopy">
                  Sélection manuelle requise.
                </p>

                <div v-if="player.playerType === 'ai'" class="ai-options">
                  <div class="ai-field">
                    <span class="type-caption">Niveau IA</span>
                    <select v-model="player.difficulty" @change="updatePlayer(index)" class="select select--sm">
                      <option value="easy">Facile</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Difficile</option>
                    </select>
                  </div>
                  <div class="ai-field">
                    <span class="type-caption">Comportement</span>
                    <select v-model="player.personality" @change="updatePlayer(index)" class="select select--sm">
                      <option value="">Aléatoire</option>
                      <option value="attacker">Attaquant</option>
                      <option value="conservative">Conservateur</option>
                      <option value="opportunist">Opportuniste</option>
                      <option value="balanced">Équilibré</option>
                    </select>
                  </div>
                  <div class="team-ai-summary">
                    <span class="badge badge-pill">Budget {{ getTeamBudgetTotal(player.teamId) }}</span>
                    <span class="badge badge-pill">Profils 5/5</span>
                  </div>
                </div>

                <div v-else class="team-human-actions">
                  <div class="team-human-summary">
                    <span class="badge badge-pill">Coureurs {{ getRoster(player.teamId).length }}/{{ DraftConfig.rosterSize }}</span>
                    <span class="badge badge-pill">Budget {{ getTeamBudgetTotal(player.teamId) }}</span>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" @click="focusDraftTeam(player.teamId)">
                    Gérer l'équipe (achat)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Step 3: Draft -->
      <section ref="draftStepRef" class="setup-step" :class="getStepClass(3)">
        <header class="setup-step-header">
          <div class="setup-step-heading">
            <span class="setup-step-index">3</span>
            <div>
              <h2 class="setup-step-title">Composer l'équipe</h2>
              <p class="setup-step-subtitle">Vivier et budget.</p>
            </div>
          </div>
          <button v-if="activeStep !== 3" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(3)">
            Modifier
          </button>
        </header>
        <div v-show="activeStep === 3" class="setup-step-body">
          <div v-if="manualDraftTeamIds.length === 0" class="draft-placeholder">
            <UIIcon type="ai" size="sm" />
            <div>
              <p>Auto-sélection active pour les équipes IA.</p>
              <p class="type-caption">Passez une équipe en Humain pour composer.</p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(2)">
              Modifier
            </button>
          </div>
          <DraftRosterSection
            v-else
            :team-ids="manualDraftTeamIds"
            :players="players"
            :active-team-id="activeDraftTeamId"
            :rosters="teamRosters"
            :pool="riderPool"
            :budget-total="activeDraftBudgetTotal"
            :roster-size="DraftConfig.rosterSize"
            :roles="DraftConfig.roles"
            :stat-order="DraftStatOrder"
            :stat-labels="DraftStatLabels"
            @selectTeam="activeDraftTeamId = $event"
            @recruit="recruitRider"
            @release="releaseRider"
            @confirm="setActiveStep(4)"
          />
        </div>
      </section>

      <!-- Step 4: Launch -->
      <section ref="launchStepRef" class="setup-step" :class="getStepClass(4)">
        <header class="setup-step-header">
          <div class="setup-step-heading">
            <span class="setup-step-index">4</span>
            <div>
              <h2 class="setup-step-title">Lancer la course</h2>
              <p class="setup-step-subtitle">Brief final.</p>
            </div>
          </div>
          <button v-if="activeStep !== 4" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(4)">
            Ouvrir
          </button>
        </header>
        <div v-show="activeStep === 4" class="setup-step-body">
          <div class="setup-summary">
            <span class="setup-summary-label">Résumé</span>
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

          <button 
            class="btn btn-success btn-lg" 
            @click="startGame" 
            :disabled="!canStart"
            style="display: flex; margin: 0 auto;"
          >
            <UIIcon type="finish" size="lg" />
            Lancer la course
          </button>

          <p v-if="startWarning || canStart" class="setup-warning type-caption" :class="{ 'setup-warning--ok': canStart }">
            <UIIcon :type="canStart ? 'check' : 'warning'" size="sm" />
            {{ canStart ? 'Brief validé.' : startWarning }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { PlayerType, AIDifficulty, TeamConfigs, getTeamIds, createPlayerConfig } from '../core/teams.js';
import { AIPersonality } from '../core/ai.js';
import RiderToken from './RiderToken.vue';
import { UIIcon } from './icons';
import RaceTypeSelector from './RaceTypeSelector.vue';
import ClassicRaceSelector from './ClassicRaceSelector.vue';
import StageRaceConfigurator from './StageRaceConfigurator.vue';
import DraftRosterSection from './DraftRosterSection.vue';
import { getClassicPreset } from '../config/race-presets.js';
import { DraftConfig, DraftAIConfig, DraftStatLabels, DraftStatOrder, RiderPool } from '../config/draft.config.js';

const emit = defineEmits(['start']);

const courseLengths = [
  { value: 60, duration: '18 min' },
  { value: 80, duration: '24 min' },
  { value: 100, duration: '30 min' }
];

// Configuration state
const raceType = ref(null);
const selectedClassic = ref(null);
const stageConfig = ref({ numStages: null, profile: null });
const numTeams = ref(2);
const courseLength = ref(80);
const players = ref([]);
const activeStep = ref(1);
const raceStepRef = ref(null);
const teamsStepRef = ref(null);
const draftStepRef = ref(null);
const launchStepRef = ref(null);
const riderPool = ref([]);
const teamRosters = ref({});
const activeDraftTeamId = ref(null);
const riderPoolIndex = new Map(RiderPool.map((rider, index) => [rider.id, index]));

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
  initializeDraftState(teamIds);
}

function initializeDraftState(teamIds = getTeamIds(numTeams.value)) {
  teamRosters.value = teamIds.reduce((acc, teamId) => {
    acc[teamId] = [];
    return acc;
  }, {});
  riderPool.value = RiderPool.map(rider => ({
    ...rider,
    stats: { ...rider.stats }
  }));
  activeDraftTeamId.value = teamIds[0] || null;
  sortRiderPool();
}

function sortRiderPool() {
  riderPool.value.sort((a, b) => {
    const indexA = riderPoolIndex.get(a.id) ?? 0;
    const indexB = riderPoolIndex.get(b.id) ?? 0;
    return indexA - indexB;
  });
}

function getRoster(teamId) {
  return teamRosters.value[teamId] || [];
}

function getPlayerByTeamId(teamId) {
  return players.value.find(player => player.teamId === teamId);
}

function getTeamLabel(teamId) {
  const player = getPlayerByTeamId(teamId);
  const customName = player?.customName?.trim();
  if (customName) return customName;
  return player?.name || TeamConfigs[teamId]?.name || teamId;
}

function getTeamBudgetTotal(teamId) {
  if (!teamId) return DraftConfig.budgetTotal;
  const player = getPlayerByTeamId(teamId);
  if (player?.playerType === PlayerType.AI) {
    return DraftAIConfig.budgetByDifficulty[player.difficulty] ?? DraftConfig.budgetTotal;
  }
  return DraftConfig.budgetTotal;
}

function getBudgetRemaining(teamId) {
  const spent = getRoster(teamId).reduce((sum, rider) => sum + rider.price, 0);
  return Math.max(0, getTeamBudgetTotal(teamId) - spent);
}

function isRosterComplete(teamId) {
  return getRoster(teamId).length === DraftConfig.rosterSize;
}

function canRecruitRider(teamId, rider) {
  if (!teamId || !rider) return false;
  if (getRoster(teamId).length >= DraftConfig.rosterSize) return false;
  if (getBudgetRemaining(teamId) < rider.price) return false;
  return !getRoster(teamId).some(selected => selected.role === rider.role);
}

function recruitRider({ teamId, rider }) {
  if (!canRecruitRider(teamId, rider)) return;
  const roster = getRoster(teamId);
  teamRosters.value = {
    ...teamRosters.value,
    [teamId]: [...roster, { ...rider, stats: { ...rider.stats } }]
  };
  riderPool.value = riderPool.value.filter(entry => entry.id !== rider.id);
}

function releaseRider({ teamId, rider }) {
  if (!teamId || !rider) return;
  const roster = getRoster(teamId);
  if (!roster.some(entry => entry.id === rider.id)) return;
  teamRosters.value = {
    ...teamRosters.value,
    [teamId]: roster.filter(entry => entry.id !== rider.id)
  };
  riderPool.value = [...riderPool.value, { ...rider, stats: { ...rider.stats } }];
  sortRiderPool();
}

function clearTeamRoster(teamId) {
  if (!teamId) return;
  const roster = getRoster(teamId);
  if (!roster.length) return;
  teamRosters.value = {
    ...teamRosters.value,
    [teamId]: []
  };
  riderPool.value = [
    ...riderPool.value,
    ...roster.map(rider => ({ ...rider, stats: { ...rider.stats } }))
  ];
  sortRiderPool();
}

function resolveDraftPersonality(player) {
  if (player?.personality) return player.personality;
  if (player?.difficulty === AIDifficulty.EASY) return AIPersonality.BALANCED;
  const personalities = Object.values(AIPersonality);
  return personalities[Math.floor(Math.random() * personalities.length)];
}

function getDraftPersonalityWeights(personality) {
  return DraftAIConfig.personalityWeights[personality] || DraftAIConfig.personalityWeights.balanced;
}

function getDraftRolePriority(personality) {
  return DraftAIConfig.personalityRolePriority[personality] || DraftConfig.roles;
}

function getAIDifficultyTuning(difficulty) {
  return DraftAIConfig.difficultyTuning[difficulty] || DraftAIConfig.difficultyTuning.normal;
}

function getCheapestPriceForRole(role) {
  const candidates = riderPool.value.filter(rider => rider.role === role);
  if (!candidates.length) return 0;
  return Math.min(...candidates.map(rider => rider.price || 0));
}

function scoreDraftRider(rider, weights, tuning) {
  const stats = rider.stats || {};
  const baseScore = DraftStatOrder.reduce((sum, key) => {
    const weight = weights[key] ?? 1;
    return sum + (stats[key] || 0) * weight;
  }, 0);
  const pricePenalty = (rider.price || 0) * tuning.pricePenalty;
  const jitter = (Math.random() * 2 - 1) * tuning.randomness * 10;
  return baseScore - pricePenalty + jitter;
}

function pickDraftRider(role, budgetRemaining, reserveBudget, weights, tuning) {
  const candidates = riderPool.value.filter(rider => rider.role === role);
  if (!candidates.length) return null;
  const scored = candidates
    .map(rider => ({ rider, score: scoreDraftRider(rider, weights, tuning) }))
    .sort((a, b) => b.score - a.score);
  const maxPrice = budgetRemaining - reserveBudget;
  const affordable = scored.find(entry => entry.rider.price <= maxPrice);
  if (affordable) return affordable.rider;
  const withinBudget = scored.find(entry => entry.rider.price <= budgetRemaining);
  return withinBudget?.rider || scored[0].rider;
}

function autoDraftTeam(player) {
  if (!player || player.playerType !== PlayerType.AI) return;
  const teamId = player.teamId;
  const roster = getRoster(teamId);
  const rosterRoles = new Set(roster.map(rider => rider.role));
  const missingRoles = DraftConfig.roles.filter(role => !rosterRoles.has(role));
  if (!missingRoles.length) return;

  const personality = resolveDraftPersonality(player);
  const weights = getDraftPersonalityWeights(personality);
  const tuning = getAIDifficultyTuning(player.difficulty);
  const rolePriority = getDraftRolePriority(personality)
    .filter(role => missingRoles.includes(role));

  let budgetRemaining = getTeamBudgetTotal(teamId) - roster.reduce((sum, rider) => sum + rider.price, 0);

  rolePriority.forEach((role, index) => {
    const remainingRoles = rolePriority.slice(index + 1);
    const reserveBudget = remainingRoles.reduce(
      (sum, remainingRole) => sum + getCheapestPriceForRole(remainingRole),
      0
    );
    const rider = pickDraftRider(role, budgetRemaining, reserveBudget, weights, tuning);
    if (!rider) return;
    if (canRecruitRider(teamId, rider)) {
      recruitRider({ teamId, rider });
      budgetRemaining -= rider.price;
    }
  });
}

function autoDraftAITeams() {
  players.value
    .filter(player => player.playerType === PlayerType.AI)
    .forEach(player => autoDraftTeam(player));
}

function setNumTeams(n) {
  numTeams.value = n;
  initializePlayers();
}

function setPlayerType(index, type) {
  const player = players.value[index];
  if (!player || player.playerType === type) return;
  const difficulty = type === PlayerType.AI ? (player.difficulty || AIDifficulty.NORMAL) : null;
  const newConfig = createPlayerConfig(
    player.teamId,
    type,
    difficulty
  );
  players.value[index] = {
    ...newConfig,
    customName: player.customName,
    riderNames: player.riderNames,
    personality: player.personality || ''
  };
  if (type === PlayerType.AI) {
    clearTeamRoster(player.teamId);
  }
  if (type === PlayerType.HUMAN) {
    activeDraftTeamId.value = player.teamId;
  }
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

const draftTeamIds = computed(() => players.value.map(player => player.teamId));
const manualDraftTeamIds = computed(() =>
  players.value.filter(player => player.playerType === PlayerType.HUMAN).map(player => player.teamId)
);
const incompleteDraftTeam = computed(() => 
  manualDraftTeamIds.value.find(teamId => !isRosterComplete(teamId))
);
const isDraftComplete = computed(() => 
  manualDraftTeamIds.value.length > 0 && !incompleteDraftTeam.value
);
const activeManualTeamId = computed(() => {
  if (manualDraftTeamIds.value.includes(activeDraftTeamId.value)) return activeDraftTeamId.value;
  return manualDraftTeamIds.value[0] || null;
});
const activeDraftBudgetTotal = computed(() => getTeamBudgetTotal(activeManualTeamId.value));

const isStageRace = computed(() => raceType.value === 'stage');
const isClassicRace = computed(() => raceType.value === 'classic');
const isStageConfigComplete = computed(() => 
  !!stageConfig.value?.numStages && !!stageConfig.value?.profile
);
const isRaceConfigComplete = computed(() => {
  if (isClassicRace.value) return !!selectedClassic.value;
  if (isStageRace.value) return isStageConfigComplete.value;
  return false;
});

const selectedClassicPreset = computed(() => 
  selectedClassic.value ? getClassicPreset(selectedClassic.value) : null
);

const lengthLabel = computed(() => 'Distance');

const lengthHint = computed(() => {
  const base = 'Détermine la durée.';
  if (!isStageRace.value) return base;
  if (!stageConfig.value?.numStages) return `${base} Par étape.`;
  return `${base} ${stageConfig.value.numStages} étapes × ${courseLength.value} cases.`;
});

const startWarning = computed(() => {
  if (humanCount.value === 0) return 'Au moins un humain requis.';
  if (!raceType.value) return 'À compléter : format.';
  if (isClassicRace.value && !selectedClassic.value) return 'À compléter : parcours.';
  if (isStageRace.value && !isStageConfigComplete.value) {
    return 'À compléter : étapes, profil.';
  }
  if (!isDraftComplete.value) {
    const teamId = incompleteDraftTeam.value;
    const count = getRoster(teamId).length;
    return `À compléter : coureurs (${count}/${DraftConfig.rosterSize}).`;
  }
  return '';
});

const canStart = computed(() => startWarning.value === '');

const isTeamsReady = computed(() => humanCount.value > 0);

const stepItems = computed(() => [
  {
    id: 1,
    title: 'Épreuve',
    status: isRaceConfigComplete.value ? 'Validé' : 'À compléter',
    complete: isRaceConfigComplete.value,
    locked: false
  },
  {
    id: 2,
    title: 'Équipes',
    status: isTeamsReady.value ? 'Validé' : 'Humain/IA',
    complete: isTeamsReady.value,
    locked: !isRaceConfigComplete.value
  },
  {
    id: 3,
    title: 'Coureurs',
    status: isDraftComplete.value ? 'Validé' : 'Vivier',
    complete: isDraftComplete.value,
    locked: !isRaceConfigComplete.value || !isTeamsReady.value
  },
  {
    id: 4,
    title: 'Lancer',
    status: canStart.value ? 'Prêt' : 'Brief',
    complete: canStart.value,
    locked: !isRaceConfigComplete.value || !isTeamsReady.value || !isDraftComplete.value
  }
]);

function getStepRef(step) {
  if (step === 1) return raceStepRef;
  if (step === 2) return teamsStepRef;
  if (step === 3) return draftStepRef;
  if (step === 4) return launchStepRef;
  return null;
}

function isStepLocked(step) {
  return stepItems.value.find(item => item.id === step)?.locked ?? false;
}

function getStepClass(step) {
  return {
    'setup-step--active': activeStep.value === step,
    'setup-step--locked': isStepLocked(step)
  };
}

function setActiveStep(step) {
  if (isStepLocked(step)) return;
  activeStep.value = step;
  scrollToSection(getStepRef(step));
}

function focusDraftTeam(teamId) {
  if (!teamId) return;
  activeDraftTeamId.value = teamId;
  setActiveStep(3);
}

function scrollToSection(sectionRef) {
  if (!sectionRef?.value) return;
  nextTick(() => {
    sectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

watch(selectedClassic, (classicId) => {
  const preset = getClassicPreset(classicId);
  if (preset?.defaultLength) {
    courseLength.value = preset.defaultLength;
  }
});

watch(manualDraftTeamIds, (teamIds) => {
  if (!teamIds.includes(activeDraftTeamId.value)) {
    activeDraftTeamId.value = teamIds[0] || null;
  }
});

watch(isRaceConfigComplete, (complete) => {
  if (complete) {
    activeStep.value = 2;
    scrollToSection(teamsStepRef);
  } else if (activeStep.value > 1) {
    activeStep.value = 1;
  }
});

watch(isTeamsReady, (ready) => {
  if (ready && isRaceConfigComplete.value) {
    activeStep.value = 3;
    scrollToSection(draftStepRef);
  } else if (!ready && activeStep.value > 2) {
    activeStep.value = 2;
  }
});

watch(isDraftComplete, (complete) => {
  if (complete) {
    activeStep.value = 4;
    scrollToSection(launchStepRef);
  } else if (activeStep.value > 3) {
    activeStep.value = 3;
  }
});

function buildDraftRosters() {
  return draftTeamIds.value.reduce((acc, teamId) => {
    acc[teamId] = getRoster(teamId).map(rider => ({
      id: rider.id,
      name: rider.name,
      role: rider.role,
      price: rider.price,
      stats: { ...rider.stats }
    }));
    return acc;
  }, {});
}

function startGame() {
  if (!canStart.value) return;
  autoDraftAITeams();
  const stageRace = isStageRace.value
    ? {
        numStages: stageConfig.value.numStages,
        profile: stageConfig.value.profile,
        stageLength: courseLength.value
      }
    : null;
  const raceMode = isStageRace.value ? 'STAGE_RACE' : 'CLASSIC';
  const draftRosters = buildDraftRosters();

  emit('start', {
    numTeams: numTeams.value,
    players: players.value,
    courseLength: courseLength.value,
    raceType: raceType.value,
    classicId: selectedClassic.value,
    raceMode,
    stageRace,
    draftRosters
  });
}

initializePlayers();
</script>

<style scoped>
.setup-screen {
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
  max-width: 1100px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section-header--centered {
  flex-direction: column;
  text-align: center;
}

.section-header--centered .section-header-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-sm);
}

.setup-stepper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-sm);
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-paper);
  text-align: left;
  transition: var(--transition-fast);
}

.stepper-item--active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.stepper-item--complete .stepper-index {
  background: var(--color-accent);
  color: white;
}

.stepper-item--locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.stepper-index {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-canvas);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}

.stepper-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stepper-title {
  font-size: 13px;
  font-weight: 600;
}

.stepper-status {
  font-size: 11px;
  color: var(--color-ink-muted);
}

.stepper-check {
  margin-left: auto;
  color: var(--color-success);
}

.setup-step {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  scroll-margin-top: var(--space-xl);
  background: var(--color-surface);
}

.setup-step--locked {
  opacity: 0.6;
}

.setup-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-paper);
  border-bottom: 1px solid var(--color-line);
}

.setup-step-heading {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.setup-step-index {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-canvas);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}

.setup-step-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.setup-step-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--color-ink-muted);
}

.setup-step-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.teams-count {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

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
}

.team-setup-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.team-setup-title {
  font-weight: 600;
  font-size: 14px;
}

.team-setup-meta {
  font-size: 12px;
  color: var(--color-ink-muted);
}

.team-setup-body {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  border-top: 1px solid var(--color-line);
  background: var(--color-surface);
}

.team-toggle {
  width: 100%;
}

.team-microcopy {
  margin: 0;
  font-size: 12px;
  color: var(--color-ink-muted);
}

.ai-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-sm);
}

.ai-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.team-ai-summary,
.team-human-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.team-human-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.draft-placeholder {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-canvas);
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

.course-length {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
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

.setup-summary-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-ink-muted);
  font-weight: 600;
}

.setup-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  text-align: center;
  color: var(--color-danger);
  margin-top: var(--space-sm);
}

.setup-warning--ok {
  color: var(--color-success);
}

/* Race sections */
.race-config-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.race-placeholder {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
  background-color: var(--color-canvas);
  color: var(--color-ink-muted);
  font-family: var(--font-ui);
  font-size: 12px;
}

.race-summary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-chip);
  background-color: var(--color-canvas);
  color: var(--color-ink-soft);
  font-family: var(--font-ui);
  font-size: 12px;
  width: fit-content;
}

@media (max-width: 900px) {
  .setup-stepper {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .setup-panel {
    padding: var(--space-lg);
  }

  .setup-stepper {
    grid-template-columns: 1fr;
  }

  .teams-grid {
    grid-template-columns: 1fr;
  }

  .draft-placeholder {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
