<template>
  <div class="rules-drawer">
    <!-- Trigger Button -->
    <button 
      class="rules-drawer-trigger"
      :class="{ 'rules-drawer-trigger--open': isOpen }"
      @click="toggle"
    >
      <UIIcon type="book" size="sm" />
      <span>{{ rulesContent.drawerLabel }}</span>
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
          <div
            v-for="card in rulesContent.cards"
            :key="card.id"
            class="rule-card"
            :class="{ 'rule-card--highlight': card.highlight }"
          >
            <div class="rule-card-header">
              <UIIcon :type="card.icon" size="sm" />
              <span>{{ card.title }}</span>
            </div>

            <ol v-if="card.list">
              <li v-for="item in card.list" :key="item">{{ item }}</li>
            </ol>

            <template v-else-if="card.profiles">
              <p v-if="card.intro">{{ card.intro }}</p>
              <div class="specialty-list">
                <div
                  v-for="profile in card.profiles"
                  :key="profile.type"
                  class="specialty-item"
                >
                  <RiderIcon :type="profile.type" :size="14" />
                  <span>{{ profile.label }}</span>
                  <span v-if="profile.note" class="type-caption">{{ profile.note }}</span>
                </div>
              </div>
            </template>

            <template v-else>
              <p v-for="line in card.lines" :key="line">{{ line }}</p>
            </template>
          </div>
        </div>

        <!-- Bonus Table (Accordion) -->
        <details class="bonus-details">
          <summary class="bonus-summary">
            <UIIcon type="info" size="sm" />
            <span>{{ bonusTable.title }}</span>
            <UIIcon type="chevron-down" size="sm" class="chevron-icon" />
          </summary>
          <div class="bonus-table-wrapper">
            <table class="bonus-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th
                    v-for="header in bonusTable.headers"
                    :key="header.id"
                  >
                    <TerrainIcon :type="header.icon" :size="14" /> {{ header.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in bonusTable.rows" :key="row.id">
                  <td><RiderIcon :type="row.icon" :size="14" /> {{ row.label }}</td>
                  <td
                    v-for="(value, index) in row.values"
                    :key="`${row.id}-${bonusTable.headers[index].id}`"
                    :class="getBonusClass(value)"
                  >
                    {{ formatBonusValue(value) }}
                  </td>
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
import { RulesUIContent } from '../ui/rules/ui_rules.js';
import { UIIcon, RiderIcon, TerrainIcon } from './icons';

defineProps({
  courseLength: {
    type: Number,
    default: 80
  }
});

const rulesContent = RulesUIContent;
const bonusTable = RulesUIContent.bonusTable;

const isOpen = ref(false);

function toggle() {
  isOpen.value = !isOpen.value;
}

function formatBonusValue(value) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function getBonusClass(value) {
  if (value > 0) return 'bonus';
  if (value < 0) return 'malus';
  return '';
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
  border-left: 3px solid var(--team-blue-print);
  background: var(--color-paper);
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
