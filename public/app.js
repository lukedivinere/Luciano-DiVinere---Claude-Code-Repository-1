// Crate front end: tap-to-ID, auto-ID loop, on-device history, community layer.

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pct = (c) => `${Math.round((c || 0) * 100)}%`;

const RECORD_MS = 9000; // how long each listen captures

// ---- screen navigation -----------------------------------------------------
const screens = ["listen", "result", "history", "drops", "contribute"];
function show(name) {
  screens.forEach((s) => ($(`#screen-${s}`).hidden = s !== name));
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-back]").forEach((b) =>
  b.addEventListener("click", () => { stopAuto(); show("listen"); })
);
$("#open-contribute").addEventListener("click", () => { loadFeed(); loadStats(); show("contribute"); });
$("#open-history").addEventListener("click", () => { renderHistory(); show("history"); });
$("#open-drops").addEventListener("click", () => { loadDrops(); show("drops"); });
$("#result-again").addEventListener("click", () => show("listen"));
$("#result-contribute").addEventListener("click", () => { loadFeed(); loadStats(); show("contribute"); });

// Deep-link support: #drops / #history / #contribute open that sheet on load.
function openByHash() {
  const h = location.hash.replace("#", "");
  if (h === "drops") { loadDrops(); show("drops"); }
  else if (h === "history") { renderHistory(); show("history"); }
  else if (h === "contribute") { loadFeed(); loadStats(); show("contribute"); }
}
window.addEventListener("hashchange", openByHash);

// ---- mode badge ------------------------------------------------------------
fetch("/api/config").then((r) => r.json()).then((c) => {
  $("#mode-badge").textContent = c.fingerprintConfigured ? "live" : "demo mode";
}).catch(() => {});

// ---- IndexedDB: on-device ID history --------------------------------------
// Recordings live HERE — on the user's device — never on our server.
let dbp;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open("crate", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("ids", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}
async function idbAll() {
  const d = await db();
  return new Promise((res) => {
    const out = [];
    const cur = d.transaction("ids").objectStore("ids").openCursor(null, "prev");
    cur.onsuccess = () => { const c = cur.result; if (c) { out.push(c.value); c.continue(); } else res(out); };
    cur.onerror = () => res(out);
  });
}
async function idbPut(item) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction("ids", "readwrite");
    tx.objectStore("ids").put(item);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(id) {
  const d = await db();
  return new Promise((res) => {
    const g = d.transaction("ids").objectStore("ids").get(id);
    g.onsuccess = () => res(g.result); g.onerror = () => res(null);
  });
}

// ---- recording -------------------------------------------------------------
const orb = $("#orb");
const prompt = $("#prompt");
const subprompt = $("#subprompt");
let recording = false;

function setListeningUI(on, text) {
  orb.classList.toggle("listening", on);
  prompt.textContent = text || (on ? "Listening…" : "Tap to ID");
  if (!on) subprompt.textContent = "Point it at the speakers. We'll listen, then dig everywhere.";
}

async function captureClip() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  return new Promise((resolve, reject) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    };
    rec.onerror = reject;
    rec.start();
    setTimeout(() => rec.state !== "inactive" && rec.stop(), RECORD_MS);
  });
}

// One full cycle: record → send → save → show. Returns whether a match was found.
async function idOnce({ silent = false } = {}) {
  if (recording) return;
  recording = true;
  setListeningUI(true);
  try {
    let blob;
    try {
      blob = await captureClip();
    } catch {
      recording = false; setListeningUI(false);
      alert("Mic access denied. Use “upload a clip instead”.");
      return;
    }
    await handleClip(blob, { silent });
  } finally {
    recording = false;
    setListeningUI(false);
  }
}

// Shared path for mic + uploaded clips.
async function handleClip(blob, { silent = false } = {}) {
  prompt.textContent = "Digging…";
  const fd = new FormData();
  fd.append("clip", blob, "clip.webm");
  const result = await fetch("/api/identify", { method: "POST", body: fd }).then((r) => r.json());

  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    blob,
    best: result.best || null,
    sources: result.sources || [],
    watching: false,
  };
  await idbPut(item).catch(() => {});
  lastItemId = item.id;

  // In auto mode we only surface a match; misses keep the loop quiet.
  if (silent && !result.best) return false;
  renderResult(result, blob);
  show("result");
  return Boolean(result.best);
}

// ---- auto-ID loop ----------------------------------------------------------
const autoToggle = $("#auto-toggle");
let autoOn = false;
autoToggle.addEventListener("change", () => { autoToggle.checked ? startAuto() : stopAuto(); });

