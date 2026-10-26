import { prefersReducedMotion } from './eggs';

const SIZE = 64;
const GRAVITY = 1800; // px/s²
const LIFETIME_S = 2.6;
const FADE_MS = 400;
// 狂點也只留最新的幾個，免得畫面塞滿
const MAX_DROPS = 24;

interface Drop {
  el: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  age: number;
  fading: boolean;
}

const live = new Set<Drop>();
let layer: HTMLDivElement | null = null;
let raf = 0;
let last = 0;

const removeDrop = (drop: Drop) => {
  live.delete(drop);
  drop.el.remove();
};

const fadeOut = (drop: Drop) => {
  drop.fading = true;
  drop.el.classList.add('fading');
  setTimeout(() => removeDrop(drop), FADE_MS);
};

const tick = (now: number) => {
  const dt = Math.min(now - last, 50) / 1000;
  last = now;
  const floor = window.innerHeight - SIZE;
  const right = window.innerWidth - SIZE;

  for (const d of live) {
    d.age += dt;
    d.vy += GRAVITY * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.angle += d.spin * dt;

    if (d.x < 0 || d.x > right) {
      d.x = Math.min(Math.max(d.x, 0), right);
      d.vx = -d.vx * 0.6;
    }
    // 落地彈一兩下就停住
    if (d.y > floor) {
      d.y = floor;
      d.vy = d.vy > 200 ? -d.vy * 0.45 : 0;
      d.vx *= 0.75;
      d.spin *= 0.6;
    }
    if (d.age > LIFETIME_S && !d.fading) fadeOut(d);

    d.el.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) rotate(${d.angle}deg)`;
  }

  raf = live.size > 0 ? requestAnimationFrame(tick) : 0;
};

// 從 from 的中心彈出一張 64px 的小圖，掉到畫面底部後淡出
export const dropItem = (src: string, from: DOMRect, round = false) => {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'drop-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  if (live.size >= MAX_DROPS) {
    const oldest = live.values().next().value;
    if (oldest) removeDrop(oldest);
  }

  const el = document.createElement('img');
  el.src = src;
  el.alt = '';
  el.draggable = false;
  el.className = round ? 'drop-item round' : 'drop-item';
  layer.appendChild(el);

  const drop: Drop = {
    el,
    x: from.left + from.width / 2 - SIZE / 2,
    y: from.top + from.height / 2 - SIZE / 2,
    vx: (Math.random() * 2 - 1) * 260,
    vy: -(380 + Math.random() * 220),
    angle: 0,
    spin: (Math.random() * 2 - 1) * 540,
    age: 0,
    fading: false,
  };

  // 減少動態效果時不飛不轉，在頭像下方出現一下就淡出
  if (prefersReducedMotion()) {
    el.style.transform = `translate3d(${drop.x}px, ${from.bottom + 8}px, 0)`;
    setTimeout(() => fadeOut(drop), 1200);
    return;
  }

  live.add(drop);
  el.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0)`;
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
};
