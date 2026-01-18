const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const helpEl = document.getElementById("help");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayBodyEl = document.getElementById("overlayBody");
const startButtonEl = document.getElementById("startButton");
const touchControlsEl = document.getElementById("touchControls");
const touchActionsEl = document.getElementById("touchActions");

const touchState = {
  active: false,
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
};

const dogThemes = [
  { fur: "#c97a4a", spot: "#8b4a2f", collar: "#ff5f6d", bandana: "#ff7a48" },
  { fur: "#d6b27c", spot: "#8a6a3e", collar: "#4aa7ff", bandana: "#37c77f" },
  { fur: "#8c6f5f", spot: "#5a4338", collar: "#f6c645", bandana: "#ff7ab6" },
];

const catThemes = [
  { fur: "#4b4f62", accent: "#f4c542", eye: "#7cffd8" },
  { fur: "#8c6b4a", accent: "#f06d6d", eye: "#baff7c" },
  { fur: "#d3c1a2", accent: "#5aa2ff", eye: "#ffb84d" },
];

const chickenThemes = [
  { body: "#ffe38a", comb: "#ff6b6b", beak: "#f5a623" },
  { body: "#fff3c4", comb: "#ff5a72", beak: "#f0b04a" },
];

let audioCtx = null;
let lastBarkAt = 0;
let audioReady = false;
let barkBuffer = null;
let meowBuffer = null;
let audioLoadPromise = null;

function svgToImage(svg) {
  const img = new Image();
  img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  return img;
}

function createDogSvg(theme) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <ellipse cx="72" cy="54" rx="34" ry="16" fill="${theme.fur}"/>
        <ellipse cx="90" cy="50" rx="9" ry="6" fill="${theme.spot}"/>
        <ellipse cx="56" cy="56" rx="11" ry="7" fill="${theme.spot}"/>
        <ellipse cx="104" cy="32" rx="12" ry="12" fill="${theme.fur}"/>
        <ellipse cx="92" cy="28" rx="6" ry="9" fill="${theme.fur}" transform="rotate(-20 92 28)"/>
        <ellipse cx="116" cy="28" rx="6" ry="9" fill="${theme.fur}" transform="rotate(20 116 28)"/>
        <path d="M96 30l6-4" stroke="#1a1c24" stroke-width="2" stroke-linecap="round"/>
        <path d="M116 30l-6-4" stroke="#1a1c24" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="100" cy="32" rx="3.2" ry="2.4" fill="#ff2b2b"/>
        <ellipse cx="112" cy="32" rx="3.2" ry="2.4" fill="#ff2b2b"/>
        <circle cx="100" cy="32" r="1.1" fill="#1a1c24"/>
        <circle cx="112" cy="32" r="1.1" fill="#1a1c24"/>
        <circle cx="106" cy="40" r="3.4" fill="#1a1c24"/>
        <path d="M98 40c4 4 12 4 16 0" fill="none" stroke="#1a1c24" stroke-width="2" stroke-linecap="round"/>
        <path d="M100 44l3 5 3-5 3 5 3-5" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="88" y="44" width="36" height="6" rx="3" fill="${theme.collar}"/>
        <path d="M90 44l4-6 6 6 6-6 6 6 6-6 4 6" fill="none" stroke="#f6c645" stroke-width="2" stroke-linecap="round"/>
        <polygon points="98,49 114,49 106,62" fill="${theme.bandana}"/>
        <rect x="50" y="62" width="9" height="15" rx="4" fill="${theme.fur}"/>
        <rect x="68" y="62" width="9" height="15" rx="4" fill="${theme.fur}"/>
        <rect x="86" y="62" width="9" height="15" rx="4" fill="${theme.fur}"/>
        <path d="M32 54c-8 6-10 12-8 18" fill="none" stroke="${theme.fur}" stroke-width="5" stroke-linecap="round"/>
        <path d="M34 54c-3-6-4-12-2-18" fill="none" stroke="${theme.spot}" stroke-width="3" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

const dogSprites = dogThemes.map((theme) => svgToImage(createDogSvg(theme)));

