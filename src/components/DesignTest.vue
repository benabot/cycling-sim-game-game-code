<template>
  <div class="app-container">
    <div class="content-area">
      <div class="main-panel p-xl" style="max-width: 1100px; margin: 0 auto;">
        
        <!-- Section Header Demo -->
        <div class="section-header">
          <svg class="section-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <h1 class="section-header-title">Design System Test</h1>
          <span class="section-header-subtitle">Phase 1-5 Complete</span>
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

        <!-- NEW: Rider Icons Section -->
        <section style="margin-bottom: var(--space-xl);">
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">Icônes Spécialités</h2>
          </div>
          <div class="flex gap-xl flex-wrap">
            <div v-for="type in riderTypes" :key="type" class="icon-demo">
              <RiderIcon :type="type" :size="32" />
              <span class="type-caption">{{ type }}</span>
            </div>
          </div>
        </section>

        <!-- NEW: Terrain Icons Section -->
        <section style="margin-bottom: var(--space-xl);">
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">Icônes Terrain</h2>
          </div>
          <div class="flex gap-xl flex-wrap">
            <div v-for="type in terrainTypes" :key="type" class="icon-demo">
              <TerrainIcon :type="type" :size="32" />
              <span class="type-caption">{{ type }}</span>
            </div>
          </div>
        </section>

        <!-- NEW: Rider Tokens Section -->
        <section style="margin-bottom: var(--space-xl);">
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">Tokens Coureurs</h2>
          </div>
          
          <!-- Team A -->
          <div style="margin-bottom: var(--space-lg);">
            <span class="type-label" style="color: var(--team-red-ui); margin-bottom: var(--space-sm); display: block;">Équipe Rouge</span>
            <div class="flex gap-md flex-wrap items-center">
              <RiderToken 
                v-for="(type, i) in riderTypes" 
                :key="`a-${type}`"
                :rider="{ id: `a-${i}`, name: `Coureur ${i+1}`, type, team: 'team_a', position: 10+i }"
              />
            </div>
          </div>
          
          <!-- Team B -->
          <div style="margin-bottom: var(--space-lg);">
            <span class="type-label" style="color: var(--team-blue-ui); margin-bottom: var(--space-sm); display: block;">Équipe Bleue</span>
            <div class="flex gap-md flex-wrap items-center">
              <RiderToken 
                v-for="(type, i) in riderTypes" 
                :key="`b-${type}`"
                :rider="{ id: `b-${i}`, name: `Coureur ${i+1}`, type, team: 'team_b', position: 8+i }"
              />
            </div>
          </div>
          
          <!-- Team C -->
          <div style="margin-bottom: var(--space-lg);">
            <span class="type-label" style="color: var(--team-green-ui); margin-bottom: var(--space-sm); display: block;">Équipe Verte</span>
            <div class="flex gap-md flex-wrap items-center">
              <RiderToken 
                v-for="(type, i) in riderTypes" 
                :key="`c-${type}`"
                :rider="{ id: `c-${i}`, name: `Coureur ${i+1}`, type, team: 'team_c', position: 6+i }"
              />
            </div>
          </div>
          
          <!-- Team D -->
          <div>
            <span class="type-label" style="color: var(--team-yellow-print); margin-bottom: var(--space-sm); display: block;">Équipe Jaune</span>
            <div class="flex gap-md flex-wrap items-center">
              <RiderToken 
                v-for="(type, i) in riderTypes" 
                :key="`d-${type}`"
                :rider="{ id: `d-${i}`, name: `Coureur ${i+1}`, type, team: 'team_d', position: 4+i }"
              />
            </div>
          </div>
        </section>

        <!-- Token States -->
        <section style="margin-bottom: var(--space-xl);">
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">États des Tokens</h2>
          </div>
          <div class="flex gap-lg flex-wrap items-end">
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'demo1', name: 'Normal', type: 'rouleur', team: 'team_a', position: 1 }"
              />
              <span class="type-caption">Normal</span>
            </div>
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'demo2', name: 'Selected', type: 'climber', team: 'team_b', position: 2 }"
                :isSelected="true"
              />
              <span class="type-caption">Selected</span>
            </div>
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'demo3', name: 'Leader', type: 'sprinter', team: 'team_c', position: 3 }"
                :isLeader="true"
              />
              <span class="type-caption">Leader</span>
            </div>
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'demo4', name: 'Played', type: 'puncher', team: 'team_a', position: 4 }"
                :hasPlayed="true"
              />
              <span class="type-caption">Played</span>
            </div>
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'demo5', name: 'Finished', type: 'versatile', team: 'team_d', position: 81, hasFinished: true }"
              />
              <span class="type-caption">Finished</span>
            </div>
          </div>
        </section>

        <!-- Token Sizes -->
        <section style="margin-bottom: var(--space-xl);">
          <div class="section-header section-header-compact">
            <h2 class="section-header-title">Tailles des Tokens</h2>
          </div>
          <div class="flex gap-lg items-end">
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'size1', name: 'Default', type: 'climber', team: 'team_b', position: 1 }"
              />
              <span class="type-caption">44×44</span>
            </div>
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'size2', name: 'Compact', type: 'climber', team: 'team_b', position: 1 }"
                :compact="true"
              />
              <span class="type-caption">28×28</span>
            </div>
            <div class="flex flex-col items-center gap-xs">
              <RiderToken 
                :rider="{ id: 'size3', name: 'Mini', type: 'climber', team: 'team_b', position: 1 }"
                :mini="true"
              />
              <span class="type-caption">20×20</span>
            </div>
          </div>
        </section>

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
        <section style="margin-bottom: var(--space-xl);">
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
import { RiderIcon, TerrainIcon } from './icons';
import RiderToken from './RiderToken.vue';

const selectedTeams = ref(1);
const teamName = ref('');

const riderTypes = ['climber', 'puncher', 'rouleur', 'sprinter', 'versatile'];
const terrainTypes = ['flat', 'hill', 'mountain', 'descent', 'sprint', 'refuel'];
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

.icon-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  min-width: 80px;
}
</style>
