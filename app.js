// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'tokenforge_brands';
const STEPS = ['Basics', 'Colors', 'Typography', 'Style'];
const PERSONALITY_TAGS = ['Bold', 'Minimal', 'Playful', 'Corporate', 'Warm', 'Edgy', 'Elegant', 'Friendly'];

// ============================================================
// State
// ============================================================

let wizardStep = 0;

let brandData = {
  name: '',
  logo: null,           // { url: string, name: string } | null
  personality: [],      // string[]
  primaryColor: '#171717',
  secondaryColor: '#f5f5f5',
  additionalColors: [], // { id: number, value: string }[]
  background: 'light',
  primaryFont: '',
  secondaryFont: '',
  typeScale: 'balanced',    // 'compact' | 'balanced' | 'generous'
  cornerRadius: 'slightly-rounded', // 'sharp' | 'slightly-rounded' | 'very-rounded'
  density: 'comfortable',   // 'tight' | 'comfortable' | 'spacious'
  additionalNotes: '',
};

let colorIdCounter = 0;
let currentTokens = null;
let wizardReturnScreen = 'home';
let brandLoadedFromSaved = false;
let pendingDeleteId = null;

// ============================================================
// LocalStorage helpers
// ============================================================

function loadBrands() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBrands(brands) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
}

// ============================================================
// Wizard lifecycle
// ============================================================

function openWizard() {
  brandLoadedFromSaved = false;
  wizardReturnScreen = 'home';
  showScreen('wizard');
  wizardStep = 0;
  brandData = {
    name: '',
    logo: null,
    personality: [],
    primaryColor: '#171717',
    secondaryColor: '#f5f5f5',
    additionalColors: [],
    background: 'light',
    primaryFont: '',
    secondaryFont: '',
    typeScale: 'balanced',
    cornerRadius: 'slightly-rounded',
    density: 'comfortable',
    additionalNotes: '',
  };
  colorIdCounter = 0;

  const overlay = document.getElementById('wizardOverlay');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  renderProgress();
  renderStep();
  updateFooter();
}

function closeWizard() {
  const overlay = document.getElementById('wizardOverlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ============================================================
// Progress indicator
// ============================================================

function renderProgress() {
  const container = document.getElementById('wizardProgress');

  container.innerHTML = STEPS.map((label, i) => {
    const isCompleted = i < wizardStep;
    const isActive = i === wizardStep;
    const cls = isCompleted ? 'completed' : isActive ? 'active' : '';

    const connector = i < STEPS.length - 1
      ? `<div class="progress-connector ${isCompleted ? 'filled' : ''}"></div>`
      : '';

    return `
      <div class="progress-step ${cls}">
        <div class="progress-step-inner">
          <div class="progress-bubble">
            <span class="step-num">${i + 1}</span>
            <svg class="check-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="progress-label">${label}</span>
        </div>
      </div>
      ${connector}
    `;
  }).join('');
}

// ============================================================
// Footer state
// ============================================================

function updateFooter() {
  const btnBack = document.getElementById('btnBack');
  const btnNext = document.getElementById('btnNext');
  const counter = document.getElementById('stepCounter');

  btnBack.disabled = wizardStep === 0;
  counter.textContent = `Step ${wizardStep + 1} of ${STEPS.length}`;

  const isLast = wizardStep === STEPS.length - 1;
  btnNext.hidden = false;
  btnNext.innerHTML = isLast
    ? `Review Tokens <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M7 2L12 7L7 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `Next <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M7 2L12 7L7 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  validateCurrentStep();
}

function validateCurrentStep() {
  const btnNext = document.getElementById('btnNext');
  if (wizardStep === 0) {
    btnNext.disabled = brandData.name.trim() === '';
  } else {
    btnNext.disabled = false;
  }
}

// ============================================================
// Step rendering
// ============================================================

function renderStep(direction = 'none') {
  const body = document.getElementById('wizardBody');

  if (direction !== 'none') {
    body.classList.add('fade-out');
    setTimeout(() => {
      body.classList.remove('fade-out');
      body.innerHTML = getStepHTML(wizardStep);
      body.classList.add('fade-in');
      bindStepEvents(wizardStep);
      setTimeout(() => body.classList.remove('fade-in'), 150);
    }, 100);
  } else {
    body.innerHTML = getStepHTML(wizardStep);
    bindStepEvents(wizardStep);
  }
}

function getStepHTML(step) {
  switch (step) {
    case 0: return step1HTML();
    case 1: return step2HTML();
    case 2: return step3HTML();
    case 3: return step4HTML();
    default: return '';
  }
}

// ============================================================
// Step 1 — Basics
// ============================================================

function step1HTML() {
  const name = escapeAttr(brandData.name);
  const logoPreviewVisible = brandData.logo ? 'visible' : '';
  const logoPreviewSrc = brandData.logo ? escapeAttr(brandData.logo.url) : '';
  const logoPreviewName = brandData.logo ? escapeHtml(brandData.logo.name) : '';

  const tags = PERSONALITY_TAGS.map(tag => {
    const selected = brandData.personality.includes(tag) ? 'selected' : '';
    return `<button type="button" class="tag ${selected}" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`;
  }).join('');

  return `
    <h2 class="step-title">Brand Basics</h2>
    <p class="step-subtitle">Start with the fundamentals of your brand identity.</p>

    <div class="field">
      <label class="field-label" for="brandName">
        Brand name <span class="required">*</span>
      </label>
      <input
        id="brandName"
        type="text"
        class="input-text"
        placeholder="e.g. Acme Co."
        value="${name}"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <div class="field">
      <span class="field-label">Logo <span style="font-weight:400;color:var(--text-tertiary)">(optional)</span></span>
      <div class="logo-upload-area">
        <button type="button" class="btn-upload" id="logoUploadBtn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V10M3 5L7 1L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 11H13V13H1V11Z" fill="currentColor" opacity="0.25"/>
            <path d="M1 12H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Upload logo
        </button>
        <input type="file" id="logoFileInput" accept="image/*" style="display:none" />
        <div class="logo-preview ${logoPreviewVisible}" id="logoPreview">
          <img class="logo-preview-img" id="logoPreviewImg" src="${logoPreviewSrc}" alt="Logo preview" />
          <span class="logo-preview-name" id="logoPreviewName">${logoPreviewName}</span>
          <button type="button" class="btn-remove-logo" id="logoRemoveBtn">Remove</button>
        </div>
      </div>
    </div>

    <div class="field">
      <span class="field-label">Brand personality</span>
      <p class="field-hint">Select all that apply</p>
      <div class="tag-picker" id="tagPicker">
        ${tags}
      </div>
    </div>
  `;
}

function bindStep1() {
  // Brand name
  const nameInput = document.getElementById('brandName');
  nameInput.addEventListener('input', () => {
    brandData.name = nameInput.value;
    validateCurrentStep();
  });
  // Focus at end of existing value
  nameInput.focus();
  nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);

  // Logo upload
  const uploadBtn = document.getElementById('logoUploadBtn');
  const fileInput = document.getElementById('logoFileInput');
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleLogoChange);

  const removeBtn = document.getElementById('logoRemoveBtn');
  removeBtn.addEventListener('click', removeLogo);

  // Tag picker
  document.getElementById('tagPicker').addEventListener('click', e => {
    const tag = e.target.closest('.tag');
    if (!tag) return;
    const value = tag.dataset.tag;
    const idx = brandData.personality.indexOf(value);
    if (idx === -1) {
      brandData.personality.push(value);
      tag.classList.add('selected');
    } else {
      brandData.personality.splice(idx, 1);
      tag.classList.remove('selected');
    }
  });
}

// Logo handlers
function handleLogoChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    brandData.logo = { url: ev.target.result, name: file.name };
    const preview = document.getElementById('logoPreview');
    const img = document.getElementById('logoPreviewImg');
    const nameEl = document.getElementById('logoPreviewName');
    img.src = ev.target.result;
    nameEl.textContent = file.name;
    preview.classList.add('visible');
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  brandData.logo = null;
  document.getElementById('logoPreview').classList.remove('visible');
  document.getElementById('logoFileInput').value = '';
}

// ============================================================
// Step 2 — Colors
// ============================================================

