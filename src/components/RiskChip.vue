<template>
  <div
    class="risk-chip"
    :class="riskClass"
    :title="tooltipText"
    :aria-label="tooltipText"
  >
    <span class="risk-chip__type">{{ typeText }}</span>
    <span class="risk-chip__sep">:</span>
    <span class="risk-chip__level">{{ levelText }}</span>
    <span v-if="reasonText" class="risk-chip__reason">· {{ reasonText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  level: { type: String, default: 'Faible' },
  reason: { type: String, default: null },
  type: { type: String, default: 'Incident' }
});

const levelText = computed(() => props.level || 'Faible');
const typeText = computed(() => props.type || 'Incident');
const reasonText = computed(() => props.reason || '');
const tooltipText = computed(() => 'Indice qualitatif, pas une probabilité.');
const riskClass = computed(() => {
  const normalized = levelText.value.toLowerCase();
  if (normalized.startsWith('élev')) return 'risk-chip--high';
  if (normalized.startsWith('mod')) return 'risk-chip--mid';
  return 'risk-chip--low';
});
</script>

<style scoped>
.risk-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--risk-color) 20%, transparent);
  background: color-mix(in srgb, var(--risk-color) 8%, var(--color-surface));
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
}

.risk-chip__type {
  color: var(--color-ink);
  font-weight: 600;
}

.risk-chip__sep {
  color: var(--color-ink-subtle);
  font-weight: 600;
}

.risk-chip__reason {
  color: var(--color-ink-muted);
  font-weight: 500;
}

.risk-chip--low {
  --risk-color: #9bb38a;
}

.risk-chip--mid {
  --risk-color: #d1b46a;
}

.risk-chip--high {
  --risk-color: #c38a7a;
}
</style>
