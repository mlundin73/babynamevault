// BabyNameVault — client-side search engine (no backend required)

const CULTURES = [
  { key: "african", label: "African" },
  { key: "african-american", label: "African American" },
  { key: "arabic", label: "Arabic" },
  { key: "east-asian", label: "East Asian" },
  { key: "indian", label: "Indian / South Asian" },
  { key: "irish", label: "Irish / Celtic" },
  { key: "jewish", label: "Jewish / Hebrew" },
  { key: "latino", label: "Latino / Hispanic" },
  { key: "pacific-islander", label: "Pacific Islander / Hawaiian" },
  { key: "southeast-asian", label: "Southeast Asian" },
  { key: "western", label: "Western / European" }
];

let ALL_GROUPS = [];
let state = { culture: null, category: null, gender: null, mode: "lookup" };

function bucketGroups() {
  return ALL_GROUPS.filter(g =>
    g.culture === state.culture &&
    g.category === state.category &&
    g.gender === state.gender
  );
}

let RESULT_GROUPS = [];

function renderResults(groups) {
  RESULT_GROUPS = groups;
  RESULT_SHOWN = RESULT_PAGE;
  drawResults();
}

const RESULT_PAGE = 60;
let RESULT_SHOWN = RESULT_PAGE;

function drawResults() {
  const groups = RESULT_GROUPS;
  const el = document.getElementById("results");
  if (!groups.length) {
    el.innerHTML = '<p class="no-results">No names found. Try another letter, name, or set of letters.</p>';
    return;
  }
  const slice = groups.slice(0, RESULT_SHOWN);
  const left = groups.length - slice.length;
  el.innerHTML = `<div class="result-count">${groups.length} name${groups.length === 1 ? "" : "s"} found</div>` + slice.map((g, i) => `
    <div class="result-card">
      <span class="primary-name">${g.variants[0]}</span>
      ${g.native ? `<span class="native-script">${g.native}</span>` : ""}
      <div class="variants">${g.variants.map(v => `<span class="variant-pill">${v}</span>`).join("")}</div>
      ${g.note ? `<div class="note">${g.note}</div>` : ""}
      <div><button class="share-btn" data-idx="${i}">Make a shareable card</button></div>
    </div>
  `).join("") + (left > 0 ? `<button class="more-btn" id="more-btn">Show ${Math.min(RESULT_PAGE, left)} more (${left} remaining)</button>` : "");
  el.querySelectorAll(".share-btn").forEach(btn => {
    btn.addEventListener("click", () => openShareCard(RESULT_GROUPS[+btn.dataset.idx]));
  });
  const more = document.getElementById("more-btn");
  if (more) more.addEventListener("click", () => { RESULT_SHOWN += RESULT_PAGE; drawResults(); });
}

const CULTURE_LABELS = {
  "african": "African", "african-american": "African American", "arabic": "Arabic",
  "east-asian": "East Asian", "indian": "Indian / South Asian", "irish": "Irish / Celtic",
  "jewish": "Jewish / Hebrew", "latino": "Latino / Hispanic",
  "pacific-islander": "Pacific Islander / Hawaiian", "southeast-asian": "Southeast Asian",
  "western": "Western / European"
};
const CATEGORY_LABELS = { traditional: "Traditional", trendy: "Modern Trendy Respelling", distinctive: "Distinctive & Inventive" };

function drawShareCard(ctx, g) {
  const W = 1080, H = 1080;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#7b4fe0");
  grad.addColorStop(1, "#ff8a65");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.97)";
  const pad = 60;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 36);
  ctx.fill();

  ctx.fillStyle = "#2b2140";
  ctx.textAlign = "center";

  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillStyle = "#7b4fe0";
  ctx.fillText("BabyNameVault", W / 2, 180);

  ctx.font = "700 110px system-ui, sans-serif";
  ctx.fillStyle = "#2b2140";
  wrapCenteredText(ctx, g.variants[0], W / 2, 420, 900, 110);

  if (g.native) {
    ctx.font = "500 56px system-ui, sans-serif";
    ctx.fillStyle = "#5b32b8";
    ctx.fillText(g.native, W / 2, 510);
  }

  ctx.font = "400 34px system-ui, sans-serif";
  ctx.fillStyle = "#6b6180";
  const variantsLine = g.variants.slice(0, 5).join("  *  ");
  wrapCenteredText(ctx, variantsLine, W / 2, 630, 880, 44);

  ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillStyle = "#ff8a65";
  const tag = `${CULTURE_LABELS[g.culture]} - ${CATEGORY_LABELS[g.category]}`;
  ctx.fillText(tag, W / 2, H - 140);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapCenteredText(ctx, text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "", y = startY, lines = [];
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const totalH = (lines.length - 1) * lineHeight;
  let y0 = startY - totalH / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, y0 + i * lineHeight));
}

