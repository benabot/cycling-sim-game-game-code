<template>
  <div class="selected-rider-panel">
    <!-- Header -->
    <div class="selected-rider-header" :style="{ background: teamConfig?.bgColor, borderColor: teamConfig?.color }">
      <div class="rider-identity">
        <span class="rider-emoji-large">{{ riderEmoji }}</span>
        <div class="rider-details">
          <span class="rider-name">{{ rider.name }}</span>
          <span class="rider-type">{{ riderTypeName }}</span>
        </div>
      </div>
      
      <div class="rider-stats">
        <div class="stat-item">
          <span class="stat-label">Case</span>
          <span class="stat-value">{{ rider.position }}</span>
        </div>
        <div class="stat-item terrain-stat" :class="terrain">
          <span class="stat-label">Terrain</span>
          <span class="stat-value">{{ terrainEmoji }} {{ terrainName }}</span>
        </div>
        <div class="stat-item bonus-stat" :class="{ 'positive': terrainBonus > 0, 'negative': terrainBonus < 0 }">
          <span class="stat-label">Bonus terrain</span>
          <span class="stat-value">{{ formatBonus(terrainBonus) }}</span>
        </div>
      </div>

      <button @click="$emit('cancel')" class="btn-change-rider" title="Changer de coureur">
        ← Changer
      </button>
    </div>

    <!-- Cards -->
    <div class="selected-rider-cards">
      <!-- Movement Cards -->
      <div class="cards-section">
        <h4>🃏 Cartes Mouvement ({{ rider.hand?.length || 0 }})</h4>
        <div class="cards-list">
          <div 
            v-for="card in rider.hand" 
            :key="card.id"
            class="card-item"
            :class="{ 
              'selectable': turnPhase === 'select_card' || turnPhase === 'roll_dice',
              'selected': card.id === selectedCardId,
              'wind-card': card.name === 'Prise de vent',
              'shelter-card': card.name === 'Abri'
            }"
            :style="{ background: card.color }"
            @click="onCardClick(card, false)"
          >
            <span class="card-value">+{{ card.value }}</span>
            <span class="card-name">{{ card.name }}</span>
          </div>
          <div v-if="rider.hand?.length === 0" class="empty-cards">
            Main vide - Recyclage au prochain tour
          </div>
        </div>
      </div>

      <!-- Attack Cards -->
      <div class="cards-section attack-section">
        <h4>⚔️ Attaques ({{ rider.attackCards?.length || 0 }}/2)</h4>
        <div class="cards-list">
          <div 
            v-for="card in rider.attackCards" 
            :key="card.id"
            class="card-item attack-card"
            :class="{ 
              'selectable': turnPhase === 'select_card' || turnPhase === 'roll_dice',
              'selected': card.id === selectedCardId
            }"
            @click="onCardClick(card, true)"
          >
            <span class="card-value">+6</span>
            <span class="card-name">Attaque</span>
          </div>
          <div v-if="rider.attackCards?.length === 0" class="empty-cards">Épuisées</div>
        </div>
      </div>

      <!-- Specialty Cards -->
      <div class="cards-section specialty-section">
        <h4>★ Spécialités ({{ rider.specialtyCards?.length || 0 }}/2)</h4>
        <div class="cards-list">
          <div 
            v-for="card in rider.specialtyCards" 
            :key="card.id"
            class="card-item specialty-card"
            :class="{ 
              'selectable': turnPhase === 'select_specialty' && canUseSpecialty,
              'disabled': !canUseSpecialty
            }"
          >
            <span class="card-value">+2</span>
            <span class="card-name">{{ specialtyTerrainName }}</span>
          </div>
          <div v-if="rider.specialtyCards?.length === 0" class="empty-cards">Épuisées</div>
        </div>
        <div v-if="!canUseSpecialty && rider.specialtyCards?.length > 0" class="specialty-hint">
          (Utilisable sur {{ specialtyTerrainName }})
        </div>
      </div>

      <!-- Discard -->
      <div class="discard-section" v-if="rider.discard?.length > 0">
        <h4>📥 Défausse ({{ rider.discard.length }})</h4>
        <div class="discard-preview">
          <span 
            v-for="card in rider.discard" 
            :key="card.id"
            class="discard-card"
            :class="{ 'wind': card.name === 'Prise de vent' }"
          >
            +{{ card.value }}
          </span>
        </div>
      </div>
    </div>

    <!-- Action Zone -->
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { TeamConfig, RiderConfig, TerrainConfig } from '../config/game.config.js';

