<template>
  <div class="setup-screen">
    <div class="setup-panel">
      <!-- Header -->
      <RaceHeader :title="raceHeaderTitle" :subtitle="raceHeaderSubtitle" :theme="raceHeaderTheme">
        <template #actions>
          <button
            type="button"
            class="btn btn-ghost btn-sm rules-trigger"
            aria-label="Ouvrir les règles"
            @click="openRules"
          >
            <UIIcon type="book" size="sm" />
            Règles
          </button>
        </template>
      </RaceHeader>

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
              <h2 class="setup-step-title">Profil</h2>
              <p class="setup-step-subtitle">Type de course et parcours.</p>
            </div>
          </div>
          <div class="setup-step-controls">
            <button
              type="button"
              class="btn btn-ghost btn-sm step-help"
              aria-label="Aide profil"
              @click="openHelp(1)"
            >
              <UIIcon type="info" size="sm" />
              Infos
            </button>
            <button v-if="activeStep !== 1" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(1)">
              Modifier
            </button>
          </div>
        </header>
        <div v-show="activeStep === 1" class="setup-step-body">
          <div class="setup-step-summary">
            <span class="setup-step-summary__label">Résumé</span>
            <span class="setup-step-summary__text">{{ profileSummary }}</span>
          </div>
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

          <div class="setup-step-actions">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="!isRaceConfigComplete"
              @click="confirmStep(1)"
            >
              Continuer
            </button>
          </div>
        </div>
      </section>

      <!-- Step 2: Teams -->
      <section ref="teamsStepRef" class="setup-step" :class="getStepClass(2)">
        <header class="setup-step-header">
          <div class="setup-step-heading">
            <span class="setup-step-index">2</span>
            <div>
              <h2 class="setup-step-title">Équipes</h2>
              <p class="setup-step-subtitle">Effectifs, noms, composition du peloton.</p>
            </div>
          </div>
          <div class="setup-step-controls">
            <button
              type="button"
              class="btn btn-ghost btn-sm step-help"
              aria-label="Aide équipes"
              @click="openHelp(2)"
            >
              <UIIcon type="info" size="sm" />
              Infos
            </button>
            <button v-if="activeStep !== 2" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(2)">
              Modifier
            </button>
          </div>
        </header>
        <div v-show="activeStep === 2" class="setup-step-body">
          <div class="setup-step-summary">
            <span class="setup-step-summary__label">Résumé</span>
            <span class="setup-step-summary__text">{{ teamsSummary }}</span>
          </div>
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
                  <span class="team-setup-meta">{{ player.playerType === 'human' ? 'Humain' : 'IA' }}</span>
                </div>
              </div>

              <div class="team-setup-body">
                <div class="team-name-field">
                  <label class="type-caption" :for="`team-name-${player.teamId}`">Nom d'équipe</label>
                  <input
                    :id="`team-name-${player.teamId}`"
                    v-model="player.customName"
                    type="text"
                    class="input input-sm"
                    :placeholder="getTeamDefaultName(player.teamId)"
                    maxlength="24"
                    @input="updatePlayer(index)"
                    @blur="sanitizeTeamName(index)"
                  />
                </div>
                <div class="segmented segmented--stretch team-toggle">
                  <button
                    type="button"
                    class="segmented-item"
                    :class="{ 'segmented-item-active': player.playerType === 'ai' }"
                    @click="setPlayerType(index, PlayerType.AI)"
                  >
                    IA
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
                </div>
              </div>
            </div>
          </div>

          <div class="setup-step-actions">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="!isTeamsReady"
              @click="confirmStep(2)"
            >
              Continuer
            </button>
          </div>
        </div>
      </section>

      <!-- Step 3: Draft -->
      <section ref="draftStepRef" class="setup-step" :class="getStepClass(3)">
        <header class="setup-step-header">
          <div class="setup-step-heading">
            <span class="setup-step-index">3</span>
            <div>
              <h2 class="setup-step-title">Coureurs</h2>
              <p class="setup-step-subtitle">Le train et les leaders.</p>
            </div>
          </div>
          <div class="setup-step-controls">
            <button
              type="button"
              class="btn btn-ghost btn-sm step-help"
              aria-label="Aide coureurs"
              @click="openHelp(3)"
            >
              <UIIcon type="info" size="sm" />
              Infos
            </button>
            <button v-if="activeStep !== 3" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(3)">
              Modifier
            </button>
          </div>
        </header>
        <div v-show="activeStep === 3" class="setup-step-body">
          <div class="setup-step-summary">
            <span class="setup-step-summary__label">Résumé</span>
            <span class="setup-step-summary__text">{{ draftSummary }}</span>
          </div>
          <div v-if="manualDraftTeamIds.length === 0" class="draft-placeholder">
            <UIIcon type="ai" size="sm" />
            <div>
              <p>Auto-sélection active pour les équipes IA.</p>
              <p class="type-caption">Passez une équipe en Humain pour composer.</p>
            </div>
            <div class="draft-placeholder-actions">
              <button type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(2)">
                Modifier
              </button>
              <button type="button" class="btn btn-primary btn-sm" @click="confirmStep(3)">
                Continuer
              </button>
            </div>
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
            @confirm="confirmStep(3)"
          />
          <div v-if="manualDraftTeamIds.length > 0" class="setup-step-actions">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="!isDraftReady"
              @click="confirmStep(3)"
            >
              Continuer
            </button>
          </div>
        </div>
      </section>

      <!-- Step 4: Launch -->
      <section ref="launchStepRef" class="setup-step" :class="getStepClass(4)">
        <header class="setup-step-header">
          <div class="setup-step-heading">
            <span class="setup-step-index">4</span>
            <div>
              <h2 class="setup-step-title">Départ</h2>
              <p class="setup-step-subtitle">Brief, options finales.</p>
            </div>
          </div>
          <div class="setup-step-controls">
            <button
              type="button"
              class="btn btn-ghost btn-sm step-help"
              aria-label="Aide départ"
              @click="openHelp(4)"
            >
              <UIIcon type="info" size="sm" />
              Infos
            </button>
            <button v-if="activeStep !== 4" type="button" class="btn btn-ghost btn-sm" @click="setActiveStep(4)">
              Ouvrir
            </button>
          </div>
        </header>
        <div v-show="activeStep === 4" class="setup-step-body">
          <div class="setup-step-summary">
            <span class="setup-step-summary__label">Résumé</span>
            <span class="setup-step-summary__text">{{ launchSummary }}</span>
          </div>
          <div class="start-panel">
            <div class="start-panel__summary">
              <span class="start-panel__label">Brief DS</span>
              <span class="start-panel__text">: {{ briefSummary }}</span>
            </div>

            <div class="start-panel__body">
              <ul class="start-panel__checklist">
                <li
                  v-for="item in startChecklist"
                  :key="item.label"
                  class="start-panel__checklist-item"
                  :class="{ 'start-panel__checklist-item--ok': item.ok }"
                >
                  <span class="start-panel__checklist-label">
                    <UIIcon :type="item.ok ? 'check' : 'warning'" size="sm" />
                    {{ item.label }}
                  </span>
                  <span
                    class="start-panel__checklist-status"
                    :class="{ 'start-panel__checklist-status--ok': item.ok }"
                  >
                    {{ item.ok ? 'Validé' : 'À caler' }}
                  </span>
                </li>
              </ul>

              <div class="start-panel__cta">
                <button
                  class="btn btn-primary btn-lg start-panel__cta-button"
                  @click="startGame"
                  :disabled="!canStart"
                >
                  <UIIcon type="finish" size="sm" />
                  Lancer la course
                </button>
                <p class="start-panel__hint type-caption">
                  {{ canStart ? 'Derniers réglages validés.' : 'Complète les étapes 1–3.' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <MobileStickyCTA
      :label="mobileCtaLabel"
      :disabled="mobileCtaDisabled"
      :hint="mobileCtaHint"
      :actions="mobileCtaActions"
      @click="handleMobileCta"
      @action="handleMobileAction"
    />
    <RulesModal v-model="isRulesOpen" />
    <StepHelpModal
      v-model="isHelpOpen"
      :title="activeHelp.title"
      :body="activeHelp.body"
      :bullets="activeHelp.bullets"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, reactive } from 'vue';
import { PlayerType, AIDifficulty, TeamConfigs, getTeamIds, createPlayerConfig } from '../core/teams.js';
import { AIPersonality } from '../core/ai.js';
import RiderToken from './RiderToken.vue';
import { UIIcon } from './icons';
import RaceTypeSelector from './RaceTypeSelector.vue';
import ClassicRaceSelector from './ClassicRaceSelector.vue';
import StageRaceConfigurator from './StageRaceConfigurator.vue';
import DraftRosterSection from './DraftRosterSection.vue';
import RaceHeader from './RaceHeader.vue';
import RulesModal from './RulesModal.vue';
import StepHelpModal from './StepHelpModal.vue';
import MobileStickyCTA from './MobileStickyCTA.vue';
import { getClassicPreset, StageRaceConfig } from '../config/race-presets.js';
import { UIConfig, getRaceHeaderTitle } from '../config/ui.config.js';
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
const stepConfirmed = reactive({ step1: false, step2: false, step3: false });
const raceStepRef = ref(null);
const teamsStepRef = ref(null);
const draftStepRef = ref(null);
const launchStepRef = ref(null);
const riderPool = ref([]);
const teamRosters = ref({});
const activeDraftTeamId = ref(null);
const riderPoolIndex = new Map(RiderPool.map((rider, index) => [rider.id, index]));
const raceHeaderTitle = getRaceHeaderTitle(UIConfig.titleVariant);
const raceHeaderSubtitle = UIConfig.subtitle;
const raceHeaderTheme = UIConfig.raceTheme;
const isRulesOpen = ref(false);
const isHelpOpen = ref(false);
const activeHelpStep = ref(1);

const stepHelpContent = {
  1: {
    title: 'Profil',
    body: 'Choisis le format et le parcours avant de lancer.',
    bullets: [
      'Classique (1 jour) : une arrivée, décision rapide.',
      'Course à étapes : gestion et régularité.',
      'Parcours et distance fixent le tempo.'
    ]
  },
  2: {
    title: 'Équipes',
    body: 'Configure le peloton et les équipes en jeu.',
    bullets: [
      'Nombre d’équipes et noms.',
      'Humain ou IA, avec niveau et style.',
      'Au moins un joueur humain.'
    ]
  },
  3: {
    title: 'Coureurs',
    body: 'Compose tes leaders et ton train.',
    bullets: [
      '5 profils requis (Grimpeur, Puncheur, Rouleur, Sprinteur, Polyvalent).',
      'Budget limité, une sélection par rôle.',
      'Valide quand le roster est complet.'
    ]
  },
  4: {
    title: 'Départ',
    body: 'Derniers réglages avant le départ.',
    bullets: [
      'Brief DS clair et cohérent.',
      'Équipes et coureurs alignés.',
      'Lancer quand tout est calé.'
    ]
  }
};

const activeHelp = computed(() => stepHelpContent[activeHelpStep.value] || stepHelpContent[1]);

function openRules() {
  isRulesOpen.value = true;
}

function openHelp(step) {
  activeHelpStep.value = step;
  isHelpOpen.value = true;
}

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
      customName: getTeamDefaultName(teamId),
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

function getTeamDefaultName(teamId) {
  return TeamConfigs[teamId]?.name || 'Équipe';
}

function getTeamLabel(teamId) {
  const player = getPlayerByTeamId(teamId);
  const customName = player?.customName?.trim();
  if (customName) return customName;
  return TeamConfigs[teamId]?.name || player?.name || teamId;
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
  resetSteps(3);
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
  resetSteps(3);
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
  resetSteps(3);
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
  resetSteps(2);
  initializePlayers();
}

function setPlayerType(index, type) {
  const player = players.value[index];
  if (!player || player.playerType === type) return;
  resetSteps(2);
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

function sanitizeTeamName(index) {
  const player = players.value[index];
  if (!player) return;
  const trimmed = player.customName?.trim().slice(0, 24) || '';
  player.customName = trimmed || getTeamDefaultName(player.teamId);
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
const isDraftReady = computed(() =>
  manualDraftTeamIds.value.length === 0 || isDraftComplete.value
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
  if (!raceType.value) return 'À caler : format.';
  if (isClassicRace.value && !selectedClassic.value) return 'À caler : parcours.';
  if (isStageRace.value && !isStageConfigComplete.value) {
    return 'À caler : étapes, profil.';
  }
  if (!isDraftComplete.value) {
    const teamId = incompleteDraftTeam.value;
    const count = getRoster(teamId).length;
    return `À caler : coureurs (${count}/${DraftConfig.rosterSize}).`;
  }
  return '';
});

const canStart = computed(() => startWarning.value === '');

const isTeamsReady = computed(() => humanCount.value > 0);

const briefSummary = computed(() => {
  const teamLabel = `${numTeams.value} équipe${numTeams.value > 1 ? 's' : ''} (${humanCount.value} humain${humanCount.value > 1 ? 's' : ''}, ${aiCount.value} IA)`;
  if (isClassicRace.value) {
    const raceName = selectedClassicPreset.value?.name || 'Classique';
    return `Classique • ${raceName} • ${teamLabel}`;
  }
  if (isStageRace.value) {
    const stagesLabel = stageConfig.value?.numStages ? `${stageConfig.value.numStages} étapes` : 'Étapes';
    const profileName = StageRaceConfig.profiles[stageConfig.value?.profile]?.name || 'Profil';
    return `Course à étapes • ${stagesLabel} • ${profileName} • ${teamLabel}`;
  }
  return `Course • ${teamLabel}`;
});

const startChecklist = computed(() => [
  { label: 'Profil', ok: stepConfirmed.step1 },
  { label: 'Équipes', ok: stepConfirmed.step2 },
  { label: 'Coureurs', ok: stepConfirmed.step3 }
]);

const profileSummary = computed(() => {
  if (isClassicRace.value) {
    const raceName = selectedClassicPreset.value?.name || 'Parcours à caler';
    return `Classique · ${raceName} · ${courseLength.value} cases`;
  }
  if (isStageRace.value) {
    const stages = stageConfig.value?.numStages ? `${stageConfig.value.numStages} étapes` : 'Étapes à caler';
    const profileName = StageRaceConfig.profiles[stageConfig.value?.profile]?.name || 'Profil à caler';
    return `Course à étapes · ${stages} · ${profileName} · ${courseLength.value} cases`;
  }
  return 'Profil à caler';
});

const teamsSummary = computed(() => {
  const teamLabel = `${numTeams.value} équipe${numTeams.value > 1 ? 's' : ''}`;
  return `${teamLabel} (${humanCount.value} humain${humanCount.value > 1 ? 's' : ''}, ${aiCount.value} IA)`;
});

const draftSummary = computed(() => {
  if (manualDraftTeamIds.value.length === 0) return 'Auto-sélection IA';
  const teamId = activeManualTeamId.value || manualDraftTeamIds.value[0];
  if (!teamId) return `Coureurs 0/${DraftConfig.rosterSize}`;
  const count = getRoster(teamId).length;
  return `${count}/${DraftConfig.rosterSize} · Budget ${getTeamBudgetTotal(teamId)}`;
});

const launchSummary = computed(() => (canStart.value ? 'Brief prêt' : 'Derniers réglages'));


const stepItems = computed(() => [
  {
    id: 1,
    title: 'Profil',
    status: stepConfirmed.step1
      ? 'Validé'
      : (isRaceConfigComplete.value ? 'Verrouillé' : 'À caler'),
    complete: stepConfirmed.step1,
    locked: false
  },
  {
    id: 2,
    title: 'Équipes',
    status: stepConfirmed.step2
      ? 'Validé'
      : (isTeamsReady.value ? 'Verrouillé' : 'À caler'),
    complete: stepConfirmed.step2,
    locked: !stepConfirmed.step1
  },
  {
    id: 3,
    title: 'Coureurs',
    status: stepConfirmed.step3
      ? 'Validé'
      : (isDraftReady.value ? 'Verrouillé' : 'Sélection'),
    complete: stepConfirmed.step3,
    locked: !stepConfirmed.step2
  },
  {
    id: 4,
    title: 'Départ',
    status: canStart.value ? 'Verrouillé' : 'Derniers réglages',
    complete: false,
    locked: !stepConfirmed.step3
  }
]);

const mobileCtaLabel = computed(() => (activeStep.value === 4 ? 'Lancer la course' : 'Continuer'));
const mobileCtaDisabled = computed(() => {
  if (activeStep.value === 1) return !isRaceConfigComplete.value;
  if (activeStep.value === 2) return !isTeamsReady.value;
  if (activeStep.value === 3) return !isDraftReady.value;
  if (activeStep.value === 4) return !canStart.value;
  return true;
});
const mobileCtaHint = computed(() => {
  if (activeStep.value !== 4) return '';
  return canStart.value ? 'Derniers réglages validés.' : 'Complète les étapes 1–3.';
});

const mobileCtaActions = computed(() => [
  { id: 'rules', label: 'Règles', icon: 'book', ariaLabel: 'Ouvrir les règles' }
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

function confirmStep(step) {
  if (step === 1 && isRaceConfigComplete.value) {
    stepConfirmed.step1 = true;
    activeStep.value = 2;
    scrollToSection(teamsStepRef);
  }
  if (step === 2 && isTeamsReady.value) {
    stepConfirmed.step2 = true;
    activeStep.value = 3;
    scrollToSection(draftStepRef);
  }
  if (step === 3 && isDraftReady.value) {
    stepConfirmed.step3 = true;
    activeStep.value = 4;
    scrollToSection(launchStepRef);
  }
}

function handleMobileAction(actionId) {
  if (actionId === 'rules') {
    openRules();
  }
}

function resetSteps(fromStep) {
  if (fromStep <= 1) stepConfirmed.step1 = false;
  if (fromStep <= 2) stepConfirmed.step2 = false;
  if (fromStep <= 3) stepConfirmed.step3 = false;
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

watch([raceType, selectedClassic, courseLength, () => stageConfig.value?.numStages, () => stageConfig.value?.profile], () => {
  resetSteps(1);
});

watch(manualDraftTeamIds, (teamIds) => {
  if (!teamIds.includes(activeDraftTeamId.value)) {
    activeDraftTeamId.value = teamIds[0] || null;
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

function handleMobileCta() {
  if (activeStep.value === 4) {
    startGame();
  } else {
    confirmStep(activeStep.value);
  }
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
  position: relative;
  --color-accent: var(--race-yellow);
  --color-accent-hover: color-mix(in srgb, var(--race-yellow) 86%, #000 14%);
  --color-accent-active: color-mix(in srgb, var(--race-yellow) 72%, #000 28%);
  --color-accent-light: color-mix(in srgb, var(--race-yellow) 16%, transparent);
}

.setup-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E");
  opacity: 0.4;
  pointer-events: none;
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
  position: relative;
  z-index: 1;
  --sp-text-strong: #1f2328;
  --sp-text-secondary: #4b525b;
  --sp-text-muted: #6b7280;
  --sp-border: rgba(31, 35, 40, 0.14);
  --sp-border-soft: rgba(31, 35, 40, 0.08);
  --sp-header-bg: color-mix(in srgb, var(--color-paper) 82%, white);
  --sp-summary-bg: rgba(31, 35, 40, 0.04);
  background-image:
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 245, 239, 0.9)),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
  border: 1px solid var(--sp-border-soft);
}

.setup-screen :deep(.btn-primary) {
  color: #2f2418;
}

.setup-panel :deep(.form-label) {
  font-size: 14px;
  font-weight: 600;
  color: var(--sp-text-strong);
}

.setup-panel :deep(.form-hint) {
  color: var(--sp-text-secondary);
}

.setup-stepper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-sm);
}

.rules-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--sp-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
  transition: var(--transition-fast);
}

.stepper-item--active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-light);
  background: color-mix(in srgb, var(--color-accent) 10%, white);
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
  background: var(--color-paper);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  color: var(--sp-text-strong);
}

.stepper-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stepper-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sp-text-strong);
}