function step2HTML() {
  const addlRows = brandData.additionalColors.map(c => additionalColorRowHTML(c)).join('');

  return `
    <h2 class="step-title">Brand Colors</h2>
    <p class="step-subtitle">Define the color palette that represents your brand.</p>

    <div class="field">
      <span class="field-label">Primary color</span>
      <div class="color-rows" id="primaryColorRow">
        ${colorRowHTML('primary', 'Primary', brandData.primaryColor)}
      </div>
    </div>

    <div class="field">
      <span class="field-label">Secondary color</span>
      <div class="color-rows" id="secondaryColorRow">
        ${colorRowHTML('secondary', 'Secondary', brandData.secondaryColor)}
      </div>
    </div>

    <div class="field">
      <span class="field-label">Additional colors</span>
      <div class="color-rows" id="additionalColorRows">
        ${addlRows}
      </div>
      <button type="button" class="btn-add-color" id="addColorBtn">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1V11M1 6H11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        </svg>
        Add another color
      </button>
    </div>

    <div class="field-divider"></div>

    <div class="field">
      <span class="field-label">Background preference</span>
      <div class="bg-toggle" id="bgToggle">
        <button type="button" class="bg-toggle-option ${brandData.background === 'light' ? 'active' : ''}" data-bg="light">Light</button>
        <button type="button" class="bg-toggle-option ${brandData.background === 'dark' ? 'active' : ''}" data-bg="dark">Dark</button>
        <button type="button" class="bg-toggle-option ${brandData.background === 'both' ? 'active' : ''}" data-bg="both">Both</button>
      </div>
    </div>
  `;
}

function colorRowHTML(id, _label, value) {
  const safe = escapeAttr(value);
  const hex6 = value.replace('#', '');
  return `
    <div class="color-row" data-color-id="${id}">
      <div class="color-native-wrap">
        <input type="color" class="color-native" data-color-id="${id}" value="${safe}" />
        <div class="color-swatch" style="background:${safe}"></div>
      </div>
      <div class="color-text-wrap">
        <span class="color-hash">#</span>
        <input type="text" class="color-text" data-color-id="${id}" value="${hex6}" maxlength="7" spellcheck="false" autocomplete="off" />
      </div>
    </div>
  `;
}

function additionalColorRowHTML(colorObj) {
  const { id, value } = colorObj;
  const safe = escapeAttr(value);
  const hex6 = value.replace('#', '');
  return `
    <div class="color-row" data-color-id="${id}">
      <div class="color-native-wrap">
        <input type="color" class="color-native" data-color-id="${id}" value="${safe}" />
        <div class="color-swatch" style="background:${safe}"></div>
      </div>
      <div class="color-text-wrap">
        <span class="color-hash">#</span>
        <input type="text" class="color-text" data-color-id="${id}" value="${hex6}" maxlength="7" spellcheck="false" autocomplete="off" />
      </div>
      <button type="button" class="btn-remove-color" data-remove-id="${id}" aria-label="Remove color">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `;
}

function bindStep2() {
  // Primary color
  bindColorRow('primary', val => { brandData.primaryColor = val; });
  // Secondary color
  bindColorRow('secondary', val => { brandData.secondaryColor = val; });

  // Additional color events (delegated)
  document.getElementById('additionalColorRows').addEventListener('input', e => {
    const el = e.target;
    const id = Number(el.dataset.colorId);
    if (!id) return;
    const obj = brandData.additionalColors.find(c => c.id === id);
    if (!obj) return;

    if (el.classList.contains('color-native')) {
      obj.value = el.value;
      syncSwatchFromNative(el);
      syncTextFromNative(el);
    } else if (el.classList.contains('color-text')) {
      const hex = parseHexInput(el.value);
      if (hex) {
        obj.value = hex;
        syncNativeFromText(el, hex);
        syncSwatchFromHex(el, hex);
      }
    }
  });

  document.getElementById('additionalColorRows').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-id]');
    if (!btn) return;
    const id = Number(btn.dataset.removeId);
    brandData.additionalColors = brandData.additionalColors.filter(c => c.id !== id);
    rerenderAdditionalColors();
  });

  document.getElementById('addColorBtn').addEventListener('click', () => {
    colorIdCounter++;
    brandData.additionalColors.push({ id: colorIdCounter, value: '#e5e5e5' });
    rerenderAdditionalColors();
  });

  // Background toggle
  document.getElementById('bgToggle').addEventListener('click', e => {
    const btn = e.target.closest('[data-bg]');
    if (!btn) return;
    brandData.background = btn.dataset.bg;
    document.querySelectorAll('.bg-toggle-option').forEach(b => {
      b.classList.toggle('active', b.dataset.bg === brandData.background);
    });
  });
}

function bindColorRow(id, onUpdate) {
  const nativeEl = document.querySelector(`.color-native[data-color-id="${id}"]`);
  const textEl = document.querySelector(`.color-text[data-color-id="${id}"]`);

  if (!nativeEl || !textEl) return;

  nativeEl.addEventListener('input', () => {
    const hex = nativeEl.value;
    onUpdate(hex);
    syncSwatchFromNative(nativeEl);
    syncTextFromNative(nativeEl);
  });

  textEl.addEventListener('input', () => {
    const hex = parseHexInput(textEl.value);
    if (hex) {
      onUpdate(hex);
      syncNativeFromText(textEl, hex);
      syncSwatchFromHex(textEl, hex);
    }
  });
}

function rerenderAdditionalColors() {
  const container = document.getElementById('additionalColorRows');
  container.innerHTML = brandData.additionalColors.map(c => additionalColorRowHTML(c)).join('');
}

// Color sync helpers
function syncSwatchFromNative(nativeEl) {
  const row = nativeEl.closest('.color-row');
  const swatch = row.querySelector('.color-swatch');
  swatch.style.background = nativeEl.value;
}

function syncTextFromNative(nativeEl) {
  const row = nativeEl.closest('.color-row');
  const textEl = row.querySelector('.color-text');
  textEl.value = nativeEl.value.replace('#', '');
}

function syncNativeFromText(textEl, hex) {
  const row = textEl.closest('.color-row');
  const nativeEl = row.querySelector('.color-native');
  nativeEl.value = hex;
}

function syncSwatchFromHex(textEl, hex) {
  const row = textEl.closest('.color-row');
  const swatch = row.querySelector('.color-swatch');
  swatch.style.background = hex;
}

