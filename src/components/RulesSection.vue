<template>
  <div class="rules-section">
    <h2>📖 Règles v3.2 - Système de Cartes Équilibré</h2>
    
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
          <li>Voir aperçu → Utiliser Spécialité?</li>
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

      <div class="rule-card highlight">
        <h3>★ Cartes Spécialité (+2)</h3>
        <p><strong>Grimpeur</strong>: Montagne + pas d'arrêt au sommet</p>
        <p><strong>Puncheur</strong>: Côte (+2 bonus terrain)</p>
        <p><strong>Rouleur</strong>: Plaine (+2) + immunité au vent</p>
        <p><strong>Sprinteur</strong>: Sprint (+3 bonus terrain)</p>
        <p><strong>Polyvalent</strong>: Partout</p>
      </div>

      <div class="rule-card">
        <h3>👥 Cases (Max 4)</h3>
        <p>Max 4 coureurs par case. Premier arrivé = droite (leader).</p>
        <p><em>Si case pleine → arrêt derrière</em></p>
      </div>

      <div class="rule-card highlight">
        <h3>⛰️ Arrêt au Sommet</h3>
        <p>Les <strong>non-grimpeurs</strong> doivent s'arrêter à la dernière case de montagne.</p>
        <p><em>Les grimpeurs peuvent passer librement.</em></p>
      </div>

      <div class="rule-card highlight">
        <h3>🔮 Aperçu Position</h3>
        <p>Après le dé, voir où vous irez :</p>
        <p>🟠 <strong>Sans</strong> spécialité</p>
        <p>🟢 <strong>Avec</strong> spécialité</p>
        <p>🔵 <strong>Les deux</strong> = même case</p>
      </div>

      <div class="rule-card">
        <h3>🌀 Aspiration</h3>
        <p>Fin de tour : si 1 case d'écart → avancer d'1 case.</p>
        <p><em>Pas en montagne ni descente. Dès le tour 1.</em></p>
      </div>

      <div class="rule-card">
        <h3>💨 Prise de Vent</h3>
        <p>Après aspiration : si <strong>case vide devant</strong>, le leader reçoit +1.</p>
        <p><em>Pas de vent en montagne. Rouleurs immunisés.</em></p>
      </div>

      <div class="rule-card">
        <h3>🛡️ À l'Abri</h3>
        <p>Tous les autres coureurs reçoivent +2.</p>
        <p><em>En montagne : tous reçoivent +2.</em></p>
      </div>

      <div class="rule-card">
        <h3>🎿 Descente - Chute</h3>
        <p>🎲 = 1 → Test de chute (1d6).</p>
        <p>Si 1-2 : <strong>Chute !</strong> Recule 3 cases, +2 fatigue, passe le tour suivant.</p>
        <p><em>Vitesse minimum garantie : 4 cases.</em></p>
      </div>
    </div>

    <div class="bonus-table">
      <h3>📊 Bonus Terrain v3.2</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>🟩 Plat</th>
            <th>🟨 Côte</th>
            <th>🟫 Montagne</th>
            <th>🟦 Descente</th>
            <th>🟪 Sprint</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🧗 Grimpeur</td>
            <td>0</td>
            <td>+1</td>
            <td class="bonus">+2</td>
            <td>+2</td>
            <td class="malus">-1</td>
          </tr>
          <tr>
            <td>💥 Puncheur</td>
            <td>0</td>
            <td class="bonus">+2</td>
            <td>+1</td>
            <td>+2</td>
            <td>0</td>
          </tr>
          <tr>
            <td>🚴 Rouleur</td>
            <td class="bonus">+2</td>
            <td>0</td>
            <td class="malus">-1</td>
            <td>+3</td>
            <td>0</td>
          </tr>
          <tr>
            <td>⚡ Sprinteur</td>
            <td>0</td>
            <td class="malus">-1</td>
            <td class="malus">-2</td>
            <td>+3</td>
            <td class="bonus">+3</td>
          </tr>
          <tr>
            <td>🎯 Polyvalent</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>+2</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
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

/* Bonus table */
.bonus-table {
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.bonus-table h3 {
  margin: 0 0 12px 0;
  text-align: center;
}

.bonus-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.bonus-table th,
.bonus-table td {
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.bonus-table th {
  background: #f8fafc;
  font-weight: 600;
}

.bonus-table td:first-child {
  text-align: left;
  font-weight: 500;
}

.bonus-table .bonus {
  background: #dcfce7;
  color: #166534;
  font-weight: bold;
}

.bonus-table .malus {
  background: #fee2e2;
  color: #991b1b;
  font-weight: bold;
}

@media (max-width: 600px) {
  .bonus-table table {
    font-size: 0.75em;
  }
  .bonus-table th,
  .bonus-table td {
    padding: 5px 3px;
  }
}
</style>
