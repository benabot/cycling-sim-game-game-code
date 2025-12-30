<!--
  StageRaceConfigurator.vue - Configure a stage race (steps + profile)
  v5.0 - Phase 3
-->
<template>
  <section class="stage-race-configurator">
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
              `profile-card--${profile.id}`,
              { 'selection-card--selected': selectedProfile === profile.id }
            ]"
            @click="updateProfile(profile.id)"
          >
            <div class="profile-card__header">
              <div class="profile-card__titles">
                <h3 class="profile-card__title">{{ profile.name }}</h3>
              </div>
            </div>

            <div v-if="selectedProfile === profile.id" class="profile-card__check">
              <UIIcon type="check" size="sm" />
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import { StageRaceConfig, StageRaceProfile } from '../config/race-presets.js';

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
</script>

<style scoped>
.stage-race-configurator {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
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
  min-height: 96px;
  position: relative;
  overflow: hidden;
}

.profile-card__header {
  display: flex;
  align-items: center;
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
  color: var(--sp-text-strong, var(--color-ink));
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
  z-index: 2;
}

@media (max-width: 840px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
