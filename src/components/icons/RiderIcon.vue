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
    class="rider-icon"
    :class="`rider-icon--${type}`"
  >
    <!-- Climber: Mountain peaks -->
    <template v-if="type === 'climber'">
      <path d="M4 20L10 8L14 14L20 4" />
      <path d="M4 20H20" />
    </template>
    
    <!-- Puncher: Explosion/Impact -->
    <template v-else-if="type === 'puncher'">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </template>
    
    <!-- Rouleur: Wheel/Cog -->
    <template v-else-if="type === 'rouleur'">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="5" x2="12" y2="1" />
      <line x1="12" y1="23" x2="12" y2="19" />
      <line x1="5" y1="12" x2="1" y2="12" />
      <line x1="23" y1="12" x2="19" y2="12" />
    </template>
    
    <!-- Sprinter: Lightning bolt -->
    <template v-else-if="type === 'sprinter'">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </template>
    
    <!-- Versatile: All-around/Diamond -->
    <template v-else-if="type === 'versatile'">
      <rect x="6" y="6" width="12" height="12" rx="1" transform="rotate(45 12 12)" />
      <circle cx="12" cy="12" r="3" />
    </template>
    
    <!-- Default: Cyclist -->
    <template v-else>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2 2" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  type: { 
    type: String, 
    required: true,
    validator: (v) => ['climber', 'puncher', 'rouleur', 'sprinter', 'versatile'].includes(v)
  },
  size: { type: [Number, String], default: 20 }
});
</script>

<style scoped>
.rider-icon {
  flex-shrink: 0;
}

/* Specialty colors (optional, can be overridden) */
.rider-icon--climber { color: var(--terrain-mountain, #E6D3C7); }
.rider-icon--puncher { color: var(--terrain-hill, #F4E8B8); }
.rider-icon--rouleur { color: var(--terrain-flat, #DDF2E2); }
.rider-icon--sprinter { color: var(--terrain-sprint, #E6DDF6); }
.rider-icon--versatile { color: var(--color-gold, #D7A21A); }
</style>
