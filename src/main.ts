import './style.css';
import { Game } from './core/Game';
import { GameLoop } from './core/GameLoop';
import { GAME_TEXT } from './core/Constants';
import { HUD } from './ui/HUD';
import { DebugPanel } from './ui/DebugPanel';
import { MetaProgression } from './progression/MetaProgression';
import { MetaMenu } from './ui/MetaMenu';
import { AbilityPanel } from './ui/AbilityPanel';
import { CAMPAIGN_MAPS } from './map/CampaignMaps';
import { AudioSystem } from './systems/AudioSystem';
import { MenuViews } from './ui/MenuViews';
import { BuildBar } from './ui/BuildBar';
import { ResultsScreen } from './ui/ResultsScreen';
import { MapBuilder } from './ui/MapBuilder';
import { UpgradeMenu } from './ui/UpgradeMenu';

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
          <span class="resource gold"><i></i><small>Build Points</small><b id="build-points-value">0</b></span>
          <span class="resource kills"><i></i><small>Kills</small><b id="kills-value">0</b></span>
          <span class="resource enemies"><i></i><small>Enemies</small><b id="enemy-value">0</b></span>
        </div>
      </div>

      <aside id="tower-stock" class="tower-stock" aria-label="Tower stock"></aside>

      <div id="horde-announcement" class="horde-announcement" hidden></div>
      <div id="build-banner" class="build-banner" hidden><strong>BUILD PHASE</strong><span>Press SPACE to start battle</span></div>

      <div id="controls-hint" class="controls-hint">
        <button id="controls-hint-close" type="button" aria-label="Dismiss controls">X</button>
        <div id="controls-hint-content"></div>
      </div>

      <div id="build-bar" class="build-bar" hidden></div>
      <button id="start-battle" type="button" class="start-battle" hidden>Start Battle</button>
      <button id="build-settings-button" type="button" class="build-settings-button" hidden>Settings</button>
      <button id="in-game-menu-button" type="button" class="main-menu-button" hidden>Main Menu</button>

      <div id="results-screen" class="results-screen" hidden>
        <h1 id="results-title">Survived</h1>
        <div id="results-rows" class="results-rows"></div>
        <div class="results-actions">
          <button id="results-next-level" type="button" hidden>Next Level</button>
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
        <nav><button id="menu-play" type="button">Play Campaign</button><button id="menu-custom-maps" type="button">Custom Maps</button><button id="menu-map-builder" type="button">Map Builder</button><button id="menu-upgrades" type="button">Tech Tree</button><button id="menu-tutorial" type="button">Tutorial</button><button id="menu-settings" type="button">Settings</button></nav>
      </section>
      <section id="tutorial-menu" class="menu-panel tutorial-menu" hidden><div class="panel-heading"><strong>How to Play</strong><button id="tutorial-close" type="button">Back</button></div><div class="tutorial-grid"><section><h2>Defend the Gate</h2><p>Build towers on high ground, aim every tower, then start the battle. Enemies follow the valleys toward your castle gate.</p><p>Use different tower types together. Ballistas provide reliable fire, Cannons strike groups, Fire Towers burn crowds, Lightning chains between enemies, and Mortars hit distant areas.</p></section><section><h2>Build and Aim</h2><p>Choose a tower from the build bar, tap or click a buildable location, then aim it toward the enemy paths.</p><p>You can move towers and change their aim during the build phase. The gate area must remain open so enemies can reach the wall.</p></section><section><h2>Abilities</h2><p>Select an ability, then choose a target on the battlefield. Apocalypse is map wide and activates immediately.</p><p>Abilities have long cooldowns, so save them for dense groups, dangerous enemies, or moments when several routes converge.</p></section><section><h2>Progression</h2><p>Survive campaign levels to earn War Tokens. Spend them in the Tech Tree to unlock towers, abilities, stronger attacks, lower costs, extra slots, and faster cooldowns.</p><p>You need at least three kills in a campaign round to earn token rewards.</p></section><section><h2>PC Controls</h2><p><b>Left click:</b> Select, place, or target.</p><p><b>Left drag:</b> Move or aim towers, or pan on empty terrain.</p><p><b>Right click:</b> Remove a tower.</p><p><b>Middle drag and mouse wheel:</b> Pan and zoom.</p><p><b>W, A, S, D or arrow keys:</b> Pan the camera.</p><p><b>Z:</b> Zoom to fit whole map.</p><p><b>Q, W, E, F, G:</b> Activate abilities.</p><p><b>R:</b> Remove all towers during build. <b>Escape:</b> Cancel targeting.</p></section><section><h2>Mobile Controls</h2><p><b>Tap:</b> Select, place, or target.</p><p><b>Drag a tower:</b> Move or aim it.</p><p><b>Drag empty terrain:</b> Pan around the larger map.</p><p><b>Pinch:</b> Zoom the camera.</p><p><b>Ability buttons:</b> Choose an ability, then tap its battlefield target.</p><p>Use the build phase Settings button to adjust graphics and open the full Controls guide.</p></section></div></section>
      <section id="campaign-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Campaign</strong><button id="campaign-close" type="button">Close</button></div><div id="campaign-levels" class="statistics-grid"></div></section>
      <section id="custom-maps-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Custom Maps</strong><button id="custom-maps-close" type="button">Close</button></div><div id="custom-map-list" class="statistics-grid"></div><button id="custom-map-import" type="button">Import Map</button><input id="custom-map-file" type="file" accept="application/json" hidden></section>
      <section id="map-builder" class="menu-panel map-builder" hidden><div class="panel-heading"><strong>Map Builder</strong><button id="map-builder-close" type="button">Close</button></div><div class="builder-layout"><div class="builder-tools"><button data-tool="path" type="button">Valley</button><button data-tool="buildable" type="button">Buildable</button><button data-tool="blocked" type="button">Blocked</button><button data-tool="spawn" type="button">Spawn</button><button data-tool="goal" type="button">Goal</button><button data-tool="erase" type="button">Erase</button><button data-brush="1" type="button">Small Brush</button><button data-brush="2" type="button">Medium Brush</button><button data-brush="4" type="button">Large Brush</button></div><canvas id="map-builder-canvas"></canvas><div class="builder-side"><label>Name <input id="map-builder-name" value="MY VALLEY" maxlength="40"></label><p id="map-builder-status">Paint a valley, then add a Spawn and Gate.</p><button id="map-builder-configure" type="button">Configure Battle</button><div id="map-builder-config" class="builder-config" hidden><label>Total Enemies <input id="map-enemy-count" type="number" min="100" max="100000" step="100" value="500"></label><label>Enemies Per Burst <input id="map-spawn-burst" type="number" min="1" max="400" step="1" value="80"></label><label>Spawn Interval <input id="map-spawn-interval" type="number" min="0.025" max="1" step="0.005" value="0.14"></label><label>Difficulty <select id="map-difficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option><option value="insane">Insane</option></select></label><label>Enemy Types <select id="map-variety"><option value="basic">Basic only</option><option value="mixed" selected>Mixed forces</option><option value="elite">Elite forces</option></select></label></div><button id="map-builder-undo" type="button">Undo</button><button id="map-builder-redo" type="button">Redo</button><button id="map-builder-test-paths" type="button">Test Paths</button><button id="map-builder-save" type="button">Save</button><button id="map-builder-play" type="button">Play</button><input id="map-builder-import" type="file" accept="application/json"></div></div></section>
      <section id="settings-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Settings</strong><button id="settings-close" type="button">Close</button></div><button id="open-graphics" type="button" class="settings-feature-button">Graphics</button><button id="open-controls" type="button" class="settings-feature-button">Controls</button><label>Master Volume <input id="setting-master" type="range" min="0" max="1" step="0.05"></label><label><span>SFX Volume</span><span class="settings-inline"><input id="setting-sfx" type="range" min="0" max="1" step="0.05"><button id="sfx-cheat" type="button" class="cheat-button" aria-label="Activate a secret cheat">X</button></span></label><label><input id="setting-shake" type="checkbox"> Screen Shake</label><label><input id="setting-damage-numbers" type="checkbox"> Damage Numbers</label><div class="settings-danger"><strong>Reset Game</strong><span>Erase progression, custom maps, and saved tower layouts.</span><button id="settings-reset" type="button">Reset and Start Over</button></div></section>
      <section id="graphics-menu" class="menu-panel graphics-menu" hidden><div class="panel-heading"><strong>Graphics</strong><button id="graphics-close" type="button">Back</button></div><p class="graphics-summary">Choose a preset, then tune individual battlefield effects to match your device.</p><label><span>Preset</span><select id="setting-graphics"><option value="low">Low, faster performance</option><option value="medium">Medium, balanced</option><option value="high">High, full effects</option></select></label><div class="graphics-grid"><label><span>Screen Shake</span><input id="setting-shake-graphics" type="checkbox"></label><label><span>Damage Numbers</span><input id="setting-damage-numbers-graphics" type="checkbox"></label><label><span>Blood and Scorch Decals</span><input id="setting-decals" type="checkbox"></label><label><span>Tower Fire and Laser Effects</span><input id="setting-tower-effects" type="checkbox"></label><label><span>Ability Particles</span><input id="setting-ability-effects" type="checkbox"></label><label><span>Status Effect Animations</span><input id="setting-status-effects" type="checkbox"></label><label><span>Animated Gate Torches</span><input id="setting-gate-torches" type="checkbox"></label><label><span>Detailed Enemy Rendering</span><input id="setting-enemy-detail" type="checkbox"></label></div><div class="graphics-actions"><button id="graphics-low" type="button">Performance Defaults</button><button id="graphics-high" type="button">Visual Defaults</button></div></section>
      <section id="controls-menu" class="menu-panel controls-menu" hidden><div class="panel-heading"><strong>Controls</strong><button id="controls-close" type="button">Back</button></div><div class="controls-guide"><section><h2>PC</h2><p><b>Left click</b> Select a tower or place an armed tower.</p><p><b>Left drag</b> Move a tower, aim a tower, or pan on empty terrain.</p><p><b>Right click</b> Remove a tower.</p><p><b>Middle drag</b> Pan the camera.</p><p><b>Mouse wheel</b> Zoom the camera.</p><p><b>Z</b> Zoom to fit whole map.</p><p><b>Q, W, E, F, G</b> Select abilities.</p><p><b>W, A, S, D or arrow keys</b> Pan the camera.</p><p><b>R</b> Remove all towers during build.</p><p><b>Escape</b> Cancel targeting or deselect a tower.</p></section><section><h2>Mobile</h2><p><b>Tap</b> Select, place, or target.</p><p><b>Drag on a tower</b> Move or aim it.</p><p><b>Drag empty terrain</b> Pan the camera.</p><p><b>Pinch or use the browser zoom gesture</b> Zoom the camera.</p><p><b>Ability buttons</b> Choose an ability, then tap the battlefield target.</p><p><b>Settings</b> Open this guide or adjust graphics at any time.</p></section></div></section>
      <section id="statistics-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Lifetime Statistics</strong><button id="statistics-close" type="button">Close</button></div><div class="statistics-grid"><span>Runs <b id="stats-runs">0</b></span><span>Total Kills <b id="stats-kills">0</b></span><span>Total Build Points <b id="stats-gold">0</b></span><span>Best Run <b id="stats-best-kills">0</b></span></div></section>
      <section id="armory-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Armory</strong><button id="armory-close" type="button">Close</button></div><div class="statistics-grid"><span>Ballista <b>Online</b></span><span>Cannon <b id="armory-cannon">Locked, 15 Tokens</b></span><span>Fire Tower <b id="armory-fire">Locked, 30 Tokens</b></span><span>Lightning Tower <b id="armory-lightning">Locked, 55 Tokens</b></span><span>Mortar <b id="armory-mortar">Locked, 45 Tokens</b></span></div></section>

      <section id="meta-menu" class="meta-menu" hidden>
        <canvas id="skill-tree-canvas"></canvas>
        <div class="skill-currency">
          <span class="resource token"><i></i><strong>War Tokens</strong><b id="tokens-value">0</b></span>
        </div>
        <div class="skill-legend" aria-label="Tech Tree legend">
          <strong>TECH TREE LEGEND</strong>
          <span><i class="legend-swatch offense"></i>Offense, Ballista damage and fire rate</span>
          <span><i class="legend-swatch defense"></i>Defense, wall strength and Cannon plans</span>
          <span><i class="legend-swatch economy"></i>Economy, Build Points and War Token rewards</span>
          <span><i class="legend-swatch arcane"></i>Arcane, Fire, Lightning and Mortar plans</span>
          <span><i class="legend-swatch abilities"></i>Abilities, battlefield powers</span>
          <small>All purchases use blue War Tokens earned from completed runs. Branch colors show what a node improves.</small>
        </div>
        <div id="skill-tooltip" class="skill-tooltip" hidden></div>
        <div id="skill-hints" class="controls-hint skill-hints">
          <button id="skill-hints-close" type="button" aria-label="Dismiss controls">X</button>
          <span><i class="mouse left"></i>Buy Upgrades</span>
          <span><i class="mouse middle"></i>Pan Camera</span>
          <span><i class="mouse wheel"></i>Zoom</span>
        </div>
        <button id="meta-close" type="button" class="skill-close">Close</button>
        <button id="skill-play" type="button" class="skill-play">Back</button>
      </section>

      <button id="meta-button" type="button" class="corner-button">Upgrades</button>
      <div class="corner-readout"><span>FPS <b id="fps-value">60</b></span></div>
    </section>

    <aside id="debug-panel" class="debug-panel" hidden>
      <div class="debug-title"><strong>Performance Monitor</strong><span>F2</span></div>
      <div class="debug-readout"><span>FPS <b id="debug-fps">60</b></span><span>Enemies <b id="debug-enemies">0</b></span><span>Projectiles <b id="debug-projectiles">0</b></span><span>Dropped bolts <b id="debug-dropped-projectiles">0</b></span><span>Effects <b id="debug-effects">0</b></span><span>Stuck recoveries <b id="debug-stuck">0</b></span><span>Grid cells <b id="debug-cells">0</b></span><span>Spawned <b id="debug-spawned">0</b></span></div>
      <div class="debug-actions"><button id="debug-spawn-100" type="button">Spawn 100</button><button id="debug-spawn-500" type="button">Spawn 500</button><button id="debug-spawn-1000" type="button">Spawn 1,000</button><button id="debug-spawn-5000" type="button">Spawn 5,000</button><button id="debug-spawn-10000" type="button">Spawn 10,000</button><button id="debug-boss" type="button">Spawn Boss</button><button id="debug-elite" type="button">Spawn Elite</button><button id="debug-end-run" type="button">End Run</button><button id="debug-kill-all" type="button">Kill All</button><button id="debug-gold" type="button">Add Build Points</button><button id="debug-heal" type="button">Heal Wall</button><button id="debug-invincible" type="button">Invincible</button><button id="debug-speed" type="button">Game Speed</button></div>
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
    metaMenu.show(() => results.showLast());
  },
  () => {
    results.hide();
    game.restart();
  },
  () => {
    const currentIndex = CAMPAIGN_MAPS.findIndex((map) => map.id === game.activeMap.id);
    const nextMap = currentIndex >= 0 ? CAMPAIGN_MAPS[currentIndex + 1] : undefined;
    if (!nextMap) return;
    results.hide();
    game.loadMap(nextMap);
    game.start();
  },
);
let game: Game;
const upgradeMenu = new UpgradeMenu((index) => game.chooseUpgrade(index));
game = new Game(canvas, hud, progression, (breakdown, survived) => {
  const currentIndex = CAMPAIGN_MAPS.findIndex((map) => map.id === game.activeMap.id);
  const nextMap = survived && currentIndex >= 0 ? CAMPAIGN_MAPS[currentIndex + 1] : undefined;
  results.show(survived, breakdown, nextMap?.name ?? null);
}, (choices) => upgradeMenu.show(choices));
const buildBar = new BuildBar((kind) => game.setArmedKind(kind));
const abilityPanel = new AbilityPanel((id) => { game.activateAbility(id); audio.playAbility(); }, (id) => game.isAbilityUnlocked(id));
const metaMenu = new MetaMenu(progression, (visible) => game.setProgressionOpen(visible), () => {
  if (game.currentPhase === 'idle') document.querySelector<HTMLElement>('#main-menu')!.hidden = false;
});
const mapBuilder = new MapBuilder((map) => { game.loadMap(map); game.start(); });
const menuViews = new MenuViews(
  progression,
  audio,
  () => menuViews.showCampaign((map) => { game.loadMap(map); game.start(); document.querySelector<HTMLElement>('#campaign-menu')!.hidden = true; }),
  () => metaMenu.show(),
  () => mapBuilder.show(),
  (map) => { game.loadMap(map); game.start(); document.querySelector<HTMLElement>('#custom-maps-menu')!.hidden = true; },
  (map) => { mapBuilder.open(map); document.querySelector<HTMLElement>('#custom-maps-menu')!.hidden = true; },
  () => {
    progression.reset();
    localStorage.removeItem('the-last-wall-custom-maps');
    const layoutKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith('the-last-wall-layout-')) layoutKeys.push(key);
    }
    for (const key of layoutKeys) localStorage.removeItem(key);
    window.location.reload();
  },
);
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

