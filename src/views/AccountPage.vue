<template>
  <div class="account-page">
    <header class="account-header">
      <button type="button" class="btn btn-back" @click="goBack">
        <UIIcon type="chevron-left" size="sm" />
        <span>Retour</span>
      </button>
      <h1 class="account-title">
        <UIIcon type="bike" size="lg" />
        <span>Directeur Sportif</span>
      </h1>
      <div class="header-spacer"></div>
    </header>

    <main class="account-content">
      <!-- DS Card - Profil -->
      <section class="block block--profile">
        <div class="profile-header">
          <div class="profile-avatar">
            <UIIcon type="human" size="xl" />
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ profile?.username || user?.user_metadata?.username || 'Directeur' }}</h2>
            <span class="profile-badge">Directeur Sportif</span>
          </div>
        </div>
        <div class="profile-details">
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ user?.email || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Membre depuis</span>
            <span class="detail-value">{{ formatDate(profile?.created_at) }}</span>
          </div>
        </div>
      </section>

      <!-- Palmarès -->
      <section class="block">
        <header class="block-header">
          <UIIcon type="trophy" size="md" />
          <h2 class="block-title">Palmarès</h2>
        </header>
        <div class="stats-grid stats-grid--3">
          <div class="stat-card">
            <UIIcon type="laurel" size="md" class="stat-icon" />
            <span class="stat-value">{{ finishedGames.length }}</span>
            <span class="stat-label">Courses</span>
          </div>
          <div class="stat-card stat-card--gold">
            <UIIcon type="medal" size="md" class="stat-icon" />
            <span class="stat-value">{{ victories }}</span>
            <span class="stat-label">Victoires</span>
          </div>
          <div class="stat-card stat-card--silver">
            <UIIcon type="star" size="md" class="stat-icon" />
            <span class="stat-value">{{ podiums }}</span>
            <span class="stat-label">Podiums</span>
          </div>
        </div>
      </section>

      <!-- Partager -->
      <section class="block">
        <header class="block-header">
          <UIIcon type="link" size="md" />
          <h2 class="block-title">Partager</h2>
        </header>

        <!-- Tabs pour choisir quoi partager -->
        <div v-if="finishedGames.length > 0" class="share-tabs">
          <button
            type="button"
            :class="['share-tab', { 'share-tab--active': shareMode === 'game' }]"
            @click="shareMode = 'game'"
          >
            <UIIcon type="link" size="sm" />
            <span>Le jeu</span>
          </button>
          <button
            type="button"
            :class="['share-tab', { 'share-tab--active': shareMode === 'stats' }]"
            @click="shareMode = 'stats'"
          >
            <UIIcon type="trophy" size="sm" />
            <span>Mon palmarès</span>
          </button>
        </div>

        <!-- Description contextuelle -->
        <p class="block-text share-description">
          {{ shareMode === 'stats' ? 'Partagez vos performances' : 'Invitez vos amis cyclistes' }}
        </p>

        <!-- Mobile: Web Share API natif -->
        <div v-if="isMobile && canShare" class="share-buttons">
          <button
            type="button"
            :class="['btn', 'btn-action', shareMode === 'stats' ? 'btn-action--gold' : 'btn-action--primary']"
            @click="shareMode === 'stats' ? shareStats() : shareGame()"
          >
            <UIIcon :type="shareMode === 'stats' ? 'trophy' : 'link'" size="sm" />
            <span>{{ shareMode === 'stats' ? 'Partager mes stats' : 'Partager le jeu' }}</span>
          </button>
        </div>

        <!-- Desktop: Boutons réseaux sociaux directs -->
        <div v-else class="share-social">
          <a
            :href="currentShareUrls.twitter"
            target="_blank"
            rel="noopener noreferrer"
            class="share-social-btn share-social-btn--twitter"
            title="Partager sur X"
          >
            <UIIcon type="twitter" size="sm" />
          </a>
          <a
            :href="currentShareUrls.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="share-social-btn share-social-btn--facebook"
            title="Partager sur Facebook"
          >
            <UIIcon type="facebook" size="sm" />
          </a>
          <a
            :href="currentShareUrls.instagram"
            target="_blank"
            rel="noopener noreferrer"
            class="share-social-btn share-social-btn--instagram"
            title="Partager sur Instagram"
          >
            <UIIcon type="instagram" size="sm" />
          </a>
          <a
            :href="currentShareUrls.tiktok"
            target="_blank"
            rel="noopener noreferrer"
            class="share-social-btn share-social-btn--tiktok"
            title="Partager sur TikTok"
          >
            <UIIcon type="tiktok" size="sm" />
          </a>
          <a
            :href="currentShareUrls.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            class="share-social-btn share-social-btn--whatsapp"
            title="Partager sur WhatsApp"
          >
            <UIIcon type="whatsapp" size="sm" />
          </a>
        </div>

        <!-- Copier le lien/texte -->
        <div class="share-buttons share-buttons--copy">
          <button
            type="button"
            class="btn btn-action"
            @click="shareMode === 'stats' ? copyStats() : copyInviteLink()"
          >
            <UIIcon :type="(shareMode === 'stats' ? statsCopied : linkCopied) ? 'check' : 'copy'" size="sm" />
            <span>{{ (shareMode === 'stats' ? statsCopied : linkCopied) ? 'Copié !' : 'Copier le texte' }}</span>
          </button>
        </div>
      </section>

      <!-- Historique -->
      <section class="block">
        <header class="block-header">
          <UIIcon type="chart" size="md" />
          <h2 class="block-title">Historique</h2>
          <span v-if="finishedGames.length" class="block-count">{{ finishedGames.length }}</span>
        </header>
        <div v-if="statsLoading" class="block-empty">
          <span class="spinner"></span>
          Chargement...
        </div>
        <div v-else-if="statsError" class="block-empty block-empty--error">
          {{ statsError }}
        </div>
        <div v-else-if="finishedGames.length === 0" class="block-empty">
          Aucune course terminée
        </div>
        <div v-else class="history-list">
          <div v-for="game in finishedGames" :key="game.id" class="history-row">
            <span class="history-rank" :class="getRankClass(game)">{{ getRankDisplay(game) }}</span>
            <div class="history-info">
              <span class="history-name">{{ game.name }}</span>
              <span class="history-meta">{{ game.raceLabel }} · {{ game.currentTurn || '?' }}t</span>
            </div>
            <span class="history-date">{{ formatRelativeDate(game.finishedAt) }}</span>
          </div>
        </div>
      </section>

      <!-- Parties en cours -->
      <section class="block">
        <header class="block-header">
          <UIIcon type="save" size="md" />
          <h2 class="block-title">Parties en cours</h2>
          <span v-if="games.length" class="block-count">{{ games.length }}</span>
        </header>

        <div v-if="isLoading" class="block-empty">
          <span class="spinner"></span>
          Chargement...
        </div>
        <div v-else-if="games.length === 0" class="block-empty">
          Aucune partie sauvegardée
        </div>
        <div v-else class="games-list">
          <div v-for="game in games" :key="game.id" class="game-row">
            <div class="game-main">
              <span class="game-name">{{ game.name }}</span>
              <span class="game-tag" :class="'game-tag--' + game.source">
                {{ game.source === 'cloud' ? 'Cloud' : 'Local' }}
              </span>
            </div>
            <div class="game-meta">
              <UIIcon :type="getRaceIcon(game)" size="xs" />
              <span>{{ getRaceName(game) }}</span>
              <span class="game-sep">·</span>
              <span>Tour {{ game.currentTurn }}</span>
            </div>
            <div class="game-actions">
              <button
                type="button"
                class="btn btn-icon btn-icon--danger"
                @click="confirmDelete(game)"
                :disabled="deletingId === game.id"
                title="Supprimer"
              >
                <UIIcon type="close" size="sm" />
              </button>
              <button
                type="button"
                class="btn btn-action"
                @click="handleLoad(game)"
              >
                <UIIcon type="play" size="sm" />
                <span>Charger</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Zone de danger -->
      <section class="block block--danger">
        <header class="block-header">
          <UIIcon type="warning" size="md" />
          <h2 class="block-title">Zone de danger</h2>
        </header>
        <p class="block-text">
          La suppression de votre compte est irréversible.
        </p>
        <button
          type="button"
          class="btn btn-danger"
          @click="showDeleteAccountModal = true"
        >
          <UIIcon type="close" size="sm" />
          <span>Supprimer mon compte</span>
        </button>
      </section>
    </main>

    <!-- Confirmation de suppression de partie -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="gameToDelete" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-dialog">
            <h3 class="modal-title">Supprimer cette partie ?</h3>
            <p class="modal-text">
              « {{ gameToDelete.name }} » sera définitivement supprimée.
            </p>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="cancelDelete">
                Annuler
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="executeDelete"
                :disabled="deletingId"
              >
                <template v-if="deletingId">
                  <span class="spinner-small"></span>
                  Suppression...
                </template>
                <template v-else>
                  Supprimer
                </template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de suppression de compte -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteAccountModal" class="modal-overlay" @click.self="cancelDeleteAccount">
          <div class="modal-dialog modal-dialog--danger">
            <h3 class="modal-title modal-title--danger">
              <UIIcon type="warning" size="md" />
              Supprimer votre compte ?
            </h3>
            <p class="modal-text">
              Cette action est <strong>irréversible</strong>. Toutes vos données (parties sauvegardées, préférences) seront définitivement supprimées.
            </p>

            <div v-if="deleteAccountError" class="modal-error">
              {{ deleteAccountError }}
            </div>

            <div class="form-group">
              <label for="delete-confirm" class="form-label">
                Pour confirmer, tapez <strong>SUPPRIMER</strong>
              </label>
              <input
                id="delete-confirm"
                v-model="deleteConfirmText"
                type="text"
                class="form-input"
                placeholder="SUPPRIMER"
                autocomplete="off"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="cancelDeleteAccount">
                Annuler
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="deleteConfirmText !== 'SUPPRIMER' || isDeletingAccount"
                @click="executeDeleteAccount"
              >
                <template v-if="isDeletingAccount">
                  <span class="spinner-small"></span>
                  Suppression...
                </template>
                <template v-else>
                  Supprimer définitivement
                </template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../lib/supabase.js';
