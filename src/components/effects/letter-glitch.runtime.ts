// @ts-nocheck
type RGB = { r: number; g: number; b: number };

type GlitchLetter = {
  char: string;
  color: string;
  targetColor: string;
  colorProgress: number;
};

const FALLBACK_COLORS = ['#5e4491', '#A476FF', '#241a38'];
const BRAND_VARS = ['--brand-300', '--brand-600', '--brand-900'];
const ROOT_SELECTOR = '[data-letter-glitch]';
const MEDIA_QUERY = '(hover: hover) and (pointer: fine)';

function parseJsonArray(value: string | undefined, fallback: string[]): string[] {
  if (typeof value !== 'string' || value.trim() === '') return fallback.slice();

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback.slice();
  } catch {
    return fallback.slice();
  }
}

function parseColor(color: string): RGB | null {
  const sixHex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (sixHex) {
    return {
      r: Number.parseInt(sixHex[1], 16),
      g: Number.parseInt(sixHex[2], 16),
      b: Number.parseInt(sixHex[3], 16),
    };
  }

  const threeHex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(color);
  if (threeHex) {
    return {
      r: Number.parseInt(threeHex[1] + threeHex[1], 16),
      g: Number.parseInt(threeHex[2] + threeHex[2], 16),
      b: Number.parseInt(threeHex[3] + threeHex[3], 16),
    };
  }

  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(color);
  if (rgb) {
    return {
      r: Number.parseInt(rgb[1], 10),
      g: Number.parseInt(rgb[2], 10),
      b: Number.parseInt(rgb[3], 10),
    };
  }

  return null;
}

function interpolateColor(start: RGB, end: RGB, factor: number): string {
  const result = {
    r: Math.round(start.r + (end.r - start.r) * factor),
    g: Math.round(start.g + (end.g - start.g) * factor),
    b: Math.round(start.b + (end.b - start.b) * factor),
  };
  return `rgb(${result.r}, ${result.g}, ${result.b})`;
}

function getLettersForLocale(locale: string): string[] {
  const latinChars = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];

  const cyrillicChars = [
    'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М',
    'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ',
    'Ы', 'Ь', 'Э', 'Ю', 'Я',
  ];

  const symbols = ['!', '@', '#', '$', '&', '*', '(', ')', '-', '_', '+', '=', '/', '[', ']', '{', '}', ';', ':', '<', '>', ',', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return locale === 'ru' ? [...cyrillicChars, ...symbols] : [...latinChars, ...symbols];
}

function resolveBrandColors(): string[] {
  if (typeof document === 'undefined') return [];

  const tmp = document.createElement('canvas');
  tmp.width = 1;
  tmp.height = 1;

  const tmpCtx = tmp.getContext('2d', { willReadFrequently: true });
  if (!tmpCtx) return [];

  const root = getComputedStyle(document.documentElement);
  const resolved: string[] = [];

  for (const name of BRAND_VARS) {
    const raw = root.getPropertyValue(name).trim();
    if (!raw) continue;

    tmpCtx.clearRect(0, 0, 1, 1);
    tmpCtx.fillStyle = '#000';
    tmpCtx.fillStyle = raw;
    tmpCtx.fillRect(0, 0, 1, 1);

    const [r, g, b] = tmpCtx.getImageData(0, 0, 1, 1).data;
    resolved.push(`rgb(${r}, ${g}, ${b})`);
  }

  return resolved;
}