function createCatSvg(theme) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <ellipse cx="70" cy="54" rx="30" ry="14" fill="${theme.fur}"/>
        <ellipse cx="104" cy="38" rx="14" ry="14" fill="${theme.fur}"/>
        <path d="M94 30l-6-10 10 6" fill="${theme.fur}"/>
        <path d="M114 30l6-10-10 6" fill="${theme.fur}"/>
        <ellipse cx="100" cy="36" rx="3" ry="2.5" fill="${theme.eye}"/>
        <ellipse cx="110" cy="36" rx="3" ry="2.5" fill="${theme.eye}"/>
        <circle cx="100" cy="36" r="1" fill="#1a1c24"/>
        <circle cx="110" cy="36" r="1" fill="#1a1c24"/>
        <circle cx="105" cy="42" r="2.5" fill="#1a1c24"/>
        <path d="M100 44c3 3 7 3 10 0" fill="none" stroke="#1a1c24" stroke-width="2" stroke-linecap="round"/>
        <rect x="88" y="46" width="34" height="6" rx="3" fill="${theme.accent}"/>
        <rect x="50" y="62" width="8" height="14" rx="3" fill="${theme.fur}"/>
        <rect x="68" y="62" width="8" height="14" rx="3" fill="${theme.fur}"/>
        <rect x="86" y="62" width="8" height="14" rx="3" fill="${theme.fur}"/>
        <path d="M36 52c-10 8-12 14-8 20" fill="none" stroke="${theme.fur}" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

const catSprites = catThemes.map((theme) => svgToImage(createCatSvg(theme)));

function createChickenSvg(theme) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <ellipse cx="52" cy="44" rx="22" ry="16" fill="${theme.body}"/>
        <circle cx="72" cy="34" r="10" fill="${theme.body}"/>
        <path d="M70 22l6-6 6 6" fill="${theme.comb}"/>
        <circle cx="70" cy="34" r="2.2" fill="#1a1c24"/>
        <path d="M82 36l10 4-10 4z" fill="${theme.beak}"/>
        <rect x="44" y="56" width="6" height="12" rx="3" fill="#f0b04a"/>
        <rect x="58" y="56" width="6" height="12" rx="3" fill="#f0b04a"/>
        <path d="M30 44c-8 6-8 12-2 16" fill="none" stroke="${theme.body}" stroke-width="6" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

const chickenSprites = chickenThemes.map((theme) => svgToImage(createChickenSvg(theme)));

function createBikeSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
      <defs>
        <linearGradient id="frame" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#7c4dff"/>
          <stop offset="100%" stop-color="#b54dff"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)" stroke="#1a1c24" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="34" cy="104" r="22" fill="none"/>
        <circle cx="108" cy="104" r="22" fill="none"/>
        <path d="M34 104L62 66h26l20 38" fill="none"/>
        <path d="M62 66l-12 22" fill="none"/>
        <path d="M88 66l-10-22h22" fill="none"/>
        <path d="M78 44l-22 0" fill="none"/>
      </g>
      <g filter="url(#shadow)">
        <circle cx="34" cy="104" r="17" fill="#ffffff"/>
        <circle cx="108" cy="104" r="17" fill="#ffffff"/>
        <path d="M34 104L62 66h26l20 38" fill="none" stroke="url(#frame)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M62 66l-12 22" fill="none" stroke="url(#frame)" stroke-width="7" stroke-linecap="round"/>
        <path d="M88 66l-10-22h22" fill="none" stroke="url(#frame)" stroke-width="7" stroke-linecap="round"/>
        <rect x="96" y="30" width="20" height="10" rx="5" fill="#1a1c24"/>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="70" cy="44" rx="10" ry="12" fill="#1a1c24"/>
        <rect x="64" y="56" width="12" height="18" rx="6" fill="#1a1c24"/>
        <circle cx="70" cy="38" r="4" fill="#ffffff"/>
      </g>
      <g filter="url(#shadow)">
        <circle cx="58" cy="28" r="10" fill="#ffd5b5"/>
        <path d="M48 24c4-8 20-10 28-2" fill="none" stroke="#3b2a22" stroke-width="6" stroke-linecap="round"/>
        <path d="M48 34c6 8 18 8 24 0" fill="none" stroke="#1a1c24" stroke-width="3" stroke-linecap="round"/>
        <circle cx="54" cy="28" r="2" fill="#1a1c24"/>
        <circle cx="62" cy="28" r="2" fill="#1a1c24"/>
        <path d="M46 50c10-10 30-10 40 0" fill="#1a1c24"/>
        <path d="M50 54c6 14 26 14 32 0" fill="#1a1c24"/>
        <path d="M52 42l-12 12" fill="none" stroke="#1a1c24" stroke-width="5" stroke-linecap="round"/>
        <path d="M72 42l18 12" fill="none" stroke="#1a1c24" stroke-width="5" stroke-linecap="round"/>
        <path d="M48 22c8-10 24-12 34-2" fill="none" stroke="#ff7a48" stroke-width="7" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