const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
document.querySelector<HTMLElement>('#controls-hint-content')!.innerHTML = isMobileDevice
  ? '<span><i class="mouse left"></i>Tap to Select or Place</span><span><i class="mouse left"></i>Drag Towers or Pan</span><span><i class="mouse key">Q</i>Tap Ability, then Tap Target</span><span><i class="mouse wheel"></i>Pinch to Zoom</span>'
  : '<span><i class="mouse left"></i>Click to Select or Place</span><span><i class="mouse left"></i>Drag Towers or Pan</span><span><i class="mouse right"></i>Remove Tower</span><span><i class="mouse key">Z</i>Zoom to Fit Map</span><span><i class="mouse key">R</i>Remove all Towers</span><span><i class="mouse middle"></i>Pan Camera</span><span><i class="mouse wheel"></i>Zoom</span>';

document.querySelector<HTMLButtonElement>('#controls-hint-close')!.addEventListener('click', () => {
  document.querySelector<HTMLElement>('#controls-hint')!.hidden = true;
});
document.querySelector<HTMLButtonElement>('#in-game-menu-button')!.addEventListener('click', () => {
  game.returnToMainMenu();
  document.querySelector<HTMLElement>('#main-menu')!.hidden = false;
});

new GameLoop((deltaTime) => {
  game.updateSimulation(deltaTime);
}, (fps) => {
  game.render(fps);
  metaMenu.setBattleMode(game.currentPhase === 'battle', () => game.endRound());
  document.querySelector<HTMLButtonElement>('#in-game-menu-button')!.hidden = game.currentPhase === 'idle';
  document.querySelector<HTMLButtonElement>('#build-settings-button')!.hidden = game.currentPhase !== 'build';
  debugPanel.update(game.debugState);
  abilityPanel.update((id) => game.getAbilityCooldown(id), (id) => game.getAbilityTotalCooldown(id));
  buildBar.update(game.buildSlotStates(), game.currentPhase === 'build', game.armedKind());
}).start();
