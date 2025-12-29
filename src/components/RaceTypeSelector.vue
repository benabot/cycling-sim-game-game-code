<!--
  RaceTypeSelector.vue - Section for selecting race type
  v5.0 - Phase 2
  
  Usage:
  <RaceTypeSelector v-model="raceType" />
-->
<template>
  <section class="race-type-selector">
    <!-- Section Header -->
    <header class="section-header">
      <div class="section-header__icon">
        <UIIcon type="trophy" size="md" />
      </div>
      <div class="section-header__content">
        <h2 class="section-header__title">Type de course</h2>
        <p class="section-header__subtitle">Choisissez le format.</p>
      </div>
    </header>
    
    <!-- Cards Grid -->
    <div class="race-type-selector__grid">
      <RaceTypeCard
        type="classic"
        :selected="modelValue === 'classic'"
        @select="$emit('update:modelValue', 'classic')"
      />
      <RaceTypeCard
        type="stage"
        :selected="modelValue === 'stage'"
        @select="$emit('update:modelValue', 'stage')"
      />
    </div>
  </section>
</template>

<script setup>
import UIIcon from './icons/UIIcon.vue';
import RaceTypeCard from './RaceTypeCard.vue';

defineProps({
  modelValue: {
    type: String,
    default: null,
    validator: (v) => v === null || ['classic', 'stage'].includes(v)
  }
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.race-type-selector {
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
.race-type-selector__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

@media (max-width: 640px) {
  .race-type-selector__grid {
    grid-template-columns: 1fr;
  }
}
</style>
