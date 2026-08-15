# The Last Wall

## [Play the game](https://aaronc1992.github.io/the-last-wall/)

The Last Wall is a browser tower defense game about defending a gate against large armies moving through carved valleys. The battlefield is a physical terrain grid: enemies travel through lower valley cells while towers stand on the elevated ground around them.

The game is built around prediction and placement. Towers do not automatically track enemies. During Build Mode, place each tower, aim its firing geometry, and lock the setup before the wave begins.

## Game features

### Physical valley maps

* Buildable cells form the elevated plateau.
* Valley cells are the only normal enemy routes.
* Blocked cells are unusable terrain.
* Spawn and Goal cells are special valley cells.
* Cliff edges are generated from the terrain grid.
* Towers cannot be placed where their full footprint touches a valley or blocked cell.
* Projectiles can enter a valley from the plateau but stop when they hit a cliff or exit the valley.

### Flow field enemy navigation

Enemies use a shared flow field rather than individual path searches. The movement system includes:

* Smoothed cell center steering
* Directional inertia around corners
* Look ahead checks
* Anti backtracking
* Lightweight congestion scoring
* Route commitment at branches
* Lower cost recovery for stuck units
* Boss clearance checks for narrow routes

Normal enemies flow toward the gate efficiently. Armored enemies and Bosses can favor less defended routes using the current tower threat map.

## Towers

Every tower uses a fixed firing setup selected during Build Mode. Towers do not rotate toward enemies or search the battlefield for targets.

* **Ballista** fires fast, penetrating bolts down a fixed straight line. It is strongest on long firing lanes.
* **Cannon** fires heavy shells along a fixed line and detonates at a chosen distance. It is strongest against dense lines and choke points.
* **Mortar** repeatedly bombards one selected target area with delayed shells and scatter. It is strongest at merges and pileups.
* **Fire Tower** applies burn inside a fixed cone. It is strongest near narrow bends and close corridors.
* **Lightning Tower** starts chains only inside a fixed target zone. It is strongest against localized groups.

### Tower setup

1. Select a tower from the Build Bar.
2. Place it on valid elevated ground.
3. Select or drag the tower to set its firing direction or target area.
4. Press Space or Start Battle to lock the setup.

Range upgrades now extend the relevant firing line, cone, or target distance. Blast radius upgrades enlarge fixed impact areas. Cone and zone upgrades change the displayed geometry.

## Enemies

The game currently has six enemy types:

* **Grunt** is the standard mass infantry unit.
* **Runner** is fast and favors shorter routes.
* **Brute** is slow, durable, and deals heavy gate damage.
* **Armored** evaluates defended routes and seeks weaker branches.
* **Exploder** prioritizes reaching the gate quickly.
* **Boss** is a durable strategic unit that considers threat and route clearance.

## Campaign

There are ten campaign levels using the same physical terrain engine:

1. **The First Approach** introduces a winding valley.
2. **The Bend** teaches long lanes and repeated turns.
3. **The Fork** introduces route splitting and merging.
4. **The Crossroads** uses multiple spawn streams.
5. **The Bottleneck** creates a central pressure point.
6. **Twin Ravines** separates the early routes before a late merge.
7. **The Serpent** uses a long sequence of turns.
8. **Three Ways** offers multiple route choices.
9. **The Flood** combines branches and a large horde.
10. **The Last Valley** combines multiple spawns, routes, turns, and final convergence.

Campaign waves contain 1,000 enemies on Level 1, increasing by 1,000 per level to 10,000 on Level 10. Enemies are released in controlled bursts so the browser can process the horde without spawning every unit in one frame.

## Map Builder

The Map Builder uses the same `60 x 36` terrain grid as the campaign maps. Start with elevated Buildable terrain and carve valleys with the brush tools.

Available tools include:

* Valley
* Buildable
* Blocked
* Spawn
* Goal
* Erase
* Small, medium, and large brushes
* Undo and redo
* Flow field path testing
* JSON import and export
* Save and Play

Maps are validated before saving or playing. Validation checks dimensions, terrain data, Spawn placement, Goal placement, buildable space, and connectivity from every Spawn to the Goal.

Custom maps are stored separately from progression data and do not award permanent War Tokens.

## Permanent Tech Tree

War Tokens are spent in the permanent Tech Tree. The tree controls:

* Tower unlocks
* Tower placement slots
* Ballista damage and fire rate
* Cannon, Fire Tower, Lightning Tower, and Mortar improvements
* Wall health and armor
* Starting Gold
* Enemy rewards
* War Token rewards
* Ability unlocks

The Settings menu includes **Reset and Start Over**, which clears progression, campaign completion, custom maps, and saved tower layouts after confirmation.

## Controls

* Click **Play Campaign** to choose a campaign level.
* Click **Custom Maps** to play, edit, delete, import, or export maps.
* Click **Map Builder** to create a valley map.
* Press `1` through `5` to select towers during Build Mode.
* Click to place or select a tower.
* Drag a selected tower to set its aim.
* Right click a tower to remove it during Build Mode.
* Press `Space` to start the wave.
* Press `Q`, `W`, `E`, `F`, or `G` to use unlocked abilities.
* Press `R` to remove all towers during Build Mode.
* Use the mouse wheel to zoom and the middle mouse button to pan.
* Press `F2` to open the performance monitor.
* Press `T` to toggle the defense threat map.

## Local development

### Requirements

* Node.js
* npm

### Start locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

The game deploys to GitHub Pages when changes are pushed to `master`.

## Project structure

* `src/core` contains game state, input, camera, and the fixed simulation loop.
* `src/enemies` contains enemy storage, behavior profiles, and movement.
* `src/map` contains terrain grids, flow fields, campaign maps, validation, and map storage.
* `src/progression` contains the permanent Tech Tree and War Token progression.
* `src/rendering` contains Canvas rendering layers and targeting previews.
* `src/systems` contains saving, waves, congestion, threat maps, audio, and feedback.
* `src/ui` contains menus, HUD, Build Mode, Map Builder, and debug tools.
* `src/weapons` contains towers, targeting configurations, and projectiles.

## Technology

The game uses TypeScript, Vite, HTML Canvas, browser local storage, typed arrays, a fixed simulation loop, and no external game engine.
