const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nameInput = document.getElementById("nameInput");
const joinButton = document.getElementById("joinButton");
const heroCards = [...document.querySelectorAll(".hero-card")];
const teamCards = [...document.querySelectorAll(".team-option")];
const heroPreview = document.getElementById("heroPreview");
const heroRole = document.getElementById("heroRole");
const heroName = document.getElementById("heroName");
const heroSummary = document.getElementById("heroSummary");
const heroStrengths = document.getElementById("heroStrengths");
const heroWeaknesses = document.getElementById("heroWeaknesses");
const statusText = document.getElementById("statusText");
const heroPreviewFrame = document.querySelector(".hero-preview-frame");
const topbar = document.getElementById("topbar");
const feed = document.getElementById("feed");
const hud = document.getElementById("hud");
const shop = document.getElementById("shop");
const minimap = document.getElementById("minimap");
const scoreboard = document.getElementById("scoreboard");
const overlay = document.getElementById("overlay");
const splashScreen = document.getElementById("splashScreen");
const lobbyScreen = document.getElementById("lobbyScreen");
const lobbyTeamRosters = document.getElementById("lobbyTeamRosters");
const floatingTooltip = document.createElement("div");
floatingTooltip.className = "floating-tooltip hidden";
document.body.appendChild(floatingTooltip);

const ISO_X = 0.33;
const ISO_Y = 0.18;
const LANE_LABELS = { top: "Top", mid: "Mid", bot: "Bot" };
const TEAM_CLASS = { blue: "team-blue", red: "team-red", neutral: "team-neutral" };
const SESSION_STORAGE_KEY = "league_of_shapes_session";
const HERO_KEYS = ["circle", "square", "triangle", "hex", "diamond", "nova", "onyx"];
const FOG_CELL_SIZE = 220;
const SPRITE_SHEET_LAYOUT = { cols: 4, rows: 2 };
const DEFAULT_VIEW_ZOOM = 0.95;
const MIN_VIEW_ZOOM = 0.7;
const MAX_VIEW_ZOOM = 1.4;
const HARDWARE_THREADS = navigator.hardwareConcurrency || 4;
const CONNECTION_SAVER = Boolean(navigator.connection?.saveData);
const LOW_PERF_MODE = CONNECTION_SAVER || HARDWARE_THREADS <= 4;
const HUD_REFRESH_MS = LOW_PERF_MODE ? 140 : 80;
const MINIMAP_REFRESH_MS = LOW_PERF_MODE ? 220 : 120;
const TOPBAR_REFRESH_MS = LOW_PERF_MODE ? 180 : 100;
const FEED_REFRESH_MS = 180;
const SHOP_REFRESH_MS = LOW_PERF_MODE ? 220 : 120;
const SCOREBOARD_REFRESH_MS = 160;
const ART_ASSET_PATHS = {
  laneKeyArt: "/game-assets/lane-key-art.png",
  menuUiKit: "/game-assets/menu-ui-kit.png",
  hudFrame: "/game-assets/hud-frame.png",
  buttonsIconsSheet: "/game-assets/buttons-icons-sheet.png",
  abilityIconsSheet: "/game-assets/ability-icons-sheet.png",
  heroCircle: "/game-assets/hero-circle.png",
  heroCircleSheet: "/game-assets/hero-circle-sheet.png",
  heroSquare: "/game-assets/hero-square.png",
  heroSquareSheet: "/game-assets/hero-square-sheet.png",
  heroTriangle: "/game-assets/hero-triangle.png",
  heroTriangleSheet: "/game-assets/hero-triangle-sheet.png",
  heroHex: "/game-assets/hero-hex.png",
  heroHexSheet: "/game-assets/hero-hex-sheet.png",
  heroDiamond: "/game-assets/hero-diamond.png",
  heroDiamondSheet: "/game-assets/hero-diamond-sheet.png",
  heroNova: "/game-assets/hero-nova.png",
  heroNovaSheet: "/game-assets/hero-nova-sheet.png",
  heroOnyx: "/game-assets/hero-onyx.png",
  heroOnyxSheet: "/game-assets/hero-onyx-sheet.png",
  heroCircleSplash: "/game-assets/hero-circle-splash.png",
  heroSquareSplash: "/game-assets/hero-square-splash.png",
  heroTriangleSplash: "/game-assets/hero-triangle-splash.png",
  heroHexSplash: "/game-assets/hero-hex-splash.png",
  heroDiamondSplash: "/game-assets/hero-diamond-splash.png",
  heroNovaSplash: "/game-assets/hero-nova-splash.png",
  heroOnyxSplash: "/game-assets/hero-onyx-splash.png",
  structureTurret: "/game-assets/structure-turret.png",
  structureNexus: "/game-assets/structure-nexus.png",
  structureRedTurret: "/game-assets/structure-red-turret.png",
  structureRedNexus: "/game-assets/structure-red-nexus.png",
  creepBlueMelee: "/game-assets/creep-blue-melee.png",
  creepBlueMeleeSheet: "/game-assets/creep-blue-melee-sheet.png",
  creepBlueRanged: "/game-assets/creep-blue-ranged.png",
  creepBlueRangedSheet: "/game-assets/creep-blue-ranged-sheet.png",
  creepBlueSiege: "/game-assets/creep-blue-siege.png",
  creepBlueSiegeSheet: "/game-assets/creep-blue-siege-sheet.png",
  creepRedMelee: "/game-assets/creep-red-melee.png",
  creepRedMeleeSheet: "/game-assets/creep-red-melee-sheet.png",
  creepRedRanged: "/game-assets/creep-red-ranged.png",
  creepRedRangedSheet: "/game-assets/creep-red-ranged-sheet.png",
  creepRedSiege: "/game-assets/creep-red-siege.png",
  creepRedSiegeSheet: "/game-assets/creep-red-siege-sheet.png",
  neutralCreep: "/game-assets/neutral-creep.png",
  neutralCreepSheet: "/game-assets/neutral-creep-sheet.png",
  neutralElite: "/game-assets/neutral-elite.png",
  neutralEliteSheet: "/game-assets/neutral-elite-sheet.png",
  laneStoneTexture: "/game-assets/lane-stone-texture.png",
  jungleGrassTexture: "/game-assets/jungle-grass-texture.png",
  baseFloorTexture: "/game-assets/base-floor-texture.png"
};
const artImages = Object.fromEntries(
  Object.entries(ART_ASSET_PATHS).map(([key, src]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    return [key, image];
  })
);
const artPatterns = new Map();
const artOpaqueBounds = new Map();

const state = {
  ws: null,
  token: "",
  heroType: "circle",
  preferredTeam: "auto",
  joined: false,
  snapshot: null,
  scoreboardOpen: false,
  camera: { x: 0, y: 0 },
  cameraOverride: null,
  mouse: { x: 0, y: 0, worldX: 0, worldY: 0 },
  moveTarget: null,
  selectedTargetId: "",
  selectedTargetType: "",
  actions: [],
  actionId: 0,
  zoom: DEFAULT_VIEW_ZOOM,
  zoomTarget: DEFAULT_VIEW_ZOOM,
  splashDismissed: false,
  closeReason: "",
  connecting: false,
  inputLoopStarted: false,
  targetingAbility: null,
  lobbyRosterPollStarted: false,
  lobbyRosterIntervalId: 0,
  shopFeedback: "",
  lastShopClick: {
    key: "",
    at: 0
  },
  entityFacing: new Map(),
  entityMotion: new Map(),
  fogMemory: {
    team: "",
    worldWidth: 0,
    worldHeight: 0,
    seen: new Set()
  },
  uiRefreshAt: {
    topbar: 0,
    feed: 0,
    hud: 0,
    shop: 0,
    minimap: 0,
    scoreboard: 0
  }
};

const audioState = {
  ctx: null,
  enabled: false,
  initialized: false,
  master: null,
  musicGain: null,
  sfxGain: null,
  nextMusicAt: 0,
  musicStep: 0,
  seenEffects: new Set(),
  seenMessages: new Set()
};

function loadSavedSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function trimSeenSet(set, maxSize = 160) {
  if (set.size <= maxSize) return;
  const overflow = set.size - maxSize;
  let index = 0;
  for (const key of set) {
    set.delete(key);
    index += 1;
    if (index >= overflow) break;
  }
}

function ensureAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioState.ctx) {
    audioState.ctx = new AudioCtx();
    audioState.master = audioState.ctx.createGain();
    audioState.musicGain = audioState.ctx.createGain();
    audioState.sfxGain = audioState.ctx.createGain();
    audioState.master.gain.value = 0.34;
    audioState.musicGain.gain.value = 0.18;
    audioState.sfxGain.gain.value = 0.24;
    audioState.musicGain.connect(audioState.master);
    audioState.sfxGain.connect(audioState.master);
    audioState.master.connect(audioState.ctx.destination);
  }
  if (audioState.ctx.state === "suspended") {
    audioState.ctx.resume().catch(() => {});
  }
  audioState.enabled = true;
  return audioState.ctx;
}

function playTone({ frequency = 440, type = "sine", duration = 0.12, volume = 0.08, attack = 0.005, release = 0.09, when = 0, destination = "sfx", detune = 0, frequencyEnd = 0 }) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const output = destination === "music" ? audioState.musicGain : audioState.sfxGain;
  const startAt = Math.max(ctx.currentTime, when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  osc.detune.setValueAtTime(detune, startAt);
  if (frequencyEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequencyEnd), startAt + duration);
  }
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + Math.max(attack + 0.01, duration + release));
  osc.connect(gain);
  gain.connect(output);
  osc.start(startAt);
  osc.stop(startAt + duration + release + 0.02);
}

function playNoiseBurst({ duration = 0.12, volume = 0.05, when = 0, highpass = 700 }) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const startAt = Math.max(ctx.currentTime, when || 0);
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(highpass, startAt);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioState.sfxGain);
  source.start(startAt);
  source.stop(startAt + duration + 0.02);
}

function scheduleMusic() {
  const ctx = ensureAudio();
  if (!ctx || !state.joined) return;
  const lookAhead = 0.8;
  const stepDuration = 0.42;
  const root = state.snapshot?.you?.team === "red" ? 174.61 : 164.81;
  const phrase = [1, 1.25, 1.5, 1.25, 1.125, 1.25, 1.5, 1.75];
  if (!audioState.nextMusicAt) {
    audioState.nextMusicAt = ctx.currentTime + 0.05;
  }
  while (audioState.nextMusicAt < ctx.currentTime + lookAhead) {
    const step = audioState.musicStep % phrase.length;
    const nextAt = audioState.nextMusicAt;
    const note = root * phrase[step];
    playTone({ frequency: note, type: "triangle", duration: 0.22, volume: 0.04, when: nextAt, destination: "music" });
    playTone({ frequency: note * 0.5, type: "sine", duration: 0.28, volume: 0.03, when: nextAt, destination: "music" });
    if (step % 2 === 0) {
      playTone({ frequency: note * 1.5, type: "sine", duration: 0.12, volume: 0.018, when: nextAt + 0.08, destination: "music" });
    }
    audioState.nextMusicAt += stepDuration;
    audioState.musicStep += 1;
  }
}

function playUiSound(kind) {
  if (!audioState.enabled) return;
  if (kind === "join") {
    playTone({ frequency: 392, type: "triangle", duration: 0.14, volume: 0.06 });
    playTone({ frequency: 523.25, type: "triangle", duration: 0.16, volume: 0.05, when: ensureAudio()?.currentTime + 0.08 });
  } else if (kind === "buy") {
    playTone({ frequency: 660, type: "square", duration: 0.08, volume: 0.045 });
    playTone({ frequency: 880, type: "triangle", duration: 0.1, volume: 0.04, when: ensureAudio()?.currentTime + 0.05 });
  } else if (kind === "upgrade") {
    playTone({ frequency: 523.25, type: "triangle", duration: 0.08, volume: 0.05 });
    playTone({ frequency: 659.25, type: "triangle", duration: 0.1, volume: 0.045, when: ensureAudio()?.currentTime + 0.05 });
    playTone({ frequency: 783.99, type: "triangle", duration: 0.12, volume: 0.04, when: ensureAudio()?.currentTime + 0.1 });
  } else if (kind === "recall") {
    playTone({ frequency: 240, type: "sine", duration: 0.2, volume: 0.04, frequencyEnd: 360 });
  } else if (kind === "error") {
    playTone({ frequency: 220, type: "square", duration: 0.05, volume: 0.04, frequencyEnd: 180 });
    playTone({ frequency: 180, type: "square", duration: 0.07, volume: 0.032, when: ensureAudio()?.currentTime + 0.04, frequencyEnd: 140 });
  }
}

function heroCastStyle(heroType, slot) {
  return {
    circle: { q: "comet-dash", w: "pulse-ring", e: "slipstream" },
    square: { q: "bulwark-ram", w: "guard-field", e: "quake" },
    triangle: { q: "bolt", w: "fan-burst", e: "beamline" },
    hex: { q: "arc-lash", w: "thunder-bloom", e: "flash-step" },
    diamond: { q: "piercing-round", w: "lock-on", e: "snapback" },
    nova: { q: "solar-mend", w: "bastion-link", e: "lumen-wave" },
    onyx: { q: "earthsplitter", w: "iron-roar", e: "titan-march" }
  }[heroType]?.[slot] || "";
}

function requiresAbilityClickTarget(heroType, slot) {
  return Boolean({
    hex: { w: true }
  }[heroType]?.[slot]);
}

function updateCanvasCursor() {
  canvas.style.cursor = state.targetingAbility ? "crosshair" : "";
}

function cancelAbilityTargeting() {
  if (!state.targetingAbility) return;
  state.targetingAbility = null;
  updateCanvasCursor();
}

function startAbilityTargeting(slot) {
  const heroType = state.snapshot?.you?.heroType;
  if (!heroType) return;
  state.targetingAbility = { slot, heroType };
  updateCanvasCursor();
}

function commitAbilityTargeting(x, y) {
  const targeting = state.targetingAbility;
  if (!targeting) return;
  playAbilityStyleSound(heroCastStyle(targeting.heroType, targeting.slot));
  queueAction({ type: "cast", slot: targeting.slot, x, y });
  cancelAbilityTargeting();
}

function playAbilityStyleSound(style) {
  if (!audioState.enabled || !style) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (style === "comet-dash" || style === "flash-step" || style === "snapback") {
    playTone({ frequency: 320, type: "sawtooth", duration: 0.07, volume: 0.045, frequencyEnd: 960, when: now });
    playTone({ frequency: 760, type: "triangle", duration: 0.08, volume: 0.03, when: now + 0.02 });
    playNoiseBurst({ duration: 0.05, volume: 0.018, when: now + 0.01, highpass: 1800 });
  } else if (style === "pulse-ring" || style === "iron-roar") {
    playTone({ frequency: style === "iron-roar" ? 210 : 280, type: "triangle", duration: 0.16, volume: 0.05, frequencyEnd: 170, when: now });
    playTone({ frequency: style === "iron-roar" ? 420 : 560, type: "sine", duration: 0.18, volume: 0.028, when: now + 0.03 });
  } else if (style === "guard-field" || style === "bastion-link" || style === "lock-on") {
    playTone({ frequency: 440, type: "triangle", duration: 0.1, volume: 0.036, when: now });
    playTone({ frequency: 554.37, type: "triangle", duration: 0.12, volume: 0.03, when: now + 0.04 });
    playTone({ frequency: 659.25, type: "sine", duration: 0.16, volume: 0.022, when: now + 0.09 });
  } else if (style === "solar-mend" || style === "lumen-wave") {
    playTone({ frequency: 392, type: "sine", duration: 0.12, volume: 0.034, when: now });
    playTone({ frequency: 523.25, type: "triangle", duration: 0.16, volume: 0.03, when: now + 0.05 });
    playTone({ frequency: 783.99, type: "sine", duration: 0.12, volume: 0.02, when: now + 0.11 });
  } else if (style === "thunder-bloom" || style === "arc-lash") {
    playTone({ frequency: 260, type: "square", duration: 0.06, volume: 0.04, frequencyEnd: 640, when: now });
    playNoiseBurst({ duration: 0.045, volume: 0.018, when: now + 0.015, highpass: 2200 });
    playTone({ frequency: 620, type: "triangle", duration: 0.05, volume: 0.024, when: now + 0.03 });
  } else if (style === "beamline" || style === "piercing-round") {
    playTone({ frequency: 480, type: "square", duration: 0.08, volume: 0.036, frequencyEnd: 980, when: now });
    playTone({ frequency: 920, type: "sine", duration: 0.06, volume: 0.018, when: now + 0.02 });
  } else if (style === "fan-burst") {
    playTone({ frequency: 520, type: "triangle", duration: 0.05, volume: 0.03, when: now });
    playTone({ frequency: 620, type: "triangle", duration: 0.05, volume: 0.028, when: now + 0.02 });
    playTone({ frequency: 760, type: "triangle", duration: 0.06, volume: 0.024, when: now + 0.04 });
  } else if (style === "bulwark-ram" || style === "earthsplitter" || style === "quake" || style === "titan-march") {
    playTone({ frequency: 180, type: "sawtooth", duration: 0.1, volume: 0.05, frequencyEnd: 120, when: now });
    playNoiseBurst({ duration: 0.07, volume: 0.025, when: now + 0.02, highpass: 900 });
    playTone({ frequency: 240, type: "triangle", duration: 0.09, volume: 0.02, when: now + 0.03 });
  } else {
    playTone({ frequency: 430, type: "square", duration: 0.06, volume: 0.04, frequencyEnd: 620, when: now });
  }
}

