<template>
  <div class="game-container">
    <h1>🚴 Course Cycliste - Prototype</h1>
    
    <!-- Game Status -->
    <div 
      class="status-bar" 
      :class="{ 'last-turn': gameStatus.isLastTurn }"
      :style="{ borderColor: gameStatus.currentTeamConfig?.color }"
    >
      <span class="turn" :title="`Tour actuel de la course`">Tour {{ gameStatus.turn }}</span>
      <span v-if="gameStatus.isLastTurn" class="last-turn-badge" title="Tous les coureurs jouent une dernière fois">🏁 DERNIER TOUR</span>
      <span 
        class="current-player"
        :style="{ background: gameStatus.currentTeamConfig?.color }"
        :title="`C'est au tour de ${gameStatus.currentTeamConfig?.playerName} de choisir un coureur`"
      >
        {{ gameStatus.currentTeamConfig?.playerName }} ({{ gameStatus.currentTeamConfig?.shortName }})
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
          :title="`Case ${index + 1} - ${getTerrainName(cell.terrain)}\n${getTerrainTooltip(cell.terrain)}`"
        >
          <span class="cell-number">{{ index + 1 }}</span>
          <div class="riders-on-cell">
            <span 
              v-for="rider in getRidersAtPosition(index)" 
              :key="rider.id"
              class="rider-token"
              :class="[
                rider.type, 
                rider.team,
                { 'selected': rider.id === gameStatus.selectedRiderId }
              ]"
              :title="getRiderTooltip(rider)"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
        <!-- Finish zone with riders beyond -->
        <div class="finish-zone">
          <span class="finish-flag" title="Ligne d'arrivée">🏁</span>
          <div class="finished-riders">
            <span 
              v-for="rider in getFinishedRiders()" 
              :key="rider.id"
              class="rider-token finished"
              :class="[rider.type, rider.team]"
              :title="getRiderTooltip(rider)"
            >
              {{ getRiderEmoji(rider.type) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Legend -->
    <div class="team-legend">
      <div class="team-item team_a" title="Équipe contrôlée par le Joueur 1">
        <span class="team-color" style="background: #dc2626"></span>
        Équipe Rouge (Joueur 1)
      </div>
      <div class="team-item team_b" title="Équipe contrôlée par le Joueur 2">
        <span class="team-color" style="background: #2563eb"></span>
        Équipe Bleue (Joueur 2)
      </div>
    </div>

    <!-- Player Action Panel -->
    <div 
      v-if="gameStatus.phase !== 'finished'" 
      class="player-panel"
      :style="{ borderColor: gameStatus.currentTeamConfig?.color }"
    >
      <!-- Select Rider Phase -->
      <div v-if="gameStatus.turnPhase === 'select_rider'" class="select-phase">
        <div class="phase-header" :style="{ background: gameStatus.currentTeamConfig?.bgColor }">
          <h2>
            <span class="team-indicator" :style="{ background: gameStatus.currentTeamConfig?.color }"></span>
            {{ gameStatus.currentTeamConfig?.playerName }} - Choisissez un coureur
          </h2>
          <p class="phase-hint">Cliquez sur un de vos coureurs disponibles</p>
        </div>
        
        <div class="available-riders">
          <div 
            v-for="rider in getTeamRiders(gameStatus.currentTeam)" 
            :key="rider.id"
            class="rider-select-card"
            :class="{ 
              'available': isRiderAvailable(rider),
              'played': hasRiderPlayed(rider),
              'finished': rider.hasFinished
            }"
            :title="getRiderSelectTooltip(rider)"
            @click="onRiderSelect(rider)"
          >
            <span class="emoji">{{ getRiderEmoji(rider.type) }}</span>
            <div class="rider-details">
              <span class="name">{{ rider.name }}</span>
              <span class="type">{{ RiderConfig[rider.type].name }}</span>
            </div>
            <div class="rider-stats">
              <span class="stat" :title="`Position sur le parcours: case ${rider.position + 1}`">
                📍 {{ rider.position + 1 }}
              </span>
              <span 
                class="stat" 
                :class="getFatigueClass(rider.fatigue)"
                :title="`Fatigue: ${rider.fatigue}/10 - ${getFatigueStatus(rider.fatigue)}`"
              >
                ❤️ {{ rider.fatigue }}
              </span>
              <span class="stat" :title="`Cartes Attaque restantes: ${rider.attackCardsRemaining}`">
                ⚔️ {{ rider.attackCardsRemaining }}
              </span>
            </div>
            <div class="rider-status">
              <span v-if="rider.hasFinished" class="badge finished">🏁 Arrivé</span>
              <span v-else-if="hasRiderPlayed(rider)" class="badge played">✓ Joué</span>
              <span v-else class="badge available">Disponible</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Rider Action Phase -->
      <div v-else-if="gameStatus.currentRider" class="action-phase">
        <div 
          class="rider-header" 
          :style="{ background: gameStatus.currentRider.teamConfig?.bgColor }"
        >
          <h2>
            <span class="team-indicator" :style="{ background: gameStatus.currentRider.teamConfig?.color }"></span>
            {{ gameStatus.currentRider.name }}
            <span class="team-name">({{ gameStatus.currentRider.teamConfig?.name }})</span>
          </h2>
          <button 
            v-if="gameStatus.turnPhase === 'pre_roll'"
            @click="cancelSelection" 
            class="btn cancel"
            title="Annuler la sélection et choisir un autre coureur"
          >
            ← Changer de coureur
          </button>
        </div>
        
        <div class="rider-info">
          <span 
            class="info-badge rider-type" 
            :title="`Type de coureur avec ses bonus/malus par terrain`"
          >
            {{ getRiderEmoji(gameStatus.currentRider.type) }} {{ gameStatus.currentRider.config.name }}
          </span>
          <span 
            class="info-badge terrain"
            :title="getTerrainTooltip(gameStatus.currentRider.terrain)"
          >
            {{ TerrainConfig[gameStatus.currentRider.terrain]?.emoji }} {{ gameStatus.currentRider.terrainConfig.name }}
            <span class="bonus">
              ({{ getTerrainBonusDisplay(gameStatus.currentRider.type, gameStatus.currentRider.terrain) }})
            </span>
          </span>
          <span 
            class="info-badge fatigue" 
            :class="fatigueClass"
            :title="getFatigueTooltip(gameStatus.currentRider.fatigue)"
          >
            ❤️ Fatigue: {{ gameStatus.currentRider.fatigue }}/10 
            ({{ gameStatus.currentRider.fatigueStatus.status }})
          </span>
          <span 
            class="info-badge attacks"
            :title="`Cartes Attaque: +3 cases, coûte +1 fatigue. À jouer AVANT le lancer de dés.`"
          >
            ⚔️ Attaques: {{ gameStatus.currentRider.attackCardsRemaining }}
          </span>
          <span 
            class="info-badge position"
            :title="`Position actuelle sur le parcours (${finishLine} cases au total)`"
          >
            📊 Position: {{ gameStatus.currentRider.position + 1 }}/{{ finishLine }}
          </span>
        </div>

        <!-- Actions -->
        <div class="actions">
          <!-- Pre-roll phase -->
          <template v-if="gameStatus.turnPhase === 'pre_roll'">
            <button 
              v-if="gameStatus.canAttack"
              @click="useAttack"
              class="btn attack"
              :disabled="attackUsed"
              :title="attackUsed ? 'Attaque déjà utilisée ce tour' : 'Jouer une carte Attaque: +3 cases, +1 fatigue'"
            >
              ⚔️ Attaque (+3) {{ attackUsed ? '✓' : '' }}
            </button>
            <button 
              @click="rollDice" 
              class="btn roll"
              title="Lancer 2 dés à 6 faces pour déterminer le déplacement"
            >
              🎲 Lancer les dés
            </button>
          </template>

          <!-- Resolve phase -->
          <template v-if="gameStatus.turnPhase === 'resolve'">
            <div class="dice-result">
              <span class="dice" title="Résultat des 2d6">
                🎲 {{ gameStatus.lastDiceRoll?.dice1 }} + {{ gameStatus.lastDiceRoll?.dice2 }} = {{ gameStatus.lastDiceRoll?.total }}
              </span>
              <span class="movement" :title="getMovementBreakdown()">
                → Déplacement: {{ calculatedMovement }} cases
              </span>
            </div>
            <div v-if="gameStatus.lastCard" class="card-drawn">
              <span 
                :class="gameStatus.lastCard.type"
                :title="getCardDescription(gameStatus.lastCard.card)"
              >
                {{ gameStatus.lastCard.type === 'penalty' ? '❌' : '✅' }}
                {{ gameStatus.lastCard.card.name }}
              </span>
            </div>
            <button 
              @click="resolveMove" 
              class="btn resolve"
              title="Confirmer et appliquer le déplacement"
            >
              ✓ Appliquer le mouvement
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Riders Overview by Team -->
    <div class="riders-overview">
      <h3>📊 État des équipes</h3>
      <div class="teams-container">
        <!-- Team A -->
        <div 
          class="team-column" 
          :class="{ 'active': gameStatus.currentTeam === 'team_a' }"
        >
          <h4 style="color: #dc2626">
            🔴 Équipe Rouge
            <span v-if="gameStatus.currentTeam === 'team_a'" class="active-badge">← Joue</span>
          </h4>
          <div 
            v-for="rider in getTeamRiders('team_a')" 
            :key="rider.id"
            class="rider-row"
            :class="{ 
              'selected': rider.id === gameStatus.selectedRiderId,
              'played': hasRiderPlayed(rider),
              'finished': rider.hasFinished,
              'available': isRiderAvailable(rider) && gameStatus.currentTeam === 'team_a'
            }"
            :title="getRiderTooltip(rider)"
            @click="onRiderRowClick(rider)"
          >
            <span class="emoji">{{ getRiderEmoji(rider.type) }}</span>
            <span class="name">{{ rider.name }}</span>
            <span class="pos" :title="`Case ${rider.position + 1}`">{{ rider.position + 1 }}</span>
            <span 
              class="fatigue" 
              :class="getFatigueClass(rider.fatigue)"
              :title="`Fatigue: ${rider.fatigue}/10`"
            >
              ❤️{{ rider.fatigue }}
            </span>
            <span class="attacks" :title="`Attaques restantes: ${rider.attackCardsRemaining}`">
              ⚔️{{ rider.attackCardsRemaining }}
            </span>
            <span v-if="rider.hasFinished" class="status-badge">🏁</span>
            <span v-else-if="hasRiderPlayed(rider)" class="status-badge played">✓</span>
          </div>
        </div>
        <!-- Team B -->
        <div 
          class="team-column"
          :class="{ 'active': gameStatus.currentTeam === 'team_b' }"
        >
          <h4 style="color: #2563eb">
            🔵 Équipe Bleue
            <span v-if="gameStatus.currentTeam === 'team_b'" class="active-badge">← Joue</span>
          </h4>
          <div 
            v-for="rider in getTeamRiders('team_b')" 
            :key="rider.id"
            class="rider-row"
            :class="{ 
              'selected': rider.id === gameStatus.selectedRiderId,
              'played': hasRiderPlayed(rider),
              'finished': rider.hasFinished,
              'available': isRiderAvailable(rider) && gameStatus.currentTeam === 'team_b'
            }"
            :title="getRiderTooltip(rider)"
            @click="onRiderRowClick(rider)"
          >
            <span class="emoji">{{ getRiderEmoji(rider.type) }}</span>
            <span class="name">{{ rider.name }}</span>
            <span class="pos" :title="`Case ${rider.position + 1}`">{{ rider.position + 1 }}</span>
            <span 
              class="fatigue"
              :class="getFatigueClass(rider.fatigue)"
              :title="`Fatigue: ${rider.fatigue}/10`"
            >
              ❤️{{ rider.fatigue }}
            </span>
            <span class="attacks" :title="`Attaques restantes: ${rider.attackCardsRemaining}`">
              ⚔️{{ rider.attackCardsRemaining }}
            </span>
            <span v-if="rider.hasFinished" class="status-badge">🏁</span>
            <span v-else-if="hasRiderPlayed(rider)" class="status-badge played">✓</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over Panel -->
    <div v-if="gameStatus.phase === 'finished'" class="game-over-panel">
      <h2>🏆 Course Terminée!</h2>
      <div class="winning-team" v-if="gameStatus.winningTeam">
        <span 
          class="winner-badge"
          :style="{ background: TeamConfig[gameStatus.winningTeam]?.color }"
        >
          {{ TeamConfig[gameStatus.winningTeam]?.name }} gagne!
        </span>
      </div>
      <div class="final-rankings">
        <div 
          v-for="(rider, index) in gameStatus.rankings.slice(0, 10)" 
          :key="rider.id"
          class="ranking-row"
          :class="rider.team"
        >
          <span class="rank">{{ getMedal(index) }}</span>
          <span class="rider-name">{{ rider.name }}</span>
          <span class="team-badge" :style="{ background: getTeamColor(rider.team) }">
            {{ getTeamShortName(rider.team) }}
          </span>
          <span class="final-pos">Position: {{ rider.position + 1 }}</span>
        </div>
      </div>
      <button @click="restartGame" class="btn restart" title="Recommencer une nouvelle partie">
        🔄 Nouvelle partie
      </button>
    </div>

    <!-- Game Log (Console) -->
    <div class="game-log">
      <h3>📜 Historique de la course</h3>
      <div class="log-entries" ref="logContainer">
        <div 
          v-for="(entry, i) in gameLog" 
          :key="i" 
          class="log-entry"
          :class="getLogEntryClass(entry)"
        >
          {{ entry }}
        </div>
      </div>
    </div>

    <!-- Rules Section -->
    <div class="rules-section">
      <h2>📖 Règles du Jeu</h2>
      
      <div class="rules-grid">
        <div class="rule-card">
          <h3>🎯 Objectif</h3>
          <p>Être le premier à franchir la ligne d'arrivée. Quand un coureur franchit la ligne, le <strong>dernier tour</strong> est déclenché : tous les coureurs jouent une dernière fois, puis le classement final est établi.</p>
        </div>

        <div class="rule-card">
          <h3>🎮 Tour de Jeu</h3>
          <p>Chaque joueur <strong>choisit librement</strong> quel coureur de son équipe jouer. Les joueurs <strong>alternent</strong> : Joueur 1 joue un coureur, puis Joueur 2, et ainsi de suite jusqu'à ce que tous les coureurs aient joué.</p>
        </div>

        <div class="rule-card">
          <h3>🎲 Mouvement</h3>
          <p>Chaque coureur lance <strong>2d6</strong> et avance du total + bonus de terrain. Les bonus dépendent du type de coureur et du terrain.</p>
        </div>

        <div class="rule-card">
          <h3>🚴 Types de Coureurs</h3>
          <ul>
            <li><strong>🧗 Grimpeur:</strong> +2 montagne, +1 côte</li>
            <li><strong>💥 Puncheur:</strong> +2 côte, +1 montagne</li>
            <li><strong>🚴 Rouleur:</strong> +2 plaine, +1 descente</li>
            <li><strong>⚡ Sprinteur:</strong> +3 sprint, +1 plaine/descente</li>
            <li><strong>🎯 Polyvalent:</strong> Aucun bonus/malus</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>🗺️ Terrains</h3>
          <ul>
            <li><span class="terrain-badge flat">🟩 Plaine</span> Favorable aux rouleurs</li>
            <li><span class="terrain-badge hill">🟨 Côte</span> Favorable aux puncheurs</li>
            <li><span class="terrain-badge mountain">🟫 Montagne</span> Favorable aux grimpeurs</li>
            <li><span class="terrain-badge descent">🟦 Descente</span> +3 tous, min 5 cases</li>
            <li><span class="terrain-badge sprint">🟪 Sprint</span> Favorable aux sprinteurs</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>💨 Prise de Vent</h3>
          <p>Un coureur <strong>prend le vent</strong> s'il n'a personne devant lui ou s'il est à 2+ cases du coureur précédent (sauf en montagne et descente). Il pioche alors une <strong>carte Pénalité</strong>.</p>
        </div>

        <div class="rule-card">
          <h3>🎴 Cartes Pénalité</h3>
          <ul>
            <li><strong>Effort soutenu:</strong> +1 fatigue</li>
            <li><strong>Coup de pompe:</strong> +2 fatigue</li>
            <li><strong>Vent de face:</strong> -2 déplacement</li>
            <li><strong>Jambes lourdes:</strong> Mouvement 2-7</li>
            <li><strong>Crevaison:</strong> Pas de mouvement</li>
            <li><strong>Chute isolée:</strong> Recule 2, +2 fatigue</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>✨ Cartes Bonus (sur 7)</h3>
          <p>Quand un coureur fait <strong>exactement 7</strong> aux dés, il pioche une carte Bonus:</p>
          <ul>
            <li><strong>Second souffle:</strong> -1 fatigue</li>
            <li><strong>Aspiration parfaite:</strong> +2 déplacement</li>
            <li><strong>Ravitaillement:</strong> -2 fatigue</li>
            <li><strong>Concentration:</strong> Relancer 1 dé</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>⚔️ Cartes Attaque</h3>
          <p>Chaque coureur a <strong>2 cartes Attaque</strong> par course. Une attaque donne <strong>+3 cases</strong> mais coûte <strong>+1 fatigue</strong>. À utiliser avant de lancer les dés.</p>
        </div>

        <div class="rule-card">
          <h3>❤️ Fatigue</h3>
          <ul>
            <li><strong>0-3:</strong> OK, aucun malus</li>
            <li><strong>4-6:</strong> Fatigué, -1 au déplacement</li>
            <li><strong>7-9:</strong> Épuisé, -2 au déplacement</li>
            <li><strong>10+:</strong> Fringale! Max 4 cases</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>⛰️ Descente</h3>
          <ul>
            <li><strong>Bonus +3</strong> pour tous les coureurs</li>
            <li><strong>Vitesse min 5</strong> cases garanties</li>
            <li><strong>Risque chute</strong> sur double 1 (test 1d6: 1-2 = chute)</li>
            <li><strong>Récupération:</strong> -1 fatigue si dans le peloton</li>
            <li><strong>Pas de prise de vent</strong> en descente</li>
          </ul>
        </div>

        <div class="rule-card">
          <h3>🏁 Fin de Course</h3>
          <p>Quand le premier coureur franchit la ligne, le <strong>dernier tour</strong> commence. Tous les coureurs jouent une dernière fois. Le classement est basé sur la position finale. L'équipe avec les meilleures positions gagne!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import {
  createGameState,
  startTurn,
  selectRider as selectRiderAction,
  deselectRider,
  playAttackCard,
  rollDice as rollDiceAction,
  resolveMovement,
  calculateMovement,
  getGameStatus,
  getTerrainBonus,
  TerrainConfig,
  RiderConfig,
  TeamConfig,
  getCardDescription
} from '../core/game_engine.js';

