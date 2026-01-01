<!--
  RaceTypeSelector.vue - Section for selecting race type
  v5.0 - Phase 2
  
  Usage:
  <RaceTypeSelector v-model="raceType" />
-->
<template>
  <section class="race-type-selector">
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
