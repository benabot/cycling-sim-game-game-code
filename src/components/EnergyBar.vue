<template>
  <div class="energy-bar-container">
    <div class="energy-header">
      <span class="energy-icon">⚡</span>
      <span class="energy-label type-caption">{{ statusLabel }}</span>
      <span class="energy-value type-numeric">{{ energy }}%</span>
    </div>
    <div class="energy-bar">
      <div 
        class="energy-fill" 
        :style="{ width: energy + '%', backgroundColor: barColor }"
      ></div>
      <!-- Threshold markers -->
      <div class="energy-threshold" style="left: 25%;" title="Épuisé (25%)"></div>
      <div class="energy-threshold" style="left: 50%;" title="Fatigué (50%)"></div>
    </div>
    <div v-if="showEffects && hasEffects" class="energy-effects">
      <span v-if="effects.bonusDisabled" class="badge badge-red badge-xs">
        Bonus ❌
      </span>
      <span v-if="!effects.canUseAttack" class="badge badge-red badge-xs">
        Attaque ❌
      </span>
      <span v-else-if="effects.attackPenalty" class="badge badge-yellow badge-xs">
        Attaque {{ effects.attackPenalty }}
      </span>
      <span v-if="!effects.canUseSpecialty" class="badge badge-red badge-xs">
        Spécialité ❌
      </span>
      <span v-else-if="effects.specialtyPenalty" class="badge badge-yellow badge-xs">
        Spécialité {{ effects.specialtyPenalty }}
      </span>
      <span v-if="effects.maxMovement" class="badge badge-red badge-xs">
        Max {{ effects.maxMovement }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getEnergyColor, getEnergyLabel, getEnergyEffects } from '../core/energy.js';

const props = defineProps({
  energy: { type: Number, required: true },
  showEffects: { type: Boolean, default: false }
});

const barColor = computed(() => getEnergyColor(props.energy));
const statusLabel = computed(() => getEnergyLabel(props.energy));
const effects = computed(() => getEnergyEffects(props.energy));

const hasEffects = computed(() => {
  const e = effects.value;
  return e.bonusDisabled || !e.canUseAttack || !e.canUseSpecialty || 
         e.attackPenalty || e.specialtyPenalty || e.maxMovement;
});
</script>

<style scoped>
.energy-bar-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.energy-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.energy-icon {
  font-size: 14px;
}

.energy-label {
  color: var(--color-ink-muted);
}

.energy-value {
  margin-left: auto;
  font-weight: 600;
}

.energy-bar {
  position: relative;
  height: 8px;
  background: var(--color-line);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.energy-fill {
  height: 100%;
  border-radius: var(--radius-xs);
  transition: width 0.5s ease, background-color 0.3s ease;
}

.energy-threshold {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(0, 0, 0, 0.25);
}

.energy-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

/* Extra small badge variant */
.badge-xs {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
}
</style>