function openShareCard(group) {
  const canvas = document.getElementById("share-canvas");
  const ctx = canvas.getContext("2d");
  drawShareCard(ctx, group);
  document.getElementById("share-modal").hidden = false;
  document.getElementById("share-note").textContent = "";
}

function closeShareCard() {
  document.getElementById("share-modal").hidden = true;
}

function runLookup(query) {
  const q = query.trim().toLowerCase();
  if (!q) { renderResults([]); return; }
  const lk = s => phonKey(s.toLowerCase().replace(/[^a-z]/g, "").replace(/([aeiouy])h/g, "$1").replace(/jh/g, "j"));
  const qk = lk(q);
  const hits = bucketGroups().filter(g => g.variants.some(v => v.toLowerCase().includes(q) || (qk.length > 1 && lk(v) === qk)));
  const rank = g => g.variants.some(v => v.toLowerCase() === q) ? 0 : g.variants.some(v => v.toLowerCase().startsWith(q)) ? 1 : 2;
  hits.sort((x, y) => rank(x) - rank(y) || x.variants[0].localeCompare(y.variants[0]));
  renderResults(hits);
}

function renderLetterRow() {
  const groups = bucketGroups();
  const available = new Set(groups.map(g => g.variants[0][0].toUpperCase()));
  const row = document.getElementById("letter-row");
  row.innerHTML = "";
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.className = "letter-btn";
    btn.textContent = letter;
    btn.dataset.letter = letter;
    if (!available.has(letter)) btn.disabled = true;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".letter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const matches = groups.filter(g => g.variants[0][0].toUpperCase() === letter).sort((x, y) => x.variants[0].localeCompare(y.variants[0]));
      renderResults(matches);
    });
    row.appendChild(btn);
  }
}

function canFormFromLetters(word, letterPool) {
  const pool = {};
  for (const ch of letterPool) pool[ch] = (pool[ch] || 0) + 1;
  const needed = {};
  for (const ch of word.toLowerCase()) {
    if (ch === " " || ch === "'") continue;
    needed[ch] = (needed[ch] || 0) + 1;
  }
  for (const ch in needed) {
    if (!pool[ch] || pool[ch] < needed[ch]) return false;
  }
  return true;
}

function runUnscramble(letters) {
  const clean = letters.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) { renderResults([]); return; }
  const groups = bucketGroups();
  const matches = [];
  groups.forEach(g => {
    const hitVariants = g.variants.filter(v => canFormFromLetters(v, clean));
    if (hitVariants.length) {
      matches.push({ ...g, variants: hitVariants.length === g.variants.length ? g.variants : hitVariants });
    }
  });
  renderResults(matches);
}

function updateSummary() {
  const cultureLabel = CULTURES.find(c => c.key === state.culture).label;
  const categoryLabel = { traditional: "Traditional", trendy: "Modern Trendy Respelling", distinctive: "Distinctive & Inventive" }[state.category];
  const genderLabel = { boy: "Boy", girl: "Girl", neutral: "Neutral" }[state.gender];
  document.getElementById("selection-summary").textContent =
    `${cultureLabel} · ${categoryLabel} · ${genderLabel}`;
}

function showSearchModes() {
  document.getElementById("picker").hidden = true;
  document.getElementById("search-modes").hidden = false;
  updateSummary();
  renderLetterRow();
  document.getElementById("lookup-input").value = "";
  document.getElementById("unscramble-input").value = "";
  renderResults([]);
}

function maybeAdvance() {
  if (state.culture && state.category && state.gender) showSearchModes();
}

function wireChipRow(rowId, stateKey) {
  document.getElementById(rowId).addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    document.querySelectorAll(`#${rowId} .chip`).forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    state[stateKey] = btn.dataset[stateKey === "culture" ? "culture" : stateKey];
    maybeAdvance();
  });
}

