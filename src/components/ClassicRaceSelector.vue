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
      <h2 class="section-header__title">Choisir une classique</h2>
    </header>
    
    <!-- Classics Grid -->
    <div class="classic-selector__grid">
      <button
        v-for="classic in classics"
        :key="classic.id"
        type="button"
        :class="[
          'classic-card',
          { 'classic-card--selected': modelValue === classic.id }
        ]"
        @click="$emit('update:modelValue', classic.id)"
      >
        <!-- Header with icon and difficulty -->
        <div class="classic-card__header">
          <div class="classic-card__icon">
            <UIIcon :type="classic.icon" size="lg" />
          </div>
          <span :class="['classic-card__difficulty', `classic-card__difficulty--${classic.difficulty}`]">
            {{ classic.difficultyLabel }}
          </span>
        </div>
        
        <!-- Name and subtitle -->
        <h3 class="classic-card__name">{{ classic.name }}</h3>
        <p class="classic-card__subtitle">{{ classic.subtitle }}</p>
        
        <!-- Description -->
        <p class="classic-card__description">{{ classic.description }}</p>
        
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

.section-header__title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
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
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.classic-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--color-paper);
  border-radius: var(--radius-md);
  color: var(--color-ink-soft);
}

.classic-card--selected .classic-card__icon {
  background-color: var(--color-accent);
  color: white;
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
  background-color: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.classic-card__difficulty--medium {
  background-color: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.classic-card__difficulty--fast {
  background-color: rgba(34, 197, 94, 0.1);
  color: #15803d;
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
  border-radius: 3px;
  overflow: hidden;
  background-color: var(--color-line);
  margin-top: var(--space-sm);
}

.classic-card__terrain-bar {
  height: 100%;
  transition: width 0.3s ease;
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
}
</style>
