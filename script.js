const COUNT = 5;

let currentMode = 'random';

const state = Array.from({ length: COUNT }, () => ({
  color: randomHex(),
  locked: false,
}));

// SVG icons — fill="currentColor" so JS only needs to set `color` on the parent
const LOCKED_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M18 8h-1V6C17 3.24 14.76 1 12 1S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`;
const UNLOCKED_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>`;
const COPY_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;

function randomHex() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const sl = s / 100, ll = l / 100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = ll - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function randomBaseHsl() {
  return [Math.random() * 360, 45 + Math.random() * 40, 35 + Math.random() * 30];
}

function expandHex(hex) {
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

function isValidHex(hex) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
}

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastColor(hex) {
  const L = luminance(hex);
  const onWhite = (1 + 0.05) / (L + 0.05);
  const onBlack = (L + 0.05) / (0 + 0.05);
  return onWhite >= onBlack ? '#ffffff' : '#000000';
}

function generateColors(mode, seedHex) {
  if (mode === 'random') {
    return Array.from({ length: COUNT }, randomHex);
  }

  const [bh, bs, bl] = seedHex ? hexToHsl(expandHex(seedHex)) : randomBaseHsl();

  if (mode === 'complementary') {
    const ch = (bh + 180) % 360;
    return [
      hslToHex(bh, bs, bl),
      hslToHex(bh, bs - 15, bl + 15),
      hslToHex(bh, bs + 10, bl - 12),
      hslToHex(ch, bs, bl),
      hslToHex(ch, bs - 10, bl + 14),
    ];
  }

  if (mode === 'analogous') {
    return [
      hslToHex(bh - 30, bs, bl - 8),
      hslToHex(bh - 15, bs + 5, bl + 5),
      hslToHex(bh,      bs, bl),
      hslToHex(bh + 15, bs + 5, bl + 5),
      hslToHex(bh + 30, bs, bl - 8),
    ];
  }

  if (mode === 'triadic') {
    const h2 = (bh + 120) % 360;
    const h3 = (bh + 240) % 360;
    return [
      hslToHex(bh, bs, bl),
      hslToHex(bh, bs - 10, bl + 12),
      hslToHex(h2, bs, bl),
      hslToHex(h3, bs, bl),
      hslToHex(h3, bs - 10, bl + 12),
    ];
  }
}

function generate() {
  // If swatch 0 is locked, use it as the seed and respect the active mode.
  // Otherwise, generate all swatches randomly regardless of mode.
  const seed = state[0].locked ? state[0].color : null;
  const effectiveMode = seed ? currentMode : 'random';

  const unlocked = state.map((s, i) => s.locked ? null : i).filter(i => i !== null);
  if (unlocked.length === 0) return render();

  const colors = generateColors(effectiveMode, seed);
  // When a seed is locked, colors[0] is the seed base — skip it since swatch 0 already shows it
  const offset = seed ? 1 : 0;
  unlocked.forEach((stateIndex, colorIndex) => {
    state[stateIndex].color = colors[(colorIndex + offset) % colors.length];
  });
  render();
}

function toggleLock(index) {
  state[index].locked = !state[index].locked;
  render();
}

async function copyHex(hex, toastEl) {
  try {
    await navigator.clipboard.writeText(hex);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = hex;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 1200);
}