async function startAuto() {
  autoOn = true; autoToggle.checked = true;
  subprompt.textContent = "Auto-ID on — listening on a loop. We'll surface a match when we hear one.";
  while (autoOn) {
    const hit = await idOnce({ silent: true });
    if (hit) { stopAuto(); break; }          // found something — stop and show it
    if (!autoOn) break;
    await new Promise((r) => setTimeout(r, 1500)); // brief gap between passes
  }
}
function stopAuto() {
  autoOn = false; autoToggle.checked = false;
}

// ---- orb + upload triggers -------------------------------------------------
orb.addEventListener("click", () => { if (!autoOn) idOnce(); });
$("#upload-fallback").addEventListener("click", () => $("#file").click());
$("#file").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  setListeningUI(true, "Digging…");
  await handleClip(f);
  setListeningUI(false);
  e.target.value = "";
});

// ---- result rendering ------------------------------------------------------
let lastItemId = null;

function renderResult(result, blob) {
  const best = result.best;
  $("#best-title").textContent = best ? best.title : "No confident match";
  $("#best-artist").textContent = best ? best.artist : "";
  $("#best-conf").textContent = best ? `${pct(best.confidence)} · ${best.source}` : "";
  $("#best-conf").hidden = !best;
  const link = $("#best-link");
  if (best && best.url) { link.href = best.url; link.hidden = false; } else link.hidden = true;

  // replay of what was just recorded (from the in-memory blob)
  const replay = $("#replay-row");
  if (blob) {
    $("#replay-audio").src = URL.createObjectURL(blob);
    replay.hidden = false;
  } else replay.hidden = true;

  $("#sources").innerHTML = (result.sources || []).map(renderSource).join("");

  const watchBtn = $("#result-watch");
  watchBtn.textContent = "☆ Watch for release";
  watchBtn.classList.remove("watching");
}

