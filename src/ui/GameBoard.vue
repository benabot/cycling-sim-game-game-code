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

    <!-- Terrain Legend -->
    <div class="terrain-legend">
      <span class="legend-title">Terrains :</span>
      <span class="terrain-item flat">🟩 Plaine 31%</span>
      <span class="terrain-item hill">🟨 Côte 19%</span>
      <span class="terrain-item mountain">🟫 Montagne 25%</span>
      <span class="terrain-item descent">🟦 Descente 15%</span>
      <span class="terrain-item sprint">🟪 Sprint 10%</span>
    </div>

    <!-- Course Board -->
    <div class="board-container">
      <div class="course">
        <!-- Start case (0) -->
        <div 
          class="cell start"
          :class="{ 'has-selected': hasSelectedRiderAtPosition(0) }"
          title="Départ (case 0)"
        >
          <span class="cell-number">🏁 0</span>
          <div class="riders-on-cell">
            <span 
              v-for="rider in getRidersAtPosition(0)" 
              :key="rider.id"
              class="rider-token"
              :class="[
                rider.type, 
                rider.team, 
                { 
                  'selected': rider.id === gameStatus.selectedRiderId,
                  'animating': isRiderAnimating(rider.id)
                }
              ]"
              :title="getRiderBoardTooltip(rider)"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
        
        <!-- Course cells (1 to finishLine) -->
        <div 
          v-for="(cell, index) in course" 
          :key="index"
          class="cell"
          :class="[
            cell.terrain, 
            { 
              'finish': index === finishLine - 1,
              'has-selected': hasSelectedRiderAtPosition(index + 1)
            }
          ]"
          :title="getCellTooltip(cell, index + 1)"
        >
          <span class="cell-number">{{ index + 1 }}</span>
          <div class="riders-on-cell">
            <span 
              v-for="rider in getRidersAtPosition(index + 1)" 
              :key="rider.id"
              class="rider-token"
              :class="[
                rider.type, 
                rider.team, 
                { 
                  'selected': rider.id === gameStatus.selectedRiderId,
                  'animating': isRiderAnimating(rider.id)
                }
              ]"
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

    <!-- End Turn Effects Overlay -->
    <div v-if="showEffectsOverlay" class="effects-overlay">
      <div class="effects-panel">
        <h3>⚡ Fin du tour {{ gameStatus.turn }}</h3>
        
        <!-- Aspiration effects -->
        <div v-if="aspirationEffects.length > 0" class="effect-group aspiration-group">
          <h4>🌀 Aspiration (regroupement)</h4>
          <div class="effect-list">
            <div 
              v-for="effect in aspirationEffects" 
              :key="effect.riderId"
              class="effect-item aspiration-effect"
            >
              <span class="effect-rider">{{ effect.riderName }}</span>
              <span class="effect-detail">case {{ effect.fromPosition }} → {{ effect.toPosition }}</span>
              <span class="effect-icon">↑</span>
            </div>
          </div>
        </div>
        
        <!-- Wind effects -->
        <div v-if="windEffects.length > 0" class="effect-group wind-group">
          <h4>💨 Prise de vent</h4>
          <div class="effect-list">
            <div 
              v-for="effect in windEffects" 
              :key="effect.riderId"
              class="effect-item wind-effect"
            >
              <span class="effect-rider">{{ effect.riderName }}</span>
              <span class="effect-card bad">+1</span>
              <span class="effect-desc">carte ajoutée</span>
            </div>
          </div>
        </div>
        
        <!-- Shelter effects -->
        <div v-if="shelterEffects.length > 0" class="effect-group shelter-group">
          <h4>🛡️ À l'abri</h4>
          <div class="effect-list">
            <div 
              v-for="effect in shelterEffects" 
              :key="effect.riderId"
              class="effect-item shelter-effect"
            >
              <span class="effect-rider">{{ effect.riderName }}</span>
              <span class="effect-card good">+2</span>
              <span class="effect-desc">carte ajoutée</span>
            </div>
          </div>
        </div>
        
        <div v-if="noEffects" class="no-effects">
          <p>Pas d'effets de fin de tour ce tour-ci.</p>
        </div>
        
        <button @click="onAcknowledgeEffects" class="btn btn-continue">
          Continuer →
        </button>
      </div>
    </div>

    <!-- Selected Rider Panel -->
    <div v-if="gameStatus.currentRider && gameStatus.phase !== 'finished' && !showEffectsOverlay" class="selected-rider-panel">
      <div class="selected-rider-header" :style="{ background: gameStatus.currentRider.teamConfig?.bgColor, borderColor: gameStatus.currentRider.teamConfig?.color }">
        <div class="rider-identity">
          <span class="rider-emoji-large">{{ getRiderEmoji(gameStatus.currentRider.type) }}</span>
          <div class="rider-details">
            <span class="rider-name">{{ gameStatus.currentRider.name }}</span>
            <span class="rider-type">{{ RiderConfig[gameStatus.currentRider.type]?.name }}</span>
          </div>
        </div>
        
        <div class="rider-stats">
          <div class="stat-item">
            <span class="stat-label">Case</span>
            <span class="stat-value">{{ gameStatus.currentRider.position }}</span>
          </div>
          <div class="stat-item terrain-stat" :class="gameStatus.currentRider.terrain">
            <span class="stat-label">Terrain</span>
            <span class="stat-value">
              {{ TerrainConfig[gameStatus.currentRider.terrain]?.emoji }}
              {{ TerrainConfig[gameStatus.currentRider.terrain]?.name }}
            </span>
          </div>
          <div class="stat-item bonus-stat" :class="{ 'positive': gameStatus.currentRider.terrainBonus > 0, 'negative': gameStatus.currentRider.terrainBonus < 0 }">
            <span class="stat-label">Bonus terrain</span>
            <span class="stat-value">{{ formatBonus(gameStatus.currentRider.terrainBonus) }}</span>
          </div>
        </div>

        <button @click="cancelRiderSelection" class="btn-change-rider" title="Changer de coureur">
          ← Changer
        </button>
      </div>

      <div class="selected-rider-cards">
        <!-- Movement Cards -->
        <div class="cards-section">
          <h4>🃏 Cartes Mouvement ({{ gameStatus.currentRider.hand?.length || 0 }})</h4>
          <div class="cards-list">
            <div 
              v-for="card in gameStatus.currentRider.hand" 
              :key="card.id"
              class="card-item"
              :class="{ 
                'selectable': gameStatus.turnPhase === 'select_card',
                'selected': card.id === gameStatus.selectedCardId,
                'wind-card': card.name === 'Prise de vent',
                'shelter-card': card.name === 'Abri'
              }"
              :style="{ background: card.color }"
              @click="onMovementCardClick(card)"
            >
              <span class="card-value">+{{ card.value }}</span>
              <span class="card-name">{{ card.name }}</span>
            </div>
            <div v-if="gameStatus.currentRider.hand?.length === 0" class="empty-cards">
              Main vide - Recyclage au prochain tour
            </div>
          </div>
        </div>

        <!-- Attack Cards -->
        <div class="cards-section attack-section">
          <h4>⚔️ Attaques ({{ gameStatus.currentRider.attackCards?.length || 0 }}/2)</h4>
          <div class="cards-list">
            <div 
              v-for="card in gameStatus.currentRider.attackCards" 
              :key="card.id"
              class="card-item attack-card"
              :class="{ 
                'selectable': gameStatus.turnPhase === 'select_card',
                'selected': card.id === gameStatus.selectedCardId
              }"
              @click="onAttackCardClick(card)"
            >
              <span class="card-value">+6</span>
              <span class="card-name">Attaque</span>
            </div>
            <div v-if="gameStatus.currentRider.attackCards?.length === 0" class="empty-cards">
              Épuisées
            </div>
          </div>
        </div>

        <!-- Specialty Cards -->
        <div class="cards-section specialty-section">
          <h4>★ Spécialités ({{ gameStatus.currentRider.specialtyCards?.length || 0 }}/2)</h4>
          <div class="cards-list">
            <div 
              v-for="card in gameStatus.currentRider.specialtyCards" 
              :key="card.id"
              class="card-item specialty-card"
              :class="{ 
                'selectable': gameStatus.turnPhase === 'select_specialty' && gameStatus.currentRider.availableCards?.canUseSpecialty,
                'selected': card.id === gameStatus.selectedSpecialtyId,
                'disabled': !gameStatus.currentRider.availableCards?.canUseSpecialty
              }"
              @click="onSpecialtyCardClick(card)"
            >
              <span class="card-value">+2</span>
              <span class="card-name">{{ getSpecialtyTerrainName(gameStatus.currentRider.type) }}</span>
            </div>
            <div v-if="gameStatus.currentRider.specialtyCards?.length === 0" class="empty-cards">
              Épuisées
            </div>
          </div>
          <div v-if="!gameStatus.currentRider.availableCards?.canUseSpecialty && gameStatus.currentRider.specialtyCards?.length > 0" class="specialty-hint">
            (Utilisable sur {{ getSpecialtyTerrainName(gameStatus.currentRider.type) }})
          </div>
        </div>

        <!-- Discard Info -->
        <div class="discard-section" v-if="gameStatus.currentRider.discard?.length > 0">
          <h4>📥 Défausse ({{ gameStatus.currentRider.discard.length }})</h4>
          <div class="discard-preview">
            <span 
              v-for="card in gameStatus.currentRider.discard" 
              :key="card.id"
              class="discard-card"
              :class="{ 'wind': card.name === 'Prise de vent' }"
            >
              +{{ card.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Zone -->
      <div class="action-zone">
        <!-- Phase: Select Card -->
        <div v-if="gameStatus.turnPhase === 'select_card'" class="action-prompt">
          <span class="prompt-icon">1️⃣</span>
          <span class="prompt-text">Choisissez une carte à jouer</span>
        </div>

        <!-- Phase: Roll Dice -->
        <div v-if="gameStatus.turnPhase === 'roll_dice'" class="action-content">
          <div class="selected-card-preview">
            <span>Carte sélectionnée :</span>
            <span class="selected-value" :class="{ 'attack': isSelectedCardAttack() }">+{{ getSelectedCardValue() }}</span>
          </div>
          <div class="action-buttons">
            <button @click="onRollDice" class="btn btn-roll">
              2️⃣ 🎲 Lancer le dé
            </button>
            <button @click="cancelCardSelection" class="btn btn-cancel">
              ← Changer de carte
            </button>
          </div>
        </div>

        <!-- Phase: Select Specialty -->
        <div v-if="gameStatus.turnPhase === 'select_specialty'" class="action-content">
          <div class="dice-result-display">
            <span class="dice-icon">🎲</span>
            <span class="dice-value">{{ gameStatus.lastDiceRoll?.result }}</span>
            <span class="plus">+</span>
            <span class="card-played">🃏 {{ getSelectedCardValue() }}</span>
            <span v-if="gameStatus.currentRider.terrainBonus !== 0" class="terrain-bonus-display">
              {{ formatBonus(gameStatus.currentRider.terrainBonus) }}
            </span>
          </div>
          <div class="specialty-prompt">
            Utiliser une carte Spécialité (+2) ?
          </div>
          <div class="action-buttons">
            <button 
              v-if="gameStatus.currentRider.specialtyCards?.length > 0"
              @click="useSpecialty" 
              class="btn btn-specialty"
            >
              ★ Utiliser (+2)
            </button>
            <button @click="skipSpecialty" class="btn btn-skip">
              Passer →
            </button>
          </div>
        </div>

        <!-- Phase: Resolve -->
        <div v-if="gameStatus.turnPhase === 'resolve'" class="action-content">
          <div class="movement-calculation">
            <div class="calc-row">
              <span class="calc-item dice">🎲 {{ gameStatus.lastDiceRoll?.result }}</span>
              <span class="calc-op">+</span>
              <span class="calc-item card">🃏 {{ getSelectedCardValue() }}</span>
              <span v-if="gameStatus.currentRider.terrainBonus !== 0" class="calc-op">{{ gameStatus.currentRider.terrainBonus > 0 ? '+' : '' }}</span>
              <span v-if="gameStatus.currentRider.terrainBonus !== 0" class="calc-item terrain">{{ gameStatus.currentRider.terrainBonus }}</span>
              <span v-if="gameStatus.selectedSpecialtyId" class="calc-op">+</span>
              <span v-if="gameStatus.selectedSpecialtyId" class="calc-item specialty">★2</span>
              <span class="calc-op">=</span>
              <span class="calc-result">{{ gameStatus.calculatedMovement }}</span>
            </div>
          </div>
          <button @click="onResolve" class="btn btn-resolve">
            ✓ Avancer de {{ gameStatus.calculatedMovement }} cases (→ case {{ gameStatus.currentRider.position + gameStatus.calculatedMovement }})
          </button>
        </div>
      </div>
    </div>

    <!-- No rider selected prompt -->
    <div v-else-if="gameStatus.phase !== 'finished' && !showEffectsOverlay" class="no-selection-prompt">
      <span class="prompt-icon">👆</span>
      <span>Cliquez sur un coureur de <strong>{{ gameStatus.currentTeamConfig?.name }}</strong> pour le jouer</span>
    </div>

    <!-- Team Legend -->
    <div class="team-legend" v-if="!showEffectsOverlay">
      <div class="team-item">
        <span class="team-color" style="background: #dc2626"></span>
        Équipe Rouge (Joueur 1)
      </div>
      <div class="team-item">
        <span class="team-color" style="background: #2563eb"></span>
        Équipe Bleue (Joueur 2)
      </div>
    </div>

    <!-- Teams Cards Overview -->
    <div v-if="gameStatus.phase !== 'finished' && !showEffectsOverlay" class="teams-overview">
      <div 
        v-for="team in ['team_a', 'team_b']" 
        :key="team"
        class="team-section"
        :class="{ 'active': gameStatus.currentTeam === team }"
      >
        <h3 :style="{ color: TeamConfig[team].color }">
          {{ TeamConfig[team].name }}
          <span v-if="gameStatus.currentTeam === team" class="active-badge">← Joue</span>
        </h3>
        
        <div class="riders-list">
          <div 
            v-for="rider in getTeamRiders(team)" 
            :key="rider.id"
            class="rider-row"
            :class="{ 
              'selected': rider.id === gameStatus.selectedRiderId,
              'played': hasRiderPlayed(rider),
              'clickable': isRiderClickable(rider)
            }"
            @click="onRiderRowClick(rider)"
          >
            <span class="rider-emoji">{{ getRiderEmoji(rider.type) }}</span>
            <span class="rider-name">{{ rider.name }}</span>
            <span class="rider-pos">Case {{ rider.position }}</span>
            
            <div class="rider-cards-mini">
              <span class="hand-count" :title="'Main: ' + rider.hand.length + ' cartes'">
                🃏{{ rider.hand.length }}
              </span>
              <span class="attack-count" :title="'Attaques: ' + rider.attackCards.length">
                ⚔️{{ rider.attackCards.length }}
              </span>
              <span class="specialty-count" :title="'Spécialités: ' + rider.specialtyCards.length">
                ★{{ rider.specialtyCards.length }}
              </span>
            </div>

            <span v-if="rider.hasFinished" class="status-badge finished">🏁</span>
            <span v-else-if="hasRiderPlayed(rider)" class="status-badge played">✓</span>
          </div>
        </div>
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
          <span class="final-pos">Case {{ rider.position }}</span>
        </div>
      </div>
      <button @click="restartGame" class="btn btn-restart">🔄 Nouvelle partie</button>
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
          <p>Franchir la ligne d'arrivée en premier. Départ à la case 0.</p>
        </div>

        <div class="rule-card">
          <h3>🎮 Séquence</h3>
          <ol>
            <li>Choisir un coureur</li>
            <li><strong>Jouer une carte</strong></li>
            <li>Lancer le dé</li>
            <li>(Optionnel) Spécialité</li>
            <li>Avancer</li>
          </ol>
        </div>

        <div class="rule-card highlight">
          <h3>🌀 Aspiration</h3>
          <p>Fin de tour: les coureurs à 1 case d'écart rejoignent automatiquement le groupe devant.</p>
        </div>

        <div class="rule-card highlight">
          <h3>💨 Prise de vent</h3>
          <p>À partir du tour 2: les coureurs en tête ou isolés (2+ cases d'écart) reçoivent une carte <strong>+1</strong>.</p>
        </div>

        <div class="rule-card highlight">
          <h3>🛡️ À l'abri</h3>
          <p>Les coureurs dans l'aspiration (groupe ou &lt;2 cases) reçoivent une carte <strong>+2</strong>.</p>
        </div>

        <div class="rule-card">
          <h3>⛰️ Exceptions</h3>
          <p>Pas d'aspiration ni de prise de vent en <strong>montagne</strong> et <strong>descente</strong>.</p>
        </div>

        <div class="rule-card highlight">
          <h3>🃏 Cartes Mouvement</h3>
          <p>+2, +3, +3, +4, +4, +5 (6 cartes initiales)</p>
          <p>+ cartes bonus (+2) et vent (+1) en cours de partie</p>
        </div>

        <div class="rule-card">
          <h3>♻️ Recyclage</h3>
          <p>Main vide → mélanger la défausse = nouvelle main.</p>
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
  acknowledgeEndTurnEffects,
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
      TeamConfig,
      animatingRiders: []
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
    
    showEffectsOverlay() {
      return this.gameStatus.turnPhase === 'end_turn_effects';
    },
    
    aspirationEffects() {
      return (this.gameStatus.endTurnEffects || []).filter(e => e.type === 'aspiration');
    },
    
    windEffects() {
      return (this.gameStatus.endTurnEffects || []).filter(e => e.type === 'wind');
    },
    
    shelterEffects() {
      return (this.gameStatus.endTurnEffects || []).filter(e => e.type === 'shelter');
    },
    
    noEffects() {
      return this.aspirationEffects.length === 0 && 
             this.windEffects.length === 0 && 
             this.shelterEffects.length === 0;
    },
    
    phaseLabel() {
      const phases = {
        'select_rider': '👆 Choisir coureur',
        'select_card': '1️⃣ Choisir carte',
        'roll_dice': '2️⃣ Lancer dé',
        'select_specialty': '★ Spécialité?',
        'resolve': '✓ Résoudre',
        'end_turn_effects': '⚡ Fin de tour'
      };
      return phases[this.gameStatus.turnPhase] || this.gameStatus.turnPhase;
    },
    
    phaseTooltip() {
      const tooltips = {
        'select_rider': 'Cliquez sur un coureur de votre équipe',
        'select_card': 'Choisissez une carte mouvement ou attaque',
        'roll_dice': 'Lancez le dé',
        'select_specialty': 'Utilisez une carte spécialité (+2) si disponible',
        'resolve': 'Appliquez le mouvement',
        'end_turn_effects': 'Aspiration et distribution des cartes de vent/abri'
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
    },
    
    'gameStatus.endTurnEffects': {
      handler(effects) {
        if (effects && effects.length > 0) {
          const aspirationIds = effects
            .filter(e => e.type === 'aspiration')
            .map(e => e.riderId);
          
          this.animatingRiders = aspirationIds;
          
          setTimeout(() => {
            this.animatingRiders = [];
          }, 1000);
        }
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
    
    isRiderAnimating(riderId) {
      return this.animatingRiders.includes(riderId);
    },
    
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
    
    getSpecialtyTerrainName(riderType) {
      const terrain = RiderConfig[riderType]?.specialtyTerrain;
      if (terrain === 'all') return 'Tous terrains';
      return TerrainConfig[terrain]?.name || terrain;
    },
    
    getSelectedCardValue() {
      const rider = this.gameStatus.currentRider;
      if (!rider || !this.gameStatus.selectedCardId) return 0;
      
      const card = rider.hand.find(c => c.id === this.gameStatus.selectedCardId) ||
                   rider.attackCards.find(c => c.id === this.gameStatus.selectedCardId);
      return card?.value || 0;
    },
    
    isSelectedCardAttack() {
      const rider = this.gameStatus.currentRider;
      if (!rider || !this.gameStatus.selectedCardId) return false;
      return rider.attackCards.some(c => c.id === this.gameStatus.selectedCardId);
    },
    
    getRiderBoardTooltip(rider) {
      const stats = getHandStats(rider);
      return rider.name + '\nCase: ' + rider.position + '\nMain: ' + stats.handSize + ' cartes\nAttaques: ' + stats.attacksRemaining + '/2';
    },
    
    getCellTooltip(cell, position) {
      const config = TerrainConfig[cell.terrain];
      const riders = this.getRidersAtPosition(position);
      let tooltip = 'Case ' + position + ': ' + config?.name;
      
      if (riders.length > 0) {
        tooltip += '\n' + riders.map(r => r.name).join(', ');
      }
      
      return tooltip;
    },
    
    onRiderRowClick(rider) {
      if (!this.isRiderClickable(rider)) return;
      
      if (this.gameStatus.turnPhase === 'select_rider') {
        this.gameState = selectRider(this.gameState, rider.id);
      } else if (this.gameStatus.turnPhase === 'select_card' && rider.id !== this.gameStatus.selectedRiderId) {
        this.gameState = deselectRider(this.gameState);
        this.gameState = selectRider(this.gameState, rider.id);
      }
    },
    
    onMovementCardClick(card) {
      if (this.gameStatus.turnPhase !== 'select_card') return;
      this.gameState = selectCard(this.gameState, card.id);
    },
    
    onAttackCardClick(card) {
      if (this.gameStatus.turnPhase !== 'select_card') return;
      this.gameState = selectCard(this.gameState, card.id);
    },
    
    onSpecialtyCardClick(card) {
      if (this.gameStatus.turnPhase !== 'select_specialty') return;
      if (!this.gameStatus.currentRider?.availableCards?.canUseSpecialty) return;
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
    
    onAcknowledgeEffects() {
      this.gameState = acknowledgeEndTurnEffects(this.gameState);
    },
    
    formatBonus(value) {
      if (value > 0) return '+' + value;
      if (value < 0) return '' + value;
      return '±0';
    },
    
    getMedal(index) {
      if (index === 0) return '🥇';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
      return (index + 1) + '.';
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
      if (entry.includes('🛡️')) return 'shelter';
      if (entry.includes('🌀')) return 'aspiration';
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

h1 { text-align: center; margin-bottom: 20px; }

.status-bar {
  display: flex; align-items: center; gap: 15px;
  padding: 12px 20px; background: #f8fafc;
  border-radius: 8px; margin-bottom: 15px;
  border: 3px solid #e2e8f0; flex-wrap: wrap;
}

.status-bar.last-turn { background: #fef3c7; border-color: #f59e0b; }
.turn { font-weight: bold; font-size: 1.1em; }
.last-turn-badge { background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.current-player { color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
.phase { color: #64748b; }
.winner { margin-left: auto; font-weight: bold; font-size: 1.2em; }

.terrain-legend { display: flex; align-items: center; gap: 15px; padding: 10px 15px; background: #1e293b; border-radius: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.legend-title { color: #94a3b8; font-weight: 600; }
.terrain-item { font-size: 0.85em; padding: 4px 10px; border-radius: 4px; color: #1e293b; font-weight: 500; }
.terrain-item.flat { background: #90EE90; }
.terrain-item.hill { background: #FFD700; }
.terrain-item.mountain { background: #CD853F; color: white; }
.terrain-item.descent { background: #87CEEB; }
.terrain-item.sprint { background: #FF69B4; color: white; }

.board-container { overflow-x: auto; margin-bottom: 15px; padding: 10px; background: #f1f5f9; border-radius: 8px; }
.course { display: flex; gap: 2px; min-width: max-content; padding: 10px 0; }
.cell { width: 40px; min-height: 60px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; padding: 2px; position: relative; transition: all 0.2s; }
.cell.start { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px dashed #f59e0b; }
.cell.flat { background: #90EE90; }
.cell.hill { background: #FFD700; }
.cell.mountain { background: #CD853F; }
.cell.descent { background: #87CEEB; }
.cell.sprint { background: #FF69B4; }
.cell.finish { border: 3px solid #000; border-style: dashed; }
.cell.has-selected { box-shadow: 0 0 0 3px #f59e0b; transform: scale(1.1); z-index: 10; }
.cell-number { font-size: 9px; color: rgba(0,0,0,0.5); }
.riders-on-cell { display: flex; flex-wrap: wrap; justify-content: center; gap: 1px; }
.rider-token { font-size: 14px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: white; cursor: help; transition: all 0.3s ease; }
.rider-token.team_a { border: 2px solid #dc2626; }
.rider-token.team_b { border: 2px solid #2563eb; }
.rider-token.selected { box-shadow: 0 0 0 3px #f59e0b; transform: scale(1.2); z-index: 20; }
.rider-token.animating { animation: aspirationMove 0.5s ease-out; }
@keyframes aspirationMove { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.7); } 50% { transform: scale(1.3); box-shadow: 0 0 0 10px rgba(96, 165, 250, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); } }
.finish-zone { display: flex; flex-direction: column; align-items: center; padding: 5px 15px; background: linear-gradient(to right, #f0f0f0, white); border-left: 3px dashed black; min-width: 60px; }
.finish-flag { font-size: 24px; }
.finished-riders { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 5px; }

.effects-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.effects-panel { background: white; border-radius: 16px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.effects-panel h3 { text-align: center; margin: 0 0 20px 0; color: #1e293b; }
.effect-group { margin-bottom: 20px; padding: 15px; border-radius: 10px; }
.aspiration-group { background: #dbeafe; border: 2px solid #3b82f6; }
.wind-group { background: #fef3c7; border: 2px solid #f59e0b; }
.shelter-group { background: #dcfce7; border: 2px solid #22c55e; }
.effect-group h4 { margin: 0 0 10px 0; font-size: 1em; }
.effect-list { display: flex; flex-direction: column; gap: 8px; }
.effect-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: white; border-radius: 6px; animation: effectAppear 0.4s ease; }
@keyframes effectAppear { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
.effect-rider { font-weight: 600; flex: 1; }
.effect-detail { color: #64748b; font-size: 0.9em; }
.effect-icon { font-size: 1.2em; color: #3b82f6; }
.effect-card { padding: 4px 10px; border-radius: 4px; font-weight: bold; }
.effect-card.bad { background: #fecaca; color: #dc2626; }
.effect-card.good { background: #bbf7d0; color: #16a34a; }
.effect-desc { color: #64748b; font-size: 0.85em; }
.no-effects { text-align: center; color: #64748b; padding: 20px; }
.btn-continue { display: block; width: 100%; padding: 15px; margin-top: 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 1.1em; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-continue:hover { background: #2563eb; transform: translateY(-2px); }

.selected-rider-panel { background: white; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.selected-rider-header { display: flex; align-items: center; gap: 20px; padding: 15px 20px; border-bottom: 3px solid; flex-wrap: wrap; }
.rider-identity { display: flex; align-items: center; gap: 12px; }
.rider-emoji-large { font-size: 2.5em; }
.rider-details { display: flex; flex-direction: column; }
.rider-details .rider-name { font-size: 1.3em; font-weight: bold; }
.rider-details .rider-type { color: #64748b; font-size: 0.9em; }
.rider-stats { display: flex; gap: 20px; flex: 1; justify-content: center; }
.stat-item { display: flex; flex-direction: column; align-items: center; padding: 8px 15px; background: white; border-radius: 8px; }
.stat-label { font-size: 0.75em; color: #64748b; text-transform: uppercase; }
.stat-value { font-size: 1.1em; font-weight: bold; }
.bonus-stat.positive .stat-value { color: #10b981; }
.bonus-stat.negative .stat-value { color: #ef4444; }
.terrain-stat.flat { background: #dcfce7; }
.terrain-stat.hill { background: #fef9c3; }
.terrain-stat.mountain { background: #fed7aa; }
.terrain-stat.descent { background: #dbeafe; }
.terrain-stat.sprint { background: #fce7f3; }
.btn-change-rider { padding: 8px 15px; background: #f1f5f9; border: none; border-radius: 6px; cursor: pointer; color: #64748b; font-size: 0.9em; }
.btn-change-rider:hover { background: #e2e8f0; }

.selected-rider-cards { display: flex; gap: 20px; padding: 20px; background: #f8fafc; flex-wrap: wrap; }
.cards-section { flex: 1; min-width: 150px; }
.cards-section h4 { margin: 0 0 10px 0; font-size: 0.9em; color: #475569; }
.cards-list { display: flex; gap: 8px; flex-wrap: wrap; }
.card-item { display: flex; flex-direction: column; align-items: center; padding: 10px 15px; border-radius: 8px; border: 2px solid rgba(0,0,0,0.1); min-width: 60px; cursor: default; transition: all 0.2s; }
.card-item .card-value { font-size: 1.3em; font-weight: bold; }
.card-item .card-name { font-size: 0.7em; color: rgba(0,0,0,0.6); }
.card-item.selectable { cursor: pointer; border-color: #10b981; }
.card-item.selectable:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.card-item.selected { transform: translateY(-4px); box-shadow: 0 0 0 3px #f59e0b, 0 4px 12px rgba(0,0,0,0.2); }
.card-item.wind-card { background: #94a3b8 !important; color: white; }
.card-item.wind-card .card-name { color: rgba(255,255,255,0.8); }
.card-item.shelter-card { background: #86efac !important; }
.attack-card { background: #dc2626; color: white; }
.attack-card .card-name { color: rgba(255,255,255,0.8); }
.specialty-card { background: #8b5cf6; color: white; }
.specialty-card .card-name { color: rgba(255,255,255,0.8); }
.specialty-card.disabled { opacity: 0.5; }
.empty-cards { color: #94a3b8; font-style: italic; font-size: 0.85em; padding: 10px; }
.specialty-hint { font-size: 0.75em; color: #94a3b8; margin-top: 5px; }
.discard-section { min-width: 100px; }
.discard-section h4 { margin: 0 0 8px 0; font-size: 0.85em; color: #64748b; }
.discard-preview { display: flex; gap: 4px; flex-wrap: wrap; }
.discard-card { font-size: 0.75em; padding: 3px 6px; background: #e2e8f0; border-radius: 3px; }
.discard-card.wind { background: #94a3b8; color: white; }

.action-zone { padding: 20px; background: white; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 15px; }
.action-prompt { display: flex; align-items: center; gap: 10px; color: #64748b; font-size: 1.1em; }
.prompt-icon { font-size: 1.5em; }
.action-content { display: flex; flex-direction: column; align-items: center; gap: 15px; }
.selected-card-preview { display: flex; align-items: center; gap: 10px; padding: 10px 20px; background: #f1f5f9; border-radius: 8px; }
.selected-value { font-size: 1.5em; font-weight: bold; color: #10b981; }
.selected-value.attack { color: #dc2626; }
.action-buttons { display: flex; gap: 10px; }
.dice-result-display { display: flex; align-items: center; gap: 10px; font-size: 1.3em; padding: 10px 20px; background: #e0f2fe; border-radius: 8px; }
.dice-icon { font-size: 1.5em; }
.dice-value { font-weight: bold; font-size: 1.3em; color: #0369a1; }
.plus { color: #64748b; }
.card-played { color: #10b981; font-weight: bold; }
.terrain-bonus-display { color: #64748b; }
.specialty-prompt { color: #64748b; }
.movement-calculation { background: #f0fdf4; padding: 15px 25px; border-radius: 8px; }
.calc-row { display: flex; align-items: center; gap: 8px; font-size: 1.2em; }
.calc-item { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
.calc-item.dice { background: #dbeafe; color: #1d4ed8; }
.calc-item.card { background: #dcfce7; color: #15803d; }
.calc-item.terrain { background: #fef3c7; color: #b45309; }
.calc-item.specialty { background: #f3e8ff; color: #7c3aed; }
.calc-op { color: #64748b; }
.calc-result { font-size: 1.5em; font-weight: bold; color: #10b981; padding: 5px 15px; background: #dcfce7; border-radius: 6px; }

.btn { padding: 12px 24px; border-radius: 8px; border: none; font-size: 1em; cursor: pointer; transition: all 0.2s; font-weight: 600; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.btn-roll { background: #3b82f6; color: white; font-size: 1.1em; }
.btn-resolve { background: #10b981; color: white; font-size: 1.1em; }
.btn-specialty { background: #8b5cf6; color: white; }
.btn-skip { background: #94a3b8; color: white; }
.btn-cancel { background: #f1f5f9; color: #64748b; }
.btn-restart { background: #3b82f6; color: white; margin-top: 20px; }

.no-selection-prompt { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 30px; background: #f8fafc; border-radius: 12px; margin-bottom: 20px; color: #64748b; font-size: 1.1em; }
.team-legend { display: flex; gap: 30px; justify-content: center; margin-bottom: 15px; }
.team-item { display: flex; align-items: center; gap: 8px; }
.team-color { width: 20px; height: 20px; border-radius: 4px; }

.teams-overview { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.team-section { background: #f8fafc; border-radius: 8px; padding: 15px; border: 2px solid #e2e8f0; }
.team-section.active { border-color: #3b82f6; background: #eff6ff; }
.team-section h3 { margin: 0 0 12px 0; display: flex; align-items: center; gap: 10px; }
.active-badge { font-size: 0.7em; background: #3b82f6; color: white; padding: 3px 8px; border-radius: 10px; }
.riders-list { display: flex; flex-direction: column; gap: 6px; }
.rider-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: white; border-radius: 6px; border: 2px solid transparent; transition: all 0.15s; }
.rider-row.clickable { cursor: pointer; border-color: #10b981; }
.rider-row.clickable:hover { background: #ecfdf5; }
.rider-row.selected { border-color: #f59e0b; background: #fef3c7; }
.rider-row.played { opacity: 0.6; background: #f1f5f9; }
.rider-row .rider-emoji { font-size: 1.2em; }
.rider-row .rider-name { flex: 1; font-weight: 500; }
.rider-row .rider-pos { color: #64748b; font-size: 0.85em; }
.rider-cards-mini { display: flex; gap: 8px; font-size: 0.8em; color: #64748b; }
.status-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.75em; }
.status-badge.finished { background: #10b981; color: white; }
.status-badge.played { background: #94a3b8; color: white; }

.game-over-panel { text-align: center; background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px; }
.winning-team { margin: 20px 0; }
.winner-badge { display: inline-block; padding: 15px 30px; border-radius: 30px; color: white; font-size: 1.5em; font-weight: bold; }
.final-rankings { max-width: 400px; margin: 20px auto; }
.ranking-row { display: flex; align-items: center; gap: 10px; padding: 8px 15px; background: white; margin: 5px 0; border-radius: 6px; border-left: 4px solid #e2e8f0; }
.ranking-row.team_a { border-left-color: #dc2626; }
.ranking-row.team_b { border-left-color: #2563eb; }
.ranking-row .rank { width: 30px; font-weight: bold; }
.ranking-row .rider-name { flex: 1; }
.ranking-row .team-badge { width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8em; font-weight: bold; }
.ranking-row .final-pos { color: #64748b; }

.game-log { background: #1f2937; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
.game-log h3 { color: #9ca3af; margin: 0 0 10px 0; font-size: 0.9em; }
.log-entries { max-height: 200px; overflow-y: auto; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.8em; }
.log-entry { color: #d1d5db; padding: 2px 0; border-bottom: 1px solid #374151; }
.log-entry.turn-separator { color: #6b7280; text-align: center; padding: 6px 0; border: none; }
.log-entry.last-turn-header { color: #fbbf24; text-align: center; padding: 8px 0; font-weight: bold; background: rgba(251, 191, 36, 0.1); border: none; }
.log-entry.finish { color: #34d399; }
.log-entry.fall { color: #f87171; }
.log-entry.attack { color: #fb923c; }
.log-entry.wind { color: #fbbf24; }
.log-entry.shelter { color: #4ade80; }
.log-entry.aspiration { color: #60a5fa; }
.log-entry.winner { color: #fbbf24; font-weight: bold; }

.rules-section { background: #f8fafc; border-radius: 12px; padding: 25px; margin-top: 30px; }
.rules-section h2 { text-align: center; margin-bottom: 20px; color: #1e293b; }
.rules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.rule-card { background: white; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; }
.rule-card.highlight { border-color: #3b82f6; background: #eff6ff; }
.rule-card h3 { margin: 0 0 8px 0; font-size: 0.95em; }
.rule-card p, .rule-card ul, .rule-card ol { margin: 0; font-size: 0.85em; color: #475569; }
.rule-card ul, .rule-card ol { padding-left: 18px; }
.rule-card li { margin: 3px 0; }

@media (max-width: 900px) {
  .teams-overview { grid-template-columns: 1fr; }
  .selected-rider-header { flex-direction: column; align-items: flex-start; }
  .rider-stats { width: 100%; justify-content: flex-start; }
  .selected-rider-cards { flex-direction: column; }
  .cell { width: 30px; min-height: 45px; }
  .rider-token { font-size: 12px; width: 16px; height: 16px; }
  .terrain-legend { justify-content: center; }
  .effects-panel { padding: 20px; }
}
</style>
