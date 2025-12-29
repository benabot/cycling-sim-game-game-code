<!--
  StageRaceConfigurator.vue - Configure a stage race (steps + profile)
  v5.0 - Phase 3
-->
<template>
  <section class="stage-race-configurator">
    <header class="race-section-header">
      <div class="race-section-header__icon">
        <UIIcon type="calendar" size="md" />
      </div>
      <div class="race-section-header__content">
        <h2 class="race-section-header__title">Plan de course</h2>
        <p class="race-section-header__subtitle">Étapes et profil.</p>
      </div>
    </header>

    <div class="stage-race-configurator__controls">
      <div class="form-group">
        <label class="form-label">Étapes</label>
        <div class="segmented segmented--stretch">
          <button
            v-for="option in stageOptions"
            :key="option"
            type="button"
            class="segmented-item"
            :class="{ 'segmented-item-active': selectedNumStages === option }"
            @click="updateNumStages(option)"
          >
            {{ option }} étapes
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Profil</label>
        <div class="profile-grid">
          <button
            v-for="profile in profileOptions"
            :key="profile.id"
            type="button"
            :class="[
              'selection-card',
              'profile-card',
              { 'selection-card--selected': selectedProfile === profile.id }
            ]"
            @click="updateProfile(profile.id)"
          >
            <div class="profile-card__header">
              <div class="profile-card__icon">
                <UIIcon :type="profile.icon" size="md" />
              </div>
              <div class="profile-card__titles">
                <h3 class="profile-card__title">{{ profile.name }}</h3>
                <p class="profile-card__description">{{ profile.description }}</p>
                <div class="profile-card__profile">
                  <svg class="profile-line profile-line--sm" viewBox="0 0 100 24" aria-hidden="true">
                    <path :d="getProfilePath(profile.profile)" class="profile-line__path" />
                  </svg>
                  <span class="profile-card__narrative">{{ profile.narrative }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedProfile === profile.id" class="profile-card__check">
              <UIIcon type="check" size="sm" />
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="stage-race-configurator__preview">
      <div class="preview-header">
        <div class="preview-header__title">
          <UIIcon type="info" size="sm" />
          <span>Aperçu</span>
        </div>
        <span v-if="isConfigComplete" class="preview-header__summary">
          {{ selectedNumStages }} étapes • {{ selectedProfileName }}
        </span>
      </div>

      <div v-if="isConfigComplete" class="preview-grid">
        <StagePreview
          v-for="stage in stageProgram"
          :key="stage.number"
          :stage="stage"
          :length="stageLength"
        />
      </div>
      <div v-else class="preview-placeholder">
        <UIIcon type="cursor" size="sm" />
        <span>Choisissez des étapes et un profil.</span>
      </div>
    </div>

    <div class="stage-race-configurator__rules">
      <UIIcon type="trophy" size="sm" />
      <span>Classement général : retards cumulés (10 s / case)</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import StagePreview from './StagePreview.vue';
import { StageRaceConfig, StageRaceProfile, generateStageProgram } from '../config/race-presets.js';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ numStages: null, profile: null })
  },
  stageLength: {
    type: Number,
    default: 80
  }
});

const emit = defineEmits(['update:modelValue']);

const stageOptions = StageRaceConfig.stageOptions;
const profileOptions = computed(() => Object.values(StageRaceConfig.profiles));

const currentValue = computed(() => ({
  numStages: props.modelValue?.numStages ?? null,
  profile: props.modelValue?.profile ?? null
}));

const selectedNumStages = computed(() => currentValue.value.numStages);
const selectedProfile = computed(() => currentValue.value.profile);
const selectedProfileName = computed(() => {
  if (!selectedProfile.value) return '';
  return StageRaceConfig.profiles[selectedProfile.value]?.name || '';
});

const isConfigComplete = computed(() => !!selectedNumStages.value && !!selectedProfile.value);

const stageProgram = computed(() => {
  if (!isConfigComplete.value) return [];
  return generateStageProgram(selectedNumStages.value, selectedProfile.value);
});

function updateNumStages(value) {
  emit('update:modelValue', {
    ...currentValue.value,
    numStages: value
  });
}

function updateProfile(value) {
  emit('update:modelValue', {
    ...currentValue.value,
    profile: value || StageRaceProfile.BALANCED
  });
}

function getProfilePath(profile = []) {
  const points = profile.length ? profile : [0.2, 0.4, 0.3, 0.5, 0.2];
  const width = 100;
  const height = 20;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((value, index) => {
    const x = index * step;
    const y = height - Math.max(0, Math.min(1, value)) * height;
    return `${x} ${y}`;
  });
  return `M ${coords.join(' L ')}`;
}
</script>

<style scoped>
.stage-race-configurator {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.race-section-header__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.race-section-header__subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--color-ink-muted);
}

.stage-race-configurator__controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.segmented--stretch {
  display: flex;
}

.segmented--stretch .segmented-item {
  flex: 1;
  justify-content: center;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.profile-card {
  gap: var(--space-sm);
  min-height: 140px;
}

.profile-card__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.profile-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background-color: var(--color-paper);
  border-radius: var(--radius-md);
  color: var(--color-ink-soft);
  flex-shrink: 0;
}

.selection-card--selected .profile-card__icon {
  background-color: var(--color-accent);
  color: white;
}

.profile-card__titles {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.profile-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-ink);
}

.profile-card__description {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-muted);
}

.profile-card__profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.profile-line--sm {
  width: 100%;
  height: 24px;
}

.profile-line__path {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.profile-card__narrative {
  font-size: 11px;
  color: var(--color-ink-muted);
}

.profile-card__check {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-accent);
  color: white;
  border-radius: 50%;
}

.stage-race-configurator__preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background-color: var(--color-canvas);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-line);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.preview-header__title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink);
}

.preview-header__summary {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-ink-muted);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-sm);
}

.preview-placeholder {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-ink-muted);
}

.stage-race-configurator__rules {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 1px dashed var(--color-line-strong);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-ink-soft);
  width: fit-content;
}

@media (max-width: 840px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