// Game state
const gameState = ref(null);
const attackUsed = ref(false);
const logContainer = ref(null);

// Initialize game
onMounted(() => {
  initGame();
});

function initGame() {
  gameState.value = createGameState({
    courseLength: 50,
    twoTeams: true
  });
  gameState.value = startTurn(gameState.value);
  attackUsed.value = false;
}

function restartGame() {
  initGame();
}

// Auto-scroll log
watch(() => gameState.value?.gameLog?.length, () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
});

// Computed
const gameStatus = computed(() => {
  if (!gameState.value) return {};
  return getGameStatus(gameState.value);
});

const course = computed(() => gameState.value?.course || []);
const finishLine = computed(() => gameState.value?.finishLine || 50);
const gameLog = computed(() => gameState.value?.gameLog || []);

const calculatedMovement = computed(() => {
  if (!gameState.value) return 0;
  return calculateMovement(gameState.value);
});

const phaseLabel = computed(() => {
  const labels = {
    'select_rider': 'Sélection du coureur',
    'pre_roll': 'Préparation',
    'roll_dice': 'Lancer',
    'resolve': 'Résolution'
  };
  return labels[gameStatus.value.turnPhase] || '';
});

const phaseTooltip = computed(() => {
  const tooltips = {
    'select_rider': 'Choisissez un coureur de votre équipe à jouer',
    'pre_roll': 'Vous pouvez jouer une carte Attaque avant de lancer les dés',
    'roll_dice': 'Lancez les dés pour déterminer le déplacement',
    'resolve': 'Confirmez le mouvement pour passer au joueur suivant'
  };
  return tooltips[gameStatus.value.turnPhase] || '';
});

