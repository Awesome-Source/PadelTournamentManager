# Padel Tournament Manager

A static web app for running padel **Americano** tournaments. It has no backend: all data is stored in the browser's `localStorage`, and every change is saved as soon as you make it.

## Features

- **Classic Americano.** Every player partners with every other player exactly once. Opponents are spread as evenly as possible.
- **Team Americano.** Fixed teams of two. Every team plays every other team once.
- **4-step wizard** for setting up a tournament: format, players and teams, points, settings. If you reload mid-setup, the wizard picks up where you left off.
- **Two point modes:**
  - "Points per round": the other score fills in automatically so the two always add up to the round total.
  - "Win / Tie / Loss points".
- **Live leaderboard.** Choose the rank mode (won points, number of wins or point difference) and a tie break rule.
- **Winner shout out.** Once a tournament is finished, the leaderboard congratulates the winner below a trophy.
- **Export for finished tournaments.** Download the leaderboard or all matches as CSV, or copy the leaderboard as plain text to paste into a messenger.
- **Dark mode** (default) and **light mode**.

## Run locally

The app uses ES modules, so it has to be served over HTTP. It does not work when `index.html` is opened directly from disk (`file://`). Any static file server works, for example:

```sh
npx serve .
```