function parseHexInput(raw) {
  const clean = raw.replace('#', '').trim();
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return `#${clean}`;
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const [r, g, b] = clean;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

// ============================================================
// Step 3 — Typography
// ============================================================

function step3HTML() {
  const pf = escapeAttr(brandData.primaryFont);
  const sf = escapeAttr(brandData.secondaryFont);

  const scaleOptions = [
    {
      value: 'compact',
      title: 'Compact',
      desc: 'Smaller sizes, tighter line heights',
      preview: `<div class="scale-preview scale-compact">
        <div class="scale-bar" style="width:55%;height:8px"></div>
        <div class="scale-bar" style="width:80%;height:6px;margin-top:5px"></div>
        <div class="scale-bar" style="width:65%;height:5px;margin-top:4px"></div>
        <div class="scale-bar" style="width:70%;height:5px;margin-top:4px"></div>
      </div>`,
    },
    {
      value: 'balanced',
      title: 'Balanced',
      desc: 'Default shadcn scale',
      preview: `<div class="scale-preview scale-balanced">
        <div class="scale-bar" style="width:55%;height:10px"></div>
        <div class="scale-bar" style="width:80%;height:7px;margin-top:8px"></div>
        <div class="scale-bar" style="width:65%;height:6px;margin-top:6px"></div>
        <div class="scale-bar" style="width:70%;height:6px;margin-top:6px"></div>
      </div>`,
    },
    {
      value: 'generous',
      title: 'Generous',
      desc: 'Larger sizes, more breathing room',
      preview: `<div class="scale-preview scale-generous">
        <div class="scale-bar" style="width:55%;height:13px"></div>
        <div class="scale-bar" style="width:80%;height:8px;margin-top:12px"></div>
        <div class="scale-bar" style="width:65%;height:7px;margin-top:9px"></div>
        <div class="scale-bar" style="width:70%;height:7px;margin-top:9px"></div>
      </div>`,
    },
  ];

  return `
    <h2 class="step-title">Typography</h2>
    <p class="step-subtitle">Choose the typefaces and scale that define your brand's voice.</p>

    <div class="field">
      <label class="field-label" for="primaryFont">Primary font</label>
      <input
        id="primaryFont"
        type="text"
        class="input-text"
        placeholder="e.g. Inter, Geist, Poppins"
        value="${pf}"
        autocomplete="off"
        spellcheck="false"
      />
      <a class="font-link" href="https://fonts.google.com" target="_blank" rel="noopener noreferrer">
        Browse Google Fonts ↗
      </a>
    </div>

    <div class="field">
      <label class="field-label" for="secondaryFont">Secondary font</label>
      <input
        id="secondaryFont"
        type="text"
        class="input-text"
        placeholder="e.g. Merriweather, Georgia — leave blank to use primary font for all"
        value="${sf}"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <div class="field-divider"></div>

    <div class="field">
      <span class="field-label">Type scale feel</span>
      ${optionCardsHTML('typeScale', scaleOptions, brandData.typeScale)}
    </div>
  `;
}

function bindStep3() {
  document.getElementById('primaryFont').addEventListener('input', e => {
    brandData.primaryFont = e.target.value;
  });
  document.getElementById('secondaryFont').addEventListener('input', e => {
    brandData.secondaryFont = e.target.value;
  });
  bindOptionCards('typeScale', val => { brandData.typeScale = val; });
}

// ============================================================
// Step 4 — Style & Feel
// ============================================================

function step4HTML() {
  const radiusOptions = [
    {
      value: 'sharp',
      title: 'Sharp',
      desc: '0.125rem — nearly square corners',
      preview: `<div class="radius-preview-wrap"><div class="radius-rect" style="border-radius:2px"></div></div>`,
    },
    {
      value: 'slightly-rounded',
      title: 'Slightly Rounded',
      desc: '0.5rem — subtle rounding',
      preview: `<div class="radius-preview-wrap"><div class="radius-rect" style="border-radius:8px"></div></div>`,
    },
    {
      value: 'very-rounded',
      title: 'Very Rounded',
      desc: '1rem — soft, friendly corners',
      preview: `<div class="radius-preview-wrap"><div class="radius-rect" style="border-radius:16px"></div></div>`,
    },
  ];

  const densityOptions = [
    {
      value: 'tight',
      title: 'Tight',
      desc: 'Compact padding, smaller gaps — more content visible at once',
      preview: `<div class="density-preview">
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:55%"></div></div>
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:70%"></div></div>
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:45%"></div></div>
      </div>`,
    },
    {
      value: 'comfortable',
      title: 'Comfortable',
      desc: 'Default shadcn spacing — balanced and readable',
      preview: `<div class="density-preview" style="gap:7px">
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:55%"></div></div>
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:70%"></div></div>
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:45%"></div></div>
      </div>`,
    },
    {
      value: 'spacious',
      title: 'Spacious',
      desc: 'Generous padding, larger gaps — open and airy feel',
      preview: `<div class="density-preview" style="gap:11px">
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:55%"></div></div>
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:70%"></div></div>
        <div class="density-row" style="gap:4px"><div class="density-dot"></div><div class="density-line" style="width:45%"></div></div>
      </div>`,
    },
  ];

  const notes = escapeHtml(brandData.additionalNotes);

  return `
    <h2 class="step-title">Style & Feel</h2>
    <p class="step-subtitle">Fine-tune the visual character of your design system.</p>

    <div class="field">
      <span class="field-label">Corner radius</span>
      ${optionCardsHTML('cornerRadius', radiusOptions, brandData.cornerRadius)}
    </div>

    <div class="field-divider"></div>

    <div class="field">
      <span class="field-label">Density</span>
      ${optionCardsHTML('density', densityOptions, brandData.density)}
    </div>

    <div class="field-divider"></div>

    <div class="field">
      <label class="field-label" for="additionalNotes">Additional notes</label>
      <textarea
        id="additionalNotes"
        class="input-textarea"
        placeholder="Any other brand details, color names, usage rules, or preferences"
        rows="4"
        spellcheck="true"
      >${notes}</textarea>
    </div>

  `;
}

function bindStep4() {
  bindOptionCards('cornerRadius', val => { brandData.cornerRadius = val; });
  bindOptionCards('density', val => { brandData.density = val; });

  document.getElementById('additionalNotes').addEventListener('input', e => {
    brandData.additionalNotes = e.target.value;
  });

}

// ============================================================
// Option card helpers
// ============================================================

function optionCardsHTML(groupName, options, currentValue) {
  const cards = options.map(opt => `
    <button type="button" class="option-card ${currentValue === opt.value ? 'selected' : ''}" data-option-value="${escapeAttr(opt.value)}">
      <div class="option-card-preview">${opt.preview}</div>
      <div class="option-card-title">${escapeHtml(opt.title)}</div>
      <div class="option-card-desc">${escapeHtml(opt.desc)}</div>
    </button>
  `).join('');
  return `<div class="option-cards" data-option-group="${escapeAttr(groupName)}">${cards}</div>`;
}

function bindOptionCards(groupName, onSelect) {
  const group = document.querySelector(`[data-option-group="${groupName}"]`);
  if (!group) return;
  group.addEventListener('click', e => {
    const card = e.target.closest('.option-card');
    if (!card) return;
    const value = card.dataset.optionValue;
    onSelect(value);
    group.querySelectorAll('.option-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.optionValue === value);
    });
  });
}

// ============================================================
// WCAG 2.1 contrast utilities
// ============================================================

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