import { listLocalGames } from '../core/save-manager.js';
import { useAuth } from '../composables/useAuth.js';
import { useStorage } from '../composables/useStorage.js';
import UIIcon from '../components/icons/UIIcon.vue';

const props = defineProps({
  returnTarget: {
    type: String,
    default: 'setup'
  }
});

const emit = defineEmits(['back', 'load', 'account-deleted']);

const { user, profile, loading: authLoading, deleteAccount } = useAuth();
const { games, isLoading, fetchGames, deleteGame } = useStorage();

const gameToDelete = ref(null);
const deletingId = ref(null);
const finishedGames = ref([]);
const statsLoading = ref(false);
const statsError = ref('');

// Delete account state
const showDeleteAccountModal = ref(false);
const deleteConfirmText = ref('');
const isDeletingAccount = ref(false);
const deleteAccountError = ref('');

// Share state
const linkCopied = ref(false);
const statsCopied = ref(false);
const shareMode = ref('game'); // 'game' ou 'stats'
const canShare = computed(() => typeof navigator.share === 'function');
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
});
const inviteLink = computed(() => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/app/`;
});
const shareText = 'Découvre BORDUR, un jeu de plateau – simulation cycliste tactique !';

const statsText = computed(() => {
  const username = profile.value?.username || 'Un directeur sportif';
  return `🚴 ${username} sur BORDUR\n\n` +
    `🏆 ${finishedGames.value.length} courses\n` +
    `🥇 ${victories.value} victoires\n` +
    `🏅 ${podiums.value} podiums\n\n` +
    `Rejoins-moi sur ${inviteLink.value}`;
});

// URLs de partage dynamiques selon le mode
const currentShareUrls = computed(() => {
  const url = encodeURIComponent(inviteLink.value);
  const text = shareMode.value === 'stats'
    ? encodeURIComponent(statsText.value)
    : encodeURIComponent(shareText);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${text}${shareMode.value === 'game' ? '&url=' + url : ''}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    // Instagram n'a pas d'API de partage web, on redirige vers le profil BORDUR
    instagram: 'https://instagram.com/bordur.game',
    // TikTok n'a pas d'API de partage web, on redirige vers le profil BORDUR
    tiktok: 'https://tiktok.com/@bordur.game',
    whatsapp: `https://wa.me/?text=${text}${shareMode.value === 'game' ? '%20' + url : ''}`
  };
});

