<template>
  <span 
    class="rider-token"
    :class="tokenClasses"
    :title="tooltip"
  >
    {{ emoji }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { RiderConfig } from '../config/game.config.js';

const props = defineProps({
  rider: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isAnimating: { type: Boolean, default: false },
  isLeader: { type: Boolean, default: false },
  hasPlayed: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  mini: { type: Boolean, default: false }
});

const emoji = computed(() => RiderConfig[props.rider.type]?.emoji || '🚴');

const tokenClasses = computed(() => {
  const classes = [];
  
  // Team class (keeping old format for backward compatibility)
  if (props.rider.team) {
    classes.push(props.rider.team);
  }
  
  // Specialty/type class
  if (props.rider.type) {
    classes.push(props.rider.type);
  }
  
  // States
  if (props.isSelected) classes.push('selected');
  if (props.isAnimating) classes.push('animating');
  if (props.isLeader) classes.push('leader');
  if (props.rider.hasFinished) classes.push('finished');
  if (props.hasPlayed) classes.push('played');
  
  // Size variants
  if (props.compact) classes.push('rider-token--compact');
  if (props.mini) classes.push('rider-token--mini');
  
  return classes;
});

const tooltip = computed(() => {
  const parts = [
    props.rider.name,
    RiderConfig[props.rider.type]?.name,
    `Case ${props.rider.position}`
  ];
  if (props.isLeader) parts.push('(LEADER - prend le vent)');
  if (props.hasPlayed) parts.push('(déjà joué)');
  return parts.join(' | ');
});
</script>

<style scoped>
/* Styles now in tokens.css - keeping minimal overrides here */
</style>
