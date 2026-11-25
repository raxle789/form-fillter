/**
 * popup.js — orchestrates the popup UI and talks to the page.
 *
 * No content_scripts in the manifest: content.js is injected on demand under
 * activeTab, so the extension has zero access to a page until you open it here.
 */

const $ = (sel) => document.querySelector(sel);

const el = {
  host: $('#host'),
  tabAuto: $('#tab-auto'),
  tabJson: $('#tab-json'),
  panelAuto: $('#panel-auto'),
  panelJson: $('#panel-json'),
  locale: $('#locale'),
  skipFilled: $('#skipFilled'),
  highlight: $('#highlight'),
  json: $('#json'),
  jsonStatus: $('#json-status'),
  template: $('#template'),
  fill: $('#fill'),
  scan: $('#scan'),
  clear: $('#clear'),
  status: $('#status'),
  results: $('#results'),
};

const state = {
  mode: 'auto',
  locale: 'id',
  skipFilled: true,
  highlight: true,
  json: '',
};

let lastScan = [];

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

async function loadState() {
  const saved = await chrome.storage.local.get('state');
  Object.assign(state, saved.state || {});

  el.locale.value = state.locale;
  el.skipFilled.checked = state.skipFilled;
  el.highlight.checked = state.highlight;
  el.json.value = state.json;
  setMode(state.mode, { save: false });
  validateJson();
}

function saveState() {
  chrome.storage.local.set({ state });
}

function setMode(mode, { save = true } = {}) {
  state.mode = mode;
  const isJson = mode === 'json';
  el.tabAuto.setAttribute('aria-selected', String(!isJson));
  el.tabJson.setAttribute('aria-selected', String(isJson));
  el.panelAuto.hidden = isJson;
  el.panelJson.hidden = !isJson;
  if (save) saveState();
}

/* ------------------------------------------------------------------ *
 * Page access
 * ------------------------------------------------------------------ */

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Injects content.js, then calls one of its methods in every frame.
 * Cross-origin iframes can refuse injection, so it falls back to the top frame.
 */
async function runInPage(method, options) {
  const tab = await activeTab();
  if (!tab?.id) throw new Error('NO_TAB');

  const target = (allFrames) => ({ tabId: tab.id, allFrames });

  async function attempt(allFrames) {
    await chrome.scripting.executeScript({
      target: target(allFrames),
      files: ['content.js'],
    });
    return chrome.scripting.executeScript({
      target: target(allFrames),
      func: async (m, o) => await window.__FORM_FILLER__[m](o),
      args: [method, options],
    });
  }

  try {
    return await attempt(true);
  } catch {
    return await attempt(false);
  }
}

function fillOptions() {
  return {
    mode: state.mode,
    locale: state.locale,
    skipFilled: state.skipFilled,
    highlight: state.highlight,
    data: state.mode === 'json' ? parseJson().value || {} : {},
  };
}

/* ------------------------------------------------------------------ *
 * JSON
 * ------------------------------------------------------------------ */

function parseJson() {
  const text = el.json.value.trim();
  if (!text) return { ok: true, value: {}, empty: true };
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, error: 'JSON harus berupa object, bukan array atau nilai tunggal.' };
    }
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: describeJsonError(text, err) };
  }
}

function describeJsonError(text, err) {
  const at = /position (\d+)/.exec(err.message);
  if (!at) return 'JSON belum valid.';
  const line = text.slice(0, Number(at[1])).split('\n').length;
  return `JSON belum valid di baris ${line}.`;
}

function validateJson() {
  const parsed = parseJson();
  el.json.classList.toggle('invalid', !parsed.ok);
  el.jsonStatus.classList.toggle('error', !parsed.ok);

  if (!parsed.ok) {
    el.jsonStatus.textContent = parsed.error;
  } else if (parsed.empty) {
    el.jsonStatus.textContent = 'Key dicocokkan ke name, id, atau label.';
  } else {
    const n = countKeys(parsed.value);
    el.jsonStatus.textContent = `${n} key siap dipakai.`;
  }
  return parsed;
}

function countKeys(obj, n = 0) {
  for (const v of Object.values(obj)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) n = countKeys(v, n);
    else n++;
  }
  return n;
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

function say(html, isError = false) {
  el.status.innerHTML = html;
  el.status.classList.toggle('error', isError);
}

