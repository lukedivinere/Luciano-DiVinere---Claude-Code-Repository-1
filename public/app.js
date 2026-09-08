// Crate front end: tap-to-ID, auto-ID loop, on-device history, community layer.
import { decodeAndFingerprint } from "./fingerprint.js";

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pct = (c) => `${Math.round((c || 0) * 100)}%`;

const RECORD_MS = 9000; // how long each listen captures

// A per-page-load session id — used to reconcile repeat attempts on the same audio.
const SESSION_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---- screen navigation -----------------------------------------------------
const screens = ["listen", "result", "history", "drops", "enroll", "trending", "contribute"];
function show(name) {
  screens.forEach((s) => ($(`#screen-${s}`).hidden = s !== name));
  window.scrollTo(0, 0);
}
// Navigate to a destination and load whatever data it needs.
function go(name) {
  if (name === "history") renderHistory();
  else if (name === "drops") loadDrops();
  else if (name === "enroll") loadCatalog();
  else if (name === "trending") loadTrending();
  else if (name === "contribute") { loadFeed(); loadStats(); }
  show(name);
}
document.querySelectorAll("[data-back]").forEach((b) =>
  b.addEventListener("click", () => { stopAuto(); show("listen"); })
);
$("#result-again").addEventListener("click", () => show("listen"));
$("#result-contribute").addEventListener("click", () => go("contribute"));

// ---- slide-out menu --------------------------------------------------------
const navEl = $("#nav");
function openNav() { navEl.hidden = false; requestAnimationFrame(() => navEl.classList.add("open")); }
function closeNav() { navEl.classList.remove("open"); setTimeout(() => { navEl.hidden = true; }, 250); }
$("#nav-toggle").addEventListener("click", openNav);
navEl.querySelectorAll("[data-nav-close]").forEach((el) => el.addEventListener("click", closeNav));
navEl.querySelectorAll(".nav-item").forEach((item) =>
  item.addEventListener("click", () => {
    const dest = item.dataset.go;
    closeNav();
    if (dest === "listen") { stopAuto(); show("listen"); } else go(dest);
  })
);

// ---- theme: light by default, dark optional, remembered --------------------
function applyTheme(mode) {
  document.documentElement.dataset.theme = mode; // "light" | "dark"
  try { localStorage.setItem("crate-theme", mode); } catch { /* private mode */ }
}
(function initTheme() {
  let saved = "light";
  try { saved = localStorage.getItem("crate-theme") || "light"; } catch { /* ignore */ }
  applyTheme(saved === "dark" ? "dark" : "light");
})();
$("#theme-toggle").addEventListener("click", () =>
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark")
);

// Deep-link support: #history / #drops / #enroll / #trending / #contribute
function openByHash() {
  const h = location.hash.replace("#", "");
  if (["history", "drops", "enroll", "trending", "contribute"].includes(h)) go(h);
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

// Which input device to record from. null = system default.
let selectedMicId = null;

// List available mics so the user can pick the right input (fixes "the phone is
// recording instead of my computer"). Labels only appear after mic permission is granted.
async function populateMics() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter((d) => d.kind === "audioinput" && d.deviceId);
    const row = $("#mic-row");
    const sel = $("#mic");
    if (mics.length < 2 || !mics.some((m) => m.label)) { row.hidden = true; return; }
    row.hidden = false;
    sel.innerHTML = mics.map((m) => `<option value="${esc(m.deviceId)}">${esc(m.label || "Microphone")}</option>`).join("");
    if (selectedMicId) sel.value = selectedMicId; else selectedMicId = sel.value;
  } catch { /* enumerateDevices unsupported — leave picker hidden */ }
}
$("#mic")?.addEventListener("change", (e) => { selectedMicId = e.target.value; });

