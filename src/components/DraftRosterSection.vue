<template>
  <section class="draft-section">
    <header class="race-section-header">
      <div class="race-section-header__icon">
        <UIIcon type="team" size="md" />
      </div>
      <div class="race-section-header__content">
        <h2 class="race-section-header__title">Coureurs</h2>
      </div>
    </header>

    <div class="draft-controls">
      <div v-if="teamIds.length > 1" class="segmented segmented--stretch draft-team-tabs">
        <button
          v-for="teamId in teamIds"
          :key="teamId"
          type="button"
          class="segmented-item"
          :class="{ 'segmented-item-active': teamId === activeTeamId }"
          @click="$emit('selectTeam', teamId)"
        >
          {{ getTeamLabel(teamId) }}
        </button>
      </div>

    </div>

    <div class="draft-toolbar">
      <div class="draft-search">
        <label class="type-caption" for="draft-search-input">Rechercher</label>
        <input
          id="draft-search-input"
          v-model="searchQuery"
          type="text"
          class="input input-sm"
          placeholder="Nom du coureur"
        />
      </div>
      <div class="draft-filters">
        <span class="type-caption">Filtres</span>
        <div class="draft-filter-row">
          <button
            v-for="role in roleFilters"
            :key="role"
            type="button"
            class="draft-filter"
            :class="{ 'draft-filter--active': activeRole === role }"
            @click="activeRole = role"
          >
            {{ role === 'all' ? 'Tous' : getRoleLabel(role) }}
          </button>
        </div>
      </div>
      <span class="draft-count type-caption">{{ filteredCount }} coureurs</span>
    </div>

    <div v-if="isMobile" class="segmented segmented--stretch draft-mobile-tabs">
      <button
        type="button"
        class="segmented-item"
        :class="{ 'segmented-item-active': activeMobileTab === 'market' }"
        @click="activeMobileTab = 'market'"
      >
        Marché
      </button>
      <button
        type="button"
        class="segmented-item"
        :class="{ 'segmented-item-active': activeMobileTab === 'team' }"
        @click="activeMobileTab = 'team'"
      >
        Mon équipe ({{ rosterCount }}/{{ rosterSize }})
      </button>
    </div>

    <div class="draft-grid" :class="{ 'draft-grid--mobile': isMobile }">
      <div class="draft-pool" v-show="!isMobile || activeMobileTab === 'market'">
      <div class="draft-pool-header">
        <div>
          <h3 class="draft-title">Marché</h3>
        </div>
      </div>
        <div v-if="pagedPool.length" class="draft-pool-grid">
          <article v-for="rider in pagedPool" :key="rider.id" class="draft-card draft-card--compact">
            <div class="draft-card-main">
              <div class="draft-card-meta">
                <div class="rider-portrait" :class="getPortraitClass(rider.role)">
                  <img
                    v-if="hasPortrait(rider.portraitKey)"
                    :src="getPortraitSrc(rider.portraitKey)"
                    :alt="rider.name"
                    class="rider-portrait__image"
                    @error="onPortraitError(rider.portraitKey)"
                  />
                  <img
                    v-else
                    :src="PORTRAIT_FALLBACK_URL"
                    alt=""
                    class="rider-portrait__fallback"
                  />
                  <span v-if="!hasPortrait(rider.portraitKey)" class="rider-portrait__initials">{{ getInitials(rider.name) }}</span>
                  <span
                    v-if="isKnownRole(rider.role)"
                    class="rider-portrait__badge rider-portrait__badge--role"
                    :style="getTeamBadgeStyle(activeTeamId)"
                  >
                    <RiderIcon :type="rider.role" :size="10" />
                  </span>
                  <span
                    v-else
                    class="rider-portrait__badge rider-portrait__badge--fallback"
                    :style="getTeamBadgeStyle(activeTeamId)"
                  ></span>
                </div>
                <div class="draft-card-identity">
                  <p class="draft-card-name">{{ rider.name }}</p>
                  <div class="draft-card-tags">
                    <span class="badge badge-pill draft-role-badge">{{ getRoleLabel(rider.role) }}</span>
                    <span class="badge badge-pill">{{ rider.price }}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="!canRecruit(rider)"
                @click="$emit('recruit', { teamId: activeTeamId, rider })"
              >
                Ajouter
              </button>
            </div>
            <div class="draft-card-stats draft-card-stats--compact">
              <div
                v-for="stat in getStatRows(rider)"
                :key="stat.key"
                class="stat-row stat-row--compact"
              >
                <span class="stat-label">{{ stat.label }}</span>
                <div class="stat-bar">
                  <div class="stat-bar__fill" :style="{ width: stat.value + '%' }"></div>
                </div>
                <span class="stat-value">{{ stat.value }}</span>
              </div>
            </div>
            <details
              v-if="isMobile && getExtraStatRows(rider).length"
              class="draft-card-details"
            >
              <summary>Détails</summary>
              <div class="draft-card-stats draft-card-stats--detail">
                <div
                  v-for="stat in getExtraStatRows(rider)"
                  :key="stat.key"
                  class="stat-row stat-row--compact"
                >
                  <span class="stat-label">{{ stat.label }}</span>
                  <div class="stat-bar">
                    <div class="stat-bar__fill" :style="{ width: stat.value + '%' }"></div>
                  </div>
                  <span class="stat-value">{{ stat.value }}</span>
                </div>
              </div>
            </details>
          </article>
        </div>
        <div v-else class="draft-empty">
          <span>Aucun coureur disponible.</span>
        </div>
        <div class="draft-pagination">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="page <= 1"
            @click="page = Math.max(1, page - 1)"
          >
            Précédent
          </button>
          <span class="type-caption">Page {{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="page >= totalPages"
            @click="page = Math.min(totalPages, page + 1)"
          >
            Suivant
          </button>
        </div>
      </div>

      <div class="draft-roster" v-show="!isMobile || activeMobileTab === 'team'">
        <h3 class="draft-title">Sélection</h3>
        <div class="roster-slots">
          <div
            v-for="role in roles"
            :key="role"
            class="roster-slot"
            :class="{ 'roster-slot--filled': !!rosterByRole[role] }"
          >
            <div class="roster-slot-header">
              <RiderIcon :type="role" :size="16" />
              <span class="roster-role-label">{{ getRoleLabel(role) }}</span>
            </div>

            <div v-if="rosterByRole[role]" class="roster-card">
              <div class="roster-card-main">
                <div class="roster-card-identity">
                  <div
                    class="rider-portrait rider-portrait--sm"
                    :class="getPortraitClass(rosterByRole[role].role)"
                    :style="getTeamBorderStyle(activeTeamId)"
                  >
                    <img
                      v-if="hasPortrait(rosterByRole[role].portraitKey)"
                      :src="getPortraitSrc(rosterByRole[role].portraitKey)"
                      :alt="rosterByRole[role].name"
                      class="rider-portrait__image"
                      @error="onPortraitError(rosterByRole[role].portraitKey)"
                    />
                    <img
                      v-else
                      :src="PORTRAIT_FALLBACK_URL"
                      alt=""
                      class="rider-portrait__fallback"
                    />
                    <span v-if="!hasPortrait(rosterByRole[role].portraitKey)" class="rider-portrait__initials">
                      {{ getInitials(rosterByRole[role].name) }}
                    </span>
                    <span
                      v-if="isKnownRole(rosterByRole[role].role)"
                      class="rider-portrait__badge rider-portrait__badge--role"
                      :style="getTeamBadgeStyle(activeTeamId)"
                    >
                      <RiderIcon :type="rosterByRole[role].role" :size="9" />
                    </span>
                    <span
                      v-else
                      class="rider-portrait__badge rider-portrait__badge--fallback"
                      :style="getTeamBadgeStyle(activeTeamId)"
                    ></span>
                  </div>
                  <span class="roster-card-name">{{ rosterByRole[role].name }}</span>
                </div>
                <div class="roster-card-tags">
                  <span class="badge badge-pill">{{ rosterByRole[role].price }}</span>
                  <span class="badge badge-pill">Sélectionné</span>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="$emit('release', { teamId: activeTeamId, rider: rosterByRole[role] })"
              >
                Retirer
              </button>
            </div>
            <div v-else class="roster-empty">
              <div class="rider-portrait rider-portrait--sm rider-portrait--empty">
                <img :src="PORTRAIT_FALLBACK_URL" alt="" class="rider-portrait__fallback" />
              </div>
              <div class="roster-empty-text">
                <span>À recruter</span>
                <span class="type-caption">{{ getRoleLabel(role) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { TeamConfigs } from '../core/teams.js';
import { getRiderPortraitUrl, PORTRAIT_FALLBACK_URL } from '../utils/portraits.js';
import { UIIcon } from './icons';
import RiderIcon from './icons/RiderIcon.vue';

const props = defineProps({
  teamIds: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  activeTeamId: { type: String, default: null },
  rosters: { type: Object, default: () => ({}) },
  pool: { type: Array, default: () => [] },
  budgetTotal: { type: Number, required: true },
  rosterSize: { type: Number, required: true },
  roles: { type: Array, default: () => [] },
  statOrder: { type: Array, default: () => [] },
  statLabels: { type: Object, default: () => ({}) }
});

defineEmits(['selectTeam', 'recruit', 'release', 'confirm']);

const activeRoster = computed(() => props.rosters?.[props.activeTeamId] || []);
const rosterCount = computed(() => activeRoster.value.length);
const budgetRemaining = computed(() => {
  const spent = activeRoster.value.reduce((sum, rider) => sum + (rider.price || 0), 0);
  return Math.max(0, props.budgetTotal - spent);
});

const rosterByRole = computed(() => {
  return activeRoster.value.reduce((acc, rider) => {
    acc[rider.role] = rider;
    return acc;
  }, {});
});


const searchQuery = ref('');
const activeRole = ref('all');
const page = ref(1);
const pageSize = 8;
const portraitErrors = ref({});
const isMobile = ref(false);
const activeMobileTab = ref('market');
const statDisplayOrder = ['endurance', 'sprint', 'climb', 'punch'];
const knownRoleTypes = new Set(['climber', 'puncher', 'rouleur', 'sprinter', 'versatile']);

const roleFilters = computed(() => ['all', ...(props.roles || [])]);

const filteredPool = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return (props.pool || []).filter(rider => {
    if (activeRole.value !== 'all' && rider.role !== activeRole.value) return false;
    if (!query) return true;
    return rider.name?.toLowerCase().includes(query);
  });
});

const filteredCount = computed(() => filteredPool.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredPool.value.length / pageSize)));
const pagedPool = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredPool.value.slice(start, start + pageSize);
});

