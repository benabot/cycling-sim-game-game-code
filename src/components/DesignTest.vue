<template>
  <div class="app-container">
    <div class="content-area">
      <div class="main-panel p-xl" style="max-width: 1000px; margin: 0 auto;">
        
        <!-- Section Header Demo -->
        <div class="section-header">
          <svg class="section-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <h1 class="section-header-title">Design System Test</h1>
          <span class="section-header-subtitle">Phase 1-3 Complete</span>
        </div>

        <!-- Layout Demo -->
        <div class="layout-split" style="margin-bottom: var(--space-2xl);">
          <!-- Left Column -->
          <div>
            <!-- Typography -->
            <section style="margin-bottom: var(--space-xl);">
              <div class="section-header section-header-compact">
                <h2 class="section-header-title">Typographie</h2>
              </div>
              <div class="flex flex-col gap-sm">
                <p class="type-display-h1">Sora 28px</p>
                <p class="type-display-h2">Sora 20px</p>
                <p class="type-body">Inter 14px - Texte principal</p>
                <p class="type-numeric-lg">1234567890</p>
              </div>
            </section>

            <!-- Buttons -->
            <section style="margin-bottom: var(--space-xl);">
              <div class="section-header section-header-compact">
                <h2 class="section-header-title">Boutons</h2>
              </div>
              <div class="flex gap-sm flex-wrap">
                <button class="btn btn-primary">Primary</button>
                <button class="btn btn-secondary">Secondary</button>
                <button class="btn btn-ghost">Ghost</button>
                <button class="btn btn-danger btn-sm">Danger</button>
                <button class="btn btn-success btn-sm">Success</button>
              </div>
            </section>

            <!-- Badges -->
            <section>
              <div class="section-header section-header-compact">
                <h2 class="section-header-title">Badges</h2>
              </div>
              <div class="flex gap-sm flex-wrap">
                <span class="badge badge-red">Red</span>
                <span class="badge badge-blue">Blue</span>
                <span class="badge badge-green">Green</span>
                <span class="badge badge-yellow">Yellow</span>
              </div>
              <div class="flex gap-sm flex-wrap" style="margin-top: var(--space-sm);">
                <span class="badge badge-pill badge-terrain-flat">Plat</span>
                <span class="badge badge-pill badge-terrain-hill">Côte</span>
                <span class="badge badge-pill badge-terrain-mountain">Montagne</span>
                <span class="badge badge-pill badge-terrain-descent">Descente</span>
              </div>
            </section>
          </div>

          <!-- Right Column -->
          <div>
            <!-- Log Panel -->
            <div class="log-panel" style="margin-bottom: var(--space-lg);">
              <div class="log-panel-header">
                <svg class="log-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="log-panel-title">Historique</span>
              </div>
              <div class="log-panel-content">
                <div class="log-entry">
                  <span class="log-entry-time">14:32</span>
                  <span class="log-entry-team log-entry-team-red">Rouge</span> avance de 5 cases
                </div>
                <div class="log-entry">
                  <span class="log-entry-time">14:31</span>
                  <span class="log-entry-team log-entry-team-blue">Bleu</span> utilise carte Attaque
                </div>
                <div class="log-entry">
                  <span class="log-entry-time">14:30</span>
                  <span class="log-entry-team log-entry-team-green">Vert</span> bénéficie de l'aspiration
                </div>
                <div class="log-entry">
                  <span class="log-entry-time">14:29</span>
                  <span class="log-entry-team log-entry-team-yellow">Jaune</span> pénalité vent (-1)
                </div>
                <div class="log-entry">
                  <span class="log-entry-time">14:28</span>
                  Tour 5 terminé
                </div>
              </div>
            </div>

            <!-- Cards -->
            <div class="flex gap-md">
              <div class="card card-team-red flex-1">
                <div class="card-body">
                  <span class="type-body-medium">Équipe Rouge</span>
                  <p class="type-caption">5 coureurs</p>
                </div>
              </div>
              <div class="card card-team-blue flex-1">
                <div class="card-body">
                  <span class="type-body-medium">Équipe Bleue</span>
                  <p class="type-caption">5 coureurs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr class="divider">

        <!-- Status Bar Demo -->
        <section style="margin-bottom: var(--space-xl);">
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">Status Bar</h2>
          </div>
          <div class="status-bar" style="border-radius: var(--radius-md);">
            <div class="status-bar-item">
              <span class="status-bar-label">Tour</span>
              <span class="status-bar-value">5/12</span>
            </div>
            <div class="status-bar-divider"></div>
            <div class="status-bar-item">
              <span class="status-bar-label">Équipe</span>
              <span class="status-bar-value" style="color: var(--team-red-ui);">Rouge</span>
            </div>
            <div class="status-bar-divider"></div>
            <div class="status-bar-item">
              <span class="status-bar-label">Leader</span>
              <span class="status-bar-value">Case 24</span>
            </div>
          </div>
        </section>

        <!-- Inputs & Segmented -->
        <section>
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">Formulaires</h2>
          </div>
          <div class="flex gap-xl">
            <div class="form-group" style="width: 200px;">
              <label class="form-label">Nom d'équipe</label>
              <input type="text" class="input" placeholder="Entrez un nom..." v-model="teamName">
            </div>
            <div>
              <label class="form-label" style="margin-bottom: var(--space-xs); display: block;">Nombre d'équipes</label>
              <div class="segmented">
                <button 
                  v-for="n in 3" 
                  :key="n"
                  class="segmented-item"
                  :class="{ 'segmented-item-active': selectedTeams === n }"
                  @click="selectedTeams = n"
                >
                  {{ n + 1 }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <hr class="divider">

        <!-- Terrain Colors -->
        <section>
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">Couleurs terrain</h2>
          </div>
          <div class="flex gap-md">
            <div class="terrain-swatch" style="--terrain: var(--terrain-flat);"><span class="type-label">Plat</span></div>
            <div class="terrain-swatch" style="--terrain: var(--terrain-hill);"><span class="type-label">Côte</span></div>
            <div class="terrain-swatch" style="--terrain: var(--terrain-mountain);"><span class="type-label">Montagne</span></div>
            <div class="terrain-swatch" style="--terrain: var(--terrain-descent);"><span class="type-label">Descente</span></div>
            <div class="terrain-swatch" style="--terrain: var(--terrain-sprint);"><span class="type-label">Sprint</span></div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selectedTeams = ref(1);
const teamName = ref('');
</script>

<style scoped>
.terrain-swatch {
  width: 100px;
  height: 60px;
  background-color: var(--terrain);
  border-radius: var(--radius-sm);
  border: 1px solid var(--track-grid-line);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
