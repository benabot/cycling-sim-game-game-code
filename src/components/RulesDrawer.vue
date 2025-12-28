<template>
  <div class="rules-drawer">
    <!-- Trigger Button -->
    <button 
      class="rules-drawer-trigger"
      :class="{ 'rules-drawer-trigger--open': isOpen }"
      @click="toggle"
    >
      <UIIcon type="book" size="sm" />
      <span>Règles v3.2</span>
      <UIIcon :type="isOpen ? 'chevron-up' : 'chevron-down'" size="sm" />
    </button>

    <!-- Drawer Content -->
    <div 
      class="rules-drawer-content"
      :class="{ 'rules-drawer-content--open': isOpen }"
    >
      <div class="rules-drawer-inner">
        <!-- Quick Reference Cards -->
        <div class="rules-grid">
          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="target" size="sm" />
              <span>Objectif</span>
            </div>
            <p>Franchir la ligne d'arrivée en premier. Départ case 0, arrivée au-delà de {{ courseLength }}.</p>
          </div>

          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="die" size="sm" />
              <span>Séquence</span>
            </div>
            <ol>
              <li>Choisir une carte</li>
              <li>Lancer 1d6</li>
              <li>Voir aperçu → Spécialité?</li>
              <li>Avancer du total</li>
            </ol>
          </div>

          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="card" size="sm" />
              <span>Cartes Mouvement</span>
            </div>
            <p class="type-numeric">+2, +3, +3, +4, +4, +5</p>
            <p class="type-caption">Recyclées quand épuisées</p>
          </div>

          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="attack" size="sm" />
              <span>Cartes Attaque</span>
            </div>
            <p class="type-numeric">+6 (×2, usage unique)</p>
            <p class="type-caption">Ne sont pas recyclées</p>
          </div>

          <div class="rule-card rule-card--highlight">
            <div class="rule-card-header">
              <UIIcon type="star" size="sm" />
              <span>Spécialités (+2)</span>
            </div>
            <div class="specialty-list">
              <div class="specialty-item">
                <RiderIcon type="climber" :size="14" />
                <span>Grimpeur</span>
                <span class="type-caption">Montagne + pas d'arrêt sommet</span>
              </div>
              <div class="specialty-item">
                <RiderIcon type="puncher" :size="14" />
                <span>Puncheur</span>
                <span class="type-caption">Côte (+2)</span>
              </div>
              <div class="specialty-item">
                <RiderIcon type="rouleur" :size="14" />
                <span>Rouleur</span>
                <span class="type-caption">Plat (+2) + immunité vent</span>
              </div>
              <div class="specialty-item">
                <RiderIcon type="sprinter" :size="14" />
                <span>Sprinteur</span>
                <span class="type-caption">Sprint (+3)</span>
              </div>
              <div class="specialty-item">
                <RiderIcon type="versatile" :size="14" />
                <span>Polyvalent</span>
                <span class="type-caption">Partout</span>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="team" size="sm" />
              <span>Cases (Max 4)</span>
            </div>
            <p>Max 4 coureurs par case. Premier arrivé = leader (droite).</p>
            <p class="type-caption">Si pleine → arrêt derrière</p>
          </div>

          <div class="rule-card rule-card--highlight">
            <div class="rule-card-header">
              <UIIcon type="summit" size="sm" />
              <span>Arrêt au Sommet</span>
            </div>
            <p>Les <strong>non-grimpeurs</strong> s'arrêtent à la dernière case montagne.</p>
            <p class="type-caption">Les grimpeurs passent librement.</p>
          </div>

          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="aspiration" size="sm" />
              <span>Aspiration</span>
            </div>
            <p>Fin de tour : 1 case d'écart → avancer d'1 case.</p>
            <p class="type-caption">Pas en montagne/descente. Dès tour 1.</p>
          </div>

          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="wind" size="sm" />
              <span>Relais (+1)</span>
            </div>
            <p>Case vide devant → leader reçoit carte +1.</p>
            <p class="type-caption">Pas en montagne. Rouleurs immunisés (+2).</p>
          </div>

          <div class="rule-card">
            <div class="rule-card-header">
              <UIIcon type="shelter" size="sm" />
              <span>Tempo (+2)</span>
            </div>
            <p>Tous les autres coureurs reçoivent +2.</p>
            <p class="type-caption">En montagne : tous reçoivent +2.</p>
          </div>
        </div>

        <!-- Bonus Table (Accordion) -->
        <details class="bonus-details">
          <summary class="bonus-summary">
            <UIIcon type="info" size="sm" />
            <span>Tableau des bonus terrain</span>
            <UIIcon type="chevron-down" size="sm" class="chevron-icon" />
          </summary>
          <div class="bonus-table-wrapper">
            <table class="bonus-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th><TerrainIcon type="flat" :size="14" /> Plat</th>
                  <th><TerrainIcon type="hill" :size="14" /> Côte</th>
                  <th><TerrainIcon type="mountain" :size="14" /> Montagne</th>
                  <th><TerrainIcon type="descent" :size="14" /> Descente</th>
                  <th><TerrainIcon type="sprint" :size="14" /> Sprint</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><RiderIcon type="climber" :size="14" /> Grimpeur</td>
                  <td>0</td>
                  <td>+1</td>
                  <td class="bonus">+2</td>
                  <td>+2</td>
                  <td class="malus">-1</td>
                </tr>
                <tr>
                  <td><RiderIcon type="puncher" :size="14" /> Puncheur</td>
                  <td>0</td>
                  <td class="bonus">+2</td>
                  <td>+1</td>
                  <td>+2</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td><RiderIcon type="rouleur" :size="14" /> Rouleur</td>
                  <td class="bonus">+2</td>
                  <td>0</td>
                  <td class="malus">-1</td>
                  <td>+3</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td><RiderIcon type="sprinter" :size="14" /> Sprinteur</td>
                  <td>0</td>
                  <td class="malus">-1</td>
                  <td class="malus">-2</td>
                  <td>+3</td>
                  <td class="bonus">+3</td>
                </tr>
                <tr>
                  <td><RiderIcon type="versatile" :size="14" /> Polyvalent</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>+2</td>
                  <td>0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { UIIcon, RiderIcon, TerrainIcon } from './icons';

