<template>
  <Teleport to="body">
    <Transition name="finish-modal">
      <div
        v-if="modelValue"
        class="finish-modal"
        @click.self="close"
      >
        <div
          class="finish-modal__card"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="finish-modal__header">
            <div class="finish-modal__banner">
              <span class="finish-modal__badge">
                <UIIcon type="trophy" size="sm" />
              </span>
              <div class="finish-modal__titles">
                <p class="finish-modal__eyebrow">Course terminée</p>
                <h2 :id="titleId" class="finish-modal__title">
                  {{ raceTitle || 'Résultats' }}
                </h2>
                <p v-if="metaLine" class="finish-modal__meta">{{ metaLine }}</p>
              </div>
            </div>
            <button
              type="button"
              class="finish-modal__close"
              aria-label="Fermer"
              @click="close"
            >
              <UIIcon type="close" />
            </button>
          </header>

          <div class="finish-modal__body">
            <div v-if="finishEntries.length" class="finish-modal__list">
              <article
                v-for="(entry, index) in finishEntries"
                :key="entry.id || `${entry.rank}-${index}`"
                class="finish-row"
                :class="podiumClass(entry.rank)"
                :style="{ '--reveal-delay': `${index * 40}ms` }"
              >
                <div class="finish-row__rank">{{ entry.rank }}</div>
                <div class="finish-row__portrait">
                  <img
                    :src="getPortraitSrc(entry)"
                    :alt="entry.name"
                    class="finish-row__image"
                    @error="onPortraitError(entry.id)"
                  />
                </div>
                <div class="finish-row__identity">
                  <div class="finish-row__name">{{ entry.name }}</div>
                  <div class="finish-row__details">
                    <span v-if="entry.roleLabel" class="finish-row__role">
                      {{ entry.roleLabel }}
                    </span>
                    <span class="finish-row__team">
                      <span
                        class="finish-row__team-dot"
                        :style="{ background: entry.teamColor }"
                      ></span>
                      {{ entry.teamName }}
                    </span>
                  </div>
                </div>
              </article>
            </div>
            <p v-else class="finish-modal__empty">Classement indisponible.</p>
          </div>

          <footer class="finish-modal__footer">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canRestart"
              @click="handleRestart"
            >
              Rejouer la même course
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleNewCourse"
            >
              Nouvelle course
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch, ref } from 'vue';
import UIIcon from './icons/UIIcon.vue';
import { PORTRAIT_FALLBACK_URL } from '../utils/portraits.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  raceTitle: { type: String, default: '' },
  standings: { type: Array, default: () => [] },
  turn: { type: Number, default: null },
  stageRace: { type: Object, default: null },
  canRestart: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'restart', 'new-course']);

const titleId = `finish-modal-title-${Math.random().toString(36).slice(2, 10)}`;
const portraitErrors = ref({});
let previousBodyOverflow = '';

const finishEntries = computed(() => props.standings || []);

const metaLine = computed(() => {
  const parts = [];
  if (props.turn) parts.push(`Tour ${props.turn}`);
  if (props.stageRace?.currentStageIndex != null) {
    const stageIndex = props.stageRace.currentStageIndex + 1;
    parts.push(`Étape ${stageIndex}`);
  }
  return parts.join(' · ');
});

function podiumClass(rank) {
  if (rank === 1) return 'finish-row--gold';
  if (rank === 2) return 'finish-row--silver';
  if (rank === 3) return 'finish-row--bronze';
  return '';
}

function getPortraitSrc(entry) {
  if (!entry?.id || portraitErrors.value[entry.id]) {
    return PORTRAIT_FALLBACK_URL;
  }
  return entry.portraitUrl || PORTRAIT_FALLBACK_URL;
}

function onPortraitError(id) {
  if (!id) return;
  portraitErrors.value = { ...portraitErrors.value, [id]: true };
}

function close() {
  emit('update:modelValue', false);
}

function handleRestart() {
  emit('restart');
  close();
}

function handleNewCourse() {
  emit('new-course');
  close();
}

function handleKeydown(event) {
  if (!props.modelValue) return;
  if (event.key === 'Escape') {
    close();
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeydown);
    } else {
      document.body.style.overflow = previousBodyOverflow || '';
      window.removeEventListener('keydown', handleKeydown);
    }
  }
);

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow || '';
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.finish-modal {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 15, 0.72);
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: clamp(16px, 3vw, 28px);
  backdrop-filter: blur(3px);
}