function linearize(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function ensureContrast(hex, background, minRatio) {
  if (getContrastRatio(hex, background) >= minRatio) return hex;
  const bgLum = relativeLuminance(background);
  const { h, s, l } = hexToHsl(hex);
  // Prefer darkening on light backgrounds, lightening on dark backgrounds
  const preferDarken = bgLum > 0.5;

  let currL = l;
  for (let i = 0; i < 101; i++) {
    currL = preferDarken ? Math.max(0, currL - 1) : Math.min(100, currL + 1);
    if (getContrastRatio(hslToHex(h, s, currL), background) >= minRatio) return hslToHex(h, s, currL);
    if (currL <= 0 || currL >= 100) break;
  }

  // Fallback: try the other direction
  currL = l;
  for (let i = 0; i < 101; i++) {
    currL = preferDarken ? Math.min(100, currL + 1) : Math.max(0, currL - 1);
    if (getContrastRatio(hslToHex(h, s, currL), background) >= minRatio) return hslToHex(h, s, currL);
    if (currL <= 0 || currL >= 100) break;
  }

  return preferDarken ? '#000000' : '#ffffff';
}

// ============================================================
// Export — token generation, highlighting, download
// ============================================================

function buildTokenStudioJSON() {
  const t      = currentTokens;
  const isDark = t.colors.pageBg === '#0a0a0a';
  const fg      = isDark ? '#f5f5f5' : '#171717';
  const borderC = isDark ? '#27272a' : '#e4e4e7';
  const mutedFg = isDark ? '#a1a1aa' : '#71717a';

  // ── Border radius (sm = ×0.5, md = base, lg = ×1.5, full = 9999px) ──
  const rBase = t.style.cornerRadius;         // e.g. "0.5rem"
  const rNum  = parseFloat(rBase);
  const rUnit = rBase.includes('rem') ? 'rem' : 'px';
  const rFmt  = v => `${+(v.toFixed(4))}${rUnit}`;

  // ── Font sizes keyed by typeScale ──
  const fSizeMap = {
    compact:  { h1: '28px', h2: '22px', h3: '18px', h4: '15px', body: '13px', small: '11px' },
    balanced: { h1: '36px', h2: '28px', h3: '20px', h4: '16px', body: '15px', small: '13px' },
    generous: { h1: '48px', h2: '36px', h3: '24px', h4: '18px', body: '16px', small: '14px' },
  };
  const fSize = fSizeMap[t.typography.typeScale] || fSizeMap.balanced;

  // ── Spacing: 4pt grid (0.25rem per step), spacing[4] = 1rem ──
  const spacing = {};
  for (let i = 1; i <= 12; i++) spacing[i] = { value: `${i * 0.25}rem`, type: 'spacing' };

  // ── Font family tokens ──
  const fontFamilies = {
    sans: { value: t.typography.primaryFont || 'system-ui, sans-serif', type: 'fontFamilies' },
  };
  if (t.typography.primaryFont)   fontFamilies.primary   = { value: t.typography.primaryFont,   type: 'fontFamilies' };
  if (t.typography.secondaryFont) fontFamilies.secondary = { value: t.typography.secondaryFont, type: 'fontFamilies' };

  // ── Additional brand colors ──
  const extraColors = {};
  (t.colors.additional || []).forEach((c, i) => {
    extraColors[`additional-${i + 1}`] = { value: c, type: 'color' };
  });

  const global = {

    colors: {
      primary:                  { value: t.colors.primary,             type: 'color' },
      'primary-foreground':     { value: t.colors.primaryForeground,   type: 'color' },
      secondary:                { value: t.colors.secondary,           type: 'color' },
      'secondary-foreground':   { value: t.colors.secondaryForeground, type: 'color' },
      background:               { value: t.colors.pageBg,              type: 'color' },
      foreground:               { value: fg,                           type: 'color' },
      card:                     { value: t.colors.pageBg,              type: 'color' },
      'card-foreground':        { value: fg,                           type: 'color' },
      muted:                    { value: t.colors.secondary,           type: 'color' },
      'muted-foreground':       { value: mutedFg,                      type: 'color' },
      accent:                   { value: t.colors.primary,             type: 'color' },
      'accent-foreground':      { value: t.colors.primaryForeground,   type: 'color' },
      destructive:              { value: '#ef4444',                    type: 'color' },
      'destructive-foreground': { value: '#ffffff',                    type: 'color' },
      border:                   { value: borderC,                      type: 'color' },
      input:                    { value: borderC,                      type: 'color' },
      ring:                     { value: t.colors.primary,             type: 'color' },
      ...extraColors,
    },

    typography: {
      fontFamily: fontFamilies,
      fontSize: {
        h1:    { value: fSize.h1,    type: 'fontSizes' },
        h2:    { value: fSize.h2,    type: 'fontSizes' },
        h3:    { value: fSize.h3,    type: 'fontSizes' },
        h4:    { value: fSize.h4,    type: 'fontSizes' },
        body:  { value: fSize.body,  type: 'fontSizes' },
        small: { value: fSize.small, type: 'fontSizes' },
      },
      fontWeight: {
        regular:  { value: '400', type: 'fontWeights' },
        medium:   { value: '500', type: 'fontWeights' },
        semibold: { value: '600', type: 'fontWeights' },
        bold:     { value: '700', type: 'fontWeights' },
      },
      lineHeight: {
        tight:   { value: '1.1',  type: 'lineHeights' },
        snug:    { value: '1.3',  type: 'lineHeights' },
        normal:  { value: '1.5',  type: 'lineHeights' },
        relaxed: { value: '1.65', type: 'lineHeights' },
      },
    },

    borderRadius: {
      sm:   { value: rFmt(rNum * 0.5), type: 'borderRadius' },
      md:   { value: rBase,            type: 'borderRadius' },
      lg:   { value: rFmt(rNum * 1.5), type: 'borderRadius' },
      full: { value: '9999px',         type: 'borderRadius' },
    },

    spacing,

    shadow: {
      default: {
        value: { x: '0', y: '4px', blur: '12px', spread: '0', color: 'rgba(0,0,0,0.08)', type: 'dropShadow' },
        type: 'boxShadow',
      },
      lg: {
        value: { x: '0', y: '8px', blur: '24px', spread: '0', color: 'rgba(0,0,0,0.12)', type: 'dropShadow' },
        type: 'boxShadow',
      },
    },

    components: {
      button: {
        default: {
          paddingX:     { value: '{spacing.4}',                    type: 'spacing' },
          paddingY:     { value: '{spacing.2}',                    type: 'spacing' },
          fontSize:     { value: '{typography.fontSize.body}',     type: 'fontSizes' },
          fontWeight:   { value: '{typography.fontWeight.medium}', type: 'fontWeights' },
          borderRadius: { value: '{borderRadius.md}',              type: 'borderRadius' },
          height:       { value: '2.5rem',                         type: 'sizing' },
        },
        sm: {
          paddingX:     { value: '{spacing.3}',                    type: 'spacing' },
          paddingY:     { value: '{spacing.1}',                    type: 'spacing' },
          fontSize:     { value: '{typography.fontSize.small}',    type: 'fontSizes' },
          fontWeight:   { value: '{typography.fontWeight.medium}', type: 'fontWeights' },
          borderRadius: { value: '{borderRadius.sm}',              type: 'borderRadius' },
          height:       { value: '2rem',                           type: 'sizing' },
        },
        lg: {
          paddingX:     { value: '{spacing.6}',                    type: 'spacing' },
          paddingY:     { value: '{spacing.3}',                    type: 'spacing' },
          fontSize:     { value: '{typography.fontSize.h4}',       type: 'fontSizes' },
          fontWeight:   { value: '{typography.fontWeight.medium}', type: 'fontWeights' },
          borderRadius: { value: '{borderRadius.md}',              type: 'borderRadius' },
          height:       { value: '2.75rem',                        type: 'sizing' },
        },
      },
      badge: {
        paddingX:     { value: '{spacing.3}',                   type: 'spacing' },
        paddingY:     { value: '0.125rem',                      type: 'spacing' },
        fontSize:     { value: '{typography.fontSize.small}',   type: 'fontSizes' },
        borderRadius: { value: '{borderRadius.full}',           type: 'borderRadius' },
      },
      input: {
        height:       { value: '2.5rem',                        type: 'sizing' },
        paddingX:     { value: '{spacing.3}',                   type: 'spacing' },
        paddingY:     { value: '{spacing.2}',                   type: 'spacing' },
        borderRadius: { value: '{borderRadius.md}',             type: 'borderRadius' },
        borderWidth:  { value: '1px',                           type: 'borderWidths' },
        fontSize:     { value: '{typography.fontSize.body}',    type: 'fontSizes' },
      },
      card: {
        padding:      { value: '{spacing.6}',                   type: 'spacing' },
        borderRadius: { value: '{borderRadius.lg}',             type: 'borderRadius' },
        shadow:       { value: '{shadow.default}',              type: 'boxShadow' },
      },
    },
  };

  return JSON.stringify({ global }, null, 2);
}

function buildShadcnCSS() {
  const t = currentTokens;
  const isDark = t.colors.pageBg === '#0a0a0a';
  const fg      = isDark ? '#f5f5f5' : '#171717';
  const border  = isDark ? '#27272a' : '#e4e4e7';
  const mutedFg = isDark ? '#a1a1aa' : '#71717a';

  const lines = [':root {'];
  const add = (prop, val) => lines.push(`  ${prop}: ${val};`);

  add('--background',           t.colors.pageBg);
  add('--foreground',           fg);
  add('--primary',              t.colors.primary);
  add('--primary-foreground',   t.colors.primaryForeground);
  add('--secondary',            t.colors.secondary);
  add('--secondary-foreground', t.colors.secondaryForeground);
  add('--muted',                t.colors.secondary);
  add('--muted-foreground',     mutedFg);
  add('--accent',               t.colors.primary);
  add('--accent-foreground',    t.colors.primaryForeground);
  add('--destructive',          '#ef4444');
  add('--destructive-foreground', '#ffffff');
  add('--border',               border);
  add('--input',                border);
  add('--ring',                 t.colors.primary);
  add('--radius',               t.style.cornerRadius);

  if (t.typography.primaryFont)  add('--font-sans',  t.typography.primaryFont);
  if (t.typography.secondaryFont) add('--font-serif', t.typography.secondaryFont);

  t.colors.additional.forEach((c, i) => add(`--color-${i + 1}`, c));

  lines.push('}');
  return lines.join('\n');
}

function highlightJSON(raw) {
  const s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return s.replace(
    /("(?:[^"\\]|\\.)*")(\s*:)|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/g,
    (match, key, colon, str, kw, num) => {
      if (key !== undefined) return `<span class="hl-key">${key}</span>${colon}`;
      if (str !== undefined) {
        const hex = str.match(/^"(#[0-9a-fA-F]{6})"$/);
        return hex
          ? `<span class="hl-string">"<span class="hl-swatch" style="background:${hex[1]}"></span>${hex[1]}"</span>`
          : `<span class="hl-string">${str}</span>`;
      }
      if (kw  !== undefined) return `<span class="hl-kw">${kw}</span>`;
      if (num !== undefined) return `<span class="hl-num">${num}</span>`;
      return match;
    }
  );
}