function renderSource(s) {
  const cands = (s.candidates || []).map((c) => `
    <div class="cand">
      <div>
        <div class="ct">${esc(c.title)}${c.unreleased ? '<span class="tag-unreleased">unreleased</span>' : ""}${c.demo ? '<span class="tag-demo">demo</span>' : ""}</div>
        <div class="ca">${esc(c.artist)}${c.sourceLabel ? " · " + esc(c.sourceLabel) : ""}</div>
        ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">open →</a>` : ""}
      </div>
      <span class="cconf">${c.context ? "recent drop" : pct(c.confidence)}</span>
    </div>`).join("");
  return `
    <div class="source">
      <div class="shead">
        <span class="slabel">${esc(s.label)}</span>
        <span class="pill ${esc(s.status)}">${esc(s.status.replace("_", " "))}</span>
      </div>
      ${s.note ? `<p class="snote">${esc(s.note)}</p>` : ""}
      ${cands}
    </div>`;
}

// Watch-for-release: flag the saved history item. This is the hook that a backend
// re-scan job would later use to notify "you ID'd this months ago — it's dropping now".
$("#result-watch").addEventListener("click", async () => {
  if (!lastItemId) return;
  const item = await idbGet(lastItemId);
  if (!item) return;
  item.watching = !item.watching;
  await idbPut(item);
  const btn = $("#result-watch");
  btn.textContent = item.watching ? "★ Watching for release" : "☆ Watch for release";
  btn.classList.toggle("watching", item.watching);
});

// ---- history rendering -----------------------------------------------------
async function renderHistory() {
  const wrap = $("#history");
  const items = await idbAll();
  if (!items.length) {
    wrap.innerHTML = '<p class="muted">Nothing yet. Tap the orb on the home screen to ID your first track.</p>';
    return;
  }
  wrap.innerHTML = items.map((it) => {
    const best = it.best;
    const when = new Date(it.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    return `
      <div class="hitem" data-id="${esc(it.id)}">
        <div class="htop">
          <div>
            <div class="htitle">${best ? esc(best.title) : "Unidentified"}</div>
            <div class="hartist">${best ? esc(best.artist) + " · " + pct(best.confidence) : "no confident match"}</div>
          </div>
          <div class="hwhen">${esc(when)}</div>
        </div>
        <audio controls preload="none" data-audio></audio>
        <div class="hrow">
          <button class="btn mini ghost ${it.watching ? "watching" : ""}" data-watch>${it.watching ? "★ Watching" : "☆ Watch for release"}</button>
          <button class="btn mini ghost" data-recheck>Re-check now</button>
        </div>
      </div>`;
  }).join("");

  // wire up each item (load audio lazily from its stored blob)
  for (const el of wrap.querySelectorAll(".hitem")) {
    const id = el.dataset.id;
    const item = await idbGet(id);
    if (item?.blob) el.querySelector("[data-audio]").src = URL.createObjectURL(item.blob);

    el.querySelector("[data-watch]").addEventListener("click", async (e) => {
      const it = await idbGet(id); if (!it) return;
      it.watching = !it.watching; await idbPut(it);
      e.target.classList.toggle("watching", it.watching);
      e.target.textContent = it.watching ? "★ Watching" : "☆ Watch for release";
    });

    el.querySelector("[data-recheck]").addEventListener("click", async (e) => {
      const it = await idbGet(id); if (!it?.blob) return;
      e.target.textContent = "Checking…"; e.target.disabled = true;
      const fd = new FormData(); fd.append("clip", it.blob, "clip.webm");
      const res = await fetch("/api/identify", { method: "POST", body: fd }).then((r) => r.json());
      it.best = res.best || null; it.sources = res.sources || []; await idbPut(it);
      renderHistory();
    });
  }
}

// ---- instagram drops -------------------------------------------------------
$("#drop-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $("#drop-msg");
  const res = await fetch("/api/ig-drops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: form.url.value,
      artist: form.artist.value,
      trackTitle: form.trackTitle.value,
      note: form.note.value,
    }),
  }).then((r) => r.json());

  msg.hidden = false;
  if (res.ok) {
    msg.className = "msg ok"; msg.textContent = "Drop added — it'll surface in the ID pipeline too.";
    form.reset(); loadDrops();
  } else {
    msg.className = "msg err"; msg.textContent = res.error || "Couldn't add that.";
  }
});

async function loadDrops() {
  const wrap = $("#drops");
  const items = await fetch("/api/ig-drops").then((r) => r.json());
  if (!items.length) { wrap.innerHTML = '<p class="muted">No drops yet. Add the first one.</p>'; return; }
  wrap.innerHTML = items.map((d) => `
    <div class="item">
      <div class="body">
        <div class="t">${esc(d.trackTitle) || "Untitled ID"}<span class="tag-unreleased">unreleased</span></div>
        <div class="a">${esc(d.artist) || "artist unknown"}</div>
        ${d.note ? `<div class="n">${esc(d.note)}</div>` : ""}
        <a class="src" href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.url)}</a>
      </div>
    </div>`).join("");
}

// ---- community submit + feed ----------------------------------------------
$("#submit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $("#submit-msg");
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trackTitle: form.trackTitle.value,
      artistGuess: form.artistGuess.value,
      sourceUrl: form.sourceUrl.value,
      notes: form.notes.value,
    }),
  }).then((r) => r.json());

  msg.hidden = false;
  if (res.ok) {
    msg.className = "msg ok"; msg.textContent = "Added. Thanks for digging.";
    form.reset(); loadFeed(); loadStats();
  } else {
    msg.className = "msg err"; msg.textContent = res.error || "Couldn't submit.";
  }
});

async function loadFeed() {
  const feed = $("#feed");
  const items = await fetch("/api/submissions").then((r) => r.json());
  if (!items.length) { feed.innerHTML = '<p class="muted">No IDs yet. Be the first.</p>'; return; }
  feed.innerHTML = items.map((s) => `
    <div class="item">
      <div class="body">
        <div class="t">${esc(s.trackTitle) || "Untitled ID"}</div>
        <div class="a">${esc(s.artistGuess) || "artist unknown"}</div>
        ${s.notes ? `<div class="n">${esc(s.notes)}</div>` : ""}
        ${s.sourceUrl ? `<a class="src" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.sourceUrl)}</a>` : ""}
      </div>
      <div class="vote">
        <button class="btn mini" data-vote="${esc(s.id)}">▲</button>
        <span class="count">${s.votes}</span>
      </div>
    </div>`).join("");
  feed.querySelectorAll("[data-vote]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const res = await fetch(`/api/submissions/${btn.dataset.vote}/vote`, { method: "POST" }).then((r) => r.json());
      if (res.ok) { btn.nextElementSibling.textContent = res.votes; loadStats(); }
    })
  );
}

async function loadStats() {
  const s = await fetch("/api/stats").then((r) => r.json());
  $("#stats").textContent = `${s.identifyAttempts} clips tried · ${s.submissions} community IDs · ${s.votes} upvotes`;
}

// open a deep-linked screen if the page loaded with a hash
openByHash();
