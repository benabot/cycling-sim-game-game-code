<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="rules-modal-overlay"
      role="presentation"
      @click.self="closeModal"
    >
      <div
        ref="panelRef"
        class="rules-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Règles"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header class="rules-modal__header">
          <h2 class="rules-modal__title">Règles</h2>
          <button
            type="button"
            class="rules-modal__close"
            aria-label="Fermer les règles"
            @click="closeModal"
          >
            <UIIcon type="close" size="sm" />
            <span>Fermer</span>
          </button>
        </header>

        <div class="rules-modal__tabs" role="tablist" aria-label="Sections des règles">
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            role="tab"
            class="rules-modal__tab"
            :class="{ 'rules-modal__tab--active': section.id === activeTab }"
            :aria-selected="section.id === activeTab"
            @click="activeTab = section.id"
          >
            {{ section.label }}
          </button>
        </div>

        <div class="rules-modal__body">
          <div class="rules-modal__cards">
            <div
              v-for="card in activeCards"
              :key="card.id"
              class="rules-modal__card"
            >
              <div class="rules-modal__card-header">
                <UIIcon :type="card.icon" size="sm" />
                <span>{{ card.title }}</span>
              </div>

              <ol v-if="card.list">
                <li v-for="item in card.list" :key="item">{{ item }}</li>
              </ol>

              <template v-else-if="card.profiles">
                <p v-if="card.intro">{{ card.intro }}</p>
                <div class="rules-modal__profiles">
                  <div
                    v-for="profile in card.profiles"
                    :key="profile.type"
                    class="rules-modal__profile"
                  >
                    <RiderIcon :type="profile.type" :size="14" />
                    <span>{{ profile.label }}</span>
                    <span v-if="profile.note" class="rules-modal__profile-note">{{ profile.note }}</span>
                  </div>
                </div>
              </template>

              <template v-else>
                <p v-for="line in card.lines" :key="line">{{ line }}</p>
              </template>
            </div>
          </div>

          <div v-if="activeTab === 'terrain'" class="rules-modal__bonus">
            <h3 class="rules-modal__subtitle">{{ bonusTable.title }}</h3>
            <div class="rules-modal__table-wrap">
              <table class="rules-modal__table">
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
                    <td>
                      <RiderIcon :type="row.icon" :size="14" />
                      {{ row.label }}
                    </td>
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
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { RulesUIContent } from '../ui/rules/ui_rules.js';
import { UIIcon, RiderIcon, TerrainIcon } from './icons';

const props = defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const rulesContent = RulesUIContent;
const bonusTable = RulesUIContent.bonusTable;
const panelRef = ref(null);
const activeTab = ref('objectif');
const lastFocused = ref(null);

const sections = [
  { id: 'objectif', label: 'Objectif', cardIds: ['objectif', 'classements'] },
  { id: 'sequence', label: 'Séquence', cardIds: ['sequence', 'main', 'energie', 'recuperation', 'fin-de-tour'] },
  { id: 'equipes', label: 'Équipes', cardIds: ['equipes'] },
  { id: 'terrain', label: 'Terrain', cardIds: ['cases', 'aspiration', 'vent', 'paves', 'evenements', 'meteo'] }
];

const cardMap = computed(() => {
  const map = new Map();
  rulesContent.cards.forEach(card => map.set(card.id, card));
  return map;
});

const coveredIds = new Set(sections.flatMap(section => section.cardIds));

const activeCards = computed(() => {
  const section = sections.find(item => item.id === activeTab.value) || sections[0];
  const cards = section.cardIds.map(id => cardMap.value.get(id)).filter(Boolean);
  if (section.id === 'terrain') {
    const extras = rulesContent.cards.filter(card => !coveredIds.has(card.id));
    return [...cards, ...extras];
  }
  return cards;
});

function formatBonusValue(value) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function getBonusClass(value) {
  if (value > 0) return 'bonus';
  if (value < 0) return 'malus';
  return '';
}

function closeModal() {
  emit('update:modelValue', false);
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = getFocusableElements();
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFocusableElements() {
  if (!panelRef.value) return [];
  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex=\"-1\"])'
  ];
  return Array.from(panelRef.value.querySelectorAll(selectors.join(',')));
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      activeTab.value = 'objectif';
      lastFocused.value = document.activeElement;
      document.body.style.overflow = 'hidden';
      nextTick(() => {
        const focusable = getFocusableElements();
        if (focusable.length) {
          focusable[0].focus();
        } else {
          panelRef.value?.focus();
        }
      });
    } else {
      document.body.style.overflow = '';
      lastFocused.value?.focus?.();
    }
  }
);
</script>

<style scoped>
.rules-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 24, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  z-index: var(--z-modal);
}

.rules-modal {
  width: min(980px, 100%);
  max-height: min(88vh, 860px);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-line);
  box-shadow: 0 18px 48px rgba(31, 35, 40, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rules-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-paper);
}

.rules-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.rules-modal__close {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.rules-modal__tabs {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border-bottom: 1px solid var(--color-line);
  overflow-x: auto;
}

.rules-modal__tab {
  border: 1px solid var(--color-line);
  background: var(--color-paper);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
}

.rules-modal__tab--active {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 18%, white);
}

.rules-modal__body {
  padding: var(--space-lg);
  overflow: auto;
  font-size: 16px;
}

.rules-modal__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
}

.rules-modal__card {
  background: var(--color-paper);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-line);
  padding: var(--space-md);
}

.rules-modal__card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.rules-modal__card p,
.rules-modal__card ol,
.rules-modal__card li {
  font-size: 16px;
  color: var(--color-ink);
}

.rules-modal__profiles {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rules-modal__profile {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  align-items: center;
  gap: 6px;
  font-size: 16px;
}

.rules-modal__profile-note {
  color: var(--color-ink-muted);
  font-size: 12px;
}

.rules-modal__bonus {
  margin-top: var(--space-lg);
}

.rules-modal__subtitle {
  margin: 0 0 var(--space-sm);
  font-size: 16px;
  font-weight: 600;
}

.rules-modal__table-wrap {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  overflow: auto;
  background: white;
}

.rules-modal__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
}

.rules-modal__table th,
.rules-modal__table td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid var(--color-line);
}

.rules-modal__table th {
  background: var(--color-paper);
  font-weight: 600;
}

.rules-modal__table td:first-child {
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.bonus {
  color: var(--color-success);
}

.malus {
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .rules-modal-overlay {
    padding: var(--space-sm);
    align-items: stretch;
  }

  .rules-modal {
    width: 100%;
    max-height: 100%;
    border-radius: var(--radius-lg);
  }

  .rules-modal__body {
    padding: var(--space-md);
  }

  .rules-modal__cards {
    grid-template-columns: 1fr;
  }
}
</style>
