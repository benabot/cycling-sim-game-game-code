<template>
  <div class="rider-panel card">
    <!-- Header -->
    <div class="rider-panel-header" :class="getTeamClass(rider.team)">
      <div class="rider-identity">
        <RiderToken
          :rider="rider"
          :isSelected="false"
          static
        />
        <div class="rider-identity-info">
          <span class="type-body-medium">{{ rider.name }}</span>
          <span class="type-caption">{{ riderTypeName }}</span>
        </div>
      </div>

      <div class="rider-stats">
        <div class="stat-pill">
          <span class="stat-pill-label">Case</span>
          <span class="stat-pill-value type-numeric">{{ rider.position }}</span>
        </div>
        <div class="stat-pill" :class="`stat-pill--${terrain}`">
          <TerrainIcon :type="terrain" :size="16" />
          <span class="stat-pill-value">{{ terrainName }}</span>
        </div>
        <div class="stat-pill" :class="bonusClass">
          <span class="stat-pill-label">Bonus</span>
          <span class="stat-pill-value">
            <template v-if="energyEffects.bonusDisabled">
              <UIIcon type="blocked" :size="14" />
            </template>
            <template v-else>
              {{ formatBonus(terrainBonus) }}
            </template>
          </span>
        </div>
      </div>

      <!-- Energy Bar -->
      <div class="rider-energy-section">
        <EnergyBar :energy="rider.energy || 100" :showEffects="true" />
      </div>

      <button @click="$emit('cancel')" class="btn-close" title="Changer de coureur">
        <UIIcon type="close" :size="16" />
      </button>
    </div>

    <!-- Cards Grid -->
    <div class="rider-panel-cards">
      <!-- Movement Cards -->
      <div class="cards-section">
        <div class="cards-section-header">
          <UIIcon type="card" :size="16" class="section-icon" />
          <span class="type-label">Cartes Mouvement</span>
          <span class="badge badge-muted">{{ rider.hand?.length || 0 }}</span>
        </div>
        <div class="cards-list">
          <button 
            v-for="card in rider.hand" 
            :key="card.id"
            class="game-card"
            :class="getCardClasses(card, false)"
            :style="{ '--card-bg': card.color }"
            @click="onCardClick(card, false)"
          >
            <span class="game-card-value">+{{ card.value }}</span>
            <span class="game-card-name">{{ card.name }}</span>
          </button>
          <span v-if="!rider.hand?.length" class="type-caption cards-empty">
            Main vide - Recyclage prochain tour
          </span>
        </div>
      </div>

      <!-- Attack Cards -->
      <div class="cards-section cards-section--attack">
        <div class="cards-section-header">
          <UIIcon type="attack" :size="16" class="section-icon" />
          <span class="type-label">Attaques</span>
          <span class="badge badge-muted">{{ rider.attackCards?.length || 0 }}/2</span>
          <span v-if="!canUseAttackCard" class="type-caption text-danger energy-warning">
            <UIIcon type="energy" :size="12" />
            Énergie insuffisante
          </span>
        </div>
        <div class="cards-list">
          <button 
            v-for="card in rider.attackCards" 
            :key="card.id"
            class="game-card game-card--attack"
            :class="getCardClasses(card, true)"
            :disabled="!canUseAttackCard"
            @click="canUseAttackCard && onCardClick(card, true)"
          >
            <span class="game-card-value">
              <template v-if="canUseAttackCard">+{{ 6 + (energyEffects.attackPenalty || 0) }}</template>
              <template v-else><UIIcon type="blocked" :size="16" /></template>
            </span>
            <span class="game-card-name">Attaque</span>
          </button>
          <span v-if="!rider.attackCards?.length" class="type-caption cards-empty">Épuisées</span>
        </div>
      </div>

      <!-- Specialty Cards -->
      <div class="cards-section cards-section--specialty">
        <div class="cards-section-header">
          <UIIcon type="star" :size="16" class="section-icon" />
          <span class="type-label">Spécialités</span>
          <span class="badge badge-muted">{{ rider.specialtyCards?.length || 0 }}/2</span>
          <span v-if="!energyEffects.canUseSpecialty" class="type-caption text-danger energy-warning">
            <UIIcon type="energy" :size="12" />
            Énergie insuffisante
          </span>
        </div>
        <div class="cards-list">
          <button 
            v-for="card in rider.specialtyCards" 
            :key="card.id"
            class="game-card game-card--specialty"
            :class="{ 'game-card--disabled': !canUseSpecialtyCard }"
            :disabled="!canUseSpecialtyCard"
          >
            <span class="game-card-value">
              <template v-if="energyEffects.canUseSpecialty">+{{ 2 + (energyEffects.specialtyPenalty || 0) }}</template>
              <template v-else><UIIcon type="blocked" :size="16" /></template>
            </span>
            <span class="game-card-name">{{ specialtyTerrainName }}</span>
          </button>
          <span v-if="!rider.specialtyCards?.length" class="type-caption cards-empty">Épuisées</span>
        </div>
        <p v-if="!canUseSpecialty && rider.specialtyCards?.length && energyEffects.canUseSpecialty" class="type-caption text-muted">
          (Utilisable sur {{ specialtyTerrainName }})
        </p>
      </div>

      <!-- Discard Pile -->
      <div v-if="rider.discard?.length" class="cards-section cards-section--discard">
        <div class="cards-section-header">
          <UIIcon type="discard" :size="16" class="section-icon text-muted" />
          <span class="type-label text-muted">Défausse</span>
          <span class="badge badge-muted">{{ rider.discard.length }}</span>
        </div>
        <div class="discard-preview">
          <span 
            v-for="card in rider.discard" 
            :key="card.id"
            class="discard-chip"
            :class="{ 'discard-chip--relais': card.name === 'Relais' }"
          >
            +{{ card.value }}
          </span>
        </div>
      </div>
    </div>

    <!-- Action Slot -->
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { TeamConfig, RiderConfig, TerrainConfig } from '../config/game.config.js';
import { getEnergyEffects } from '../core/energy.js';
import RiderToken from './RiderToken.vue';
import EnergyBar from './EnergyBar.vue';
import { TerrainIcon, UIIcon } from './icons';

