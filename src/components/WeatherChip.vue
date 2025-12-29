<template>
  <div
    class="weather-chip"
    :class="weatherClass"
    :title="tooltip"
    :aria-label="ariaLabel"
  >
    <span class="weather-chip__icon">{{ icon }}</span>
    <span class="weather-chip__label">{{ label }}</span>
    <span v-if="nextIcon" class="weather-chip__next">→ {{ nextIcon }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RaceWeather } from '../core/race_weather.js';

const props = defineProps({
  weather: { type: String, default: RaceWeather.CLEAR },
  nextWeather: { type: String, default: null }
});

const WEATHER_LABELS = {
  [RaceWeather.CLEAR]: 'Ciel clair',
  [RaceWeather.WIND]: 'Vent',
  [RaceWeather.RAIN]: 'Pluie'
};

const WEATHER_ICONS = {
  [RaceWeather.CLEAR]: '☀️',
  [RaceWeather.WIND]: '🌬️',
  [RaceWeather.RAIN]: '🌧️'
};

const WEATHER_TOOLTIPS = {
  [RaceWeather.CLEAR]: 'Aucun effet',
  [RaceWeather.WIND]: 'Incident +',
  [RaceWeather.RAIN]: 'Chute + (descente)'
};

const label = computed(() => WEATHER_LABELS[props.weather] || WEATHER_LABELS[RaceWeather.CLEAR]);
const icon = computed(() => WEATHER_ICONS[props.weather] || WEATHER_ICONS[RaceWeather.CLEAR]);
const tooltip = computed(() => WEATHER_TOOLTIPS[props.weather] || WEATHER_TOOLTIPS[RaceWeather.CLEAR]);
const weatherClass = computed(() => `weather-chip--${props.weather || RaceWeather.CLEAR}`);

const nextIcon = computed(() => {
  if (!props.nextWeather || props.nextWeather === props.weather) return '';
  return WEATHER_ICONS[props.nextWeather] || '';
});

const ariaLabel = computed(() => {
  const next = nextIcon.value ? ` → ${nextIcon.value}` : '';
  return `${icon.value} ${label.value}${next}`;
});
</script>

<style scoped>
.weather-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--weather-color) 20%, transparent);
  background: color-mix(in srgb, var(--weather-color) 10%, var(--color-surface));
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
}

.weather-chip__icon {
  line-height: 1;
}

.weather-chip__next {
  color: var(--color-ink-subtle);
  font-weight: 500;
}

.weather-chip--clear {
  --weather-color: #e7c96a;
}

.weather-chip--wind {
  --weather-color: #8aa3c7;
}

.weather-chip--rain {
  --weather-color: #7aa0b8;
}
</style>
