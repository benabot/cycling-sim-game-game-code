<template>
  <div class="effects-overlay">
    <div class="effects-panel">
      <h3>⚡ Fin du tour {{ turn }}</h3>
      
      <!-- Aspiration effects -->
      <div v-if="effects.aspiration.length > 0" class="effect-group aspiration-group">
        <h4>🌀 Aspiration (regroupement)</h4>
        <p class="effect-rule">Écart de 1 case → rejoint le groupe devant</p>
        <div class="effect-list">
          <div 
            v-for="effect in effects.aspiration" 
            :key="effect.riderId"
            class="effect-item aspiration-effect"
          >
            <span class="effect-rider">{{ effect.riderName }}</span>
            <span class="effect-detail">case {{ effect.fromPosition }} → {{ effect.toPosition }}</span>
            <span class="effect-icon">↑</span>
          </div>
        </div>
      </div>
      
      <!-- Wind effects -->
      <div v-if="effects.wind.length > 0" class="effect-group wind-group">
        <h4>💨 Prise de vent</h4>
        <p class="effect-rule">Case vide devant → leader reçoit carte +1</p>
        <div class="effect-list">
          <div 
            v-for="effect in effects.wind" 
            :key="effect.riderId"
            class="effect-item wind-effect"
          >
            <span class="effect-rider">{{ effect.riderName }}</span>
            <span class="effect-card bad">+1</span>
            <span class="effect-desc">carte ajoutée</span>
          </div>
        </div>
      </div>
      
      <!-- Shelter effects -->
      <div v-if="effects.shelter.length > 0" class="effect-group shelter-group">
        <h4>🛡️ À l'abri</h4>
        <p class="effect-rule">Derrière un leader ou case devant occupée → reçoit carte +2</p>
        <div class="effect-list">
          <div 
            v-for="effect in effects.shelter" 
            :key="effect.riderId"
            class="effect-item shelter-effect"
          >
            <span class="effect-rider">{{ effect.riderName }}</span>
            <span class="effect-card good">+2</span>
            <span class="effect-desc">carte ajoutée</span>
          </div>
        </div>
      </div>
      
      <div v-if="noEffects" class="no-effects">
        <p>Pas d'effets de fin de tour (terrain Montagne ou Descente).</p>
      </div>
      
      <button @click="$emit('acknowledge')" class="btn btn-continue">
        Continuer →
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  turn: { type: Number, required: true },
  effects: { 
    type: Object, 
    default: () => ({ aspiration: [], wind: [], shelter: [] })
  }
});

defineEmits(['acknowledge']);

const noEffects = computed(() => 
  props.effects.aspiration.length === 0 && 
  props.effects.wind.length === 0 && 
  props.effects.shelter.length === 0
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
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.effects-panel h3 {
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 1.4em;
}

.effect-group {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
}

.effect-group h4 {
  margin: 0 0 10px 0;
  font-size: 1.1em;
}

.effect-rule {
  font-size: 0.85em;
  color: #64748b;
  margin: 0 0 10px 0;
  font-style: italic;
}

.aspiration-group { background: #eff6ff; }
.wind-group { background: #fef3c7; }
.shelter-group { background: #dcfce7; }

.effect-list { display: flex; flex-direction: column; gap: 8px; }

.effect-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.effect-rider { font-weight: 500; flex: 1; }
.effect-detail { color: #64748b; font-size: 0.9em; }
.effect-icon { font-size: 1.2em; }

.effect-card {
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: bold;
}
.effect-card.bad { background: #fecaca; color: #dc2626; }
.effect-card.good { background: #bbf7d0; color: #16a34a; }

.effect-desc { color: #64748b; font-size: 0.85em; }

.no-effects {
  text-align: center;
  padding: 30px;
  color: #64748b;
}

.btn-continue {
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  font-size: 1.1em;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-continue:hover { background: #2563eb; }

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