function processSnapshotAudio(snapshot) {
  if (!audioState.enabled || !snapshot) return;

  for (const effect of snapshot.effects || []) {
    if (audioState.seenEffects.has(effect.id)) continue;
    audioState.seenEffects.add(effect.id);
    const anchorX = effect.x2 ?? effect.x;
    const anchorY = effect.y2 ?? effect.y;
    if (!isWorldPointOnScreen(anchorX, anchorY, 80)) {
      continue;
    }
    if (effect.type === "beam" || effect.type === "line") {
      const style = effect.style || "";
      if (
        style === "comet-dash" || style === "flash-step" || style === "snapback" || style === "pulse-ring"
        || style === "iron-roar" || style === "guard-field" || style === "bastion-link" || style === "lock-on"
        || style === "solar-mend" || style === "lumen-wave" || style === "thunder-bloom" || style === "arc-lash"
        || style === "beamline" || style === "piercing-round" || style === "fan-burst"
        || style === "bulwark-ram" || style === "earthsplitter" || style === "quake" || style === "titan-march"
      ) {
        playAbilityStyleSound(style);
      } else if (style === "quick-slash" || style === "heavy-cleave" || style === "minion-smack" || style === "beast-bite") {
        playTone({ frequency: 180, type: "triangle", duration: 0.06, volume: 0.035, frequencyEnd: 120 });
        playNoiseBurst({ duration: 0.05, volume: 0.02, highpass: 1200 });
      } else if (effect.sourceType === "turret" || effect.sourceType === "nexus") {
        playTone({ frequency: 210, type: "sawtooth", duration: 0.08, volume: 0.04, frequencyEnd: 280 });
      } else {
        playTone({ frequency: 360, type: "square", duration: 0.05, volume: 0.03, frequencyEnd: 520 });
      }
    } else if (effect.type === "burst") {
      playNoiseBurst({ duration: 0.08, volume: 0.028, highpass: 900 });
    } else if (effect.type === "guard" && effect.style === "fountain-aura") {
      playTone({ frequency: effect.team === "blue" ? 392 : 329.63, type: "sine", duration: 0.14, volume: 0.018 });
    }
  }
  trimSeenSet(audioState.seenEffects, 220);

  for (const message of snapshot.messages || []) {
    if (audioState.seenMessages.has(message.id)) continue;
    audioState.seenMessages.add(message.id);
    if (message.text.includes("eliminated")) {
      playTone({ frequency: 587.33, type: "triangle", duration: 0.12, volume: 0.04 });
      playTone({ frequency: 440, type: "triangle", duration: 0.16, volume: 0.032, when: ensureAudio()?.currentTime + 0.05 });
    } else if (message.text.includes("destroyed") || message.text.includes("shattered")) {
      playTone({ frequency: 220, type: "sawtooth", duration: 0.16, volume: 0.04, frequencyEnd: 140 });
      playNoiseBurst({ duration: 0.1, volume: 0.03, highpass: 700 });
    }
  }
  trimSeenSet(audioState.seenMessages, 80);
}

function unlockAudio() {
  if (audioState.initialized) return;
  audioState.initialized = true;
  ensureAudio();
}

function isWorldPointOnScreen(x, y, padding = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const screen = worldToScreen(x, y);
  return (
    screen.x >= -padding &&
    screen.x <= canvas.width + padding &&
    screen.y >= -padding &&
    screen.y <= canvas.height + padding
  );
}

function spawnLocalPing(x, y) {
  state.ping = {
    x,
    y,
    startedAt: Date.now()
  };
}

function shouldRefreshUi(key, interval, now = Date.now()) {
  if ((state.uiRefreshAt[key] || 0) <= now) {
    state.uiRefreshAt[key] = now + interval;
    return true;
  }
  return false;
}

function saveSession(data) {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures; reconnect still works within the current tab.
  }
}

function clearSavedSession() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function escapeTooltipText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderLobbyTeamSlots(team, players, teamSize) {
  const filled = players.map((player) => {
    const heroName = heroMeta[player.heroType]?.name || player.heroType || "Hero";
    const status = player.connected ? "Connected" : "Disconnected";
    return `
      <div class="lobby-team-slot">
        <div class="lobby-team-player">
          <strong>${escapeTooltipText(player.name || "Player")}</strong>
          <small>${escapeTooltipText(heroName)}</small>
        </div>
        <span class="lobby-team-presence">${status}</span>
      </div>
    `;
  });
  const emptyCount = Math.max(0, teamSize - players.length);
  const empty = Array.from({ length: emptyCount }, () => `
    <div class="lobby-team-slot empty">
      <span>Open slot</span>
    </div>
  `);
  const label = team === "blue" ? "Blue Team" : "Red Team";
  const teamClass = team === "blue" ? "team-blue" : "team-red";
  return `
    <section class="lobby-team-roster ${teamClass}">
      <div class="lobby-team-roster-head">
        <strong>${label}</strong>
        <span>${players.length} / ${teamSize}</span>
      </div>
      <div class="lobby-team-roster-list">
        ${[...filled, ...empty].join("")}
      </div>
    </section>
  `;
}

function updateLobbyRosters(roster) {
  if (!lobbyTeamRosters) return;
  const teamSize = Math.max(1, Number(roster?.teamSize) || 5);
  const blue = Array.isArray(roster?.blue) ? roster.blue : [];
  const red = Array.isArray(roster?.red) ? roster.red : [];
  lobbyTeamRosters.innerHTML = [
    renderLobbyTeamSlots("blue", blue, teamSize),
    renderLobbyTeamSlots("red", red, teamSize)
  ].join("");
}

async function refreshLobbyRosters() {
  if (state.joined) return;
  try {
    const response = await fetch("/lobby-state", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    if (!payload?.ok || !payload.roster) return;
    updateLobbyRosters(payload.roster);
  } catch {
    // Ignore polling failures while the server or connection is warming up.
  }
}

function ensureLobbyRosterPolling() {
  if (state.lobbyRosterPollStarted) return;
  state.lobbyRosterPollStarted = true;
  refreshLobbyRosters();
  state.lobbyRosterIntervalId = window.setInterval(() => {
    if (state.joined || state.connecting || state.splashDismissed === false) return;
    refreshLobbyRosters();
  }, 2000);
}

function hideFloatingTooltip() {
  floatingTooltip.classList.add("hidden");
  floatingTooltip.innerHTML = "";
}

function showFloatingTooltip(target, clientX, clientY) {
  if (!target) {
    hideFloatingTooltip();
    return;
  }
  const title = target.dataset.tooltipTitle || "";
  const body = target.dataset.tooltipBody || "";
  const extra = target.dataset.tooltipExtra || "";
  if (!title && !body && !extra) {
    hideFloatingTooltip();
    return;
  }

  floatingTooltip.innerHTML = `
    ${title ? `<strong>${title}</strong>` : ""}
    ${body ? `<span>${body}</span>` : ""}
    ${extra ? `<span>${extra}</span>` : ""}
  `;
  floatingTooltip.classList.remove("hidden");

  const offset = 16;
  const width = floatingTooltip.offsetWidth || 220;
  const height = floatingTooltip.offsetHeight || 80;
  const left = Math.min(window.innerWidth - width - 12, clientX + offset);
  const top = clientY + height + offset > window.innerHeight
    ? Math.max(12, clientY - height - offset)
    : clientY + offset;
  floatingTooltip.style.left = `${Math.max(12, left)}px`;
  floatingTooltip.style.top = `${top}px`;
}

function syncHeroSelection() {
  heroCards.forEach((item) => {
    item.classList.toggle("selected", item.dataset.hero === state.heroType);
  });

  const meta = heroMeta[state.heroType];
  if (!meta) return;

  if (heroPreview) {
    heroPreview.className = `lobby-preview portrait ${meta.shape || "circle"}`;
    heroPreview.style.color = meta.color || "#7fd6ff";
    applyTopdownArt(heroPreview, state.heroType);
    heroPreview.innerHTML = `
      <span class="portrait-glow"></span>
      <span class="portrait-motion"></span>
    `;
  }
  applyPreviewFrameArt(heroPreviewFrame, state.heroType);
  if (heroRole) heroRole.textContent = meta.role;
  if (heroName) heroName.textContent = meta.name;
  if (heroSummary) heroSummary.textContent = meta.summary;
  if (heroStrengths) {
    heroStrengths.innerHTML = meta.strengths.map((item) => `<li>${item}</li>`).join("");
  }
  if (heroWeaknesses) {
    heroWeaknesses.innerHTML = meta.weaknesses.map((item) => `<li>${item}</li>`).join("");
  }
}

function syncTeamSelection() {
  teamCards.forEach((item) => {
    item.classList.toggle("selected", item.dataset.team === state.preferredTeam);
  });
}

function heroSpriteKey(heroType) {
  return {
    circle: "heroCircle",
    square: "heroSquare",
    triangle: "heroTriangle",
    hex: "heroHex",
    diamond: "heroDiamond",
    nova: "heroNova",
    onyx: "heroOnyx"
  }[heroType] || "";
}

function heroSpriteSheetKey(heroType) {
  return {
    circle: "heroCircleSheet",
    square: "heroSquareSheet",
    triangle: "heroTriangleSheet",
    hex: "heroHexSheet",
    diamond: "heroDiamondSheet",
    nova: "heroNovaSheet",
    onyx: "heroOnyxSheet"
  }[heroType] || "";
}

function heroPortraitKey(heroType) {
  return {
    circle: "heroCircleSplash",
    square: "heroSquareSplash",
    triangle: "heroTriangleSplash",
    hex: "heroHexSplash",
    diamond: "heroDiamondSplash",
    nova: "heroNovaSplash",
    onyx: "heroOnyxSplash"
  }[heroType] || "";
}

function creepSpriteKey(entity) {
  if (!entity?.team || !entity?.kind) return "";
  const teamPrefix = entity.team === "blue" ? "creepBlue" : entity.team === "red" ? "creepRed" : "";
  const kindSuffix = entity.kind === "melee"
    ? "Melee"
    : entity.kind === "ranged"
      ? "Ranged"
      : entity.kind === "siege"
        ? "Siege"
        : "";
  return teamPrefix && kindSuffix ? `${teamPrefix}${kindSuffix}` : "";
}

function creepSpriteSheetKey(entity) {
  if (!entity?.team || !entity?.kind) return "";
  const teamPrefix = entity.team === "blue" ? "creepBlue" : entity.team === "red" ? "creepRed" : "";
  const kindSuffix = entity.kind === "melee"
    ? "MeleeSheet"
    : entity.kind === "ranged"
      ? "RangedSheet"
      : entity.kind === "siege"
        ? "SiegeSheet"
        : "";
  return teamPrefix && kindSuffix ? `${teamPrefix}${kindSuffix}` : "";
}

function neutralSpriteKey(entity) {
  if (!entity?.key) return "neutralCreep";
  return entity.key.includes("river") ? "neutralElite" : "neutralCreep";
}

function neutralSpriteSheetKey(entity) {
  if (!entity?.key) return "neutralCreepSheet";
  return entity.key.includes("river") ? "neutralEliteSheet" : "neutralCreepSheet";
}

function getArtImage(key) {
  const image = artImages[key];
  return image?.complete ? image : null;
}

function getOpaqueBounds(key, image) {
  if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) {
    return null;
  }

  if (artOpaqueBounds.has(key)) {
    return artOpaqueBounds.get(key);
  }

  const probeCanvas = document.createElement("canvas");
  probeCanvas.width = image.naturalWidth;
  probeCanvas.height = image.naturalHeight;
  const probeCtx = probeCanvas.getContext("2d", { willReadFrequently: true });
  probeCtx.drawImage(image, 0, 0);
  const { data, width, height } = probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 10) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const bounds = maxX >= minX && maxY >= minY
    ? {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
      }
    : {
        x: 0,
        y: 0,
        width,
        height
      };

  artOpaqueBounds.set(key, bounds);
  return bounds;
}

function getArtPattern(key, repeat = "repeat") {
  const image = getArtImage(key);
  if (!image) return null;
  const cacheKey = `${key}:${repeat}`;
  if (!artPatterns.has(cacheKey)) {
    artPatterns.set(cacheKey, ctx.createPattern(image, repeat));
  }
  return artPatterns.get(cacheKey);
}

function getHeroPortraitUrl(heroType) {
  const key = heroPortraitKey(heroType);
  return key ? ART_ASSET_PATHS[key] : "";
}

function getEntityPortraitUrl(entity, fallbackHeroType = state.heroType) {
  if (entity?.heroType) {
    return getHeroPortraitUrl(entity.heroType);
  }
  if (!entity) {
    return getHeroPortraitUrl(fallbackHeroType);
  }
  return ART_ASSET_PATHS.laneKeyArt;
}

function applyPortraitArt(element, heroType) {
  if (!element) return;
  const portraitUrl = getHeroPortraitUrl(heroType);
  if (portraitUrl) {
    element.style.setProperty("--portrait-image", `url("${portraitUrl}")`);
  } else {
    element.style.removeProperty("--portrait-image");
  }
}

function applyTopdownArt(element, heroType) {
  if (!element) return;
  const spriteKey = heroSpriteKey(heroType);
  const spriteUrl = spriteKey ? ART_ASSET_PATHS[spriteKey] : "";
  if (spriteUrl) {
    element.style.setProperty("--portrait-image", `url("${spriteUrl}")`);
  } else {
    element.style.removeProperty("--portrait-image");
  }
}

function applyPreviewFrameArt(element, heroType) {
  if (!element) return;
  const previewUrl = getHeroPortraitUrl(heroType) || ART_ASSET_PATHS.laneKeyArt;
  element.style.setProperty("--hero-preview-image", `url("${previewUrl}")`);
}

function decorateHeroCards() {
  for (const card of heroCards) {
    const portraitUrl = getHeroPortraitUrl(card.dataset.hero);
    if (portraitUrl) {
      card.style.setProperty("--card-art", `url("${portraitUrl}")`);
      card.classList.add("has-art");
    }
  }
}

const launchParams = new URLSearchParams(window.location.search);
const savedSession = loadSavedSession();
if (savedSession) {
  if (savedSession.token) {
    state.token = savedSession.token;
  }
  if (HERO_KEYS.includes(savedSession.heroType)) {
    state.heroType = savedSession.heroType;
  }
  if (["blue", "red", "auto"].includes(savedSession.preferredTeam)) {
    state.preferredTeam = savedSession.preferredTeam;
  }
  if (typeof savedSession.name === "string") {
    nameInput.value = savedSession.name;
  }
}
if (["blue", "red", "auto"].includes(launchParams.get("team"))) {
  state.preferredTeam = launchParams.get("team");
}

