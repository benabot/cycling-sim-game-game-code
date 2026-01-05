<template>
  <section class="draft-section">
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

    <div class="draft-status-bar" :aria-live="isMobile ? 'polite' : null">
      <div class="draft-status-bar__item">
        <span>Budget</span>
        <span class="draft-status-bar__value">{{ budgetRemaining }}/{{ budgetTotal }}</span>
      </div>
      <div class="draft-status-bar__item">
        <span>Équipe</span>
        <span class="draft-status-bar__value">{{ rosterCount }}/{{ rosterSize }}</span>
      </div>
    </div>

    <div class="draft-grid" :class="{ 'draft-grid--mobile': isMobile }">
      <div class="draft-pool" v-show="!isMobile || activeMobileTab === 'market'">
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
        <div v-if="pagedPool.length" class="draft-pool-grid">
          <article v-for="rider in pagedPool" :key="rider.id" class="draft-card draft-card--compact">
            <div class="draft-card-content">
              <div class="draft-card-main">
                <div class="draft-card-identity">
                  <div
                    class="rider-portrait"
                    :class="getPortraitClass(rider.role)"
                    :style="getPortraitStyle()"
                  >
                    <img
                      v-if="getPortraitUrl(rider)"
                      :src="getPortraitUrl(rider)"
                      :alt="`Portrait de ${rider.name}`"
                      class="rider-portrait__image"
                      loading="lazy"
                      @error="markPortraitError(rider.id)"
                    />
                    <img
                      v-else
                      :src="PORTRAIT_FALLBACK_URL"
                      alt=""
                      class="rider-portrait__fallback"
                      loading="lazy"
                    />
                    <span class="rider-portrait__badge rider-portrait__badge--role">
                      <RiderIcon :type="rider.role" :size="10" />
                    </span>
                  </div>
                  <div class="draft-card-text">
                    <p class="draft-card-name">{{ rider.name }}</p>
                    <div class="draft-card-tags">
                      <span class="badge badge-pill draft-role-badge">{{ getRoleLabel(rider.role) }}</span>
                      <span v-if="rider.price != null" class="draft-price">Coût {{ rider.price }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="draft-card-stats draft-card-stats--compact">
                <div
                  v-for="stat in getVisibleStatRows(rider)"
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
              <button
                v-if="isMobile && getExtraStatRows(rider).length"
                type="button"
                class="draft-card-stats-toggle"
                :aria-expanded="isStatsExpanded(rider.id)"
                @click="toggleStats(rider.id)"
              >
                {{ isStatsExpanded(rider.id) ? 'Moins' : 'Plus' }}
              </button>
              <div
                v-if="isMobile && isStatsExpanded(rider.id)"
                class="draft-card-stats-extra"
              >
                <span
                  v-for="stat in getExtraStatRows(rider)"
                  :key="stat.key"
                  class="draft-stat-chip"
                >
                  {{ stat.label }} {{ stat.value }}
                </span>
              </div>
            </div>
            <div class="draft-card-actions">
              <button
                type="button"
                class="btn btn-primary btn-sm draft-card-cta"
                :disabled="!canRecruit(rider)"
                :aria-label="`Ajouter ${rider.name} (${getRoleLabel(rider.role)})`"
                @click="$emit('recruit', { teamId: activeTeamId, rider })"
              >
                Ajouter
              </button>
            </div>
          </article>
        </div>
        <div v-else class="draft-empty">
          <span>Aucun coureur.</span>
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
                <div
                  class="rider-portrait rider-portrait--sm"
                  :class="getPortraitClass(rosterByRole[role].role)"
                  :style="getPortraitStyle()"
                >
                  <img
                    v-if="getPortraitUrl(rosterByRole[role])"
                    :src="getPortraitUrl(rosterByRole[role])"
                    :alt="`Portrait de ${rosterByRole[role].name}`"
                    class="rider-portrait__image"
                    loading="lazy"
                    @error="markPortraitError(rosterByRole[role].id)"
                  />
                  <img
                    v-else
                    :src="PORTRAIT_FALLBACK_URL"
                    alt=""
                    class="rider-portrait__fallback"
                    loading="lazy"
                  />
                  <span class="rider-portrait__badge rider-portrait__badge--role">
                    <RiderIcon :type="rosterByRole[role].role" :size="10" />
                  </span>
                </div>
                <div class="roster-card-text">
                  <span class="roster-card-name">{{ rosterByRole[role].name }}</span>
                  <div class="roster-card-tags">
                    <span class="badge badge-pill">{{ getRoleLabel(rosterByRole[role].role) }}</span>
                  </div>
                </div>
              </div>
              <div class="roster-card-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm roster-card-cta"
                  :aria-label="`Retirer ${rosterByRole[role].name} (${getRoleLabel(rosterByRole[role].role)})`"
                  @click="$emit('release', { teamId: activeTeamId, rider: rosterByRole[role] })"
                >
                  Retirer
                </button>
              </div>
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
import { PORTRAIT_FALLBACK_URL, getRiderPortraitUrl } from '../utils/portraits.js';
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


const activeRole = ref('all');
const page = ref(1);
const pageSize = 8;
const isMobile = ref(false);
const activeMobileTab = ref('market');
const primaryStatKeys = ['endurance', 'sprint'];
const portraitErrors = ref({});
const expandedStats = ref({});
const statDisplayOrder = computed(() =>
  props.statOrder?.length
    ? props.statOrder
    : ['endurance', 'sprint', 'climb', 'punch', 'force', 'rolling']
);

const roleFilters = computed(() => ['all', ...(props.roles || [])]);

const filteredPool = computed(() => {
  return (props.pool || []).filter(rider => {
    if (activeRole.value !== 'all' && rider.role !== activeRole.value) return false;
    return true;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPool.value.length / pageSize)));
const pagedPool = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredPool.value.slice(start, start + pageSize);
});