function init() {
  wireMeaningTool();
  // populate culture chips
  const cultureRow = document.getElementById("culture-row");
  cultureRow.innerHTML = CULTURES.map(c =>
    `<button class="chip" data-culture="${c.key}">${c.label}</button>`
  ).join("");

  wireChipRow("culture-row", "culture");
  wireChipRow("category-row", "category");
  wireChipRow("gender-row", "gender");

  document.getElementById("reset-btn").addEventListener("click", () => {
    state = { culture: null, category: null, gender: null, mode: "lookup" };
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    document.getElementById("search-modes").hidden = true;
    document.getElementById("picker").hidden = false;
  });

  document.getElementById("mode-tabs").addEventListener("click", e => {
    const tab = e.target.closest(".mode-tab");
    if (!tab) return;
    document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    state.mode = tab.dataset.mode;
    ["lookup", "letter", "unscramble"].forEach(m => {
      document.getElementById(`panel-${m}`).hidden = m !== state.mode;
    });
    renderResults([]);
  });

  document.getElementById("lookup-input").addEventListener("input", e => runLookup(e.target.value));
  document.getElementById("unscramble-input").addEventListener("input", e => runUnscramble(e.target.value));

  document.getElementById("share-close-btn").addEventListener("click", closeShareCard);
  document.getElementById("share-modal").addEventListener("click", e => {
    if (e.target.id === "share-modal") closeShareCard();
  });

  document.getElementById("share-download-btn").addEventListener("click", () => {
    const canvas = document.getElementById("share-canvas");
    const link = document.createElement("a");
    link.download = "babynamevault-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  document.getElementById("share-copy-btn").addEventListener("click", async () => {
    const canvas = document.getElementById("share-canvas");
    const note = document.getElementById("share-note");
    try {
      const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      note.textContent = "Copied! Paste it anywhere.";
    } catch (err) {
      note.textContent = "Copy isn't available here - try Download instead.";
    }
  });

  NAMES_READY = fetch("data/names.json")
    .then(r => r.json())
    .then(data => { ALL_GROUPS = data; })
    .catch(err => {
      document.getElementById("results").innerHTML =
        '<p class="no-results">Could not load name data.</p>';
      console.error(err);
    });
}

