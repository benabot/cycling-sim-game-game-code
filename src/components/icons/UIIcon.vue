<template>
  <svg 
    :class="['ui-icon', sizeClass]"
    :width="computedSize" 
    :height="computedSize" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <!-- AI Chip (minimalist circuit) -->
    <g v-if="type === 'ai'">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M6 10H3" />
      <path d="M6 14H3" />
      <path d="M18 10h3" />
      <path d="M18 14h3" />
      <path d="M10 6V3" />
      <path d="M14 6V3" />
      <path d="M10 18v3" />
      <path d="M14 18v3" />
    </g>

    <!-- Human -->
    <g v-else-if="type === 'human'">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
    </g>

    <!-- Die/Dice -->
    <g v-else-if="type === 'die'">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
    </g>

    <!-- Card -->
    <g v-else-if="type === 'card'">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 10h4" />
    </g>

    <!-- Attack (sword/bolt) -->
    <g v-else-if="type === 'attack'">
      <path d="M14.5 2l6 6-2 2-6-6 2-2z" />
      <path d="M8 8l-4 4 6 6 4-4" />
      <path d="M14 14l-6 6" />
      <path d="M4 4l2 2" />
    </g>

    <!-- Wind -->
    <g v-else-if="type === 'wind'">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </g>

    <!-- Rain -->
    <g v-else-if="type === 'rain'">
      <path d="M7 16h9a4 4 0 0 0 0-8 5 5 0 0 0-9.5 1.5A3 3 0 0 0 7 16z" />
      <path d="M9 19v2M13 19v2M17 19v2" />
    </g>

    <!-- Shelter -->
    <g v-else-if="type === 'shelter'">
      <path d="M3 11l9-9 9 9" />
      <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
    </g>

    <!-- Summit/Mountain -->
    <g v-else-if="type === 'summit'">
      <path d="M8 21l4-10 4 10" />
      <path d="M2 21h20" />
      <path d="M12 11V3" />
      <path d="M9 6l3-3 3 3" />
    </g>

    <!-- Finish flag -->
    <g v-else-if="type === 'finish'">
      <path d="M4 22V4" />
      <path d="M4 4h12l-2 4 2 4H4" />
      <rect x="5" y="4" width="4" height="4" fill="currentColor" stroke="none" />
      <rect x="9" y="8" width="4" height="4" fill="currentColor" stroke="none" />
    </g>

    <!-- Aspiration/Draft -->
    <g v-else-if="type === 'aspiration'">
      <path d="M12 2v10" />
      <path d="M8 8l4 4 4-4" />
      <path d="M5 14h14" />
      <path d="M5 18h14" />
      <path d="M5 22h14" />
    </g>

    <!-- Refuel/Banana -->
    <g v-else-if="type === 'refuel'">
      <path d="M5 11c0-3 2-5 5-5 4 0 6 2 8 5-2 1-4 2-8 2-3 0-4-.5-5-2z" />
      <path d="M18 11c1 2 1 5-1 7-2 2-5 2-7 1" />
    </g>

    <!-- History/Clock -->
    <g v-else-if="type === 'history'">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </g>

    <!-- Settings/Gear -->
    <g v-else-if="type === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </g>

    <!-- Start/Play -->
    <g v-else-if="type === 'start'">
      <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
    </g>

    <!-- Check -->
    <g v-else-if="type === 'check'">
      <polyline points="20 6 9 17 4 12" />
    </g>

    <!-- Close/X -->
    <g v-else-if="type === 'close'">
      <path d="M18 6L6 18M6 6l12 12" />
    </g>

    <!-- Chevron Down -->
    <g v-else-if="type === 'chevron-down'">
      <polyline points="6 9 12 15 18 9" />
    </g>

    <!-- Chevron Up -->
    <g v-else-if="type === 'chevron-up'">
      <polyline points="18 15 12 9 6 15" />
    </g>

    <!-- Chevron Left -->
    <g v-else-if="type === 'chevron-left'">
      <polyline points="15 18 9 12 15 6" />
    </g>

    <!-- Chevron Right -->
    <g v-else-if="type === 'chevron-right'">
      <polyline points="9 18 15 12 9 6" />
    </g>

    <!-- Info -->
    <g v-else-if="type === 'info'">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </g>

    <!-- Warning -->
    <g v-else-if="type === 'warning'">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </g>

    <!-- Team -->
    <g v-else-if="type === 'team'">
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="7" r="2" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M17 14a3 3 0 0 1 3 3v4" />
    </g>

    <!-- Star (specialty) -->
    <g v-else-if="type === 'star'">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </g>

    <!-- Injured/Crash -->
    <g v-else-if="type === 'crash'">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </g>

    <!-- Energy/Battery -->
    <g v-else-if="type === 'energy'">
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <path d="M22 11v2" />
      <rect x="4" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" />
    </g>

    <!-- Book/Rules -->
    <g v-else-if="type === 'book'">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </g>

    <!-- Target/Aim (opportunist) -->
    <g v-else-if="type === 'target'">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </g>

    <!-- Shield (conservative) -->
    <g v-else-if="type === 'shield'">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </g>

    <!-- Balance (balanced) -->
    <g v-else-if="type === 'balance'">
      <path d="M12 2v6" />
      <path d="M6 8l6-2 6 2" />
      <path d="M3 14l3-6 3 6-3 1z" />
      <path d="M15 14l3-6 3 6-3 1z" />
      <path d="M12 22V8" />
    </g>

    <!-- Trophy -->
    <g v-else-if="type === 'trophy'">
      <path d="M6 9H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" />
      <path d="M18 9h3a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-3" />
      <path d="M6 3h12v6a6 6 0 0 1-12 0V3z" />
      <path d="M12 15v4" />
      <path d="M8 22h8" />
    </g>

    <!-- Restart/Refresh -->
    <g v-else-if="type === 'restart'">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </g>

    <!-- Discard/Inbox -->
    <g v-else-if="type === 'discard'">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </g>

    <!-- Blocked/Cancel (X in circle) -->
    <g v-else-if="type === 'blocked'">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </g>

    <!-- Event/Lightning bolt -->
    <g v-else-if="type === 'event'">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" fill="currentColor" stroke="none" />
    </g>

    <!-- Cursor/Pointer (select) -->
    <g v-else-if="type === 'cursor'">
      <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
    </g>

    <!-- Tempo/Shelter (musical note for tempo concept) -->
    <g v-else-if="type === 'tempo'">
      <circle cx="12" cy="18" r="3" />
      <path d="M12 15V5" />
      <path d="M12 5c2 0 4 1 4 3" />
    </g>

    <!-- Calendar (stage races) -->
    <g v-else-if="type === 'calendar'">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </g>

    <!-- Laurel (classic races / victory) -->
    <g v-else-if="type === 'laurel'">
      <path d="M12 3v18" />
      <path d="M5 8c2-2 5-2 7 0" />
      <path d="M19 8c-2-2-5-2-7 0" />
      <path d="M4 13c2-1 5-1 8 1" />
      <path d="M20 13c-2-1-5-1-8 1" />
      <path d="M5 18c2 0 5-1 7-3" />
      <path d="M19 18c-2 0-5-1-7-3" />
    </g>

    <!-- Cobbles/Pavés (Nord style) -->
    <g v-else-if="type === 'cobbles'">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </g>

    <!-- Road (flat/highway) -->
    <g v-else-if="type === 'road'">
      <path d="M4 19L8 5h8l4 14" />
      <path d="M9 19h6" />
      <path d="M10 8h4M11 12h2M10 16h4" />
    </g>

    <!-- Hill (small climb / côte) -->
    <g v-else-if="type === 'hill'">
      <path d="M3 20L9 10l4 5 8-12" />
      <path d="M3 20h18" />
    </g>

    <!-- Mountain (bigger than hill, with peak) -->
    <g v-else-if="type === 'mountain'">
      <path d="M8 21l4-10 4 10" />
      <path d="M2 21l6-12 4 6 6-12" />
      <path d="M2 21h20" />
    </g>

    <!-- Save (floppy disk) -->
    <g v-else-if="type === 'save'">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </g>

    <!-- Upload (arrow up + line) -->
    <g v-else-if="type === 'upload'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </g>

    <!-- Download (arrow down + line) -->
    <g v-else-if="type === 'download'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </g>

    <!-- Play (triangle, alias for start but hollow) -->
    <g v-else-if="type === 'play'">
      <polygon points="5,3 19,12 5,21" />
    </g>

    <!-- Link/Share -->
    <g v-else-if="type === 'link'">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </g>

    <!-- Copy/Clipboard -->
    <g v-else-if="type === 'copy'">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </g>

    <!-- Medal -->
    <g v-else-if="type === 'medal'">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </g>

    <!-- Chart/Stats -->
    <g v-else-if="type === 'chart'">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </g>

    <!-- Bike/Cycling -->
    <g v-else-if="type === 'bike'">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h3" />
    </g>

    <!-- Twitter/X -->
    <g v-else-if="type === 'twitter'">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" stroke="none" />
    </g>

    <!-- Facebook -->
    <g v-else-if="type === 'facebook'">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </g>

    <!-- LinkedIn -->
    <g v-else-if="type === 'linkedin'">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </g>

    <!-- WhatsApp -->
    <g v-else-if="type === 'whatsapp'">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2z" />
    </g>

    <!-- Fallback: question mark -->
    <g v-else>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (v) => [
      'ai', 'human', 'die', 'card', 'attack', 'wind', 'rain', 'shelter', 'summit',
      'finish', 'aspiration', 'refuel', 'history', 'settings', 'start',
      'check', 'close', 'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right',
      'info', 'warning', 'team', 'star', 'crash', 'energy', 'book', 'target',
      'shield', 'balance', 'trophy', 'restart', 'discard', 'blocked', 'event',
      'cursor', 'tempo', 'calendar', 'laurel', 'cobbles', 'road', 'hill', 'mountain',
      'save', 'upload', 'download', 'play', 'link', 'copy', 'medal', 'chart', 'bike',
      'twitter', 'facebook', 'linkedin', 'whatsapp'
    ].includes(v)
  },
  size: {
    type: [Number, String],
    default: 20
  }
});

const computedSize = computed(() => {
  if (typeof props.size === 'number') return props.size;
  const sizes = { xs: 14, sm: 16, md: 20, lg: 24, xl: 32 };
  return sizes[props.size] || 20;
});

const sizeClass = computed(() => {
  if (typeof props.size === 'string' && ['xs', 'sm', 'md', 'lg', 'xl'].includes(props.size)) {
    return `ui-icon--${props.size}`;
  }
  return '';
});
</script>

<style scoped>
.ui-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.ui-icon--xs { width: 14px; height: 14px; }
.ui-icon--sm { width: 16px; height: 16px; }
.ui-icon--md { width: 20px; height: 20px; }
.ui-icon--lg { width: 24px; height: 24px; }
.ui-icon--xl { width: 32px; height: 32px; }
</style>
