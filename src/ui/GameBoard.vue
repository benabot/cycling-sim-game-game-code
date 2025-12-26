<template>
  <div class="game-container">
    <h1>🚴 Course Cycliste - v3</h1>
    
    <!-- Game Status Bar -->
    <div 
      class="status-bar" 
      :class="{ 'last-turn': gameStatus.isLastTurn }"
      :style="{ borderColor: gameStatus.currentTeamConfig?.color }"
    >
      <span class="turn" title="Tour actuel">Tour {{ gameStatus.turn }}</span>
      <span v-if="gameStatus.isLastTurn" class="last-turn-badge">🏁 DERNIER TOUR</span>
      <span 
        class="current-player"
        :style="{ background: gameStatus.currentTeamConfig?.color }"
        :title="`C'est au tour de ${gameStatus.currentTeamConfig?.playerName}`"
      >
        {{ gameStatus.currentTeamConfig?.playerName }}
      </span>
      <span class="phase" :title="phaseTooltip">{{ phaseLabel }}</span>
      <span v-if="gameStatus.phase === 'finished'" class="winner">
        🏆 {{ TeamConfig[gameStatus.winningTeam]?.name || 'Égalité' }}
      </span>
    </div>

    <!-- Course Board -->
    <div class="board-container">
      <div class="course">
        <div 
          v-for="(cell, index) in course" 
          :key="index"
          class="cell"
          :class="[
            cell.terrain, 
            { 
              'finish': index === finishLine - 1,
              'has-selected': hasSelectedRiderAtPosition(index)
            }
          ]"
          :title="getCellTooltip(cell, index)"
        >
          <span class="cell-number">{{ index + 1 }}</span>
          <div class="riders-on-cell">
            <span 
              v-for="rider in getRidersAtPosition(index)" 
              :key="rider.id"
              class="rider-token"
              :class="[rider.type, rider.team, { 'selected': rider.id === gameStatus.selectedRiderId }]"
              :title="getRiderBoardTooltip(rider)"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
        <div class="finish-zone">
          <span class="finish-flag">🏁</span>
          <div class="finished-riders">
            <span 
              v-for="rider in getFinishedRiders()" 
              :key="rider.id"
              class="rider-token finished"
              :class="[rider.type, rider.team]"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Legend -->
    <div class="team-legend">
      <div class="team-item">
        <span class="team-color" style="background: #dc2626"></span>
        Équipe Rouge (J1)
      </div>
      <div class="team-item">
        <span class="team-color" style="background: #2563eb"></span>
        Équipe Bleue (J2)
      </div>
      <div class="legend-info">
        Plateau: {{ finishLine }} cases | 1d6 + Carte + Bonus terrain
      </div>
    </div>

    <!-- Main Game Panel -->
    <div v-if="gameStatus.phase !== 'finished'" class="game-panel">
      
      <!-- Team Cards Overview (Always Visible) -->
      <div class="teams-cards-overview">
        <div 
          v-for="team in ['team_a', 'team_b']" 
          :key="team"
          class="team-cards-section"
          :class="{ 'active': gameStatus.currentTeam === team }"
        >
          <h3 :style="{ color: TeamConfig[team].color }">
            {{ TeamConfig[team].name }}
            <span v-if="gameStatus.currentTeam === team" class="active-indicator">← Joue</span>
          </h3>
          
          <div class="riders-cards-grid">
            <div 
              v-for="rider in getTeamRiders(team)" 
              :key="rider.id"
              class="rider-card-block"
              :class="{ 
                'selected': rider.id === gameStatus.selectedRiderId,
                'played': hasRiderPlayed(rider),
                'available': isRiderClickable(rider)
              }"
              @click="onRiderBlockClick(rider)"
            >
              <div class="rider-header-mini">
                <span class="emoji">{{ getRiderEmoji(rider.type) }}</span>
                <span class="name">{{ rider.name }}</span>
                <span class="position" :title="`Position: case ${rider.position + 1}`">
                  📍{{ rider.position + 1 }}
                </span>
                <span v-if="rider.hasFinished" class="badge-finished">🏁</span>
                <span v-else-if="hasRiderPlayed(rider)" class="badge-played">✓</span>
              </div>
              
              <!-- Cards Display -->
              <div class="cards-row">
                <!-- Movement Cards (Hand) -->
                <div class="cards-group hand-cards">
                  <span 
                    v-for="card in rider.hand" 
                    :key="card.id"
                    class="mini-card movement"
                    :class="{ 
                      'selectable': canSelectCard(rider, card),
                      'selected': card.id === gameStatus.selectedCardId,
                      'fatigue': card.type === 'fatigue'
                    }"
                    :style="{ background: card.color }"
                    :title="getCardTooltip(card)"
                    @click.stop="onCardClick(rider, card)"
                  >
                    +{{ card.value }}
                  </span>
                  <span v-if="rider.hand.length === 0" class="empty-hand">∅</span>
                </div>
                
                <!-- Attack Cards -->
                <div class="cards-group attack-cards">
                  <span 
                    v-for="card in rider.attackCards" 
                    :key="card.id"
                    class="mini-card attack"
                    :class="{ 
                      'selectable': canSelectCard(rider, card),
                      'selected': card.id === gameStatus.selectedCardId
                    }"
                    :title="'Attaque: +6 cases (usage unique)'"
                    @click.stop="onCardClick(rider, card)"
                  >
                    ⚔️+6
                  </span>
                </div>
                
                <!-- Specialty Cards -->
                <div class="cards-group specialty-cards">
                  <span 
                    v-for="card in rider.specialtyCards" 
                    :key="card.id"
                    class="mini-card specialty"
                    :class="{ 
                      'selectable': canSelectSpecialty(rider, card),
                      'selected': card.id === gameStatus.selectedSpecialtyId
                    }"
                    :title="getSpecialtyTooltip(rider, card)"
                    @click.stop="onSpecialtyClick(rider, card)"
                  >
                    ★+2
                  </span>
                </div>
              </div>
              
              <!-- Discard pile indicator -->
              <div v-if="rider.discard.length > 0" class="discard-info" :title="getDiscardTooltip(rider)">
                📥 {{ rider.discard.length }} (moy: {{ getDiscardAverage(rider) }})
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Panel -->
      <div class="action-panel" v-if="gameStatus.currentRider">
        <div class="current-rider-info" :style="{ borderColor: gameStatus.currentRider.teamConfig?.color }">
          <div class="info-header" :style="{ background: gameStatus.currentRider.teamConfig?.bgColor }">
            <span class="rider-emoji">{{ getRiderEmoji(gameStatus.currentRider.type) }}</span>
            <span class="rider-name">{{ gameStatus.currentRider.name }}</span>
            <span class="terrain-badge" :class="gameStatus.currentRider.terrain">
              {{ TerrainConfig[gameStatus.currentRider.terrain]?.emoji }}
              {{ TerrainConfig[gameStatus.currentRider.terrain]?.name }}
              <span class="bonus">({{ formatBonus(gameStatus.currentRider.terrainBonus) }})</span>
            </span>
          </div>
          
          <div class="action-buttons">
            <!-- Phase: Select Card -->
            <template v-if="gameStatus.turnPhase === 'select_card'">
              <p class="instruction">Choisissez une carte à jouer</p>
              <button @click="cancelRiderSelection" class="btn cancel">
                ← Changer de coureur
              </button>
            </template>
            
            <!-- Phase: Roll Dice -->
            <template v-if="gameStatus.turnPhase === 'roll_dice'">
              <div class="selected-card-display">
                Carte sélectionnée: 
                <span class="card-value">+{{ getSelectedCardValue() }}</span>
              </div>
              <button @click="onRollDice" class="btn roll">
                🎲 Lancer le dé
              </button>
              <button @click="cancelCardSelection" class="btn cancel">
                ← Changer de carte
              </button>
            </template>
            
            <!-- Phase: Select Specialty -->
            <template v-if="gameStatus.turnPhase === 'select_specialty'">
              <div class="dice-result">
                🎲 {{ gameStatus.lastDiceRoll?.result }} + Carte +{{ getSelectedCardValue() }}
              </div>
              <p class="instruction">Utiliser une carte Spécialité? (+2)</p>
              <div class="specialty-choice">
                <button 
                  v-if="gameStatus.currentRider.specialtyCards?.length > 0"
                  @click="useSpecialty" 
                  class="btn specialty"
                >
                  ★ Utiliser Spécialité (+2)
                </button>
                <button @click="skipSpecialty" class="btn skip">
                  Passer →
                </button>
              </div>
            </template>
            
            <!-- Phase: Resolve -->
            <template v-if="gameStatus.turnPhase === 'resolve'">
              <div class="movement-summary">
                <div class="dice-result" v-if="gameStatus.lastDiceRoll">
                  🎲 {{ gameStatus.lastDiceRoll.result }}
                  + 🃏 {{ getSelectedCardValue() }}
                  <span v-if="gameStatus.currentRider.terrainBonus !== 0">
                    {{ formatBonus(gameStatus.currentRider.terrainBonus) }} terrain
                  </span>
                  <span v-if="gameStatus.selectedSpecialtyId">
                    + ★2 spécialité
                  </span>
                </div>
                <div class="total-movement">
                  = <strong>{{ gameStatus.calculatedMovement }}</strong> cases
                </div>
              </div>
              <button @click="onResolve" class="btn resolve">
                ✓ Appliquer
              </button>
            </template>
          </div>
        </div>
      </div>
      
      <!-- No rider selected -->
      <div v-else class="no-selection">
        <p>👆 Cliquez sur un coureur de votre équipe pour le jouer</p>
      </div>
    </div>

    <!-- Game Over -->
    <div v-if="gameStatus.phase === 'finished'" class="game-over-panel">
      <h2>🏆 Course Terminée!</h2>
      <div class="winning-team" v-if="gameStatus.winningTeam">
        <span class="winner-badge" :style="{ background: TeamConfig[gameStatus.winningTeam]?.color }">
          {{ TeamConfig[gameStatus.winningTeam]?.name }} gagne!
        </span>
      </div>
      <div class="final-rankings">
        <div 
          v-for="(rider, index) in gameStatus.rankings?.slice(0, 10)" 
          :key="rider.id"
          class="ranking-row"
          :class="rider.team"
        >
          <span class="rank">{{ getMedal(index) }}</span>
          <span class="rider-name">{{ rider.name }}</span>
          <span class="team-badge" :style="{ background: getTeamColor(rider.team) }">
            {{ rider.team === 'team_a' ? 'R' : 'B' }}
          </span>
          <span class="final-pos">{{ rider.position + 1 }}</span>
        </div>
      </div>
      <button @click="restartGame" class="btn restart">🔄 Nouvelle partie</button>
    </div>

    <!-- Game Log -->
    <div class="game-log">
      <h3>📜 Historique</h3>
      <div class="log-entries" ref="logContainer">
        <div 
          v-for="(entry, i) in gameLog" 
          :key="i" 
          class="log-entry"
          :class="getLogClass(entry)"
        >
          {{ entry }}
        </div>
      </div>
    </div>

    <!-- Rules Section -->
    <div class="rules-section">
      <h2>📖 Règles v3 - Système de Cartes</h2>
      
      <div class="rules-grid">
        <div class="rule-card">
          <h3>🎯 Objectif</h3>
          <p>Franchir la ligne d'arrivée en premier. Quand un coureur arrive, c'est le <strong>dernier tour</strong> : tous jouent une dernière fois.</p>
        </div>

        <div class="rule-card">
          <h3>🎮 Tour de Jeu</h3>
          <p>Les joueurs <strong>alternent</strong>. Choisissez librement quel coureur jouer et quelle carte utiliser. <strong>Toutes les cartes de votre équipe sont visibles</strong> pour planifier votre stratégie.</p>
        </div>

        <div class="rule-card highlight">
          <h3>🎲 Mouvement (v3)</h3>
          <p><strong>1d6 + Carte + Bonus terrain</strong></p>
          <ul>
            <li>Dé: 1-6 (moyenne 3.5)</li>
            <li>Carte: +2 à +6 (moyenne 3.5)</li>
            <li>Total moyen: ~7 cases</li>
          </ul>
        </div>

        <div class="rule-card highlight">
          <h3>🃏 Cartes Mouvement</h3>
          <p>Main initiale de 6 cartes par coureur:</p>
          <ul>
            <li><span class="card-sample" style="background:#e5e7eb">+2</span> Tempo (×1)</li>
            <li><span class="card-sample" style="background:#fef08a">+3</span> Rythme (×2)</li>
            <li><span class="card-sample" style="background:#fed7aa">+4</span> Accélération (×2)</li>
            <li><span class="card-sample" style="background:#fecaca">+5</span> Sprint (×1)</li>
          </ul>
        </div>

        <div class="rule-card highlight">
          <h3>⚔️ Cartes Attaque (+6)</h3>
          <p><strong>2 par coureur</strong>, usage unique. Remplace la carte mouvement normale. Idéal pour les moments décisifs!</p>
        </div>

        <div class="rule-card highlight">
          <h3>★ Cartes Spécialité (+2)</h3>
          <p><strong>2 par coureur</strong>, s'ajoute au mouvement. Utilisable uniquement sur le terrain favori:</p>
          <ul>
            <li>🧗 Grimpeur → Montagne</li>
            <li>💥 Puncheur → Côte</li>
            <li>🚴 Rouleur → Plaine</li>
            <li>⚡ Sprinteur → Sprint</li>
            <li>🎯 Polyvalent → Partout</li>
          </ul>
        </div>

        <div class="rule-card highlight">
          <h3>😓 Cartes Fatigue</h3>
          <p>Polluent votre main! Ajoutées à la défausse:</p>
          <ul>
            <li><strong>+1 Fatigue</strong>: prise de vent, mener le groupe</li>
            <li><strong>+2 Fatigue</strong>: dans l'aspiration</li>
          </ul>
          <p>Quand la main est vide, recyclez la défausse!</p>
        </div>

        <div class="rule-card">
          <h3>💨 Prise de Vent</h3>
          <p><strong>À partir du tour 2.</strong> Un coureur prend le vent s'il est seul en tête ou à 2+ cases du groupe.</p>
          <p><em>Exception: pas en montagne ni en descente.</em></p>
        </div>

        <div class="rule-card">
          <h3>🔄 Aspiration</h3>
          <p>En fin de tour, les coureurs à 1 case d'écart se regroupent automatiquement. 2+ cases = échappée.</p>
          <p><em>Active en plaine, côte et sprint.</em></p>
        </div>

        <div class="rule-card">
          <h3>⛰️ Terrains</h3>
          <ul>
            <li>🟩 Plaine: Rouleur +1</li>
            <li>🟨 Côte: Grimpeur/Puncheur +1</li>
            <li>🟫 Montagne: Grimpeur +2</li>
            <li>🟦 Descente: +2/+3, min 4, risque chute</li>
            <li>🟪 Sprint: Sprinteur +2</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>⬇️ Descente</h3>
          <p>Bonus +2 (ou +3 rouleur/sprinteur). Minimum 4 cases.</p>
          <p><strong>Sur un 1:</strong> test de chute (1-2 = chute, recul 3 cases + 2 cartes fatigue)</p>
        </div>

        <div class="rule-card">
          <h3>♻️ Recyclage</h3>
          <p>Quand votre main est vide, mélangez votre défausse et elle devient votre nouvelle main.</p>
          <p>Plus vous avez pris le vent, plus votre main sera faible!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  createGameState, 
  startTurn,
  getGameStatus,
  selectRider,
  deselectRider,
  selectCard,
  deselectCard,
  rollDice,
  selectSpecialty,
  resolveMovement,
  RiderConfig,
  TerrainConfig,
  TeamConfig
} from '../core/game_engine.js';
import { getHandStats } from '../core/rider.js';