.stepper-status {
  font-size: 11px;
  color: var(--sp-text-secondary);
}

.stepper-check {
  margin-left: auto;
  color: var(--color-success);
}

.setup-step {
  border: 1px solid var(--sp-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  scroll-margin-top: var(--space-xl);
  background: var(--color-surface);
}

.setup-step--locked {
  opacity: 0.6;
}

.setup-step--active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.setup-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--sp-header-bg);
  border-bottom: 1px solid var(--sp-border);
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
  font-size: clamp(18px, 2.2vw, 22px);
  font-weight: 700;
  color: var(--sp-text-strong);
}

.setup-step-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-secondary);
}

.setup-step-controls {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.step-help {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
}

.setup-step-controls .btn {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.setup-step-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.setup-step-summary {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--sp-border-soft);
  border-radius: var(--radius-md);
  background: var(--sp-summary-bg);
  font-size: 13px;
  color: var(--sp-text-strong);
}

.setup-step-summary__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--sp-text-muted);
  font-weight: 600;
}

.setup-step-summary__text {
  font-size: 13px;
  color: var(--sp-text-strong);
  font-weight: 600;
}

.setup-step-actions {
  display: flex;
  justify-content: flex-end;
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

.team-name-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
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

.draft-placeholder-actions {
  display: flex;
  gap: var(--space-sm);
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
.start-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-line);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(245, 241, 234, 0.85));
  box-shadow: var(--shadow-sm);
}

