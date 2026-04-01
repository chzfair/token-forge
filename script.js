const COUNT = 5;

const state = Array.from({ length: COUNT }, () => ({
  color: randomHex(),
  locked: false,
}));

function randomHex() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
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

function generate() {
  state.forEach(s => {
    if (!s.locked) s.color = randomHex();
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
    const swatch = document.createElement('div');
    swatch.className = 'swatch' + (s.locked ? ' locked' : '');
    swatch.style.background = s.color;

    swatch.addEventListener('click', () => toggleLock(i));

    const fg = contrastColor(s.color);

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lock-btn';
    lockBtn.setAttribute('aria-label', s.locked ? 'Unlock this color' : 'Lock this color');
    lockBtn.setAttribute('title', s.locked ? 'Click to unlock' : 'Click to lock');
    lockBtn.innerHTML = s.locked
      ? `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
           <path fill="${fg}" d="M18 8h-1V6C17 3.24 14.76 1 12 1S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
           <path fill="${fg}" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
         </svg>`;
    lockBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleLock(i);
    });

    const hexEl = document.createElement('div');
    hexEl.className = 'hex-code';
    hexEl.textContent = s.color.toUpperCase();
    hexEl.style.color = fg;

    const toast = document.createElement('div');
    toast.className = 'copied-toast';
    toast.textContent = 'Copied!';
    toast.style.color = fg;

    hexEl.addEventListener('click', e => {
      e.stopPropagation();
      copyHex(s.color.toUpperCase(), toast);
    });

    swatch.appendChild(lockBtn);
    swatch.appendChild(hexEl);
    swatch.appendChild(toast);
    container.appendChild(swatch);
  });
}

document.getElementById('generate-btn').addEventListener('click', generate);

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    generate();
  }
});

render();
