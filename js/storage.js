const KEYS = {
  tournaments: 'ptm.tournaments',
  draft: 'ptm.draft',
  theme: 'ptm.theme',
  language: 'ptm.language',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadTournaments() {
  const list = readJson(KEYS.tournaments, []);
  return Array.isArray(list) ? list : [];
}

export function saveTournaments(list) {
  writeJson(KEYS.tournaments, list);
}

export function getTournament(id) {
  return loadTournaments().find((t) => t.id === id) || null;
}

export function saveTournament(tournament) {
  const list = loadTournaments();
  const index = list.findIndex((t) => t.id === tournament.id);
  if (index >= 0) list[index] = tournament;
  else list.push(tournament);
  saveTournaments(list);
}

export function deleteTournament(id) {
  saveTournaments(loadTournaments().filter((t) => t.id !== id));
}

export function loadDraft() {
  return readJson(KEYS.draft, null);
}

export function saveDraft(draft) {
  writeJson(KEYS.draft, draft);
}

export function clearDraft() {
  localStorage.removeItem(KEYS.draft);
}

export function loadTheme() {
  return localStorage.getItem(KEYS.theme) === 'light' ? 'light' : 'dark';
}

export function saveTheme(theme) {
  localStorage.setItem(KEYS.theme, theme);
}

export function loadLanguage() {
  return localStorage.getItem(KEYS.language);
}

export function saveLanguage(language) {
  localStorage.setItem(KEYS.language, language);
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