const fatigueClass = computed(() => {
  const status = gameStatus.value.currentRider?.fatigueStatus?.status;
  return {
    'ok': status === 'OK',
    'tired': status === 'Fatigué',
    'exhausted': status === 'Épuisé',
    'fringale': status === 'Fringale'
  };
});

// Methods
function getRidersAtPosition(position) {
  if (!gameState.value) return [];
  return gameState.value.riders.filter(r => r.position === position && !r.hasFinished);
}

function getFinishedRiders() {
  if (!gameState.value) return [];
  return gameState.value.riders
    .filter(r => r.hasFinished || r.position >= finishLine.value)
    .sort((a, b) => b.position - a.position);
}

function getTeamRiders(team) {
  if (!gameState.value) return [];
  return gameState.value.riders
    .filter(r => r.team === team)
    .sort((a, b) => b.position - a.position);
}

function hasSelectedRiderAtPosition(position) {
  if (!gameStatus.value.selectedRiderId) return false;
  const rider = gameState.value?.riders.find(r => r.id === gameStatus.value.selectedRiderId);
  return rider?.position === position && !rider?.hasFinished;
}

function isRiderAvailable(rider) {
  if (!gameState.value) return false;
  return rider.team === gameStatus.value.currentTeam &&
         !gameStatus.value.ridersPlayedThisTurn?.includes(rider.id) &&
         !rider.hasFinished;
}