const heroMeta = {
  circle: {
    name: "Orbit Striker",
    shape: "circle",
    color: "#67d7ff",
    role: "Diver",
    summary: "A fast engager that dives through openings, bursts squishy targets, and gets out before the fight collapses.",
    strengths: [
      "High mobility for chasing, flanking, and quick escapes.",
      "Strong pick pressure on isolated ranged targets.",
      "Can rotate between lanes faster than the other shapes."
    ],
    weaknesses: [
      "Falls apart if caught in crowd control or layered focus fire.",
      "Needs timing and angles rather than front-to-back brawling.",
      "Lower durability when a dive extends too long."
    ],
    abilities: {
      q: { name: "Comet Dash", description: "Dash through targets to burst and reposition." },
      w: { name: "Pulse Ring", description: "Emit a ring that damages and disrupts nearby enemies." },
      e: { name: "Slipstream", description: "Gain a speed burst to chase or disengage." }
    }
  },
  square: {
    name: "Bulwark Block",
    shape: "square",
    color: "#ffb74d",
    role: "Vanguard",
    summary: "A heavy frontliner that absorbs pressure, anchors space for allies, and starts fights by forcing enemies backward.",
    strengths: [
      "Best durability and zone control in full team fights.",
      "Reliable frontline for sieges, objectives, and peel.",
      "Punishes enemies that stay grouped or overcommit."
    ],
    weaknesses: [
      "Slow rotations and weaker chase potential.",
      "Can be kited if it burns cooldowns too early.",
      "Depends on teammates to fully convert engages into kills."
    ],
    abilities: {
      q: { name: "Ram", description: "Crash forward and slam into the front line." },
      w: { name: "Guard Field", description: "Fortify yourself with a defensive pulse." },
      e: { name: "Quake", description: "Smash the ground to damage clustered foes." }
    }
  },
  triangle: {
    name: "Prism Ace",
    shape: "triangle",
    color: "#ff6f91",
    role: "Artillery",
    summary: "A long-range damage dealer that controls approach angles, chips teams down, and wins fights before they fully start.",
    strengths: [
      "Highest poke and lane pressure from safe range.",
      "Excellent at softening waves and clustered enemies.",
      "Threatens objectives and choke points without overexposing."
    ],
    weaknesses: [
      "Very vulnerable when collapsed on by divers.",
      "Needs spacing and frontline cover to keep firing.",
      "Positioning mistakes are punished immediately."
    ],
    abilities: {
      q: { name: "Shard Bolt", description: "Fire a fast piercing shot at long range." },
      w: { name: "Fan Burst", description: "Spread multiple shards across a wider angle." },
      e: { name: "Beamline", description: "Channel a straight beam through the fight." }
    }
  },
  hex: {
    name: "Storm Hex",
    shape: "hexagon",
    color: "#8f9bff",
    role: "Battlemage",
    summary: "A volatile skirmish mage that chains pressure through short windows, then blinks out before the counter-engage lands.",
    strengths: [
      "Strong mid-range burst with fast setup tools.",
      "Reliable follow-up stun for picks and river fights.",
      "Blink lets it force angles other casters cannot reach."
    ],
    weaknesses: [
      "Needs cooldown timing to stay threatening.",
      "Shorter reach than a pure artillery carry.",
      "Gets punished hard if the blink is spent poorly."
    ],
    abilities: {
      q: { name: "Arc Lash", description: "Launch a charged arc strike at medium range." },
      w: { name: "Thunder Bloom", description: "Detonate a storm burst in an area." },
      e: { name: "Flash Step", description: "Blink to a new angle before the counterattack." }
    }
  },
  diamond: {
    name: "Vector Viper",
    shape: "diamond",
    color: "#6dffb3",
    role: "Marksman",
    summary: "A precision carry built around lane pressure, long-range picks, and attack-speed windows that shred front lines.",
    strengths: [
      "Longest sustained basic attack reach in the roster.",
      "Excels at sieging and punishing exposed targets.",
      "Rapid-fire window melts tanks if left alone."
    ],
    weaknesses: [
      "Very fragile when divers reach the back line.",
      "Needs spacing and peel to maximize damage.",
      "Limited crowd control outside positioning."
    ],
    abilities: {
      q: { name: "Piercing Round", description: "Shoot a precise high-damage projectile." },
      w: { name: "Lock On", description: "Boost pressure with a focused firing window." },
      e: { name: "Snapback", description: "Reposition quickly to keep your spacing." }
    }
  },
  nova: {
    name: "Dawn Circuit",
    shape: "pentagon",
    color: "#ffd36e",
    role: "Enchanter",
    summary: "A utility support that stabilizes fights with healing, speed, and lane-wide beams that reward tight team positioning.",
    strengths: [
      "Strong sustain and protection in grouped fights.",
      "Can turn skirmishes by buffing the right ally on time.",
      "Excellent follow-through when teams fight front to back."
    ],
    weaknesses: [
      "Lower solo kill pressure than carries or bruisers.",
      "Needs allies nearby to unlock full value.",
      "Positioning is punishable if caught before cooldowns cycle."
    ],
    abilities: {
      q: { name: "Solar Mend", description: "Restore health with a burst of radiant energy." },
      w: { name: "Bastion Link", description: "Shield and stabilize an ally nearby." },
      e: { name: "Lumen Wave", description: "Send a wave that aids allies and hits enemies." }
    }
  },
  onyx: {
    name: "Rift Colossus",
    shape: "octagon",
    color: "#c792ff",
    role: "Juggernaut",
    summary: "A heavy bruiser that marches through choke points, shrugs off poke, and wins extended brawls with raw presence.",
    strengths: [
      "High base durability and strong close-range control.",
      "Excellent at forcing messy objective fights.",
      "Stays threatening even when low on mobility."
    ],
    weaknesses: [
      "Slowest roamer in the roster.",
      "Can be kited if it cannot stick to targets.",
      "Needs proximity to matter, so bad routes cost a lot."
    ],
    abilities: {
      q: { name: "Earthsplitter", description: "Drive forward with a crushing heavy strike." },
      w: { name: "Iron Roar", description: "Roar to heal and pressure nearby targets." },
      e: { name: "Titan March", description: "Empower yourself for an unstoppable advance." }
    }
  }
};

syncHeroSelection();
syncTeamSelection();
decorateHeroCards();
ensureLobbyRosterPolling();
teamCards.forEach((card) => {
  card.addEventListener("click", () => {
    state.preferredTeam = card.dataset.team;
    syncTeamSelection();
  });
});

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function teamColor(team, alpha = 1) {
  if (team === "blue") return `rgba(127, 214, 255, ${alpha})`;
  if (team === "red") return `rgba(255, 138, 128, ${alpha})`;
  return `rgba(231, 186, 99, ${alpha})`;
}

function projectDelta(dx, dy) {
  return {
    x: (dx - dy) * ISO_X * state.zoom,
    y: (dx + dy) * ISO_Y * state.zoom
  };
}

function normalizeAngle(angle) {
  let value = angle;
  while (value <= -Math.PI) value += Math.PI * 2;
  while (value > Math.PI) value -= Math.PI * 2;
  return value;
}

function lerpAngle(from, to, t) {
  const delta = normalizeAngle(to - from);
  return from + delta * t;
}

function syncEntityFacing(snapshot) {
  if (!snapshot?.heroes) return;

  const nextFacing = new Map();
  for (const hero of snapshot.heroes) {
    const previous = state.entityFacing.get(hero.id);
    let angle = previous?.angle ?? 0;
    let targetAngle = previous?.targetAngle ?? angle;

    if (previous) {
      const dx = hero.x - previous.x;
      const dy = hero.y - previous.y;
      if (Math.hypot(dx, dy) > 4) {
        const projected = projectDelta(dx, dy);
        targetAngle = Math.atan2(projected.y, projected.x) + Math.PI / 2;
      }
    }

    angle = lerpAngle(angle, targetAngle, 0.28);

    nextFacing.set(hero.id, { x: hero.x, y: hero.y, angle, targetAngle });
  }

  state.entityFacing = nextFacing;
}

function syncEntityMotion(snapshot) {
  if (!snapshot) return;

  const nextMotion = new Map();
  const animatedEntities = [
    ...(snapshot.heroes || []),
    ...(snapshot.minions || []),
    ...((snapshot.camps || []).filter((camp) => camp.alive))
  ];

  for (const entity of animatedEntities) {
    const previous = state.entityMotion.get(entity.id);
    const dx = previous ? entity.x - previous.x : 0;
    const dy = previous ? entity.y - previous.y : 0;
    const distanceMoved = Math.hypot(dx, dy);
    const moving = distanceMoved > 3;
    const projected = projectDelta(dx, dy);
    const moveCycle = moving
      ? ((previous?.moveCycle || 0) + distanceMoved / Math.max(entity.radius || 24, 1) * 0.18) % SPRITE_SHEET_LAYOUT.cols
      : 0;
    const mirrorX = moving && Math.abs(projected.x) > 0.5
      ? projected.x > 0
      : (previous?.mirrorX ?? true);

    nextMotion.set(entity.id, {
      x: entity.x,
      y: entity.y,
      moveCycle,
      moving,
      mirrorX
    });
  }

  state.entityMotion = nextMotion;
}

function worldToScreen(x, y) {
  const projected = projectDelta(x - state.camera.x, y - state.camera.y);
  return {
    x: canvas.width / 2 + projected.x,
    y: canvas.height / 2 + projected.y
  };
}

function screenToWorld(x, y) {
  const sx = (x - canvas.width / 2) / (ISO_X * state.zoom);
  const sy = (y - canvas.height / 2) / (ISO_Y * state.zoom);
  const dx = (sx + sy) / 2;
  const dy = (sy - sx) / 2;
  return {
    x: dx + state.camera.x,
    y: dy + state.camera.y
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function visionScale(snapshot) {
  return snapshot?.world?.width ? snapshot.world.width / 5600 : 1;
}

function visionRadius(kind, snapshot) {
  const scale = visionScale(snapshot);
  if (kind === "structure") return 1120 * scale;
  if (kind === "minion") return 720 * scale;
  return 940 * scale;
}

function alliedVisionSources(snapshot) {
  const team = snapshot?.you?.team;
  if (!team) return [];
  return [
    ...snapshot.heroes.filter((hero) => hero.alive && hero.team === team).map((hero) => ({ ...hero, visionType: "hero" })),
    ...snapshot.minions.filter((minion) => minion.team === team).map((minion) => ({ ...minion, visionType: "minion" })),
    ...snapshot.structures.filter((structure) => !structure.destroyed && structure.team === team).map((structure) => ({ ...structure, visionType: "structure" }))
  ];
}

function isPointVisible(x, y, snapshot = state.snapshot) {
  if (!snapshot?.you) return true;
  return alliedVisionSources(snapshot).some((source) => (
    Math.hypot(source.x - x, source.y - y) <= visionRadius(source.visionType, snapshot)
  ));
}

function ensureFogMemory(snapshot) {
  if (!snapshot?.you || !snapshot.world) return;
  const { team } = snapshot.you;
  const { width, height } = snapshot.world;
  if (
    state.fogMemory.team !== team ||
    state.fogMemory.worldWidth !== width ||
    state.fogMemory.worldHeight !== height
  ) {
    state.fogMemory = {
      team,
      worldWidth: width,
      worldHeight: height,
      seen: new Set()
    };
  }
}

function markFogMemory(snapshot) {
  if (!snapshot?.you || !snapshot.world) return;
  ensureFogMemory(snapshot);
  const cellSize = FOG_CELL_SIZE * visionScale(snapshot);
  const sources = alliedVisionSources(snapshot);
  if (!sources.length) return;

  for (const source of sources) {
    const radius = visionRadius(source.visionType, snapshot);
    const minCellX = Math.floor((source.x - radius) / cellSize);
    const maxCellX = Math.floor((source.x + radius) / cellSize);
    const minCellY = Math.floor((source.y - radius) / cellSize);
    const maxCellY = Math.floor((source.y + radius) / cellSize);

    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
        const centerX = (cellX + 0.5) * cellSize;
        const centerY = (cellY + 0.5) * cellSize;
        if (Math.hypot(source.x - centerX, source.y - centerY) <= radius + cellSize * 0.8) {
          state.fogMemory.seen.add(`${cellX}:${cellY}`);
        }
      }
    }
  }
}

function hasSeenFogCell(cellX, cellY) {
  return state.fogMemory.seen.has(`${cellX}:${cellY}`);
}

function isEntityVisible(entity, snapshot = state.snapshot) {
  const team = snapshot?.you?.team;
  if (!snapshot || !team || !entity) return true;
  if (entity.team === team) return true;

  return isPointVisible(entity.x, entity.y, snapshot) || alliedVisionSources(snapshot).some((source) => (
    distance(source, entity) <= visionRadius(source.visionType, snapshot) + (entity.radius || 0)
  ));
}

function isStructureVisible(structure, snapshot = state.snapshot) {
  if (!structure || structure.destroyed) return false;
  return true;
}

function findSelectedTarget(snapshot) {
  if (!snapshot || !state.selectedTargetId || !state.selectedTargetType) return null;
  const groups = {
    hero: snapshot.heroes.filter((hero) => hero.alive && isEntityVisible(hero, snapshot)),
    minion: snapshot.minions.filter((minion) => isEntityVisible(minion, snapshot)),
    structure: snapshot.structures.filter((structure) => isStructureVisible(structure, snapshot)),
    camp: snapshot.camps.filter((camp) => camp.alive && isEntityVisible(camp, snapshot))
  };
  return groups[state.selectedTargetType]?.find((entity) => entity.id === state.selectedTargetId) || null;
}

function describeTarget(target) {
  if (!target) {
    return {
      title: "No target selected",
      subtitle: "Left click a hero, creep, camp, or structure",
      tags: [],
      stats: []
    };
  }

  if (target.entityType === "hero") {
    const meta = heroMeta[target.heroType] || {};
    return {
      title: target.name,
      subtitle: `${(meta.name || target.heroType).toUpperCase()} • ${meta.role || "Hero"}`,
      tags: [target.team.toUpperCase(), `Level ${target.level}`],
      stats: [
        `Lane ${LANE_LABELS[target.preferredLane] || target.preferredLane || "Free"}`,
        `K/D ${target.kills}/${target.deaths}`,
        `${target.items?.length || 0}/6 items`
      ]
    };
  }

  if (target.entityType === "structure") {
    return {
      title: `${target.team.toUpperCase()} ${target.kind.toUpperCase()}`,
      subtitle: target.kind === "nexus" ? "Core objective" : `${LANE_LABELS[target.lane] || target.lane} lane defense`,
      tags: [target.vulnerable ? "Vulnerable" : "Protected", target.kind === "nexus" ? "Final target" : `Tier ${target.tier + 1}`],
      stats: [
        `Team ${target.team.toUpperCase()}`,
        `Lane ${LANE_LABELS[target.lane] || target.lane}`,
        target.vulnerable ? "Can take damage" : "Needs previous defenses down"
      ]
    };
  }

  if (target.entityType === "camp") {
    const seconds = target.respawnAt ? Math.max(0, Math.ceil((target.respawnAt - Date.now()) / 1000)) : 0;
    return {
      title: target.key.toUpperCase().replaceAll("-", " "),
      subtitle: "Neutral camp",
      tags: ["Neutral", target.alive ? "Alive" : `Respawns ${seconds}s`],
      stats: [
        "Team buff objective",
        "Rewards global gold",
        "Best taken with support"
      ]
    };
  }

  return {
    title: `${target.team.toUpperCase()} ${target.kind.toUpperCase()} MINION`,
    subtitle: `${LANE_LABELS[target.lane] || target.lane} lane wave`,
    tags: [target.team.toUpperCase(), target.kind.toUpperCase()],
    stats: [
      `Lane ${LANE_LABELS[target.lane] || target.lane}`,
      target.kind === "siege" ? "Long range siege unit" : target.kind === "ranged" ? "Backline damage" : "Frontline melee",
      "Pushes toward enemy base"
    ]
  };
}

function projectSelectableEntity(entity) {
  const screen = worldToScreen(entity.x, entity.y);
  const radius = (entity.radius || 20) * state.zoom;
  return {
    x: screen.x,
    y: screen.y - radius * 0.7,
    radius: radius * 1.35
  };
}

function selectableEntities(snapshot) {
  if (!snapshot) return [];
  return [
    ...snapshot.heroes.filter((hero) => hero.alive && isEntityVisible(hero, snapshot)).map((hero) => ({ ...hero, entityType: "hero" })),
    ...snapshot.structures.filter((structure) => isStructureVisible(structure, snapshot)).map((structure) => ({ ...structure, entityType: "structure" })),
    ...snapshot.camps.filter((camp) => camp.alive && isEntityVisible(camp, snapshot)).map((camp) => ({ ...camp, entityType: "camp" })),
    ...snapshot.minions.filter((minion) => isEntityVisible(minion, snapshot)).map((minion) => ({ ...minion, entityType: "minion" }))
  ];
}

function selectEntityAtScreen(x, y) {
  const candidates = selectableEntities(state.snapshot)
    .map((entity) => ({ entity, projected: projectSelectableEntity(entity) }))
    .filter(({ projected }) => Math.hypot(x - projected.x, y - projected.y) <= projected.radius)
    .sort((a, b) => {
      const da = Math.hypot(x - a.projected.x, y - a.projected.y);
      const db = Math.hypot(x - b.projected.x, y - b.projected.y);
      return da - db;
    });

  const selected = candidates[0]?.entity || null;
  state.selectedTargetId = selected?.id || "";
  state.selectedTargetType = selected?.entityType || "";
}

function entityAtScreen(x, y) {
  const candidates = selectableEntities(state.snapshot)
    .map((entity) => ({ entity, projected: projectSelectableEntity(entity) }))
    .filter(({ projected }) => Math.hypot(x - projected.x, y - projected.y) <= projected.radius)
    .sort((a, b) => {
      const da = Math.hypot(x - a.projected.x, y - a.projected.y);
      const db = Math.hypot(x - b.projected.x, y - b.projected.y);
      return da - db;
    });
  return candidates[0]?.entity || null;
}

function isAttackableTarget(entity, you) {
  if (!entity || !you) return false;
  if (entity.entityType === "camp") return true;
  if (entity.entityType === "structure" || entity.entityType === "hero" || entity.entityType === "minion") {
    return entity.team !== you.team;
  }
  return false;
}

function rightClickMoveTarget(clickX, clickY) {
  const snapshot = state.snapshot;
  const you = snapshot?.you;
  if (!snapshot?.world || !you) return null;
  const clickedEntity = entityAtScreen(clickX, clickY);
  if (!clickedEntity || !isAttackableTarget(clickedEntity, you)) {
    return null;
  }

  const isRangedHero = (you.attackRange || 0) > 260;
  if (!isRangedHero) {
    return { x: clickedEntity.x, y: clickedEntity.y };
  }

  const dx = you.x - clickedEntity.x;
  const dy = you.y - clickedEntity.y;
  const dir = Math.hypot(dx, dy) > 0.001
    ? normalize(dx, dy)
    : normalize(clickX - canvas.width / 2, clickY - canvas.height / 2);
  const desiredDistance = Math.max(28, (you.attackRange || 0) + (clickedEntity.radius || 0) - 24);
  return {
    x: clamp(clickedEntity.x + dir.x * desiredDistance, 0, snapshot.world.width),
    y: clamp(clickedEntity.y + dir.y * desiredDistance, 0, snapshot.world.height)
  };
}

