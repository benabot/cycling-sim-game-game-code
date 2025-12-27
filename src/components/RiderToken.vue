<template>
  <span 
    class="rider-token"
    :class="[
      rider.type, 
      rider.team, 
      { 
        'selected': isSelected,
        'animating': isAnimating,
        'leader': isLeader,
        'finished': rider.hasFinished
      }
    ]"
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
  isLeader: { type: Boolean, default: false }
});

const emoji = computed(() => RiderConfig[props.rider.type]?.emoji || '🚴');

const tooltip = computed(() => {
  const parts = [
    props.rider.name,
    RiderConfig[props.rider.type]?.name,
    `Case ${props.rider.position}`
  ];
  if (props.isLeader) parts.push('(LEADER - prend le vent)');
  return parts.join(' | ');
});
</script>

<style scoped>
.rider-token {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 2px solid white;
  transition: all 0.2s ease;
  cursor: default;
}

/* Team colors */
.rider-token.team_a { background: #fecaca; border-color: #dc2626; }
.rider-token.team_b { background: #bfdbfe; border-color: #2563eb; }
.rider-token.team_c { background: #bbf7d0; border-color: #16a34a; }
.rider-token.team_d { background: #fef08a; border-color: #ca8a04; }

/* States */
.rider-token.selected { 
  transform: scale(1.3); 
  box-shadow: 0 0 0 3px #f59e0b; 
  z-index: 10; 
}
.rider-token.animating { 
  animation: aspiration-move 1.5s ease-in-out infinite;
  z-index: 20;
}
.rider-token.leader { 
  box-shadow: 0 0 0 2px #fbbf24; 
}
.rider-token.finished { 
  opacity: 0.7; 
}

@keyframes aspiration-move {
  0% { 
    transform: scale(1); 
    box-shadow: 0 0 0 4px #3b82f6;
    background: #60a5fa;
  }
  25% { 
    transform: scale(1.8); 
    box-shadow: 0 0 20px 8px rgba(59, 130, 246, 0.8);
    background: #3b82f6;
  }
  50% { 
    transform: scale(1.4); 
    box-shadow: 0 0 30px 12px rgba(59, 130, 246, 0.6);
    background: #60a5fa;
  }
  75% { 
    transform: scale(1.8); 
    box-shadow: 0 0 20px 8px rgba(59, 130, 246, 0.8);
    background: #3b82f6;
  }
  100% { 
    transform: scale(1); 
    box-shadow: 0 0 0 4px #3b82f6;
    background: #60a5fa;
  }
}
</style>