function hasRiderPlayed(rider) {
  return gameStatus.value.ridersPlayedThisTurn?.includes(rider.id);
}

function getRiderEmoji(type) {
  return RiderConfig[type]?.emoji || '🚴';
}

function getTerrainName(terrain) {
  return TerrainConfig[terrain]?.name || terrain;
}

function getTeamColor(team) {
  return TeamConfig[team]?.color || '#666';
}

function getTeamShortName(team) {
  return team === 'team_a' ? 'R' : 'B';
}

function getMedal(index) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}.`;
}

function getFatigueClass(fatigue) {
  if (fatigue <= 3) return 'ok';
  if (fatigue <= 6) return 'tired';
  if (fatigue <= 9) return 'exhausted';
  return 'fringale';
}

function getFatigueStatus(fatigue) {
  if (fatigue <= 3) return 'OK';
  if (fatigue <= 6) return 'Fatigué (-1)';
  if (fatigue <= 9) return 'Épuisé (-2)';
  return 'Fringale (max 4 cases)';
}

// Tooltips
function getRiderTooltip(rider) {
  const type = RiderConfig[rider.type]?.name;
  const team = TeamConfig[rider.team]?.shortName;
  const fatigueStatus = getFatigueStatus(rider.fatigue);
  return `${rider.name} (${team})