watch([searchQuery, activeRole], () => {
  page.value = 1;
});

watch(totalPages, (value) => {
  if (page.value > value) page.value = value;
});

function getTeamLabel(teamId) {
  if (!teamId) return '—';
  const player = props.players?.find(p => p.teamId === teamId);
  const customName = player?.customName?.trim();
  if (customName) return customName;
  return player?.name || TeamConfigs[teamId]?.name || teamId;
}

function getRoleLabel(role) {
  const labels = {
    climber: 'Grimpeur',
    puncher: 'Puncheur',
    rouleur: 'Rouleur',
    sprinter: 'Sprinteur',
    versatile: 'Polyvalent'
  };
  return labels[role] || role;
}

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function hasPortrait(portraitKey) {
  if (!portraitKey) return false;
  return !portraitErrors.value[portraitKey];
}

function getPortraitSrc(portraitKey) {
  return getRiderPortraitUrl(portraitKey);
}

function isKnownRole(role) {
  return knownRoleTypes.has(role);
}

function onPortraitError(portraitKey) {
  if (!portraitKey) return;
  portraitErrors.value = { ...portraitErrors.value, [portraitKey]: true };
}

function getPortraitClass(role) {
  if (!role) return 'rider-portrait--neutral';
  return `rider-portrait--${role}`;
}

