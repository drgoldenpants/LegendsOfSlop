import crypto from "node:crypto";

function s(value) {
  return Math.round(value * STAT_SCALE);
}

function m(value) {
  return Math.round(value * MAP_GEOMETRY_SCALE);
}

function scalePoint(point) {
  return {
    x: m(point.x),
    y: m(point.y)
  };
}

function scalePath(path) {
  return path.map(scalePoint);
}

function r(value) {
  return Math.round(s(value) * HITBOX_SCALE);
}

const TICK_RATE = 20;
const TICK_MS = 1000 / TICK_RATE;
const GAME_SPEED = 1.5;
const STAT_SCALE = 1.35;
const MAP_GEOMETRY_SCALE = 2.7;
const RAW_WORLD = { width: 5600, height: 3600 };
const TEAM_SIZE = 5;
const HITBOX_SCALE = 1.25;
const BASE_AURA_RADIUS = s(360);
const SHOP_RADIUS = s(340);
const WORLD = { width: m(RAW_WORLD.width), height: m(RAW_WORLD.height) };
const BLUE = "blue";
const RED = "red";
const TEAMS = [BLUE, RED];
const TEAM_INDEX = { blue: 0, red: 1 };
const WAVE_INTERVAL = 11;
const CAMP_RESPAWN = 40;
const SESSION_RESUME_WINDOW_MS = 30 * 60 * 1000;
const MAX_MESSAGES = 12;
const ASSIST_WINDOW_MS = 10000;
const LANE_KEYS = ["top", "mid", "bot"];
function mirrorRawPoint(point) {
  return {
    x: RAW_WORLD.width - point.x,
    y: RAW_WORLD.height - point.y
  };
}

function mirroredRawPath(path) {
  return path.map(mirrorRawPoint).reverse();
}

const RAW_BLUE_BASE = { x: 360, y: 3140 };
const RAW_RED_BASE = mirrorRawPoint(RAW_BLUE_BASE);
const RAW_TOP_PATH = [
  RAW_BLUE_BASE,
  { x: 300, y: 2580 },
  { x: 250, y: 2060 },
  { x: 240, y: 1560 },
  { x: 300, y: 1100 },
  { x: 560, y: 760 },
  { x: 920, y: 500 },
  { x: 1480, y: 340 },
  { x: 2280, y: 300 },
  { x: 3180, y: 300 },
  { x: 4100, y: 340 },
  { x: 4860, y: 400 },
  RAW_RED_BASE
];
const RAW_MID_PATH = [
  RAW_BLUE_BASE,
  { x: 760, y: 2760 },
  { x: 1360, y: 2300 },
  { x: 2140, y: 1860 },
  { x: 3000, y: 1420 },
  { x: 3860, y: 980 },
  { x: 4460, y: 520 },
  RAW_RED_BASE
];
const BASES = {
  blue: scalePoint(RAW_BLUE_BASE),
  red: scalePoint(RAW_RED_BASE)
};
const LANE_PATHS = {
  top: scalePath(RAW_TOP_PATH),
  mid: scalePath(RAW_MID_PATH),
  bot: scalePath(mirroredRawPath(RAW_TOP_PATH))
};

const HERO_DEFS = {
  circle: {
    key: "circle",
    name: "Orbit Striker",
    shape: "circle",
    color: "#66d9ff",
    hp: 520,
    moveSpeed: s(290),
    attackRange: s(190),
    attackDamage: 32,
    attackCooldown: 0.72,
    abilities: {
      q: { name: "Comet Dash", cooldown: 6 },
      w: { name: "Pulse Ring", cooldown: 8 },
      e: { name: "Slipstream", cooldown: 12 }
    }
  },
  square: {
    key: "square",
    name: "Bulwark Block",
    shape: "square",
    color: "#ffb74d",
    hp: 680,
    moveSpeed: s(240),
    attackRange: s(165),
    attackDamage: 39,
    attackCooldown: 0.82,
    abilities: {
      q: { name: "Ram", cooldown: 7 },
      w: { name: "Guard Field", cooldown: 11 },
      e: { name: "Quake", cooldown: 10 }
    }
  },
  triangle: {
    key: "triangle",
    name: "Prism Ace",
    shape: "triangle",
    color: "#ff6f91",
    hp: 440,
    moveSpeed: s(260),
    attackRange: s(380),
    attackDamage: 24,
    attackCooldown: 0.7,
    abilities: {
      q: { name: "Shard Bolt", cooldown: 4.5 },
      w: { name: "Fan Burst", cooldown: 8 },
      e: { name: "Beamline", cooldown: 12 }
    }
  },
  hex: {
    key: "hex",
    name: "Storm Hex",
    shape: "hexagon",
    color: "#8f9bff",
    hp: 500,
    moveSpeed: s(275),
    attackRange: s(315),
    attackDamage: 27,
    attackCooldown: 0.74,
    abilities: {
      q: { name: "Arc Lash", cooldown: 5 },
      w: { name: "Thunder Bloom", cooldown: 9 },
      e: { name: "Flash Step", cooldown: 11 }
    }
  },
  diamond: {
    key: "diamond",
    name: "Vector Viper",
    shape: "diamond",
    color: "#6dffb3",
    hp: 470,
    moveSpeed: s(270),
    attackRange: s(430),
    attackDamage: 22,
    attackCooldown: 0.66,
    abilities: {
      q: { name: "Piercing Round", cooldown: 5.5 },
      w: { name: "Lock On", cooldown: 10 },
      e: { name: "Snapback", cooldown: 8 }
    }
  },
  nova: {
    key: "nova",
    name: "Dawn Circuit",
    shape: "pentagon",
    color: "#ffd36e",
    hp: 540,
    moveSpeed: s(255),
    attackRange: s(285),
    attackDamage: 28,
    attackCooldown: 0.78,
    abilities: {
      q: { name: "Solar Mend", cooldown: 7 },
      w: { name: "Bastion Link", cooldown: 10 },
      e: { name: "Lumen Wave", cooldown: 12 }
    }
  },
  onyx: {
    key: "onyx",
    name: "Rift Colossus",
    shape: "octagon",
    color: "#c792ff",
    hp: 760,
    moveSpeed: s(225),
    attackRange: s(175),
    attackDamage: 42,
    attackCooldown: 0.92,
    abilities: {
      q: { name: "Earthsplitter", cooldown: 7.5 },
      w: { name: "Iron Roar", cooldown: 9 },
      e: { name: "Titan March", cooldown: 13 }
    }
  }
};