function highlightCSS(raw) {
  const s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return s.split('\n').map(line => {
    if (/^\s*:root\s*\{/.test(line))  return line.replace(/(:root)/, '<span class="hl-selector">$1</span>');
    if (/^\s*\}\s*$/.test(line))      return '<span class="hl-selector">}</span>';
    const m = line.match(/^(\s*)(--[\w-]+)(\s*:\s*)([^;]+)(;)$/);
    if (!m) return line;
    const [, indent, prop, sep, val, semi] = m;
    const hex = val.match(/^(#[0-9a-fA-F]{3,8})$/);
    const valHTML = hex
      ? `<span class="hl-val"><span class="hl-swatch" style="background:${hex[1]}"></span>${hex[1]}</span>`
      : `<span class="hl-val">${val}</span>`;
    return `${indent}<span class="hl-prop">${prop}</span>${sep}${valHTML}${semi}`;
  }).join('\n');
}

function formatBytes(n) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

function downloadFile(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Generate Tokens → Review screen
// ============================================================

function buildTokens() {
  const radiusMap = {
    'sharp': '0.125rem',
    'slightly-rounded': '0.5rem',
    'very-rounded': '1rem',
  };
  const spacingMap = {
    'tight': '0.75rem',
    'comfortable': '1rem',
    'spacious': '1.5rem',
  };

  const pageBg = brandData.background === 'dark' ? '#0a0a0a' : '#ffffff';
  const contrastAdjustments = [];

  const checkAndAdjust = (hex, bg, tokenName, label) => {
    const ratio = getContrastRatio(hex, bg);
    if (ratio >= 4.5) return hex;
    const adjusted = ensureContrast(hex, bg, 4.5);
    contrastAdjustments.push({
      token: tokenName,
      original: hex,
      adjusted,
      originalRatio: ratio,
      background: bg,
      reason: `${label} was ${ratio.toFixed(2)}:1 — needed 4.5:1 for WCAG AA`,
    });
    return adjusted;
  };

  // Adjust primary and secondary against page background
  const primary = checkAndAdjust(brandData.primaryColor, pageBg, '--primary', 'Primary color');
  const secondary = checkAndAdjust(brandData.secondaryColor, pageBg, '--secondary', 'Secondary color');

  // Derive foreground colors (text placed on top of primary/secondary)
  const whiteOnPrimary = getContrastRatio('#ffffff', primary);
  const blackOnPrimary = getContrastRatio('#000000', primary);
  const primaryFgBase = whiteOnPrimary >= blackOnPrimary ? '#ffffff' : '#000000';
  const primaryFg = checkAndAdjust(primaryFgBase, primary, '--primary-foreground', 'Primary foreground');

  const whiteOnSecondary = getContrastRatio('#ffffff', secondary);
  const blackOnSecondary = getContrastRatio('#000000', secondary);
  // Always strictly white or black — never a brand color or intermediate shade
  const secondaryFg = blackOnSecondary >= whiteOnSecondary ? '#000000' : '#ffffff';

  return {
    brandName: brandData.name.trim(),
    generatedAt: new Date().toISOString(),
    colors: {
      primary,
      primaryForeground: primaryFg,
      secondary,
      secondaryForeground: secondaryFg,
      additional: brandData.additionalColors.map(c => c.value),
      background: brandData.background,
      pageBg,
    },
    typography: {
      primaryFont: brandData.primaryFont || null,
      secondaryFont: brandData.secondaryFont || null,
      typeScale: brandData.typeScale,
    },
    style: {
      cornerRadius: radiusMap[brandData.cornerRadius] || '0.5rem',
      cornerRadiusPreset: brandData.cornerRadius,
      density: brandData.density,
      spacingBase: spacingMap[brandData.density] || '1rem',
    },
    meta: {
      personality: [...brandData.personality],
      additionalNotes: brandData.additionalNotes,
    },
    contrastAdjustments,
  };
}

function generateTokens() {
  brandLoadedFromSaved = false;
  currentTokens = buildTokens();
  console.log('Token Forge — tokens:', JSON.parse(JSON.stringify(currentTokens)));
  closeWizard();
  showScreen('review');
}

// ============================================================
// CSS var injection
// ============================================================

function injectAllCSSVars() {
  const root = document.documentElement;
  // --foreground: adapts to background preference so type-scale text is never a brand color
  const foreground = currentTokens.colors.pageBg === '#0a0a0a' ? '#f5f5f5' : '#171717';
  root.style.setProperty('--foreground', foreground);
  root.style.setProperty('--brand-primary', currentTokens.colors.primary);
  root.style.setProperty('--brand-primary-fg', currentTokens.colors.primaryForeground);
  root.style.setProperty('--brand-secondary', currentTokens.colors.secondary);
  root.style.setProperty('--brand-secondary-fg', currentTokens.colors.secondaryForeground);

  console.log(
    '[Token Forge]',
    '\n  --foreground:', foreground,
    '\n  --secondary:', currentTokens.colors.secondary,
    '\n  --secondary-foreground:', currentTokens.colors.secondaryForeground
  );
  for (let i = 1; i <= 10; i++) root.style.removeProperty(`--brand-additional-${i}`);
  currentTokens.colors.additional.forEach((c, i) => {
    root.style.setProperty(`--brand-additional-${i + 1}`, c);
  });
  if (currentTokens.typography.primaryFont) {
    root.style.setProperty('--brand-font-primary', currentTokens.typography.primaryFont);
  } else {
    root.style.removeProperty('--brand-font-primary');
  }
  if (currentTokens.typography.secondaryFont) {
    root.style.setProperty('--brand-font-secondary', currentTokens.typography.secondaryFont);
  } else {
    root.style.removeProperty('--brand-font-secondary');
  }
  root.style.setProperty('--brand-radius', currentTokens.style.cornerRadius);
  root.style.setProperty('--brand-spacing-base', currentTokens.style.spacingBase);
}

function setTokenByPath(path, value) {
  const parts = path.split('.');
  let obj = currentTokens;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  obj[parts[parts.length - 1]] = value;
}

// ============================================================
// Review screen rendering
// ============================================================

function tokenSectionHTML(title, bodyHTML, open) {
  return `
    <details class="token-section"${open ? ' open' : ''}>
      <summary class="token-section-summary">
        <span class="token-section-title">${escapeHtml(title)}</span>
        <svg class="token-section-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </summary>
      <div class="token-section-body">${bodyHTML}</div>
    </details>
  `;
}

function colorTokenRowHTML(varName, value, path, contrastInfo) {
  const hex6 = value.replace('#', '');
  const bgAttr = contrastInfo ? ` data-contrast-bg="${escapeAttr(contrastInfo.bgHex)}"` : '';
  const badge = contrastInfo ? contrastBadgeHTML(contrastInfo.ratio) : '';
  return `
    <div class="token-row"${bgAttr}>
      <code class="token-var">${escapeHtml(varName)}</code>
      <div class="token-color-pair">
        <div class="color-native-wrap">
          <input type="color" class="color-native" value="${escapeAttr(value)}" data-var="${escapeAttr(varName)}" data-path="${escapeAttr(path)}">
          <div class="color-swatch" style="background:${escapeAttr(value)}"></div>
        </div>
        <div class="color-text-wrap">
          <span class="color-hash">#</span>
          <input type="text" class="color-text" value="${escapeAttr(hex6)}" maxlength="6" spellcheck="false" autocomplete="off" data-var="${escapeAttr(varName)}" data-path="${escapeAttr(path)}">
        </div>
      </div>
      ${badge}
    </div>
  `;
}

function contrastBadgeHTML(ratio) {
  const r = ratio.toFixed(2);
  let cls, label;
  if (ratio >= 4.5) {
    cls = 'contrast-badge-pass';
    label = `${r}:1 AA`;
  } else if (ratio >= 3) {
    cls = 'contrast-badge-large';
    label = `${r}:1 AA Large`;
  } else {
    cls = 'contrast-badge-fail';
    label = `${r}:1 Fail`;
  }
  const title = ratio >= 4.5 ? 'Passes WCAG AA' : ratio >= 3 ? 'Passes WCAG AA Large text only' : 'Fails WCAG AA and AA Large';
  return `<span class="contrast-badge ${cls}" title="${escapeAttr(title)}">${label}</span>`;
}

function updateRowContrastBadge(row, hex) {
  const bgHex = row.dataset.contrastBg;
  if (!bgHex) return;
  const badge = row.querySelector('.contrast-badge');
  if (!badge) return;
  const ratio = getContrastRatio(hex, bgHex);
  const r = ratio.toFixed(2);
  let cls, label, title;
  if (ratio >= 4.5) {
    cls = 'contrast-badge-pass'; label = `${r}:1 AA`; title = 'Passes WCAG AA';
  } else if (ratio >= 3) {
    cls = 'contrast-badge-large'; label = `${r}:1 AA Large`; title = 'Passes WCAG AA Large text only';
  } else {
    cls = 'contrast-badge-fail'; label = `${r}:1 Fail`; title = 'Fails WCAG AA and AA Large';
  }
  badge.className = `contrast-badge ${cls}`;
  badge.textContent = label;
  badge.title = title;
}

function textTokenRowHTML(varName, value, path, placeholder) {
  return `
    <div class="token-row">
      <code class="token-var">${escapeHtml(varName)}</code>
      <input type="text" class="token-text-input" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder || '')}" data-var="${escapeAttr(varName)}" data-path="${escapeAttr(path)}">
    </div>
  `;
}

function badgeTokenRowHTML(varName, value) {
  return `
    <div class="token-row">
      <code class="token-var">${escapeHtml(varName)}</code>
      <span class="token-badge">${escapeHtml(value)}</span>
    </div>
  `;
}

function buildColorsSectionHTML() {
  const { primary, primaryForeground, secondary, secondaryForeground, additional, pageBg } = currentTokens.colors;
  const rows = [
    colorTokenRowHTML('--brand-primary', primary, 'colors.primary',
      { ratio: getContrastRatio(primary, pageBg), bgHex: pageBg }),
    colorTokenRowHTML('--brand-primary-fg', primaryForeground, 'colors.primaryForeground',
      { ratio: getContrastRatio(primaryForeground, primary), bgHex: primary }),
    colorTokenRowHTML('--brand-secondary', secondary, 'colors.secondary',
      { ratio: getContrastRatio(secondary, pageBg), bgHex: pageBg }),
    colorTokenRowHTML('--brand-secondary-fg', secondaryForeground, 'colors.secondaryForeground',
      { ratio: getContrastRatio(secondaryForeground, secondary), bgHex: secondary }),
    ...additional.map((c, i) =>
      colorTokenRowHTML(`--brand-additional-${i + 1}`, c, `colors.additional.${i}`,
        { ratio: getContrastRatio(c, pageBg), bgHex: pageBg })
    ),
  ];
  return tokenSectionHTML('Colors', rows.join(''), true);
}

function buildTypographySectionHTML() {
  const pf = currentTokens.typography.primaryFont || '';
  const sf = currentTokens.typography.secondaryFont || '';
  const rows = [
    textTokenRowHTML('--brand-font-primary', pf, 'typography.primaryFont', 'e.g. Inter, Geist'),
    textTokenRowHTML('--brand-font-secondary', sf, 'typography.secondaryFont', 'e.g. Merriweather (blank to inherit)'),
    badgeTokenRowHTML('--brand-type-scale', currentTokens.typography.typeScale),
  ];
  return tokenSectionHTML('Typography', rows.join(''), true);
}

function buildSpacingSectionHTML() {
  const rows = [
    textTokenRowHTML('--brand-radius', currentTokens.style.cornerRadius, 'style.cornerRadius', 'e.g. 0.5rem'),
    textTokenRowHTML('--brand-spacing-base', currentTokens.style.spacingBase, 'style.spacingBase', 'e.g. 1rem'),
    badgeTokenRowHTML('--brand-density', currentTokens.style.density),
  ];
  return tokenSectionHTML('Radius & Spacing', rows.join(''), true);
}

function buildOtherSectionHTML() {
  const rows = [
    badgeTokenRowHTML('background', currentTokens.colors.background),
  ];
  if (currentTokens.meta.personality.length > 0) {
    rows.push(`
      <div class="token-row">
        <code class="token-var">personality</code>
        <span class="token-meta-value">${escapeHtml(currentTokens.meta.personality.join(', '))}</span>
      </div>
    `);
  }
  if (currentTokens.meta.additionalNotes) {
    rows.push(`
      <div class="token-row token-row-notes">
        <code class="token-var">notes</code>
        <p class="token-notes">${escapeHtml(currentTokens.meta.additionalNotes)}</p>
      </div>
    `);
  }
  if (rows.length === 1 && !currentTokens.meta.personality.length && !currentTokens.meta.additionalNotes) {
    rows.push(`<p class="token-empty">No additional metadata</p>`);
  }
  return tokenSectionHTML('Other', rows.join(''), false);
}

function buildContrastBannerHTML() {
  const adjustments = currentTokens.contrastAdjustments;
  if (!adjustments || adjustments.length === 0) return '';

  const items = adjustments.map(adj => `
    <li class="contrast-detail-item">
      <code class="contrast-detail-token">${escapeHtml(adj.token)}</code>
      <span class="contrast-detail-change">
        <span class="contrast-detail-swatch" style="background:${escapeAttr(adj.original)}" title="${escapeAttr(adj.original)}"></span>
        <span class="contrast-detail-hex">${escapeHtml(adj.original)}</span>
        <span class="contrast-detail-arrow">→</span>
        <span class="contrast-detail-swatch" style="background:${escapeAttr(adj.adjusted)}" title="${escapeAttr(adj.adjusted)}"></span>
        <span class="contrast-detail-hex">${escapeHtml(adj.adjusted)}</span>
      </span>
      <span class="contrast-detail-reason">${escapeHtml(adj.reason)}</span>
    </li>
  `).join('');

  return `
    <div class="contrast-banner">
      <svg class="contrast-banner-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M8 6.5V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
      </svg>
      <div class="contrast-banner-body">
        <p class="contrast-banner-text">Some brand colors were adjusted to meet WCAG AA accessibility standards</p>
        <details class="contrast-details">
          <summary class="contrast-details-summary">Details</summary>
          <ul class="contrast-details-list">${items}</ul>
        </details>
      </div>
    </div>
  `;
}

function renderReviewScreen() {
  document.getElementById('contrastBannerContainer').innerHTML = buildContrastBannerHTML();
  document.getElementById('tokenSections').innerHTML =
    buildColorsSectionHTML() +
    buildTypographySectionHTML() +
    buildSpacingSectionHTML() +
    buildOtherSectionHTML();
}

function handleReviewInput(e) {
  const el = e.target;
  const varName = el.dataset.var;
  const path = el.dataset.path;

  if (el.classList.contains('color-native')) {
    const hex = el.value;
    if (path) setTokenByPath(path, hex);
    if (varName) document.documentElement.style.setProperty(varName, hex);
    const row = el.closest('.token-row');
    row.querySelector('.color-swatch').style.background = hex;
    row.querySelector('.color-text').value = hex.replace('#', '');
    updateRowContrastBadge(row, hex);

  } else if (el.classList.contains('color-text')) {
    const hex = parseHexInput(el.value);
    if (hex) {
      if (path) setTokenByPath(path, hex);
      if (varName) document.documentElement.style.setProperty(varName, hex);
      const row = el.closest('.token-row');
      row.querySelector('.color-native').value = hex;
      row.querySelector('.color-swatch').style.background = hex;
      updateRowContrastBadge(row, hex);
    }

  } else if (el.classList.contains('token-text-input')) {
    const value = el.value;
    if (path) setTokenByPath(path, value || null);
    if (varName) {
      if (value.trim()) {
        document.documentElement.style.setProperty(varName, value.trim());
      } else {
        document.documentElement.style.removeProperty(varName);
      }
    }
  }
}

// ============================================================
// Screen routing
// ============================================================

const SCREENS = ['home', 'wizard', 'review', 'preview', 'export'];

function showScreen(name) {
  SCREENS.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (!el) return;
    el.style.display = (s === name) ? 'flex' : 'none';
  });

  if (name === 'home') {
    renderGallery(loadBrands());
  }
  if (name === 'review' && currentTokens) {
    injectAllCSSVars();
    document.getElementById('reviewBrandName').textContent = currentTokens.brandName;
    renderReviewScreen();
    const arrowSvg = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11 6.5H2M6 2L2 6.5L6 11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const backBtn = document.getElementById('reviewBackBtn');
    backBtn.innerHTML = brandLoadedFromSaved
      ? `${arrowSvg} Back to Home`
      : `${arrowSvg} Back to Step 4`;
  }
  if (name === 'preview' && currentTokens) {
    loadPreviewFonts();
    renderPreviewScreen();
  }
  if (name === 'export' && currentTokens) {
    renderExportScreen();
  }
}

function backToWizardFromReview() {
  if (brandLoadedFromSaved) {
    showScreen('home');
    return;
  }
  wizardReturnScreen = 'review';
  showScreen('wizard');
  wizardStep = 3;
  const overlay = document.getElementById('wizardOverlay');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderProgress();
  renderStep();
  updateFooter();
}

// ============================================================
// Preview screen rendering
// ============================================================

function loadPreviewFonts() {
  const pf = (currentTokens.typography.primaryFont || '').trim().split(',')[0].trim();
  const sf = (currentTokens.typography.secondaryFont || '').trim().split(',')[0].trim();
  const fonts = [];
  if (pf) fonts.push(pf);
  if (sf && sf !== pf) fonts.push(sf);

  const existing = document.getElementById('preview-fonts-link');
  if (fonts.length === 0) {
    if (existing) existing.remove();
    return;
  }

  const params = fonts
    .map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join('&');
  const href = `https://fonts.googleapis.com/css2?${params}&display=swap`;

  if (existing) {
    existing.href = href;
  } else {
    const link = document.createElement('link');
    link.id = 'preview-fonts-link';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

function renderPreviewScreen() {
  const sys = `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const pf = currentTokens.typography.primaryFont;
  const sf = currentTokens.typography.secondaryFont;
  const pfStack = pf ? `${pf}, ${sys}` : sys;
  const sfStack = sf ? `${sf}, ${pfStack}` : pfStack;
  document.documentElement.style.setProperty('--pv-font-primary', pfStack);
  document.documentElement.style.setProperty('--pv-font-secondary', sfStack);

  const brandName = escapeHtml(currentTokens.brandName);
  const adjustments = currentTokens.contrastAdjustments;
  const contrastBarHTML = adjustments && adjustments.length > 0
    ? `<div class="preview-contrast-bar">${buildContrastBannerHTML()}</div>`
    : '';
  const screen = document.getElementById('screen-preview');
  screen.innerHTML = `
    <div class="preview-toolbar">
      <div class="preview-toolbar-left">
        <button class="btn-ghost" id="previewBackBtn">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M11 6.5H2M6 2L2 6.5L6 11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to Tokens
        </button>
        <span class="preview-toolbar-divider"></span>
        <span class="preview-toolbar-brand">${brandName}</span>
      </div>
      <button class="btn-primary preview-export-btn" id="previewExportBtn">
        Export
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7H12M7 2L12 7L7 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    ${contrastBarHTML}
    <div class="preview-body">
      <div class="preview-sections">
        ${pvNavSection(currentTokens.brandName)}
        ${pvTypographySection()}
        ${pvButtonsSection()}
        ${pvFormSection()}
        ${pvCardSection()}
        ${pvBadgesSection()}
      </div>
    </div>
  `;

  document.getElementById('previewBackBtn').addEventListener('click', () => showScreen('review'));
  document.getElementById('previewExportBtn').addEventListener('click', () => showScreen('export'));
}

// ============================================================
// Export screen rendering
// ============================================================

function renderExportScreen() {
  const jsonContent = buildTokenStudioJSON();
  const cssContent  = buildShadcnCSS();
  const brandName   = escapeHtml(currentTokens.brandName);
  const safeName    = currentTokens.brandName.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand';
  const jsonSize = formatBytes(new Blob([jsonContent]).size);
  const cssSize  = formatBytes(new Blob([cssContent]).size);

  const copyIcon = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="4.5" y="4.5" width="7" height="7" rx="1.25" stroke="currentColor" stroke-width="1.5"/>
    <path d="M3 8.5H2C1.45 8.5 1 8.05 1 7.5V2C1 1.45 1.45 1 2 1H7.5C8.05 1 8.5 1.45 8.5 2V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
  const dlIcon = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 1.5V8.5M3.5 5.5L6.5 8.5L9.5 5.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1.5 11H11.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
  </svg>`;
  const saveIcon = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2H9L12 5V12H2V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M4.5 2V5H9V2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="3.5" y="8" width="7" height="3.5" rx="0.5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`;

  const screen = document.getElementById('screen-export');
  screen.innerHTML = `
    <div class="export-toolbar">
      <button class="btn-ghost" id="exportBackBtn">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M11 6.5H2M6 2L2 6.5L6 11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Preview
      </button>
      <span class="export-toolbar-brand">${brandName}</span>
      <div class="export-toolbar-end"></div>
    </div>

    <div class="export-body">

      <div class="export-cards">
        <div class="export-card">
          <span class="export-card-badge">JSON</span>
          <h3 class="export-card-title">Token Studio JSON</h3>
          <p class="export-card-desc">Import directly into Figma using the Token Studio plugin</p>
          <span class="export-card-size">${jsonSize}</span>
          <button class="btn-primary export-card-btn" id="exportDlJSON">${dlIcon} Download JSON</button>
        </div>
        <div class="export-card">
          <span class="export-card-badge">CSS</span>
          <h3 class="export-card-title">shadcn Theme</h3>
          <p class="export-card-desc">Add to your project globals.css to apply this theme</p>
          <span class="export-card-size">${cssSize}</span>
          <button class="btn-primary export-card-btn" id="exportDlCSS">${dlIcon} Download CSS</button>
        </div>
      </div>

      <div class="export-preview-panel">
        <div class="export-preview-header">
          <div class="export-tabs">
            <button class="export-tab active" data-fmt="json">Token Studio JSON</button>
            <button class="export-tab" data-fmt="css">shadcn CSS</button>
          </div>
          <button class="btn-ghost export-copy-btn" id="exportCopyBtn">${copyIcon} Copy</button>
        </div>
        <div class="export-code-wrap">
          <pre class="export-code-pre"><code id="exportCodeEl"></code></pre>
        </div>
      </div>

      <div class="export-save-section">
        <button class="btn-primary" id="exportSaveBtn">${saveIcon} Save Brand</button>
        <p class="export-save-hint">Saves to your local brand library on this device</p>
      </div>

    </div>
  `;

  let currentFmt = 'json';

  function setFmt(fmt) {
    currentFmt = fmt;
    screen.querySelectorAll('.export-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.fmt === fmt)
    );
    document.getElementById('exportCodeEl').innerHTML =
      fmt === 'json' ? highlightJSON(jsonContent) : highlightCSS(cssContent);
  }

  document.getElementById('exportBackBtn').addEventListener('click', () => showScreen('preview'));

  document.getElementById('exportDlJSON').addEventListener('click', () =>
    downloadFile(jsonContent, `${safeName}-tokens.json`, 'application/json')
  );
  document.getElementById('exportDlCSS').addEventListener('click', () =>
    downloadFile(cssContent, `${safeName}-theme.css`, 'text/css')
  );

  screen.querySelectorAll('.export-tab').forEach(tab =>
    tab.addEventListener('click', () => setFmt(tab.dataset.fmt))
  );

  document.getElementById('exportCopyBtn').addEventListener('click', () => {
    const content = currentFmt === 'json' ? jsonContent : cssContent;
    const btn = document.getElementById('exportCopyBtn');
    const resetLabel = `${copyIcon} Copy`;
    navigator.clipboard.writeText(content).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.innerHTML = resetLabel; }, 2000);
    }).catch(() => {
      try {
        const ta = Object.assign(document.createElement('textarea'),
          { value: content, style: 'position:fixed;opacity:0' });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.innerHTML = resetLabel; }, 2000);
      } catch (_) { /* silent */ }
    });
  });

  document.getElementById('exportSaveBtn').addEventListener('click', saveBrand);

  setFmt('json');
}