function getTeamBorderStyle(teamId) {
  const borderColor = TeamConfigs[teamId]?.borderColor || TeamConfigs[teamId]?.color;
  if (!borderColor) return null;
  return { borderColor };
}

function getTeamBadgeStyle(teamId) {
  const team = TeamConfigs[teamId];
  if (!team) {
    return {
      '--portrait-badge-bg': 'var(--color-ink)',
      '--portrait-badge-ring': 'rgba(31, 35, 40, 0.25)',
      '--portrait-badge-icon': '#ffffff'
    };
  }
  return {
    '--portrait-badge-bg': team.color,
    '--portrait-badge-ring': team.borderColor || team.color,
    '--portrait-badge-icon': '#ffffff'
  };
}


function canRecruit(rider) {
  if (!props.activeTeamId) return false;
  if (rosterCount.value >= props.rosterSize) return false;
  if (budgetRemaining.value < rider.price) return false;
  return !rosterByRole.value[rider.role];
}

function getStatRows(rider) {
  const stats = rider.stats || {};
  const keys = isMobile.value ? statDisplayOrder.slice(0, 2) : statDisplayOrder;
  return keys.map(key => ({
    key,
    label: props.statLabels[key] || key,
    value: stats[key] ?? 0
  }));
}

function getExtraStatRows(rider) {
  if (!isMobile.value) return [];
  const stats = rider.stats || {};
  return statDisplayOrder.slice(2).map(key => ({
    key,
    label: props.statLabels[key] || key,
    value: stats[key] ?? 0
  }));
}