/* ---------- "What does your name mean?" tool ---------- */
let NAMES_READY = Promise.resolve();
let MEANINGS = null;
let MEANINGS_READY = null;
let NAME_INDEX = null;   // folded spelling -> [groups]
let PHON_INDEX = null;   // sound-alike key -> [display names]
const MEANING_SOURCES = {
  n: "Nurturepedia open baby-names dataset",
  d: "name-db open dataset",
  j: "JapaneseNamer open data",
  i: "Indonesian baby-name corpus (CC BY 4.0), translated to English",
  c: "General etymology compiled for BabyNameVault",
  a: "Etymology compiled for BabyNameVault from general references (not individually verified)"
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function foldName(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ʻ’'\s-]/g, "").toLowerCase();
}

function phonKey(name) {
  let s = foldName(name).replace(/[^a-z]/g, "");
  s = s.replace(/a+/g, "a").replace(/(e+|i+|ie|ey)/g, "i").replace(/(o+|ou|u+|ow)/g, "u");
  s = s.replace(/y/g, "i").replace(/(.)\1+/g, "$1").replace(/h$/, "");
  s = s.replace(/ph/g, "f").replace(/kh/g, "k").replace(/gh/g, "g").replace(/dh/g, "d").replace(/th/g, "t").replace(/sh/g, "s");
  return s;
}

function buildNameIndexes() {
  if (NAME_INDEX) return;
  NAME_INDEX = new Map();
  PHON_INDEX = new Map();
  ALL_GROUPS.forEach(g => {
    g.variants.forEach(v => {
      const k = foldName(v);
      if (!k) return;
      if (!NAME_INDEX.has(k)) NAME_INDEX.set(k, []);
      const arr = NAME_INDEX.get(k);
      if (!arr.includes(g)) arr.push(g);
    });
    const pk = phonKey(g.variants[0]);
    if (!PHON_INDEX.has(pk)) PHON_INDEX.set(pk, []);
    PHON_INDEX.get(pk).push(g.variants[0]);
  });
}

function meaningForGroup(g, typedKey) {
  if (MEANINGS[typedKey]) return { key: typedKey, data: MEANINGS[typedKey], exact: true };
  for (const v of g.variants) {
    const k = foldName(v);
    if (MEANINGS[k]) return { key: k, data: MEANINGS[k], exact: false };
  }
  return null;
}

async function runMeaning(raw) {
  const out = document.getElementById("meaning-results");
  const q = foldName(raw);
  if (!q) { out.innerHTML = ""; return; }
  out.innerHTML = '<p class="no-results">Looking...</p>';
  try { await NAMES_READY; await MEANINGS_READY; } catch (e) { /* handled below */ }
  if (!ALL_GROUPS.length || !MEANINGS) {
    out.innerHTML = '<p class="no-results">Name data is still loading - try again in a moment.</p>';
    return;
  }
  buildNameIndexes();
  const groups = (NAME_INDEX.get(q) || []).slice().sort((a, b) => (foldName(b.variants[0]) === q) - (foldName(a.variants[0]) === q));
  const cards = [];
  groups.slice(0, 10).forEach(g => {
    const m = meaningForGroup(g, q);
    cards.push(meaningCard(g, m, raw));
  });
  if (!groups.length && MEANINGS[q]) {
    const d = MEANINGS[q];
    cards.push(`<div class="meaning-card"><div class="meaning-name">${esc(d[0])}</div>${meaningBlock({ key: q, data: d, exact: true })}<p class="meaning-where">Not yet in our spelling lists, but we do have its meaning.</p></div>`);
  }
  if (cards.length) {
    const more = groups.length > 10 ? `<p class="meaning-where">Showing 10 of ${groups.length} matches.</p>` : "";
    out.innerHTML = cards.join("") + more;
    return;
  }
  // No match: suggest similar-sounding or similar-starting names
  const sugg = new Set();
  (PHON_INDEX.get(phonKey(raw)) || []).forEach(n => sugg.add(n));
  if (sugg.size < 8 && q.length >= 3) {
    for (const [k, gs] of NAME_INDEX) {
      if (k.startsWith(q.slice(0, 3))) { sugg.add(gs[0].variants[0]); if (sugg.size >= 12) break; }
    }
  }
  const pills = [...sugg].slice(0, 12).map(n => `<button type="button" class="meaning-sugg" data-name="${esc(n)}">${esc(n)}</button>`).join("");
  out.innerHTML = `<p class="no-results">We don't have "${esc(raw.trim())}" yet.</p>` +
    (pills ? `<p class="meaning-where">Did you mean:</p><div class="meaning-suggs">${pills}</div>` : "");
  out.querySelectorAll(".meaning-sugg").forEach(b => b.addEventListener("click", () => {
    document.getElementById("meaning-input").value = b.dataset.name;
    runMeaning(b.dataset.name);
  }));
}

function meaningBlock(m) {
  if (!m) return '<p class="meaning-none">No meaning on file for this name yet.</p>';
  const d = m.data;
  const label = m.exact ? "Means" : `Meaning of the related spelling ${esc(d[0])}`;
  return `<p class="meaning-text"><span class="meaning-label">${label}:</span> ${esc(d[1])}</p>` +
    `<p class="meaning-src">${d[3] ? "Origin: " + esc(d[3]) + " &middot; " : ""}Source: ${esc(MEANING_SOURCES[d[2]] || "")}</p>`;
}

function meaningCard(g, m, typed) {
  const cultureLabel = (typeof CULTURE_LABELS !== "undefined" && CULTURE_LABELS[g.culture]) || g.culture;
  const catLabel = (typeof CATEGORY_LABELS !== "undefined" && CATEGORY_LABELS[g.category]) || g.category;
  const genderLabel = { boy: "Boy", girl: "Girl", neutral: "Neutral" }[g.gender];
  return `<div class="meaning-card">
    <div class="meaning-name">${esc(g.variants[0])}${g.native ? `<span class="native-script">${esc(g.native)}</span>` : ""}</div>
    ${meaningBlock(m)}
    <div class="meaning-chips"><span>${esc(cultureLabel)}</span><span>${esc(catLabel)}</span><span>${genderLabel}</span></div>
    <div class="variants">${g.variants.map(v => `<span class="variant-pill">${esc(v)}</span>`).join("")}</div>
    ${g.note ? `<div class="note">${esc(g.note)}</div>` : ""}
  </div>`;
}

function wireMeaningTool() {
  MEANINGS_READY = fetch("data/meanings.json")
    .then(r => r.json())
    .then(m => { MEANINGS = m; })
    .catch(err => { MEANINGS = {}; console.error(err); });
  document.getElementById("meaning-form").addEventListener("submit", e => {
    e.preventDefault();
    runMeaning(document.getElementById("meaning-input").value);
  });
}

document.addEventListener("DOMContentLoaded", init);