function pvNavSection(brandName) {
  return `
    <div class="pv-section">
      <div class="pv-section-header">
        <span class="pv-section-label">Navigation</span>
      </div>
      <div class="pv-canvas">
        <nav class="pv-nav">
          <div class="pv-nav-brand">${escapeHtml(brandName)}</div>
          <div class="pv-nav-links">
            <a class="pv-nav-link" href="#">Products</a>
            <a class="pv-nav-link" href="#">About</a>
            <a class="pv-nav-link" href="#">Contact</a>
          </div>
          <button class="pv-btn pv-btn-primary">Get Started</button>
        </nav>
      </div>
    </div>
  `;
}

function pvTypographySection() {
  const fontLabel = currentTokens.typography.primaryFont || 'system';
  const scaleLabel = currentTokens.typography.typeScale;
  return `
    <div class="pv-section">
      <div class="pv-section-header">
        <span class="pv-section-label">Typography</span>
        <span class="pv-section-meta">${escapeHtml(fontLabel)} · ${escapeHtml(scaleLabel)} scale</span>
      </div>
      <div class="pv-canvas pv-canvas-type">
        <div class="pv-type-row">
          <span class="pv-token-tag">h1</span>
          <h1 class="pv-h1">The quick brown fox</h1>
        </div>
        <div class="pv-type-row">
          <span class="pv-token-tag">h2</span>
          <h2 class="pv-h2">Jumps over the lazy dog</h2>
        </div>
        <div class="pv-type-row">
          <span class="pv-token-tag">h3</span>
          <h3 class="pv-h3">Design systems for modern brands</h3>
        </div>
        <div class="pv-type-row">
          <span class="pv-token-tag">h4</span>
          <h4 class="pv-h4">Consistent, scalable, and beautiful</h4>
        </div>
        <div class="pv-type-row">
          <span class="pv-token-tag">body</span>
          <p class="pv-body">Every great brand starts with a strong foundation. Typography is the voice of your brand — it communicates personality and sets the tone for the entire experience.</p>
        </div>
        <div class="pv-type-row">
          <span class="pv-token-tag">small</span>
          <p class="pv-small">Helper text and captions use smaller, muted styles to provide supporting context without competing for attention.</p>
        </div>
      </div>
    </div>
  `;
}