function updateViewport() {
  if (typeof window === 'undefined') return;
  isMobile.value = window.matchMedia('(max-width: 720px)').matches;
  if (!isMobile.value) {
    activeMobileTab.value = 'market';
  }
}

onMounted(() => {
  updateViewport();
  window.addEventListener('resize', updateViewport);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport);
});
</script>

<style scoped>
.draft-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.race-section-header__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.draft-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.draft-team-tabs {
  width: 100%;
}

.draft-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: var(--space-md);
  align-items: end;
}

.draft-mobile-tabs {
  display: none;
}

.draft-mobile-tabs .segmented-item {
  border: 1px solid var(--sp-border-soft, var(--color-line));
  background: var(--color-surface);
  color: var(--sp-text-secondary, var(--color-ink-muted));
  font-weight: 600;
}

.draft-mobile-tabs .segmented-item-active {
  border-color: var(--color-accent);
  background: var(--color-canvas);
  color: var(--sp-text-strong, var(--color-ink));
  box-shadow: inset 0 -2px 0 var(--color-accent);
}

.draft-search,
.draft-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.draft-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.draft-filter {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-line);
  background: var(--color-paper);
  font-size: 12px;
  color: var(--color-ink-muted);
  transition: var(--transition-fast);
}

.draft-filter--active {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.draft-count {
  justify-self: end;
}

.draft-card-details {
  margin-top: var(--space-xs);
  border-top: 1px solid var(--color-line);
  padding-top: var(--space-xs);
}

.draft-card-details summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--sp-text-secondary, var(--color-ink-muted));
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.draft-card-details summary::-webkit-details-marker {
  display: none;
}

.draft-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: var(--space-lg);
}

.draft-title {
  margin: 0 0 var(--space-sm);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--sp-text-strong, var(--color-ink));
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.draft-pool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(15, 23, 42, 0.01));
  border: 1px solid var(--sp-border-soft, var(--color-line));
  position: relative;
  overflow: hidden;
}

.draft-pool-header::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSIyIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjYiLz48L3N2Zz4=");
  pointer-events: none;
}

.draft-pool-header > * {
  position: relative;
  z-index: 1;
}

.draft-card {
  border: 1px solid var(--sp-border-soft, var(--color-line));
  border-radius: var(--radius-md);
  padding: var(--space-md);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  box-shadow: none;
}

.draft-card--compact {
  gap: var(--space-sm);
}

.draft-pool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
}

.draft-card-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
}

.draft-card-meta {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}

.draft-card-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rider-portrait {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-line);
  background: var(--color-canvas);
  --portrait-badge-size: 14px;
  --portrait-badge-size-sm: 12px;
  --portrait-badge-offset: 2px;
  --portrait-badge-bg: var(--color-ink);
  --portrait-badge-ring: rgba(31, 35, 40, 0.2);
  --portrait-badge-icon: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-ink);
  flex-shrink: 0;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.rider-portrait::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMS4yIiBudW1PY3RhdmVzPSIyIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjYiLz48L3N2Zz4=");
  opacity: 0.08;
  z-index: 2;
  pointer-events: none;
}

.rider-portrait::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 40% 35%, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.25));
  opacity: 0.3;
  z-index: 2;
  pointer-events: none;
}

.rider-portrait--sm {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 10px;
}

.rider-portrait__image,
.rider-portrait__fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.rider-portrait__fallback {
  filter: grayscale(0.3) contrast(0.95);
}

