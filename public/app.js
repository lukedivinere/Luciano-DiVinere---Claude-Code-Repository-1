// Frontend for the Crate Phase-0 uploader.

const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---- mode badge ------------------------------------------------------------
fetch("/api/config")
  .then((r) => r.json())
  .then((c) => {
    const badge = $("#mode-badge");
    badge.textContent = c.fingerprintConfigured
      ? "● live fingerprint matching"
      : "● demo mode — community layer only";
  })
  .catch(() => {});

// ---- identify --------------------------------------------------------------
const drop = $("#drop");
const fileInput = $("#file");
const dropLabel = $("#drop-label");
const identifyBtn = $("#identify-btn");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    dropLabel.textContent = fileInput.files[0].name;
    identifyBtn.disabled = false;
  }
});

["dragover", "dragenter"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("hot"); })
);
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, () => drop.classList.remove("hot"))
);
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    dropLabel.textContent = fileInput.files[0].name;
    identifyBtn.disabled = false;
  }
});

identifyBtn.addEventListener("click", async () => {
  const box = $("#identify-result");
  identifyBtn.disabled = true;
  identifyBtn.textContent = "Listening…";
  box.hidden = false;
  box.innerHTML = '<span class="muted">Matching…</span>';

  try {
    const fd = new FormData();
    fd.append("clip", fileInput.files[0]);
    const res = await fetch("/api/identify", { method: "POST", body: fd }).then((r) => r.json());

    if (res.matched && res.track) {
      const t = res.track;
      const links = [
        t.spotify ? `<a href="${esc(t.spotify)}" target="_blank" rel="noopener">Spotify</a>` : "",
        t.appleMusic ? `<a href="${esc(t.appleMusic)}" target="_blank" rel="noopener">Apple Music</a>` : "",
      ].filter(Boolean).join(" · ");
      box.innerHTML =
        `<div class="hit">✓ Match found</div>
         <div style="margin-top:6px"><strong>${esc(t.artist)} — ${esc(t.title)}</strong></div>
         ${t.album ? `<div class="muted">${esc(t.album)}${t.releaseDate ? " · " + esc(t.releaseDate) : ""}</div>` : ""}
         ${links ? `<div style="margin-top:8px">${links}</div>` : ""}`;
    } else {
      box.innerHTML =
        `<div class="miss">◇ No released-track match</div>
         <div class="muted" style="margin-top:6px">${esc(res.message || "This is where the community comes in — scroll down and add an ID.")}</div>`;
    }
  } catch {
    box.innerHTML = '<div class="miss">Something went wrong. Try again.</div>';
  } finally {
    identifyBtn.disabled = false;
    identifyBtn.textContent = "Identify";
    loadStats();
  }
});

// ---- submit ----------------------------------------------------------------
$("#submit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $("#submit-msg");
  const payload = {
    trackTitle: form.trackTitle.value,
    artistGuess: form.artistGuess.value,
    sourceUrl: form.sourceUrl.value,
    notes: form.notes.value,
  };

  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

  msg.hidden = false;
  if (res.ok) {
    msg.className = "msg ok";
    msg.textContent = "Added. Thanks for digging — it's live in the feed below.";
    form.reset();
    loadFeed();
    loadStats();
  } else {
    msg.className = "msg err";
    msg.textContent = res.error || "Couldn't submit.";
  }
});

// ---- feed ------------------------------------------------------------------
async function loadFeed() {
  const feed = $("#feed");
  const items = await fetch("/api/submissions").then((r) => r.json());
  if (!items.length) {
    feed.innerHTML = '<p class="muted">No IDs yet. Be the first to name one.</p>';
    return;
  }
  feed.innerHTML = items
    .map(
      (s) => `
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
      </div>`
    )
    .join("");

  feed.querySelectorAll("[data-vote]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const res = await fetch(`/api/submissions/${btn.dataset.vote}/vote`, { method: "POST" }).then((r) => r.json());
      if (res.ok) {
        btn.nextElementSibling.textContent = res.votes;
        loadStats();
      }
    })
  );
}

// ---- stats -----------------------------------------------------------------
async function loadStats() {
  const s = await fetch("/api/stats").then((r) => r.json());
  $("#stats").textContent =
    `${s.identifyAttempts} clips tried · ${s.submissions} community IDs · ${s.votes} upvotes`;
}

loadFeed();
loadStats();
