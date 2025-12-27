<template>
  <div class="action-zone">
    <!-- Phase: Select Card -->
    <div v-if="turnPhase === 'select_card'" class="action-prompt">
      <span class="prompt-icon">1️⃣</span>
      <span class="prompt-text">Choisissez une carte à jouer</span>
    </div>

    <!-- Phase: Roll Dice -->
    <div v-if="turnPhase === 'roll_dice'" class="action-content">
      <div class="selected-card-preview">
        <span>Carte sélectionnée :</span>
        <span class="selected-value" :class="{ 'attack': isAttackCard }">+{{ cardValue }}</span>
      </div>
      <div class="action-buttons">
        <button @click="$emit('rollDice')" class="btn btn-roll">
          2️⃣ 🎲 Lancer le dé
        </button>
        <button @click="$emit('cancelCard')" class="btn btn-cancel">
          ← Changer de carte
        </button>
      </div>
    </div>

    <!-- Phase: Select Specialty -->
    <div v-if="turnPhase === 'select_specialty'" class="action-content">
      <div class="dice-result-display">
        <span class="dice-icon">🎲</span>
        <span class="dice-value">{{ diceResult }}</span>
        <span class="plus">+</span>
        <span class="card-played">🃏 {{ cardValue }}</span>
        <span v-if="terrainBonus !== 0" class="terrain-bonus-display">
          {{ formatBonus(terrainBonus) }}
        </span>
      </div>
      <div class="specialty-prompt">
        Utiliser une carte Spécialité (+2) ?
      </div>
      <div class="action-buttons">
        <button 
          v-if="hasSpecialtyCards"
          @click="$emit('useSpecialty')" 
          class="btn btn-specialty"
        >
          ★ Utiliser (+2)
        </button>
        <button @click="$emit('skipSpecialty')" class="btn btn-skip">
          Passer →
        </button>
      </div>
    </div>

    <!-- Phase: Resolve -->
    <div v-if="turnPhase === 'resolve'" class="action-content">
      <div class="movement-calculation">
        <div class="calc-row">
          <span class="calc-item dice">🎲 {{ diceResult }}</span>
          <span class="calc-op">+</span>
          <span class="calc-item card">🃏 {{ cardValue }}</span>
          <span v-if="terrainBonus !== 0" class="calc-op">{{ terrainBonus > 0 ? '+' : '' }}</span>
          <span v-if="terrainBonus !== 0" class="calc-item terrain">{{ terrainBonus }}</span>
          <span v-if="useSpecialty" class="calc-op">+</span>
          <span v-if="useSpecialty" class="calc-item specialty">★2</span>
          <span class="calc-op">=</span>
          <span class="calc-result">{{ totalMovement }}</span>
        </div>
      </div>
      <button @click="$emit('resolve')" class="btn btn-resolve">
        ✓ Avancer de {{ totalMovement }} cases (→ case {{ targetPosition }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  turnPhase: { type: String, required: true },
  cardValue: { type: Number, default: 0 },
  isAttackCard: { type: Boolean, default: false },
  diceResult: { type: Number, default: 0 },
  terrainBonus: { type: Number, default: 0 },
  hasSpecialtyCards: { type: Boolean, default: false },
  useSpecialty: { type: Boolean, default: false },
  totalMovement: { type: Number, default: 0 },
  currentPosition: { type: Number, default: 0 }
});

defineEmits(['rollDice', 'cancelCard', 'useSpecialty', 'skipSpecialty', 'resolve']);

const targetPosition = computed(() => props.currentPosition + props.totalMovement);

function formatBonus(value) {
  return value > 0 ? `+${value}` : `${value}`;
}
</script>

<style scoped>
.action-zone {
  padding: 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.action-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  font-size: 1.1em;
  color: #64748b;
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.selected-card-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1em;
}

.selected-value {
  font-weight: bold;
  font-size: 1.3em;
  padding: 5px 15px;
  background: #e2e8f0;
  border-radius: 8px;
}
.selected-value.attack { background: #c4b5fd; }

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }

.btn-roll { background: #3b82f6; color: white; font-size: 1.1em; }
.btn-resolve { background: #10b981; color: white; font-size: 1.1em; }
.btn-specialty { background: #8b5cf6; color: white; }
.btn-skip { background: #94a3b8; color: white; }
.btn-cancel { background: #f1f5f9; color: #64748b; }

.dice-result-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.3em;
  padding: 10px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.dice-icon { font-size: 1.5em; }
.dice-value { font-weight: bold; color: #3b82f6; }
.plus { color: #94a3b8; }
.card-played { font-weight: 500; }
.terrain-bonus-display { color: #16a34a; font-weight: 500; }

.specialty-prompt {
  color: #64748b;
  font-size: 1em;
}

.movement-calculation {
  padding: 15px 25px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.calc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2em;
}

.calc-item {
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 500;
}
.calc-item.dice { background: #dbeafe; color: #2563eb; }
.calc-item.card { background: #fef3c7; color: #d97706; }
.calc-item.terrain { background: #dcfce7; color: #16a34a; }
.calc-item.specialty { background: #f3e8ff; color: #7c3aed; }

.calc-op { color: #94a3b8; }

.calc-result {
  font-size: 1.4em;
  font-weight: bold;
  color: #10b981;
  padding: 5px 15px;
  background: #dcfce7;
  border-radius: 8px;
}
</style>