function render() {
  const container = document.getElementById('swatches');
  container.innerHTML = '';

  state.forEach((s, i) => {
    const fg = contrastColor(s.color);

    const swatch = document.createElement('div');
    swatch.className = 'swatch' + (s.locked ? ' locked' : '');
    swatch.style.background = s.color;

    // Lock button (shared by all swatches)
    const lockBtn = document.createElement('button');
    lockBtn.className = 'lock-btn';
    lockBtn.style.color = fg;
    lockBtn.setAttribute('aria-label', s.locked ? 'Unlock this color' : 'Lock this color');
    lockBtn.setAttribute('title', s.locked ? 'Click to unlock' : 'Click to lock');
    lockBtn.innerHTML = s.locked ? LOCKED_SVG : UNLOCKED_SVG;
    lockBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleLock(i);
    });

    // Copy button + toast (shared by all swatches)
    const toast = document.createElement('div');
    toast.className = 'copied-toast';
    toast.textContent = 'Copied!';
    toast.style.color = fg;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.style.color = fg;
    copyBtn.setAttribute('aria-label', 'Copy hex code');
    copyBtn.setAttribute('title', 'Copy hex code');
    copyBtn.innerHTML = COPY_SVG;
    copyBtn.addEventListener('click', e => {
      e.stopPropagation();
      copyHex(s.color.toUpperCase(), toast);
    });

    if (i === 0) {
      // ── Seed swatch ──────────────────────────────────────────────
      swatch.classList.add('seed-swatch');

      const seedLabel = document.createElement('div');
      seedLabel.className = 'seed-label';
      seedLabel.textContent = 'Custom';
      seedLabel.style.color = fg;

      const inputRow = document.createElement('div');
      inputRow.className = 'seed-input-row';

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.className = 'seed-color-picker';
      // color input requires a full 6-char hex
      picker.value = /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : expandHex(s.color);
      picker.setAttribute('aria-label', 'Pick custom color');

      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'seed-hex-input';
      hexInput.value = s.color.toUpperCase();
      hexInput.maxLength = 7;
      hexInput.placeholder = '#RRGGBB';
      hexInput.spellcheck = false;
      hexInput.autocomplete = 'off';
      hexInput.style.color = fg;

      inputRow.appendChild(picker);
      inputRow.appendChild(hexInput);

      // Updates all fg-dependent elements without a full re-render
      function applyFg(newFg) {
        seedLabel.style.color = newFg;
        hexInput.style.color = newFg;
        lockBtn.style.color = newFg;
        copyBtn.style.color = newFg;
        toast.style.color = newFg;
      }

      // Locks swatch 0 in-place (updates DOM without calling render())
      function autoLock() {
        if (state[0].locked) return;
        state[0].locked = true;
        swatch.classList.add('locked');
        lockBtn.setAttribute('aria-label', 'Unlock custom color');
        lockBtn.setAttribute('title', 'Click to unlock');
        lockBtn.innerHTML = LOCKED_SVG;
      }

      picker.addEventListener('click', e => e.stopPropagation());
      picker.addEventListener('input', () => {
        const hex = picker.value;
        state[0].color = hex;
        autoLock();
        swatch.style.background = hex;
        hexInput.value = hex.toUpperCase();
        applyFg(contrastColor(hex));
      });

      hexInput.addEventListener('click', e => e.stopPropagation());
      hexInput.addEventListener('input', () => {
        const raw = hexInput.value.trim();
        const hex = raw.startsWith('#') ? raw : '#' + raw;
        if (!isValidHex(hex)) return;
        const full = expandHex(hex);
        state[0].color = full;
        picker.value = full;
        autoLock();
        swatch.style.background = full;
        applyFg(contrastColor(full));
      });

      swatch.appendChild(lockBtn);
      swatch.appendChild(seedLabel);
      swatch.appendChild(inputRow);
      swatch.appendChild(copyBtn);
      swatch.appendChild(toast);
    } else {
      // ── Normal swatch ─────────────────────────────────────────────
      swatch.addEventListener('click', () => toggleLock(i));

      const hexEl = document.createElement('div');
      hexEl.className = 'hex-code';
      hexEl.textContent = s.color.toUpperCase();
      hexEl.style.color = fg;

      swatch.appendChild(lockBtn);
      swatch.appendChild(hexEl);
      swatch.appendChild(copyBtn);
      swatch.appendChild(toast);
    }

    container.appendChild(swatch);
  });
}

document.getElementById('generate-btn').addEventListener('click', generate);

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    generate();
  });
});

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    generate();
  }
});

render();
