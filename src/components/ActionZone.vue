<template>
  <div class="action-zone">
    <!-- Phase: Select Card -->
    <div v-if="turnPhase === 'select_card'" class="action-content">
      <div class="action-prompt">
        <span class="action-prompt-step">1</span>
        <span class="type-body">Choisissez une carte.</span>
      </div>
      <div class="action-buttons">
        <button type="button" class="btn btn-secondary" @click="$emit('cancelSelection')">
          <UIIcon type="chevron-up" :size="16" class="icon-back" />
          Retour
        </button>
        <button type="button" class="btn btn-primary" disabled>
          Sélectionner une carte
        </button>
      </div>
    </div>

    <!-- Phase: Roll Dice -->
    <div v-if="turnPhase === 'roll_dice'" class="action-content">
      <div class="action-preview">
        <span class="type-caption">Carte</span>
        <span class="action-preview-value" :class="{ 'action-preview-value--attack': isAttackCard }">
          +{{ cardValue }}
        </span>
      </div>
      <div class="action-buttons">
        <button type="button" @click="$emit('cancelCard')" class="btn btn-secondary">
          <UIIcon type="chevron-up" :size="16" class="icon-back" />
          Retour
        </button>
        <button type="button" @click="$emit('rollDice')" class="btn btn-primary">
          <span class="step-badge">2</span>
          <UIIcon type="die" :size="18" />
          Lancer le dé
        </button>
      </div>
    </div>

    <!-- Phase: Select Specialty -->
    <div v-if="turnPhase === 'select_specialty'" class="action-content">
      <div class="dice-result">
        <span class="dice-result-item">
          <UIIcon type="die" :size="18" class="dice-result-icon" />
          <span class="dice-result-value type-numeric-lg">{{ diceResult }}</span>
        </span>
        <span class="dice-result-op">+</span>
        <span class="dice-result-item">
          <UIIcon type="card" :size="18" class="dice-result-icon" />
          <span class="dice-result-value type-numeric-lg">{{ cardValue }}</span>
        </span>
        <template v-if="terrainBonus !== 0">
          <span class="dice-result-op">{{ terrainBonus > 0 ? '+' : '' }}</span>
          <span class="dice-result-item" :class="terrainBonus > 0 ? 'dice-result-item--positive' : 'dice-result-item--negative'">
            <span class="dice-result-value type-numeric-lg">{{ terrainBonus }}</span>
          </span>
        </template>
      </div>
      <p class="type-body">Spécialité (+2) ?</p>
      <div class="action-buttons">
        <button
          type="button"
          @click="$emit('skipSpecialty')"
          class="btn btn-secondary"
        >
          Sans spécialité
          <UIIcon type="chevron-down" :size="16" class="icon-forward" />
        </button>
        <button 
          v-if="hasSpecialtyCards"
          type="button"
          @click="$emit('useSpecialty')" 
          class="btn btn-primary"
        >
          <UIIcon type="star" :size="16" />
          Utiliser +2
        </button>
      </div>
    </div>

    <!-- Phase: Resolve -->
    <div v-if="turnPhase === 'resolve'" class="action-content">
      <div class="movement-calc">
        <span class="calc-item">
          <UIIcon type="die" :size="14" />
          {{ diceResult }}
        </span>
        <span class="calc-op">+</span>
        <span class="calc-item">
          <UIIcon type="card" :size="14" />
          {{ cardValue }}
        </span>
        <template v-if="terrainBonus !== 0">
          <span class="calc-op">{{ terrainBonus > 0 ? '+' : '' }}</span>
          <span class="calc-item" :class="terrainBonus > 0 ? 'calc-item--positive' : 'calc-item--negative'">{{ terrainBonus }}</span>
        </template>
        <template v-if="useSpecialty">
          <span class="calc-op">+</span>
          <span class="calc-item calc-item--specialty">
            <UIIcon type="star" :size="12" />
            2
          </span>
        </template>
        <span class="calc-op">=</span>
        <span class="calc-result type-numeric-lg">{{ totalMovement }}</span>
      </div>
      <div class="movement-summary type-caption">
        Déplacement : {{ totalMovement }} cases → case {{ targetPosition }}
      </div>
      <div class="action-buttons">
        <button type="button" class="btn btn-secondary" disabled>
          Retour
        </button>
        <button type="button" @click="$emit('resolve')" class="btn btn-primary btn-primary--confirm">
          ✓ Confirmer le déplacement
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { UIIcon } from './icons';

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