const props = defineProps({
  rider: { type: Object, required: true },
  terrain: { type: String, required: true },
  terrainBonus: { type: Number, default: 0 },
  canUseSpecialty: { type: Boolean, default: false },
  turnPhase: { type: String, required: true },
  selectedCardId: { type: String, default: null }
});

const emit = defineEmits(['cancel', 'selectCard']);

const riderTypeName = computed(() => RiderConfig[props.rider.type]?.name || '');
const terrainName = computed(() => TerrainConfig[props.terrain]?.name || '');
const specialtyTerrainName = computed(() => RiderConfig[props.rider.type]?.specialtyName || 'Tous terrains');

const energyEffects = computed(() => getEnergyEffects(props.rider.energy || 100));
const canUseAttackCard = computed(() => energyEffects.value.canUseAttack);
const canUseSpecialtyCard = computed(() => props.canUseSpecialty && energyEffects.value.canUseSpecialty);

const bonusClass = computed(() => ({
  'stat-pill--positive': props.terrainBonus > 0 && !energyEffects.value.bonusDisabled,
  'stat-pill--negative': props.terrainBonus < 0,
  'stat-pill--disabled': energyEffects.value.bonusDisabled
}));

function getTeamClass(teamId) {
  return {
    team_a: 'rider-panel-header--red',
    team_b: 'rider-panel-header--blue',
    team_c: 'rider-panel-header--green',
    team_d: 'rider-panel-header--yellow'
  }[teamId] || '';
}

function formatBonus(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return '0';
}

