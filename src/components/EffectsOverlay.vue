<template>
  <div class="effects-overlay">
    <div class="effects-panel">
      <h3 class="effects-title">
        <UIIcon type="event" :size="22" />
        Fin du tour {{ turn }}
      </h3>
      
      <!-- Aspiration effects -->
      <div v-if="effects.aspiration.length > 0" class="effect-group aspiration-group">
        <h4>
          <UIIcon type="aspiration" :size="18" />
          Aspiration
        </h4>
        <p class="effect-rule">Écart d'1 case vide → avance d'1 case</p>
        <div class="effect-list">
          <div 
            v-for="effect in effects.aspiration" 
            :key="effect.riderId"
            class="effect-item aspiration-effect"
          >
            <span class="effect-rider">{{ effect.riderName }}</span>
            <span class="effect-detail">case {{ effect.fromPosition }} → {{ effect.toPosition }}</span>
            <UIIcon type="chevron-up" :size="16" class="effect-icon" />
          </div>
        </div>
      </div>
      
      <!-- Wind effects -->
      <div v-if="effects.wind.length > 0" class="effect-group wind-group">
        <h4>
          <UIIcon type="wind" :size="18" />
          Vent
        </h4>
        <p class="effect-rule">Seul ou plus à droite + case devant vide</p>
        <div class="effect-list">
          <div 
            v-for="effect in effects.wind" 
            :key="effect.riderId"
            class="effect-item wind-effect"
          >
            <span class="effect-rider">{{ effect.riderName }}</span>
            <span class="effect-card bad">+{{ effect.cardValue ?? 1 }}</span>
            <span class="effect-desc">carte fin de tour</span>
          </div>
        </div>
      </div>
      
      <!-- Shelter effects -->
      <div v-if="effects.shelter.length > 0" class="effect-group shelter-group">
        <h4>
          <UIIcon type="tempo" :size="18" />
          Cartes fin de tour
        </h4>
        <p class="effect-rule">Hors vent : carte +2</p>
        <div class="effect-list">
          <div 
            v-for="effect in effects.shelter" 
            :key="effect.riderId"
            class="effect-item shelter-effect"
          >
            <span class="effect-rider">{{ effect.riderName }}</span>
            <span class="effect-card good">+{{ effect.cardValue ?? 2 }}</span>
            <span class="effect-desc">carte fin de tour</span>
          </div>
        </div>
      </div>
      
      <!-- Refuel zone effects (v4.0) -->
      <div v-if="effects.refuel && effects.refuel.length > 0" class="effect-group refuel-group">
        <h4>
          <UIIcon type="refuel" :size="18" />
          Ravitaillement
        </h4>
        <p class="effect-rule">Case finale : +25 énergie</p>
        <div class="effect-list">
          <div 
            v-for="effect in effects.refuel" 
            :key="effect.riderId"
            class="effect-item refuel-effect"
          >
            <span class="effect-rider">{{ effect.riderName }}</span>
            <span class="effect-energy">+{{ effect.energyRecovered }}</span>
            <span class="effect-desc">énergie</span>
          </div>
        </div>
      </div>
      
      <div v-if="noEffects" class="no-effects">
        <p>Aucun effet de fin de tour.</p>
      </div>
      
      <button @click="$emit('acknowledge')" class="btn btn-continue">
        Suivant
        <UIIcon type="chevron-down" :size="18" class="icon-forward" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { UIIcon } from './icons';

const props = defineProps({
  turn: { type: Number, required: true },
  effects: { 
    type: Object, 
    default: () => ({ aspiration: [], wind: [], shelter: [], refuel: [] })
  }
});

defineEmits(['acknowledge']);

const noEffects = computed(() => 
  props.effects.aspiration.length === 0 && 
  props.effects.wind.length === 0 && 
  props.effects.shelter.length === 0 &&
  (!props.effects.refuel || props.effects.refuel.length === 0)
);
</script>

<style scoped>
.effects-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in 0.3s ease;
}

.effects-panel {
  background: white;
  border-radius: var(--radius-lg, 16px);
  padding: var(--space-xl, 30px);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.effects-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm, 8px);
  margin: 0 0 var(--space-lg, 20px) 0;
  font-size: 1.4em;
  color: var(--color-accent, #3b82f6);
}

.effect-group {
  margin-bottom: var(--space-lg, 20px);
  padding: var(--space-md, 15px);
  border-radius: var(--radius-md, 8px);
}

.effect-group h4 {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  margin: 0 0 var(--space-sm, 10px) 0;
  font-size: 1.1em;
}

.effect-rule {
  font-size: 0.85em;
  color: var(--color-ink-muted, #64748b);
  margin: 0 0 var(--space-sm, 10px) 0;
  font-style: italic;
}

.aspiration-group { background: #eff6ff; }
.wind-group { background: #fef3c7; }
.shelter-group { background: #dcfce7; }
.refuel-group { background: #fffbeb; }

.effect-list { display: flex; flex-direction: column; gap: 8px; }

.effect-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 10px);
  padding: var(--space-sm, 8px) var(--space-md, 12px);
  background: white;
  border-radius: var(--radius-sm, 6px);
}

.effect-rider { font-weight: 500; flex: 1; }
.effect-detail { color: var(--color-ink-muted, #64748b); font-size: 0.9em; }
.effect-icon { color: var(--color-accent, #3b82f6); }

.effect-card {
  padding: 4px 10px;
  border-radius: var(--radius-xs, 4px);
  font-weight: bold;
  font-family: var(--font-mono);
}
.effect-card.bad { background: #fecaca; color: #dc2626; }
.effect-card.good { background: #bbf7d0; color: #16a34a; }

.effect-energy {
  padding: 4px 10px;
  border-radius: var(--radius-xs, 4px);
  font-weight: bold;
  font-family: var(--font-mono);
  background: #fef3c7;
  color: #d97706;
}

.effect-desc { color: var(--color-ink-muted, #64748b); font-size: 0.85em; }

.no-effects {
  text-align: center;
  padding: var(--space-xl, 30px);
  color: var(--color-ink-muted, #64748b);
}

.btn-continue {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm, 8px);
  width: 100%;
  padding: var(--space-md, 15px);
  margin-top: var(--space-lg, 20px);
  font-size: 1.1em;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: var(--color-accent, #3b82f6);
  color: white;
  cursor: pointer;
  transition: background var(--transition-fast, 0.2s);
}
.btn-continue:hover { background: var(--color-accent-hover, #2563eb); }

.icon-forward {
  transform: rotate(-90deg);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
