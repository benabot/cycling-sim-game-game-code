<template>
  <div class="rider-panel card" :class="{ 'rider-panel--played': hasPlayedThisTurn }">
    <!-- Header -->
    <div class="rider-panel-header" :class="getTeamClass(rider.team)">
      <div class="rider-identity">
        <RiderToken
          :rider="rider"
          :isSelected="false"
          :isActive="true"
          static
        />
        <div class="rider-identity-info">
          <span class="type-body-medium">{{ rider.name }}</span>
          <span class="type-caption">{{ riderTypeName }}</span>
          <span v-if="rider.raceEvent" class="badge badge-pill badge-yellow rider-event-badge">
            <UIIcon :type="rider.raceEvent.iconKey || 'event'" :size="12" />
            {{ rider.raceEvent.label }}
          </span>
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

      <button @click="$emit('cancel')" class="btn-close" title="Retour">
        <UIIcon type="close" :size="16" />
      </button>
    </div>

    <!-- Cards Grid -->
    <div class="rider-panel-cards">
      <!-- Movement Cards -->
      <div class="cards-section">
        <div class="cards-section-header">
          <UIIcon type="card" :size="16" class="section-icon" />
          <span class="type-label">Cartes mouvement</span>
          <span class="badge badge-muted">{{ rider.hand?.length || 0 }}</span>
        </div>
        <div class="cards-list">
          <button
            v-for="card in rider.hand"
            :key="card.id"
            class="game-card"
            :class="[getCardClasses(card, false), `game-card--value-${card.value}`]"
            :style="{ '--card-bg': card.color }"
            @click="onCardClick(card, false)"
          >
            <span class="game-card-value">+{{ card.value }}</span>
            <span class="game-card-name">{{ formatMovementCardName(card) }}</span>
          </button>
          <span v-if="!rider.hand?.length" class="type-caption cards-empty">
            Main vide — cartes fin de tour
          </span>
        </div>
      </div>

      <!-- Attack Cards -->
      <div class="cards-section cards-section--attack">
        <div class="cards-section-header">
          <UIIcon type="attack" :size="16" class="section-icon" />
          <span class="type-label">Cartes attaque</span>
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
          <span class="type-label">Cartes spécialité</span>
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
    </div>

    <!-- Bottom row: Context + Actions side by side (only when not played) -->
    <div v-if="!hasPlayedThisTurn" class="rider-bottom-row">
      <div class="rider-context">
        <div class="context-panel context-panel--secondary">
          <div class="context-header">
            <UIIcon type="cursor" :size="14" class="section-icon" />
            <span class="type-label">Aide à la décision</span>
          </div>
          <div class="context-chips">
            <span class="context-chip">Terrain: {{ terrainName }}</span>
            <span class="context-chip">Bonus: {{ formatBonus(terrainBonus) }}</span>
            <span class="context-chip">Énergie estimée: {{ formatEnergyEstimate(decisionAid?.energyEstimate) }}</span>
            <span class="context-chip">Vent: {{ formatWindRisk(decisionAid?.windRisk) }}</span>
          </div>
          <p class="context-note">{{ decisionAid?.coachNote || '—' }}</p>
        </div>
      </div>

      <!-- Action Slot -->
      <div class="rider-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Compact summary bar (only when played) -->
    <div v-else class="rider-summary-bar">
      <div class="summary-chips">
        <span class="summary-chip summary-chip--card">
          <UIIcon type="card" :size="12" />
          {{ formatValue(turnSummary?.cardLabel) }}
        </span>
        <span class="summary-chip summary-chip--dice">
          <UIIcon type="dice" :size="12" />
          {{ formatValue(turnSummary?.dice) }}
        </span>
        <span class="summary-chip summary-chip--total">
          <strong>={{ formatValue(turnSummary?.total) }}</strong>
        </span>
        <span class="summary-chip summary-chip--energy">
          <UIIcon type="energy" :size="12" />
          {{ formatEnergySummary(turnSummary) }}
        </span>
        <span v-if="turnSummary?.usedSpecialty" class="summary-chip summary-chip--specialty">
          <UIIcon type="star" :size="12" />
          Spé
        </span>
      </div>
      <div class="rider-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RiderConfig, TerrainConfig } from '../config/game.config.js';
import { getEnergyEffects } from '../core/energy.js';
import { formatMovementCardName } from '../utils/movement_cards.js';
import RiderToken from './RiderToken.vue';
import EnergyBar from './EnergyBar.vue';
import { TerrainIcon, UIIcon } from './icons';

