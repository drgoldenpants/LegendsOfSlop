# Legends Of Slop

Initial playable browser MOBA prototype inspired by core League-style conventions: teams push minion waves, break turrets in order, then destroy the enemy nexus. This version is intentionally accelerated and reduced to a single main lane plus jungle camps so it is easy to test on a LAN and expand later.

## Features

- Browser-based LAN multiplayer hosted from one computer
- Authoritative Node server with no external dependencies
- Three generated shape heroes: circle diver, square tank, triangle ranged carry
- One-lane MOBA loop with minions, outer and inner turrets, nexus, recall, gold, levels, respawns, and neutral camps
- Bot fill so the prototype is still playable with one human
- Canvas-rendered procedural visuals instead of external art assets
- Soft-follow camera with edge panning to emulate a League-like feel

## Run

```bash
npm start
```

The server binds to `0.0.0.0:3000` and prints LAN URLs in the terminal. Open one of those URLs from other devices on the same network.

## Generate Art Assets

The game currently renders procedural shapes, but this repo now includes a standalone OpenAI image-generation script for creating splash art, key art, and icon sheets from a YAML preset file at `assets/prompts/league-of-shapes.yaml`.

1. Set your API key in the shell:

```bash
export OPENAI_API_KEY=your_key_here
```

Or put it in the local YAML config file:

```yaml
openai:
  apiKey: "your_key_here"
  imageModel: "gpt-image-1.5"
```

Use [`config/local/openai.yaml`](/Users/110663/Gibson/LeagueOfShapes/config/local/openai.yaml) for your local key. That directory is gitignored. A template is included at [`config/openai.example.yaml`](/Users/110663/Gibson/LeagueOfShapes/config/openai.example.yaml).

2. List the built-in presets:

```bash
npm run generate:assets -- --list
```

3. Generate one preset:

```bash
npm run generate:assets -- --preset circle-diver-splash
```

4. Generate all presets into `public/generated-assets`:

```bash
npm run generate:assets -- --all
```

5. Generate a one-off asset with your own prompt:

```bash
npm run generate:assets -- --prompt "Top-down jungle camp concept art with geometric stone golem monsters" --name jungle-camp
```

Useful flags:

- `--count 2` to request multiple variants
- `--size 1024x1024` or `--size 1536x1024`
- `--background transparent` for icon-style outputs
- `--dry-run` to inspect prompts without calling the API

The default model is `gpt-image-1.5`. Override it with `OPENAI_IMAGE_MODEL` if you want a different supported image model.

## Controls

- `Right click`: move
- `Q/W/E`: cast abilities at cursor
- `B`: recall to fountain after a short channel
- `1`: buy attack upgrade while in fountain
- `2`: buy vitality upgrade while in fountain
- `3`: buy haste upgrade while in fountain
- `Space`: re-center camera
- `Mouse near viewport edge`: pan camera

## Prototype Notes

- Structures can only be damaged in order, and only while allied minions are near them.
- Neutral camps grant a short team buff and team gold.
- If a player disconnects for about 20 seconds, that hero is removed and bots refill the team.
- This is a foundation for later expansion, not a feature-complete MOBA.

## Expansion Targets

- Replace HTTP polling with WebSockets
- Add lane selection, multiple lanes, shop items, and base inhibitors
- Add matchmaking/lobby controls and host authority tools
- Add pathfinding around terrain and richer bot behaviors