const bikeSprite = svgToImage(createBikeSvg());

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  audioReady = audioCtx.state === "running";
  if (!audioLoadPromise && audioReady) {
    audioLoadPromise = loadAudioBuffers();
  }
}

async function loadFirstAvailable(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        continue;
      }
      const data = await res.arrayBuffer();
      return await audioCtx.decodeAudioData(data);
    } catch (err) {
      continue;
    }
  }
  return null;
}

async function loadAudioBuffers() {
  barkBuffer = await loadFirstAvailable([
    "sounds/bark.mp3",
    "sounds/bark.wav",
    "sounds/bark.ogg",
  ]);
  meowBuffer = await loadFirstAvailable([
    "sounds/meow.mp3",
    "sounds/meow.wav",
    "sounds/meow.ogg",
  ]);
}

function playBuffer(buffer, volume = 0.7) {
  if (!buffer || !audioCtx || audioCtx.state !== "running") {
    return;
  }
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain).connect(audioCtx.destination);
  source.start();
}

function barkSynth() {
  if (!audioCtx || audioCtx.state !== "running") {
    return;
  }
  const now = audioCtx.currentTime;
  if (now - lastBarkAt < 0.25) {
    return;
  }
  lastBarkAt = now;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = "square";
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(500, now + 0.12);
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc.connect(filter).connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

function bark() {
  if (barkBuffer) {
    playBuffer(barkBuffer, 0.85);
  } else {
    barkSynth();
  }
}

function meowSynth() {
  if (!audioCtx || audioCtx.state !== "running") {
    return;
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}

function meow() {
  if (meowBuffer) {
    playBuffer(meowBuffer, 0.75);
  } else {
    meowSynth();
  }
}

function explode() {
  if (!audioCtx || audioCtx.state !== "running") {
    return;
  }
  const now = audioCtx.currentTime;
  const bufferSize = audioCtx.sampleRate * 0.7;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const boomOsc = audioCtx.createOscillator();
  boomOsc.type = "sine";
  boomOsc.frequency.setValueAtTime(120, now);
  boomOsc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
  const noise = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  noise.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1100, now);
  filter.frequency.exponentialRampToValueAtTime(90, now + 0.6);
  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  boomOsc.connect(gain);
  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  boomOsc.start(now);
  boomOsc.stop(now + 0.6);
  noise.start(now);
  noise.stop(now + 0.65);
}

const state = {
  running: true,
  score: 0,
  speed: 3.2,
  spawnTimer: 0,
  spawnEvery: 80,
  dogs: [],
  chickens: [],
  chickenTimer: 0,
  chickenEvery: 120,
  cards: [],
  cardTimer: 0,
  cardEvery: 260,
  exploded: false,
  explosionTimer: 0,
  explosionDuration: 40,
  explosionAt: { x: 0, y: 0 },
  paused: false,
  keys: {
    left: false,
    right: false,
    up: false,
    down: false,
  },
};

const road = {
  left: 60,
  right: canvas.width - 60,
  lineOffset: 0,
};

const player = {
  width: 38,
  height: 64,
  x: canvas.width / 2,
  y: canvas.height - 120,
  speed: 5,
  scale: 1,
};

const scaleState = {
  entity: 1,
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const margin = Math.max(60, canvas.width * 0.18);
  road.left = margin;
  road.right = canvas.width - margin;
  player.y = canvas.height - Math.max(140, canvas.height * 0.2);
  player.x = Math.min(road.right - player.width / 2, Math.max(road.left + player.width / 2, player.x));
  scaleState.entity = canvas.width < 700 ? 0.5 : 1;
}

function resetGame() {
  state.running = false;
  state.paused = false;
  state.exploded = false;
  state.explosionTimer = 0;
  state.score = 0;
  state.speed = 2.2;
  state.spawnEvery = 95;
  state.spawnTimer = 0;
  state.dogs = [];
  state.chickenTimer = 0;
  state.chickens = [];
  state.cardTimer = 0;
  state.cards = [];
  player.scale = 1;
  player.x = canvas.width / 2;
  player.y = canvas.height - Math.max(140, canvas.height * 0.2);
  helpEl.textContent = "Use WASD/arrows or drag to move. Avoid dogs.";
}

function showOverlay(title, body, buttonText) {
  overlayTitleEl.textContent = title;
  overlayBodyEl.textContent = body;
  startButtonEl.textContent = buttonText;
  overlayEl.hidden = false;
}

function hideOverlay() {
  overlayEl.hidden = true;
}

function startGame() {
  state.paused = false;
  state.running = true;
  hideOverlay();
}

function togglePause() {
  if (!state.running && overlayEl.hidden) {
    return;
  }
  if (state.running) {
    state.running = false;
    state.paused = true;
    showOverlay("Paused", "Press P to resume or tap Start.", "Resume");
  } else {
    startGame();
  }
}

function addCritter() {
  const size = (34 + Math.random() * 10) * scaleState.entity;
  const x = road.left + size / 2 + Math.random() * (road.right - road.left - size);
  const isDog = Math.random() > 0.4;
  state.dogs.push({
    x,
    y: -size,
    size,
    wobble: Math.random() * Math.PI * 2,
    sprite: isDog
      ? dogSprites[Math.floor(Math.random() * dogSprites.length)]
      : catSprites[Math.floor(Math.random() * catSprites.length)],
    sound: isDog ? "bark" : "meow",
    barked: false,
  });
}

function addChicken() {
  const size = (30 + Math.random() * 6) * scaleState.entity;
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? road.left - 40 : road.right + 40;
  const minY = 120;
  const maxY = canvas.height - 220;
  const minGap = 120;
  let baseY = minY + Math.random() * (maxY - minY);
  if (Math.abs(baseY - player.y) < minGap) {
    baseY = baseY > player.y ? player.y + minGap : player.y - minGap;
  }
  baseY = Math.min(maxY, Math.max(minY, baseY));
  const speed = 1.8 + Math.random() * 1.4;
  state.chickens.push({
    x: startX,
    y: baseY,
    size,
    dir: fromLeft ? 1 : -1,
    speed,
    sprite: chickenSprites[Math.floor(Math.random() * chickenSprites.length)],
  });
}

function addCard() {
  const width = 26 * scaleState.entity;
  const height = 36 * scaleState.entity;
  const x = road.left + width + Math.random() * (road.right - road.left - width * 2);
  const y = -height - Math.random() * 200;
  state.cards.push({
    x,
    y,
    width,
    height,
  });
}

function update() {
  if (!state.running) {
    if (state.explosionTimer > 0) {
      state.explosionTimer -= 1;
    }
    return;
  }

  if (touchState.active) {
    player.x = touchState.x;
    player.y = touchState.y;
  } else {
    if (state.keys.left) {
      player.x -= player.speed;
    }
    if (state.keys.right) {
      player.x += player.speed;
    }
    if (state.keys.up) {
      player.y -= player.speed;
    }
    if (state.keys.down) {
      player.y += player.speed;
    }
  }

  const half = player.width / 2;
  const vHalf = player.height / 2;
  player.x = Math.max(road.left + half, Math.min(road.right - half, player.x));
  player.y = Math.max(120 + vHalf, Math.min(canvas.height - 120, player.y));

  road.lineOffset = (road.lineOffset + state.speed) % 60;

  const difficulty = Math.min(1, state.score / 1000);
  state.spawnTimer += 1;
  if (state.spawnTimer > state.spawnEvery) {
    state.spawnTimer = 0;
    addCritter();
    if (Math.random() < 0.25 + difficulty * 0.35) {
      addCritter();
    }
  }

  state.chickenTimer += 1;
  if (state.chickenTimer > state.chickenEvery) {
    state.chickenTimer = 0;
    addChicken();
  }

  state.cardTimer += 1;
  if (state.cardTimer > state.cardEvery) {
    state.cardTimer = 0;
    if (Math.random() > 0.4) {
      addCard();
    }
  }

  state.dogs.forEach((dog) => {
    dog.y += state.speed + state.score * 0.0025;
    dog.wobble += 0.06;
    if (audioReady && !dog.barked && dog.y > 10) {
      dog.barked = true;
      if (dog.sound === "meow") {
        meow();
      } else {
        bark();
      }
    }
  });

  state.chickens.forEach((chicken) => {
    chicken.x += chicken.speed * chicken.dir;
  });

  state.cards.forEach((card) => {
    card.y += state.speed * 0.8;
  });

  state.dogs = state.dogs.filter((dog) => dog.y < canvas.height + 80);
  state.chickens = state.chickens.filter(
    (chicken) => chicken.x > road.left - 80 && chicken.x < road.right + 80
  );
  state.cards = state.cards.filter((card) => card.y < canvas.height + 80);

  state.score += 0.4;
  scoreEl.textContent = Math.floor(state.score).toString();

  state.speed = 2.2 + difficulty * 2.6;
  state.spawnEvery = 95 - difficulty * 45;
  state.chickenEvery = 150 - difficulty * 55;

  if (checkCollision()) {
    state.running = false;
    state.exploded = true;
    state.explosionTimer = state.explosionDuration;
    state.explosionAt = { x: player.x, y: player.y };
    helpEl.textContent = "Bonk! Press R or tap Start to try again.";
    showOverlay(
      "Dogpile!",
      "Ouch! Dodge the animals and collect +100 cards, but getting big makes it harder.",
      "Ride Again"
    );
    if (audioReady) {
      explode();
    }
  }
}

function checkCollision() {
  const drawWidth = player.width * 2.8 * 0.75 * player.scale * scaleState.entity;
  const drawHeight = player.height * 2.1 * 0.75 * player.scale * scaleState.entity;
  const hitbox = {
    x: player.x - drawWidth / 2,
    y: player.y - drawHeight / 2,
    w: drawWidth,
    h: drawHeight,
  };

  const hitDog = state.dogs.some((dog) => {
    const size = dog.size;
    const dx = dog.x - size / 2;
    const dy = dog.y - size / 2;
    return (
      hitbox.x < dx + size &&
      hitbox.x + hitbox.w > dx &&
      hitbox.y < dy + size &&
      hitbox.y + hitbox.h > dy
    );
  });

  const hitChicken = state.chickens.some((chicken) => {
    const width = chicken.size * 1.6;
    const height = chicken.size * 1.1;
    const dx = chicken.x - width / 2;
    const dy = chicken.y - height / 2;
    return (
      hitbox.x < dx + width &&
      hitbox.x + hitbox.w > dx &&
      hitbox.y < dy + height &&
      hitbox.y + hitbox.h > dy
    );
  });

  const cardIndex = state.cards.findIndex((card) => {
    const dx = card.x - card.width / 2;
    const dy = card.y - card.height / 2;
    return (
      hitbox.x < dx + card.width &&
      hitbox.x + hitbox.w > dx &&
      hitbox.y < dy + card.height &&
      hitbox.y + hitbox.h > dy
    );
  });

  if (cardIndex >= 0) {
    state.cards.splice(cardIndex, 1);
    state.score += 100;
    player.scale = Math.min(1.6, player.scale + 0.12);
  }

  return hitDog || hitChicken;
}

function drawRoad() {
  ctx.fillStyle = "#f4f1e4";
  ctx.fillRect(road.left, 0, road.right - road.left, canvas.height);

  ctx.fillStyle = "#e1d6bd";
  for (let y = -60 + road.lineOffset; y < canvas.height + 60; y += 120) {
    ctx.fillRect(canvas.width / 2 - 6, y, 12, 60);
  }

  ctx.fillStyle = "#d7c8a8";
  ctx.fillRect(road.left - 14, 0, 14, canvas.height);
  ctx.fillRect(road.right, 0, 14, canvas.height);
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  const drawWidth = player.width * 2.8 * player.scale * scaleState.entity;
  const drawHeight = player.height * 2.1 * player.scale * scaleState.entity;

  if (!state.exploded && bikeSprite.complete) {
    ctx.drawImage(bikeSprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = "#1a1c24";
    ctx.fillRect(-10, -20, 20, 30);
    ctx.fillRect(-6, -40, 12, 22);

    ctx.fillStyle = "#ff7a48";
    ctx.fillRect(-16, -2, 32, 28);
  }

  ctx.restore();
}

function drawDog(dog) {
  ctx.save();
  ctx.translate(dog.x + Math.sin(dog.wobble) * 3, dog.y);

  const drawWidth = dog.size * 2.1;
  const drawHeight = dog.size * 1.4;
  const sprite = dog.sprite;

  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = "#7a4a2c";
    ctx.beginPath();
    ctx.ellipse(0, 0, dog.size * 0.55, dog.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawChicken(chicken) {
  ctx.save();
  ctx.translate(chicken.x, chicken.y);
  ctx.scale(chicken.dir, 1);

  const drawWidth = chicken.size * 2;
  const drawHeight = chicken.size * 1.3;
  const sprite = chicken.sprite;

  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = "#ffe38a";
    ctx.beginPath();
    ctx.ellipse(0, 0, chicken.size * 0.55, chicken.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCard(card) {
  ctx.save();
  ctx.translate(card.x, card.y);

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#1a1c24";
  ctx.lineWidth = 2;
  ctx.fillRect(-card.width / 2, -card.height / 2, card.width, card.height);
  ctx.strokeRect(-card.width / 2, -card.height / 2, card.width, card.height);

  ctx.fillStyle = "#7c4dff";
  ctx.font = "bold 14px Fira Sans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("+100", 0, 5);

  ctx.restore();
}

function drawExplosion() {
  if (!state.exploded || state.explosionTimer <= 0) {
    return;
  }
  const progress = 1 - state.explosionTimer / state.explosionDuration;
  const radius = 20 + progress * 90;
  ctx.save();
  ctx.translate(state.explosionAt.x, state.explosionAt.y);

  ctx.globalAlpha = 0.9 - progress * 0.6;
  const gradient = ctx.createRadialGradient(0, 0, 8, 0, 0, radius);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.25, "rgba(255,200,80,0.9)");
  gradient.addColorStop(0.7, "rgba(255,110,70,0.6)");
  gradient.addColorStop(1, "rgba(255,60,90,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.85 - progress * 0.7;
  ctx.fillStyle = "#1a1c24";
  for (let i = 0; i < 14; i += 1) {
    const angle = (Math.PI * 2 * i) / 14;
    const dist = 12 + progress * 110;
    const size = 8 - progress * 4;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillRect(dist, -size / 2, size * 2, size);
    ctx.restore();
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#9fd3ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#a6e8b1";
  ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height);

  drawRoad();

  state.dogs.forEach(drawDog);
  state.chickens.forEach(drawChicken);
  state.cards.forEach(drawCard);
  drawPlayer();
  drawExplosion();

  if (!state.running) {
    ctx.fillStyle = "rgba(26, 28, 36, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px Bungee, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Dogpile!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "18px Fira Sans, sans-serif";
    ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 30);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  ensureAudio();
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    state.keys.left = true;
  }
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    state.keys.right = true;
  }
  if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
    state.keys.up = true;
  }
  if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
    state.keys.down = true;
  }
  if (event.key === "r" || event.key === "R") {
    if (!state.running) {
      resetGame();
      startGame();
    }
  }
  if (event.key === "p" || event.key === "P") {
    togglePause();
  }
});

window.addEventListener("pointerdown", () => {
  ensureAudio();
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    state.keys.left = false;
  }
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    state.keys.right = false;
  }
  if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
    state.keys.up = false;
  }
  if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
    state.keys.down = false;
  }
});