function rightClickTargetEntity(clickX, clickY) {
  const you = state.snapshot?.you;
  const clickedEntity = entityAtScreen(clickX, clickY);
  if (!clickedEntity || !isAttackableTarget(clickedEntity, you)) {
    return null;
  }
  return clickedEntity;
}

function abilityCooldown(you, key) {
  return Math.max(0, Math.ceil((you.cooldowns[key] - Date.now()) / 1000));
}

function queueAction(action) {
  state.actionId += 1;
  state.actions.push({
    id: `${Date.now()}_${state.actionId}`,
    ...action
  });
}

async function joinMatch() {
  if (state.joined || state.connecting) return;
  const name = nameInput.value.trim();
  await connectMatch(
    {
      type: "join",
      name,
      heroType: state.heroType,
      preferredTeam: state.preferredTeam
    },
    "Connecting..."
  );
}

function ensureInputLoop() {
  if (state.inputLoopStarted) return;
  state.inputLoopStarted = true;
  window.setInterval(sendInput, 80);
}

function applyJoinedSession(data, fallbackName = "") {
  state.token = data.token;
  state.joined = true;
  state.connecting = false;
  state.closeReason = "";
  state.heroType = data.heroType || state.heroType;
  state.preferredTeam = data.preferredTeam || state.preferredTeam;
  nameInput.value = data.name || fallbackName || nameInput.value;
  syncHeroSelection();
  syncTeamSelection();
  saveSession({
    token: data.token,
    name: data.name || fallbackName || "",
    heroType: state.heroType,
    preferredTeam: state.preferredTeam
  });
  statusText.textContent = data.resumed
    ? `Resumed ${data.name || fallbackName || data.playerId} on ${data.team.toUpperCase()}`
    : `Connected as ${data.name || fallbackName || data.playerId} on ${data.team.toUpperCase()}`;
  lobbyScreen.classList.add("hidden");
  if (lobbyTeamRosters) {
    lobbyTeamRosters.innerHTML = "";
  }
  ensureInputLoop();
  playUiSound("join");
}

async function connectMatch(payload, statusMessage) {
  state.connecting = true;
  statusText.textContent = statusMessage;
  state.closeReason = "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}`);
  state.ws = socket;

  return new Promise((resolve, reject) => {
    let settled = false;
    const rejectConnection = (message, clearSaved = false) => {
      state.connecting = false;
      state.closeReason = message;
      statusText.textContent = message;
      if (clearSaved) {
        clearSavedSession();
        state.token = "";
      }
      settled = true;
      reject(new Error(message));
    };

    socket.onopen = () => {
      socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "joined") {
        settled = true;
        applyJoinedSession(data, payload.name);
        resolve(data);
        return;
      }

      if (data.type === "join-error" || data.type === "reconnect-error") {
        const message = data.message || "Connection failed";
        rejectConnection(message, data.type === "reconnect-error");
        socket.close();
        return;
      }

      if (data.type === "state") {
        syncEntityFacing(data);
        syncEntityMotion(data);
        state.snapshot = data;
        processSnapshotAudio(data);
        const now = Date.now();
        if (shouldRefreshUi("topbar", TOPBAR_REFRESH_MS, now)) updateTopbar();
        if (shouldRefreshUi("feed", FEED_REFRESH_MS, now)) updateFeed();
        if (shouldRefreshUi("hud", HUD_REFRESH_MS, now)) updateHud();
        if (shouldRefreshUi("shop", SHOP_REFRESH_MS, now)) updateShop();
        if (shouldRefreshUi("minimap", MINIMAP_REFRESH_MS, now)) updateMinimap();
        if (state.scoreboardOpen && shouldRefreshUi("scoreboard", SCOREBOARD_REFRESH_MS, now)) updateScoreboard();
      }
    };

    socket.onerror = () => {
      if (!settled) {
        rejectConnection("Connection failed", payload.type === "reconnect");
      }
    };

    socket.onclose = () => {
      if (state.ws === socket) {
        state.ws = null;
      }
      if (!settled) {
        rejectConnection(state.closeReason || "Connection lost", payload.type === "reconnect");
        return;
      }
      state.connecting = false;
      if (state.joined) {
        statusText.textContent = state.closeReason || "Connection lost. Refresh to resume.";
      } else {
        statusText.textContent = state.closeReason || "Connection lost";
      }
    };
  });
}

async function reconnectMatch(token) {
  if (!token || state.joined || state.connecting) return;
  await connectMatch({ type: "reconnect", token }, "Reconnecting...");
}

async function dismissSplash() {
  if (state.splashDismissed) return;
  state.splashDismissed = true;
  splashScreen.classList.add("hidden");
  if (state.token) {
    try {
      await reconnectMatch(state.token);
      return;
    } catch {
      clearSavedSession();
      state.token = "";
    }
  }
  lobbyScreen.classList.remove("hidden");
  refreshLobbyRosters();
}

async function sendInput() {
  if (!state.token || !state.snapshot || !state.ws || state.ws.readyState !== 1) return;

  const actions = state.actions.splice(0, state.actions.length);
  const moveTarget = state.moveTarget;
  state.moveTarget = null; // Consume the move target

  if (actions.length > 0 || moveTarget) {
    state.ws.send(JSON.stringify({
      type: "input",
      moveTarget: moveTarget,
      actions
    }));
  }
}

function updateTopbar() {
  const snapshot = state.snapshot;
  const you = snapshot?.you;
  if (!snapshot || !you) {
    topbar.innerHTML = "";
    return;
  }

  const team = you.team;
  const aliveStructures = snapshot.structures.filter(
    (structure) => structure.team === team && !structure.destroyed
  ).length;
  const kills = snapshot.heroes.filter((hero) => hero.team === team).reduce((sum, hero) => sum + hero.kills, 0);
  const buffLive = snapshot.teams[team].buffUntil > Date.now() ? "Buff Live" : "No Buff";
  const teamClass = team === "blue" ? "team-blue" : "team-red";
  const teamLabel = team === "blue" ? "Blue Team" : "Red Team";

  topbar.innerHTML = `
    <div class="score-card compact">
      <strong class="${teamClass}">${teamLabel}</strong>
      <span>Kills ${kills}</span>
      <span>Structures ${aliveStructures}</span>
      <span>${buffLive}</span>
    </div>
    <div class="gold-pill"><strong>${you.gold}</strong><span>Gold</span></div>
  `;
}

function updateFeed() {
  const messages = state.snapshot?.messages || [];
  const now = state.snapshot?.serverTime || Date.now();
  const recentMessages = messages.filter((message) => now - message.createdAt < 12000);
  feed.innerHTML = recentMessages
    .map((message) => `<div class="feed-item">${message.text}</div>`)
    .join("");
}

function updateScoreboard() {
  const snapshot = state.snapshot;
  if (!scoreboard || !snapshot || !state.scoreboardOpen) {
    if (scoreboard) {
      scoreboard.innerHTML = "";
      scoreboard.classList.add("hidden");
    }
    return;
  }

  const renderTeam = (team) => {
    const roster = snapshot.heroes
      .filter((hero) => hero.team === team)
      .sort((a, b) => (b.kills + b.assists - b.deaths) - (a.kills + a.assists - a.deaths) || a.name.localeCompare(b.name));
    return `
      <section class="scoreboard-team ${team === "blue" ? "team-blue" : "team-red"}">
        <div class="scoreboard-team-head">
          <strong>${team === "blue" ? "Blue Team" : "Red Team"}</strong>
          <span>${roster.reduce((sum, hero) => sum + hero.kills, 0)} kills</span>
        </div>
        <div class="scoreboard-table">
          <div class="scoreboard-row scoreboard-header-row">
            <span>Hero</span>
            <span>K</span>
            <span>D</span>
            <span>A</span>
          </div>
          ${roster.map((hero) => `
            <div class="scoreboard-row ${hero.id === snapshot.you?.id ? "is-you" : ""}">
              <span>${hero.name}</span>
              <span>${hero.kills}</span>
              <span>${hero.deaths}</span>
              <span>${hero.assists || 0}</span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  };

  scoreboard.classList.remove("hidden");
  scoreboard.innerHTML = `
    <div class="scoreboard-frame">
      <div class="scoreboard-title">
        <strong>Scoreboard</strong>
        <span>S</span>
      </div>
      <div class="scoreboard-columns">
        ${renderTeam("blue")}
        ${renderTeam("red")}
      </div>
    </div>
  `;
}

function updateHud() {
  const you = state.snapshot?.you;
  if (!you) {
    hud.innerHTML = "";
    overlay.classList.add("hidden");
    return;
  }

  const hpRatio = you.maxHp ? clamp(you.hp / you.maxHp, 0, 1) : 0;
  const prevLevelXp = Math.max(0, (you.level - 1) * 60);
  const nextLevelXp = you.level >= 18 ? prevLevelXp : you.level * 60;
  const xpRatio = you.level >= 18
    ? 1
    : clamp((you.xp - prevLevelXp) / Math.max(nextLevelXp - prevLevelXp, 1), 0, 1);
  const abilities = heroMeta[you.heroType]?.abilities || {};
  const heroShape = heroMeta[you.heroType]?.shape || "circle";
  const itemDetails = new Map((state.snapshot?.shopItems || []).map((item) => [item.key, item]));
  const inventory = Array.from({ length: 6 }, (_, index) => you.items[index] || null);
  const inventoryHtml = inventory
    .map((item, index) => {
      if (!item) {
        return `<div class="item-slot empty"><div class="item-emblem">+</div><small>Empty</small></div>`;
      }
      const detail = itemDetails.get(item.key) || item;
      const level = item.level || 1;
      const maxLevel = detail.maxLevel || 3;
      const upgradeCost = Math.round((detail.cost || 0) * (0.85 + level * 0.35));
      const upgradeLine = level >= maxLevel
        ? "Max level reached"
        : (you.inBase ? `Click to upgrade for ${upgradeCost} gold` : "Return to fountain to upgrade");
      return `
        <div
          class="item-slot"
          data-item-index="${index}"
          data-tooltip-title="${escapeTooltipText(item.label)}"
          data-tooltip-body="${escapeTooltipText(`Level ${level}/${maxLevel} • ${detail.description || "No description available."}`)}"
          data-tooltip-extra="${escapeTooltipText(upgradeLine)}">
          <div class="item-emblem">${item.short}</div>
          <strong>${item.label}</strong>
          <small>Lv.${level}</small>
        </div>
      `;
    })
    .join("");
  const selectedTarget = findSelectedTarget(state.snapshot);
  if (!selectedTarget) {
    state.selectedTargetId = "";
    state.selectedTargetType = "";
  }
  const target = selectedTarget
    ? { ...selectedTarget, entityType: state.selectedTargetType }
    : null;
  const targetInfo = describeTarget(target);
  const targetHpRatio = target?.maxHp ? clamp(target.hp / target.maxHp, 0, 1) : 0;
  const inspectedShape = target
    ? target.entityType === "hero"
      ? (heroMeta[target.heroType]?.shape || target.shape || "circle")
      : target.entityType === "structure"
        ? (target.kind === "nexus" ? "circle" : "square")
        : target.entityType === "camp"
          ? "triangle"
          : (target.kind === "siege" ? "square" : target.kind === "ranged" ? "triangle" : "circle")
    : heroShape;
  const inspectedColor = target
    ? target.team === "blue"
      ? "#7fd6ff"
      : target.team === "red"
        ? "#ff8a80"
        : "#e7ba63"
    : (you.team === "blue" ? "#7fd6ff" : "#ff8a80");
  const inspectedName = target ? targetInfo.title : you.name;
  const inspectedSubtitle = target
    ? targetInfo.subtitle
    : `${heroMeta[you.heroType]?.name || you.heroType} • ${you.team.toUpperCase()}`;
  const inspectedHpRatio = target ? targetHpRatio : hpRatio;
  const inspectedHpLabel = target
    ? `HP ${Math.ceil(target.hp)} / ${target.maxHp}`
    : `HP ${Math.ceil(you.hp)} / ${you.maxHp}`;
  const inspectedRightLabel = target
    ? target.entityType.toUpperCase()
    : `Level ${you.level}`;
  const inspectedDetailLabel = target
    ? (target.entityType === "hero" ? `K / D ${target.kills} / ${target.deaths}` : `${targetInfo.tags[0] || target.entityType.toUpperCase()}`)
    : `K / D ${you.kills} / ${you.deaths}`;
  const inspectedTags = target ? targetInfo.tags : [you.team.toUpperCase(), `Level ${you.level}`];
  const inspectedStats = target ? targetInfo.stats : [];
  const portraitTooltip = target
    ? `
      <div class="hud-tooltip portrait-tooltip">
        <strong>${targetInfo.title}</strong>
        <span>${targetInfo.subtitle}</span>
        <span>HP ${Math.ceil(target.hp)} / ${target.maxHp}</span>
        ${targetInfo.stats.map((stat) => `<span>${stat}</span>`).join("")}
      </div>
    `
    : `
      <div class="hud-tooltip portrait-tooltip">
        <strong>${heroMeta[you.heroType]?.name || you.heroType}</strong>
        <span>${heroMeta[you.heroType]?.role || "Hero"}</span>
        <span>HP ${Math.ceil(you.hp)} / ${you.maxHp}</span>
        <span>Level ${you.level} • XP ${you.xp}</span>
        <span>K / D ${you.kills} / ${you.deaths}</span>
        <span>${you.inBase ? "In fountain" : "On the field"}</span>
      </div>
    `;
  const inspectedPortraitUrl = getEntityPortraitUrl(target, you.heroType);

  hud.innerHTML = `
    <div class="hud-frame">
      <section class="hero-panel">
        <div class="portrait-wrap">
          <div class="portrait ${inspectedShape}" style="color:${inspectedColor};${inspectedPortraitUrl ? `--portrait-image:url('${inspectedPortraitUrl}')` : ""}">
            <span class="portrait-glow"></span>
            <span class="portrait-motion"></span>
          </div>
          ${target ? "" : `<div class="resource-bar xp portrait-xp"><span style="width:${xpRatio * 100}%"></span></div>`}
        </div>
        <div class="hero-meta">
          <div>
            <div class="hero-name">${inspectedName}</div>
            <div class="hero-subline">${inspectedSubtitle}</div>
          </div>
          <div class="resource-bar hp"><span style="width:${inspectedHpRatio * 100}%"></span></div>
          <div class="resource-labels"><span>${inspectedHpLabel}</span><span>${inspectedRightLabel}</span></div>
          <div class="resource-labels"><span>${inspectedDetailLabel}</span><span>${inspectedTags[0] || ""}</span></div>
          <div class="target-tag-row">${inspectedTags.map((tag) => `<span class="target-tag">${tag}</span>`).join("")}</div>
          <div class="target-stats">${inspectedStats.map((stat) => `<span>${stat}</span>`).join("")}</div>
        </div>
      </section>

      <section class="center-panel">
        ${you.status?.recallStartedAt ? `
          <div class="recall-bar"><span style="width:${clamp((Date.now() - you.status.recallStartedAt) / 3000, 0, 1) * 100}%"></span></div>
        ` : ''}
        <div class="ability-row">
          ${["q", "w", "e"].map((key) => {
    const cooldown = abilityCooldown(you, key);
    return `
              <div class="ability ${cooldown ? "cooling" : ""}">
                <div class="ability-key">${key.toUpperCase()}</div>
                <strong>${abilities[key]?.name || key.toUpperCase()}</strong>
                <span class="ability-desc">${abilities[key]?.description || ""}</span>
                ${cooldown ? `<span class="cooldown">${cooldown}s</span>` : ""}
              </div>
            `;
  }).join("")}
        </div>
        <div class="inventory-row" data-inventory-drop="true">${inventoryHtml}</div>
      </section>

    </div>
  `;

  if (!you.alive) {
    const seconds = Math.max(0, Math.ceil((you.respawnAt - Date.now()) / 1000));
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="overlay-card">
        <h2>Reforming</h2>
        <p>${seconds}s until your shape returns to the fountain.</p>
      </div>
    `;
  } else if (state.snapshot.winner) {
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="overlay-card">
        <h2>${state.snapshot.winner.toUpperCase()} Wins</h2>
        <p>The round will reset automatically in a few seconds.</p>
      </div>
    `;
  } else {
    overlay.classList.add("hidden");
  }
}