// Records a clip AND measures its peak audio level, so we can tell a real recording from
// a mic that heard nothing (wrong input device / muted). Returns { blob, level }.
async function captureClip() {
  // Turn OFF the voice-call processing browsers enable by default. Noise suppression,
  // echo cancellation, and auto-gain are tuned for speech and treat music as noise —
  // they mangle the signal and wreck fingerprint matching. We want the raw sound.
  const audio = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  };
  if (selectedMicId) audio.deviceId = { exact: selectedMicId };
  const stream = await navigator.mediaDevices.getUserMedia({ audio });
  populateMics(); // labels are available now that permission is granted

  // Meter the level while recording — and drive the live waveform (the capture "moment":
  // the orb visibly responds to real sound, not a canned animation).
  let peak = 0, meter = null, ac = null, raf = null;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    ac.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    meter = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let max = 0;
      for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128) / 128; if (v > max) max = v; }
      if (max > peak) peak = max;
    }, 100);
    raf = startWaveform(analyser, buf);
  } catch { /* Web Audio unavailable — skip metering/waveform, level stays 0 */ }

  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  return new Promise((resolve, reject) => {
    rec.onstop = () => {
      if (meter) clearInterval(meter);
      if (raf) cancelAnimationFrame(raf);
      stopWaveform();
      if (ac) ac.close().catch(() => {});
      stream.getTracks().forEach((t) => t.stop());
      resolve({ blob: new Blob(chunks, { type: rec.mimeType || "audio/webm" }), level: peak });
    };
    rec.onerror = reject;
    rec.start();
    setTimeout(() => rec.state !== "inactive" && rec.stop(), RECORD_MS);
  });
}

