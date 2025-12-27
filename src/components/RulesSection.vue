<template>
  <div class="rules-section">
    <h2>📖 Règles v3.1 - Système de Cartes</h2>
    
    <div class="rules-grid">
      <div class="rule-card">
        <h3>🎯 Objectif</h3>
        <p>Franchir la ligne d'arrivée en premier. Départ à la case 0, arrivée au-delà de la case 80.</p>
      </div>

      <div class="rule-card">
        <h3>🎮 Séquence</h3>
        <ol>
          <li>Choisir une carte</li>
          <li>Lancer 1d6</li>
          <li>Utiliser Spécialité? (+2)</li>
          <li>Avancer du total</li>
        </ol>
      </div>

      <div class="rule-card">
        <h3>🃏 Cartes Mouvement</h3>
        <p>+2, +3, +3, +4, +4, +5</p>
        <p><em>Recyclées quand épuisées</em></p>
      </div>

      <div class="rule-card">
        <h3>⚔️ Cartes Attaque</h3>
        <p>+6 (×2, usage unique)</p>
        <p><em>Ne sont pas recyclées</em></p>
      </div>

      <div class="rule-card">
        <h3>★ Cartes Spécialité</h3>
        <p>+2 sur terrain favori</p>
        <p><em>Grimpeur: Montagne, Puncheur: Côte, Rouleur: Plaine, Sprinteur: Sprint</em></p>
      </div>

      <div class="rule-card highlight">
        <h3>👥 Cases (Max 4)</h3>
        <p>Max 4 coureurs par case. Premier arrivé = droite (leader).</p>
        <p><em>Si case pleine → arrêt derrière</em></p>
      </div>

      <div class="rule-card">
        <h3>🌀 Aspiration</h3>
        <p>Fin de tour : si 1 case d'écart → avancer d'1 case (pas forcément rejoindre le groupe).</p>
        <p><em>Pas en montagne ni descente. Dès le tour 1.</em></p>
      </div>

      <div class="rule-card">
        <h3>💨 Prise de Vent</h3>
        <p>Après aspiration : si <strong>case vide devant</strong>, le leader reçoit +1.</p>
        <p><em>Pas de vent en montagne.</em></p>
      </div>

      <div class="rule-card">
        <h3>🛡️ À l'Abri</h3>
        <p>Tous les autres coureurs reçoivent +2.</p>
        <p><em>En montagne : tous reçoivent +2.</em></p>
      </div>

      <div class="rule-card">
        <h3>🏔️ Montagne</h3>
        <p>Pas d'aspiration, pas de vent.</p>
        <p><em>Tous les coureurs reçoivent +2 abri.</em></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rules-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
}

.rules-section h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #1e293b;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.rule-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.rule-card.highlight {
  border-color: #3b82f6;
  background: #eff6ff;
}

.rule-card h3 {
  margin: 0 0 8px 0;
  font-size: 0.95em;
}

.rule-card p,
.rule-card ul,
.rule-card ol {
  margin: 0;
  font-size: 0.85em;
  color: #475569;
}

.rule-card p + p { margin-top: 5px; }
.rule-card ul, .rule-card ol { padding-left: 18px; }
.rule-card li { margin: 3px 0; }
.rule-card em { font-size: 0.9em; color: #64748b; }
</style>
