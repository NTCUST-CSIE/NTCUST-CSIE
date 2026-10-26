import { useEffect, useRef, useState } from 'react';
import { discoverEgg, prefersReducedMotion } from '../utils/eggs';

const IDLE_MS = 3 * 60 * 1000;
const LEAVE_MS = 300;
const SPEED = 140; // px/s，跟 DVD 待機畫面一樣斜 45 度
// 每次啟動都安排 Logo 在 20～60 秒後剛好撞進角落，所以只要夠有耐心就看得到
const CORNER_MIN_S = 20;
const CORNER_MAX_S = 60;
// 兩邊撞牆的時間差換算成距離，在這個範圍內才算「完美的角落」
const CORNER_TOLERANCE = 2;
const WAKE_DISTANCE = 8;
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];

// 把一直往前走的座標摺回 0～len 之間，等於在兩面牆之間來回反彈
const fold = (u: number, len: number) => {
  const m = ((u % (2 * len)) + 2 * len) % (2 * len);
  return m <= len ? m : 2 * len - m;
};

interface Path {
  w: number;
  h: number;
  x0: number;
  y0: number;
}

// 從角落倒推回去當起點，往前走 T 秒就會剛好撞進那個角落
const planPath = (logo: HTMLElement): Path => {
  const w = Math.max(1, window.innerWidth - logo.offsetWidth);
  const h = Math.max(1, window.innerHeight - logo.offsetHeight);
  const t = CORNER_MIN_S + Math.random() * (CORNER_MAX_S - CORNER_MIN_S);
  const cornerX = Math.random() < 0.5 ? 0 : w;
  const cornerY = Math.random() < 0.5 ? 0 : h;
  return { w, h, x0: cornerX - SPEED * t, y0: cornerY - SPEED * t };
};

const BouncingLogo = () => {
  const moverRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const mover = moverRef.current;
    const logo = logoRef.current;
    if (!mover || !logo) return;

    let path = planPath(mover);
    let t = 0;
    let prev: number | null = null;
    let wallX = Math.floor(path.x0 / path.w);
    let wallY = Math.floor(path.y0 / path.h);
    let hitX = -Infinity;
    let hitY = -Infinity;
    let bounces = 0;
    let raf = 0;

    const reset = () => {
      path = planPath(mover);
      t = 0;
      wallX = Math.floor(path.x0 / path.w);
      wallY = Math.floor(path.y0 / path.h);
      hitX = hitY = -Infinity;
    };

    const frame = (now: number) => {
      // 切到背景時不算時間，回來才不會一口氣跳很遠
      if (prev !== null) t += Math.min(now - prev, 100) / 1000;
      prev = now;
      const ux = path.x0 + SPEED * t;
      const uy = path.y0 + SPEED * t;
      const nextWallX = Math.floor(ux / path.w);
      const nextWallY = Math.floor(uy / path.h);
      const bounced = nextWallX !== wallX || nextWallY !== wallY;
      if (nextWallX !== wallX) hitX = (nextWallX * path.w - path.x0) / SPEED;
      if (nextWallY !== wallY) hitY = (nextWallY * path.h - path.y0) / SPEED;
      wallX = nextWallX;
      wallY = nextWallY;

      if (bounced) {
        bounces++;
        logo.style.filter = `hue-rotate(${(bounces * 75) % 360}deg)`;
        if (Math.abs(hitX - hitY) * SPEED <= CORNER_TOLERANCE) {
          logo.classList.remove('corner');
          void logo.offsetWidth;
          logo.classList.add('corner');
          discoverEgg('dvd');
        }
      }

      mover.style.transform = `translate3d(${fold(ux, path.w)}px, ${fold(uy, path.h)}px, 0)`;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', reset);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', reset);
    };
  }, []);

  return (
    <div ref={moverRef} className="screensaver-mover">
      <img ref={logoRef} src="/img/logo.png" alt="" width="1745" height="869" className="screensaver-logo" />
    </div>
  );
};

// 閒置 3 分鐘後跳出螢幕保護程式，動一下滑鼠或按任意鍵就會回來
const Screensaver = () => {
  const [state, setState] = useState<'off' | 'on' | 'leaving'>('off');

  useEffect(() => {
    if (state !== 'off') return;
    let last = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      const idle = performance.now() - last;
      if (idle < IDLE_MS) {
        timer = setTimeout(check, IDLE_MS - idle);
      } else if (document.hidden || prefersReducedMotion()) {
        last = performance.now();
        timer = setTimeout(check, IDLE_MS);
      } else {
        setState('on');
      }
    };
    const handleActivity = () => { last = performance.now(); };
    const handleVisibility = () => { if (!document.hidden) handleActivity(); };

    ACTIVITY_EVENTS.forEach(type => window.addEventListener(type, handleActivity, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    timer = setTimeout(check, IDLE_MS);
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach(type => window.removeEventListener(type, handleActivity, { capture: true }));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [state]);

  useEffect(() => {
    if (state !== 'leaving') return;
    const timer = setTimeout(() => setState('off'), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state === 'off') return;
    let origin: { x: number; y: number } | null = null;
    const wake = () => setState('leaving');
    const handleMove = (e: PointerEvent) => {
      if (!origin) origin = { x: e.clientX, y: e.clientY };
      else if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > WAKE_DISTANCE) wake();
    };
    // 叫醒螢幕的那一下不算數，不然按 ` 叫醒會順便打開終端機、點一下會點到後面的連結
    const swallow = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      wake();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('keydown', swallow, true);
    window.addEventListener('pointerdown', swallow, true);
    window.addEventListener('wheel', swallow, { capture: true, passive: false });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('keydown', swallow, true);
      window.removeEventListener('pointerdown', swallow, true);
      window.removeEventListener('wheel', swallow, true);
    };
  }, [state]);

  if (state === 'off') return null;

  return (
    <div className={`screensaver${state === 'leaving' ? ' leaving' : ''}`} aria-hidden="true">
      <BouncingLogo />
    </div>
  );
};

export default Screensaver;
