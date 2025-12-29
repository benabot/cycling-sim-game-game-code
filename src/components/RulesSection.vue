<template>
  <div class="rules-section">
    <h2>Règles</h2>

    <div class="rules-grid">
      <div
        v-for="card in rulesContent.cards"
        :key="card.id"
        class="rule-card"
        :class="{ highlight: card.highlight }"
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
          <div class="profile-list">
            <div
              v-for="profile in card.profiles"
              :key="profile.type"
              class="profile-item"
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

    <div class="bonus-table">
      <h3>{{ bonusTable.title }}</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th v-for="header in bonusTable.headers" :key="header.id">
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
  </div>
</template>

<script setup>
import { RulesUIContent } from '../ui/rules/ui_rules.js';
import { UIIcon, RiderIcon, TerrainIcon } from './icons';

const rulesContent = RulesUIContent;
const bonusTable = RulesUIContent.bonusTable;

function formatBonusValue(value) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function getBonusClass(value) {
  if (value > 0) return 'bonus';
  if (value < 0) return 'malus';
  return '';
}
</script>

<style scoped>
.rules-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
}

.rules-section h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #1e293b;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.rule-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.rule-card.highlight {
  border-color: #3b82f6;
  background: #eff6ff;
}

.rule-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px 0;
  font-weight: 600;
  font-size: 0.95em;
}

.rule-card p,
.rule-card ul,
.rule-card ol {
  margin: 0;
  font-size: 0.85em;
  color: #475569;
}

.rule-card p + p { margin-top: 5px; }
.rule-card ul, .rule-card ol { padding-left: 18px; }
.rule-card li { margin: 3px 0; }
.rule-card em { font-size: 0.9em; color: #64748b; }

.profile-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-item {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
}

.profile-item .type-caption {
  color: #64748b;
}

/* Bonus table */
.bonus-table {
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.bonus-table h3 {
  margin: 0 0 12px 0;
  text-align: center;
}

.bonus-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.bonus-table th,
.bonus-table td {
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.bonus-table th {
  background: #f8fafc;
  font-weight: 600;
}

.bonus-table td:first-child {
  text-align: left;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.bonus-table .bonus {
  background: #dcfce7;
  color: #166534;
  font-weight: bold;
}

.bonus-table .malus {
  background: #fee2e2;
  color: #991b1b;
  font-weight: bold;
}

@media (max-width: 600px) {
  .bonus-table table {
    font-size: 0.75em;
  }
  .bonus-table th,
  .bonus-table td {
    padding: 5px 3px;
  }
}
</style>
