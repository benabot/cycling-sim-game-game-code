<template>
  <div class="design-test panel-lg p-xl">
    <h1 class="type-display-h1">Design System Test</h1>
    <p class="type-caption" style="margin-bottom: var(--space-xl);">
      Vérification des tokens et de la typographie
    </p>

    <!-- Typography -->
    <section style="margin-bottom: var(--space-2xl);">
      <h2 class="type-display-h2" style="margin-bottom: var(--space-md);">Typographie</h2>
      
      <div class="flex flex-col gap-md">
        <div>
          <span class="type-label-caps">Display H1</span>
          <p class="type-display-h1">Sora Bold 28px</p>
        </div>
        <div>
          <span class="type-label-caps">Display H2</span>
          <p class="type-display-h2">Sora Semibold 20px</p>
        </div>
        <div>
          <span class="type-label-caps">Body</span>
          <p class="type-body">Inter Regular 14px - Texte principal de l'interface</p>
        </div>
        <div>
          <span class="type-label-caps">Caption</span>
          <p class="type-caption">Inter Regular 12px - Texte secondaire</p>
        </div>
        <div>
          <span class="type-label-caps">Numeric</span>
          <p class="type-numeric-lg">1234567890</p>
        </div>
      </div>
    </section>

    <!-- Colors -->
    <section style="margin-bottom: var(--space-2xl);">
      <h2 class="type-display-h2" style="margin-bottom: var(--space-md);">Couleurs équipes</h2>
      
      <div class="flex gap-md flex-wrap">
        <div class="color-swatch" style="--swatch-color: var(--team-red-print);">
          <span class="type-label">Red</span>
        </div>
        <div class="color-swatch" style="--swatch-color: var(--team-blue-print);">
          <span class="type-label">Blue</span>
        </div>
        <div class="color-swatch" style="--swatch-color: var(--team-green-print);">
          <span class="type-label">Green</span>
        </div>
        <div class="color-swatch" style="--swatch-color: var(--team-yellow-print);">
          <span class="type-label">Yellow</span>
        </div>
      </div>
    </section>

    <!-- Terrain Colors -->
    <section style="margin-bottom: var(--space-2xl);">
      <h2 class="type-display-h2" style="margin-bottom: var(--space-md);">Couleurs terrain</h2>
      
      <div class="flex gap-md flex-wrap">
        <div class="terrain-swatch" style="--terrain: var(--terrain-flat);">
          <span class="type-label">Plat</span>
        </div>
        <div class="terrain-swatch" style="--terrain: var(--terrain-hill);">
          <span class="type-label">Côte</span>
        </div>
        <div class="terrain-swatch" style="--terrain: var(--terrain-mountain);">
          <span class="type-label">Montagne</span>
        </div>
        <div class="terrain-swatch" style="--terrain: var(--terrain-descent);">
          <span class="type-label">Descente</span>
        </div>
        <div class="terrain-swatch" style="--terrain: var(--terrain-sprint);">
          <span class="type-label">Sprint</span>
        </div>
      </div>
    </section>

    <!-- Shadows -->
    <section>
      <h2 class="type-display-h2" style="margin-bottom: var(--space-md);">Shadows</h2>
      
      <div class="flex gap-lg">
        <div class="shadow-demo" style="box-shadow: var(--shadow-sm);">
          <span class="type-caption">sm</span>
        </div>
        <div class="shadow-demo" style="box-shadow: var(--shadow-md);">
          <span class="type-caption">md</span>
        </div>
        <div class="shadow-demo" style="box-shadow: var(--shadow-lg);">
          <span class="type-caption">lg</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Design System Test Component
// Usage: Import in App.vue temporarily to verify tokens
</script>

<style scoped>
.design-test {
  max-width: 800px;
  margin: var(--space-xl) auto;
}

.color-swatch {
  width: 80px;
  height: 80px;
  background-color: var(--swatch-color);
  border-radius: var(--radius-md);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-sm);
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

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

.shadow-demo {
  width: 100px;
  height: 100px;
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