// Live waveform on the orb, driven by real mic input. Returns the rAF id so the caller
// can cancel it. Respects reduced-motion by drawing a single static baseline.
function startWaveform(analyser, buf) {
  const canvas = $("#wave");
  if (!canvas || !canvas.getContext) return null;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#8B7DF0";
  let id = null;
  const draw = () => {
    analyser.getByteTimeDomainData(buf);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 2;
    ctx.strokeStyle = accent;
    ctx.beginPath();
    const step = Math.ceil(buf.length / W);
    for (let x = 0; x < W; x++) {
      const v = (buf[x * step] - 128) / 128; // -1..1
      const y = H / 2 + v * (H / 2) * 0.8;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    if (!reduce) id = requestAnimationFrame(draw);
  };
  draw();
  return id;
}
function stopWaveform() {
  const canvas = $("#wave");
  if (canvas && canvas.getContext) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

// One full cycle: record → send → save → show. Returns whether a match was found.
async function idOnce({ silent = false } = {}) {
  if (recording) return;
  recording = true;
  setListeningUI(true);
  try {
    let cap;
    try {
      cap = await captureClip();
    } catch {
      recording = false; setListeningUI(false);
      alert("Mic access denied. Use “upload a clip instead”.");
      return;
    }
    return await handleClip(cap.blob, { silent, level: cap.level, durationMs: RECORD_MS });
  } finally {
    recording = false;
    setListeningUI(false);
  }
}

// A mic that heard essentially nothing (wrong input device, muted, no sound in the room).
// `level` is peak amplitude 0..1 from metering; null for uploaded files (can't measure).
const SILENCE_LEVEL = 0.015;

// Shared path for mic + uploaded clips.
async function handleClip(blob, { silent = false, level = null, durationMs = null } = {}) {
  const heardNothing = level != null && level < SILENCE_LEVEL;
  prompt.textContent = "Digging…";
  const fd = new FormData();
  fd.append("clip", blob, "clip.webm");

  // Fingerprint the clip on-device: send hashes (so the pipeline can match Crate's
  // unreleased catalog) plus audio characteristics (so a miss is logged with evidence).
  let hashes = null;
  try { hashes = await decodeAndFingerprint(await blob.arrayBuffer()); }
  catch { /* undecodable clip — released-track path still runs */ }
  if (hashes && hashes.length) fd.append("hashes", JSON.stringify(hashes));
  if (level != null) fd.append("level", String(level));
  if (durationMs != null) fd.append("durationMs", String(durationMs));

  const result = await fetch("/api/identify", { method: "POST", body: fd }).then((r) => r.json());

  // Compact fingerprint signature (unique hash values) — used to tell whether two attempts
  // in this session are the same audio, without storing the full fingerprint.
  const hsig = hashes ? [...new Set(hashes.map((x) => x.h))].slice(0, 4000) : null;
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    blob,
    best: result.best || null,
    sources: result.sources || [],
    watching: false,
    sessionId: SESSION_ID,
    hsig,
    retired: false,
  };
  await idbPut(item).catch(() => {});
  lastItemId = item.id;

  // Session reconciliation: if this retry resolved to a CATALOG match, retire the earlier
  // unidentified attempts on the same audio (fingerprint-similar) from this session, so a
  // solved track doesn't leave a trail of "Unidentified" ghosts behind it.
  if (result.best && /catalog/i.test(result.best.source || "") && hsig) {
    await reconcileSession(hsig, result.best).catch(() => {});
  }

  // In auto mode we only surface a match; misses keep the loop quiet.
  if (silent && !result.best) return false;
  renderResult(result, blob, { heardNothing });
  show("result");
  return Boolean(result.best);
}

// Fraction of the smaller signature's hashes shared between two attempts.
function hsigOverlap(setA, arrB) {
  if (!setA.size || !arrB || !arrB.length) return 0;
  let inter = 0;
  for (const h of arrB) if (setA.has(h)) inter++;
  return inter / Math.min(setA.size, arrB.length);
}

// Retire this session's earlier UNIDENTIFIED attempts whose fingerprint matches the audio
// we just resolved. Only unresolved items are touched; the matched item is left intact.
async function reconcileSession(currentHsig, matched) {
  const cur = new Set(currentHsig);
  for (const it of await idbAll()) {
    if (it.sessionId !== SESSION_ID || it.best || it.retired || it.id === lastItemId || !it.hsig) continue;
    if (hsigOverlap(cur, it.hsig) >= 0.2) {
      it.retired = true;
      it.reconciledTo = { title: matched.title, artist: matched.artist };
      await idbPut(it);
    }
  }
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

// "Where to find it" — real streaming links from the match, plus honest search links for
// SoundCloud / DJ sets / the artist's Instagram (we search rather than fake an exact URL).
function buildLinks(best) {
  const q = encodeURIComponent(`${best.artist} ${best.title}`);
  const a = encodeURIComponent(best.artist);
  const links = [];
  if (best.spotify) links.push(["Spotify", best.spotify]);
  if (best.appleMusic) links.push(["Apple Music", best.appleMusic]);
  if (best.deezer) links.push(["Deezer", best.deezer]);
  // Beatport first among stores — this audience buys there (and it's the affiliate link).
  links.push(["Buy on Beatport", `https://www.beatport.com/search?q=${q}`]);
  if (best.itunes) links.push(["Buy on iTunes", best.itunes]);
  links.push(["SoundCloud", `https://soundcloud.com/search?q=${q}`]);
  links.push(["Find in DJ sets", `https://www.google.com/search?q=${q}+site:1001tracklists.com`]);
  links.push([`${best.artist} on Instagram`, `https://www.google.com/search?q=${a}+instagram`]);
  return links
    .map(([label, url]) => `<a class="rlink" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`)
    .join("");
}

function renderResult(result, blob, opts = {}) {
  const best = result.best;
  const msgEl = $("#result-msg");
  const cover = $("#cover");
  const linksEl = $("#result-links");

  $("#best-conf").textContent = best ? `${pct(best.confidence)} · ${best.source}` : "";
  $("#best-conf").hidden = !best;

  if (best) {
    $("#result-eyebrow").textContent = "Best guess";
    $("#best-title").textContent = best.title;
    $("#best-artist").textContent = best.artist;
    // Label — third line, muted. Omitted entirely when unknown (never "Unknown label").
    const labelEl = $("#best-label");
    if (best.label) { labelEl.textContent = best.label; labelEl.hidden = false; }
    else { labelEl.textContent = ""; labelEl.hidden = true; }
    msgEl.hidden = true;
    if (best.artwork) { cover.src = best.artwork; cover.hidden = false; }
    else { cover.hidden = true; cover.removeAttribute("src"); }
    linksEl.innerHTML = buildLinks(best);
  } else {
    $("#best-artist").textContent = "";
    $("#best-label").hidden = true;
    cover.hidden = true; cover.removeAttribute("src");
    linksEl.innerHTML = "";
    // No match — say plainly WHAT happened so it doesn't read as "broken".
    const fp = (result.sources || []).find((s) => s.key === "fingerprint");
    let title, msg;
    if (opts.heardNothing) {
      title = "Heard almost nothing";
      msg = "Your mic barely picked up any sound. Play the music out loud right next to the mic, and if the input is wrong, switch it with the Mic selector on the home screen.";
    } else if (fp && fp.status === "error") {
      title = "Matching unavailable";
      msg = fp.note || "The matching service returned an error — likely an API-key or quota problem.";
    } else if (fp && fp.status === "demo") {
      title = "Live matching is off";
      msg = "Real matching isn't switched on (no fingerprint key set).";
    } else {
      title = "No released-track match";
      msg = "We listened — this isn't a released track we can fingerprint. It's probably unreleased, which is exactly what the community can name. Add an ID below.";
    }
    $("#result-eyebrow").textContent = "Result";
    $("#best-title").textContent = title;
    msgEl.textContent = msg;
    msgEl.hidden = false;
  }

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
  const all = await idbAll();
  const items = all.filter((it) => !it.retired); // retired = an earlier miss later resolved
  const retiredCount = all.length - items.length;
  const note = retiredCount
    ? `<p class="muted">${retiredCount} earlier miss${retiredCount > 1 ? "es" : ""} auto-resolved once the track was identified.</p>`
    : "";
  if (!items.length) {
    wrap.innerHTML = note || '<p class="muted">Nothing yet. Tap the orb on the home screen to ID your first track.</p>';
    return;
  }
  wrap.innerHTML = note + items.map((it) => {
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

// ---- enroll an unreleased track into the catalog --------------------------
$("#enroll-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $("#enroll-msg");
  const file = $("#enroll-file").files[0];
  if (!file) return;
  msg.hidden = false; msg.className = "msg"; msg.textContent = "Fingerprinting on your device…";
  let hashes;
  try {
    hashes = await decodeAndFingerprint(await file.arrayBuffer());
  } catch {
    msg.className = "msg err"; msg.textContent = "Couldn't read that audio file. Try MP3, WAV, or m4a.";
    return;
  }
  const res = await fetch("/api/catalog/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hashes, artist: form.artist.value, title: form.title.value, sourceUrl: form.sourceUrl.value, notes: form.notes.value }),
  }).then((r) => r.json());
  if (res.ok) {
    msg.className = "msg ok";
    msg.textContent = `Enrolled ✓ (${res.hashCount} fingerprints). It'll match when someone hears it.`;
    form.reset(); loadCatalog(); loadStats();
  } else {
    msg.className = "msg err"; msg.textContent = res.error || "Couldn't enroll.";
  }
});

async function loadCatalog() {
  const wrap = $("#catalog");
  const items = await fetch("/api/catalog").then((r) => r.json());
  if (!items.length) { wrap.innerHTML = '<p class="muted">No tracks enrolled yet. Add the first unreleased ID.</p>'; return; }
  wrap.innerHTML = items.map((t) => `
    <div class="item"><div class="body">
      <div class="t">${esc(t.title) || "Untitled ID"}<span class="tag-unreleased">unreleased</span></div>
      <div class="a">${esc(t.artist) || "artist unknown"}</div>
      ${t.notes ? `<div class="n">${esc(t.notes)}</div>` : ""}
      ${t.sourceUrl ? `<a class="src" href="${esc(t.sourceUrl)}" target="_blank" rel="noopener">${esc(t.sourceUrl)}</a>` : ""}
    </div></div>`).join("");
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

// ---- trending IDs ----------------------------------------------------------
async function loadTrending() {
  const wrap = $("#trending");
  const items = await fetch("/api/trending").then((r) => r.json());
  if (!items.length) {
    wrap.innerHTML = '<p class="muted">Nothing trending yet — as people vote on and watch IDs, the most-wanted ones rise here.</p>';
    return;
  }
  wrap.innerHTML = items.map((s, i) => `
    <div class="item">
      <div class="rank">${i + 1}</div>
      <div class="body">
        <div class="t">${esc(s.trackTitle) || "Untitled ID"}${s.seed ? '<span class="tag-example">example</span>' : ""}</div>
        <div class="a">${esc(s.artistGuess) || "artist unknown"}</div>
        <div class="n">${s.votes} vote${s.votes === 1 ? "" : "s"} · ${s.watchers} waiting</div>
      </div>
    </div>`).join("");
}

async function loadFeed() {
  const feed = $("#feed");
  const items = await fetch("/api/submissions").then((r) => r.json());
  if (!items.length) { feed.innerHTML = '<p class="muted">No IDs yet. Be the first.</p>'; return; }
  feed.innerHTML = items.map((s) => `
    <div class="item">
      <div class="body">
        <div class="t">${esc(s.trackTitle) || "Untitled ID"}${s.seed ? '<span class="tag-example">example</span>' : ""}</div>
        <div class="a">${esc(s.artistGuess) || "artist unknown"}</div>
        ${s.notes ? `<div class="n">${esc(s.notes)}</div>` : ""}
        ${s.sourceUrl ? `<a class="src" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.sourceUrl)}</a>` : ""}
        <div class="notify" data-nid="${esc(s.id)}">
          <button class="linkbtn notify-btn">🔔 Notify me${s.watchers ? ` · ${s.watchers} waiting` : ""}</button>
          <form class="notify-form" hidden>
            <input type="email" placeholder="you@email.com" required />
            <label><input type="checkbox" class="ev-named" checked /> when it's named</label>
            <label><input type="checkbox" class="ev-drop" checked /> when it drops</label>
            <button class="btn mini" type="submit">Save</button>
            <span class="notify-msg"></span>
          </form>
        </div>
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

  feed.querySelectorAll(".notify").forEach((box) => {
    const btn = box.querySelector(".notify-btn");
    const form = box.querySelector(".notify-form");
    btn.addEventListener("click", () => { form.hidden = !form.hidden; });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector(".notify-msg");
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: box.dataset.nid,
          email: form.querySelector("input[type=email]").value,
          onNamed: form.querySelector(".ev-named").checked,
          onDrop: form.querySelector(".ev-drop").checked,
        }),
      }).then((r) => r.json());
      if (res.ok) {
        msg.className = "notify-msg ok"; msg.textContent = "You're on the list ✓";
        setTimeout(() => { loadFeed(); loadStats(); }, 900);
      } else {
        msg.className = "notify-msg err"; msg.textContent = res.error || "Try again.";
      }
    });
  });
}

async function loadStats() {
  const s = await fetch("/api/stats").then((r) => r.json());
  let line = `${s.identifyAttempts} clips tried · ${s.submissions} community IDs · ${s.votes} upvotes`;
  if (s.enrolled) line += ` · ${s.enrolled} in catalog`;
  if (s.notifySignups) line += ` · ${s.notifySignups} on notify list`;
  $("#stats").textContent = line;
}

// try to list mics on load (labels only show if permission was already granted)
populateMics();

// open a deep-linked screen if the page loaded with a hash
openByHash();
