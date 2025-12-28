<!--
  RaceTypeCard.vue - Radio card for race type selection
  v5.0 - Phase 2
  
  Usage:
  <RaceTypeCard
    type="classic"
    :selected="selectedType === 'classic'"
    @select="selectedType = 'classic'"
  />
-->
<template>
  <button
    type="button"
    :class="[
      'race-type-card',
      `race-type-card--${type}`,
      { 'race-type-card--selected': selected }
    ]"
    @click="$emit('select', type)"
  >
    <!-- Icon -->
    <div class="race-type-card__icon">
      <UIIcon :type="iconType" size="xl" />
    </div>
    
    <!-- Content -->
    <div class="race-type-card__content">
      <h3 class="race-type-card__title">{{ title }}</h3>
      <p class="race-type-card__description">{{ description }}</p>
    </div>
    
    <!-- Radio indicator -->
    <div class="race-type-card__radio">
      <div class="race-type-card__radio-dot"></div>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import UIIcon from './icons/UIIcon.vue';

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (v) => ['classic', 'stage'].includes(v)
  },
  selected: {
    type: Boolean,
    default: false
  }
});

defineEmits(['select']);

const iconType = computed(() => {
  return props.type === 'classic' ? 'laurel' : 'calendar';
});

const title = computed(() => {
  return props.type === 'classic' ? 'Classique' : 'Course à étapes';
});

const description = computed(() => {
  return props.type === 'classic'
    ? 'Course d\'un jour inspirée des monuments du cyclisme'
    : 'Mini Grand Tour avec classement général sur plusieurs étapes';
});
</script>

<style scoped>
.race-type-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-lg);
  background-color: var(--color-surface);
  border: 2px solid var(--color-line);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
  width: 100%;
}

.race-type-card:hover {
  border-color: var(--color-line-strong);
  background-color: var(--color-paper);
}

.race-type-card--selected {
  border-color: var(--color-accent);
  background-color: rgba(59, 130, 246, 0.04);
}

.race-type-card--selected:hover {
  border-color: var(--color-accent);
}

/* Icon */
.race-type-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-paper);
  border-radius: var(--radius-md);
  color: var(--color-ink-soft);
}

.race-type-card--selected .race-type-card__icon {
  background-color: var(--color-accent);
  color: white;
}

/* Content */
.race-type-card__content {
  flex: 1;
  min-width: 0;
}

.race-type-card__title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 var(--space-xs) 0;
}

.race-type-card__description {
  font-family: var(--font-ui);
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-muted);
  margin: 0;
}

/* Radio indicator */
.race-type-card__radio {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-line-strong);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.race-type-card--selected .race-type-card__radio {
  border-color: var(--color-accent);
}

.race-type-card__radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: transparent;
  transition: var(--transition-fast);
}

.race-type-card--selected .race-type-card__radio-dot {
  background-color: var(--color-accent);
}
</style>