function updateShop() {
  const you = state.snapshot?.you;
  const shopItems = state.snapshot?.shopItems || [];
  if (!you) {
    shop.innerHTML = "";
    shop.classList.add("hidden");
    return;
  }

  const shopUnlocked = Boolean(you.inBase);

  if (!shopUnlocked) {
    shop.innerHTML = "";
    shop.classList.add("hidden");
    state.shopFeedback = "";
    state.lastShopClick.key = "";
    return;
  }

  shop.classList.remove("hidden");

  const cards = shopItems
    .map((item) => {
      const alreadyHave = you.items.some(i => i && i.key === item.key);
      const locked = you.items.length >= 6 || alreadyHave;
      const insufficientFunds = you.gold < item.cost;
      return `
        <button
          class="shop-card ${locked ? "disabled" : ""} ${insufficientFunds && !locked ? "insufficient" : ""}"
          data-item-key="${item.key}"
          data-item-cost="${item.cost}"
          data-tooltip-title="${escapeTooltipText(item.label)}"
          data-tooltip-body="${escapeTooltipText(item.description)}"
          data-tooltip-extra="${escapeTooltipText(
            insufficientFunds && !locked ? `Cost ${item.cost} gold • Insufficient funds` : `Cost ${item.cost} gold`
          )}"
          ${locked ? "disabled" : ""}>
          <strong>${item.label}</strong>
          <small>${item.short}</small>
          <div class="shop-cost">${item.cost} gold</div>
        </button>
      `;
    })
    .join("");

  shop.innerHTML = `
    <div class="shop-frame">
      <div class="shop-header">
        <strong>Shop</strong>
        <span>${state.shopFeedback || (you.inBase ? "Double click to buy" : "Return to fountain to buy")}</span>
      </div>
      <div class="shop-grid">${cards}</div>
    </div>
  `;
}

