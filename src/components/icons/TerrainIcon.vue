<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
    class="terrain-icon"
    :class="`terrain-icon--${type}`"
  >
    <!-- Flat: Horizontal road -->
    <template v-if="type === 'flat'">
      <path d="M2 16h20" />
      <path d="M6 16v4" />
      <path d="M18 16v4" />
      <path d="M2 12h4l2-2 4 0 2 2h8" />
    </template>
    
    <!-- Hill: Small bump -->
    <template v-else-if="type === 'hill'">
      <path d="M2 18L8 12L12 14L16 10L22 18" />
      <path d="M2 18h20" />
    </template>
    
    <!-- Mountain: High peaks -->
    <template v-else-if="type === 'mountain'">
      <path d="M2 20L8 8L12 14L18 4L22 20" />
      <path d="M2 20h20" />
      <circle cx="18" cy="4" r="1.5" fill="currentColor" />
    </template>
    
    <!-- Descent: Downward slope -->
    <template v-else-if="type === 'descent'">
      <path d="M4 6L20 18" />
      <path d="M4 6l4 1" />
      <path d="M4 6l1 4" />
      <path d="M2 20h20" />
    </template>
    
    <!-- Sprint: Finish flag -->
    <template v-else-if="type === 'sprint'">
      <path d="M4 4v16" />
      <rect x="4" y="4" width="12" height="8" />
      <path d="M4 8h12" />
      <path d="M8 4v8" />
      <path d="M12 4v8" />
    </template>
    
    <!-- Refuel: Banana -->
    <template v-else-if="type === 'refuel'">
      <path d="M5 8C5 5 8 4 12 4C16 4 19 5 19 8" />
      <path d="M5 8C3 12 6 18 12 20C18 18 21 12 19 8" />
      <path d="M9 8C9 10 10 12 12 12C14 12 15 10 15 8" />
    </template>
    
    <!-- Default: Question mark -->
    <template v-else>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9a3 3 0 1 1 3.5 2.9c-.6.2-1.5.7-1.5 1.6V15" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  type: { 
    type: String, 
    required: true,
    validator: (v) => ['flat', 'hill', 'mountain', 'descent', 'sprint', 'refuel'].includes(v)
  },
  size: { type: [Number, String], default: 20 }
});
</script>

<style scoped>
.terrain-icon {
  flex-shrink: 0;
}

/* Terrain colors */
.terrain-icon--flat { color: #5B8C65; }
.terrain-icon--hill { color: #B8963C; }
.terrain-icon--mountain { color: #8B6E5C; }
.terrain-icon--descent { color: #4A7BA7; }
.terrain-icon--sprint { color: #7E5BA3; }
.terrain-icon--refuel { color: #D4A017; }
</style>
