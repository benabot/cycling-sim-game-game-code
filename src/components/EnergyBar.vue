<template>
  <div class="energy-bar-container">
    <div class="energy-header">
      <span class="energy-icon">⚡</span>
      <span class="energy-label">{{ statusLabel }}</span>
      <span class="energy-value">{{ energy }}%</span>
    </div>
    <div class="energy-bar">
      <div 
        class="energy-fill" 
        :style="{ width: energy + '%', backgroundColor: barColor }"
      ></div>
      <!-- Threshold markers -->
      <div class="threshold-marker" style="left: 25%;" title="Épuisé (25%)"></div>
      <div class="threshold-marker" style="left: 50%;" title="Fatigué (50%)"></div>
    </div>
    <div v-if="showEffects && hasEffects" class="energy-effects">
      <span v-if="effects.bonusDisabled" class="effect-badge bad">
        Bonus terrain ❌
      </span>
      <span v-if="!effects.canUseAttack" class="effect-badge bad">
        Attaque ❌
      </span>
      <span v-else-if="effects.attackPenalty" class="effect-badge warn">
        Attaque {{ effects.attackPenalty }}
      </span>
      <span v-if="!effects.canUseSpecialty" class="effect-badge bad">
        Spécialité ❌
      </span>
      <span v-else-if="effects.specialtyPenalty" class="effect-badge warn">
        Spécialité {{ effects.specialtyPenalty }}
      </span>
      <span v-if="effects.maxMovement" class="effect-badge bad">
        Max {{ effects.maxMovement }} cases
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
  gap: 6px;
  font-size: 12px;
}

.energy-icon {
  font-size: 14px;
}

.energy-label {
  font-weight: 500;
  color: #64748b;
}

.energy-value {
  margin-left: auto;
  font-weight: bold;
  font-family: monospace;
}

.energy-bar {
  position: relative;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.energy-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease, background-color 0.3s ease;
}

.threshold-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(0, 0, 0, 0.3);
}

.energy-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.effect-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.effect-badge.bad {
  background: #fecaca;
  color: #dc2626;
}

.effect-badge.warn {
  background: #fef3c7;
  color: #d97706;
}
</style>