.start-panel__summary {
  font-size: 13px;
  color: var(--color-ink-soft);
}

.start-panel__label {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-ink);
}

.start-panel__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-lg);
  align-items: center;
}

.start-panel__checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  padding: 0;
}

.start-panel__checklist-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.03);
  font-size: 12px;
  color: var(--color-ink-muted);
}

.start-panel__checklist-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 500;
}

.start-panel__checklist-item--ok {
  background: rgba(58, 164, 98, 0.08);
  color: var(--color-ink);
}

.start-panel__checklist-status {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-ink-muted);
}

.start-panel__checklist-status--ok {
  color: var(--color-success);
}

.start-panel__cta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
}

.start-panel__cta-button {
  min-width: 230px;
  font-weight: 600;
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(31, 35, 40, 0.12);
}

.start-panel__hint {
  margin: 0;
  color: var(--color-ink-muted);
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
  border: 1px solid var(--sp-border-soft);
  border-radius: var(--radius-chip);
  background-color: var(--sp-summary-bg);
  color: var(--sp-text-secondary);
  font-family: var(--font-ui);
  font-size: 12px;
  width: fit-content;
}

@media (max-width: 900px) {
  .setup-stepper {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .setup-stepper {
    position: sticky;
    top: var(--space-lg);
    z-index: 6;
  }
}

@media (max-width: 720px) {
  .setup-screen {
    display: block;
    padding-bottom: calc(var(--space-2xl) + 120px);
  }

  .setup-panel {
    gap: var(--space-md);
  }

  :deep(.race-header) {
    padding: var(--space-sm);
  }

  :deep(.race-header__title) {
    font-size: 20px;
    line-height: 24px;
  }

  :deep(.race-header__eyebrow) {
    display: none;
  }

  :deep(.race-header__subtitle) {
    font-size: 12px;
    margin-top: 4px;
  }

  :deep(.race-header__ornament) {
    display: none;
  }

  .setup-stepper {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    position: sticky;
    top: calc(var(--space-xs) + env(safe-area-inset-top));
    z-index: 8;
    background: var(--color-surface);
    padding: 6px;
    border-radius: var(--radius-md);
    box-shadow: 0 6px 14px rgba(31, 35, 40, 0.08);
  }

  .stepper-item {
    min-width: 120px;
    padding: 6px 10px;
  }

  .stepper-index {
    width: 22px;
    height: 22px;
    font-size: 11px;
  }

  .stepper-title {
    font-size: 12px;
  }

  .stepper-status {
    font-size: 10px;
  }

  .setup-step-actions {
    display: none;
  }

  .draft-placeholder-actions {
    display: none;
  }

  :deep(.draft-sticky-cta) {
    display: none;
  }

  .start-panel__cta {
    display: none;
  }

  :deep(.draft-sticky-summary) {
    bottom: calc(var(--space-md) + 120px);
  }
}

@media (max-width: 600px) {
  .setup-panel {
    padding: var(--space-lg);
  }

  .teams-grid {
    grid-template-columns: 1fr;
  }

  .draft-placeholder {
    flex-direction: column;
    align-items: flex-start;
  }

  .start-panel__body {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .start-panel__cta {
    align-items: stretch;
  }

  .start-panel__cta-button {
    width: 100%;
  }
}
</style>
