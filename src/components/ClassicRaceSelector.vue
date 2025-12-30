<!--
  ClassicRaceSelector.vue - Grid of 4 classic race presets
  v5.0 - Phase 2
  
  Usage:
  <ClassicRaceSelector v-model="selectedClassic" />
-->
<template>
  <section class="classic-selector">
    <!-- Section Header -->
    <header class="section-header">
      <div class="section-header__icon">
        <UIIcon type="laurel" size="md" />
      </div>
      <div class="section-header__content">
        <h2 class="section-header__title">Parcours</h2>
        <p class="section-header__subtitle">Sélectionnez un profil.</p>
      </div>
    </header>
    
    <!-- Classics Grid -->
    <div class="classic-selector__grid">
      <button
        v-for="classic in classics"
        :key="classic.id"
        type="button"
        :class="[
          'classic-card',
          `classic-card--${classic.id}`,
          { 'classic-card--selected': modelValue === classic.id }
        ]"
        @click="$emit('update:modelValue', classic.id)"
      >
        <span
          class="classic-card__illustration"
          :class="`classic-card__illustration--${classic.id}`"
          aria-hidden="true"
        ></span>
        <!-- Header with difficulty -->
        <div class="classic-card__header">
          <span :class="['classic-card__difficulty', `classic-card__difficulty--${classic.difficulty}`]">
            {{ classic.difficultyLabel }}
          </span>
        </div>
        
        <!-- Name and subtitle -->
        <h3 class="classic-card__name">{{ classic.name }}</h3>
        <p class="classic-card__subtitle">{{ classic.subtitle }}</p>
        
        <!-- Description -->
        <p class="classic-card__description">{{ classic.description }}</p>

        <!-- Profile + narrative -->
        <div class="classic-card__profile">
          <svg class="profile-line" viewBox="0 0 100 28" aria-hidden="true">
            <path :d="getProfilePath(classic.profile)" class="profile-line__path" />
          </svg>
          <span class="classic-card__narrative">{{ classic.narrative }}</span>
        </div>
        
        <!-- Advantage badge -->
        <div class="classic-card__advantage">
          <RiderIcon :type="classic.advantage" size="sm" />
          <span>Avantage {{ classic.advantageLabel }}</span>
        </div>
        
        <!-- Terrain distribution preview -->
        <div class="classic-card__terrain">
          <div 
            v-for="(percent, terrain) in classic.distribution" 
            :key="terrain"
            class="classic-card__terrain-bar"
            :class="`classic-card__terrain-bar--${terrain}`"
            :style="{ width: percent + '%' }"
            :title="`${getTerrainName(terrain)}: ${percent}%`"
          ></div>
        </div>
        
        <!-- Selection indicator -->
        <div class="classic-card__check" v-if="modelValue === classic.id">
          <UIIcon type="check" size="sm" />
        </div>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import RiderIcon from './icons/RiderIcon.vue';
import { getAllClassicPresets } from '../config/race-presets.js';
import { TerrainConfig } from '../core/terrain.js';

defineProps({
  modelValue: {
    type: String,
    default: null
  }
});

defineEmits(['update:modelValue']);

const classics = computed(() => getAllClassicPresets());

function getTerrainName(terrain) {
  return TerrainConfig[terrain]?.name || terrain;
}

function getProfilePath(profile = []) {
  const points = profile.length ? profile : [0.2, 0.4, 0.3, 0.5, 0.2];
  const width = 100;
  const height = 24;
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
.classic-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-line);
}

.section-header__icon {
  color: var(--color-ink-soft);
}

.section-header__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-header__title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.section-header__subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--color-ink-muted);
}

/* Grid */
.classic-selector__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

@media (max-width: 800px) {
  .classic-selector__grid {
    grid-template-columns: 1fr;
  }

  .classic-card__illustration {
    width: 96px;
    height: 56px;
    opacity: 0.06;
  }
}

/* Classic Card */
.classic-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background-color: var(--color-surface);
  border: 2px solid var(--color-line);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
  overflow: hidden;
}

.classic-card > * {
  position: relative;
  z-index: 1;
}

.classic-card:hover {
  border-color: var(--color-line-strong);
  background-color: var(--color-paper);
}

.classic-card--selected {
  border-color: var(--color-accent);
  background-color: rgba(59, 130, 246, 0.04);
}