const props = defineProps({
  courseLength: {
    type: Number,
    default: 80
  }
});

const isOpen = ref(false);

function toggle() {
  isOpen.value = !isOpen.value;
}

// Expose for parent component control
defineExpose({ toggle, isOpen });
</script>

<style scoped>
.rules-drawer {
  position: relative;
}

/* Trigger Button */
.rules-drawer-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-ink);
  cursor: pointer;
  transition: var(--transition-fast);
}

.rules-drawer-trigger:hover {
  background: var(--color-paper);
  border-color: var(--color-line-strong);
}

.rules-drawer-trigger--open {
  border-color: var(--team-blue-ui);
  box-shadow: 0 0 0 2px var(--team-blue-light);
}

/* Drawer Content */
.rules-drawer-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--transition-smooth);
  overflow: hidden;
  margin-top: var(--space-sm);
}

.rules-drawer-content--open {
  grid-template-rows: 1fr;
}

.rules-drawer-inner {
  min-height: 0;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
}

/* Rules Grid */
.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

/* Rule Card */
.rule-card {
  background: var(--color-paper);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.rule-card--highlight {
  border-color: var(--team-blue-print);
  background: var(--team-blue-light);
}

.rule-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 500;
  margin-bottom: var(--space-sm);
  color: var(--color-ink);
}

.rule-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.rule-card p + p {
  margin-top: var(--space-xs);
}

.rule-card ol {
  margin: 0;
  padding-left: var(--space-lg);
  font-size: 13px;
  color: var(--color-ink-soft);
}

.rule-card li {
  margin: var(--space-xs) 0;
}

/* Specialty List */
.specialty-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.specialty-item {
  display: grid;
  grid-template-columns: 16px 70px 1fr;
  align-items: center;
  gap: var(--space-xs);
  font-size: 12px;
}

.specialty-item .type-caption {
  color: var(--color-muted);
}

/* Bonus Details */
.bonus-details {
  margin-top: var(--space-lg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.bonus-summary {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-paper);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  list-style: none;
}

.bonus-summary::-webkit-details-marker {
  display: none;
}

.bonus-summary .chevron-icon {
  margin-left: auto;
  transition: transform var(--transition-fast);
}

.bonus-details[open] .chevron-icon {
  transform: rotate(180deg);
}

.bonus-table-wrapper {
  padding: var(--space-md);
  overflow-x: auto;
}

.bonus-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: var(--font-mono);
}

.bonus-table th,
.bonus-table td {
  padding: var(--space-xs) var(--space-sm);
  text-align: center;
  border-bottom: 1px solid var(--color-line);
}

.bonus-table th {
  background: var(--color-paper);
  font-weight: 500;
  font-family: var(--font-ui);
}

.bonus-table td:first-child {
  text-align: left;
  font-family: var(--font-ui);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.bonus-table .bonus {
  background: rgba(53, 181, 106, 0.15);
  color: #166534;
  font-weight: 600;
}

.bonus-table .malus {
  background: rgba(216, 74, 74, 0.15);
  color: #991b1b;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 600px) {
  .rules-grid {
    grid-template-columns: 1fr;
  }
  
  .bonus-table {
    font-size: 11px;
  }
  
  .specialty-item {
    grid-template-columns: 14px 60px 1fr;
  }
}
</style>
