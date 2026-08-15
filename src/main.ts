import './style.css';
import { Game } from './core/Game';
import { GameLoop } from './core/GameLoop';
import { GAME_TEXT } from './core/Constants';
import { HUD } from './ui/HUD';
import { DebugPanel } from './ui/DebugPanel';
import { MetaProgression } from './progression/MetaProgression';
import { MetaMenu } from './ui/MetaMenu';
import { AbilityPanel } from './ui/AbilityPanel';
import { AudioSystem } from './systems/AudioSystem';
import { MenuViews } from './ui/MenuViews';
import { BuildBar } from './ui/BuildBar';
import { ResultsScreen } from './ui/ResultsScreen';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="game-shell">
    <section class="battlefield">
      <canvas id="game-canvas" aria-label="The Last Wall battlefield"></canvas>

      <div class="hud-top">
        <div class="health-block">
          <small>Health</small>
          <div class="health-bar"><i id="health-fill"></i><span id="health-text">100 / 100</span></div>
        </div>
        <div class="resource-row">
          <span class="resource gold"><i></i><b id="gold-value">0</b></span>
          <span class="resource kills"><i></i><b id="kills-value">0</b></span>
          <span class="resource enemies"><i></i><b id="enemy-value">0</b></span>
        </div>
      </div>

      <aside id="tower-stock" class="tower-stock" aria-label="Tower stock"></aside>

      <div id="map-intro" class="map-intro" hidden><strong>THE LAST WALL</strong><span>KING'S APPROACH</span></div>
      <div id="horde-announcement" class="horde-announcement" hidden></div>
      <div id="build-banner" class="build-banner" hidden><strong>BUILD PHASE</strong><span>Press SPACE to start battle</span></div>

      <div id="controls-hint" class="controls-hint">
        <button id="controls-hint-close" type="button" aria-label="Dismiss controls">X</button>
        <span><i class="mouse left"></i>Click to Select Tower</span>
        <span><i class="mouse left"></i>Drag to Move Tower or Target</span>
        <span><i class="mouse right"></i>Remove Tower</span>
        <span><i class="mouse key">R</i>Remove all Towers</span>
        <span><i class="mouse middle"></i>Pan Camera</span>
        <span><i class="mouse wheel"></i>Zoom</span>
      </div>

      <div id="build-bar" class="build-bar" hidden></div>
      <button id="start-battle" type="button" class="start-battle" hidden>Start Battle</button>

      <div id="results-screen" class="results-screen" hidden>
        <h1 id="results-title">Survived</h1>
        <div id="results-rows" class="results-rows"></div>
        <div class="results-actions">
          <button id="results-upgrades" type="button">Upgrades</button>
          <button id="results-play-again" type="button">Play Again</button>
        </div>
      </div>

      <div id="upgrade-menu" class="upgrade-menu" hidden>
        <div class="upgrade-heading"><span>Level Up</span><strong>Choose One Upgrade</strong></div>
        <div class="upgrade-options">
          <button type="button" class="upgrade-card"><span class="upgrade-rarity"></span><strong class="upgrade-name"></strong><small class="upgrade-description"></small></button>
          <button type="button" class="upgrade-card"><span class="upgrade-rarity"></span><strong class="upgrade-name"></strong><small class="upgrade-description"></small></button>
          <button type="button" class="upgrade-card"><span class="upgrade-rarity"></span><strong class="upgrade-name"></strong><small class="upgrade-description"></small></button>
        </div>
      </div>

      <section class="ability-strip" aria-label="Abilities">
        <button type="button" class="ability-button"><strong>Meteor</strong><small>Q</small></button>
        <button type="button" class="ability-button"><strong>Artillery</strong><small>W</small></button>
        <button type="button" class="ability-button"><strong>Dragon</strong><small>E</small></button>
        <button type="button" class="ability-button"><strong>Death Beam</strong><small>F</small></button>
        <button type="button" class="ability-button"><strong>Apocalypse</strong><small>G</small></button>
      </section>

      <section id="main-menu" class="main-menu">
        <div class="menu-mark">${GAME_TEXT.title}</div>
        <p>Hold the line until the sky catches fire.</p>
        <nav><button id="menu-play" type="button">Play</button><button id="menu-upgrades" type="button">Upgrades</button><button id="menu-armory" type="button">Armory</button><button id="menu-statistics" type="button">Statistics</button><button id="menu-settings" type="button">Settings</button></nav>
      </section>
      <section id="settings-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Settings</strong><button id="settings-close" type="button">Close</button></div><label>Master Volume <input id="setting-master" type="range" min="0" max="1" step="0.05"></label><label>SFX Volume <input id="setting-sfx" type="range" min="0" max="1" step="0.05"></label><label><input id="setting-shake" type="checkbox"> Screen Shake</label><label><input id="setting-damage-numbers" type="checkbox"> Damage Numbers</label></section>
      <section id="statistics-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Lifetime Statistics</strong><button id="statistics-close" type="button">Close</button></div><div class="statistics-grid"><span>Runs <b id="stats-runs">0</b></span><span>Total Kills <b id="stats-kills">0</b></span><span>Total Gold <b id="stats-gold">0</b></span><span>Best Run <b id="stats-best-kills">0</b></span></div></section>
      <section id="armory-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Armory</strong><button id="armory-close" type="button">Close</button></div><div class="statistics-grid"><span>Ballista <b>Online</b></span><span>Cannon <b id="armory-cannon">Locked, 15 Tokens</b></span><span>Fire Tower <b id="armory-fire">Locked, 30 Tokens</b></span><span>Lightning Tower <b id="armory-lightning">Locked, 55 Tokens</b></span></div></section>

      <section id="meta-menu" class="meta-menu" hidden>
        <canvas id="skill-tree-canvas"></canvas>
        <div class="skill-currency">
          <span class="resource token"><i></i><b id="tokens-value">0</b></span>
          <span class="resource level"><i></i><b id="level-value">0</b></span>
          <span class="resource wave"><i></i><b id="wave-value">Ready</b></span>
        </div>
        <div id="skill-tooltip" class="skill-tooltip" hidden></div>
        <div id="skill-hints" class="controls-hint skill-hints">
          <button id="skill-hints-close" type="button" aria-label="Dismiss controls">X</button>
          <span><i class="mouse left"></i>Buy Upgrades</span>
          <span><i class="mouse middle"></i>Pan Camera</span>
          <span><i class="mouse wheel"></i>Zoom</span>
        </div>
        <button id="meta-close" type="button" class="skill-close">Close</button>
        <button id="skill-play" type="button" class="skill-play">Play</button>
      </section>

      <button id="meta-button" type="button" class="corner-button">Upgrades</button>
      <div class="corner-readout"><span>FPS <b id="fps-value">60</b></span></div>
    </section>

    <aside id="debug-panel" class="debug-panel" hidden>
      <div class="debug-title"><strong>Performance Monitor</strong><span>F2</span></div>
      <div class="debug-readout"><span>FPS <b id="debug-fps">60</b></span><span>Enemies <b id="debug-enemies">0</b></span><span>Projectiles <b id="debug-projectiles">0</b></span><span>Dropped bolts <b id="debug-dropped-projectiles">0</b></span><span>Effects <b id="debug-effects">0</b></span><span>Grid cells <b id="debug-cells">0</b></span><span>Spawned <b id="debug-spawned">0</b></span></div>
      <div class="debug-actions"><button id="debug-spawn-100" type="button">Spawn 100</button><button id="debug-spawn-500" type="button">Spawn 500</button><button id="debug-spawn-1000" type="button">Spawn 1,000</button><button id="debug-spawn-5000" type="button">Spawn 5,000</button><button id="debug-spawn-10000" type="button">Spawn 10,000</button><button id="debug-boss" type="button">Spawn Boss</button><button id="debug-elite" type="button">Spawn Elite</button><button id="debug-end-run" type="button">End Run</button><button id="debug-kill-all" type="button">Kill All</button><button id="debug-gold" type="button">Add Gold</button><button id="debug-heal" type="button">Heal Wall</button><button id="debug-invincible" type="button">Invincible</button><button id="debug-speed" type="button">Game Speed</button></div>
      <div id="debug-mode" class="debug-mode">Speed 1x Invincible Off</div>
    </aside>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const progression = new MetaProgression();
