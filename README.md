# The Last Wall

## [Start the game](https://aaronc1992.github.io/the-last-wall/)

The Last Wall is a browser defense game about holding a fortified frontier against an ever growing horde. Build your defenses, choose powerful upgrades, unlock new weapons, and survive as long as you can.

The play link above is ready for GitHub Pages when deployment is enabled. To play immediately on your computer, follow the local setup below.

## Features

* Defend the wall through escalating waves of enemies
* Upgrade bolt damage and winch speed during each run
* Build the cannon, fire tower, and lightning tower
* Choose from level up upgrades as your run develops
* Spend War Tokens on permanent progression
* Use abilities including Meteor, Artillery, Dragon, Death Beam, and Apocalypse
* Track lifetime runs, kills, gold, and your best run
* Adjust audio, screen shake, and damage number settings

## Controls

* Click **Play** to begin a run
* Use the upgrade and build buttons at the bottom of the screen
* Press `1` through `5` to activate abilities
* Press `F2` to open the performance monitor

## Local development

### Requirements

* Node.js
* npm

### Start the game locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite in your browser.

### Build for production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Project structure

* `src/core` contains the game state and simulation loop
* `src/enemies` contains enemy definitions and spawning
* `src/map` contains map generation and rendering support
* `src/progression` contains upgrades and permanent progression
* `src/systems` contains audio, saving, feedback, and wave systems
* `src/ui` contains menus, the HUD, and game panels
* `src/weapons` contains towers and projectile management

## Technology

The game is built with TypeScript, Vite, and the HTML canvas API.