// Statistiques avancées
const victories = computed(() => {
  return finishedGames.value.filter(game => {
    const firstRider = game.rankings?.[0];
    // Considérer comme victoire si le premier est de l'équipe du joueur (team_a par défaut)
    return firstRider?.team === 'team_a' || firstRider?.teamId === 'team_a';
  }).length;
});

const podiums = computed(() => {
  // Compter le nombre total de coureurs de team_a dans le top 3 de chaque course
  return finishedGames.value.reduce((total, game) => {
    const top3 = game.rankings?.slice(0, 3) || [];
    const teamAPodiums = top3.filter(r => r?.team === 'team_a' || r?.teamId === 'team_a').length;
    return total + teamAPodiums;
  }, 0);
});

function copyInviteLink() {
  navigator.clipboard.writeText(inviteLink.value).then(() => {
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  });
}

async function shareGame() {
  if (!canShare.value) return;
  try {
    await navigator.share({
      title: 'BORDUR - Jeu de plateau – simulation cycliste tactique',
      text: '🚴 Découvre BORDUR, un jeu de plateau – simulation cycliste tactique !',
      url: inviteLink.value
    });
  } catch (err) {
    // User cancelled or share failed - ignore
    if (err.name !== 'AbortError') {
      console.warn('Share failed:', err);
    }
  }
}