resetGame();
resizeCanvas();
showOverlay(
  "Ready to Ride?",
  "Use WASD/arrows or drag on the road to move. Press P to pause. Dodge dogs, cats, and chickens. Grab +100 cards for bonus meters.",
  "Start Ride"
);
loop();

window.addEventListener("resize", resizeCanvas);

startButtonEl.addEventListener("click", () => {
  if (!state.running) {
    if (state.paused) {
      startGame();
    } else {
      resetGame();
      startGame();
    }
  }
});

function setTouchMode() {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  document.body.classList.toggle("touch", isTouch);
  if (!isTouch) {
    touchState.active = false;
  }
  if (helpEl) {
    helpEl.textContent = isTouch
      ? "Touch: drag to move. Avoid dogs."
      : "Use WASD or arrows to move. Avoid dogs.";
  }
}

function setTouchTarget(event) {
  const rect = canvas.getBoundingClientRect();
  touchState.x = event.clientX - rect.left - touchState.offsetX;
  touchState.y = event.clientY - rect.top - touchState.offsetY;
}

function getPlayerBounds(scale = 1) {
  const drawWidth = player.width * 2.8 * player.scale * scaleState.entity * scale;
  const drawHeight = player.height * 2.1 * player.scale * scaleState.entity * scale;
  return {
    x: player.x - drawWidth / 2,
    y: player.y - drawHeight / 2,
    w: drawWidth,
    h: drawHeight,
  };
}

