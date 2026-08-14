import './style.css';
import { Game } from './core/Game';
import { GameLoop } from './core/GameLoop';
import { GAME_TEXT } from './core/Constants';
import { HUD } from './ui/HUD';
import { DebugPanel } from './ui/DebugPanel';
import { UpgradeMenu } from './ui/UpgradeMenu';
import { MetaProgression } from './progression/MetaProgression';
import { MetaMenu } from './ui/MetaMenu';
import { AbilityPanel } from './ui/AbilityPanel';
import { AudioSystem } from './systems/AudioSystem';
import { MenuViews } from './ui/MenuViews';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="game-shell">
    <header class="topbar">
      <div class="brand">${GAME_TEXT.title}<span>${GAME_TEXT.phase}</span></div>
      <div class="stat"><small>Wall Integrity</small><strong id="wall-value">100 / 100</strong></div>
      <div class="stat"><small>Enemies</small><strong id="enemy-value">0</strong></div>
      <div class="stat"><small>Gold</small><strong id="gold-value">0</strong></div>
      <div class="stat kill-stat"><small>Kills</small><strong id="kills-value">0</strong></div>
      <div class="stat"><small>Level</small><strong id="level-value">0</strong></div>
      <div class="stat"><small>Wave</small><strong id="wave-value">Ready</strong></div>
      <button id="meta-button" type="button" class="stat meta-button"><small>War Tokens</small><strong id="tokens-value">0</strong></button>
      <div class="stat"><small>FPS</small><strong id="fps-value">60</strong></div>
    </header>
    <section class="battlefield">
      <canvas id="game-canvas" aria-label="The Last Wall battlefield"></canvas>
      <div id="map-intro" class="map-intro" hidden><strong>THE LAST WALL</strong><span>KING'S APPROACH</span></div>
      <div id="horde-announcement" class="horde-announcement" hidden></div>
      <div id="game-over" class="game-over" hidden>
        <h1>${GAME_TEXT.gameOver}</h1>
        <p>Your defenses held for as long as they could.</p>
        <p>War Tokens Earned <strong id="earned-tokens">0</strong></p>
        <button id="restart-button" type="button">${GAME_TEXT.restart}</button>
      </div>
      <div id="upgrade-menu" class="upgrade-menu" hidden>
        <div class="upgrade-heading"><span>Level Up</span><strong>Choose One Upgrade</strong></div>
        <div class="upgrade-options">
          <button type="button" class="upgrade-card"><span class="upgrade-rarity"></span><strong class="upgrade-name"></strong><small class="upgrade-description"></small></button>
          <button type="button" class="upgrade-card"><span class="upgrade-rarity"></span><strong class="upgrade-name"></strong><small class="upgrade-description"></small></button>
          <button type="button" class="upgrade-card"><span class="upgrade-rarity"></span><strong class="upgrade-name"></strong><small class="upgrade-description"></small></button>
        </div>
      </div>
      <section id="main-menu" class="main-menu">
        <div class="menu-mark">THE LAST WALL</div>
        <p>Hold the line until the sky catches fire.</p>
        <nav><button id="menu-play" type="button">Play</button><button id="menu-upgrades" type="button">Upgrades</button><button id="menu-armory" type="button">Armory</button><button id="menu-statistics" type="button">Statistics</button><button id="menu-settings" type="button">Settings</button></nav>
      </section>
      <section id="settings-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Settings</strong><button id="settings-close" type="button">Close</button></div><label>Master Volume <input id="setting-master" type="range" min="0" max="1" step="0.05"></label><label>SFX Volume <input id="setting-sfx" type="range" min="0" max="1" step="0.05"></label><label><input id="setting-shake" type="checkbox"> Screen Shake</label><label><input id="setting-damage-numbers" type="checkbox"> Damage Numbers</label></section>
      <section id="statistics-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Lifetime Statistics</strong><button id="statistics-close" type="button">Close</button></div><div class="statistics-grid"><span>Runs <b id="stats-runs">0</b></span><span>Total Kills <b id="stats-kills">0</b></span><span>Total Gold <b id="stats-gold">0</b></span><span>Best Run <b id="stats-best-kills">0</b></span></div></section>
      <section id="armory-menu" class="menu-panel" hidden><div class="panel-heading"><strong>Armory</strong><button id="armory-close" type="button">Close</button></div><div class="statistics-grid"><span>Ballista <b>Online</b></span><span>Cannon <b id="armory-cannon">Locked, 15 Tokens</b></span><span>Fire Tower <b id="armory-fire">Locked, 30 Tokens</b></span><span>Lightning Tower <b id="armory-lightning">Locked, 55 Tokens</b></span></div></section>
    </section>
    <section id="meta-menu" class="meta-menu" hidden>
      <div class="meta-header"><div><span>Permanent Progression</span><strong>War Tokens <b id="meta-tokens">0</b></strong></div><button id="meta-close" type="button" aria-label="Close permanent upgrades">Close</button></div>
      <div id="meta-upgrades" class="meta-upgrades"></div>
    </section>
    <aside id="debug-panel" class="debug-panel" hidden>
      <div class="debug-title"><strong>Performance Monitor</strong><span>F2</span></div>
      <div class="debug-readout"><span>FPS <b id="debug-fps">60</b></span><span>Enemies <b id="debug-enemies">0</b></span><span>Projectiles <b id="debug-projectiles">0</b></span><span>Dropped bolts <b id="debug-dropped-projectiles">0</b></span><span>Effects <b id="debug-effects">0</b></span><span>Grid cells <b id="debug-cells">0</b></span><span>Spawned <b id="debug-spawned">0</b></span></div>
      <div class="debug-actions"><button id="debug-spawn-100" type="button">Spawn 100</button><button id="debug-spawn-500" type="button">Spawn 500</button><button id="debug-spawn-1000" type="button">Spawn 1,000</button><button id="debug-spawn-5000" type="button">Spawn 5,000</button><button id="debug-spawn-10000" type="button">Spawn 10,000</button><button id="debug-boss" type="button">Spawn Boss</button><button id="debug-elite" type="button">Spawn Elite</button><button id="debug-end-run" type="button">End Run</button><button id="debug-kill-all" type="button">Kill All</button><button id="debug-gold" type="button">Add Gold</button><button id="debug-heal" type="button">Heal Wall</button><button id="debug-invincible" type="button">Invincible</button><button id="debug-speed" type="button">Game Speed</button></div>
      <div id="debug-mode" class="debug-mode">Speed 1x Invincible Off</div>
    </aside>
    <section class="ability-strip" aria-label="Abilities">
      <button type="button" class="ability-button"><strong>Meteor</strong><small>1</small></button>
      <button type="button" class="ability-button"><strong>Artillery</strong><small>2</small></button>
      <button type="button" class="ability-button"><strong>Dragon</strong><small>3</small></button>
      <button type="button" class="ability-button"><strong>Death Beam</strong><small>4</small></button>
      <button type="button" class="ability-button"><strong>Apocalypse</strong><small>5</small></button>
    </section>
    <footer><span>Ballista online</span><div class="shop"><button id="buy-damage" type="button">Bolt Damage <small>15 Gold</small></button><button id="buy-speed" type="button">Winch Speed <small>20 Gold</small></button><button id="build-cannon" type="button">Build Cannon <small>150 Gold</small></button><button id="build-fire" type="button">Build Fire <small>240 Gold</small></button><button id="build-lightning" type="button">Build Lightning <small>360 Gold</small></button><button id="repair-wall" type="button">Repair Wall <small>40 Gold</small></button></div></footer>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
