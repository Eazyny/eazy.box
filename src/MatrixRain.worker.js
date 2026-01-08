// src/matrixrain.worker.js

const GLYPHS =
  "ラドクリフマラソンわたしワタシんょンョたばこタバコとうきょうトウキョウ0123456789±!@#$%^&*()_+";

let canvas, ctx;

let dpr = 1;
let w = 0;
let h = 0;

let columns = 70;
let size = 16;
let rows = 0;

let drops = [];
let lens = [];
let chars = [];

let timer = null;
const fps = 24;
const frameMs = 1000 / fps;

function randGlyph() {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0];
}

function initState() {
  size = Math.ceil((w * dpr) / columns);
  rows = Math.ceil((h * dpr) / size);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `${size}px monospace`;

  drops = new Array(columns).fill(0).map(() => -((Math.random() * rows) | 0));
  lens = new Array(columns)
    .fill(0)
    .map(() => 6 + ((Math.random() * (rows * 0.75)) | 0));
  chars = new Array(columns)
    .fill(0)
    .map(() => new Array(rows).fill(0).map(randGlyph));
}

function resize({ width, height, devicePixelRatio, columnCount }) {
  if (!ctx) return;

  w = width;
  h = height;
  dpr = Math.min(1.5, devicePixelRatio || 1);

  if (typeof columnCount === "number") columns = columnCount;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  // draw in CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  initState();
}

function fade() {
  // trail strength: lower alpha = longer trails
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, 0, w, h);
}

function draw() {
  if (!ctx) return;

  fade();

  for (let x = 0; x < columns; x++) {
    if (Math.random() > 0.5) drops[x] += 1;

    const head = drops[x];
    const len = lens[x];

    if (head > rows + len) {
      drops[x] = -((Math.random() * rows) | 0);
      lens[x] = 6 + ((Math.random() * rows) | 0);
      chars[x] = new Array(rows).fill(0).map(randGlyph);
      continue;
    }

    for (let y = Math.max(0, head - len); y <= head; y++) {
      if (y < 0 || y >= rows) continue;

      if (Math.random() > 0.985) chars[x][y] = randGlyph();

      const dist = head - y;
      const alpha = Math.max(0.08, 1 - dist / len);
      const lightness = dist === 0 ? 95 : 65;

      ctx.fillStyle = `hsla(120, 100%, ${lightness}%, ${alpha})`;
      ctx.fillText(chars[x][y], (x + 0.5) * (size / dpr), y * (size / dpr));
    }
  }
}

function start() {
  stop();
  // Use setInterval in worker (rAF not reliable here)
  timer = setInterval(draw, frameMs);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

self.onmessage = (e) => {
  const { type } = e.data || {};

  if (type === "init") {
    canvas = e.data.canvas;
    ctx = canvas.getContext("2d", { alpha: true });

    resize(e.data);
    start();
  }

  if (type === "resize") {
    resize(e.data);
  }

  if (type === "stop") {
    stop();
  }
};