watch(activeRole, () => {
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

function getPortraitClass(role) {
  if (!role) return 'rider-portrait--neutral';
  return `rider-portrait--${role}`;
}

function getPortraitStyle() {
  const teamColor = TeamConfigs[props.activeTeamId]?.color || '#1f2937';
  return { '--portrait-badge-bg': teamColor };
}

function getPortraitUrl(rider) {
  if (!rider?.portraitKey || portraitErrors.value[rider.id]) return null;
  return getRiderPortraitUrl(rider.portraitKey);
}

function markPortraitError(riderId) {
  if (!riderId) return;
  portraitErrors.value = { ...portraitErrors.value, [riderId]: true };
}

function canRecruit(rider) {
  if (!props.activeTeamId) return false;
  if (rosterCount.value >= props.rosterSize) return false;
  if (budgetRemaining.value < rider.price) return false;
  return !rosterByRole.value[rider.role];
}

function getStatRowsForKeys(rider, keys) {
  const stats = rider.stats || {};
  return keys.map(key => ({
    key,
    label: props.statLabels[key] || key,
    value: stats[key] ?? 0
  }));
}

function getVisibleStatRows(rider) {
  const keys = isMobile.value ? primaryStatKeys : statDisplayOrder.value;
  return getStatRowsForKeys(rider, keys);
}

function getExtraStatRows(rider) {
  if (!isMobile.value) return [];
  const extraKeys = statDisplayOrder.value.filter(key => !primaryStatKeys.includes(key));
  return getStatRowsForKeys(rider, extraKeys);
}

function isStatsExpanded(riderId) {
  return !!expandedStats.value[riderId];
}

function toggleStats(riderId) {
  if (!riderId) return;
  expandedStats.value = {
    ...expandedStats.value,
    [riderId]: !expandedStats.value[riderId]
  };
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

.draft-team-tabs {
  width: 100%;
}

.draft-status-bar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  gap: 16px;
  color: var(--color-ink-soft);
}

.draft-status-bar__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.draft-status-bar__value {
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--color-ink);
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

.draft-filter-row {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-xs);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
  margin-bottom: var(--space-sm);
}

.draft-filter-row::-webkit-scrollbar {
  display: none;
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



.draft-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: var(--space-lg);
}

.draft-pool {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
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
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

.draft-card--compact {
  gap: var(--space-sm);
}

.draft-pool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.draft-card-main {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.draft-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
}

.draft-card-identity {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.draft-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.draft-card-cta {
  flex-shrink: 0;
  min-height: 44px;
  min-width: 88px;
  white-space: nowrap;
}

.draft-card-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-card-tags,
.roster-card-tags {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  margin-top: var(--space-xs);
  align-items: center;
}

.draft-price {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--sp-text-secondary, var(--color-ink-muted));
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--sp-border-soft, var(--color-line));
  background: var(--color-canvas);
  white-space: nowrap;
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

.draft-card-stats-toggle {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: var(--sp-text-secondary, var(--color-ink-muted));
  cursor: pointer;
}

.draft-card-stats-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  font-size: 11px;
  color: var(--sp-text-secondary, var(--color-ink-muted));
}

.draft-stat-chip {
  white-space: nowrap;
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
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.roster-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.roster-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.roster-card-cta {
  flex-shrink: 0;
  min-height: 44px;
  min-width: 88px;
  white-space: nowrap;
}

.roster-card-actions {
  display: flex;
  justify-content: flex-end;
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

  .draft-roster {
    position: static;
  }
}

@media (max-width: 720px) {
  .draft-status-bar {
    top: 50px;
  }

  .draft-mobile-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .draft-grid--mobile {
    grid-template-columns: 1fr;
  }

  .draft-pool,
  .draft-roster {
    padding-bottom: 120px; /* CTA + safe-area + breathing room */
  }

  .draft-card .btn {
    min-height: 44px;
  }

  .draft-card {
    padding: var(--space-sm);
  }

  .draft-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    column-gap: var(--space-sm);
  }

  .draft-card-actions {
    align-self: start;
    justify-content: flex-end;
  }

  .draft-card-cta {
    width: auto;
    min-width: 96px;
    justify-content: center;
  }

  .draft-card-identity {
    width: 100%;
  }

  .draft-card-content {
    width: 100%;
  }

  .draft-card-stats--compact {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .stat-row--compact {
    grid-template-columns: 72px 1fr 26px;
    font-size: 11px;
  }

  .stat-label {
    display: inline;
    text-transform: none;
  }

  .stat-bar {
    height: 5px;
  }

  .roster-card {
    flex-direction: column;
    align-items: stretch;
  }

  .roster-card-actions {
    width: 100%;
  }

  .roster-card-cta {
    width: 100%;
    justify-content: center;
  }
}
</style>
