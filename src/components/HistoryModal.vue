<template>
  <ModalShell
    :model-value="modelValue"
    title="Historique"
    max-width="720px"
    max-height="82vh"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <p v-if="!cleanedEntries.length" class="history-modal__empty">
      Aucun événement pour le moment.
    </p>
    <ul v-else class="history-modal__list">
      <li v-for="(entry, index) in cleanedEntries" :key="index">
        {{ entry }}
      </li>
    </ul>
  </ModalShell>
</template>

<script setup>
import { computed } from 'vue';
import ModalShell from './ModalShell.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  log: { type: Array, default: () => [] }
});

defineEmits(['update:modelValue']);

const cleanedEntries = computed(() => {
  return (props.log || [])
    .map(entry => normalizeLogText(getEntryText(entry)))
    .filter(text => text.length);
});

function getEntryText(entry) {
  if (typeof entry === 'string') return entry;
  return entry?.message || entry?.text || '';
}

function normalizeLogText(text) {
  if (!text) return '';
  let cleaned = text
    .replace(/🏁|🏆|💨|🛡️|🌀|⚔️|🍌|🤕|⚠️|🎲|▶️|➡️/g, '')
    .replace(/\[FINISH\]|\[WINNER\]|\[WIND\]|\[SHELTER\]|\[ASPIRATION\]|\[ATTACK\]|\[REFUEL\]|\[CRASH\]|\[EVENT\]/g, '')
    .replace(/[=═-]{3,}/g, '')
    .replace(/!+/g, '')
    .trim();

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/Tour\s+\d+/i, '').trim();
  return cleaned;
}
</script>

<style scoped>
.history-modal__empty {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 14px;
}

.history-modal__list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}
</style>