defineEmits(['cancelSelection', 'rollDice', 'cancelCard', 'useSpecialty', 'skipSpecialty', 'resolve']);

const targetPosition = computed(() => props.currentPosition + props.totalMovement);
</script>

<style scoped>
.action-zone {
  padding: var(--space-md) var(--space-lg);
  margin: 0 var(--space-md) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: 0 10px 26px rgba(31, 35, 40, 0.12);
  --color-accent: var(--race-yellow);
  --color-accent-hover: color-mix(in srgb, var(--race-yellow) 86%, #000 14%);
  --color-accent-active: color-mix(in srgb, var(--race-yellow) 72%, #000 28%);
  --color-accent-light: color-mix(in srgb, var(--race-yellow) 16%, transparent);
}

.action-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
  color: var(--color-ink-muted);
}

.action-prompt-step {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--race-yellow);
  color: #2f2418;
  border-radius: 50%;
  font-weight: 600;
  font-family: var(--font-mono);
}

.step-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  font-weight: 600;
  font-family: var(--font-mono);
  font-size: 0.85em;
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
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
  font-size: 1.25em;
  padding: var(--space-xs) var(--space-md);
  background: color-mix(in srgb, var(--race-yellow) 18%, white);
  border: 1px solid rgba(31, 35, 40, 0.08);
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
  padding: var(--space-sm);
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
  color: var(--color-ink-muted);
}

.dice-result-op {
  color: var(--color-ink-muted);
  font-weight: 500;
}

/* Movement Calculation - Plateau Premium */
.movement-calc {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-paper);
  border-radius: var(--radius-card);
  box-shadow: 0 4px 20px rgba(31, 35, 40, 0.08);
  border: 1px solid var(--color-line-subtle);
}

.calc-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-ink-soft);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-canvas);
  border-radius: var(--radius-sm);
}

.calc-op {
  color: var(--color-ink-muted);
  font-weight: 500;
}

.calc-item--positive { 
  color: #3A8A5A;  /* vert désaturé */
  background: #E5EDE4;
}
.calc-item--negative { 
  color: #B55A5A;  /* rouge désaturé */
  background: #F0E5E5;
}
.calc-item--specialty { 
  color: #3A8A5A;
  background: var(--card-specialty); 
}

.calc-result {
  padding: var(--space-sm) var(--space-md);
  background: #3A3D42;  /* ardoise, pas noir */
  color: var(--color-paper);
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 1.25em;
  box-shadow: 0 3px 12px rgba(31, 35, 40, 0.15);
  min-width: 44px;
  text-align: center;
}

.movement-summary {
  text-align: center;
  color: var(--color-ink-muted);
}

/* Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
  width: 100%;
}

.action-zone .btn {
  border-radius: 14px;
  box-shadow: 0 6px 14px rgba(31, 35, 40, 0.12);
  border: 1px solid rgba(31, 35, 40, 0.12);
  font-weight: 600;
  min-height: 46px;
  padding: 10px 16px;
  width: 100%;
}

.action-zone .btn-primary {
  color: #2f2418;
}

.action-zone .btn-secondary {
  background: transparent;
  color: var(--color-ink);
  border-color: rgba(31, 35, 40, 0.2);
  box-shadow: none;
}

.action-zone .btn-secondary:hover:not(:disabled) {
  background: rgba(31, 35, 40, 0.06);
}

.action-zone .btn-primary--confirm {
  box-shadow: 0 10px 20px rgba(31, 35, 40, 0.18);
}

.action-zone .btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.icon-back {
  transform: rotate(-90deg);
}

.icon-forward {
  transform: rotate(-90deg);
}

/* Responsive */
@media (max-width: 600px) {
  .dice-result,
  .movement-calc {
    flex-wrap: wrap;
    justify-content: center;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
