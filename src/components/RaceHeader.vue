<template>
  <header class="race-header" :class="[`race-header--${theme}`, { 'race-header--compact': variant === 'compact' }]">
    <!-- Compact variant for race gameplay -->
    <div v-if="variant === 'compact'" class="race-header__compact">
      <div class="race-header__line1">
        <span v-if="turn" class="turn-badge">Tour {{ turn }}</span>
        <span v-if="phase" class="phase-label">{{ phase }}</span>
      </div>
      <div v-if="$slots.chips" class="race-header__line2">
        <slot name="chips" />
      </div>
    </div>

    <!-- Default variant for setup screens -->
    <template v-else>
      <div class="race-header__content">
        <div class="race-header__title-block">
          <span class="race-header__eyebrow">Avant-course</span>
          <h1 class="race-header__title">{{ title }}</h1>
          <p v-if="subtitle" class="race-header__subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="race-header__actions">
          <slot name="actions" />
        </div>
      </div>
      <div class="race-header__ornament" aria-hidden="true"></div>
    </template>
  </header>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'default' }, // 'default' | 'compact'
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  theme: { type: String, default: 'poster' },
  turn: { type: Number, default: null },
  phase: { type: String, default: null }
});
</script>

<style scoped>
.race-header {
  position: relative;
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(250, 247, 241, 0.92));
  border: 1px solid rgba(31, 35, 40, 0.08);
  overflow: hidden;
}

.race-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIyIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=");
  opacity: 0.06;
  pointer-events: none;
}

.race-header::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(227, 181, 74, 0.18), transparent 55%);
  pointer-events: none;
}

.race-header__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
}

.race-header__eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--race-road);
  font-weight: 600;
}

.race-header__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 34px;
  font-weight: 650;
  color: var(--color-ink);
}

.race-header__subtitle {
  margin: var(--space-xs) 0 0;
  font-size: 13px;
  color: var(--color-ink-soft);
}

.race-header__actions {
  display: flex;
  align-items: center;
}

.race-header__ornament {
  position: absolute;
  inset: auto -20% 20% auto;
  width: 220px;
  height: 100px;
  background: linear-gradient(135deg, rgba(143, 167, 194, 0.4), rgba(227, 181, 74, 0.15));
  border-radius: 60px;
  opacity: 0.4;
  transform: rotate(-6deg);
}

/* Compact variant styles */
.race-header--compact {
  padding: 8px 16px;
  background: var(--color-paper);
  border: 1px solid var(--color-line);
}

.race-header--compact::before,
.race-header--compact::after,
.race-header--compact .race-header__ornament {
  display: none;
}

.race-header__compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.race-header__line1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.turn-badge {
  color: var(--color-ink-soft);
}

.phase-label {
  color: var(--color-ink);
}

.race-header__line2 {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.race-header__line2::-webkit-scrollbar {
  display: none;
}

@media (max-width: 720px) {
  .race-header {
    padding: var(--space-md);
  }

  .race-header__content {
    gap: var(--space-md);
  }

  .race-header__actions {
    align-self: center;
  }

  .race-header__title {
    font-size: 22px;
    line-height: 26px;
  }
}
</style>