const ITEM_DEFS = {
  longsword: {
    cost: 320,
    maxLevel: 3,
    label: "Long Sword",
    short: "ATK",
    description: "+12 attack damage for lane trades and last hits.",
    apply: (hero) => {
      hero.bonusDamage += 12;
    }
  },
  plated: {
    cost: 360,
    maxLevel: 3,
    label: "Plated Core",
    short: "HP",
    description: "+180 max health and a sturdier front line.",
    apply: (hero) => {
      hero.maxHp += 180;
      hero.hp += 180;
    }
  },
  boots: {
    cost: 280,
    maxLevel: 3,
    label: "Ion Boots",
    short: "MS",
    description: "+26 movement speed to rotate faster between lanes.",
    apply: (hero) => {
      hero.moveSpeedBonus += s(26);
    }
  },
  wand: {
    cost: 390,
    maxLevel: 3,
    label: "Nova Wand",
    short: "AP",
    description: "+10 attack damage and shorter cooldown pacing through level scaling.",
    apply: (hero) => {
      hero.bonusDamage += 10;
      hero.cooldownBias = (hero.cooldownBias || 0) + 0.06;
    }
  },
  aegis: {
    cost: 410,
    maxLevel: 3,
    label: "Vigor Plate",
    short: "VIT",
    description: "+150 max health for safer engages and resets.",
    apply: (hero) => {
      hero.maxHp += 150;
      hero.hp += 150;
    }
  },
  scope: {
    cost: 340,
    maxLevel: 3,
    label: "Arc Scope",
    short: "RNG",
    description: "+40 attack range and cleaner siege positioning.",
    apply: (hero) => {
      hero.attackRange += s(40);
    }
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceXY(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function normalize(dx, dy) {
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function teamEnemy(team) {
  return team === BLUE ? RED : BLUE;
}

function isMinionEntity(entity) {
  return entity && entity.progress !== undefined && entity.lane && entity.team && entity.alive !== undefined;
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function scaledMs(value) {
  return value / GAME_SPEED;
}

function itemUpgradeCost(item, level) {
  return Math.round(item.cost * (0.85 + level * 0.35));
}

function segmentPointDistance(point, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const denom = abx * abx + aby * aby || 1;
  const t = clamp((apx * abx + apy * aby) / denom, 0, 1);
  const projX = a.x + abx * t;
  const projY = a.y + aby * t;
  return {
    distance: distanceXY(point.x, point.y, projX, projY),
    x: projX,
    y: projY
  };
}

function nearestLanePoint(point, laneKey) {
  const lanes = laneKey ? [laneKey] : LANE_KEYS;
  let best = { distance: Number.POSITIVE_INFINITY, x: point.x, y: point.y, lane: laneKey || "mid" };

  for (const lane of lanes) {
    const path = LANE_PATHS[lane];
    for (let index = 0; index < path.length - 1; index += 1) {
      const candidate = segmentPointDistance(point, path[index], path[index + 1]);
      if (candidate.distance < best.distance) {
        best = { ...candidate, lane };
      }
    }
  }

  return best;
}

function advanceAlongPath(path, progress) {
  let remaining = progress;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const segmentLength = distance(start, end);
    if (remaining <= segmentLength) {
      const t = segmentLength === 0 ? 0 : remaining / segmentLength;
      return {
        x: lerp(start.x, end.x, t),
        y: lerp(start.y, end.y, t),
        segment: index
      };
    }
    remaining -= segmentLength;
  }

  const last = path[path.length - 1];
  return { x: last.x, y: last.y, segment: path.length - 2 };
}

function totalPathLength(path) {
  let length = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    length += distance(path[index], path[index + 1]);
  }
  return length;
}

const PATH_LENGTHS = Object.fromEntries(
  LANE_KEYS.map((lane) => [lane, totalPathLength(LANE_PATHS[lane])])
);

export class GameServer {
  constructor() {
    this.seq = 0;
    this.startedAt = Date.now();
    this.lastTickAt = Date.now();
    this.lastWaveAt = this.startedAt;
    this.waveCount = 0;
    this.players = new Map();
    this.playersByToken = new Map();
    this.heroes = new Map();
    this.minions = [];
    this.projectiles = [];
    this.effects = [];
    this.messages = [];
    this.bots = new Map();
    this.teamGold = { blue: 0, red: 0 };
    this.teamBuffUntil = { blue: 0, red: 0 };
    this.structures = this.createStructures();
    this.camps = this.createCamps();
    this.winnerTeam = null;
    this.resetAt = 0;
    this.clients = new Map();

    this.syncBots();
    this.loop = setInterval(() => this.tick(), TICK_MS);
  }

  shortToken(token) {
    return String(token || "").slice(0, 8);
  }

  pushSystemMessage(text, createdAt = Date.now()) {
    this.messages.push({
      id: createId("msg"),
      createdAt,
      text
    });
    this.trimMessages();
  }

  createStructures() {
    const laneTurretPoint = (team, lane, tier) => {
      const pathLength = PATH_LENGTHS[lane];
      const checkpoints = team === BLUE
        ? [0.2, 0.4]
        : [0.6, 0.8];
      const point = advanceAlongPath(LANE_PATHS[lane], pathLength * checkpoints[tier]);
      return { x: point.x, y: point.y };
    };
    const topBlueOuter = laneTurretPoint(BLUE, "top", 0);
    const topBlueInner = laneTurretPoint(BLUE, "top", 1);
    const midBlueOuter = laneTurretPoint(BLUE, "mid", 0);
    const midBlueInner = laneTurretPoint(BLUE, "mid", 1);
    const botBlueOuter = laneTurretPoint(BLUE, "bot", 0);
    const botBlueInner = laneTurretPoint(BLUE, "bot", 1);
    const topRedOuter = laneTurretPoint(RED, "top", 0);
    const topRedInner = laneTurretPoint(RED, "top", 1);
    const midRedOuter = laneTurretPoint(RED, "mid", 0);
    const midRedInner = laneTurretPoint(RED, "mid", 1);
    const botRedOuter = laneTurretPoint(RED, "bot", 0);
    const botRedInner = laneTurretPoint(RED, "bot", 1);
    return [
      this.makeTurret(BLUE, "top", 0, topBlueOuter.x, topBlueOuter.y),
      this.makeTurret(BLUE, "top", 1, topBlueInner.x, topBlueInner.y),
      this.makeTurret(BLUE, "mid", 0, midBlueOuter.x, midBlueOuter.y),
      this.makeTurret(BLUE, "mid", 1, midBlueInner.x, midBlueInner.y),
      this.makeTurret(BLUE, "bot", 0, botBlueOuter.x, botBlueOuter.y),
      this.makeTurret(BLUE, "bot", 1, botBlueInner.x, botBlueInner.y),
      this.makeNexus(BLUE, m(260), m(3140)),
      this.makeTurret(RED, "top", 0, topRedOuter.x, topRedOuter.y),
      this.makeTurret(RED, "top", 1, topRedInner.x, topRedInner.y),
      this.makeTurret(RED, "mid", 0, midRedOuter.x, midRedOuter.y),
      this.makeTurret(RED, "mid", 1, midRedInner.x, midRedInner.y),
      this.makeTurret(RED, "bot", 0, botRedOuter.x, botRedOuter.y),
      this.makeTurret(RED, "bot", 1, botRedInner.x, botRedInner.y),
      this.makeNexus(RED, m(5340), m(460))
    ];
  }

  createCamps() {
    const positions = this.generateCampPositions();

    return positions.map((camp) => ({
      id: `camp_${camp.key}`,
      key: camp.key,
      x: camp.x,
      y: camp.y,
      homeX: camp.x,
      homeY: camp.y,
      radius: r(70),
      maxHp: 860,
      hp: 860,
      moveSpeed: s(160),
      returnSpeed: s(260),
      attackDamage: 34,
      attackRange: s(170),
      attackCooldown: 1.1,
      lastAttackAt: 0,
      attackAnimationUntil: 0,
      leashTargetId: "",
      alive: true,
      respawnAt: 0
    }));
  }

  generateCampPositions() {
    const campKeys = [
      "rift-north",
      "river-top",
      "rift-east",
      "river-bot",
      "rift-south",
      "rift-west"
    ];
    const positions = [];
    const laneClearance = m(340);
    const baseClearance = m(720);
    const structureClearance = m(360);
    const campClearance = m(540);
    const margin = m(320);

    for (const key of campKeys) {
      let chosen = null;

      for (let attempt = 0; attempt < 120; attempt += 1) {
        const candidate = {
          x: margin + Math.random() * Math.max(1, WORLD.width - margin * 2),
          y: margin + Math.random() * Math.max(1, WORLD.height - margin * 2)
        };
        const lanePoint = nearestLanePoint(candidate);
        if (lanePoint.distance < laneClearance) continue;
        if (distance(candidate, BASES.blue) < baseClearance || distance(candidate, BASES.red) < baseClearance) continue;
        if (this.structures.some((structure) => distance(candidate, structure) < structureClearance)) continue;
        if (positions.some((existing) => distance(candidate, existing) < campClearance)) continue;
        chosen = candidate;
        break;
      }

      if (!chosen) {
        const fallback = {
          "rift-north": { x: m(1680), y: m(1180) },
          "river-top": { x: m(2350), y: m(920) },
          "rift-east": { x: m(4180), y: m(1180) },
          "river-bot": { x: m(3300), y: m(2460) },
          "rift-south": { x: m(3920), y: m(2130) },
          "rift-west": { x: m(1460), y: m(2600) }
        }[key];
        chosen = fallback;
      }

      positions.push({ ...chosen, key });
    }

    return positions;
  }

  makeTurret(team, lane, tier, x, y) {
    const maxHp = tier === 0 ? 725 : 900;
    return {
      id: `${team}_${lane}_turret_${tier}`,
      kind: "turret",
      team,
      lane,
      tier,
      x,
      y,
      radius: r(64),
      maxHp,
      hp: maxHp,
      range: s(500),
      attackDamage: tier === 0 ? 68 : 82,
      attackCooldown: 1.15,
      lastAttackAt: 0,
      destroyed: false
    };
  }

  makeNexus(team, x, y) {
    const maxHp = 3400;
    return {
      id: `${team}_nexus`,
      kind: "nexus",
      team,
      lane: "base",
      tier: 2,
      x,
      y,
      radius: r(90),
      maxHp,
      hp: maxHp,
      range: 0,
      attackDamage: 0,
      attackCooldown: 0,
      lastAttackAt: 0,
      destroyed: false
    };
  }

  joinPlayer(rawName, heroType, options = {}) {
    const name = String(rawName || "").trim().slice(0, 16) || `Player ${this.players.size + 1}`;
    const heroKey = HERO_DEFS[heroType] ? heroType : "circle";
    const preferredTeam = options.preferredTeam === BLUE || options.preferredTeam === RED
      ? options.preferredTeam
      : "auto";
    const team = this.pickTeam(preferredTeam, heroKey);
    if (!team) {
      const requestedTeamHasHero = preferredTeam !== "auto" && this.teamHasHeroType(preferredTeam, heroKey, { humansOnly: true });
      const bothTeamsTaken = this.teamHasHeroType(BLUE, heroKey, { humansOnly: true }) && this.teamHasHeroType(RED, heroKey, { humansOnly: true });
      return {
        ok: false,
        error: requestedTeamHasHero || bothTeamsTaken ? "hero-taken" : preferredTeam === "auto" ? "match-full" : "team-full",
        message: requestedTeamHasHero
          ? `${HERO_DEFS[heroKey].name} is already on ${preferredTeam.toUpperCase()}. Pick a different hero or team.`
          : bothTeamsTaken
            ? `${HERO_DEFS[heroKey].name} is already taken on both teams.`
            : preferredTeam === "auto"
              ? "Match is full. Both teams already have 5 humans."
              : `${preferredTeam.toUpperCase()} is full. Pick the other side or Auto.`
      };
    }
    const token = crypto.randomUUID();
    const playerId = createId("player");
    const hero = this.spawnHero({
      id: playerId,
      controller: "human",
      name,
      team,
      heroType: heroKey
    });

    const session = {
      id: playerId,
      token,
      name,
      heroType: heroKey,
      team,
      lastSeenAt: Date.now(),
      connected: true,
      disconnectedAt: 0,
      lastClientAction: "",
      moveTarget: { x: hero.x, y: hero.y },
      heroId: hero.id,
      controller: "human",
      preferredTeam,
      botBrain: {
        desiredLaneOffset: Math.random() * s(90) - s(45),
        lastThinkAt: 0
      }
    };

    this.players.set(playerId, session);
    this.playersByToken.set(token, session);
    this.pushSystemMessage(`${name} joined ${team.toUpperCase()} as ${HERO_DEFS[heroKey].name}.`);
    console.log(
      `[join] name=${name} token=${this.shortToken(token)} team=${team} hero=${heroKey} preferred=${preferredTeam}`
    );
    this.syncBots();

    return {
      ok: true,
      ...this.buildSessionPayload(session)
    };
  }

  buildSessionPayload(session, extra = {}) {
    return {
      token: session.token,
      playerId: session.id,
      name: session.name,
      team: session.team,
      heroType: session.heroType,
      preferredTeam: session.preferredTeam,
      ...extra
    };
  }

  reconnectPlayer(token) {
    const session = this.playersByToken.get(String(token || ""));
    if (!session) {
      return {
        ok: false,
        error: "session-expired",
        message: "Saved session expired. Start a new match."
      };
    }

    const hero = this.heroes.get(session.heroId);
    if (!hero) {
      this.players.delete(session.id);
      this.playersByToken.delete(session.token);
      return {
        ok: false,
        error: "session-missing-hero",
        message: "Saved session is no longer available. Start a new match."
      };
    }

    session.connected = true;
    session.disconnectedAt = 0;
    session.lastSeenAt = Date.now();
    session.lastClientAction = "";
    this.pushSystemMessage(`${session.name} rejoined ${session.team.toUpperCase()} and resumed ${HERO_DEFS[session.heroType]?.name || session.heroType}.`);
    console.log(
      `[reconnect] name=${session.name} token=${this.shortToken(session.token)} team=${session.team} hero=${session.heroType} heroId=${session.heroId}`
    );

    return {
      ok: true,
      ...this.buildSessionPayload(session, { resumed: true })
    };
  }

  disconnectPlayer(token) {
    const session = this.playersByToken.get(token);
    if (!session) {
      return;
    }
    session.connected = false;
    session.disconnectedAt = Date.now();
    this.pushSystemMessage(`${session.name} disconnected. Bot takeover engaged for ${SESSION_RESUME_WINDOW_MS / 60000} minutes.`);
    console.log(
      `[disconnect] name=${session.name} token=${this.shortToken(session.token)} team=${session.team} hero=${session.heroType} heroId=${session.heroId} resumeWindowMs=${SESSION_RESUME_WINDOW_MS}`
    );
  }

  humanCount(team) {
    return [...this.players.values()].filter((session) => session.team === team).length;
  }

  teamHasHeroType(team, heroType, options = {}) {
    return [...this.heroes.values()].some((hero) =>
      hero.team === team
      && hero.heroType === heroType
      && (!options.humansOnly || hero.controller === "human")
    );
  }

  pickTeam(preferredTeam = "auto", heroType = "") {
    const blueCount = this.humanCount(BLUE);
    const redCount = this.humanCount(RED);
    const blueAvailable = blueCount < TEAM_SIZE && !this.teamHasHeroType(BLUE, heroType, { humansOnly: true });
    const redAvailable = redCount < TEAM_SIZE && !this.teamHasHeroType(RED, heroType, { humansOnly: true });

    if (preferredTeam === BLUE) {
      return blueAvailable ? BLUE : null;
    }

    if (preferredTeam === RED) {
      return redAvailable ? RED : null;
    }

    if (!blueAvailable && !redAvailable) {
      return null;
    }
    if (!blueAvailable) {
      return RED;
    }
    if (!redAvailable) {
      return BLUE;
    }
    return blueCount <= redCount ? BLUE : RED;
  }

  spawnHero({ id, controller, name, team, heroType }) {
    const def = HERO_DEFS[heroType];
    const spawn = BASES[team];
    const lane = LANE_KEYS[(this.heroes.size + TEAM_INDEX[team]) % LANE_KEYS.length];
    const hero = {
      id,
      name,
      team,
      heroType,
      controller,
      preferredLane: lane,
      shape: def.shape,
      color: def.color,
      x: spawn.x,
      y: spawn.y,
      radius: r(26),
      hp: def.hp,
      maxHp: def.hp,
      moveSpeed: def.moveSpeed,
      moveSpeedBonus: 0,
      attackRange: def.attackRange,
      attackDamage: def.attackDamage,
      bonusDamage: 0,
      cooldownBias: 0,
      attackCooldown: def.attackCooldown,
      lastAttackAt: 0,
      alive: true,
      respawnAt: 0,
      kills: 0,
      assists: 0,
      deaths: 0,
      xp: 0,
      level: 1,
      gold: 1000,
      items: [],
      moveTarget: { x: spawn.x, y: spawn.y },
      focusTargetId: "",
      cooldowns: { q: 0, w: 0, e: 0 },
      status: {
        stunUntil: 0,
        hasteUntil: 0,
        rapidUntil: 0,
        recallStartedAt: 0,
        castAnimationUntil: 0,
        castAnimationSlot: "",
        fountainAuraAt: 0
      },
      damageCredit: new Map()
    };

    this.heroes.set(hero.id, hero);
    return hero;
  }

  syncBots() {
    for (const team of TEAMS) {
      const humans = this.humanCount(team);
      const desiredBots = Math.max(0, TEAM_SIZE - humans);
      const humanHeroTypes = new Set(
        [...this.heroes.values()]
          .filter((hero) => hero.team === team && hero.controller === "human")
          .map((hero) => hero.heroType)
      );
      let existing = [...this.bots.values()].filter((bot) => bot.team === team);

      for (const bot of existing) {
        if (!humanHeroTypes.has(bot.heroType)) continue;
        this.heroes.delete(bot.heroId);
        this.bots.delete(bot.id);
      }
      existing = [...this.bots.values()].filter((bot) => bot.team === team);

      if (existing.length > desiredBots) {
        const toRemove = existing.slice(desiredBots);
        for (const bot of toRemove) {
          this.heroes.delete(bot.heroId);
          this.bots.delete(bot.id);
        }
        existing = [...this.bots.values()].filter((bot) => bot.team === team);
      }

      if (existing.length < desiredBots) {
        const needed = desiredBots - existing.length;
        const choices = Object.keys(HERO_DEFS);
        for (let index = 0; index < needed; index += 1) {
          const botId = createId("bot");
          const usedHeroTypes = new Set([
            ...humanHeroTypes,
            ...[...this.bots.values()].filter((bot) => bot.team === team).map((bot) => bot.heroType)
          ]);
          const heroType = choices.find((candidate) => !usedHeroTypes.has(candidate))
            || choices[(this.bots.size + index) % choices.length];
          const lane = LANE_KEYS[(existing.length + index) % LANE_KEYS.length];
          const hero = this.spawnHero({
            id: botId,
            controller: "bot",
            name: `${team === BLUE ? "Azure" : "Crimson"} Bot ${existing.length + index + 1}`,
            team,
            heroType
          });
          hero.preferredLane = lane;
          this.bots.set(botId, {
            id: botId,
            team,
            lane,
            heroId: hero.id,
            heroType,
            desiredLaneOffset: Math.random() * s(90) - s(45),
            lastThinkAt: 0
          });
        }
      }
    }
  }

  handleInput(token, payload) {
    const session = this.playersByToken.get(token);
    if (!session) {
      return false;
    }

    session.lastSeenAt = Date.now();
    session.connected = true;
    session.disconnectedAt = 0;

    const hero = this.heroes.get(session.heroId);
    if (hero && payload.moveTarget) {
      const targetX = clamp(Number(payload.moveTarget.x) || hero.x, 0, WORLD.width);
      const targetY = clamp(Number(payload.moveTarget.y) || hero.y, 0, WORLD.height);

      if (hero.moveTarget.x !== targetX || hero.moveTarget.y !== targetY) {
        hero.moveTarget = { x: targetX, y: targetY };
        hero.status.recallStartedAt = 0;
      }
    }

    const actions = Array.isArray(payload.actions) ? payload.actions : [];
    for (const action of actions) {
      if (!action || !action.id || action.id === session.lastClientAction) {
        continue;
      }
      session.lastClientAction = action.id;
      this.applyAction(hero, action, session);
    }

    return true;
  }

  applyAction(hero, action, session) {
    if (!hero || !hero.alive) {
      return;
    }

    if (action.type === "cast") {
      this.castAbility(hero, action.slot, action.x, action.y);
      return;
    }

    if (action.type === "set-focus") {
      hero.focusTargetId = String(action.targetId || "");
      return;
    }

    if (action.type === "clear-focus") {
      hero.focusTargetId = "";
      return;
    }

    if (action.type === "buy-item") {
      this.tryPurchaseItem(hero, action.itemKey);
      return;
    }

    if (action.type === "upgrade-item") {
      this.tryUpgradeItem(hero, action.index);
      return;
    }

    if (action.type === "recall") {
      hero.status.recallStartedAt = Date.now();
      return;
    }

    if (action.type === "set-lane" && LANE_KEYS.includes(action.lane)) {
      hero.preferredLane = action.lane;
      return;
    }

  }
  tryPurchaseItem(hero, itemKey) {
    const item = ITEM_DEFS[itemKey];
    if (!item || !this.isInFountain(hero)) {
      return;
    }
    if (hero.items.length >= 6 || hero.gold < item.cost) {
      return;
    }

    hero.gold -= item.cost;
    hero.items.push({ key: itemKey, label: item.label, short: item.short, level: 1 });
    item.apply(hero);
    hero.hp = Math.min(hero.maxHp, hero.hp);
    this.pushEffect({
      type: "text",
      x: hero.x,
      y: hero.y - 58,
      text: `+${item.label}`,
      team: hero.team,
      ttl: 1.2
    });
  }

  tryUpgradeItem(hero, index) {
    const itemInstance = hero.items[index];
    if (!itemInstance || !this.isInFountain(hero)) {
      return;
    }
    const item = ITEM_DEFS[itemInstance.key];
    if (!item) {
      return;
    }

    const currentLevel = itemInstance.level || 1;
    const maxLevel = item.maxLevel || 3;
    if (currentLevel >= maxLevel) {
      return;
    }

    const upgradeCost = itemUpgradeCost(item, currentLevel);
    if (hero.gold < upgradeCost) {
      return;
    }

    hero.gold -= upgradeCost;
    item.apply(hero);
    itemInstance.level = currentLevel + 1;
    hero.hp = Math.min(hero.maxHp, hero.hp);
    this.pushEffect({
      type: "text",
      x: hero.x,
      y: hero.y - 58,
      text: `${item.short} Lv.${itemInstance.level}`,
      team: hero.team,
      ttl: 1.2
    });
  }

  castAbility(hero, slot, targetX, targetY) {
    const def = HERO_DEFS[hero.heroType];
    if (!def || !hero.alive || !def.abilities[slot]) {
      return;
    }

    const now = Date.now();
    if (hero.cooldowns[slot] > now) {
      return;
    }
    hero.status.castAnimationUntil = now + scaledMs(360);
    hero.status.castAnimationSlot = slot;

    const hasteFactor = 1 - (hero.cooldownBias || 0);
    const setCooldown = (key) => {
      hero.cooldowns[key] = now + scaledMs(def.abilities[key].cooldown * 1000 * hasteFactor);
    };

    const target = {
      x: clamp(Number(targetX) || hero.x, 0, WORLD.width),
      y: clamp(Number(targetY) || hero.y, 0, WORLD.height)
    };
    const dir = normalize(target.x - hero.x, target.y - hero.y);

    if (hero.heroType === "circle") {
      if (slot === "q") {
        setCooldown("q");
        const dashDistance = s(340);
        const endX = clamp(hero.x + dir.x * dashDistance, 0, WORLD.width);
        const endY = clamp(hero.y + dir.y * dashDistance, 0, WORLD.height);
        this.pushEffect({ type: "dash", style: "comet-dash", x: hero.x, y: hero.y, x2: endX, y2: endY, team: hero.team, ttl: 0.38 });
        const segmentStart = { x: hero.x, y: hero.y };
        const segmentEnd = { x: endX, y: endY };
        hero.x = endX;
        hero.y = endY;
        hero.moveTarget = { x: endX, y: endY };
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) {
            continue;
          }
          const hit = segmentPointDistance(targetEntity, segmentStart, segmentEnd);
          if (hit.distance <= targetEntity.radius + s(34)) {
            this.applyDamage(targetEntity, 72 + hero.level * 8, hero);
          }
        }
      } else if (slot === "w") {
        setCooldown("w");
        this.pushEffect({ type: "ring", style: "pulse-ring", x: hero.x, y: hero.y, radius: s(280), team: hero.team, ttl: 0.45 });
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) {
            continue;
          }
          if (distance(hero, targetEntity) <= s(280) + targetEntity.radius) {
            this.applyDamage(targetEntity, 60 + hero.level * 6, hero);
            if (targetEntity.moveTarget) {
              const away = normalize(targetEntity.x - hero.x, targetEntity.y - hero.y);
              targetEntity.x = clamp(targetEntity.x + away.x * s(44), 0, WORLD.width);
              targetEntity.y = clamp(targetEntity.y + away.y * s(44), 0, WORLD.height);
            }
          }
        }
      } else if (slot === "e") {
        setCooldown("e");
        hero.status.hasteUntil = now + scaledMs(4500);
        this.pushEffect({ type: "burst", style: "slipstream", x: hero.x, y: hero.y, radius: s(110), team: hero.team, ttl: 0.6 });
      }
      return;
    }

    if (hero.heroType === "square") {
      if (slot === "q") {
        setCooldown("q");
        const dashDistance = s(250);
        const endX = clamp(hero.x + dir.x * dashDistance, 0, WORLD.width);
        const endY = clamp(hero.y + dir.y * dashDistance, 0, WORLD.height);
        this.pushEffect({ type: "slam", style: "bulwark-ram", x: hero.x, y: hero.y, x2: endX, y2: endY, team: hero.team, ttl: 0.42 });
        hero.x = endX;
        hero.y = endY;
        hero.moveTarget = { x: endX, y: endY };
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) {
            continue;
          }
          if (distanceXY(targetEntity.x, targetEntity.y, endX, endY) <= s(112) + targetEntity.radius) {
            this.applyDamage(targetEntity, 68 + hero.level * 9, hero);
            if (targetEntity.status) {
              targetEntity.status.stunUntil = now + 600;
            }
          }
        }
      } else if (slot === "w") {
        setCooldown("w");
        this.healHero(hero, 85 + hero.level * 10, hero.team);
        this.pushEffect({ type: "guard", style: "guard-field", x: hero.x, y: hero.y, radius: s(90), team: hero.team, ttl: 0.7 });
      } else if (slot === "e") {
        setCooldown("e");
        this.pushEffect({ type: "burst", style: "quake", x: hero.x, y: hero.y, radius: s(180), team: hero.team, ttl: 0.5 });
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) {
            continue;
          }
          if (distance(hero, targetEntity) <= s(180) + targetEntity.radius) {
            this.applyDamage(targetEntity, 90 + hero.level * 8, hero);
          }
        }
      }
      return;
    }

    if (hero.heroType === "triangle") {
      if (slot === "q") {
        setCooldown("q");
        this.spawnProjectile(hero, {
          kind: "bolt",
          x: hero.x + dir.x * s(36),
          y: hero.y + dir.y * s(36),
          vx: dir.x * s(650),
          vy: dir.y * s(650),
          radius: s(10),
          ttl: 1.2,
          damage: 82 + hero.level * 10,
          pierce: false
        });
      } else if (slot === "w") {
        setCooldown("w");
        const angles = [-0.3, 0, 0.3];
        for (const angle of angles) {
          const rotated = {
            x: dir.x * Math.cos(angle) - dir.y * Math.sin(angle),
            y: dir.x * Math.sin(angle) + dir.y * Math.cos(angle)
          };
        this.spawnProjectile(hero, {
          kind: "fan",
            x: hero.x + rotated.x * s(36),
            y: hero.y + rotated.y * s(36),
            vx: rotated.x * s(530),
            vy: rotated.y * s(530),
            radius: s(12),
            ttl: 0.82,
            damage: 54 + hero.level * 6,
            pierce: false
          });
        }
      } else if (slot === "e") {
        setCooldown("e");
        const endX = clamp(hero.x + dir.x * s(560), 0, WORLD.width);
        const endY = clamp(hero.y + dir.y * s(560), 0, WORLD.height);
        this.pushEffect({ type: "beam", style: "beamline", x: hero.x, y: hero.y, x2: endX, y2: endY, team: hero.team, ttl: 0.32 });
        const start = { x: hero.x, y: hero.y };
        const end = { x: endX, y: endY };
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) {
            continue;
          }
          const hit = segmentPointDistance(targetEntity, start, end);
          if (hit.distance <= targetEntity.radius + s(24)) {
            this.applyDamage(targetEntity, 112 + hero.level * 12, hero);
          }
        }
      }
      return;
    }

    if (hero.heroType === "hex") {
      if (slot === "q") {
        setCooldown("q");
        this.spawnProjectile(hero, {
          kind: "arc",
          x: hero.x + dir.x * s(36),
          y: hero.y + dir.y * s(36),
          vx: dir.x * s(700),
          vy: dir.y * s(700),
          radius: s(9),
          ttl: 1.05,
          damage: 66 + hero.level * 9,
          pierce: true
        });
      } else if (slot === "w") {
        setCooldown("w");
        const bloomX = clamp(hero.x + dir.x * Math.min(distance(hero, target), s(330)), 0, WORLD.width);
        const bloomY = clamp(hero.y + dir.y * Math.min(distance(hero, target), s(330)), 0, WORLD.height);
        this.pushEffect({ type: "burst", style: "thunder-bloom", x: bloomX, y: bloomY, radius: s(170), team: hero.team, ttl: 0.45 });
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) continue;
          if (distanceXY(targetEntity.x, targetEntity.y, bloomX, bloomY) <= s(170) + targetEntity.radius) {
            this.applyDamage(targetEntity, 74 + hero.level * 8, hero);
            if (targetEntity.status) {
              targetEntity.status.stunUntil = Math.max(targetEntity.status.stunUntil || 0, now + 350);
            }
          }
        }
      } else if (slot === "e") {
        setCooldown("e");
        const blinkDistance = Math.min(distance(hero, target), s(280));
        hero.x = clamp(hero.x + dir.x * blinkDistance, 0, WORLD.width);
        hero.y = clamp(hero.y + dir.y * blinkDistance, 0, WORLD.height);
        hero.moveTarget = { x: hero.x, y: hero.y };
        hero.status.hasteUntil = Math.max(hero.status.hasteUntil || 0, now + scaledMs(2200));
        this.pushEffect({ type: "dash", style: "flash-step", x: hero.x - dir.x * blinkDistance, y: hero.y - dir.y * blinkDistance, x2: hero.x, y2: hero.y, team: hero.team, ttl: 0.28 });
      }
      return;
    }

    if (hero.heroType === "diamond") {
      if (slot === "q") {
        setCooldown("q");
        this.spawnProjectile(hero, {
          kind: "round",
          x: hero.x + dir.x * s(38),
          y: hero.y + dir.y * s(38),
          vx: dir.x * s(820),
          vy: dir.y * s(820),
          radius: s(9),
          ttl: 1.1,
          damage: 78 + hero.level * 8,
          pierce: true
        });
      } else if (slot === "w") {
        setCooldown("w");
        hero.status.rapidUntil = now + scaledMs(4000);
        this.pushEffect({ type: "guard", style: "lock-on", x: hero.x, y: hero.y, radius: s(96), team: hero.team, ttl: 0.6 });
      } else if (slot === "e") {
        setCooldown("e");
        const dashDistance = Math.min(distance(hero, target), s(240));
        const startX = hero.x;
        const startY = hero.y;
        hero.x = clamp(hero.x + dir.x * dashDistance, 0, WORLD.width);
        hero.y = clamp(hero.y + dir.y * dashDistance, 0, WORLD.height);
        hero.moveTarget = { x: hero.x, y: hero.y };
        hero.status.hasteUntil = Math.max(hero.status.hasteUntil || 0, now + scaledMs(1800));
        this.pushEffect({ type: "dash", style: "snapback", x: startX, y: startY, x2: hero.x, y2: hero.y, team: hero.team, ttl: 0.24 });
      }
      return;
    }

    if (hero.heroType === "nova") {
      if (slot === "q") {
        setCooldown("q");
        const ally = this.findClosestAllyHero(hero.team, target, s(240)) || hero;
        this.healHero(ally, 90 + hero.level * 10, hero.team);
        this.pushEffect({ type: "guard", style: "solar-mend", x: ally.x, y: ally.y, radius: s(72), team: hero.team, ttl: 0.5 });
      } else if (slot === "w") {
        setCooldown("w");
        const ally = this.findClosestAllyHero(hero.team, target, s(260)) || hero;
        this.healHero(ally, 70 + hero.level * 8, hero.team);
        ally.status.hasteUntil = Math.max(ally.status.hasteUntil || 0, now + scaledMs(2500));
        this.pushEffect({ type: "guard", style: "bastion-link", x: ally.x, y: ally.y, radius: s(88), team: hero.team, ttl: 0.65 });
      } else if (slot === "e") {
        setCooldown("e");
        const endX = clamp(hero.x + dir.x * s(520), 0, WORLD.width);
        const endY = clamp(hero.y + dir.y * s(520), 0, WORLD.height);
        this.pushEffect({ type: "beam", style: "lumen-wave", x: hero.x, y: hero.y, x2: endX, y2: endY, team: hero.team, ttl: 0.32 });
        const start = { x: hero.x, y: hero.y };
        const end = { x: endX, y: endY };
        for (const ally of this.heroes.values()) {
          if (ally.team !== hero.team || !ally.alive) continue;
          const hit = segmentPointDistance(ally, start, end);
          if (hit.distance <= ally.radius + s(26)) {
            this.healHero(ally, 60 + hero.level * 6, hero.team);
          }
        }
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) continue;
          const hit = segmentPointDistance(targetEntity, start, end);
          if (hit.distance <= targetEntity.radius + s(26)) {
            this.applyDamage(targetEntity, 76 + hero.level * 8, hero);
          }
        }
      }
      return;
    }

    if (hero.heroType === "onyx") {
      if (slot === "q") {
        setCooldown("q");
        const endX = clamp(hero.x + dir.x * s(260), 0, WORLD.width);
        const endY = clamp(hero.y + dir.y * s(260), 0, WORLD.height);
        this.pushEffect({ type: "slam", style: "earthsplitter", x: hero.x, y: hero.y, x2: endX, y2: endY, team: hero.team, ttl: 0.4 });
        hero.x = endX;
        hero.y = endY;
        hero.moveTarget = { x: endX, y: endY };
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) continue;
          if (distanceXY(targetEntity.x, targetEntity.y, endX, endY) <= s(125) + targetEntity.radius) {
            this.applyDamage(targetEntity, 84 + hero.level * 10, hero);
            if (targetEntity.status) {
              targetEntity.status.stunUntil = Math.max(targetEntity.status.stunUntil || 0, now + 550);
            }
          }
        }
      } else if (slot === "w") {
        setCooldown("w");
        this.pushEffect({ type: "ring", style: "iron-roar", x: hero.x, y: hero.y, radius: s(220), team: hero.team, ttl: 0.42 });
        this.healHero(hero, 90 + hero.level * 10, hero.team);
        for (const targetEntity of this.getDamageableEnemies(hero.team)) {
          if (!targetEntity.alive || targetEntity.destroyed) continue;
          if (distance(hero, targetEntity) <= s(220) + targetEntity.radius) {
            this.applyDamage(targetEntity, 60 + hero.level * 6, hero);
          }
        }
      } else if (slot === "e") {
        setCooldown("e");
        hero.status.hasteUntil = Math.max(hero.status.hasteUntil || 0, now + scaledMs(3200));
        this.healHero(hero, 65 + hero.level * 8, hero.team);
        this.pushEffect({ type: "burst", style: "titan-march", x: hero.x, y: hero.y, radius: s(120), team: hero.team, ttl: 0.5 });
      }
      return;
    }
  }

  spawnProjectile(hero, data) {
    this.projectiles.push({
      id: createId("proj"),
      team: hero.team,
      ownerId: hero.id,
      ownerType: "hero",
      duration: data.ttl,
      ...data
    });
  }

  projectileImpactStyle(projectile) {
    return {
      bolt: "bolt-impact",
      fan: "fan-impact",
      arc: "arc-impact",
      round: "round-impact"
    }[projectile.kind] || "";
  }

  getDamageableEnemies(team) {
    const enemies = [];
    for (const hero of this.heroes.values()) {
      if (hero.team !== team && hero.alive) {
        enemies.push(hero);
      }
    }
    for (const minion of this.minions) {
      if (minion.team !== team && minion.alive) {
        enemies.push(minion);
      }
    }
    for (const structure of this.structures) {
      if (structure.team !== team && !structure.destroyed) {
        enemies.push(structure);
      }
    }
    for (const camp of this.camps) {
      if (camp.alive) {
        enemies.push(camp);
      }
    }
    return enemies;
  }

  tick() {
    const now = Date.now();
    const delta = Math.min(0.1, ((now - this.lastTickAt) / 1000) * GAME_SPEED);
    this.lastTickAt = now;

    if (this.clients.size === 0 && this.players.size === 0) {
      this.lastWaveAt = now;
      return;
    }

    this.seq += 1;

    if (this.winnerTeam && now >= this.resetAt) {
      this.resetMatch(now);
      return;
    }

    this.expirePlayers(now);
    this.syncBots();
    this.spawnMinionWave(now);
    this.updateBots(now);
    this.updateHeroes(delta, now);
    this.updateMinions(delta, now);
    this.resolveCollisions();
    this.updateStructures(now);
    this.updateProjectiles(delta);
    this.updateCamps(delta, now);
    this.updateEffects(delta);
    this.cleanupDeadUnits();

    this.broadcastState();
  }

  broadcastState() {
    for (const [token, ws] of this.clients.entries()) {
      const snapshot = this.getSnapshot(token);
      if (snapshot && ws.readyState === 1) { // 1 = OPEN
        ws.send(JSON.stringify({ type: "state", ...snapshot }));
      }
    }
  }

  expirePlayers(now) {
    for (const [token, session] of this.playersByToken.entries()) {
      if (session.connected || !session.disconnectedAt || now - session.disconnectedAt < SESSION_RESUME_WINDOW_MS) {
        continue;
      }
      this.clients.delete(token);
      this.playersByToken.delete(token);
      this.players.delete(session.id);
      this.heroes.delete(session.heroId);
      this.pushSystemMessage(`${session.name} did not return and was removed from the arena.`, now);
      console.log(
        `[expire] name=${session.name} token=${this.shortToken(session.token)} team=${session.team} hero=${session.heroType} heroId=${session.heroId}`
      );
    }
  }

  spawnMinionWave(now) {
    if (now - this.lastWaveAt < scaledMs(WAVE_INTERVAL * 1000)) {
      return;
    }

    this.spawnWave(now);
  }

  spawnWave(now) {
    this.lastWaveAt = now;
    this.waveCount += 1;

    for (const team of TEAMS) {
      const buffed = this.teamBuffUntil[team] > now;
      for (const lane of LANE_KEYS) {
        const wave = [
          { kind: "melee", trail: 0 },
          { kind: "melee", trail: s(46) },
          { kind: this.waveCount % 3 === 0 || buffed ? "siege" : "ranged", trail: s(94) }
        ];

        for (const item of wave) {
          this.minions.push(this.makeMinion(team, lane, item.kind, item.trail));
        }
      }
    }
  }

  makeMinion(team, lane, kind, trail) {
    const path = LANE_PATHS[lane];
    const pathLength = PATH_LENGTHS[lane];
    const stats = kind === "ranged"
      ? { hp: 108, speed: s(126), damage: 22, range: s(300), radius: r(15) }
      : kind === "siege"
        ? { hp: 220, speed: s(112), damage: 36, range: s(260), radius: r(20) }
        : { hp: 145, speed: s(134), damage: 28, range: s(60), radius: r(17) };
    const progress = team === BLUE ? trail : pathLength - trail;
    const point = advanceAlongPath(path, progress);

    return {
      id: createId("minion"),
      team,
      lane,
      kind,
      x: point.x,
      y: point.y,
      radius: stats.radius,
      hp: stats.hp,
      maxHp: stats.hp,
      attackDamage: stats.damage,
      attackRange: stats.range,
      attackCooldown: kind === "ranged" || kind === "siege" ? 1.05 : 0.8,
      lastAttackAt: 0,
      progress,
      direction: team === BLUE ? 1 : -1,
      speed: stats.speed,
      alive: true,
      moveTarget: { x: point.x, y: point.y }
    };
  }

  updateHeroes(delta, now) {
    for (const hero of this.heroes.values()) {
      if (!hero.alive) {
        if (hero.respawnAt <= now) {
          this.respawnHero(hero);
        }
        continue;
      }

      if (hero.status.recallStartedAt && now - hero.status.recallStartedAt >= scaledMs(3000)) {
        const spawn = BASES[hero.team];
        hero.x = spawn.x;
        hero.y = spawn.y;
        hero.moveTarget = { ...spawn };
        hero.status.recallStartedAt = 0;
        this.pushEffect({ type: "burst", x: hero.x, y: hero.y, radius: 120, team: hero.team, ttl: 0.55 });
      }

      if (hero.status.stunUntil > now) {
        this.regenInFountain(hero, delta, now);
        continue;
      }

      const speedMultiplier = hero.status.hasteUntil > now ? 1.35 : 1;
      const speed = (hero.moveSpeed + hero.moveSpeedBonus) * speedMultiplier;
      const dist = distance(hero, hero.moveTarget);
      if (dist > 6) {
        const dir = normalize(hero.moveTarget.x - hero.x, hero.moveTarget.y - hero.y);
        const step = Math.min(dist, speed * delta);
        hero.x = clamp(hero.x + dir.x * step, 0, WORLD.width);
        hero.y = clamp(hero.y + dir.y * step, 0, WORLD.height);
        if (step === dist) {
          hero.x = hero.moveTarget.x;
          hero.y = hero.moveTarget.y;
        }
      }

      this.regenInFountain(hero, delta, now);
      this.tryBasicAttack(hero, now);
    }
  }

  regenInFountain(hero, delta, now) {
    if (this.isInFountain(hero)) {
      const previousHp = hero.hp;
      hero.hp = Math.min(hero.maxHp, hero.hp + 220 * delta);
      if (hero.hp > previousHp && now - (hero.status.fountainAuraAt || 0) >= 420) {
        hero.status.fountainAuraAt = now;
        this.pushEffect({
          type: "guard",
          style: "fountain-aura",
          x: hero.x,
          y: hero.y,
          radius: s(104),
          team: hero.team,
          ttl: 0.52
        });
      }
    }
  }

  resolvePositionAgainstBlocker(entity, blocker, pushScale = 1) {
    const minGap = entity.radius + blocker.radius;
    const dx = entity.x - blocker.x;
    const dy = entity.y - blocker.y;
    const gap = Math.hypot(dx, dy);
    if (gap >= minGap || !Number.isFinite(gap)) {
      return;
    }

    const dir = gap > 0.001
      ? { x: dx / gap, y: dy / gap }
      : normalize(entity.x - WORLD.width / 2, entity.y - WORLD.height / 2);
    const push = (minGap - gap + 1) * pushScale;
    entity.x = clamp(entity.x + dir.x * push, entity.radius, WORLD.width - entity.radius);
    entity.y = clamp(entity.y + dir.y * push, entity.radius, WORLD.height - entity.radius);
  }

  resolvePairCollision(a, b) {
    const minGap = a.radius + b.radius;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const gap = Math.hypot(dx, dy);
    if (gap >= minGap || !Number.isFinite(gap)) {
      return;
    }

    const dir = gap > 0.001
      ? { x: dx / gap, y: dy / gap }
      : normalize(a.x - b.x + 0.01, a.y - b.y - 0.01);
    const push = (minGap - gap + 1) / 2;
    a.x = clamp(a.x + dir.x * push, a.radius, WORLD.width - a.radius);
    a.y = clamp(a.y + dir.y * push, a.radius, WORLD.height - a.radius);
    b.x = clamp(b.x - dir.x * push, b.radius, WORLD.width - b.radius);
    b.y = clamp(b.y - dir.y * push, b.radius, WORLD.height - b.radius);
  }

  resolveCollisions() {
    const staticBlockers = [
      ...this.structures.filter((structure) => !structure.destroyed && structure.kind === "turret"),
      ...this.camps.filter((camp) => camp.alive)
    ];
    const movers = [
      ...[...this.heroes.values()].filter((hero) => hero.alive),
      ...this.minions.filter((minion) => minion.alive)
    ];

    for (let pass = 0; pass < 2; pass += 1) {
      for (const mover of movers) {
        for (const blocker of staticBlockers) {
          this.resolvePositionAgainstBlocker(mover, blocker);
        }
      }

      for (let index = 0; index < movers.length; index += 1) {
        for (let otherIndex = index + 1; otherIndex < movers.length; otherIndex += 1) {
          this.resolvePairCollision(movers[index], movers[otherIndex]);
        }
      }
    }
  }

  isInFountain(hero) {
    return distance(hero, BASES[hero.team]) <= SHOP_RADIUS;
  }

  findClosestAllyHero(team, point, radius) {
    return [...this.heroes.values()]
      .filter((hero) => hero.team === team && hero.alive && distance(hero, point) <= radius)
      .sort((a, b) => distance(a, point) - distance(b, point))[0] || null;
  }

  healHero(hero, amount, team) {
    if (!hero || !hero.alive || amount <= 0) {
      return;
    }
    hero.hp = Math.min(hero.maxHp, hero.hp + amount);
    this.pushEffect({
      type: "text",
      x: hero.x,
      y: hero.y - s(44),
      text: `+${Math.round(amount)}`,
      team,
      ttl: 0.9
    });
  }

  basicAttackStyle(source) {
    if (!source) return "";
    if (source.heroType === "square" || source.heroType === "onyx") return "heavy-cleave";
    if (source.heroType === "circle") return "quick-slash";
    if (source.heroType) return source.attackRange <= s(220) ? "quick-slash" : "";
    if (isMinionEntity(source)) return source.kind === "melee" ? "minion-smack" : "";
    if (source.key) return "beast-bite";
    return "";
  }

  heroAssistSourceId(source) {
    if (!source) return "";
    if (source.heroType) return source.id || "";
    if (source.ownerId) {
      const owner = this.heroes.get(source.ownerId);
      return owner?.id || "";
    }
    return "";
  }

  rewardHeroFromSource(source) {
    if (!source) return null;
    if (source.heroType) {
      return this.heroes.get(source.id) || source;
    }
    if (source.ownerId) {
      return this.heroes.get(source.ownerId) || null;
    }
    return null;
  }

  pushGoldPopup(x, y, amount, team) {
    if (!amount) return;
    this.pushEffect({
      type: "text",
      x,
      y,
      text: `+${Math.round(amount)}g`,
      team: team || "neutral",
      ttl: 0.9
    });
  }

  tryBasicAttack(hero, now) {
    const attackSpeedMultiplier = hero.status.rapidUntil > now ? 0.58 : 1;
    if (!hero.alive || hero.lastAttackAt + scaledMs(hero.attackCooldown * 1000 * attackSpeedMultiplier) > now) {
      return;
    }

    const candidates = [];
    for (const enemyHero of this.heroes.values()) {
      if (enemyHero.team !== hero.team && enemyHero.alive) {
        candidates.push(enemyHero);
      }
    }
    for (const minion of this.minions) {
      if (minion.team !== hero.team && minion.alive) {
        candidates.push(minion);
      }
    }
    for (const structure of this.structures) {
      if (
        structure.team !== hero.team &&
        !structure.destroyed &&
        this.isStructureVulnerable(structure) &&
        this.canDamageStructure(hero.team, structure)
      ) {
        candidates.push(structure);
      }
    }
    for (const camp of this.camps) {
      if (camp.alive) {
        candidates.push(camp);
      }
    }

    const focused = hero.focusTargetId
      ? candidates.find((candidate) => candidate.id === hero.focusTargetId)
      : null;
    if (focused) {
      const gap = distance(hero, focused);
      if (gap <= hero.attackRange + focused.radius) {
        hero.lastAttackAt = now;
        this.pushEffect({
          type: "line",
          style: this.basicAttackStyle(hero),
          x: hero.x,
          y: hero.y,
          x2: focused.x,
          y2: focused.y,
          team: hero.team,
          ttl: hero.attackRange <= s(220) ? 0.18 : 0.22
        });
        this.applyDamage(focused, hero.attackDamage + hero.bonusDamage + hero.level * 2, hero);
        return;
      }
    }

    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const gap = distance(hero, candidate);
      if (gap <= hero.attackRange + candidate.radius && gap < nearestDistance) {
        nearest = candidate;
        nearestDistance = gap;
      }
    }

    if (!nearest) {
      return;
    }

    hero.lastAttackAt = now;
    this.pushEffect({
      type: "line",
      style: this.basicAttackStyle(hero),
      x: hero.x,
      y: hero.y,
      x2: nearest.x,
      y2: nearest.y,
      team: hero.team,
      ttl: hero.attackRange <= s(220) ? 0.18 : 0.22
    });
    this.applyDamage(nearest, hero.attackDamage + hero.bonusDamage + hero.level * 2, hero);
  }

  updateMinions(delta, now) {
    for (const minion of this.minions) {
      if (!minion.alive) {
        continue;
      }

      const target = this.findMinionTarget(minion);
      if (target && minion.lastAttackAt + scaledMs(minion.attackCooldown * 1000) <= now) {
        minion.lastAttackAt = now;
        minion.attackAnimationUntil = now + 260;
        this.pushEffect({
          type: "line",
          style: this.basicAttackStyle(minion),
          x: minion.x,
          y: minion.y,
          x2: target.x,
          y2: target.y,
          team: minion.team,
          ttl: minion.kind === "melee" ? 0.14 : 0.16
        });
        this.applyDamage(target, minion.attackDamage, minion);
      } else if (!target) {
        const pathLength = PATH_LENGTHS[minion.lane];
        minion.progress = clamp(minion.progress + minion.direction * minion.speed * delta, 0, pathLength);
        const point = advanceAlongPath(LANE_PATHS[minion.lane], minion.progress);
        minion.x = point.x;
        minion.y = point.y;
      }

      const pathLength = PATH_LENGTHS[minion.lane];
      if ((minion.team === BLUE && minion.progress >= pathLength - 20) || (minion.team === RED && minion.progress <= 20)) {
        const nexus = this.structures.find((structure) => structure.kind === "nexus" && structure.team !== minion.team);
        if (nexus && !nexus.destroyed) {
          this.applyDamage(nexus, 52, minion);
        }
        minion.alive = false;
      }
    }
  }

  findMinionTarget(minion) {
    const candidates = [];
    for (const hero of this.heroes.values()) {
      if (hero.team !== minion.team && hero.alive) {
        candidates.push(hero);
      }
    }
    for (const other of this.minions) {
      if (other.team !== minion.team && other.alive && other.lane === minion.lane) {
        candidates.push(other);
      }
    }
    for (const structure of this.structures) {
      if (
        structure.team !== minion.team &&
        !structure.destroyed &&
        this.isStructureVulnerable(structure) &&
        this.canDamageStructure(minion.team, structure) &&
        (structure.kind === "nexus" || structure.lane === minion.lane)
      ) {
        candidates.push(structure);
      }
    }

    let nearest = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const gap = distance(minion, candidate);
      if (gap <= minion.attackRange + candidate.radius && gap < bestDistance) {
        nearest = candidate;
        bestDistance = gap;
      }
    }
    return nearest;
  }

  canDamageStructure(attackerTeam, structure) {
    if (structure.kind === "nexus") {
      return this.minions.some(
        (minion) => minion.team === attackerTeam && minion.alive && distance(minion, structure) <= s(320)
      );
    }

    return this.minions.some(
      (minion) =>
        minion.team === attackerTeam &&
        minion.alive &&
        distance(minion, structure) <= s(300)
    );
  }

  isStructureVulnerable(structure) {
    if (structure.destroyed) {
      return false;
    }
    if (structure.kind === "nexus") {
      return this.structures
        .filter((item) => item.team === structure.team && item.kind === "turret" && item.tier === 1)
        .every((item) => item.destroyed);
    }
    if (structure.tier === 0) {
      return true;
    }
    return this.structures.some(
      (item) =>
        item.team === structure.team &&
        item.kind === "turret" &&
        item.lane === structure.lane &&
        item.tier === structure.tier - 1 &&
        item.destroyed
    );
  }

  updateStructures(now) {
    for (const structure of this.structures) {
      if (structure.destroyed || structure.kind !== "turret" || structure.lastAttackAt + scaledMs(structure.attackCooldown * 1000) > now) {
        continue;
      }

      const enemyMinions = this.minions
        .filter(
          (minion) =>
            minion.team !== structure.team &&
            minion.alive &&
            minion.lane === structure.lane &&
            distance(minion, structure) <= structure.range
        )
        .sort((a, b) => distance(a, structure) - distance(b, structure));
      const enemyHeroes = [...this.heroes.values()]
        .filter((hero) => hero.team !== structure.team && hero.alive && distance(hero, structure) <= structure.range)
        .sort((a, b) => distance(a, structure) - distance(b, structure));
      const target = enemyMinions[0] || enemyHeroes[0];

      if (!target) {
        continue;
      }

      structure.lastAttackAt = now;
      this.pushEffect({
        type: "line",
        x: structure.x,
        y: structure.y,
        x2: target.x,
        y2: target.y,
        team: structure.team,
        sourceType: structure.kind,
        ttl: 0.2
      });
      this.applyDamage(target, structure.attackDamage, structure);
    }
  }

  updateProjectiles(delta) {
    const next = [];
    for (const projectile of this.projectiles) {
      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;
      projectile.ttl -= delta;
      let consumed = projectile.ttl <= 0;
      const targets = this.getDamageableEnemies(projectile.team);

      for (const target of targets) {
        if (target.destroyed || !target.alive || target.id === projectile.ownerId) {
          continue;
        }
        if (distance(projectile, target) <= projectile.radius + target.radius) {
          const owner = this.heroes.get(projectile.ownerId);
          this.applyDamage(target, projectile.damage, owner || { id: projectile.ownerId, team: projectile.team });
          this.pushEffect({
            type: "burst",
            style: this.projectileImpactStyle(projectile),
            x: projectile.x,
            y: projectile.y,
            radius: Math.max(s(48), projectile.radius * 3.4),
            team: projectile.team,
            ttl: 0.28
          });
          consumed = true;
          break;
        }
      }

      if (!consumed && projectile.x >= -200 && projectile.x <= WORLD.width + 200 && projectile.y >= -200 && projectile.y <= WORLD.height + 200) {
        next.push(projectile);
      }
    }
    this.projectiles = next;
  }

  updateCamps(delta, now) {
    for (const camp of this.camps) {
      if (!camp.alive) {
        if (camp.respawnAt <= now) {
          camp.alive = true;
          camp.hp = camp.maxHp;
          camp.x = camp.homeX;
          camp.y = camp.homeY;
          camp.leashTargetId = "";
        }
        continue;
      }

      const home = { x: camp.homeX, y: camp.homeY };
      const leashRadius = s(360);
      const acquireRadius = s(260);
      const disengageRadius = s(520);
      const returnThreshold = s(36);
      const distanceFromHome = distance(camp, home);
      const leashedTarget = camp.leashTargetId ? this.heroes.get(camp.leashTargetId) : null;
      const nearbyHeroes = [...this.heroes.values()]
        .filter((hero) => hero.alive && distance(hero, camp) <= camp.attackRange + acquireRadius)
        .sort((a, b) => distance(a, camp) - distance(b, camp));
      const target = leashedTarget?.alive ? leashedTarget : nearbyHeroes[0] || null;

      if (
        !target
        || !target.alive
        || distance(target, home) > disengageRadius
        || distanceFromHome > leashRadius
      ) {
        camp.leashTargetId = "";
        if (distanceFromHome > returnThreshold) {
          const dirHome = normalize(camp.homeX - camp.x, camp.homeY - camp.y);
          const step = Math.min(distanceFromHome, camp.returnSpeed * delta);
          camp.x += dirHome.x * step;
          camp.y += dirHome.y * step;
        } else {
          camp.x = camp.homeX;
          camp.y = camp.homeY;
        }
        continue;
      }

      camp.leashTargetId = target.id;
      const gap = distance(camp, target);
      const desiredGap = camp.attackRange + target.radius - s(12);
      if (gap > desiredGap) {
        const dir = normalize(target.x - camp.x, target.y - camp.y);
        const step = Math.min(gap - desiredGap, camp.moveSpeed * delta);
        camp.x += dir.x * step;
        camp.y += dir.y * step;
      }

      if (distance(camp, target) > camp.attackRange + target.radius || camp.lastAttackAt + scaledMs(camp.attackCooldown * 1000) > now) {
        continue;
      }

      camp.lastAttackAt = now;
      camp.attackAnimationUntil = now + 280;
      this.pushEffect({
        type: "line",
        style: this.basicAttackStyle(camp),
        x: camp.x,
        y: camp.y,
        x2: target.x,
        y2: target.y,
        team: "neutral",
        ttl: 0.18
      });
      this.applyDamage(target, camp.attackDamage, camp);
    }
  }

  updateEffects(delta) {
    this.effects = this.effects.filter((effect) => {
      effect.ttl -= delta;
      return effect.ttl > 0;
    });
  }

  cleanupDeadUnits() {
    this.minions = this.minions.filter((minion) => minion.alive);
  }

  updateBots(now) {
    if (this.winnerTeam) {
      return;
    }

    for (const bot of this.bots.values()) {
      const hero = this.heroes.get(bot.heroId);
      this.runBotController(hero, bot.lane, bot, now);
    }

    for (const session of this.players.values()) {
      if (session.connected) {
        continue;
      }
      const hero = this.heroes.get(session.heroId);
      this.runBotController(hero, hero?.preferredLane || "mid", session.botBrain, now);
    }
  }

  runBotController(hero, lane, brain, now) {
    if (!hero || !brain || !hero.alive || now - brain.lastThinkAt < 240) {
      return;
    }
    brain.lastThinkAt = now;
    const activeLane = hero.preferredLane || lane;
    hero.preferredLane = activeLane;

    const nearbyEnemyHero = [...this.heroes.values()]
      .filter((candidate) => candidate.team !== hero.team && candidate.alive)
      .sort((a, b) => distance(a, hero) - distance(b, hero))[0];

    if (hero.hp / hero.maxHp < 0.33) {
      hero.moveTarget = { ...BASES[hero.team] };
      if (!hero.status.recallStartedAt && distance(hero, hero.moveTarget) < s(340)) {
        hero.status.recallStartedAt = now;
      }
      return;
    }

    const camp = this.camps
      .filter((item) => item.alive)
      .sort((a, b) => distance(a, hero) - distance(b, hero))[0];

    const laneMinions = this.minions
      .filter((minion) => minion.team === hero.team && minion.alive && minion.lane === activeLane)
      .sort((a, b) => minionLaneScore(hero.team, b) - minionLaneScore(hero.team, a));
    const frontline = laneMinions[0];

    if (nearbyEnemyHero && distance(nearbyEnemyHero, hero) < s(430)) {
      hero.moveTarget = { x: nearbyEnemyHero.x, y: nearbyEnemyHero.y };
      if (distance(nearbyEnemyHero, hero) < s(350)) {
        this.castBestBotAbility(hero, nearbyEnemyHero, now);
      }
      return;
    }

    if (camp && distance(camp, hero) < s(240) && hero.hp / hero.maxHp > 0.64) {
      hero.moveTarget = { x: camp.x, y: camp.y };
      this.castBestBotAbility(hero, camp, now);
      return;
    }

    if (frontline) {
      const lanePoint = nearestLanePoint(
        {
          x: frontline.x + brain.desiredLaneOffset,
          y: frontline.y - brain.desiredLaneOffset
        },
        activeLane
      );
      hero.moveTarget = { x: lanePoint.x, y: lanePoint.y };
    } else {
      const objective = this.structures
        .filter(
          (item) =>
            item.team !== hero.team &&
            !item.destroyed &&
            this.isStructureVulnerable(item) &&
            (item.kind === "nexus" || item.lane === activeLane)
        )
        .sort((a, b) => distance(a, hero) - distance(b, hero))[0];
      if (objective) {
        hero.moveTarget = { x: objective.x - s(100), y: objective.y + s(100) };
      } else {
        const anchor = advanceAlongPath(LANE_PATHS[activeLane], PATH_LENGTHS[activeLane] * (hero.team === BLUE ? 0.2 : 0.8));
        hero.moveTarget = { x: anchor.x, y: anchor.y };
      }
    }
  }

  castBestBotAbility(hero, target, now) {
    if (now - (hero.lastBotCastAt || 0) < 1400) {
      return;
    }
    hero.lastBotCastAt = now;
    const slots = ["q", "w", "e"];
    for (const slot of slots) {
      if (hero.cooldowns[slot] <= now) {
        this.castAbility(hero, slot, target.x, target.y);
        break;
      }
    }
  }

  applyDamage(target, amount, source) {
    if (!target) {
      return;
    }

    if (target.key) {
      const aggroHeroId = this.heroAssistSourceId(source);
      if (aggroHeroId) {
        const aggroHero = this.heroes.get(aggroHeroId);
        if (aggroHero && aggroHero.alive) {
          target.leashTargetId = aggroHero.id;
        }
      }
    }

    if ((target.controller || target.heroType) && target.alive) {
      const assisterId = this.heroAssistSourceId(source);
      if (assisterId) {
        const assister = this.heroes.get(assisterId);
        if (assister && assister.alive && assister.team !== target.team) {
          target.damageCredit.set(assisterId, Date.now());
        }
      }
    }

    if (target.kind === "nexus" || target.kind === "turret") {
      if (!this.isStructureVulnerable(target)) {
        return;
      }
      target.hp -= amount;
      if (target.hp <= 0 && !target.destroyed) {
        target.destroyed = true;
        target.hp = 0;
        const enemy = teamEnemy(target.team);
        this.teamGold[enemy] += target.kind === "nexus" ? 0 : 240;
        this.pushEffect({ type: "burst", x: target.x, y: target.y, radius: target.radius + 36, team: enemy, ttl: 0.9 });
        if (target.kind === "nexus") {
          this.winnerTeam = enemy;
          this.resetAt = Date.now() + scaledMs(8000);
        }
        this.messages.push({
          id: createId("msg"),
          createdAt: Date.now(),
          text: target.kind === "nexus"
            ? `${enemy.toUpperCase()} shattered the ${target.team.toUpperCase()} nexus.`
            : `${enemy.toUpperCase()} destroyed ${target.team.toUpperCase()} ${target.lane.toUpperCase()} ${target.kind}.`
        });
        this.trimMessages();
      }
      return;
    }

    target.hp -= amount;
    if (target.hp > 0) {
      return;
    }

    target.hp = 0;

    if (target.controller || target.heroType) {
      this.onHeroKilled(target, source);
      return;
    }

    if (isMinionEntity(target)) {
      target.alive = false;
      this.pushEffect({ type: "burst", x: target.x, y: target.y, radius: target.radius + 18, team: source?.team || target.team, ttl: 0.32 });
      this.onMinionKilled(target, source);
      return;
    }

    if (target.key) {
      const deathX = target.x;
      const deathY = target.y;
      target.alive = false;
      target.respawnAt = Date.now() + scaledMs(CAMP_RESPAWN * 1000);
      target.leashTargetId = "";
      this.pushEffect({ type: "burst", x: deathX, y: deathY, radius: target.radius + 26, team: "neutral", ttl: 0.5 });
      if (source && source.team && source.team !== "neutral") {
        this.teamGold[source.team] += 120;
        this.teamBuffUntil[source.team] = Date.now() + scaledMs(45000);
        for (const hero of this.heroes.values()) {
          if (hero.team === source.team) {
            hero.gold += 45;
            hero.xp += 24;
            this.applyLevelUp(hero);
          }
        }
        this.messages.push({
          id: createId("msg"),
          createdAt: Date.now(),
          text: `${source.team.toUpperCase()} secured ${target.key} camp.`
        });
        this.trimMessages();
      }
    }
  }

  onMinionKilled(minion, source) {
    if (!source || !source.team || source.team === "neutral") {
      return;
    }
    const killerHero = this.rewardHeroFromSource(source);
    for (const hero of this.heroes.values()) {
      if (!hero.alive || hero.team !== source.team) {
        continue;
      }
      if (distance(hero, minion) <= s(480)) {
        hero.xp += 14;
        const goldGain = hero.id === killerHero?.id ? 24 : 10;
        hero.gold += goldGain;
        if (goldGain > 10) {
          this.pushGoldPopup(minion.x, minion.y - s(40), goldGain, hero.team);
        }
        this.applyLevelUp(hero);
      }
    }
  }

  onHeroKilled(hero, source) {
    const now = Date.now();
    hero.alive = false;
    hero.deaths += 1;
    hero.respawnAt = now + scaledMs(4000 + hero.level * 1200);
    hero.status.recallStartedAt = 0;
    const killerId = this.heroAssistSourceId(source);
    const assistants = [...(hero.damageCredit?.entries?.() || [])]
      .filter(([assisterId, timestamp]) => assisterId !== killerId && now - timestamp <= ASSIST_WINDOW_MS)
      .map(([assisterId]) => this.heroes.get(assisterId))
      .filter((assister) => assister && assister.alive && assister.team !== hero.team);
    for (const assister of assistants) {
      assister.assists = (assister.assists || 0) + 1;
      assister.gold += 45;
      assister.xp += 18;
      this.applyLevelUp(assister);
    }
    hero.damageCredit?.clear?.();
    this.pushEffect({ type: "burst", x: hero.x, y: hero.y, radius: 120, team: source?.team || teamEnemy(hero.team), ttl: 0.6 });

    if (source && source.team && source.team !== hero.team && source.team !== "neutral") {
      const killer = this.rewardHeroFromSource(source) || source;
      if (killer.gold !== undefined) {
        killer.gold += 180;
        killer.kills = (killer.kills || 0) + 1;
        killer.xp += 55;
        this.pushGoldPopup(hero.x, hero.y - s(54), 180, killer.team);
        this.applyLevelUp(killer);
      }
      for (const ally of this.heroes.values()) {
        if (ally.team === source.team && ally.alive && distance(ally, hero) <= s(700)) {
          ally.gold += ally.id === source.id ? 0 : 70;
          ally.xp += 24;
          this.applyLevelUp(ally);
        }
      }
      this.messages.push({
        id: createId("msg"),
        createdAt: Date.now(),
        text: `${this.describeSource(source)} eliminated ${hero.name}.`
      });
    } else {
      this.messages.push({
        id: createId("msg"),
        createdAt: Date.now(),
        text: `${hero.name} was destroyed.`
      });
    }

    this.trimMessages();
  }

  applyLevelUp(hero) {
    while (hero.xp >= hero.level * 60 && hero.level < 18) {
      hero.level += 1;
      hero.maxHp += 40;
      hero.hp += 40;
      hero.attackDamage += 3;
    }
  }

  respawnHero(hero) {
    const spawn = BASES[hero.team];
    hero.alive = true;
    hero.hp = hero.maxHp;
    hero.x = spawn.x;
    hero.y = spawn.y;
    hero.moveTarget = { ...spawn };
    hero.status = {
      stunUntil: 0,
      hasteUntil: 0,
      rapidUntil: 0,
      recallStartedAt: 0,
      castAnimationUntil: 0,
      castAnimationSlot: "",
      fountainAuraAt: 0
    };
    hero.focusTargetId = "";
    hero.damageCredit = new Map();
  }

  pushEffect(effect) {
    this.effects.push({
      id: createId("fx"),
      duration: effect.ttl,
      ...effect
    });
  }

  trimMessages() {
    this.messages = this.messages.slice(-MAX_MESSAGES);
  }

  describeSource(source) {
    if (!source) {
      return "Unknown";
    }
    if (source.name) {
      return source.name;
    }
    if (source.heroType) {
      return source.id;
    }
    if (source.kind === "turret" || source.kind === "nexus") {
      return `${source.team.toUpperCase()} ${source.kind}`;
    }
    if (source.key) {
      return `${source.key} camp`;
    }
    if (isMinionEntity(source)) {
      return `${source.team.toUpperCase()} ${source.lane?.toUpperCase() || ""} minion`.trim();
    }
    return source.id || "Unknown";
  }

  resetMatch(now) {
    this.minions = [];
    this.projectiles = [];
    this.effects = [];
    this.teamGold = { blue: 0, red: 0 };
    this.teamBuffUntil = { blue: 0, red: 0 };
    this.structures = this.createStructures();
    this.camps = this.createCamps();
    this.lastWaveAt = now;
    this.waveCount = 0;
    this.winnerTeam = null;
    this.resetAt = 0;

    for (const hero of this.heroes.values()) {
      const def = HERO_DEFS[hero.heroType];
      hero.maxHp = def.hp;
      hero.hp = def.hp;
      hero.moveSpeed = def.moveSpeed;
      hero.moveSpeedBonus = 0;
      hero.attackRange = def.attackRange;
      hero.attackDamage = def.attackDamage;
      hero.bonusDamage = 0;
      hero.cooldownBias = 0;
      hero.level = 1;
      hero.xp = 0;
      hero.gold = 1000;
      hero.items = [];
      hero.kills = 0;
      hero.assists = 0;
      hero.deaths = 0;
      hero.cooldowns = { q: 0, w: 0, e: 0 };
      hero.lastAttackAt = 0;
      hero.damageCredit = new Map();
      this.respawnHero(hero);
    }

    this.messages.push({
      id: createId("msg"),
      createdAt: now,
      text: "Round reset. Fight again."
    });
    this.trimMessages();
  }

  getLobbyRoster() {
    const byTeam = {
      blue: [],
      red: []
    };

    for (const session of this.players.values()) {
      const hero = this.heroes.get(session.heroId);
      if (!hero || !byTeam[session.team]) continue;
      byTeam[session.team].push({
        id: session.id,
        name: session.name,
        heroType: session.heroType,
        connected: session.connected !== false
      });
    }

    for (const team of TEAMS) {
      byTeam[team].sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      teamSize: TEAM_SIZE,
      blue: byTeam.blue,
      red: byTeam.red
    };
  }

  getSnapshot(token) {
    const session = token ? this.playersByToken.get(token) : null;
    if (!session) {
      return null;
    }

    const you = this.heroes.get(session.heroId);
    return {
      ok: true,
      seq: this.seq,
      serverTime: Date.now(),
      world: WORLD,
      teamSize: TEAM_SIZE,
      bases: BASES,
      baseAuraRadius: BASE_AURA_RADIUS,
      lanePaths: LANE_PATHS,
      you: you
        ? {
          id: you.id,
          name: you.name,
          team: you.team,
          heroType: you.heroType,
          preferredLane: you.preferredLane,
          hp: you.hp,
          maxHp: you.maxHp,
          gold: you.gold,
          level: you.level,
          xp: you.xp,
          attackRange: you.attackRange,
          kills: you.kills,
          assists: you.assists,
          deaths: you.deaths,
          cooldowns: you.cooldowns,
          items: you.items,
          inBase: this.isInFountain(you),
          alive: you.alive,
          respawnAt: you.respawnAt,
          status: you.status,
          x: you.x,
          y: you.y,
          moveTarget: you.moveTarget
        }
        : null,
      shopItems: Object.entries(ITEM_DEFS).map(([key, item]) => ({
        key,
        cost: item.cost,
        maxLevel: item.maxLevel || 3,
        label: item.label,
        short: item.short,
        description: item.description
      })),
      teams: {
        blue: { gold: this.teamGold.blue, buffUntil: this.teamBuffUntil.blue },
        red: { gold: this.teamGold.red, buffUntil: this.teamBuffUntil.red }
      },
      winner: this.winnerTeam,
      heroes: [...this.heroes.values()].map((hero) => ({
        id: hero.id,
        name: hero.name,
        team: hero.team,
        heroType: hero.heroType,
        preferredLane: hero.preferredLane,
        shape: hero.shape,
        color: hero.color,
        x: hero.x,
        y: hero.y,
        hp: hero.hp,
        maxHp: hero.maxHp,
        radius: hero.radius,
        level: hero.level,
        kills: hero.kills,
        assists: hero.assists,
        deaths: hero.deaths,
        alive: hero.alive,
        status: hero.status
      })),
      minions: this.minions.filter((minion) => minion.alive).map((minion) => ({
        id: minion.id,
        team: minion.team,
        lane: minion.lane,
        kind: minion.kind,
        x: minion.x,
        y: minion.y,
        hp: minion.hp,
        maxHp: minion.maxHp,
        radius: minion.radius,
        attackAnimationUntil: minion.attackAnimationUntil
      })),
      structures: this.structures.map((structure) => ({
        id: structure.id,
        team: structure.team,
        lane: structure.lane,
        kind: structure.kind,
        tier: structure.tier,
        x: structure.x,
        y: structure.y,
        hp: structure.hp,
        maxHp: structure.maxHp,
        radius: structure.radius,
        destroyed: structure.destroyed,
        vulnerable: this.isStructureVulnerable(structure)
      })),
      camps: this.camps.map((camp) => ({
        id: camp.id,
        key: camp.key,
        x: camp.x,
        y: camp.y,
        hp: camp.hp,
        maxHp: camp.maxHp,
        radius: camp.radius,
        alive: camp.alive,
        respawnAt: camp.respawnAt,
        attackAnimationUntil: camp.attackAnimationUntil
      })),
      projectiles: this.projectiles,
      effects: this.effects,
      messages: this.messages
    };
  }
}

function minionLaneScore(team, minion) {
  return team === BLUE ? minion.progress : PATH_LENGTHS[minion.lane] - minion.progress;
}