function updateMinimap() {
  const snapshot = state.snapshot;
  if (!snapshot) {
    minimap.innerHTML = "";
    return;
  }

  const laneSegments = [];
  for (const path of Object.values(snapshot.lanePaths)) {
    for (let index = 0; index < path.length - 1; index += 1) {
      const start = path[index];
      const end = path[index + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      laneSegments.push(`
        <div class="minimap-lane" style="
          left:${(start.x / snapshot.world.width) * 100}%;
          top:${(start.y / snapshot.world.height) * 100}%;
          width:${(length / snapshot.world.width) * 100}%;
          transform: translateY(-50%) rotate(${Math.atan2(dy, dx)}rad);
        "></div>
      `);
    }
  }

  const structureDots = snapshot.structures
    .filter((structure) => isStructureVisible(structure, snapshot))
    .map((structure) => `
      <div class="minimap-structure ${TEAM_CLASS[structure.team] || ""}" style="
        color:${structure.team === "blue" ? "#7fd6ff" : "#ff8a80"};
        left:${(structure.x / snapshot.world.width) * 100}%;
        top:${(structure.y / snapshot.world.height) * 100}%;">
      </div>
    `)
    .join("");

  const heroDots = snapshot.heroes
    .filter((hero) => hero.alive && isEntityVisible(hero, snapshot))
    .map((hero) => `
      <div class="minimap-dot ${hero.id === snapshot.you?.id ? "you" : ""}" style="
        color:${hero.team === "blue" ? "#7fd6ff" : "#ff8a80"};
        left:${(hero.x / snapshot.world.width) * 100}%;
        top:${(hero.y / snapshot.world.height) * 100}%;">
      </div>
    `)
    .join("");

  minimap.innerHTML = `
    <div class="minimap-frame">
      <div class="minimap">
        ${laneSegments.join("")}
        ${structureDots}
        ${heroDots}
      </div>
    </div>
  `;
}

function updateCamera() {
  const you = state.snapshot?.you;
  if (!you) return;

  if (state.cameraOverride) {
    const targetX = clamp(state.cameraOverride.x, 0, state.snapshot.world.width);
    const targetY = clamp(state.cameraOverride.y, 0, state.snapshot.world.height);
    state.camera.x += (targetX - state.camera.x) * 0.16;
    state.camera.y += (targetY - state.camera.y) * 0.16;
    return;
  }

  state.zoom += (state.zoomTarget - state.zoom) * 0.16;

  const lookX = clamp((state.mouse.x / Math.max(canvas.width, 1) - 0.5) * 360, -180, 180);
  const lookY = clamp((state.mouse.y / Math.max(canvas.height, 1) - 0.5) * 280, -140, 140);
  const targetX = you.x + lookX;
  const targetY = you.y + lookY;
  state.camera.x += (targetX - state.camera.x) * 0.08;
  state.camera.y += (targetY - state.camera.y) * 0.08;
}

function clearCameraOverride() {
  state.cameraOverride = null;
}

function focusCameraAtWorld(x, y) {
  if (!state.snapshot?.world) return;
  const target = {
    x: clamp(x, 0, state.snapshot.world.width),
    y: clamp(y, 0, state.snapshot.world.height)
  };
  state.cameraOverride = target;
  state.camera.x = target.x;
  state.camera.y = target.y;
}

function drawDiamond(center, size, fillStyle, strokeStyle = "") {
  const screen = worldToScreen(center.x, center.y);
  const halfW = size * ISO_X * state.zoom;
  const halfH = size * ISO_Y * state.zoom;
  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y - halfH);
  ctx.lineTo(screen.x + halfW, screen.y);
  ctx.lineTo(screen.x, screen.y + halfH);
  ctx.lineTo(screen.x - halfW, screen.y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

function drawParallaxMistLayer(options = {}) {
  const speedX = options.speedX ?? 0.08;
  const speedY = options.speedY ?? 0.04;
  const alpha = options.alpha ?? 0.12;
  const scale = options.scale ?? 1;
  const tintA = options.tintA ?? "rgba(96, 168, 220, 0.16)";
  const tintB = options.tintB ?? "rgba(231, 186, 99, 0.12)";
  const offsetX = ((state.camera.x || 0) * speedX) % Math.max(canvas.width * 0.8, 1);
  const offsetY = ((state.camera.y || 0) * speedY) % Math.max(canvas.height * 0.8, 1);
  const blobs = [
    { x: canvas.width * 0.24 - offsetX, y: canvas.height * 0.28 - offsetY, rx: canvas.width * 0.34 * scale, ry: canvas.height * 0.2 * scale, color: tintA }
  ];

  ctx.save();
  ctx.globalAlpha = alpha;
  for (const blob of blobs) {
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, Math.max(blob.rx, blob.ry));
    gradient.addColorStop(0, blob.color);
    gradient.addColorStop(0.65, blob.color.replace(/0\.\d+\)/, "0.06)"));
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(blob.x, blob.y, blob.rx, blob.ry, -0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawForegroundParallaxVeil() {
  const driftX = ((state.camera.x || 0) * 0.12) % Math.max(canvas.width, 1);
  const driftY = ((state.camera.y || 0) * 0.06) % Math.max(canvas.height, 1);
  ctx.save();
  ctx.globalAlpha = 0.18;
  const gradient = ctx.createLinearGradient(
    canvas.width * 0.15 - driftX * 0.1,
    canvas.height - driftY * 0.4,
    canvas.width * 0.85 - driftX * 0.25,
    canvas.height * 0.42 - driftY * 0.2
  );
  gradient.addColorStop(0, "rgba(18, 28, 24, 0.52)");
  gradient.addColorStop(0.5, "rgba(18, 28, 24, 0.08)");
  gradient.addColorStop(1, "rgba(18, 28, 24, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(-40, canvas.height + 40);
  ctx.lineTo(canvas.width * 0.26, canvas.height * 0.66);
  ctx.lineTo(canvas.width * 0.54, canvas.height * 0.58);
  ctx.lineTo(canvas.width + 40, canvas.height * 0.78);
  ctx.lineTo(canvas.width + 40, canvas.height + 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPathStroke(path, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  path.forEach((point, index) => {
    const screen = worldToScreen(point.x, point.y);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.stroke();
}

function drawTerrainTile(centerWorldX, centerWorldY, tileSize) {
  const center = worldToScreen(centerWorldX, centerWorldY);
  const halfW = tileSize * ISO_X * state.zoom;
  const halfH = tileSize * ISO_Y * state.zoom;
  const seed = Math.sin(centerWorldX * 0.0014) + Math.cos(centerWorldY * 0.0012);
  const baseGradient = ctx.createLinearGradient(center.x - halfW, center.y - halfH, center.x + halfW, center.y + halfH);
  const dark = seed > 0.35 ? "rgba(30, 47, 36, 0.9)" : seed < -0.25 ? "rgba(42, 41, 31, 0.88)" : "rgba(34, 43, 33, 0.88)";
  const light = seed > 0.1 ? "rgba(64, 89, 63, 0.8)" : "rgba(56, 71, 53, 0.78)";
  baseGradient.addColorStop(0, light);
  baseGradient.addColorStop(1, dark);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - halfH);
  ctx.lineTo(center.x + halfW, center.y);
  ctx.lineTo(center.x, center.y + halfH);
  ctx.lineTo(center.x - halfW, center.y);
  ctx.closePath();
  ctx.fillStyle = baseGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.stroke();
  ctx.fillStyle = seed > 0 ? "rgba(90, 119, 81, 0.08)" : "rgba(20, 24, 20, 0.08)";
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, halfW * 0.45, halfH * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRoadTexture(lane, path) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const widths = lane === "mid"
    ? { bed: 58, shoulder: 46, surface: 34, center: 16 }
    : { bed: 52, shoulder: 40, surface: 29, center: 13 };

  drawPathStroke(path, lane === "mid" ? "rgba(27, 20, 13, 0.72)" : "rgba(24, 20, 15, 0.64)", widths.bed * state.zoom);
  drawPathStroke(path, lane === "mid" ? "rgba(71, 56, 38, 0.72)" : "rgba(65, 55, 42, 0.62)", widths.shoulder * state.zoom);
  drawPathStroke(path, lane === "mid" ? "rgba(121, 103, 76, 0.76)" : "rgba(109, 95, 74, 0.72)", widths.surface * state.zoom);
  drawPathStroke(path, lane === "mid" ? "rgba(160, 145, 116, 0.34)" : "rgba(148, 138, 117, 0.24)", widths.center * state.zoom);

  for (let index = 0; index < path.length - 1; index += 1) {
    const start = worldToScreen(path[index].x, path[index].y);
    const end = worldToScreen(path[index + 1].x, path[index + 1].y);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const nx = -dy / Math.max(length, 1);
    const ny = dx / Math.max(length, 1);
    const shoulder = (lane === "mid" ? 19 : 16) * state.zoom;
    const bandStep = (lane === "mid" ? 40 : 36) * state.zoom;

    ctx.strokeStyle = "rgba(41, 31, 23, 0.34)";
    ctx.lineWidth = Math.max(1.1, 2 * state.zoom);
    ctx.beginPath();
    ctx.moveTo(start.x + nx * shoulder, start.y + ny * shoulder);
    ctx.lineTo(end.x + nx * shoulder, end.y + ny * shoulder);
    ctx.moveTo(start.x - nx * shoulder, start.y - ny * shoulder);
    ctx.lineTo(end.x - nx * shoulder, end.y - ny * shoulder);
    ctx.stroke();

    for (let offset = bandStep; offset < length; offset += bandStep) {
      const t = offset / Math.max(length, 1);
      const px = start.x + dx * t;
      const py = start.y + dy * t;
      const bandHalf = (lane === "mid" ? 11 : 9) * state.zoom;
      ctx.strokeStyle = "rgba(208, 191, 158, 0.18)";
      ctx.lineWidth = Math.max(0.8, 2.2 * state.zoom);
      ctx.beginPath();
      ctx.moveTo(px - nx * bandHalf, py - ny * bandHalf);
      ctx.lineTo(px + nx * bandHalf, py + ny * bandHalf);
      ctx.stroke();

      ctx.strokeStyle = "rgba(67, 52, 38, 0.16)";
      ctx.lineWidth = Math.max(0.7, 1.1 * state.zoom);
      ctx.beginPath();
      ctx.moveTo(px - nx * (bandHalf + 4 * state.zoom), py - ny * (bandHalf + 4 * state.zoom));
      ctx.lineTo(px + nx * (bandHalf + 4 * state.zoom), py + ny * (bandHalf + 4 * state.zoom));
      ctx.stroke();
    }

  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0a1319";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!LOW_PERF_MODE) {
    drawParallaxMistLayer({
      speedX: 0.045,
      speedY: 0.025,
      alpha: 0.08,
      scale: 1,
      tintA: "rgba(88, 146, 204, 0.18)",
      tintB: "rgba(120, 92, 58, 0.14)"
    });
  }
  const corners = [
    screenToWorld(0, 0),
    screenToWorld(canvas.width, 0),
    screenToWorld(0, canvas.height),
    screenToWorld(canvas.width, canvas.height)
  ];
  const minX = Math.min(...corners.map((corner) => corner.x)) - 640;
  const maxX = Math.max(...corners.map((corner) => corner.x)) + 640;
  const minY = Math.min(...corners.map((corner) => corner.y)) - 640;
  const maxY = Math.max(...corners.map((corner) => corner.y)) + 640;
  const tileSize = LOW_PERF_MODE ? 1040 : 720;

  for (let x = Math.floor(minX / tileSize) * tileSize; x < maxX; x += tileSize) {
    for (let y = Math.floor(minY / tileSize) * tileSize; y < maxY; y += tileSize) {
      drawTerrainTile(x + tileSize / 2, y + tileSize / 2, tileSize);
    }
  }

  if (state.snapshot?.bases) {
    const auraRadius = state.snapshot.baseAuraRadius || 360;
    drawIsoCircle(
      state.snapshot.bases.blue.x,
      state.snapshot.bases.blue.y,
      auraRadius,
      "rgba(96, 168, 220, 0.12)"
    );
    drawIsoCircle(
      state.snapshot.bases.red.x,
      state.snapshot.bases.red.y,
      auraRadius,
      "rgba(211, 98, 88, 0.12)"
    );
  } else {
    drawIsoCircle(360, 3140, 360, "rgba(96, 168, 220, 0.12)");
    drawIsoCircle(5230, 250, 360, "rgba(211, 98, 88, 0.12)");
  }

  if (!state.snapshot?.lanePaths) return;

  for (const [lane, path] of Object.entries(state.snapshot.lanePaths)) {
    drawRoadTexture(lane, path);

    const labelPoint = path[Math.floor(path.length / 2)];
    const screen = worldToScreen(labelPoint.x, labelPoint.y);
    ctx.fillStyle = "rgba(244, 234, 213, 0.22)";
    ctx.font = "bold 18px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(LANE_LABELS[lane], screen.x, screen.y - 12);
  }

  for (const camp of state.snapshot.camps) {
    drawIsoCircle(camp.x, camp.y, camp.radius + 40, camp.alive ? "rgba(231, 186, 99, 0.1)" : "rgba(106, 111, 120, 0.08)");
  }

  if (!LOW_PERF_MODE) {
    drawForegroundParallaxVeil();
  }
}

function drawIsoCircle(x, y, radius, fillStyle, alpha = 1) {
  const screen = worldToScreen(x, y);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(screen.x, screen.y, radius * ISO_X * state.zoom, radius * ISO_Y * state.zoom, 0, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function shadeColor(color, multiplier) {
  const hex = color.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const value = Number.parseInt(normalized, 16);
  const r = clamp(Math.round(((value >> 16) & 255) * multiplier), 0, 255);
  const g = clamp(Math.round(((value >> 8) & 255) * multiplier), 0, 255);
  const b = clamp(Math.round((value & 255) * multiplier), 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function entityRenderPalette(entity) {
  const teamBorder = entity.team === "blue" ? "#67d7ff" : entity.team === "red" ? "#ff8a80" : "#e7ba63";
  if (entity.heroType && heroMeta[entity.heroType]?.color) {
    return {
      fill: heroMeta[entity.heroType].color,
      shade: shadeColor(heroMeta[entity.heroType].color, 0.72),
      border: teamBorder,
      borderSoft: entity.team === "neutral" ? "rgba(255,255,255,0.18)" : teamColor(entity.team, 0.85)
    };
  }

  return {
    fill: teamBorder,
    shade: shadeColor(teamBorder, 0.72),
    border: "rgba(255,255,255,0.18)",
    borderSoft: "rgba(255,255,255,0.18)"
  };
}

function drawRegularPolygonShape(sides, radius, rotation = 0) {
  ctx.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawTowerShape(size, palette, damageRatio = 0) {
  const baseWidth = size * 1.9;
  const baseHeight = size * 0.4;
  const shaftWidth = size * 1.05;
  const shaftHeight = size * 1.45;
  const crownWidth = size * 1.45;
  const crownHeight = size * 0.42;
  const topWidth = size * 0.68;
  const topHeight = size * 0.56;

  ctx.fillStyle = palette.shade;
  ctx.fillRect(-baseWidth / 2, size * 0.52, baseWidth, baseHeight);

  ctx.fillStyle = palette.fill;
  ctx.fillRect(-shaftWidth / 2, -shaftHeight * 0.2, shaftWidth, shaftHeight);

  ctx.fillRect(-crownWidth / 2, -shaftHeight * 0.34, crownWidth, crownHeight);
  ctx.fillRect(-crownWidth * 0.42, -shaftHeight * 0.52, crownWidth * 0.18, crownHeight * 0.44);
  ctx.fillRect(-crownWidth * 0.1, -shaftHeight * 0.56, crownWidth * 0.2, crownHeight * 0.5);
  ctx.fillRect(crownWidth * 0.24, -shaftHeight * 0.52, crownWidth * 0.18, crownHeight * 0.44);

  ctx.beginPath();
  ctx.moveTo(-topWidth / 2, -shaftHeight * 0.36);
  ctx.lineTo(0, -shaftHeight * 0.9);
  ctx.lineTo(topWidth / 2, -shaftHeight * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = palette.borderSoft;
  ctx.lineWidth = Math.max(1.5, 2.5 * state.zoom);
  ctx.strokeRect(-shaftWidth / 2, -shaftHeight * 0.2, shaftWidth, shaftHeight);
  ctx.strokeRect(-crownWidth / 2, -shaftHeight * 0.34, crownWidth, crownHeight);
  ctx.stroke();

  if (damageRatio <= 0.18) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = `rgba(28, 16, 12, ${0.35 + damageRatio * 0.35})`;
  ctx.lineWidth = Math.max(1.2, 2.1 * state.zoom);
  ctx.beginPath();
  ctx.moveTo(-shaftWidth * 0.2, shaftHeight * 0.1);
  ctx.lineTo(-shaftWidth * 0.05, -shaftHeight * 0.02);
  ctx.lineTo(-shaftWidth * 0.24, -shaftHeight * 0.24);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(shaftWidth * 0.16, shaftHeight * 0.36);
  ctx.lineTo(shaftWidth * 0.02, shaftHeight * 0.08);
  ctx.lineTo(shaftWidth * 0.18, -shaftHeight * 0.18);
  ctx.stroke();

  if (damageRatio > 0.4) {
    ctx.fillStyle = `rgba(22, 12, 10, ${0.18 + damageRatio * 0.22})`;
    ctx.fillRect(crownWidth * 0.22, -shaftHeight * 0.5, crownWidth * 0.16, crownHeight * 0.4);
    ctx.fillRect(-crownWidth * 0.14, shaftHeight * 0.28, shaftWidth * 0.24, shaftHeight * 0.22);
  }

  if (damageRatio > 0.65) {
    ctx.fillStyle = `rgba(45, 30, 20, ${0.34 + damageRatio * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(-baseWidth * 0.42, baseHeight + size * 0.48);
    ctx.lineTo(-baseWidth * 0.18, baseHeight + size * 0.3);
    ctx.lineTo(-baseWidth * 0.06, baseHeight + size * 0.56);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(baseWidth * 0.2, baseHeight + size * 0.46);
    ctx.lineTo(baseWidth * 0.34, baseHeight + size * 0.24);
    ctx.lineTo(baseWidth * 0.46, baseHeight + size * 0.52);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawNexusDamage(size, damageRatio = 0) {
  if (damageRatio <= 0.22) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = `rgba(20, 12, 10, ${0.3 + damageRatio * 0.28})`;
  ctx.lineWidth = Math.max(1.4, 2.4 * state.zoom);
  ctx.beginPath();
  ctx.moveTo(-size * 0.22, -size * 0.1);
  ctx.lineTo(-size * 0.08, size * 0.16);
  ctx.lineTo(-size * 0.24, size * 0.42);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.18, -size * 0.28);
  ctx.lineTo(size * 0.04, -size * 0.02);
  ctx.lineTo(size * 0.24, size * 0.26);
  ctx.stroke();

  if (damageRatio > 0.55) {
    ctx.fillStyle = `rgba(18, 10, 10, ${0.18 + damageRatio * 0.24})`;
    ctx.beginPath();
    ctx.arc(size * 0.18, size * 0.12, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCroppedSprite(imageKey, image, targetSize, rotation = 0, anchorY = 0.5, mirrorX = false) {
  const source = getOpaqueBounds(imageKey, image) || {
    x: 0,
    y: 0,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height
  };
  const scale = targetSize / Math.max(source.width, source.height, 1);
  const destWidth = source.width * scale;
  const destHeight = source.height * scale;
  if (rotation) {
    ctx.rotate(rotation);
  }
  if (mirrorX) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    -destWidth / 2,
    -destHeight * anchorY,
    destWidth,
    destHeight
  );
}

function drawSpriteSheetFrame(image, targetSize, row, frame, rotation = 0, anchorY = 0.5, mirrorX = false) {
  const cols = SPRITE_SHEET_LAYOUT.cols;
  const rows = SPRITE_SHEET_LAYOUT.rows;
  const sourceWidth = Math.floor((image.naturalWidth || image.width) / cols);
  const sourceHeight = Math.floor((image.naturalHeight || image.height) / rows);
  const sourceX = sourceWidth * clamp(frame, 0, cols - 1);
  const sourceY = sourceHeight * clamp(row, 0, rows - 1);
  const scale = targetSize / Math.max(sourceWidth, sourceHeight, 1);
  const destWidth = sourceWidth * scale;
  const destHeight = sourceHeight * scale;
  if (rotation) {
    ctx.rotate(rotation);
  }
  if (mirrorX) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -destWidth / 2,
    -destHeight * anchorY,
    destWidth,
    destHeight
  );
}

function spriteAnimationState(entity) {
  const motion = state.entityMotion.get(entity.id);
  const now = state.snapshot?.serverTime || Date.now();
  const movingFrame = motion?.moving ? Math.floor(motion.moveCycle % SPRITE_SHEET_LAYOUT.cols) : 0;

  if (entity.heroType && entity.status?.castAnimationUntil > now) {
    const ratio = 1 - clamp((entity.status.castAnimationUntil - now) / 360, 0, 1);
    return {
      row: 1,
      frame: clamp(Math.floor(ratio * SPRITE_SHEET_LAYOUT.cols), 0, SPRITE_SHEET_LAYOUT.cols - 1)
    };
  }

  if (!entity.heroType && entity.attackAnimationUntil > now) {
    const ratio = 1 - clamp((entity.attackAnimationUntil - now) / 280, 0, 1);
    return {
      row: 1,
      frame: clamp(Math.floor(ratio * SPRITE_SHEET_LAYOUT.cols), 0, SPRITE_SHEET_LAYOUT.cols - 1)
    };
  }

  return {
    row: 0,
    frame: movingFrame
  };
}

function drawGroundShadow(size, options = {}) {
  const offsetY = options.offsetY ?? size * 0.88;
  const radiusX = options.radiusX ?? size * 0.98;
  const radiusY = options.radiusY ?? size * 0.42;
  const alpha = options.alpha ?? 0.28;
  const blur = options.blur ?? size * 0.9;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.filter = `blur(${blur}px)`;
  ctx.beginPath();
  ctx.ellipse(0, offsetY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawToken(entity, radius, options = {}) {
  const screen = worldToScreen(entity.x, entity.y);
  const palette = entityRenderPalette(entity);
  const size = radius * state.zoom;
  const isStructure = entity.kind === "turret" || entity.kind === "nexus";
  const isNeutral = entity.team === "neutral";
  const isLaneUnit = !entity.heroType && !isStructure && !isNeutral;
  const motion = state.entityMotion.get(entity.id);
  const mirrorSprite = isStructure ? false : (motion?.mirrorX ?? true);
  const lift = isStructure
    ? size * 0.06
    : entity.heroType
      ? size * 0.18
      : isLaneUnit
        ? size * 0.12
        : isNeutral
          ? size * 0.1
          : size * 0.44;
  const damageRatio = entity.maxHp ? 1 - clamp(entity.hp / entity.maxHp, 0, 1) : 0;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  drawGroundShadow(size, isStructure
    ? { offsetY: size * 0.92, radiusX: size * 1.3, radiusY: size * 0.5, alpha: 0.24, blur: size * 0.75 }
    : entity.heroType
      ? { offsetY: size * 0.86, radiusX: size * 0.92, radiusY: size * 0.36, alpha: 0.26, blur: size * 0.7 }
      : isLaneUnit
        ? { offsetY: size * 0.82, radiusX: size * 0.82, radiusY: size * 0.3, alpha: 0.22, blur: size * 0.58 }
        : { offsetY: size * 0.84, radiusX: size * 0.94, radiusY: size * 0.34, alpha: 0.24, blur: size * 0.65 });

  ctx.translate(0, -lift);
  ctx.lineWidth = Math.max(1.5, 2.5 * state.zoom);
  ctx.strokeStyle = palette.borderSoft;
  ctx.fillStyle = palette.shade;

  const heroSheet = entity.heroType ? getArtImage(heroSpriteSheetKey(entity.heroType)) : null;
  if (heroSheet) {
    const spriteSize = size * 3.15;
    const animation = spriteAnimationState(entity);
    drawSpriteSheetFrame(heroSheet, spriteSize, animation.row, animation.frame, 0, 0.9, mirrorSprite);
    if (options.outline) {
      ctx.strokeStyle = "rgba(255,255,255,0.48)";
      ctx.lineWidth = 2 * state.zoom;
      ctx.beginPath();
      ctx.ellipse(0, size * 0.54, size + 8 * state.zoom, size * 0.58 + 8 * state.zoom, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const heroSprite = entity.heroType ? getArtImage(heroSpriteKey(entity.heroType)) : null;
  if (heroSprite) {
    const spriteSize = size * 3.15;
    drawCroppedSprite(heroSpriteKey(entity.heroType), heroSprite, spriteSize, 0, 0.9, mirrorSprite);
    if (options.outline) {
      ctx.strokeStyle = "rgba(255,255,255,0.48)";
      ctx.lineWidth = 2 * state.zoom;
      ctx.beginPath();
      ctx.ellipse(0, size * 0.54, size + 8 * state.zoom, size * 0.58 + 8 * state.zoom, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const structureSpriteKey = entity.kind === "turret"
    ? (entity.team === "red" ? "structureRedTurret" : "structureTurret")
    : entity.kind === "nexus"
      ? (entity.team === "red" ? "structureRedNexus" : "structureNexus")
      : "";
  const structureSprite = structureSpriteKey ? getArtImage(structureSpriteKey) : null;
  if (structureSprite) {
    const spriteSize = entity.kind === "nexus" ? size * 3.6 : size * 3.1;
    drawCroppedSprite(structureSpriteKey, structureSprite, spriteSize, 0, 0.84, mirrorSprite);
    ctx.restore();
    return;
  }

  const laneCreepSheetKey = !entity.heroType && entity.team !== "neutral" ? creepSpriteSheetKey(entity) : "";
  const laneCreepSheet = laneCreepSheetKey ? getArtImage(laneCreepSheetKey) : null;
  if (laneCreepSheet) {
    const spriteSize = size * (entity.kind === "siege" ? 3.35 : 3);
    const animation = spriteAnimationState(entity);
    drawSpriteSheetFrame(laneCreepSheet, spriteSize, animation.row, animation.frame, 0, entity.kind === "siege" ? 0.8 : 0.78, mirrorSprite);
    ctx.restore();
    return;
  }
  const laneCreepSpriteKey = !entity.heroType && entity.team !== "neutral" ? creepSpriteKey(entity) : "";
  const laneCreepSprite = laneCreepSpriteKey ? getArtImage(laneCreepSpriteKey) : null;
  if (laneCreepSprite) {
    const spriteSize = size * (entity.kind === "siege" ? 3.35 : 3);
    drawCroppedSprite(laneCreepSpriteKey, laneCreepSprite, spriteSize, 0, entity.kind === "siege" ? 0.8 : 0.78, mirrorSprite);
    ctx.restore();
    return;
  }

  const jungleSheetKey = entity.team === "neutral" ? neutralSpriteSheetKey(entity) : "";
  const jungleSheet = jungleSheetKey ? getArtImage(jungleSheetKey) : null;
  if (jungleSheet) {
    const spriteSize = size * (jungleSheetKey === "neutralEliteSheet" ? 3.4 : 2.9);
    const animation = spriteAnimationState(entity);
    drawSpriteSheetFrame(jungleSheet, spriteSize, animation.row, animation.frame, 0, 0.8);
    ctx.restore();
    return;
  }
  const jungleSpriteKey = entity.team === "neutral" ? neutralSpriteKey(entity) : "";
  const jungleSprite = jungleSpriteKey ? getArtImage(jungleSpriteKey) : null;
  if (jungleSprite) {
    const spriteSize = size * (jungleSpriteKey === "neutralElite" ? 3.4 : 2.9);
    drawCroppedSprite(jungleSpriteKey, jungleSprite, spriteSize, 0, 0.8);
    ctx.restore();
    return;
  }

  if (entity.kind === "turret") {
    drawTowerShape(size, palette, damageRatio);
  } else if (entity.shape === "square") {
    ctx.fillRect(-size, -size * 0.35, size * 2, size * 1.5);
    ctx.beginPath();
    ctx.moveTo(-size, -size * 0.35);
    ctx.lineTo(0, -size * 1.15);
    ctx.lineTo(size, -size * 0.35);
    ctx.lineTo(0, size * 0.45);
    ctx.closePath();
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.stroke();
  } else if (entity.shape === "diamond") {
    drawRegularPolygonShape(4, size * 1.08, Math.PI / 4);
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.stroke();
  } else if (entity.shape === "hexagon") {
    drawRegularPolygonShape(6, size * 1.02, Math.PI / 6);
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.stroke();
  } else if (entity.shape === "pentagon") {
    drawRegularPolygonShape(5, size * 1.05, -Math.PI / 2);
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.stroke();
  } else if (entity.shape === "octagon") {
    drawRegularPolygonShape(8, size, Math.PI / 8);
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.stroke();
  } else if (entity.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.2);
    ctx.lineTo(size * 0.92, size * 0.4);
    ctx.lineTo(-size * 0.92, size * 0.4);
    ctx.closePath();
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.stroke();
  } else {
    const gradient = ctx.createRadialGradient(-size * 0.3, -size * 0.7, size * 0.1, 0, 0, size * 1.25);
    gradient.addColorStop(0, "rgba(255,255,255,0.82)");
    gradient.addColorStop(0.18, palette.fill);
    gradient.addColorStop(1, shadeColor(palette.fill, 0.64));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (entity.kind === "nexus") {
    drawNexusDamage(size, damageRatio);
  }

  if (entity.heroType) {
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = Math.max(2, 3.5 * state.zoom);
    if (entity.shape === "square") {
      ctx.strokeRect(-size, -size * 0.35, size * 2, size * 1.5);
    } else if (entity.shape === "diamond") {
      drawRegularPolygonShape(4, size * 1.08, Math.PI / 4);
      ctx.stroke();
    } else if (entity.shape === "hexagon") {
      drawRegularPolygonShape(6, size * 1.02, Math.PI / 6);
      ctx.stroke();
    } else if (entity.shape === "pentagon") {
      drawRegularPolygonShape(5, size * 1.05, -Math.PI / 2);
      ctx.stroke();
    } else if (entity.shape === "octagon") {
      drawRegularPolygonShape(8, size, Math.PI / 8);
      ctx.stroke();
    } else if (entity.shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.2);
      ctx.lineTo(size * 0.92, size * 0.4);
      ctx.lineTo(-size * 0.92, size * 0.4);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.88, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (options.outline) {
    ctx.strokeStyle = "rgba(255,255,255,0.48)";
    ctx.lineWidth = 2 * state.zoom;
    ctx.beginPath();
    ctx.ellipse(0, 0, size + 8 * state.zoom, size * 0.9 + 8 * state.zoom, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHealthBar(entity, radius) {
  const screen = worldToScreen(entity.x, entity.y);
  const isStructure = entity.kind === "turret" || entity.kind === "nexus";
  const width = (isStructure ? Math.max(28, radius * 1.65) : Math.max(40, radius * 2.5)) * state.zoom;
  const height = (isStructure ? 5 : 8) * state.zoom;
  const x = screen.x - width / 2;
  const y = isStructure
    ? screen.y - radius * (entity.kind === "nexus" ? 2.9 : 2.5) * state.zoom
    : screen.y - radius * 2.4 * state.zoom;
  const ratio = entity.maxHp ? clamp(entity.hp / entity.maxHp, 0, 1) : 0;

  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(x - 1, y - 1, width + 2, height + 2);
  ctx.fillStyle = teamColor(entity.team, 0.88);
  ctx.fillRect(x, y, width * ratio, height);
}

function drawNameplate(hero) {
  const screen = worldToScreen(hero.x, hero.y);
  ctx.fillStyle = "#f4ead5";
  ctx.font = `bold ${Math.max(11, 14 * state.zoom)}px Trebuchet MS`;
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,0.72)";
  const text = hero.name;
  ctx.strokeText(text, screen.x, screen.y - hero.radius * 2.9 * state.zoom);
  ctx.fillText(text, screen.x, screen.y - hero.radius * 2.9 * state.zoom);
}

function drawProjectiles() {
  for (const projectile of state.snapshot?.projectiles || []) {
    if (!isEntityVisible(projectile)) continue;
    const progress = projectile.duration ? 1 - clamp(projectile.ttl / projectile.duration, 0, 1) : 0;
    const remaining = 1 - progress;
    const angle = Math.atan2(projectile.vy, projectile.vx);
    const speed = Math.max(1, Math.hypot(projectile.vx, projectile.vy));
    const stretch = clamp(speed / 16, 0.9, 1.8) * state.zoom;
    const pulse = Math.sin(progress * Math.PI * 8);
    const bob = Math.sin(progress * Math.PI) * (projectile.kind === "arc" ? 18 : projectile.kind === "round" ? 8 : 5) * state.zoom;
    const lateral = Math.sin(progress * Math.PI * 5) * (projectile.kind === "fan" ? 3.5 : projectile.kind === "bolt" ? 2.5 : 1.5) * state.zoom;
    const screen = worldToScreen(projectile.x, projectile.y);
    const drawX = screen.x;
    const drawY = screen.y - bob;
    const trailLength = (projectile.kind === "round" ? 42 : projectile.kind === "fan" ? 28 : projectile.kind === "arc" ? 36 : 34) * stretch;
    const radius = projectile.radius * state.zoom;
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(-trailLength, 0, 0, 0);
    const drawTrailPuffs = (color, count, spread, maxRadius) => {
      for (let index = 0; index < count; index += 1) {
        const t = index / Math.max(1, count - 1);
        const px = -trailLength * (0.2 + t * 0.8);
        const py = Math.sin(progress * Math.PI * (3 + index * 0.45) + index) * spread * (1 - t);
        ctx.fillStyle = color(1 - t);
        ctx.beginPath();
        ctx.ellipse(px, py, maxRadius * (1 - t * 0.55), maxRadius * 0.62 * (1 - t * 0.45), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    if (projectile.kind === "bolt") {
      gradient.addColorStop(0, "rgba(255, 122, 188, 0)");
      gradient.addColorStop(0.3, "rgba(255, 122, 188, 0.3)");
      gradient.addColorStop(0.72, "rgba(255, 148, 208, 0.92)");
      gradient.addColorStop(1, "rgba(255, 240, 248, 0.98)");
      drawTrailPuffs((alpha) => `rgba(255, 140, 200, ${alpha * 0.18})`, 5, 4 * state.zoom, 6 * state.zoom);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(-trailLength * (0.92 + remaining * 0.08), lateral * 0.2);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 246, 251, 0.85)";
      ctx.lineWidth = 2 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(-trailLength * 0.3, 0);
      ctx.lineTo(radius * 1.8, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 242, 248, 0.98)";
      ctx.beginPath();
      ctx.moveTo(radius * 2.15, 0);
      ctx.lineTo(radius * 0.15, radius * 0.78 + lateral * 0.18);
      ctx.lineTo(-radius * 0.95, radius * 0.48);
      ctx.lineTo(-radius * 0.3, 0);
      ctx.lineTo(-radius * 0.95, -radius * 0.48);
      ctx.lineTo(radius * 0.15, -radius * 0.78 - lateral * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 160, 216, 0.46)";
      ctx.beginPath();
      ctx.ellipse(radius * 0.55, 0, radius * 1.45, radius * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (projectile.kind === "fan") {
      gradient.addColorStop(0, "rgba(255, 215, 120, 0)");
      gradient.addColorStop(0.28, "rgba(255, 215, 120, 0.22)");
      gradient.addColorStop(0.65, "rgba(255, 215, 120, 0.86)");
      gradient.addColorStop(1, "rgba(255, 248, 214, 0.96)");
      drawTrailPuffs((alpha) => `rgba(255, 214, 122, ${alpha * 0.16})`, 4, 6 * state.zoom, 7 * state.zoom);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 7 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(-trailLength, lateral * 0.3);
      ctx.lineTo(radius * 0.5, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 236, 174, 0.96)";
      ctx.beginPath();
      ctx.moveTo(radius * 1.8, 0);
      ctx.lineTo(-radius * 1.25, radius * 0.92 + lateral * 0.22);
      ctx.lineTo(-radius * 0.3, 0);
      ctx.lineTo(-radius * 1.25, -radius * 0.92 - lateral * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 249, 227, 0.86)";
      ctx.lineWidth = 1.6 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(radius * 1.25, 0);
      ctx.lineTo(-radius * 0.9, radius * 0.48);
      ctx.moveTo(radius * 1.25, 0);
      ctx.lineTo(-radius * 0.9, -radius * 0.48);
      ctx.stroke();
    } else if (projectile.kind === "arc") {
      gradient.addColorStop(0, "rgba(143, 155, 255, 0)");
      gradient.addColorStop(0.34, "rgba(143, 155, 255, 0.2)");
      gradient.addColorStop(0.72, "rgba(143, 155, 255, 0.86)");
      gradient.addColorStop(1, "rgba(236, 240, 255, 0.98)");
      drawTrailPuffs((alpha) => `rgba(158, 172, 255, ${alpha * 0.14})`, 5, 3 * state.zoom, 6 * state.zoom);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4.5 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(-trailLength, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      const ringTilt = 0.35 + Math.sin(progress * Math.PI * 2) * 0.1;
      ctx.strokeStyle = "rgba(235, 241, 255, 0.9)";
      ctx.lineWidth = 1.8 * state.zoom;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.45, radius * ringTilt, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(progress * Math.PI * 6);
      ctx.strokeStyle = "rgba(180, 196, 255, 0.76)";
      ctx.lineWidth = 1.4 * state.zoom;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 1.32);
      ctx.stroke();
      ctx.fillStyle = "rgba(245, 248, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
      ctx.fill();
    } else if (projectile.kind === "round") {
      gradient.addColorStop(0, "rgba(109, 255, 179, 0)");
      gradient.addColorStop(0.28, "rgba(109, 255, 179, 0.18)");
      gradient.addColorStop(0.62, "rgba(109, 255, 179, 0.84)");
      gradient.addColorStop(1, "rgba(239, 255, 245, 0.98)");
      drawTrailPuffs((alpha) => `rgba(136, 255, 190, ${alpha * 0.14})`, 6, 4 * state.zoom, 7 * state.zoom);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(-trailLength, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(240, 255, 246, 0.98)";
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (0.92 + pulse * 0.05), radius * (0.78 - pulse * 0.03), 0, 0, Math.PI * 2);
      ctx.fill();
      const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.4);
      coreGradient.addColorStop(0, "rgba(255,255,255,0.98)");
      coreGradient.addColorStop(0.35, "rgba(193,255,220,0.9)");
      coreGradient.addColorStop(1, "rgba(109,255,179,0)");
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(109, 255, 179, 0.92)";
      ctx.lineWidth = 2 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(-radius * 1.25, -radius * 0.18);
      ctx.quadraticCurveTo(0, -radius * 1.3, radius * 1.25, radius * 0.18);
      ctx.moveTo(-radius * 1.25, radius * 0.18);
      ctx.quadraticCurveTo(0, radius * 1.3, radius * 1.25, -radius * 0.18);
      ctx.stroke();
    } else {
      gradient.addColorStop(0, teamColor(projectile.team, 0));
      gradient.addColorStop(1, teamColor(projectile.team, 0.9));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(-trailLength * remaining, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = teamColor(projectile.team, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawEffect(effect) {
  if (!isEntityVisible({ team: effect.team, x: effect.x, y: effect.y, radius: effect.radius || 60 })) return;
  const progress = effect.duration ? 1 - clamp(effect.ttl / effect.duration, 0, 1) : 0;
  ctx.save();

  if (["line", "beam", "dash", "slam"].includes(effect.type)) {
    const start = worldToScreen(effect.x, effect.y);
    const end = worldToScreen(effect.x2, effect.y2);
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    const isStructureShot = effect.sourceType === "turret" || effect.sourceType === "nexus";
    const shotCore = effect.team === "blue" ? "rgba(255, 214, 120, 0.96)" : "rgba(255, 184, 120, 0.96)";
    const shotGlow = effect.team === "blue" ? "rgba(158, 220, 255, 0.82)" : "rgba(255, 146, 128, 0.82)";
    if (isStructureShot) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const beamLength = Math.hypot(dx, dy);
      gradient.addColorStop(0, "rgba(255, 220, 150, 0)");
      gradient.addColorStop(0.18, shotGlow);
      gradient.addColorStop(0.56, shotCore);
      gradient.addColorStop(1, "rgba(255, 220, 150, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.strokeStyle = shotCore;
      ctx.lineWidth = 3 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.save();
      ctx.translate(start.x, start.y);
      ctx.rotate(angle);
      const muzzleGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 18 * state.zoom);
      muzzleGradient.addColorStop(0, shotCore);
      muzzleGradient.addColorStop(0.55, shotGlow);
      muzzleGradient.addColorStop(1, "rgba(255, 220, 150, 0)");
      ctx.fillStyle = muzzleGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 18 * state.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = shotCore;
      ctx.beginPath();
      ctx.moveTo(beamLength, 0);
      ctx.lineTo(beamLength - 14 * state.zoom, 6 * state.zoom);
      ctx.lineTo(beamLength - 14 * state.zoom, -6 * state.zoom);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const impactGradient = ctx.createRadialGradient(end.x, end.y, 0, end.x, end.y, 22 * state.zoom);
      impactGradient.addColorStop(0, shotCore);
      impactGradient.addColorStop(0.45, shotGlow);
      impactGradient.addColorStop(1, "rgba(255, 220, 150, 0)");
      ctx.fillStyle = impactGradient;
      ctx.beginPath();
      ctx.arc(end.x, end.y, 22 * state.zoom, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const style = effect.style || "";
      if (style === "beamline") {
        gradient.addColorStop(0, "rgba(255, 118, 176, 0)");
        gradient.addColorStop(0.5, "rgba(255, 118, 176, 0.9)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 12 * state.zoom;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (style === "lumen-wave") {
        gradient.addColorStop(0, "rgba(255, 211, 110, 0)");
        gradient.addColorStop(0.35, "rgba(255, 241, 196, 0.86)");
        gradient.addColorStop(0.7, "rgba(143, 214, 255, 0.88)");
        gradient.addColorStop(1, "rgba(255, 211, 110, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 10 * state.zoom;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (style === "comet-dash" || style === "flash-step" || style === "snapback") {
        gradient.addColorStop(0, teamColor(effect.team, 0));
        gradient.addColorStop(0.55, teamColor(effect.team, 0.92));
        gradient.addColorStop(1, "rgba(255,255,255,0.12)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = style === "snapback" ? 5 * state.zoom : 7 * state.zoom;
        ctx.setLineDash(style === "flash-step" ? [8 * state.zoom, 6 * state.zoom] : []);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (style === "bulwark-ram" || style === "earthsplitter") {
        gradient.addColorStop(0, "rgba(255, 186, 98, 0)");
        gradient.addColorStop(0.45, "rgba(255, 186, 98, 0.9)");
        gradient.addColorStop(1, "rgba(255, 240, 212, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = style === "earthsplitter" ? 9 * state.zoom : 8 * state.zoom;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (style === "quick-slash" || style === "heavy-cleave" || style === "minion-smack" || style === "beast-bite") {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);
        const reach = Math.hypot(dx, dy);
        const trailLength = Math.max(8 * state.zoom, reach * 0.45);
        gradient.addColorStop(0, teamColor(effect.team, 0));
        gradient.addColorStop(0.55, teamColor(effect.team, 0.55));
        gradient.addColorStop(1, teamColor(effect.team, 0));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = style === "heavy-cleave" ? 7 * state.zoom : style === "beast-bite" ? 6 * state.zoom : 5 * state.zoom;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(start.x + Math.cos(angle) * trailLength, start.y + Math.sin(angle) * trailLength);
        ctx.stroke();

        ctx.save();
        ctx.translate(end.x, end.y);
        ctx.rotate(angle);
        ctx.strokeStyle = style === "heavy-cleave"
          ? `rgba(255, 214, 158, ${0.86 - progress * 0.35})`
          : style === "beast-bite"
            ? `rgba(231, 186, 99, ${0.86 - progress * 0.35})`
            : `rgba(245, 240, 226, ${0.86 - progress * 0.35})`;
        ctx.lineWidth = style === "heavy-cleave" ? 4.5 * state.zoom : 3.2 * state.zoom;
        ctx.beginPath();
        if (style === "heavy-cleave") {
          ctx.arc(0, 0, 18 * state.zoom, -1.15, 0.75);
        } else if (style === "beast-bite") {
          ctx.moveTo(-10 * state.zoom, -8 * state.zoom);
          ctx.lineTo(6 * state.zoom, 0);
          ctx.lineTo(-10 * state.zoom, 8 * state.zoom);
        } else if (style === "minion-smack") {
          ctx.arc(0, 0, 12 * state.zoom, -0.9, 0.4);
        } else {
          ctx.arc(0, 0, 14 * state.zoom, -1.0, 0.55);
        }
        ctx.stroke();

        if (style !== "beast-bite") {
          ctx.strokeStyle = `rgba(255,255,255,${0.35 - progress * 0.15})`;
          ctx.lineWidth = 1.6 * state.zoom;
          ctx.beginPath();
          ctx.arc(0, 0, style === "heavy-cleave" ? 12 * state.zoom : 9 * state.zoom, -0.85, 0.3);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        gradient.addColorStop(0, teamColor(effect.team, 0));
        gradient.addColorStop(0.35, teamColor(effect.team, 0.85));
        gradient.addColorStop(1, teamColor(effect.team, 0));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = effect.type === "beam" ? 10 * state.zoom : 6 * state.zoom;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }
  } else if (effect.type === "ring" || effect.type === "guard") {
    const screen = worldToScreen(effect.x, effect.y);
    const radius = (effect.radius || 80) * state.zoom * (0.72 + progress * 0.4);
    const style = effect.style || "";
    ctx.lineWidth = 5 * state.zoom;
    if (style === "fountain-aura") {
      const auraGradient = ctx.createRadialGradient(screen.x, screen.y, radius * 0.18, screen.x, screen.y, radius * 1.1);
      auraGradient.addColorStop(0, effect.team === "blue" ? "rgba(127, 214, 255, 0.22)" : "rgba(255, 138, 128, 0.2)");
      auraGradient.addColorStop(0.55, effect.team === "blue" ? "rgba(127, 214, 255, 0.09)" : "rgba(255, 138, 128, 0.08)");
      auraGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 2.4, radius * ISO_Y * 2.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = effect.team === "blue"
        ? `rgba(190, 237, 255, ${0.82 - progress * 0.45})`
        : `rgba(255, 215, 210, ${0.82 - progress * 0.45})`;
      ctx.lineWidth = 3.2 * state.zoom;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 2.05, radius * ISO_Y * 2.05, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = effect.team === "blue"
        ? `rgba(103, 215, 255, ${0.58 - progress * 0.35})`
        : `rgba(255, 138, 128, ${0.54 - progress * 0.34})`;
      ctx.lineWidth = 2 * state.zoom;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 1.35, radius * ISO_Y * 1.35, progress * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (style === "pulse-ring" || style === "iron-roar") {
      ctx.strokeStyle = style === "iron-roar" ? `rgba(199, 146, 255, ${0.82 - progress * 0.4})` : `rgba(103, 215, 255, ${0.82 - progress * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 2, radius * ISO_Y * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.24 - progress * 0.14})`;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 1.45, radius * ISO_Y * 1.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (style === "guard-field" || style === "bastion-link" || style === "lock-on" || style === "solar-mend") {
      ctx.strokeStyle = style === "solar-mend"
        ? `rgba(255, 215, 110, ${0.8 - progress * 0.35})`
        : teamColor(effect.team, 0.78 - progress * 0.4);
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 2, radius * ISO_Y * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([6 * state.zoom, 4 * state.zoom]);
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 1.25, radius * ISO_Y * 1.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = teamColor(effect.team, 0.78 - progress * 0.4);
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * ISO_X * 2, radius * ISO_Y * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (effect.type === "burst") {
    const screen = worldToScreen(effect.x, effect.y);
    const radius = (effect.radius || 90) * state.zoom * (0.6 + progress * 0.7);
    const gradient = ctx.createRadialGradient(screen.x, screen.y, radius * 0.1, screen.x, screen.y, radius);
    const style = effect.style || "";
    if (style === "bolt-impact") {
      gradient.addColorStop(0, "rgba(255, 248, 252, 0.96)");
      gradient.addColorStop(0.28, "rgba(255, 156, 214, 0.7)");
      gradient.addColorStop(1, "rgba(255, 122, 188, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 238, 246, ${0.92 - progress * 0.5})`;
      ctx.lineWidth = 2.2 * state.zoom;
      for (let index = 0; index < 5; index += 1) {
        const angle = progress * Math.PI * 1.7 + (Math.PI * 2 * index) / 5;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x + Math.cos(angle) * radius * 0.88, screen.y + Math.sin(angle) * radius * 0.88);
        ctx.stroke();
      }
    } else if (style === "fan-impact") {
      gradient.addColorStop(0, "rgba(255, 248, 214, 0.94)");
      gradient.addColorStop(0.34, "rgba(255, 214, 122, 0.64)");
      gradient.addColorStop(1, "rgba(255, 214, 122, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 239, 190, ${0.84 - progress * 0.42})`;
      ctx.lineWidth = 2 * state.zoom;
      for (let index = 0; index < 3; index += 1) {
        const spreadAngle = -0.52 + index * 0.52 + progress * 0.12;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x + Math.cos(spreadAngle) * radius * 0.98, screen.y + Math.sin(spreadAngle) * radius * 0.58);
        ctx.stroke();
      }
    } else if (style === "arc-impact") {
      gradient.addColorStop(0, "rgba(241, 244, 255, 0.96)");
      gradient.addColorStop(0.32, "rgba(158, 172, 255, 0.62)");
      gradient.addColorStop(1, "rgba(143, 155, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(229, 235, 255, ${0.9 - progress * 0.44})`;
      ctx.lineWidth = 2.1 * state.zoom;
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * 0.9, radius * 0.42, progress * Math.PI * 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y, radius * 0.52, radius * 0.94, -progress * Math.PI * 2.6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (style === "round-impact") {
      gradient.addColorStop(0, "rgba(250, 255, 252, 0.96)");
      gradient.addColorStop(0.26, "rgba(173, 255, 212, 0.66)");
      gradient.addColorStop(1, "rgba(109, 255, 179, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(229, 255, 239, ${0.92 - progress * 0.46})`;
      ctx.lineWidth = 2 * state.zoom;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * (0.34 + progress * 0.62), 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screen.x - radius * 0.72, screen.y);
      ctx.lineTo(screen.x + radius * 0.72, screen.y);
      ctx.moveTo(screen.x, screen.y - radius * 0.72);
      ctx.lineTo(screen.x, screen.y + radius * 0.72);
      ctx.stroke();
    } else if (style === "thunder-bloom") {
      gradient.addColorStop(0, "rgba(143, 155, 255, 0.42)");
      gradient.addColorStop(0.55, "rgba(143, 155, 255, 0.18)");
      gradient.addColorStop(1, "rgba(143, 155, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(231, 236, 255, ${0.8 - progress * 0.35})`;
      ctx.lineWidth = 2.2 * state.zoom;
      for (let index = 0; index < 4; index += 1) {
        const angle = progress * Math.PI * 1.6 + (Math.PI / 2) * index;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x + Math.cos(angle) * radius * 0.9, screen.y + Math.sin(angle) * radius * 0.9);
        ctx.stroke();
      }
    } else if (style === "quake" || style === "titan-march") {
      gradient.addColorStop(0, teamColor(effect.team, 0.24));
      gradient.addColorStop(1, teamColor(effect.team, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 196, 128, ${0.72 - progress * 0.32})`;
      ctx.lineWidth = 3 * state.zoom;
      ctx.beginPath();
      ctx.moveTo(screen.x - radius * 0.8, screen.y + radius * 0.18);
      ctx.lineTo(screen.x - radius * 0.18, screen.y - radius * 0.08);
      ctx.lineTo(screen.x + radius * 0.14, screen.y + radius * 0.16);
      ctx.lineTo(screen.x + radius * 0.72, screen.y - radius * 0.12);
      ctx.stroke();
    } else if (style === "slipstream") {
      gradient.addColorStop(0, "rgba(103, 215, 255, 0.38)");
      gradient.addColorStop(1, "rgba(103, 215, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(220, 247, 255, ${0.78 - progress * 0.35})`;
      ctx.lineWidth = 2.4 * state.zoom;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * 0.64, progress, progress + Math.PI * 1.5);
      ctx.stroke();
    } else {
      gradient.addColorStop(0, teamColor(effect.team, 0.3));
      gradient.addColorStop(1, teamColor(effect.team, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (effect.type === "text") {
    const screen = worldToScreen(effect.x, effect.y - progress * 22);
    ctx.fillStyle = "#e7ba63";
    ctx.font = `bold ${Math.max(12, 16 * state.zoom)}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.fillText(effect.text, screen.x, screen.y);
  }

  ctx.restore();
}

function drawWorld() {
  const snapshot = state.snapshot;
  if (!snapshot) return;

  for (const structure of snapshot.structures) {
    if (!isStructureVisible(structure, snapshot)) continue;
    const structureVisible = isEntityVisible(structure, snapshot);
    if (!structureVisible) continue;
    drawIsoCircle(structure.x, structure.y, structure.radius + 22, structure.vulnerable ? "rgba(231, 186, 99, 0.08)" : "rgba(255,255,255,0.04)");
    drawToken({ ...structure, shape: structure.kind === "nexus" ? "circle" : "square" }, structure.radius, {});
    drawHealthBar(structure, structure.radius);
  }

  for (const camp of snapshot.camps) {
    if (!camp.alive || !isEntityVisible(camp, snapshot)) continue;
    drawToken({ ...camp, shape: "triangle", team: "neutral" }, camp.radius * 0.9);
    drawHealthBar(camp, camp.radius);
  }

  for (const minion of snapshot.minions) {
    if (!isEntityVisible(minion, snapshot)) continue;
    const shape = minion.kind === "ranged" ? "triangle" : minion.kind === "siege" ? "square" : "circle";
    drawToken({ ...minion, shape }, minion.radius);
    drawHealthBar(minion, minion.radius);
  }

  for (const hero of snapshot.heroes) {
    if (!hero.alive || !isEntityVisible(hero, snapshot)) continue;
    drawToken(hero, hero.radius, { outline: hero.id === snapshot.you?.id });
    drawHealthBar(hero, hero.radius);
    drawNameplate(hero);
  }

  drawProjectiles();

  for (const effect of snapshot.effects) {
    drawEffect(effect);
  }

  if (state.ping) {
    const elapsed = Date.now() - state.ping.startedAt;
    if (elapsed < 600) {
      const screen = worldToScreen(state.ping.x, state.ping.y);
      const ratio = elapsed / 600;
      ctx.strokeStyle = `rgba(127, 214, 255, ${1 - ratio})`;
      ctx.lineWidth = 3 * state.zoom;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, ratio * 30 * state.zoom, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      state.ping = null;
    }
  }

  if (state.targetingAbility && snapshot.you) {
    const heroScreen = worldToScreen(snapshot.you.x, snapshot.you.y);
    const targetScreen = worldToScreen(state.mouse.worldX, state.mouse.worldY);
    ctx.save();
    ctx.strokeStyle = "rgba(231, 186, 99, 0.72)";
    ctx.lineWidth = 2 * state.zoom;
    ctx.setLineDash([8 * state.zoom, 8 * state.zoom]);
    ctx.beginPath();
    ctx.moveTo(heroScreen.x, heroScreen.y);
    ctx.lineTo(targetScreen.x, targetScreen.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255, 245, 214, 0.85)";
    ctx.lineWidth = 3 * state.zoom;
    ctx.beginPath();
    ctx.arc(targetScreen.x, targetScreen.y, 14 * state.zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(targetScreen.x - 18 * state.zoom, targetScreen.y);
    ctx.lineTo(targetScreen.x + 18 * state.zoom, targetScreen.y);
    ctx.moveTo(targetScreen.x, targetScreen.y - 18 * state.zoom);
    ctx.lineTo(targetScreen.x, targetScreen.y + 18 * state.zoom);
    ctx.stroke();
    ctx.restore();
  }
}

function drawObscuredStructures() {
  const snapshot = state.snapshot;
  if (!snapshot) return;

  for (const structure of snapshot.structures) {
    if (!isStructureVisible(structure, snapshot) || isEntityVisible(structure, snapshot)) continue;
    ctx.save();
    ctx.globalAlpha = 0.36;
    drawIsoCircle(structure.x, structure.y, structure.radius + 18, "rgba(255,255,255,0.025)");
    drawToken({ ...structure, shape: structure.kind === "nexus" ? "circle" : "square" }, structure.radius, {});
    ctx.restore();
  }
}

function drawFogOfWar() {
  const snapshot = state.snapshot;
  if (!snapshot?.you) return;

  markFogMemory(snapshot);
  const cellSize = FOG_CELL_SIZE * visionScale(snapshot);
  const corners = [
    screenToWorld(0, 0),
    screenToWorld(canvas.width, 0),
    screenToWorld(0, canvas.height),
    screenToWorld(canvas.width, canvas.height)
  ];
  const minX = Math.min(...corners.map((corner) => corner.x)) - cellSize * 2;
  const maxX = Math.max(...corners.map((corner) => corner.x)) + cellSize * 2;
  const minY = Math.min(...corners.map((corner) => corner.y)) - cellSize * 2;
  const maxY = Math.max(...corners.map((corner) => corner.y)) + cellSize * 2;

  ctx.save();
  for (let x = Math.floor(minX / cellSize) * cellSize; x < maxX; x += cellSize) {
    for (let y = Math.floor(minY / cellSize) * cellSize; y < maxY; y += cellSize) {
      const centerX = x + cellSize / 2;
      const centerY = y + cellSize / 2;
      if (isPointVisible(centerX, centerY, snapshot)) continue;

      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const explored = hasSeenFogCell(cellX, cellY);
      drawDiamond(
        { x: centerX, y: centerY },
        cellSize * 1.06,
        explored ? "rgba(4, 7, 12, 0.16)" : "rgba(2, 4, 8, 0.34)"
      );
    }
  }

  ctx.restore();
}

function frame() {
  updateCamera();
  scheduleMusic();
  drawBackground();
  drawWorld();
  drawFogOfWar();
  drawObscuredStructures();
  requestAnimationFrame(frame);
}

heroCards.forEach((card) => {
  card.addEventListener("click", () => {
    state.heroType = card.dataset.hero;
    syncHeroSelection();
  });
});

joinButton.addEventListener("click", () => {
  joinMatch().catch((error) => {
    statusText.textContent = `Join failed: ${error.message}`;
  });
});

function handleKeyDown(event) {
  const isScoreboardKey = event.key.toLowerCase() === "s" || event.code === "KeyS";
  if (isScoreboardKey) {
    event.preventDefault();
    if (!state.snapshot?.you) return;
    if (!state.scoreboardOpen) {
      state.scoreboardOpen = true;
      updateScoreboard();
    }
    return;
  }

  if (!state.snapshot?.you) return;

  const key = event.key.toLowerCase();
  if (key === "escape") {
    cancelAbilityTargeting();
  } else if (key === " ") {
    clearCameraOverride();
    state.zoomTarget = DEFAULT_VIEW_ZOOM;
  } else if (["q", "w", "e"].includes(key)) {
    if ((state.snapshot?.you?.cooldowns?.[key] || 0) > Date.now()) {
      playUiSound("error");
      return;
    }
    if (requiresAbilityClickTarget(state.snapshot?.you?.heroType, key)) {
      if (state.targetingAbility?.slot === key) {
        cancelAbilityTargeting();
      } else {
        startAbilityTargeting(key);
      }
      return;
    }
    playAbilityStyleSound(heroCastStyle(state.snapshot?.you?.heroType, key));
    queueAction({ type: "cast", slot: key, x: state.mouse.worldX, y: state.mouse.worldY });
  } else if (key === "b") {
    cancelAbilityTargeting();
    playUiSound("recall");
    queueAction({ type: "recall" });
  }
}

function handleKeyUp(event) {
  const isScoreboardKey = event.key.toLowerCase() === "s" || event.code === "KeyS";
  if (!isScoreboardKey) return;
  event.preventDefault();
  if (!state.scoreboardOpen) return;
  state.scoreboardOpen = false;
  updateScoreboard();
}

document.addEventListener("keydown", handleKeyDown, true);
document.addEventListener("keyup", handleKeyUp, true);
document.addEventListener("pointerdown", unlockAudio, { capture: true, passive: true });
document.addEventListener("keydown", unlockAudio, { capture: true });
window.addEventListener("blur", () => {
  if (!state.scoreboardOpen) return;
  state.scoreboardOpen = false;
  updateScoreboard();
});

function tooltipTargetFromEvent(event) {
  return event.target.closest("[data-tooltip-title], [data-tooltip-body], [data-tooltip-extra]");
}

function handleTooltipMove(event) {
  const target = tooltipTargetFromEvent(event);
  if (!target) {
    hideFloatingTooltip();
    return;
  }
  showFloatingTooltip(target, event.clientX, event.clientY);
}

hud.addEventListener("mousemove", handleTooltipMove);
shop.addEventListener("mousemove", handleTooltipMove);
hud.addEventListener("mouseleave", hideFloatingTooltip);
shop.addEventListener("mouseleave", hideFloatingTooltip);
function handleInventoryUpgradeClick(event) {
  const slot = event.target.closest(".item-slot[data-item-index]");
  if (!slot) return;
  if (!hud.contains(slot)) return;
  const you = state.snapshot?.you;
  if (!you) return;
  const index = Number(slot.dataset.itemIndex);
  const item = you.items[index];
  const detail = item ? (state.snapshot?.shopItems || []).find((entry) => entry.key === item.key) : null;
  if (!item || !detail) return;
  const level = item.level || 1;
  const maxLevel = detail.maxLevel || 3;
  if (level >= maxLevel) {
    state.shopFeedback = `${item.label} is max level`;
    updateShop();
    return;
  }
  if (!you.inBase) {
    state.shopFeedback = "Return to fountain to upgrade";
    updateShop();
    return;
  }
  const upgradeCost = Math.round((detail.cost || 0) * (0.85 + level * 0.35));
  if (you.gold < upgradeCost) {
    state.shopFeedback = `Insufficient funds: need ${upgradeCost - you.gold} more gold`;
    updateShop();
    return;
  }
  state.shopFeedback = "";
  playUiSound("upgrade");
  queueAction({ type: "upgrade-item", index });
}

document.addEventListener("click", handleInventoryUpgradeClick, true);

function attemptBuyItem(itemKey, itemCost) {
  const you = state.snapshot?.you;
  if (!you) return;
  if (you.gold < itemCost) {
    state.shopFeedback = `Insufficient funds: need ${itemCost - you.gold} more gold`;
    updateShop();
    return;
  }
  if (you.items.length >= 6) {
    state.shopFeedback = "Inventory full";
    updateShop();
    return;
  }
  if (you.items.some((item) => item && item.key === itemKey)) {
    state.shopFeedback = "Item already owned";
    updateShop();
    return;
  }
  if (!you.inBase) {
    state.shopFeedback = "Return to fountain to buy";
    updateShop();
    return;
  }
  state.shopFeedback = "";
  playUiSound("buy");
  queueAction({ type: "buy-item", itemKey });
}

shop.addEventListener("dblclick", (event) => {
  const card = event.target.closest("[data-item-key]");
  if (!card || !shop.contains(card)) return;
  attemptBuyItem(card.dataset.itemKey || "", Number(card.dataset.itemCost) || 0);
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  if (state.targetingAbility) {
    cancelAbilityTargeting();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const targetEntity = rightClickTargetEntity(clickX, clickY);
  const rangedTarget = rightClickMoveTarget(clickX, clickY);
  const world = rangedTarget || screenToWorld(clickX, clickY);
  state.moveTarget = { x: world.x, y: world.y };
  if (targetEntity) {
    queueAction({ type: "set-focus", targetId: targetEntity.id });
  } else {
    queueAction({ type: "clear-focus" });
  }
  spawnLocalPing(world.x, world.y);
});
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = event.clientX - rect.left;
  state.mouse.y = event.clientY - rect.top;
  const world = screenToWorld(state.mouse.x, state.mouse.y);
  state.mouse.worldX = world.x;
  state.mouse.worldY = world.y;
});

canvas.addEventListener("mousedown", (event) => {
  if (!state.snapshot?.you || event.button !== 2) return;
  if (state.targetingAbility) return;
  clearCameraOverride();

  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const targetEntity = rightClickTargetEntity(clickX, clickY);
  const rangedTarget = rightClickMoveTarget(clickX, clickY);
  const world = rangedTarget || screenToWorld(clickX, clickY);
  state.moveTarget = {
    x: clamp(world.x, 0, state.snapshot.world.width),
    y: clamp(world.y, 0, state.snapshot.world.height)
  };
  if (targetEntity) {
    queueAction({ type: "set-focus", targetId: targetEntity.id });
  } else {
    queueAction({ type: "clear-focus" });
  }
});

canvas.addEventListener("click", (event) => {
  if (!state.snapshot?.you || event.button !== 0) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  if (state.targetingAbility) {
    const world = screenToWorld(clickX, clickY);
    commitAbilityTargeting(
      clamp(world.x, 0, state.snapshot.world.width),
      clamp(world.y, 0, state.snapshot.world.height)
    );
    return;
  }
  selectEntityAtScreen(clickX, clickY);
  updateHud();
});

minimap.addEventListener("pointerdown", (event) => {
  const mapSurface = minimap.querySelector(".minimap");
  if (!mapSurface || !state.snapshot?.world) return;

  const surfaceRect = mapSurface.getBoundingClientRect();
  if (
    event.clientX < surfaceRect.left ||
    event.clientX > surfaceRect.right ||
    event.clientY < surfaceRect.top ||
    event.clientY > surfaceRect.bottom
  ) {
    return;
  }

  event.preventDefault();
  const ratioX = clamp((event.clientX - surfaceRect.left) / surfaceRect.width, 0, 1);
  const ratioY = clamp((event.clientY - surfaceRect.top) / surfaceRect.height, 0, 1);
  const worldX = state.snapshot.world.width * ratioX;
  const worldY = state.snapshot.world.height * ratioY;
  if (event.button === 2) {
    spawnLocalPing(worldX, worldY);
    return;
  }
  focusCameraAtWorld(worldX, worldY);
});

minimap.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  state.zoomTarget = clamp(state.zoomTarget - Math.sign(event.deltaY) * 0.06, MIN_VIEW_ZOOM, MAX_VIEW_ZOOM);
}, { passive: false });

window.addEventListener("resize", resize);
resize();
window.setTimeout(() => {
  dismissSplash().catch(() => {
    lobbyScreen.classList.remove("hidden");
  });
}, 2400);
requestAnimationFrame(frame);