function pvButtonsSection() {
  return `
    <div class="pv-section">
      <div class="pv-section-header">
        <span class="pv-section-label">Buttons</span>
      </div>
      <div class="pv-canvas">
        <div class="pv-buttons-row">
          <button class="pv-btn pv-btn-primary">Primary</button>
          <button class="pv-btn pv-btn-secondary">Secondary</button>
          <button class="pv-btn pv-btn-outline">Outline</button>
          <button class="pv-btn pv-btn-ghost">Ghost</button>
          <button class="pv-btn pv-btn-destructive">Destructive</button>
        </div>
      </div>
    </div>
  `;
}

function pvFormSection() {
  return `
    <div class="pv-section">
      <div class="pv-section-header">
        <span class="pv-section-label">Form Controls</span>
      </div>
      <div class="pv-canvas">
        <div class="pv-form">
          <div class="pv-field">
            <label class="pv-label" for="pv-email">Email address</label>
            <input class="pv-input" id="pv-email" type="email" placeholder="name@example.com" />
            <p class="pv-helper">We'll never share your email with anyone else.</p>
          </div>
          <div class="pv-field">
            <label class="pv-label" for="pv-select">Framework</label>
            <select class="pv-select" id="pv-select">
              <option>Next.js</option>
              <option>SvelteKit</option>
              <option>Remix</option>
              <option>Astro</option>
            </select>
          </div>
          <div class="pv-checkbox-wrap">
            <input type="checkbox" class="pv-checkbox" id="pv-check" checked />
            <label class="pv-checkbox-label" for="pv-check">I accept the terms and conditions</label>
          </div>
        </div>
      </div>
    </div>
  `;
}