function initLetterGlitch(root: Element | null): (() => void) | void {
  if (!(root instanceof HTMLElement)) return;
  if (root.dataset.letterGlitchInit === 'true') return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const hasDesktopPointer = window.matchMedia ? window.matchMedia(MEDIA_QUERY).matches : true;
  if (!hasDesktopPointer) return;

  const canvas = root.querySelector('canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  root.dataset.letterGlitchInit = 'true';

  const glitchColors = parseJsonArray(root.dataset.glitchColors, FALLBACK_COLORS);
  const glitchSpeed = Number(root.dataset.glitchSpeed || '33');
  const smooth = root.dataset.smooth !== 'false';
  const useBrandTokens = root.dataset.useBrandTokens !== 'false';
  const locale = root.dataset.locale || 'en';
  const lettersAndSymbols = getLettersForLocale(locale);
  const activeColors = useBrandTokens ? resolveBrandColors() : glitchColors.slice();
  const palette = activeColors.length > 0 ? activeColors : glitchColors.slice();

  const letters: GlitchLetter[] = [];
  const grid = { columns: 0, rows: 0 };
  const dimensions = { width: 0, height: 0 };
  let animationId: number | null = null;
  let lastGlitchTime = Date.now();
  let resizeTimeout: number | undefined;
  let visibleObserver: IntersectionObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let destroyed = false;
  let running = false;

  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  function getRandomChar(): string {
    return lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  }

  function getRandomColor(): string {
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function calculateGrid(width: number, height: number): { columns: number; rows: number } {
    return {
      columns: Math.ceil(width / charWidth),
      rows: Math.ceil(height / charHeight),
    };
  }

  function initializeLetters(columns: number, rows: number): void {
    grid.columns = columns;
    grid.rows = rows;

    const totalLetters = columns * rows;
    letters.length = 0;

    for (let index = 0; index < totalLetters; index += 1) {
      letters.push({
        char: getRandomChar(),
        color: getRandomColor(),
        targetColor: getRandomColor(),
        colorProgress: 1,
      });
    }
  }

  function drawLetters(): void {
    if (letters.length === 0) return;

    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    context.clearRect(0, 0, width, height);
    context.font = `${fontSize}px monospace`;
    context.textBaseline = 'top';

    letters.forEach((letter, index) => {
      const x = (index % grid.columns) * charWidth;
      const y = Math.floor(index / grid.columns) * charHeight;
      context.fillStyle = letter.color;
      context.fillText(letter.char, x, y);
    });
  }

  function resizeCanvas(): void {
    if (destroyed) return;

    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    dimensions.width = rect.width;
    dimensions.height = rect.height;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  }

  function updateLetters(): void {
    if (letters.length === 0) return;

    const updateCount = Math.max(1, Math.floor(letters.length * 0.05));

    for (let index = 0; index < updateCount; index += 1) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      const letter = letters[randomIndex];
      if (!letter) continue;

      letter.char = getRandomChar();
      letter.targetColor = getRandomColor();

      if (!smooth) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
      } else {
        letter.colorProgress = 0;
      }
    }
  }

  function handleSmoothTransitions(): void {
    let needsRedraw = false;

    letters.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        const startRgb = parseColor(letter.color);
        const endRgb = parseColor(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
    });

    if (needsRedraw) {
      drawLetters();
    }
  }

  function animate(): void {
    if (destroyed || !running) return;

    const now = Date.now();
    if (now - lastGlitchTime >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime = now;
    }

    if (smooth) {
      handleSmoothTransitions();
    }

    animationId = window.requestAnimationFrame(animate);
  }

  function start(): void {
    if (destroyed || running) return;
    running = true;
    resizeCanvas();

    const prefersReducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    if (!prefersReducedMotion) {
      animationId = window.requestAnimationFrame(animate);
    }
  }

  function stop(): void {
    destroyed = true;
    running = false;

    if (animationId !== null) {
      window.cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = undefined;
    }

    if (visibleObserver) {
      visibleObserver.disconnect();
      visibleObserver = null;
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    window.removeEventListener('resize', scheduleResize);
  }

  function scheduleResize(): void {
    if (destroyed) return;

    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      resizeTimeout = undefined;

      if (!running) return;

      if (animationId !== null) {
        window.cancelAnimationFrame(animationId);
        animationId = null;
      }

      resizeCanvas();

      const prefersReducedMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(animate);
      }
    }, 100);
  }

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(root);
  } else {
    window.addEventListener('resize', scheduleResize, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    visibleObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          if (visibleObserver) {
            visibleObserver.disconnect();
            visibleObserver = null;
          }
          start();
        }
      },
      { rootMargin: '200px 0px' },
    );

    visibleObserver.observe(root);
  } else {
    start();
  }

  window.addEventListener('pagehide', stop, { once: true });

  return stop;
}

export function initAllLetterGlitches(): void {
  document.querySelectorAll(ROOT_SELECTOR).forEach((root: Element) => {
    initLetterGlitch(root);
  });
}

function scheduleInit(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const hasDesktopPointer = window.matchMedia ? window.matchMedia(MEDIA_QUERY).matches : true;
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (!hasDesktopPointer || prefersReducedMotion) return;

  initAllLetterGlitches();
}

if (typeof window !== 'undefined') {
  (window as Window & { __letterGlitchRuntimeLoaded?: boolean }).__letterGlitchRuntimeLoaded = true;
  scheduleInit();
  document.addEventListener('astro:page-load', scheduleInit);
}