const props = defineProps({
  rider: { type: Object, required: true },
  terrain: { type: String, required: true },
  terrainBonus: { type: Number, default: 0 },
  canUseSpecialty: { type: Boolean, default: false },
  turnPhase: { type: String, required: true },
  selectedCardId: { type: String, default: null },
  viewOnly: { type: Boolean, default: false },
  hasPlayedThisTurn: { type: Boolean, default: false },
  decisionAid: { type: Object, default: null },
  turnSummary: { type: Object, default: null }
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

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function formatEnergyEstimate(value) {
  if (!Number.isFinite(value)) return '—';
  return Math.round(value);
}

function formatEnergySummary(summary) {
  const before = summary?.energyBefore;
  const after = summary?.energyAfter;
  if (!Number.isFinite(before) || !Number.isFinite(after)) return '—';
  return `${before} → ${after}`;
}

function formatWindRisk(risk) {
  if (risk === null || risk === undefined) return '—';
  return risk ? 'Exposé' : 'Abri';
}

function getCardClasses(card, isAttack) {
  const isSelectable = !props.viewOnly && (props.turnPhase === 'select_card' || props.turnPhase === 'roll_dice');
  return {
    'game-card--selectable': isSelectable && (!isAttack || canUseAttackCard.value),
    'game-card--selected': card.id === props.selectedCardId,
    'game-card--relais': card.name === 'Relais',
    'game-card--tempo': card.name === 'Tempo',
    'game-card--disabled': isAttack && !canUseAttackCard.value
  };
}

function onCardClick(card, isAttack) {
  if (props.viewOnly) return;
  if (props.turnPhase !== 'select_card' && props.turnPhase !== 'roll_dice') return;
  emit('selectCard', card.id, isAttack);
}
</script>

<style scoped>
.rider-panel {
  padding: 0;
  overflow: hidden;
}

/* Played state - more compact */
.rider-panel--played .rider-panel-cards {
  padding: var(--space-xs) var(--space-sm);
  gap: var(--space-xs);
}

.rider-panel--played .cards-section {
  padding: var(--space-xs) var(--space-sm);
  flex: 0 1 auto;
}

.rider-panel--played .cards-section-header {
  margin-bottom: var(--space-xs);
  padding-bottom: 0;
  border-bottom: none;
  font-size: 11px;
}

.rider-panel--played .cards-section-header .badge {
  display: none;
}

.rider-panel--played .game-card {
  min-width: 36px;
  min-height: 36px;
  padding: var(--space-xs);
  opacity: 0.65;
}

.rider-panel--played .game-card-value {
  font-size: 0.9em;
}

.rider-panel--played .game-card-name {
  display: none;
}

/* Summary bar - compact horizontal layout */
.rider-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(to right, var(--color-canvas), var(--color-surface));
  border-top: 1px solid var(--color-line-subtle);
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
}

.summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 500;
  background: var(--color-surface);
  border: 1px solid var(--color-line-subtle);
  color: var(--color-ink-soft);
}

.summary-chip--card {
  background: linear-gradient(135deg, #E8F0E7 0%, #DCE8DB 100%);
  border-color: rgba(140, 170, 140, 0.3);
  color: #4A6A4A;
}

.summary-chip--dice {
  background: linear-gradient(135deg, #E8E4F0 0%, #DCD8E8 100%);
  border-color: rgba(140, 130, 170, 0.3);
  color: #5A4A6A;
}

.summary-chip--total {
  background: linear-gradient(135deg, #F5EDD8 0%, #EDE4CA 100%);
  border-color: rgba(200, 170, 100, 0.4);
  color: #7A6A2A;
  font-size: 12px;
}

.summary-chip--energy {
  background: linear-gradient(135deg, #E0F0E5 0%, #D0E5D8 100%);
  border-color: rgba(100, 170, 130, 0.3);
  color: #3A6A4A;
}

.summary-chip--specialty {
  background: linear-gradient(135deg, #FFF8E0 0%, #F5EDD0 100%);
  border-color: rgba(200, 170, 80, 0.4);
  color: #8A7A2A;
}

.rider-summary-bar .rider-actions {
  flex-shrink: 0;
}

/* Header */
.rider-panel-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
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

.rider-event-badge {
  margin-top: 4px;
  align-self: flex-start;
  font-size: 10px;
  line-height: 12px;
  padding: 2px 6px;
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
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-canvas);
}

/* Base section styling */
.cards-section {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-line-subtle);
}

/* Movement section - primary, most important */
.cards-section:not(.cards-section--attack):not(.cards-section--specialty) {
  flex: 1;
  min-width: 0;
}

/* Attack section - accent purple */
.cards-section--attack {
  background: linear-gradient(135deg, rgba(222, 216, 232, 0.4) 0%, rgba(232, 224, 240, 0.3) 100%);
  border-color: rgba(160, 140, 180, 0.25);
}

/* Specialty section - accent green */
.cards-section--specialty {
  background: linear-gradient(135deg, rgba(216, 232, 220, 0.4) 0%, rgba(224, 240, 229, 0.3) 100%);
  border-color: rgba(140, 180, 160, 0.25);
}

.cards-section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-line-subtle);
}

.cards-section-header .section-icon {
  color: var(--color-ink-soft);
}

.cards-section--attack .cards-section-header .section-icon {
  color: #8B7BA8;
}

.cards-section--specialty .cards-section-header .section-icon {
  color: #6B9B7A;
}

.energy-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 10px;
}