export default {
  name: 'GameBoard',
  
  data() {
    return {
      gameState: null,
      RiderConfig,
      TerrainConfig,
      TeamConfig
    };
  },
  
  computed: {
    gameStatus() {
      if (!this.gameState) return {};
      return getGameStatus(this.gameState);
    },
    
    course() {
      return this.gameState?.course || [];
    },
    
    finishLine() {
      return this.gameState?.finishLine || 80;
    },
    
    gameLog() {
      return this.gameState?.gameLog || [];
    },
    
    phaseLabel() {
      const phases = {
        'select_rider': '👆 Choisir un coureur',
        'select_card': '🃏 Choisir une carte',
        'roll_dice': '🎲 Lancer le dé',
        'select_specialty': '★ Spécialité?',
        'resolve': '✓ Résoudre'
      };
      return phases[this.gameStatus.turnPhase] || this.gameStatus.turnPhase;
    },
    
    phaseTooltip() {
      const tooltips = {
        'select_rider': 'Cliquez sur un coureur de votre équipe pour le jouer ce tour',
        'select_card': 'Choisissez une carte mouvement (+2 à +5) ou attaque (+6)',
        'roll_dice': 'Lancez le dé pour déterminer votre mouvement de base',
        'select_specialty': 'Vous pouvez utiliser une carte spécialité (+2) sur votre terrain favori',
        'resolve': 'Appliquez le mouvement et passez au joueur suivant'
      };
      return tooltips[this.gameStatus.turnPhase] || '';
    }
  },
  
  mounted() {
    this.initGame();
  },
  
  watch: {
    gameLog: {
      handler() {
        this.$nextTick(() => {
          const container = this.$refs.logContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      },
      deep: true
    }
  },
  
  methods: {
    initGame() {
      this.gameState = createGameState({ courseLength: 80 });
      this.gameState = startTurn(this.gameState);
    },
    
    restartGame() {
      this.initGame();
    },
    
    // Rider helpers
    getRiderEmoji(type) {
      return RiderConfig[type]?.emoji || '🚴';
    },
    
    getTeamRiders(team) {
      return this.gameState?.riders.filter(r => r.team === team) || [];
    },
    
    getRidersAtPosition(position) {
      return this.gameState?.riders.filter(r => r.position === position && !r.hasFinished) || [];
    },
    
    getFinishedRiders() {
      return this.gameState?.riders
        .filter(r => r.hasFinished)
        .sort((a, b) => b.position - a.position) || [];
    },
    
    hasSelectedRiderAtPosition(position) {
      const rider = this.gameStatus.currentRider;
      return rider && rider.position === position;
    },
    
    hasRiderPlayed(rider) {
      return this.gameState?.ridersPlayedThisTurn?.includes(rider.id);
    },
    
    isRiderClickable(rider) {
      return rider.team === this.gameStatus.currentTeam &&
             !this.hasRiderPlayed(rider) &&
             !rider.hasFinished &&
             (this.gameStatus.turnPhase === 'select_rider' || this.gameStatus.turnPhase === 'select_card');
    },
    
    // Card helpers
    canSelectCard(rider, card) {
      return rider.id === this.gameStatus.selectedRiderId &&
             this.gameStatus.turnPhase === 'select_card';
    },
    
    canSelectSpecialty(rider, card) {
      return rider.id === this.gameStatus.selectedRiderId &&
             this.gameStatus.turnPhase === 'select_specialty' &&
             this.gameStatus.currentRider?.availableCards?.canUseSpecialty;
    },
    
    getSelectedCardValue() {
      const rider = this.gameStatus.currentRider;
      if (!rider || !this.gameStatus.selectedCardId) return 0;
      
      const card = rider.hand.find(c => c.id === this.gameStatus.selectedCardId) ||
                   rider.attackCards.find(c => c.id === this.gameStatus.selectedCardId);
      return card?.value || 0;
    },
    
    getDiscardAverage(rider) {
      if (!rider.discard || rider.discard.length === 0) return '0';
      const sum = rider.discard.reduce((a, c) => a + c.value, 0);
      return (sum / rider.discard.length).toFixed(1);
    },
    
    // Tooltips
    getRiderBoardTooltip(rider) {
      const stats = getHandStats(rider);
      return `${rider.name}\n` +
             `Type: ${RiderConfig[rider.type]?.name}\n` +
             `Position: ${rider.position + 1}\n` +
             `Main: ${stats.handSize} cartes (moy: ${stats.handAverage})\n` +
             `Attaques: ${stats.attacksRemaining}/2\n` +
             `Spécialités: ${stats.specialtiesRemaining}/2`;
    },
    
    getCardTooltip(card) {
      if (card.type === 'fatigue') {
        return `Fatigue: +${card.value} case seulement (pollue la main)`;
      }
      return `${card.name}: +${card.value} cases`;
    },
    
    getSpecialtyTooltip(rider, card) {
      const terrain = RiderConfig[rider.type]?.specialtyTerrain;
      const terrainName = terrain === 'all' ? 'tous terrains' : TerrainConfig[terrain]?.name;
      return `Spécialité: +2 cases sur ${terrainName}`;
    },
    
    getDiscardTooltip(rider) {
      const cards = rider.discard.map(c => `+${c.value}`).join(', ');
      return `Défausse: ${cards}`;
    },
    
    getCellTooltip(cell, index) {
      const config = TerrainConfig[cell.terrain];
      const riders = this.getRidersAtPosition(index);
      let tooltip = `Case ${index + 1}: ${config?.name}\n`;
      
      if (cell.terrain === 'flat') tooltip += 'Rouleur +1';
      else if (cell.terrain === 'hill') tooltip += 'Grimpeur/Puncheur +1, Sprinteur -1';
      else if (cell.terrain === 'mountain') tooltip += 'Grimpeur +2, Rouleur -1, Sprinteur -2\nPas d\'aspiration';
      else if (cell.terrain === 'descent') tooltip += 'Tous +2/+3, min 4 cases\nRisque chute sur 1';
      else if (cell.terrain === 'sprint') tooltip += 'Sprinteur +2, Grimpeur -1';
      
      if (riders.length > 0) {
        tooltip += `\n\nCoureurs: ${riders.map(r => r.name).join(', ')}`;
      }
      
      return tooltip;
    },
    
    // Actions
    onRiderBlockClick(rider) {
      if (!this.isRiderClickable(rider)) return;
      
      if (this.gameStatus.turnPhase === 'select_rider') {
        this.gameState = selectRider(this.gameState, rider.id);
      } else if (this.gameStatus.turnPhase === 'select_card' && rider.id !== this.gameStatus.selectedRiderId) {
        // Switch to different rider
        this.gameState = deselectRider(this.gameState);
        this.gameState = selectRider(this.gameState, rider.id);
      }
    },
    
    onCardClick(rider, card) {
      if (!this.canSelectCard(rider, card)) return;
      this.gameState = selectCard(this.gameState, card.id);
    },
    
    onSpecialtyClick(rider, card) {
      if (!this.canSelectSpecialty(rider, card)) return;
      this.gameState = selectSpecialty(this.gameState, card.id);
    },
    
    cancelRiderSelection() {
      this.gameState = deselectRider(this.gameState);
    },
    
    cancelCardSelection() {
      this.gameState = deselectCard(this.gameState);
    },
    
    onRollDice() {
      this.gameState = rollDice(this.gameState);
    },
    
    useSpecialty() {
      const specialty = this.gameStatus.currentRider?.specialtyCards?.[0];
      if (specialty) {
        this.gameState = selectSpecialty(this.gameState, specialty.id);
      }
    },
    
    skipSpecialty() {
      this.gameState = selectSpecialty(this.gameState, null);
    },
    
    onResolve() {
      this.gameState = resolveMovement(this.gameState);
    },
    
    // Display helpers
    formatBonus(value) {
      if (value > 0) return `+${value}`;
      if (value < 0) return `${value}`;
      return '±0';
    },
    
    getMedal(index) {
      if (index === 0) return '🥇';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
      return `${index + 1}.`;
    },
    
    getTeamColor(team) {
      return TeamConfig[team]?.color || '#666';
    },
    
    getLogClass(entry) {
      if (entry.includes('═══')) return 'last-turn-header';
      if (entry.includes('───')) return 'turn-separator';
      if (entry.includes('🏁')) return 'finish';
      if (entry.includes('💥') || entry.includes('CHUTE')) return 'fall';
      if (entry.includes('⚔️') || entry.includes('Attaque')) return 'attack';
      if (entry.includes('💨')) return 'wind';
      if (entry.includes('🏆')) return 'winner';
      return '';
    }
  }
};
</script>

<style scoped>
.game-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

/* Status Bar */
.status-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 3px solid #e2e8f0;
  flex-wrap: wrap;
}

.status-bar.last-turn {
  background: #fef3c7;
  border-color: #f59e0b;
}

.turn {
  font-weight: bold;
  font-size: 1.1em;
}

.last-turn-badge {
  background: #f59e0b;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.current-player {
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: bold;
}

.phase {
  color: #64748b;
  cursor: help;
}

.winner {
  margin-left: auto;
  font-weight: bold;
  font-size: 1.2em;
}

/* Course Board */
.board-container {
  overflow-x: auto;
  margin-bottom: 20px;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 8px;
}

.course {
  display: flex;
  gap: 2px;
  min-width: max-content;
  padding: 10px 0;
}

.cell {
  width: 40px;
  min-height: 60px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px;
  position: relative;
  transition: all 0.2s;
}

.cell.flat { background: #90EE90; }
.cell.hill { background: #FFD700; }
.cell.mountain { background: #CD853F; }
.cell.descent { background: #87CEEB; }
.cell.sprint { background: #FF69B4; }

.cell.finish {
  border: 3px solid #000;
  border-style: dashed;
}

.cell.has-selected {
  box-shadow: 0 0 0 3px #f59e0b;
  transform: scale(1.1);
  z-index: 10;
}

.cell-number {
  font-size: 9px;
  color: rgba(0,0,0,0.5);
}

.riders-on-cell {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1px;
}

.rider-token {
  font-size: 14px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  cursor: help;
  transition: all 0.2s;
}

.rider-token.team_a { border: 2px solid #dc2626; }
.rider-token.team_b { border: 2px solid #2563eb; }

.rider-token.selected {
  box-shadow: 0 0 0 3px #f59e0b;
  transform: scale(1.2);
  z-index: 20;
}

.finish-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 15px;
  background: linear-gradient(to right, #f0f0f0, white);
  border-left: 3px dashed black;
  min-width: 60px;
}

.finish-flag {
  font-size: 24px;
}

.finished-riders {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 5px;
}

/* Team Legend */
.team-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-info {
  color: #64748b;
  font-size: 0.9em;
}

/* Game Panel */
.game-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

/* Teams Cards Overview */
.teams-cards-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.team-cards-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 2px solid #e2e8f0;
}

.team-cards-section.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.team-cards-section h3 {
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.active-indicator {
  font-size: 0.8em;
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
}

.riders-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rider-card-block {
  background: white;
  border-radius: 8px;
  padding: 10px;
  border: 2px solid #e2e8f0;
  transition: all 0.2s;
}

.rider-card-block.available {
  cursor: pointer;
  border-color: #10b981;
}

.rider-card-block.available:hover {
  background: #ecfdf5;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.rider-card-block.selected {
  border-color: #f59e0b;
  background: #fef3c7;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
}

.rider-card-block.played {
  opacity: 0.6;
  background: #f1f5f9;
}

.rider-header-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.rider-header-mini .emoji {
  font-size: 1.2em;
}

.rider-header-mini .name {
  font-weight: 600;
  flex: 1;
}

.rider-header-mini .position {
  color: #64748b;
  font-size: 0.85em;
}

.badge-finished {
  background: #10b981;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75em;
}

.badge-played {
  background: #94a3b8;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75em;
}

/* Cards Row */
.cards-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cards-group {
  display: flex;
  gap: 3px;
  align-items: center;
}

.mini-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.75em;
  font-weight: bold;
  border: 1px solid rgba(0,0,0,0.2);
  cursor: help;
  transition: all 0.15s;
}

.mini-card.selectable {
  cursor: pointer;
  border-color: #10b981;
}

.mini-card.selectable:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.mini-card.selected {
  transform: scale(1.15);
  box-shadow: 0 0 0 2px #f59e0b;
}

.mini-card.fatigue {
  background: #6b7280 !important;
  color: white;
}

.mini-card.attack {
  background: #dc2626;
  color: white;
}

.mini-card.specialty {
  background: #8b5cf6;
  color: white;
}

.empty-hand {
  color: #94a3b8;
  font-style: italic;
}

.discard-info {
  margin-top: 6px;
  font-size: 0.75em;
  color: #64748b;
  cursor: help;
}

/* Action Panel */
.action-panel {
  max-width: 500px;
  margin: 0 auto;
}

.current-rider-info {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border: 3px solid #e2e8f0;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.rider-emoji {
  font-size: 1.5em;
}

.rider-name {
  font-weight: bold;
  flex: 1;
}

.terrain-badge {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.85em;
  background: white;
}

.terrain-badge .bonus {
  font-weight: bold;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.instruction {
  margin: 0;
  color: #64748b;
  text-align: center;
}

.selected-card-display {
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.card-value {
  font-weight: bold;
  font-size: 1.2em;
  color: #10b981;
}

.dice-result {
  background: #e0f2fe;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 1.1em;
  margin-bottom: 10px;
}

.specialty-choice {
  display: flex;
  gap: 10px;
}

.movement-summary {
  text-align: center;
  margin-bottom: 15px;
}

.total-movement {
  font-size: 1.3em;
  margin-top: 10px;
}

.total-movement strong {
  color: #10b981;
  font-size: 1.5em;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.btn.roll {
  background: #3b82f6;
  color: white;
}

.btn.resolve {
  background: #10b981;
  color: white;
}

.btn.specialty {
  background: #8b5cf6;
  color: white;
}

.btn.skip {
  background: #94a3b8;
  color: white;
}

.btn.cancel {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.9em;
}

.btn.restart {
  background: #3b82f6;
  color: white;
  margin-top: 20px;
}

.no-selection {
  text-align: center;
  padding: 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 8px;
}

/* Game Over */
.game-over-panel {
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.winning-team {
  margin: 20px 0;
}

.winner-badge {
  display: inline-block;
  padding: 15px 30px;
  border-radius: 30px;
  color: white;
  font-size: 1.5em;
  font-weight: bold;
}

.final-rankings {
  max-width: 400px;
  margin: 20px auto;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 15px;
  background: white;
  margin: 5px 0;
  border-radius: 6px;
  border-left: 4px solid #e2e8f0;
}

.ranking-row.team_a { border-left-color: #dc2626; }
.ranking-row.team_b { border-left-color: #2563eb; }

.ranking-row .rank {
  width: 30px;
  font-weight: bold;
}

.ranking-row .rider-name {
  flex: 1;
}

.ranking-row .team-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: bold;
}

.ranking-row .final-pos {
  color: #64748b;
}

/* Game Log */
.game-log {
  background: #1f2937;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 30px;
}

.game-log h3 {
  color: #9ca3af;
  margin: 0 0 10px 0;
  font-size: 0.9em;
}

.log-entries {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85em;
}

.log-entry {
  color: #d1d5db;
  padding: 3px 0;
  border-bottom: 1px solid #374151;
}

.log-entry.turn-separator {
  color: #6b7280;
  text-align: center;
  padding: 8px 0;
  border: none;
}

.log-entry.last-turn-header {
  color: #fbbf24;
  text-align: center;
  padding: 10px 0;
  font-weight: bold;
  background: rgba(251, 191, 36, 0.1);
  border: none;
}

.log-entry.finish { color: #34d399; }
.log-entry.fall { color: #f87171; }
.log-entry.attack { color: #fb923c; }
.log-entry.wind { color: #60a5fa; }
.log-entry.winner { color: #fbbf24; font-weight: bold; }

/* Rules Section */
.rules-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
}

.rules-section h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #1e293b;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.rule-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.rule-card.highlight {
  border-color: #3b82f6;
  background: #eff6ff;
}

.rule-card h3 {
  margin: 0 0 10px 0;
  color: #1e293b;
  font-size: 1em;
}

.rule-card p {
  margin: 0 0 8px 0;
  color: #475569;
  font-size: 0.9em;
  line-height: 1.5;
}

.rule-card ul {
  margin: 8px 0;
  padding-left: 20px;
  color: #475569;
  font-size: 0.9em;
}

.rule-card li {
  margin: 4px 0;
}

.card-sample {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.85em;
  margin-right: 5px;
}

/* Responsive */
@media (max-width: 900px) {
  .teams-cards-overview {
    grid-template-columns: 1fr;
  }
  
  .cell {
    width: 30px;
    min-height: 45px;
  }
  
  .rider-token {
    font-size: 12px;
    width: 16px;
    height: 16px;
  }
}
</style>