Type: ${type}
Position: case ${rider.position + 1}
Fatigue: ${rider.fatigue}/10 (${fatigueStatus})
Attaques: ${rider.attackCardsRemaining} restantes`;
}

function getRiderSelectTooltip(rider) {
  if (rider.hasFinished) return `${rider.name} a déjà franchi la ligne d'arrivée`;
  if (hasRiderPlayed(rider)) return `${rider.name} a déjà joué ce tour`;
  if (!isRiderAvailable(rider)) return `Ce n'est pas votre tour`;
  return `Cliquez pour jouer ${rider.name}`;
}

function getTerrainTooltip(terrain) {
  const tooltips = {
    'flat': 'Plaine: Bonus pour Rouleur (+2) et Sprinteur (+1)',
    'hill': 'Côte: Bonus pour Puncheur (+2) et Grimpeur (+1). Malus Sprinteur (-1)',
    'mountain': 'Montagne: Bonus Grimpeur (+2), Puncheur (+1). Malus Rouleur (-1), Sprinteur (-2). Pas de prise de vent.',
    'descent': 'Descente: +3 pour tous, minimum 5 cases. Risque de chute sur double 1. Récupération possible. Pas de prise de vent.',
    'sprint': 'Zone Sprint: Bonus Sprinteur (+3). Malus Grimpeur (-1).'
  };
  return tooltips[terrain] || '';
}