async function shareStats() {
  if (!canShare.value) return;
  try {
    await navigator.share({
      title: 'Mon palmarès - BORDUR',
      text: statsText.value,
      url: inviteLink.value
    });
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Share failed:', err);
    }
  }
}

function copyStats() {
  navigator.clipboard.writeText(statsText.value).then(() => {
    statsCopied.value = true;
    setTimeout(() => {
      statsCopied.value = false;
    }, 2000);
  });
}

function getRankClass(game) {
  const firstRider = game.rankings?.[0];
  if (firstRider?.team === 'team_a' || firstRider?.teamId === 'team_a') {
    return 'history-card__rank--gold';
  }
  const top3 = game.rankings?.slice(0, 3) || [];
  if (top3.some(r => r?.team === 'team_a' || r?.teamId === 'team_a')) {
    return 'history-card__rank--podium';
  }
  return '';
}

function getRankDisplay(game) {
  const rankings = game.rankings || [];
  for (let i = 0; i < rankings.length; i++) {
    const r = rankings[i];
    if (r?.team === 'team_a' || r?.teamId === 'team_a') {
      return i === 0 ? '1er' : i === 1 ? '2e' : i === 2 ? '3e' : `${i + 1}e`;
    }
  }
  return '—';
}

function formatDate(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

function formatRelativeDate(date) {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;

    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function getRaceName(game) {
  if (game.raceMode === 'stage') return 'Course à étapes';
  if (game.racePreset) {
    const names = {
      ardennaise: 'Ardennaise',
      lombarde: 'Lombarde',
      riviera: 'Riviera',
      nord: 'Nord'
    };
    return names[game.racePreset] || game.racePreset;
  }
  return 'Course';
}

function getRaceIcon(game) {
  return game.raceMode === 'stage' ? 'calendar' : 'laurel';
}

const racePresetLabels = {
  ardennaise: 'Ardennaise',
  lombarde: 'Lombarde',
  riviera: 'Riviera',
  nord: 'Nord'
};

function getRaceLabel({ raceMode, racePreset, raceName }) {
  if (raceName) return raceName;

  const normalizedMode = String(raceMode || '').toLowerCase();
  if (normalizedMode === 'stage') return 'Course à étapes';

  if (racePreset) return racePresetLabels[racePreset] || racePreset;

  return 'Course';
}

function normalizeFinishedLocalGame(localGame) {
  const meta = localGame.meta || {};
  const state = localGame.state || {};

  return {
    id: localGame.id,
    source: 'local',
    name: meta.name || 'Sans nom',
    finishedAt: meta.savedAt || null,
    raceLabel: getRaceLabel({
      raceMode: meta.raceMode,
      racePreset: null,
      raceName: meta.raceName
    }),
    currentTurn: meta.currentTurn || null,
    rankings: Array.isArray(state.rankings) ? state.rankings : []
  };
}

function normalizeFinishedCloudGame(cloudGame) {
  return {
    id: cloudGame.id,
    source: 'cloud',
    name: cloudGame.name || 'Sans nom',
    finishedAt: cloudGame.updated_at || cloudGame.created_at || null,
    raceLabel: getRaceLabel({
      raceMode: cloudGame.race_mode,
      racePreset: cloudGame.race_preset,
      raceName: null
    }),
    currentTurn: cloudGame.current_turn || null,
    rankings: Array.isArray(cloudGame.state?.rankings) ? cloudGame.state.rankings : []
  };
}

async function fetchFinishedGames() {
  statsLoading.value = true;
  statsError.value = '';

  const finished = [];
  let cloudError = null;

  try {
    const allLocalGames = listLocalGames();

    const localFinished = allLocalGames
      .filter(game => {
        const metaPhase = String(game.meta?.phase || '').toLowerCase();
        const statePhase = String(game.state?.phase || '').toLowerCase();
        // Check both meta.phase AND state.phase for backwards compatibility
        return metaPhase === 'finished' || statePhase === 'finished';
      })
      .map(normalizeFinishedLocalGame);
    finished.push(...localFinished);

    if (supabase && user.value) {
      const { data, error } = await supabase
        .from('games')
        .select('id,name,updated_at,created_at,race_mode,race_preset,current_turn,phase,state')
        .eq('owner_id', user.value.id)
        .eq('phase', 'finished')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        cloudError = error;
      } else {
        finished.push(...(data || []).map(normalizeFinishedCloudGame));
      }
    }

    finished.sort((a, b) => new Date(b.finishedAt || 0) - new Date(a.finishedAt || 0));
    finishedGames.value = finished.slice(0, 20);

    if (!finishedGames.value.length && cloudError) {
      statsError.value = 'Impossible de charger les statistiques.';
    }
  } catch (err) {
    console.error('Fetch finished games error:', err);
    statsError.value = 'Impossible de charger les statistiques.';
    finishedGames.value = [];
  } finally {
    statsLoading.value = false;
  }
}

function goBack() {
  emit('back', props.returnTarget);
}

function handleLoad(game) {
  emit('load', game);
}

function confirmDelete(game) {
  gameToDelete.value = game;
}

function cancelDelete() {
  gameToDelete.value = null;
}

async function executeDelete() {
  if (!gameToDelete.value) return;

  deletingId.value = gameToDelete.value.id;

  const result = await deleteGame(gameToDelete.value.id);

  deletingId.value = null;

  if (result.success) {
    gameToDelete.value = null;
  }
}

// Delete account functions
function cancelDeleteAccount() {
  showDeleteAccountModal.value = false;
  deleteConfirmText.value = '';
  deleteAccountError.value = '';
}

async function executeDeleteAccount() {
  if (deleteConfirmText.value !== 'SUPPRIMER') return;

  isDeletingAccount.value = true;
  deleteAccountError.value = '';

  const result = await deleteAccount();

  isDeletingAccount.value = false;

  if (result.success) {
    showDeleteAccountModal.value = false;
    emit('account-deleted');
  } else {
    deleteAccountError.value = result.error || 'Erreur lors de la suppression';
  }
}

// Attendre que l'auth soit prête avant de charger les données
async function loadData() {
  await fetchGames();
  fetchFinishedGames();
}

onMounted(() => {
  // Si l'auth est déjà chargée, charger les données immédiatement
  if (!authLoading.value) {
    loadData();
  }
});

// Si l'auth n'était pas prête au mount, attendre qu'elle le soit
watch(authLoading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading) {
    loadData();
  }
});
</script>