const audio = new AudioSystem();
audio.setSettings(progression.settings);

const hud = new HUD(() => game.startBattle());
const results = new ResultsScreen(
  () => {
    results.hide();
    metaMenu.show();
  },
  () => {
    results.hide();
    game.restart();
  },
);
const game = new Game(canvas, hud, progression, (breakdown, survived) => results.show(survived, breakdown));
const buildBar = new BuildBar((kind) => game.setArmedKind(kind));
const abilityPanel = new AbilityPanel((id) => { game.activateAbility(id); audio.playAbility(); }, (id) => game.isAbilityUnlocked(id));
const metaMenu = new MetaMenu(progression, (visible) => game.setProgressionOpen(visible), () => game.start());
new MenuViews(progression, audio, () => game.start(), () => metaMenu.show());
const debugPanel = new DebugPanel({
  spawnHorde: (count) => game.spawnHorde(count),
  killAll: () => game.killAll(),
  addGold: () => game.addGold(),
  healWall: () => game.healWall(),
  toggleInvincibility: () => game.toggleInvincibility(),
  increaseGameSpeed: () => game.increaseGameSpeed(),
  spawnBoss: () => game.spawnBoss(),
  spawnElite: () => game.spawnElite(),
  endRun: () => game.forceEndRun(),
});

document.querySelector<HTMLButtonElement>('#controls-hint-close')!.addEventListener('click', () => {
  document.querySelector<HTMLElement>('#controls-hint')!.hidden = true;
});

new GameLoop((deltaTime) => {
  game.updateSimulation(deltaTime);
}, (fps) => {
  game.render(fps);
  debugPanel.update(game.debugState);
  abilityPanel.update((id) => game.getAbilityCooldown(id));
  buildBar.update(game.buildSlotStates(), game.currentPhase === 'build');
}).start();
