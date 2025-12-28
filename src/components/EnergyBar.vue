<template>
  <div class="energy-bar-container">
    <div class="energy-header">
      <UIIcon type="energy" :size="14" class="energy-icon" />
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
        Bonus <UIIcon type="blocked" :size="10" />
      </span>
      <span v-if="!effects.canUseAttack" class="badge badge-red badge-xs">
        Attaque <UIIcon type="blocked" :size="10" />
      </span>
      <span v-else-if="effects.attackPenalty" class="badge badge-yellow badge-xs">
        Attaque {{ effects.attackPenalty }}
      </span>
      <span v-if="!effects.canUseSpecialty" class="badge badge-red badge-xs">
        Spécialité <UIIcon type="blocked" :size="10" />
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
import { UIIcon } from './icons';

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
  color: var(--color-gold, #d97706);
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
  background: var(--color-canvas);  /* fond papier chaud */
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-line-subtle);
}

.energy-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.5s ease, background-color 0.3s ease;
}

.energy-threshold {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(31, 35, 40, 0.12);  /* réduit de 0.25 */
}

.energy-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

/* Extra small badge variant */
.badge-xs {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
}

.badge-red {
  background: #fecaca;
  color: #dc2626;
}

.badge-yellow {
  background: #fef3c7;
  color: #d97706;
}
</style>
