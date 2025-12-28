<template>
  <div class="action-zone">
    <!-- Phase: Select Card -->
    <div v-if="turnPhase === 'select_card'" class="action-prompt">
      <span class="action-prompt-icon">1️⃣</span>
      <span class="type-body">Choisissez une carte à jouer</span>
    </div>

    <!-- Phase: Roll Dice -->
    <div v-if="turnPhase === 'roll_dice'" class="action-content">
      <div class="action-preview">
        <span class="type-caption">Carte sélectionnée</span>
        <span class="action-preview-value" :class="{ 'action-preview-value--attack': isAttackCard }">
          +{{ cardValue }}
        </span>
      </div>
      <div class="action-buttons">
        <button @click="$emit('rollDice')" class="btn btn-primary btn-lg">
          2️⃣ 🎲 Lancer le dé
        </button>
        <button @click="$emit('cancelCard')" class="btn btn-ghost">
          ← Changer de carte
        </button>
      </div>
    </div>

    <!-- Phase: Select Specialty -->
    <div v-if="turnPhase === 'select_specialty'" class="action-content">
      <div class="dice-result">
        <span class="dice-result-item">
          <span class="dice-result-icon">🎲</span>
          <span class="dice-result-value type-numeric-lg">{{ diceResult }}</span>
        </span>
        <span class="dice-result-op">+</span>
        <span class="dice-result-item">
          <span class="dice-result-icon">🃏</span>
          <span class="dice-result-value type-numeric-lg">{{ cardValue }}</span>
        </span>
        <template v-if="terrainBonus !== 0">
          <span class="dice-result-op">{{ terrainBonus > 0 ? '+' : '' }}</span>
          <span class="dice-result-item" :class="terrainBonus > 0 ? 'dice-result-item--positive' : 'dice-result-item--negative'">
            <span class="dice-result-value type-numeric-lg">{{ terrainBonus }}</span>
          </span>
        </template>
      </div>
      <p class="type-body">Utiliser une carte Spécialité (+2) ?</p>
      <div class="action-buttons">
        <button 
          v-if="hasSpecialtyCards"
          @click="$emit('useSpecialty')" 
          class="btn btn-success"
        >
          ★ Utiliser (+2)
        </button>
        <button @click="$emit('skipSpecialty')" class="btn btn-secondary">
          Rouler →
        </button>
      </div>
    </div>

    <!-- Phase: Resolve -->
    <div v-if="turnPhase === 'resolve'" class="action-content">
      <div class="movement-calc">
        <span class="calc-item">🎲 {{ diceResult }}</span>
        <span class="calc-op">+</span>
        <span class="calc-item">🃏 {{ cardValue }}</span>
        <template v-if="terrainBonus !== 0">
          <span class="calc-op">{{ terrainBonus > 0 ? '+' : '' }}</span>
          <span class="calc-item" :class="terrainBonus > 0 ? 'calc-item--positive' : 'calc-item--negative'">{{ terrainBonus }}</span>
        </template>
        <template v-if="useSpecialty">
          <span class="calc-op">+</span>
          <span class="calc-item calc-item--specialty">★2</span>
        </template>
        <span class="calc-op">=</span>
        <span class="calc-result type-numeric-lg">{{ totalMovement }}</span>
      </div>
      <button @click="$emit('resolve')" class="btn btn-success btn-lg">
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
</script>

<style scoped>
.action-zone {
  padding: var(--space-lg);
  background: var(--color-canvas);
  border-top: 1px solid var(--color-line);
}

.action-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  color: var(--color-ink-muted);
}

.action-prompt-icon {
  font-size: 1.5em;
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

/* Preview */
.action-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.action-preview-value {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.5em;
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-line);
  border-radius: var(--radius-md);
}

.action-preview-value--attack {
  background: #c4b5fd;
}

/* Dice Result */
.dice-result {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.dice-result-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-canvas);
  border-radius: var(--radius-sm);
}

.dice-result-item--positive { background: color-mix(in srgb, var(--color-success) 15%, white); }
.dice-result-item--negative { background: color-mix(in srgb, var(--color-danger) 15%, white); }

.dice-result-icon {
  font-size: 1.2em;
}

.dice-result-op {
  color: var(--color-ink-muted);
  font-weight: 500;
}

/* Movement Calculation */
.movement-calc {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.calc-item {
  font-family: var(--font-mono);
  font-weight: 500;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-canvas);
  border-radius: var(--radius-sm);
}

.calc-item--positive { color: var(--color-success); }
.calc-item--negative { color: var(--color-danger); }
.calc-item--specialty { background: #bbf7d0; }

.calc-op {
  color: var(--color-ink-muted);
}

.calc-result {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

/* Buttons */
.action-buttons {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  justify-content: center;
}

/* Responsive */
@media (max-width: 600px) {
  .dice-result,
  .movement-calc {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