<style scoped>
/* ========================================
   Account Page - Dark Block Design
   ======================================== */
.account-page {
  min-height: 100vh;
  background: #1a1d21;
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: #22262b;
  border-bottom: 1px solid #2d3238;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky, 200);
}

.account-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display, inherit);
  font-size: 15px;
  font-weight: 600;
  color: #e8e9eb;
  margin: 0;
}

.account-title :deep(svg) {
  color: #8b9199;
}

.header-spacer {
  width: 80px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #3d444d;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-back:hover {
  background: #2d3238;
  color: #e8e9eb;
  border-color: #4d545e;
}

.btn-back :deep(svg) {
  width: 14px;
  height: 14px;
}

/* ========================================
   Content Area
   ======================================== */
.account-content {
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-sizing: border-box;
}

/* ========================================
   Blocks - Dark card style
   ======================================== */
.block {
  background: #22262b;
  border: 1px solid #2d3238;
  border-radius: 10px;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.block--profile {
  border-left: 3px solid #d4a21a;
}

.block--danger {
  border-color: #5c2626;
  background: #251c1c;
}

.block-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.block-header :deep(svg) {
  color: #6b7280;
  width: 18px;
  height: 18px;
}

.block-title {
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  flex: 1;
}

.block-count {
  font-size: 12px;
  color: #6b7280;
  background: #2d3238;
  padding: 2px 8px;
  border-radius: 10px;
}

.block-text {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.block-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  color: #4b5563;
  font-size: 13px;
}

.block-empty--error {
  color: #ef4444;
}

/* ========================================
   Profile Block
   ======================================== */
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.profile-avatar {
  width: 48px;
  height: 48px;
  background: #2d3238;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar :deep(svg) {
  color: #6b7280;
  width: 24px;
  height: 24px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: #e8e9eb;
  margin: 0;
}

.profile-badge {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #d4a21a;
  font-weight: 500;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-sm);
  border-top: 1px solid #2d3238;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
}