.classic-card--selected:hover {
  border-color: var(--color-accent);
}

/* Header */
.classic-card__header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: var(--space-xs);
}

/* Difficulty badge */
.classic-card__difficulty {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-chip);
}

.classic-card__difficulty--hard {
  background-color: color-mix(in srgb, var(--race-yellow) 20%, white);
  color: #8a6a14;
}

.classic-card__difficulty--medium {
  background-color: color-mix(in srgb, var(--race-sky) 20%, white);
  color: #4b5b6d;
}

.classic-card__difficulty--fast {
  background-color: color-mix(in srgb, var(--race-road) 25%, white);
  color: #5f5243;
}

.classic-card__difficulty--balanced {
  background-color: color-mix(in srgb, var(--race-sky) 18%, white);
  color: #3f4b5c;
}

/* Name and subtitle */
.classic-card__name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.classic-card__subtitle {
  font-family: var(--font-ui);
  font-size: 12px;
  font-style: italic;
  color: var(--color-muted);
  margin: 0;
}

/* Description */
.classic-card__description {
  font-family: var(--font-ui);
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-ink-soft);
  margin: var(--space-xs) 0;
}

.classic-card__illustration {
  position: absolute;
  inset: 10px 16px auto auto;
  width: 120px;
  height: 70px;
  opacity: 0.08;
  background-repeat: no-repeat;
  background-position: right top;
  background-size: contain;
  pointer-events: none;
  z-index: 0;
}

.classic-card__illustration--ardennaise {
  background-image: url("data:image/svg+xml,%3Csvg width='160' height='90' viewBox='0 0 160 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 70c14-10 24-8 36-22 12-14 22-8 34-18 12-10 22-6 34-16 12-10 26-10 42-18' stroke='%23666666' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='46' cy='48' r='3' fill='%23666666'/%3E%3Ccircle cx='92' cy='28' r='3' fill='%23666666'/%3E%3C/svg%3E");
}

.classic-card__illustration--lombarde {
  background-image: url("data:image/svg+xml,%3Csvg width='160' height='90' viewBox='0 0 160 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 78l34-48 30 40 30-58 36 66' stroke='%23666666' stroke-width='3' fill='none' stroke-linejoin='round'/%3E%3Cpath d='M44 30h14' stroke='%23666666' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E");
}

.classic-card__illustration--riviera {
  background-image: url("data:image/svg+xml,%3Csvg width='160' height='90' viewBox='0 0 160 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 40h120' stroke='%23666666' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M32 50h92' stroke='%23666666' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M110 32l10 8-10 8' stroke='%23666666' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
}

.classic-card__illustration--nord {
  background-image: url("data:image/svg+xml,%3Csvg width='160' height='90' viewBox='0 0 160 90' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='18' y='26' width='124' height='38' rx='6' fill='none' stroke='%23666666' stroke-width='3'/%3E%3Cpath d='M42 26v38M68 26v38M94 26v38M120 26v38' stroke='%23666666' stroke-width='2'/%3E%3C/svg%3E");
}

.classic-card__profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.profile-line {
  width: 100%;
  height: 28px;
}

.profile-line__path {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.classic-card__narrative {
  font-size: 12px;
  color: var(--color-ink-muted);
}

/* Advantage badge */
.classic-card__advantage {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background-color: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-chip);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-ink-soft);
  width: fit-content;
}

/* Terrain distribution bar */
.classic-card__terrain {
  display: flex;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background-color: rgba(31, 35, 40, 0.06);
  border: 1px solid rgba(31, 35, 40, 0.08);
  margin-top: var(--space-sm);
}

.classic-card__terrain-bar {
  height: 100%;
  transition: width 0.3s ease;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.35), transparent);
}

.classic-card__terrain-bar--flat {
  background-color: var(--terrain-flat);
}

.classic-card__terrain-bar--hill {
  background-color: var(--terrain-hill);
}

.classic-card__terrain-bar--mountain {
  background-color: var(--terrain-mountain);
}

.classic-card__terrain-bar--descent {
  background-color: var(--terrain-descent);
}

.classic-card__terrain-bar--sprint {
  background-color: var(--terrain-sprint);
}

/* Selection check */
.classic-card__check {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-accent);
  color: white;
  border-radius: 50%;
  z-index: 2;
}
</style>