.cards-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

.cards-empty {
  color: var(--color-ink-muted);
  font-style: italic;
  font-size: 11px;
  padding: var(--space-xs) 0;
}

/* Game Cards - Tactile board game style */
.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-md);
  min-width: 56px;
  min-height: 56px;
  background: var(--card-bg, var(--color-canvas));
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-md);
  cursor: default;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  position: relative;
}

/* Inner highlight for depth */
.game-card::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: calc(var(--radius-md) - 1px);
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 40%
  );
  pointer-events: none;
}

.game-card--selectable {
  cursor: pointer;
  border-color: var(--color-accent);
  box-shadow:
    0 2px 4px rgba(47, 111, 237, 0.15),
    0 4px 8px rgba(47, 111, 237, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.game-card--selectable:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 4px 12px rgba(47, 111, 237, 0.2),
    0 8px 16px rgba(47, 111, 237, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.game-card--selectable:active {
  transform: translateY(-1px) scale(1);
}

.game-card--selected {
  border-color: var(--color-gold);
  box-shadow:
    0 0 0 2px var(--color-gold),
    0 4px 12px rgba(215, 162, 26, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.game-card--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.3);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.game-card--disabled::before {
  display: none;
}

/* Card color variants */
.game-card--relais {
  background: linear-gradient(145deg, #EDE9DD 0%, #E0DBD0 100%) !important;
  border-color: rgba(180, 170, 150, 0.3);
}
.game-card--tempo {
  background: linear-gradient(145deg, #E8F0E7 0%, #D9E8D8 100%) !important;
  border-color: rgba(150, 180, 150, 0.3);
}
.game-card--attack {
  background: linear-gradient(145deg, #E8E0F0 0%, #D8D0E5 100%);
  border-color: rgba(160, 140, 180, 0.3);
}
.game-card--specialty {
  background: linear-gradient(145deg, #E0F0E5 0%, #D0E5D8 100%);
  border-color: rgba(140, 180, 160, 0.3);
}

.game-card-value {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 1.25em;
  color: var(--color-ink);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  line-height: 1;
}

.game-card-name {
  font-size: 0.65em;
  font-weight: 500;
  color: var(--color-ink-muted);
  margin-top: 2px;
  text-transform: capitalize;
}

/* Card value variants - visual hierarchy by power */
.game-card--value-1,
.game-card--value-2 {
  background: linear-gradient(145deg, #F0EDE6 0%, #E6E3DC 100%);
  border-color: rgba(160, 155, 145, 0.25);
}
.game-card--value-1 .game-card-value,
.game-card--value-2 .game-card-value {
  color: var(--color-ink-soft);
}

.game-card--value-3 {
  background: linear-gradient(145deg, #E8F0E7 0%, #DCE8DB 100%);
  border-color: rgba(140, 170, 140, 0.3);
}
.game-card--value-3 .game-card-value {
  color: #4A7A4A;
}

.game-card--value-4 {
  background: linear-gradient(145deg, #EEF3DD 0%, #E4EAD2 100%);
  border-color: rgba(170, 180, 120, 0.35);
}
.game-card--value-4 .game-card-value {
  color: #6A7A3A;
}

.game-card--value-5 {
  background: linear-gradient(145deg, #F5EDD8 0%, #EDE4CA 100%);
  border-color: rgba(200, 170, 100, 0.4);
}
.game-card--value-5 .game-card-value {
  color: #9A7A2A;
  font-size: 1.35em;
}

.game-card--value-6 {
  background: linear-gradient(145deg, #F8E8D5 0%, #F0DCC5 100%);
  border-color: rgba(210, 150, 90, 0.45);
}
.game-card--value-6 .game-card-value {
  color: #B86A2A;
  font-size: 1.4em;
}

/* Attack cards - distinctive purple/power theme */
.game-card--attack .game-card-value {
  color: #6B4A8A;
  font-size: 1.4em;
}

/* Specialty cards */
.game-card--specialty .game-card-value {
  color: #4A7A5A;
}

/* Bottom row: context + actions side by side */
.rider-bottom-row {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md) var(--space-md);
  align-items: stretch;
}

.rider-context {
  flex: 1;
  min-width: 0;
}

.rider-actions {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.rider-actions > :deep(*) {
  width: 100%;
  margin: 0;
}

.context-panel {
  border: 1px solid var(--color-line-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-canvas);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.context-panel--secondary {
  background: rgba(248, 247, 244, 0.6);
  border-style: dashed;
}

.context-panel--secondary .context-chip {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(31, 35, 40, 0.08);
  color: var(--color-ink-muted);
}

.context-panel--secondary .context-note {
  font-size: 10px;
  color: var(--color-ink-muted);
}

.context-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.context-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.context-chip {
  padding: 2px var(--space-sm);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-line-subtle);
  background: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  color: var(--color-ink-soft);
}

.context-note {
  margin: 0;
  font-size: 11px;
  color: var(--color-ink-muted);
}

.context-summary {
  display: grid;
  gap: var(--space-xs);
}

.context-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: var(--space-sm);
  font-size: 12px;
}

.context-key {
  color: var(--color-ink-muted);
}

.context-value {
  color: var(--color-ink);
  font-weight: 500;
}

/* Utils */
.text-danger { color: var(--color-danger); }
.text-muted { color: var(--color-ink-muted); }

/* Responsive - Mobile simplified */
@media (max-width: 900px) {
  .rider-panel {
    font-size: 14px;
  }

  .rider-panel-header {
    padding: var(--space-xs) var(--space-sm);
    gap: var(--space-xs);
  }

  .rider-identity {
    gap: var(--space-xs);
  }

  .rider-stats {
    gap: var(--space-xs);
  }

  .stat-pill {
    padding: 2px var(--space-xs);
    font-size: 11px;
  }

  .rider-energy-section {
    min-width: 100px;
  }

  /* Cards - simplified for mobile */
  .rider-panel-cards {
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
  }

  .cards-section {
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface) !important;
    border: 1px solid var(--color-line-subtle);
  }

  .cards-section-header {
    margin-bottom: var(--space-xs);
    padding-bottom: 0;
    border-bottom: none;
    font-size: 11px;
  }

  .cards-list {
    gap: var(--space-xs);
  }

  /* Simplified cards on mobile - no fancy shadows */
  .game-card {
    min-width: 48px;
    min-height: 44px;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    box-shadow: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .game-card::before {
    display: none;
  }

  .game-card--selectable {
    border-color: var(--color-accent);
    box-shadow: 0 1px 3px rgba(47, 111, 237, 0.15);
  }

  .game-card--selectable:hover {
    transform: none;
    box-shadow: 0 2px 6px rgba(47, 111, 237, 0.2);
  }

  .game-card-value {
    font-size: 1.1em;
  }

  .game-card-name {
    font-size: 9px;
  }

  /* Bottom row */
  .rider-bottom-row {
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
  }

  .context-panel {
    padding: var(--space-xs) var(--space-sm);
    gap: var(--space-xs);
  }

  .context-chips {
    gap: 4px;
  }

  .context-chip {
    font-size: 10px;
    padding: 2px 6px;
  }

  .context-note {
    font-size: 10px;
  }

  /* Summary bar */
  .rider-summary-bar {
    padding: var(--space-xs) var(--space-sm);
    gap: var(--space-sm);
  }

  .summary-chip {
    font-size: 10px;
    padding: 2px 6px;
  }
}

/* Extra small screens */
@media (max-width: 400px) {
  .game-card {
    min-width: 40px;
    min-height: 38px;
  }

  .game-card-name {
    display: none;
  }

  .context-panel {
    display: none;
  }
}
</style>