function getCardClasses(card, isAttack) {
  const isSelectable = props.turnPhase === 'select_card' || props.turnPhase === 'roll_dice';
  return {
    'game-card--selectable': isSelectable && (!isAttack || canUseAttackCard.value),
    'game-card--selected': card.id === props.selectedCardId,
    'game-card--relais': card.name === 'Relais',
    'game-card--tempo': card.name === 'Tempo',
    'game-card--disabled': isAttack && !canUseAttackCard.value
  };
}

function onCardClick(card, isAttack) {
  if (props.turnPhase !== 'select_card' && props.turnPhase !== 'roll_dice') return;
  emit('selectCard', card.id, isAttack);
}
</script>

<style scoped>
.rider-panel {
  padding: 0;
  overflow: hidden;
}

/* Header */
.rider-panel-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-canvas);
  border-bottom: 1px solid var(--color-line);
}

.rider-panel-header--red { border-left: 4px solid var(--team-red-ui); }
.rider-panel-header--blue { border-left: 4px solid var(--team-blue-ui); }
.rider-panel-header--green { border-left: 4px solid var(--team-green-ui); }
.rider-panel-header--yellow { border-left: 4px solid var(--team-yellow-ui); }

.rider-identity {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.rider-identity-info {
  display: flex;
  flex-direction: column;
}

.rider-stats {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  font-size: 0.85em;
}

.stat-pill-label {
  color: var(--color-ink-muted);
  font-size: 0.75em;
  text-transform: uppercase;
}

.stat-pill--positive .stat-pill-value { color: var(--color-success); font-weight: 600; }
.stat-pill--negative .stat-pill-value { color: var(--color-danger); font-weight: 600; }
.stat-pill--disabled { opacity: 0.6; }

.stat-pill--flat { background: var(--terrain-flat); }
.stat-pill--hill { background: var(--terrain-hill); }
.stat-pill--mountain { background: var(--terrain-mountain); }
.stat-pill--descent { background: var(--terrain-descent); }
.stat-pill--sprint { background: var(--terrain-sprint); }

.rider-energy-section {
  flex: 1;
  min-width: 140px;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-canvas);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-full);
  cursor: pointer;
  color: var(--color-ink-muted);
  transition: all var(--transition-fast);
  margin-left: auto;
}

.btn-close:hover {
  background: var(--color-danger-light, #fef2f2);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

/* Cards Grid */
.rider-panel-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-md);
  padding: var(--space-md);
}

.cards-section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.section-icon {
  color: var(--color-ink-muted);
}

.energy-warning {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cards-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.cards-empty {
  color: var(--color-ink-muted);
  font-style: italic;
}

/* Game Cards */
.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--card-bg, var(--color-canvas));
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  cursor: default;
  transition: all 0.15s;
  min-width: 60px;
}

.game-card--selectable {
  cursor: pointer;
  border-color: var(--color-accent);
}

.game-card--selectable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.game-card--selected {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px var(--color-gold);
}

.game-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-card--relais { background: var(--card-movement-1) !important; }
.game-card--tempo { background: var(--card-movement-2) !important; }
.game-card--attack { background: var(--card-attack); }
.game-card--specialty { background: var(--card-specialty); }

.game-card-value {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.1em;
}

.game-card-name {
  font-size: 0.7em;
  color: var(--color-ink-muted);
}

/* Discard */
.discard-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.discard-chip {
  padding: 2px 8px;
  background: var(--color-canvas);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 0.75em;
  color: var(--color-ink-muted);
}

.discard-chip--relais {
  background: #fecaca;
  color: var(--color-danger);
}

/* Utils */
.text-danger { color: var(--color-danger); }
.text-muted { color: var(--color-ink-muted); }

/* Responsive */
@media (max-width: 768px) {
  .rider-panel-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .rider-stats {
    width: 100%;
  }
  
  .rider-energy-section {
    width: 100%;
  }
}
</style>