.detail-value {
  font-size: 13px;
  color: #9ca3af;
}

/* ========================================
   Stats Grid
   ======================================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
}

.stats-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.stat-card {
  background: #2d3238;
  border-radius: 8px;
  padding: var(--space-md) var(--space-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.stat-card--gold {
  background: linear-gradient(145deg, #3d3520 0%, #2d2818 100%);
  border: 1px solid #5c4a1a;
}

.stat-card--gold .stat-value {
  color: #d4a21a;
}

.stat-card--gold .stat-icon {
  color: #d4a21a;
}

.stat-card--silver {
  background: linear-gradient(145deg, #32363d 0%, #282c32 100%);
  border: 1px solid #4d545e;
}

.stat-card--silver .stat-value {
  color: #9ca3af;
}

.stat-icon {
  color: #4b5563;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #e8e9eb;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  font-weight: 500;
}

/* ========================================
   Share Section
   ======================================== */
.share-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: var(--space-sm);
  padding: 4px;
  background: #1a1d21;
  border-radius: 8px;
}

.share-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.share-tab:hover {
  color: #9ca3af;
}

.share-tab--active {
  background: #2d3238;
  color: #e8e9eb;
}

.share-description {
  margin-bottom: var(--space-sm);
}

.share-buttons {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.btn-action--primary {
  background: #2563eb;
  border-color: #3b82f6;
}

.btn-action--primary:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #2563eb;
}

.btn-action--gold {
  background: linear-gradient(145deg, #92711a 0%, #6b5315 100%);
  border-color: #a37f1e;
  color: #fef3c7;
}

.btn-action--gold:hover:not(:disabled) {
  background: linear-gradient(145deg, #a37f1e 0%, #7c5f18 100%);
}

.btn-action--gold .stat-icon,
.btn-action--gold :deep(svg) {
  color: #fef3c7;
}

.share-buttons--copy {
  margin-top: var(--space-sm);
}

/* Social share buttons */
.share-social {
  display: flex;
  gap: var(--space-sm);
}

.share-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: #fff;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.share-social-btn:hover {
  transform: scale(1.08);
}

.share-social-btn--twitter {
  background: #000;
}

.share-social-btn--facebook {
  background: #1877f2;
}

.share-social-btn--instagram {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
}

.share-social-btn--tiktok {
  background: #000;
  position: relative;
}

.share-social-btn--whatsapp {
  background: #25d366;
}

/* ========================================
   History List
   ======================================== */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 10px 12px;
  background: #2d3238;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.history-row:hover {
  background: #353a42;
}

.history-rank {
  width: 32px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  background: #1a1d21;
  border-radius: 4px;
  flex-shrink: 0;
}

.history-rank.history-card__rank--gold {
  background: #3d3520;
  color: #d4a21a;
}

.history-rank.history-card__rank--podium {
  background: #2d3238;
  color: #9ca3af;
}

.history-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-name {
  font-size: 13px;
  font-weight: 500;
  color: #e8e9eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  font-size: 11px;
  color: #6b7280;
}

.history-date {
  font-size: 11px;
  color: #4b5563;
  white-space: nowrap;
}

/* ========================================
   Games List
   ======================================== */