function getTerrainBonusDisplay(riderType, terrain) {
  const bonus = getTerrainBonus(terrain, riderType);
  if (bonus > 0) return `+${bonus}`;
  if (bonus < 0) return `${bonus}`;
  return '±0';
}

function getFatigueTooltip(fatigue) {
  if (fatigue <= 3) return 'Fatigue OK: Aucun malus de déplacement';
  if (fatigue <= 6) return 'Fatigué: -1 au déplacement';
  if (fatigue <= 9) return 'Épuisé: -2 au déplacement';
  return 'Fringale! Déplacement maximum de 4 cases';
}

function getMovementBreakdown() {
  if (!gameStatus.value.currentRider || !gameStatus.value.lastDiceRoll) return '';
  
  const rider = gameStatus.value.currentRider;
  const terrain = rider.terrain;
  const terrainBonus = getTerrainBonus(terrain, rider.type);
  const diceTotal = gameStatus.value.lastDiceRoll.total;
  
  let breakdown = `Dés: ${diceTotal}`;
  if (terrainBonus !== 0) breakdown += ` | Terrain: ${terrainBonus > 0 ? '+' : ''}${terrainBonus}`;
  if (attackUsed.value) breakdown += ` | Attaque: +3`;
  if (rider.fatigueStatus.penalty) breakdown += ` | Fatigue: ${rider.fatigueStatus.penalty}`;
  
  return breakdown;
}

function getLogEntryClass(entry) {
  return {
    'turn-header': entry.includes('──────'),
    'last-turn-header': entry.includes('DERNIER TOUR'),
    'results-header': entry.includes('RÉSULTATS'),
    'finish': entry.includes('🏁'),
    'attack': entry.includes('⚔️'),
    'fall': entry.includes('💥'),
    'bonus': entry.includes('✨'),
    'penalty': entry.includes('⚠️'),
    'player-turn': entry.includes('🎮') || entry.includes('🔄')
  };
}

// Actions
function onRiderSelect(rider) {
  if (!isRiderAvailable(rider)) return;
  gameState.value = selectRiderAction(gameState.value, rider.id);
}

function onRiderRowClick(rider) {
  if (gameStatus.value.turnPhase !== 'select_rider') return;
  if (!isRiderAvailable(rider)) return;
  gameState.value = selectRiderAction(gameState.value, rider.id);
}

function cancelSelection() {
  gameState.value = deselectRider(gameState.value);
}

function useAttack() {
  gameState.value = playAttackCard(gameState.value);
  attackUsed.value = true;
}

function rollDice() {
  gameState.value = rollDiceAction(gameState.value);
}