function renderFields(fields) {
  el.results.replaceChildren();
  for (const f of fields) {
    const row = document.createElement('div');
    row.className = 'field';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = f.key || f.label;
    if (f.label && f.label !== f.key) {
      const sub = document.createElement('span');
      sub.textContent = f.label;
      name.appendChild(sub);
    }

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = f.type;

    row.append(name, tag);
    el.results.appendChild(row);
  }
}

function sum(frames, key) {
  return frames.reduce((n, f) => n + (f.result?.[key] || 0), 0);
}

function busy(on) {
  for (const b of [el.fill, el.scan, el.clear]) b.disabled = on;
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

async function handle(action) {
  busy(true);
  try {
    await action();
  } catch (err) {
    const msg =
      err?.message === 'NO_TAB'
        ? 'Tidak ada tab aktif.'
        : 'Halaman ini tidak bisa diakses ekstensi. Coba di halaman http atau https biasa.';
    say(msg, true);
  } finally {
    busy(false);
  }
}

el.fill.addEventListener('click', () =>
  handle(async () => {
    if (state.mode === 'json') {
      const parsed = validateJson();
      if (!parsed.ok) return say(parsed.error, true);
      if (parsed.empty) return say('Tempel dulu JSON-nya, atau pindah ke mode Otomatis.', true);
    }

    const frames = await runInPage('fill', fillOptions());
    const filled = sum(frames, 'filled');
    const skipped = sum(frames, 'skipped');
    const invalid = sum(frames, 'invalid');
    const unmatched = frames.flatMap((f) => f.result?.unmatched || []);

    if (filled === 0) {
      return say('Tidak ada field yang cocok untuk diisi di halaman ini.', true);
    }

    let msg = `Terisi <strong>${filled}</strong> field`;
    if (skipped) msg += `, ${skipped} dilewati`;
    msg += '.';
    if (invalid) msg += ` ${invalid} tidak lolos validasi bawaan form.`;
    if (unmatched.length) {
      const preview = unmatched.slice(0, 4).join(', ');
      const more = unmatched.length > 4 ? `, +${unmatched.length - 4} lagi` : '';
      msg += `<br>Key tanpa pasangan: ${preview}${more}.`;
    }
    say(msg);
  })
);

el.scan.addEventListener('click', () =>
  handle(async () => {
    const frames = await runInPage('scan', { locale: state.locale });
    lastScan = frames.flatMap((f) => f.result || []);

    if (!lastScan.length) {
      el.results.replaceChildren();
      el.template.disabled = true;
      return say('Tidak ada field yang terdeteksi di halaman ini.', true);
    }

    renderFields(lastScan);
    el.template.disabled = false;
    say(`Ketemu <strong>${lastScan.length}</strong> field.`);
  })
);

el.clear.addEventListener('click', () =>
  handle(async () => {
    const frames = await runInPage('clear', {});
    const cleared = sum(frames, 'cleared');
    say(cleared ? `Dikosongkan <strong>${cleared}</strong> field.` : 'Form sudah kosong.');
  })
);

el.template.addEventListener('click', () => {
  if (!lastScan.length) return;
  const obj = {};
  for (const f of lastScan) obj[f.key] = f.sample;
  el.json.value = JSON.stringify(obj, null, 2);
  state.json = el.json.value;
  setMode('json');
  validateJson();
  saveState();
  el.json.focus();
});

/* ------------------------------------------------------------------ *
 * Wiring
 * ------------------------------------------------------------------ */

el.tabAuto.addEventListener('click', () => setMode('auto'));
el.tabJson.addEventListener('click', () => setMode('json'));

el.locale.addEventListener('change', () => {
  state.locale = el.locale.value;
  saveState();
});

for (const key of ['skipFilled', 'highlight']) {
  el[key].addEventListener('change', () => {
    state[key] = el[key].checked;
    saveState();
  });
}

let jsonTimer;
el.json.addEventListener('input', () => {
  state.json = el.json.value;
  clearTimeout(jsonTimer);
  jsonTimer = setTimeout(() => {
    validateJson();
    saveState();
  }, 250);
});

// Cmd/Ctrl+Enter fills without reaching for the mouse.
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    el.fill.click();
  }
});

(async function init() {
  await loadState();
  try {
    const tab = await activeTab();
    if (tab?.url) el.host.textContent = new URL(tab.url).host;
  } catch {
    /* activeTab hasn't granted the URL — the header just stays empty. */
  }
})();