.games-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.game-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: 12px;
  background: #2d3238;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.game-row:hover {
  background: #353a42;
}

.game-main {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.game-name {
  font-size: 13px;
  font-weight: 500;
  color: #e8e9eb;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-tag {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 6px;
  border-radius: 4px;
}

.game-tag--cloud {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.game-tag--local {
  background: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
}

.game-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
}

.game-meta :deep(svg) {
  width: 12px;
  height: 12px;
  color: #4b5563;
}

.game-sep {
  color: #4b5563;
}

.game-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);
  padding-top: var(--space-sm);
  border-top: 1px solid #1a1d21;
}


/* ========================================
   Buttons - Dark theme
   ======================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn :deep(svg) {
  width: 14px;
  height: 14px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-action {
  background: #3d444d;
  border: 1px solid #4d545e;
  color: #e8e9eb;
}

.btn-action:hover:not(:disabled) {
  background: #4d545e;
  border-color: #5d646e;
}

.btn-icon {
  padding: 8px;
  background: transparent;
  border: 1px solid #3d444d;
  color: #6b7280;
}

.btn-icon:hover:not(:disabled) {
  background: #2d3238;
  color: #9ca3af;
}

.btn-icon--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.btn-danger {
  background: #7f1d1d;
  border: 1px solid #991b1b;
  color: #fecaca;
}

.btn-danger:hover:not(:disabled) {
  background: #991b1b;
}

.btn-secondary {
  background: #2d3238;
  border: 1px solid #3d444d;
  color: #9ca3af;
}

.btn-secondary:hover:not(:disabled) {
  background: #353a42;
  color: #e8e9eb;
}

/* ========================================
   Modal - Dark theme
   ======================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 400);
  padding: var(--space-md);
}

.modal-dialog {
  background: #22262b;
  border: 1px solid #2d3238;
  border-radius: 12px;
  padding: var(--space-lg);
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8e9eb;
  margin: 0 0 var(--space-sm);
}

.modal-text {
  font-size: 13px;
  color: #9ca3af;
  margin: 0 0 var(--space-lg);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #3d444d;
  border-top-color: #9ca3af;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Delete account modal */
.modal-dialog--danger {
  border-top: 3px solid #ef4444;
}

.modal-title--danger {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.modal-title--danger :deep(svg) {
  color: #ef4444;
}

.modal-error {
  padding: var(--space-sm) var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #7f1d1d;
  border-radius: 6px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: var(--space-md);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: var(--space-xs);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font-body, inherit);
  border: 1px solid #3d444d;
  border-radius: 6px;
  background: #1a1d21;
  color: #e8e9eb;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4d545e;
  box-shadow: 0 0 0 3px rgba(77, 84, 94, 0.3);
}

/* Mobile */
@media (max-width: 720px) {
  .account-header {
    padding: var(--space-sm) var(--space-md);
  }

  .account-title {
    font-size: 14px;
  }

  .header-spacer {
    width: 60px;
  }

  .account-content {
    padding: var(--space-md);
  }

  /* Profile block mobile */
  .profile-avatar {
    width: 40px;
    height: 40px;
  }

  .profile-avatar :deep(svg) {
    width: 20px;
    height: 20px;
  }

  .profile-name {
    font-size: 15px;
  }

  .profile-details {
    flex-direction: column;
    gap: var(--space-xs);
  }

  /* Stats grid mobile - 3 colonnes restent */
  .stats-grid--3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-value {
    font-size: 18px;
  }

  /* Share section mobile */
  .share-tabs {
    margin-bottom: var(--space-xs);
  }

  .share-tab {
    font-size: 12px;
    padding: 6px 8px;
  }

  .share-social {
    justify-content: center;
  }

  .share-buttons {
    flex-direction: column;
  }

  .share-buttons .btn {
    width: 100%;
    justify-content: center;
  }

  /* History mobile */
  .history-row {
    padding: 8px 10px;
    gap: var(--space-sm);
  }

  .history-rank {
    width: 28px;
    font-size: 10px;
  }

  .history-name {
    font-size: 12px;
  }

  .history-date {
    display: none;
  }

  /* Games list mobile */
  .game-row {
    padding: 10px;
  }

  .game-name {
    font-size: 12px;
    white-space: normal;
  }

  .game-actions {
    flex-wrap: wrap;
  }
}
</style>
