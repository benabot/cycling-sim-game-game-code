<template>
  <span 
    class="rider-token"
    :class="tokenClasses"
    :title="tooltip"
  >
    <RiderIcon 
      :type="rider.type" 
      :size="iconSize"
      class="rider-token-icon"
    />
    <span v-if="showNumber && rider.number" class="rider-token-number">
      {{ rider.number }}
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import RiderIcon from './icons/RiderIcon.vue';
import { RiderConfig } from '../config/game.config.js';

const props = defineProps({
  rider: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isAnimating: { type: Boolean, default: false },
  isLeader: { type: Boolean, default: false },
  hasPlayed: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  mini: { type: Boolean, default: false },
  showNumber: { type: Boolean, default: false },
  static: { type: Boolean, default: false }  // Disables all highlight/hover states
});

const iconSize = computed(() => {
  if (props.mini) return 12;
  if (props.compact) return 16;
  return 22;
});

const tokenClasses = computed(() => {
  const classes = [];
  
  // Team class
  if (props.rider.team) {
    classes.push(props.rider.team);
  }
  
  // Specialty/type class
  if (props.rider.type) {
    classes.push(props.rider.type);
  }
  
  // States (disabled in static mode except for played/finished)
  if (!props.static) {
    if (props.isSelected) classes.push('selected');
    if (props.isAnimating) classes.push('animating');
    if (props.isLeader) classes.push('leader');
  }
  if (props.rider.hasFinished) classes.push('finished');
  if (props.hasPlayed) classes.push('played');
  
  // Static mode for panel display
  if (props.static) classes.push('rider-token--static');
  
  // Size variants
  if (props.compact) classes.push('rider-token--compact');
  if (props.mini) classes.push('rider-token--mini');
  
  return classes;
});

const tooltip = computed(() => {
  const config = RiderConfig[props.rider.type];
  const parts = [
    props.rider.name,
    config?.name,
    `Case ${props.rider.position}`
  ];
  if (props.rider.energy !== undefined) {
    parts.push(`⚡ ${props.rider.energy}`);
  }
  if (props.isLeader) parts.push('(LEADER - prend le vent)');
  if (props.hasPlayed) parts.push('(déjà joué)');
  return parts.join(' | ');
});
</script>

<style scoped>
/* Token icon styling */
.rider-token-icon {
  color: rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

/* Team_d (yellow) needs dark icon */
.rider-token.team_d .rider-token-icon {
  color: rgba(31, 35, 40, 0.85);
}

/* Number badge */
.rider-token-number {
  position: absolute;
  bottom: -3px;
  right: -3px;
  min-width: 14px;
  height: 14px;
  background: var(--color-surface, white);
  border: 1px solid var(--color-line, #D7D3C8);
  border-radius: 7px;
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  font-weight: 600;
  color: var(--color-ink, #1F2328);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.rider-token--compact .rider-token-number {
  min-width: 12px;
  height: 12px;
  font-size: 8px;
  bottom: -2px;
  right: -2px;
}

.rider-token--mini .rider-token-number {
  display: none;
}
</style>