const props = defineProps({
  rider: { type: Object, required: true },
  terrain: { type: String, required: true },
  terrainBonus: { type: Number, default: 0 },
  canUseSpecialty: { type: Boolean, default: false },
  turnPhase: { type: String, required: true },
  selectedCardId: { type: String, default: null }
});

const emit = defineEmits(['cancel', 'selectCard']);

const teamConfig = computed(() => TeamConfig[props.rider.team]);
const riderEmoji = computed(() => RiderConfig[props.rider.type]?.emoji || '🚴');
const riderTypeName = computed(() => RiderConfig[props.rider.type]?.name || '');
const terrainEmoji = computed(() => TerrainConfig[props.terrain]?.emoji || '');
const terrainName = computed(() => TerrainConfig[props.terrain]?.name || '');
const specialtyTerrainName = computed(() => RiderConfig[props.rider.type]?.specialtyName || 'Tous terrains');

function formatBonus(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return '0';
}

function onCardClick(card, isAttack) {
  // Allow card selection during 'select_card' AND 'roll_dice' phases
  // This lets the player change their card before rolling the dice
  if (props.turnPhase !== 'select_card' && props.turnPhase !== 'roll_dice') return;
  emit('selectCard', card.id, isAttack);
}
</script>

<style scoped>
.selected-rider-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.selected-rider-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 20px;
  border-left: 4px solid;
  flex-wrap: wrap;
}

.rider-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rider-emoji-large { font-size: 2.5em; }

.rider-details {
  display: flex;
  flex-direction: column;
}

.rider-name {
  font-weight: bold;
  font-size: 1.2em;
}

.rider-type {
  color: #64748b;
  font-size: 0.9em;
}

.rider-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 15px;
  background: white;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.75em;
  color: #94a3b8;
  text-transform: uppercase;
}

.stat-value {
  font-weight: bold;
  font-size: 1.1em;
}

.bonus-stat.positive .stat-value { color: #16a34a; }
.bonus-stat.negative .stat-value { color: #dc2626; }

.btn-change-rider {
  margin-left: auto;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-change-rider:hover { background: #f1f5f9; }

.selected-rider-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  padding: 20px;
}

.cards-section h4 {
  margin: 0 0 10px 0;
  font-size: 0.95em;
  color: #475569;
}

.cards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-item {
  padding: 8px 12px;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.15s;
  text-align: center;
  min-width: 60px;
}

.card-item.selectable {
  cursor: pointer;
  border-color: #3b82f6;
}
.card-item.selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
.card-item.selected {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px #fbbf24;
}
.card-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.card-item.wind-card { background: #e5e7eb !important; }
.card-item.shelter-card { background: #d1fae5 !important; }

.attack-card { background: #c4b5fd; }
.specialty-card { background: #bbf7d0; }

.card-value {
  display: block;
  font-weight: bold;
  font-size: 1.2em;
}

.card-name {
  display: block;
  font-size: 0.75em;
  color: #64748b;
}

.empty-cards {
  color: #94a3b8;
  font-size: 0.85em;
  font-style: italic;
}

.specialty-hint {
  font-size: 0.8em;
  color: #94a3b8;
  margin-top: 5px;
}

.discard-section h4 {
  color: #94a3b8;
}

.discard-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.discard-card {
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.8em;
  color: #64748b;
}
.discard-card.wind { background: #fecaca; color: #dc2626; }

@media (max-width: 900px) {
  .selected-rider-header { flex-direction: column; align-items: flex-start; }
  .rider-stats { width: 100%; justify-content: flex-start; }
  .selected-rider-cards { flex-direction: column; }
}
</style>