function pvCardSection() {
  return `
    <div class="pv-section">
      <div class="pv-section-header">
        <span class="pv-section-label">Card</span>
      </div>
      <div class="pv-canvas">
        <div class="pv-card">
          <div class="pv-card-header">
            <h3 class="pv-card-title">Notifications</h3>
            <p class="pv-card-description">You have 3 unread messages.</p>
          </div>
          <div class="pv-card-content">
            <p class="pv-body">Manage your notification preferences. Choose how and when you'd like to receive alerts about activity in your account.</p>
          </div>
          <div class="pv-card-footer">
            <button class="pv-btn pv-btn-primary">Mark all read</button>
            <button class="pv-btn pv-btn-outline">Settings</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function pvBadgesSection() {
  return `
    <div class="pv-section">
      <div class="pv-section-header">
        <span class="pv-section-label">Badges</span>
      </div>
      <div class="pv-canvas">
        <div class="pv-badges-row">
          <span class="pv-badge pv-badge-default">Default</span>
          <span class="pv-badge pv-badge-secondary">Secondary</span>
          <span class="pv-badge pv-badge-outline">Outline</span>
          <span class="pv-badge pv-badge-destructive">Destructive</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// Step event binding dispatcher
// ============================================================

function bindStepEvents(step) {
  switch (step) {
    case 0: bindStep1(); break;
    case 1: bindStep2(); break;
    case 2: bindStep3(); break;
    case 3: bindStep4(); break;
  }
}

// ============================================================
// Navigation
// ============================================================

function goNext() {
  if (wizardStep === STEPS.length - 1) {
    generateTokens();
    return;
  }
  wizardStep++;
  renderProgress();
  renderStep('forward');
  updateFooter();
  document.getElementById('wizardBody').scrollTop = 0;
}

function goBack() {
  if (wizardStep === 0) return;
  wizardStep--;
  renderProgress();
  renderStep('back');
  updateFooter();
  document.getElementById('wizardBody').scrollTop = 0;
}

// ============================================================
// Save brand
// ============================================================

function saveBrand() {
  const brands = loadBrands();
  brands.unshift({
    id: Date.now(),
    name: currentTokens.brandName,
    primary: currentTokens.colors.primary,
    colors: [
      currentTokens.colors.primary,
      currentTokens.colors.secondary,
      ...currentTokens.colors.additional,
    ],
    tokens: currentTokens,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  saveBrands(brands);
  showScreen('home');
}

// ============================================================
// Saved-brand loading & deletion
// ============================================================

function loadBrandFromSaved(brand) {
  const t = brand.tokens;
  if (!t) return;

  currentTokens = t;
  brandLoadedFromSaved = true;

  // Reconstruct brandData from stored tokens so wizard/preview/export all work
  brandData = {
    name: t.brandName || brand.name || '',
    logo: null,
    personality: t.meta?.personality || brand.personality || [],
    primaryColor: t.colors?.primary || '#171717',
    secondaryColor: t.colors?.secondary || '#f5f5f5',
    additionalColors: (t.colors?.additional || []).map((c, i) => ({ id: i + 1, value: c })),
    background: t.colors?.background || 'light',
    primaryFont: t.typography?.primaryFont || '',
    secondaryFont: t.typography?.secondaryFont || '',
    typeScale: t.typography?.typeScale || 'balanced',
    cornerRadius: t.style?.cornerRadiusPreset || 'slightly-rounded',
    density: t.style?.density || 'comfortable',
    additionalNotes: t.meta?.additionalNotes || '',
  };
  colorIdCounter = brandData.additionalColors.length;

  showScreen('review');
}

function showDeleteConfirm(id, name) {
  pendingDeleteId = id;
  document.getElementById('deleteModalTitle').textContent = `Delete "${name}"?`;
  const overlay = document.getElementById('deleteOverlay');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
  document.getElementById('deleteConfirmBtn').focus();
}

function closeDeleteConfirm() {
  pendingDeleteId = null;
  const overlay = document.getElementById('deleteOverlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

function deleteBrand(id) {
  const brands = loadBrands().filter(b => b.id !== id);
  saveBrands(brands);
  renderGallery(brands);
}

function handleGalleryClick(e) {
  // Delete button — show confirmation modal instead of deleting immediately
  const deleteBtn = e.target.closest('.brand-card-delete');
  if (deleteBtn) {
    const id = Number(deleteBtn.dataset.id);
    const brand = loadBrands().find(b => b.id === id);
    showDeleteConfirm(id, brand?.name || 'this brand');
    return;
  }
  // Anywhere else on the card — load brand into Review screen
  const card = e.target.closest('.brand-card');
  if (card) {
    const brand = loadBrands().find(b => b.id === Number(card.dataset.id));
    if (brand) loadBrandFromSaved(brand);
  }
}

// ============================================================
// Gallery
// ============================================================

function updateBrandCount(count) {
  const el = document.getElementById('brandCount');
  el.textContent = count === 1 ? '1 brand' : `${count} brands`;
}

function renderGallery(brands) {
  const gallery = document.getElementById('gallery');
  updateBrandCount(brands.length);

  if (brands.length === 0) {
    gallery.innerHTML = `
      <div class="gallery-empty">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="21" y="6" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="6" y="21" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
            <rect x="21" y="21" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
          </svg>
        </div>
        <p class="empty-title">No brands yet</p>
        <p class="empty-subtitle">Your saved design systems will appear here</p>
      </div>
    `;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'gallery-grid';

  brands.forEach(brand => {
    const card = document.createElement('div');
    card.className = 'brand-card';
    card.dataset.id = brand.id;

    const swatchBg = brand.colors?.[0] || '#f5f5f5';
    const dots = (brand.colors || ['#e5e5e5', '#a3a3a3', '#171717'])
      .slice(0, 4)
      .map(c => `<div class="brand-card-swatch-dot" style="background:${escapeHtml(c)}"></div>`)
      .join('');

    const personality = brand.personality?.slice(0, 2).join(', ')
      || brand.tokens?.meta?.personality?.slice(0, 2).join(', ')
      || '';

    card.innerHTML = `
      <div class="brand-card-swatch" style="background:${escapeHtml(swatchBg)}18">${dots}</div>
      <div class="brand-card-info">
        <div class="brand-card-name">${escapeHtml(brand.name)}</div>
        <div class="brand-card-meta">${personality ? personality + ' · ' : ''}${formatDate(brand.updatedAt)}</div>
      </div>
      <div class="brand-card-actions">
        <button class="brand-card-edit" data-id="${brand.id}">Edit</button>
        <button class="brand-card-delete" data-id="${brand.id}" aria-label="Delete ${escapeAttr(brand.name)}">Delete</button>
      </div>
    `;

    grid.appendChild(card);
  });

  gallery.innerHTML = '';
  gallery.appendChild(grid);
}

// ============================================================
// Utilities
// ============================================================

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(iso) {
  if (!iso) return 'recently';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================
// Init
// ============================================================

function init() {
  renderGallery(loadBrands());

  // Logo — return home from anywhere
  document.getElementById('logoHomeBtn').addEventListener('click', () => showScreen('home'));

  // Start New Brand button
  document.getElementById('startBtn').addEventListener('click', openWizard);

  // Saved brand cards (edit / delete via event delegation)
  document.getElementById('gallery').addEventListener('click', handleGalleryClick);

  // Wizard close
  document.getElementById('wizardClose').addEventListener('click', () => {
    closeWizard();
    showScreen(wizardReturnScreen);
  });

  // Close on backdrop click
  document.getElementById('wizardOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      closeWizard();
      showScreen(wizardReturnScreen);
    }
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const deleteOverlay = document.getElementById('deleteOverlay');
      if (deleteOverlay.classList.contains('open')) {
        closeDeleteConfirm();
        return;
      }
      const wizardOverlay = document.getElementById('wizardOverlay');
      if (wizardOverlay.classList.contains('open')) {
        closeWizard();
        showScreen(wizardReturnScreen);
      }
    }
  });

  // Delete confirmation modal
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteConfirm);
  document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
    if (pendingDeleteId !== null) deleteBrand(pendingDeleteId);
    closeDeleteConfirm();
  });
  document.getElementById('deleteOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDeleteConfirm();
  });

  // Wizard navigation
  document.getElementById('btnNext').addEventListener('click', goNext);
  document.getElementById('btnBack').addEventListener('click', goBack);

  // Review screen
  document.getElementById('reviewBackBtn').addEventListener('click', backToWizardFromReview);
  document.getElementById('reviewPreviewBtn').addEventListener('click', () => showScreen('preview'));
  document.getElementById('screen-review').addEventListener('input', handleReviewInput);

}

document.addEventListener('DOMContentLoaded', init);
