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

Most towers use a fixed firing setup selected during Build Mode. Tesla Coil provides an automatic local defense zone, and Sniper Tower selects high priority targets inside its manually aimed sector.

* **Ballista** fires fast, penetrating bolts down a fixed straight line. It is strongest on long firing lanes.
* **Cannon** fires heavy shells along a fixed line and detonates at a chosen distance. It is strongest against dense lines and choke points.
* **Mortar** repeatedly bombards one selected target area with delayed shells and scatter. It is strongest at merges and pileups.
* **Fire Tower** applies burn inside a fixed cone. It is strongest near narrow bends and close corridors.
* **Lightning Tower** starts chains only inside a fixed target zone. It is strongest against localized groups.
* **Tesla Coil** automatically attacks nearby enemies inside its local zone.
* **Sniper Tower** automatically prioritizes Bosses and Elite enemies inside its selected sector.

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

There are twenty campaign levels using the same physical terrain engine and intentional enemy encounters:

1. **The Long Approach** teaches Ballista placement and aiming.
2. **The Wide Bend** introduces Runners.
3. **The Watchtower Road** increases Runner pressure.
4. **The Serpent Road** introduces Brutes.
5. **The Gateway** introduces Armored route choices.
6. **The Forked Road** splits the assault across lanes.
7. **The Three Bridges** introduces Exploders.
8. **The Outer Ring** adds mixed forces and early Elites.
9. **The Crossing** brings the first Boss.
10. **The Four Winds** creates a major mixed assault.
11. **The Braided Valley** adds elite mixed streams.
12. **The Split Canyon** specializes Armored lanes.
13. **The Five Lanterns** increases route pressure.
14. **The Deep Maze** combines smart route choices.
15. **The Siegeworks** begins the elite siege.
16. **The Storm Front** assigns enemy types by lane.
17. **The Five Fangs** increases lane specialization.
18. **The Mirror Pass** adds another Boss push.
19. **The Last Labyrinth** fields multiple Bosses.
20. **The Twentyfold Wall** uses every enemy category.

Campaign encounters introduce Runners, Brutes, Armored enemies, Exploders, Elites, and Bosses progressively. Groups have independent start delays, spawn intervals, burst sizes, announcements, and lane preferences, so battles arrive as staged assaults rather than one queue. Total scheduled enemies range from about 350 on Level 1 to more than 10,000 on Level 20.

Campaign victories award one to three Gate Stars based on remaining health. The best rating for each level is saved and shown in level select. Campaign rewards use level value, kills, Gate Stars, first clear bonuses, and Tech Tree multipliers. Elapsed time does not increase rewards, and Custom Maps award no permanent tokens.

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
* Tower damage, fire rate, range, and build cost
* Ballista penetration and multishot
* Cannon cluster shells, double barrel, and carpet bombardment
* Fire Tower wildfire
* Mortar double salvo
* Tesla shock and chain split
* Sniper piercing rounds
* Wall health and armor
* Starting Build Points and salvage resources
* War Token rewards
* Ability unlocks

The Settings menu includes **Reset and Start Over**, which backs up the save, then clears progression, campaign completion, custom maps, and saved tower layouts after confirmation.

## Controls

* Click **Play Campaign** to choose a campaign level.
* Click **Custom Maps** to play, edit, delete, import, or export maps.
* Click **Map Builder** to create a valley map.
* Press `1` through `7` to select towers during Build Mode.
* Click to place or select a tower.
* Drag a selected tower to set its aim.
* Right click a tower to remove it during Build Mode.
* Press `Space` to start the wave.
* Press `Q`, `W`, `E`, `F`, or `G` to use unlocked abilities.
* Press `R` to remove all towers during Build Mode.
* Use the mouse wheel to zoom and the middle mouse button to pan.
* Press `F2` to open the performance monitor.
* Press `T` to toggle the defense threat map.
* Click the speed control or press `+` and `-` to change game speed.

### Validation

```bash
npm test
npm run build
```

GitHub Pages deployment runs both commands before uploading the site.

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