let game: Game;
const progression = new MetaProgression();
const audio = new AudioSystem();
audio.setSettings(progression.settings);
const hud = new HUD(() => game.restart());
const upgradeMenu = new UpgradeMenu((index) => game.chooseUpgrade(index), () => game.buyDamageUpgrade(), () => game.buySpeedUpgrade());
game = new Game(canvas, hud, progression, (choices) => upgradeMenu.show(choices));
const abilityPanel = new AbilityPanel((id) => { game.activateAbility(id); audio.playAbility(); }, (id) => game.isAbilityUnlocked(id));
const metaMenu = new MetaMenu(progression, (visible) => game.setProgressionOpen(visible));
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
document.querySelector<HTMLButtonElement>('#build-cannon')!.addEventListener('click', () => game.buildWeapon('cannon'));
document.querySelector<HTMLButtonElement>('#build-fire')!.addEventListener('click', () => game.buildWeapon('fireTower'));
document.querySelector<HTMLButtonElement>('#build-lightning')!.addEventListener('click', () => game.buildWeapon('lightningTower'));
document.querySelector<HTMLButtonElement>('#repair-wall')!.addEventListener('click', () => game.repairWall());
const updateEconomyButtons = () => {
  const state = game.economyState;
  const configure = (id: string, unlocked: boolean, built: boolean, cost: number) => {
    const button = document.querySelector<HTMLButtonElement>(`#${id}`)!;
    const label = button.firstChild!;
    const detail = button.querySelector<HTMLElement>('small')!;
    if (!unlocked) { button.disabled = true; label.textContent = id === 'build-cannon' ? 'Build Cannon ' : id === 'build-fire' ? 'Build Fire ' : 'Build Lightning '; detail.textContent = 'LOCKED'; return; }
    if (built) { button.disabled = true; detail.textContent = 'BUILT'; return; }
    button.disabled = state.gold < cost;
    detail.textContent = `${cost} Gold`;
  };
  configure('build-cannon', state.cannonUnlocked, state.cannonBuilt, 150);
  configure('build-fire', state.fireUnlocked, state.fireBuilt, 240);
  configure('build-lightning', state.lightningUnlocked, state.lightningBuilt, 360);
  const repair = document.querySelector<HTMLButtonElement>('#repair-wall')!;
  repair.disabled = state.gold < 40 || state.wallFull;
};
new GameLoop((deltaTime) => {
  game.updateSimulation(deltaTime);
}, (fps) => {
  game.render(fps);
  debugPanel.update(game.debugState);
  upgradeMenu.updateShop(game.shopState);
  abilityPanel.update((id) => game.getAbilityCooldown(id));
  updateEconomyButtons();
}).start();
