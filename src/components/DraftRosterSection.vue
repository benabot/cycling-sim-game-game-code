<template>
  <section class="draft-section">
    <header class="race-section-header">
      <div class="race-section-header__icon">
        <UIIcon type="team" size="md" />
      </div>
      <div class="race-section-header__content">
        <h2 class="race-section-header__title">Coureurs</h2>
        <p class="race-section-header__subtitle">Vivier et budget.</p>
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

      <div class="draft-summary">
        <div class="draft-summary-item">
          <span class="draft-summary-label">Budget restant</span>
          <span class="draft-summary-value type-numeric">{{ budgetRemaining }}</span>
        </div>
        <div class="draft-summary-item">
          <span class="draft-summary-label">Coureurs sélectionnés</span>
          <span class="draft-summary-value">{{ rosterCount }}/{{ rosterSize }}</span>
        </div>
        <div class="draft-summary-item">
          <span class="draft-summary-label">Équipe</span>
          <span class="draft-summary-value">{{ activeTeamLabel }}</span>
        </div>
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

    <div class="draft-grid">
      <div class="draft-pool">
        <h3 class="draft-title">Vivier</h3>
        <div v-if="pagedPool.length" class="draft-pool-grid">
          <article v-for="rider in pagedPool" :key="rider.id" class="draft-card draft-card--compact">
            <div class="draft-card-main">
              <div class="draft-card-meta">
                <RiderIcon :type="rider.role" :size="18" />
                <div>
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

      <div class="draft-roster">
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
                <span class="roster-card-name">{{ rosterByRole[role].name }}</span>
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
              <span>Non sélectionné</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="draft-sticky-summary">
      <div class="draft-sticky-metrics">
        <span>Slots {{ rosterCount }}/{{ rosterSize }}</span>
        <span>Budget {{ budgetRemaining }}</span>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        :disabled="rosterCount < rosterSize"
        @click="$emit('confirm')"
      >
        {{ rosterCount === rosterSize ? "Valider l'équipe" : `À compléter : ${rosterCount}/${rosterSize}` }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { TeamConfigs } from '../core/teams.js';
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

const activeTeamLabel = computed(() => getTeamLabel(props.activeTeamId));

const searchQuery = ref('');
const activeRole = ref('all');
const page = ref(1);
const pageSize = 8;

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

function canRecruit(rider) {
  if (!props.activeTeamId) return false;
  if (rosterCount.value >= props.rosterSize) return false;
  if (budgetRemaining.value < rider.price) return false;
  return !rosterByRole.value[rider.role];
}

function getStatRows(rider) {
  const stats = rider.stats || {};
  return props.statOrder.map(key => ({
    key,
    label: props.statLabels[key] || key,
    value: stats[key] ?? 0
  }));
}
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

.race-section-header__subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--color-ink-muted);
}

.draft-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.draft-team-tabs {
  width: 100%;
}

.draft-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-sm);
}

.draft-summary-item {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-canvas);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.draft-summary-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-ink-muted);
  font-weight: 600;
}

.draft-summary-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
}

.draft-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: var(--space-md);
  align-items: end;
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

.draft-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: var(--space-lg);
}

.draft-title {
  margin: 0 0 var(--space-sm);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.draft-card {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  box-shadow: var(--shadow-sm);
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

.draft-card-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
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
  grid-template-columns: 56px 1fr 26px;
  gap: var(--space-xs);
  align-items: center;
  font-size: 10px;
  color: var(--color-ink-soft);
}

.stat-label {
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-bar {
  height: 6px;
  background: var(--color-line);
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
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-canvas);
  font-size: 12px;
  color: var(--color-ink-muted);
}

.roster-slots {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.roster-slot {
  border: 1px dashed var(--color-line);
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
  color: var(--color-ink-soft);
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

.roster-empty {
  font-size: 12px;
  color: var(--color-muted);
}

.draft-role-badge {
  background: var(--color-paper);
}

.draft-roster {
  position: sticky;
  top: var(--space-lg);
  align-self: start;
}

.draft-sticky-summary {
  display: none;
  position: sticky;
  bottom: var(--space-md);
  gap: var(--space-sm);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.draft-sticky-metrics {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--color-ink-muted);
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

  .draft-sticky-summary {
    display: flex;
  }
}
</style>
