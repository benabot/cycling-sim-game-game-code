<template>
  <section class="intro-splash" role="presentation">
    <div class="intro-splash__backdrop" aria-hidden="true"></div>
    <img
      class="intro-splash__image"
      :class="{ 'is-entered': isEntered }"
      src="/intro/chassepatate.webp"
      alt="Chasse-Patate"
    />
    <button
      type="button"
      class="btn btn-ghost btn-sm intro-splash__skip"
      @click="skip"
    >
      Passer
    </button>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const emit = defineEmits(['skip']);
const isEntered = ref(false);
let previousOverflow = '';

function skip() {
  emit('skip');
}

onMounted(() => {
  if (typeof document === 'undefined') return;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    isEntered.value = true;
  });
});

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = previousOverflow || '';
});
</script>

<style scoped>
.intro-splash {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: #1e242d;
  overflow: hidden;
}

.intro-splash__backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08), transparent 45%);
  pointer-events: none;
}

.intro-splash__image {
  position: relative;
  max-width: min(960px, 92vw);
  max-height: 80vh;
  width: 100%;
  height: auto;
  object-fit: contain;
  transform: scale(1.15);
  transition: transform 800ms ease-out;
  will-change: transform;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lg);
}

.intro-splash__image.is-entered {
  transform: scale(1);
}

.intro-splash__skip {
  position: absolute;
  bottom: var(--space-lg);
  right: var(--space-lg);
}

@media (max-width: 700px) {
  .intro-splash__skip {
    bottom: var(--space-md);
    right: var(--space-md);
  }
}
</style>