.rider-portrait__initials {
  letter-spacing: 0.4px;
  position: absolute;
  font-size: 9px;
  color: var(--color-ink-muted);
  z-index: 3;
}

.rider-portrait__badge {
  position: absolute;
  bottom: var(--portrait-badge-offset);
  right: var(--portrait-badge-offset);
  width: var(--portrait-badge-size);
  height: var(--portrait-badge-size);
  border-radius: 50%;
  background: var(--portrait-badge-bg);
  border: 1px solid var(--portrait-badge-ring);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--portrait-badge-icon);
  z-index: 4;
  box-shadow: 0 1px 2px rgba(31, 35, 40, 0.14);
}

.rider-portrait__badge--role {
  overflow: hidden;
}

.rider-portrait__badge :deep(.rider-icon) {
  color: var(--portrait-badge-icon);
  fill: currentColor;
  stroke: currentColor;
}

.rider-portrait__badge--fallback::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--portrait-badge-icon);
}

.rider-portrait--sm .rider-portrait__badge {
  width: var(--portrait-badge-size-sm);
  height: var(--portrait-badge-size-sm);
  bottom: calc(var(--portrait-badge-offset) - 1px);
  right: calc(var(--portrait-badge-offset) - 1px);
}

.rider-portrait--climber { background: linear-gradient(135deg, #f0f7f2, #e1f0e6); }
.rider-portrait--puncher { background: linear-gradient(135deg, #fef6ee, #fde9d6); }
.rider-portrait--rouleur { background: linear-gradient(135deg, #eef5fb, #ddebf7); }
.rider-portrait--sprinter { background: linear-gradient(135deg, #fdf1f1, #fbe1e1); }
.rider-portrait--versatile { background: linear-gradient(135deg, #f4f1fb, #e8e2f6); }
.rider-portrait--neutral { background: var(--color-canvas); }
.rider-portrait--empty {
  border-style: dashed;
  background: var(--color-paper);
  color: var(--color-ink-muted);
}

.draft-card-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--sp-text-strong, var(--color-ink));
}

.draft-card-tags,
.roster-card-tags {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  margin-top: var(--space-xs);
}


.draft-card-stats--compact {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px var(--space-sm);
}

.stat-row--compact {
  display: grid;
  grid-template-columns: 72px 1fr 26px;
  gap: var(--space-xs);
  align-items: center;
  font-size: 10px;
  color: var(--sp-text-secondary, var(--color-ink-soft));
}

.stat-label {
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-bar {
  height: 6px;
  background: var(--sp-border-soft, var(--color-line));
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.stat-bar__fill {
  height: 100%;
  background: var(--color-accent);
}

.stat-value {
  text-align: right;
  font-family: var(--font-mono);
  color: var(--color-ink);
}

.draft-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-sm);
}

.draft-empty {
  padding: var(--space-md);
  border: 1px dashed var(--sp-border-soft, var(--color-line));
  border-radius: var(--radius-md);
  background: var(--color-canvas);
  font-size: 12px;
  color: var(--sp-text-secondary, var(--color-ink-muted));
}

.roster-slots {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}


.roster-slot {
  border: 1px dashed var(--sp-border-soft, var(--color-line));
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-paper);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.roster-slot--filled {
  border-style: solid;
  background: var(--color-surface);
}

.roster-slot-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 12px;
  font-weight: 600;
  color: var(--sp-text-secondary, var(--color-ink-soft));
}

.roster-role-label {
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.roster-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.roster-empty {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 12px;
  color: var(--color-muted);
}

.roster-empty-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.roster-card-identity {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.roster-card-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.roster-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.draft-role-badge {
  background: var(--color-paper);
}

.draft-roster {
  position: sticky;
  top: var(--space-lg);
  align-self: start;
}


@media (max-width: 960px) {
  .draft-grid {
    grid-template-columns: 1fr;
  }

  .draft-pool-grid {
    grid-template-columns: 1fr;
  }

  .draft-toolbar {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .draft-count {
    justify-self: start;
  }

  .draft-roster {
    position: static;
  }

}

@media (max-width: 720px) {
  .draft-mobile-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .draft-grid--mobile {
    grid-template-columns: 1fr;
  }

  .draft-card .btn {
    min-height: 44px;
  }

  .draft-card-details summary {
    font-size: 11px;
  }
}
</style>