function resolveMove() {
  gameState.value = resolveMovement(gameState.value);
  attackUsed.value = false;
}
</script>

<style scoped>
.game-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

/* Status Bar */
.status-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 3px solid #ddd;
}

.status-bar.last-turn {
  background: #fef3c7;
  border-color: #f59e0b;
}

.status-bar .turn {
  font-weight: bold;
}

.status-bar .current-player {
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: bold;
}

.status-bar .last-turn-badge {
  background: #f59e0b;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Board */
.board-container {
  overflow-x: auto;
  margin-bottom: 10px;
}

.course {
  display: flex;
  gap: 2px;
  padding: 10px;
  background: #333;
  border-radius: 8px;
  min-width: max-content;
}

.cell {
  width: 40px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  border-radius: 4px;
  font-size: 10px;
  transition: all 0.2s;
}

.cell.flat { background: #90EE90; }
.cell.hill { background: #FFD700; }
.cell.mountain { background: #CD853F; }
.cell.descent { background: #87CEEB; }
.cell.sprint { background: #FF69B4; }
.cell.finish { border: 2px solid #000; }

.cell.has-selected {
  box-shadow: 0 0 0 3px #fbbf24, 0 0 15px rgba(251, 191, 36, 0.5);
  transform: scale(1.1);
  z-index: 10;
}

.cell-number {
  font-size: 8px;
  color: #666;
}

.riders-on-cell {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1px;
}

.rider-token {
  font-size: 14px;
  cursor: pointer;
  border: 2px solid;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.2s;
}

.rider-token.team_a { border-color: #dc2626; background: #fecaca; }
.rider-token.team_b { border-color: #2563eb; background: #bfdbfe; }

.rider-token.selected {
  box-shadow: 0 0 0 3px #fbbf24, 0 0 10px rgba(251, 191, 36, 0.8);
  transform: scale(1.2);
  z-index: 20;
}

.finish-zone {
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 10px;
  background: #1a1a1a;
  border-radius: 0 8px 8px 0;
}

.finish-flag {
  font-size: 24px;
}

.finished-riders {
  display: flex;
  gap: 4px;
}

/* Team Legend */
.team-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
  font-size: 14px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: help;
}

.team-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

/* Player Panel */
.player-panel {
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 3px solid;
  overflow: hidden;
}

/* Select Phase */
.select-phase .phase-header {
  padding: 15px 20px;
}

.select-phase .phase-header h2 {
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-phase .phase-hint {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.team-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.available-riders {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  padding: 15px;
}

.rider-select-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.rider-select-card.available {
  border-color: #22c55e;
  cursor: pointer;
}

.rider-select-card.available:hover {
  background: #dcfce7;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.rider-select-card.played {
  opacity: 0.5;
  cursor: not-allowed;
}

.rider-select-card.finished {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f0fdf4;
}

.rider-select-card .emoji {
  font-size: 24px;
}

.rider-select-card .rider-details {
  flex: 1;
}

.rider-select-card .name {
  display: block;
  font-weight: 600;
}

.rider-select-card .type {
  display: block;
  font-size: 12px;
  color: #666;
}

.rider-select-card .rider-stats {
  display: flex;
  gap: 8px;
}

.rider-select-card .stat {
  font-size: 12px;
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
}

.rider-select-card .stat.tired { background: #fef3c7; }
.rider-select-card .stat.exhausted { background: #fee2e2; }
.rider-select-card .stat.fringale { background: #fecaca; color: #991b1b; }

.rider-select-card .rider-status .badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.rider-select-card .badge.available { background: #dcfce7; color: #166534; }
.rider-select-card .badge.played { background: #e5e7eb; color: #374151; }
.rider-select-card .badge.finished { background: #dbeafe; color: #1e40af; }

/* Action Phase */
.action-phase .rider-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-phase .rider-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.team-name {
  font-size: 14px;
  font-weight: normal;
  color: #666;
}

.rider-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px 20px;
}

.info-badge {
  padding: 6px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 13px;
  cursor: help;
}

.info-badge .bonus {
  font-weight: 600;
  margin-left: 4px;
}

.info-badge.fatigue.ok { border-color: #22c55e; background: #f0fdf4; }
.info-badge.fatigue.tired { border-color: #f59e0b; background: #fffbeb; }
.info-badge.fatigue.exhausted { border-color: #ef4444; background: #fef2f2; }
.info-badge.fatigue.fringale { border-color: #7f1d1d; background: #fecaca; }

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.cancel { background: #e5e7eb; color: #374151; }
.btn.attack { background: #f59e0b; color: white; }
.btn.roll { background: #3b82f6; color: white; }
.btn.resolve { background: #22c55e; color: white; }
.btn.restart { background: #6366f1; color: white; font-size: 16px; padding: 15px 30px; }

.dice-result {
  display: flex;
  gap: 15px;
  font-size: 18px;
  font-weight: bold;
}

.card-drawn {
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 500;
  cursor: help;
}

.card-drawn .penalty { color: #dc2626; }
.card-drawn .bonus { color: #16a34a; }

/* Riders Overview */
.riders-overview {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.riders-overview h3 {
  margin: 0 0 15px 0;
  text-align: center;
}

.teams-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.team-column {
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.team-column.active {
  background: #f0f9ff;
  box-shadow: 0 0 0 2px #3b82f6;
}

.team-column h4 {
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.active-badge {
  font-size: 12px;
  background: #22c55e;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  animation: pulse 1s infinite;
}

.rider-row {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 5px;
  background: #fff;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.team-column:first-child .rider-row { border-left: 3px solid #dc2626; }
.team-column:last-child .rider-row { border-left: 3px solid #2563eb; }

.rider-row.available:hover {
  background: #f0fdf4;
  border-color: #22c55e;
}

.rider-row.selected {
  background: #fef3c7;
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px #fbbf24;
}

.rider-row.played {
  opacity: 0.5;
}

.rider-row.finished {
  background: #f0fdf4;
}

.rider-row .name {
  font-weight: 500;
  flex: 1;
}

.rider-row .pos,
.rider-row .fatigue,
.rider-row .attacks {
  font-size: 11px;
  color: #666;
}

.rider-row .fatigue.ok { color: #16a34a; }
.rider-row .fatigue.tired { color: #d97706; }
.rider-row .fatigue.exhausted { color: #dc2626; }
.rider-row .fatigue.fringale { color: #7f1d1d; font-weight: bold; }

.rider-row .status-badge {
  font-size: 12px;
}

.rider-row .status-badge.played {
  color: #9ca3af;
}

/* Game Over Panel */
.game-over-panel {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
  border: 3px solid #f59e0b;
}

.game-over-panel h2 {
  margin: 0 0 15px 0;
}

.winning-team {
  margin-bottom: 20px;
}

.winner-badge {
  display: inline-block;
  color: white;
  padding: 10px 30px;
  border-radius: 30px;
  font-size: 20px;
  font-weight: bold;
}

.final-rankings {
  max-width: 500px;
  margin: 0 auto 20px;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  margin-bottom: 5px;
}

.ranking-row.team_a { border-left: 4px solid #dc2626; }
.ranking-row.team_b { border-left: 4px solid #2563eb; }

.ranking-row .rank {
  font-size: 20px;
  width: 40px;
}

.ranking-row .rider-name {
  flex: 1;
  font-weight: 500;
}

.ranking-row .team-badge {
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* Game Log */
.game-log {
  background: #1f2937;
  color: #e5e7eb;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.game-log h3 {
  margin: 0 0 10px 0;
  color: #fff;
}

.log-entries {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.log-entry {
  padding: 4px 8px;
  border-radius: 2px;
}

.log-entry.turn-header {
  color: #9ca3af;
  margin-top: 8px;
  font-weight: bold;
}

.log-entry.last-turn-header {
  color: #fbbf24;
  background: #422006;
  margin-top: 8px;
  font-weight: bold;
}

.log-entry.results-header {
  color: #fbbf24;
  background: #422006;
  margin-top: 8px;
  font-weight: bold;
}

.log-entry.finish { color: #34d399; }
.log-entry.attack { color: #f59e0b; }
.log-entry.fall { color: #ef4444; }
.log-entry.bonus { color: #a78bfa; }
.log-entry.penalty { color: #fb923c; }
.log-entry.player-turn { color: #60a5fa; }

/* Rules Section */
.rules-section {
  background: #f8fafc;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.rules-section h2 {
  text-align: center;
  margin: 0 0 25px 0;
  color: #1e293b;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.rule-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.rule-card h3 {
  margin: 0 0 10px 0;
  color: #334155;
  font-size: 16px;
}

.rule-card p {
  margin: 0 0 10px 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.rule-card ul {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
  font-size: 13px;
}

.rule-card li {
  margin-bottom: 5px;
}

.terrain-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 5px;
}

.terrain-badge.flat { background: #90EE90; }
.terrain-badge.hill { background: #FFD700; }
.terrain-badge.mountain { background: #CD853F; color: white; }
.terrain-badge.descent { background: #87CEEB; }
.terrain-badge.sprint { background: #FF69B4; color: white; }
</style>
