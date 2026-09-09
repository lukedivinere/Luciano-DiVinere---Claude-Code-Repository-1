// Upcoming shows — where to catch the artists you follow.
//
// Honest-data rule (same as everywhere in Crate): we do NOT invent concert listings.
// Real listings come from an artist submitting their own dates, the community adding a
// show with a ticket link, or — on the roadmap — a licensed events API (Bandsintown /
// Songkick / Ticketmaster). We store METADATA + an outbound ticket link only, and every
// seeded row is badged `seed: true` so it never reads as a verified booking.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_FILE = join(__dirname, "data", "events.json");

// Artist names arrive messy — "Max Styler — unconfirmed", "Dom Dolla (ID)". Normalize so
// a followed artist matches their shows. Keep it conservative: lowercase, strip trailing
// qualifier notes and punctuation, collapse whitespace.
export function normalizeArtist(name) {
  return String(name || "")
    .replace(/[—–-]\s*unconfirmed.*$/i, "")
    .replace(/\((?:unconfirmed|id|forthcoming|unreleased)\)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Display form: the messy qualifiers removed, original casing kept.
export function displayArtist(name) {
  return String(name || "")
    .replace(/[—–-]\s*unconfirmed.*$/i, "")
    .replace(/\((?:unconfirmed|id|forthcoming|unreleased)\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function readEvents() {
  try { return JSON.parse(await readFile(EVENTS_FILE, "utf8")); }
  catch { return []; }
}

async function writeEvents(events) {
  await mkdir(dirname(EVENTS_FILE), { recursive: true });
  await writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
}

function isValidDate(s) {
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

// Save a submitted show. Artist + a real future date required; ticket link optional.
export async function addEvent({ artist, venue, city, date, ticketUrl, note }) {
  const name = displayArtist(artist);
  if (!name) return { error: "Name the artist playing." };
  if (!date || !isValidDate(date)) return { error: "Add a valid show date." };
  if (new Date(date) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    return { error: "That date is in the past." };
  }
  const events = await readEvents();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    artist: name.slice(0, 200),
    artistKey: normalizeArtist(artist),
    venue: (venue || "").slice(0, 200).trim(),
    city: (city || "").slice(0, 120).trim(),
    date: new Date(date).toISOString(),
    ticketUrl: (ticketUrl || "").slice(0, 500).trim(),
    note: (note || "").slice(0, 400).trim(),
    seed: false,
    submittedAt: new Date().toISOString(),
  };
  events.push(entry);
  await writeEvents(events.slice(-1000));
  return { ok: true, entry };
}

export async function listEvents() {
  return readEvents();
}

// Upcoming only, soonest first.
export async function upcomingEvents() {
  const now = Date.now();
  return (await readEvents())
    .filter((e) => new Date(e.date).getTime() >= now - 12 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Seed a few clearly-labelled example shows (for the seeded artists) when the store is
// empty, so the page isn't a dead end before real dates are added. Dates are relative to
// boot so they always read as upcoming.
export async function seedEventsIfEmpty() {
  const existing = await readEvents();
  if (existing.length) return 0;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const seeds = [
    { artist: "Max Styler", venue: "Sound", city: "Los Angeles, CA", inDays: 12, ticketUrl: "", note: "Example show — replace with a real date." },
    { artist: "Chris Stussy", venue: "Warehouse Project", city: "Manchester, UK", inDays: 26, ticketUrl: "", note: "Example show." },
    { artist: "Dom Dolla", venue: "The Brooklyn Mirage", city: "New York, NY", inDays: 40, ticketUrl: "", note: "Example show." },
    { artist: "Sydney Charles", venue: "Smartbar", city: "Chicago, IL", inDays: 19, ticketUrl: "", note: "Example show." },
  ];
  const rows = seeds.map((s, i) => ({
    id: "evt-seed-" + i,
    artist: s.artist,
    artistKey: normalizeArtist(s.artist),
    venue: s.venue,
    city: s.city,
    date: new Date(now + s.inDays * day).toISOString(),
    ticketUrl: s.ticketUrl,
    note: s.note,
    seed: true,
    submittedAt: new Date(now).toISOString(),
  }));
  await writeEvents(rows);
  return rows.length;
}