.finish-modal__card {
  width: min(980px, 94vw);
  max-height: min(86vh, 900px);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: clamp(18px, 2.6vw, 26px);
  border-radius: var(--radius-container);
  background: linear-gradient(145deg, #1b1f26, #171a1f 55%, #14171c);
  color: #f5f6f8;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 60px rgba(10, 12, 15, 0.45);
  position: relative;
  overflow: hidden;
}

.finish-modal__card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 20%, rgba(72, 122, 214, 0.18), transparent 55%),
    radial-gradient(circle at 85% 10%, rgba(229, 184, 42, 0.16), transparent 40%),
    linear-gradient(120deg, rgba(255, 255, 255, 0.06), transparent 60%);
  pointer-events: none;
}

.finish-modal__header,
.finish-modal__body,
.finish-modal__footer {
  position: relative;
  z-index: 1;
}

.finish-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
}

.finish-modal__banner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: 999px;
  background: rgba(15, 18, 23, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.finish-modal__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(215, 162, 26, 0.2);
  color: #f6d37a;
}

.finish-modal__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.finish-modal__eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 246, 248, 0.6);
}

.finish-modal__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 600;
  color: #fdfbf6;
}

.finish-modal__meta {
  margin: 0;
  font-size: 13px;
  color: rgba(245, 246, 248, 0.65);
}

.finish-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(12, 14, 18, 0.7);
  color: rgba(245, 246, 248, 0.75);
  cursor: pointer;
  transition: var(--transition-fast);
}

.finish-modal__close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.finish-modal__close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.finish-modal__body {
  overflow: auto;
  padding-right: 4px;
}

.finish-modal__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.finish-row {
  display: grid;
  grid-template-columns: 44px 48px 1fr;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
  animation: finish-row-enter 360ms ease forwards;
  opacity: 0;
  transform: translateY(6px);
  animation-delay: var(--reveal-delay, 0ms);
}

.finish-row::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.finish-row__rank {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.finish-row__portrait {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  display: grid;
  place-items: center;
}

.finish-row__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.finish-row__identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.finish-row__name {
  font-size: 15px;
  font-weight: 600;
  color: #fdfbf6;
}

.finish-row__details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: rgba(245, 246, 248, 0.65);
}

.finish-row__role {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.finish-row__team {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.finish-row__team-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(15, 18, 23, 0.6);
}

.finish-row--gold {
  border-color: rgba(215, 162, 26, 0.45);
  background: linear-gradient(120deg, rgba(215, 162, 26, 0.18), rgba(255, 255, 255, 0.04));
}

.finish-row--gold .finish-row__rank {
  background: rgba(215, 162, 26, 0.3);
  color: #f9e1a6;
}

.finish-row--silver {
  border-color: rgba(188, 196, 210, 0.5);
  background: linear-gradient(120deg, rgba(188, 196, 210, 0.2), rgba(255, 255, 255, 0.04));
}

.finish-row--silver .finish-row__rank {
  background: rgba(188, 196, 210, 0.3);
  color: #e8edf5;
}

.finish-row--bronze {
  border-color: rgba(194, 128, 75, 0.5);
  background: linear-gradient(120deg, rgba(194, 128, 75, 0.22), rgba(255, 255, 255, 0.04));
}

.finish-row--bronze .finish-row__rank {
  background: rgba(194, 128, 75, 0.35);
  color: #f1d2b7;
}

.finish-modal__empty {
  margin: 0;
  padding: var(--space-lg);
  text-align: center;
  color: rgba(245, 246, 248, 0.65);
}

.finish-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.finish-modal-enter-active,
.finish-modal-leave-active {
  transition: opacity 220ms ease;
}

.finish-modal-enter-from,
.finish-modal-leave-to {
  opacity: 0;
}

.finish-modal-enter-active .finish-modal__card {
  animation: finish-card-enter 360ms ease;
}

@keyframes finish-card-enter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes finish-row-enter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 720px) {
  .finish-modal__banner {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
  }

  .finish-row {
    grid-template-columns: 36px 40px 1fr;
  }

  .finish-row__rank {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .finish-row__portrait {
    width: 38px;
    height: 38px;
  }

  .finish-row__details {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .finish-modal-enter-active .finish-modal__card,
  .finish-row {
    animation: none;
  }
}
</style>
