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
        <div class="classic-card__content">
          <div class="classic-card__text">
            <h3 class="classic-card__name">{{ classic.name }}</h3>
            <p v-if="classic.description" class="classic-card__desc">{{ classic.description }}</p>
            <div class="classic-card__meta">
              <span v-if="classic.advantageLabel" class="badge badge-pill classic-card__advantage">
                Avantage {{ classic.advantageLabel }}
              </span>
            </div>
          </div>
          <div class="classic-card__profile" aria-hidden="true">
            <svg viewBox="0 0 120 36">
              <polyline :points="getProfilePoints(classic.profile)" />
            </svg>
          </div>
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
import { getAllClassicPresets } from '../config/race-presets.js';

defineProps({
  modelValue: {
    type: String,
    default: null
  }
});

defineEmits(['update:modelValue']);

const classics = computed(() => getAllClassicPresets());

const profileWidth = 120;
const profileHeight = 36;
const profilePadding = 4;

function getProfilePoints(profile = []) {
  const values = Array.isArray(profile) && profile.length ? profile : [0, 0, 0, 0, 0];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = profilePadding + (index / (values.length - 1 || 1)) * (profileWidth - profilePadding * 2);
      const y = profilePadding + (1 - (value - min) / range) * (profileHeight - profilePadding * 2);
      return `${x},${y}`;
    })
    .join(' ');
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
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--sp-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-canvas);
}

.section-header__icon {
  color: var(--sp-text-secondary);
}

.section-header__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-header__title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--sp-text-strong);
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
  border: 1px solid var(--sp-border-soft);
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
  background-color: color-mix(in srgb, var(--color-accent) 8%, white);
}

.classic-card--selected:hover {
  border-color: var(--color-accent);
}

/* Name */
.classic-card__name {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--sp-text-strong);
  margin: 0;
}

.classic-card__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-md);
  align-items: center;
}

.classic-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.classic-card__desc {
  margin: 0;
  font-size: 12px;
  color: var(--sp-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.classic-card__meta {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.classic-card__advantage {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  color: var(--color-ink);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
}

.classic-card__profile {
  width: 100%;
  max-width: 160px;
  justify-self: end;
}

.classic-card__profile svg {
  width: 100%;
  height: 40px;
}

.classic-card__profile polyline {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.7;
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

@media (max-width: 720px) {
  .classic-card__content {
    grid-template-columns: minmax(0, 1fr) 120px;
  }

  .classic-card__profile {
    max-width: 120px;
  }
}
</style>