function isPointerOnPlayer(pointerX, pointerY) {
  const bounds = getPlayerBounds(1.1);
  const centerX = bounds.x + bounds.w / 2;
  const centerY = bounds.y + bounds.h / 2;
  const radius = Math.max(bounds.w, bounds.h) * 0.55;
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  return dx * dx + dy * dy <= radius * radius;
}

canvas.addEventListener("pointerdown", (event) => {
  if (!document.body.classList.contains("touch")) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  if (!isPointerOnPlayer(pointerX, pointerY)) {
    return;
  }
  touchState.active = true;
  touchState.offsetX = pointerX - player.x;
  touchState.offsetY = pointerY - player.y;
  setTouchTarget(event);
  canvas.setPointerCapture(event.pointerId);
  ensureAudio();
});

canvas.addEventListener("pointermove", (event) => {
  if (!touchState.active) {
    return;
  }
  setTouchTarget(event);
});

canvas.addEventListener("pointerup", (event) => {
  if (!touchState.active) {
    return;
  }
  touchState.active = false;
  touchState.offsetX = 0;
  touchState.offsetY = 0;
  canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", (event) => {
  if (!touchState.active) {
    return;
  }
  touchState.active = false;
  touchState.offsetX = 0;
  touchState.offsetY = 0;
  canvas.releasePointerCapture(event.pointerId);
});

window.addEventListener("pointerup", (event) => {
  if (!touchState.active) {
    return;
  }
  touchState.active = false;
  touchState.offsetX = 0;
  touchState.offsetY = 0;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
});

touchControlsEl.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("[data-dir]");
  if (!button) {
    return;
  }
  const dir = button.dataset.dir;
  state.keys[dir] = true;
});

touchControlsEl.addEventListener("pointerup", () => {
  state.keys.left = false;
  state.keys.right = false;
  state.keys.up = false;
  state.keys.down = false;
});

touchControlsEl.addEventListener("pointerleave", () => {
  state.keys.left = false;
  state.keys.right = false;
  state.keys.up = false;
  state.keys.down = false;
});

touchActionsEl.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }
  const action = button.dataset.action;
  if (action === "pause") {
    togglePause();
  }
  if (action === "reset") {
    resetGame();
    startGame();
  }
});

setTouchMode();
window.addEventListener("pointerdown", setTouchMode, { once: true });
