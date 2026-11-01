/**
 * All text visible to the user lives in this file.
 *
 * To add a language, copy the `en` block, change its key to the language code (e.g. `fr`)
 * and translate the values. It shows up on the settings page automatically.
 *
 * - `{name}` is a placeholder that gets replaced with a value. Keep it as it is.
 * - An entry with `one` / `other` varies with `{count}`. Languages with more plural forms can
 *   add them (`two`, `few`, `many`, ...), see Intl.PluralRules.
 * - Text missing from a language falls back to English.
 */
const TRANSLATIONS = {
  en: {
    'language.name': 'English',
    'app.title': 'Padel Tournament Manager',

    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.add': 'Add',
    'common.backToTournaments': 'Back to tournaments',
    'common.team': 'Team',
    'common.player': 'Player',
    'common.teamNumber': 'Team {number}',

    'format.classic': 'Classic Americano',
    'format.team': 'Team Americano',

    'status.open': 'Open',
    'status.finished': 'Finished',

    'rank.points': 'Won points',
    'rank.wins': 'Number of wins',
    'rank.diff': 'Point difference',

    'settings.title': 'Settings',
    'settings.theme': 'Appearance',
    'settings.themeDark': 'Dark',
    'settings.themeLight': 'Light',
    'settings.language': 'Language',

    'list.title': 'Tournaments',
    'list.settings': 'Settings',
    'list.addTournament': 'Add tournament',
    'list.emptyTitle': 'No tournaments yet',
    'list.emptyHint': 'Tap "+" to create your first tournament.',
    'list.players': { one: 'player', other: 'players' },
    'list.matches': { one: 'match', other: 'matches' },

    'wizard.title': 'Add Tournament',
    'wizard.discard': 'Discard tournament',
    'wizard.discardTitle': 'Discard tournament?',
    'wizard.discardMessage': 'Do you really want to throw away the configured tournament?',
    'wizard.discardConfirm': 'Discard',
    'wizard.stepFormat': 'Format',
    'wizard.stepPlayers': 'Players',
    'wizard.stepPoints': 'Points',
    'wizard.stepSettings': 'Settings',
    'wizard.defaultTitle': 'Americano {date}',

    'wizard.formatTitle': 'Select the tournament format',
    'wizard.formatClassicDescription': 'Everyone partners with every other player exactly once. Partners change every round.',
    'wizard.formatTeamDescription': 'Fixed teams of two. Every team plays once against every other team.',

    'wizard.playersTitle': 'Players',
    'wizard.playerName': 'Player name',
    'wizard.nameRequired': 'Please enter a name.',
    'wizard.nameDuplicate': '"{name}" has already been added.',
    'wizard.playerCountInvalid': 'The player count has to be divisible by 4 and at least 4. Currently: {count}',
    'wizard.teamsInvalid': 'Assign two players and a unique name to every team.',
    'wizard.readyClassic': '{players} players. Ready to continue.',
    'wizard.readyTeam': '{players} players, {teams} teams. Ready to continue.',
    'wizard.noPlayers': 'No players added yet.',
    'wizard.nameColumn': 'Name',
    'wizard.removePlayer': 'Remove {name}',
    'wizard.teamPlayerLabel': '{team} player {number}',
    'wizard.selectPlayer': '— select player —',
    'wizard.teamsTitle': 'Teams',
    'wizard.randomPairing': 'Random pairing',
    'wizard.teamNameLabel': 'Name of team {number}',

    'wizard.pointsTitle': 'Points',
    'wizard.perRoundInvalid': 'Points per round must be a whole number between 1 and 999.',
    'wizard.wtlInvalid': 'Win, tie and loss points must be whole numbers between 0 and 999.',
    'wizard.perRoundTitle': 'Points per round',
    'wizard.perRoundDescription': 'Both scores of a match always add up to this number.',
    'wizard.perRoundInput': 'Points per round (1–999)',
    'wizard.wtlTitle': 'Win / Tie / Loss Points',
    'wizard.wtlDescription': 'Points granted to each player for the result of a match.',
    'wizard.win': 'Win',
    'wizard.tie': 'Tie',
    'wizard.loss': 'Loss',

    'wizard.settingsTitle': 'Settings',
    'wizard.titleRequired': 'Please enter a title.',
    'wizard.create': 'Create tournament',
    'wizard.titleLabel': 'Title',
    'wizard.titlePlaceholder': 'Tournament title',
    'wizard.rankMode': 'Rank mode',
    'wizard.tieBreak': 'Tie break',

    'details.fallbackTitle': 'Tournament',
    'details.notFound': 'Tournament not found',
    'details.delete': 'Delete tournament',
    'details.deleteTitle': 'Delete tournament?',
    'details.deleteMessage': '"{title}" and all its results will be deleted permanently.',
    'details.deleteConfirm': 'Delete',
    'details.leaderboardTab': 'Leaderboard',
    'details.roundTab': 'R{number}',
    'details.matchesPlayed': '{played} / {total} matches played',
    'details.columnRecord': 'W/T/L',
    'details.columnRecordHint': 'Wins / ties / losses',
    'details.columnPoints': 'Points',
    'details.columnPointsWtlHint': 'Points from wins / ties / losses',
    'details.columnDiff': '+/−',
    'details.rankingNote': 'Ranked by {rank}, tie break: {tieBreak}. ',
    'details.pointsNoteWtl': 'Win {win} · Tie {tie} · Loss {loss} points.',
    'details.pointsNotePerRound': '{perRound} points per round.',
    'details.winner': 'Winner',
    'details.jointWinners': 'Joint winners',
    'details.congratulations': 'Congratulations, {names}!',
    'details.round': 'Round {number}',
    'details.matchCount': { one: '{count} match', other: '{count} matches' },
    'details.match': 'Match {number}',
    'details.scoreLabel': 'Score {name}',
    'details.versus': 'VS',

    'results.points': { one: '{count} point', other: '{count} points' },
    'results.record': '{wins}W {ties}T {losses}L',

    'export.copy': 'Copy leaderboard',
    'export.copied': 'Copied!',
    'export.copyFailed': 'Copy failed',
    'export.leaderboardCsv': 'Leaderboard CSV',
    'export.matchesCsv': 'Matches CSV',
    'export.fileLeaderboard': 'leaderboard',
    'export.fileMatches': 'matches',
    'export.fileFallback': 'tournament',

    'csv.rank': 'Rank',
    'csv.members': 'Members',
    'csv.wins': 'Wins',
    'csv.ties': 'Ties',
    'csv.losses': 'Losses',
    'csv.points': 'Points',
    'csv.diff': 'Point difference',
    'csv.round': 'Round',
    'csv.match': 'Match',
    'csv.teamPlayer': 'Team {team} Player {player}',
    'csv.score': 'Score {number}',
  },

  de: {
    'language.name': 'Deutsch',
    'app.title': 'Padel-Turnier-Manager',

    'common.ok': 'OK',
    'common.cancel': 'Abbrechen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.add': 'Hinzufügen',
    'common.backToTournaments': 'Zurück zu den Turnieren',
    'common.team': 'Team',
    'common.player': 'Spieler',
    'common.teamNumber': 'Team {number}',

    'format.classic': 'Klassisches Americano',
    'format.team': 'Team-Americano',

    'status.open': 'Offen',
    'status.finished': 'Beendet',

    'rank.points': 'Gewonnene Punkte',
    'rank.wins': 'Anzahl Siege',
    'rank.diff': 'Punktedifferenz',

    'settings.title': 'Einstellungen',
    'settings.theme': 'Darstellung',
    'settings.themeDark': 'Dunkel',
    'settings.themeLight': 'Hell',
    'settings.language': 'Sprache',

    'list.title': 'Turniere',
    'list.settings': 'Einstellungen',
    'list.addTournament': 'Turnier hinzufügen',
    'list.emptyTitle': 'Noch keine Turniere',
    'list.emptyHint': 'Tippe auf „+“, um dein erstes Turnier anzulegen.',
    'list.players': { one: 'Spieler', other: 'Spieler' },
    'list.matches': { one: 'Spiel', other: 'Spiele' },

    'wizard.title': 'Turnier hinzufügen',
    'wizard.discard': 'Turnier verwerfen',
    'wizard.discardTitle': 'Turnier verwerfen?',
    'wizard.discardMessage': 'Möchtest du das konfigurierte Turnier wirklich verwerfen?',
    'wizard.discardConfirm': 'Verwerfen',
    'wizard.stepFormat': 'Format',
    'wizard.stepPlayers': 'Spieler',
    'wizard.stepPoints': 'Punkte',
    'wizard.stepSettings': 'Einstellungen',
    'wizard.defaultTitle': 'Americano {date}',

    'wizard.formatTitle': 'Wähle das Turnierformat',
    'wizard.formatClassicDescription': 'Alle spielen genau einmal mit jedem anderen Spieler zusammen. Die Partner wechseln jede Runde.',
    'wizard.formatTeamDescription': 'Feste Zweierteams. Jedes Team spielt einmal gegen jedes andere Team.',

    'wizard.playersTitle': 'Spieler',
    'wizard.playerName': 'Name des Spielers',
    'wizard.nameRequired': 'Bitte gib einen Namen ein.',
    'wizard.nameDuplicate': '„{name}“ wurde bereits hinzugefügt.',
    'wizard.playerCountInvalid': 'Die Spielerzahl muss durch 4 teilbar und mindestens 4 sein. Aktuell: {count}',
    'wizard.teamsInvalid': 'Weise jedem Team zwei Spieler und einen eindeutigen Namen zu.',
    'wizard.readyClassic': '{players} Spieler. Bereit zum Fortfahren.',
    'wizard.readyTeam': '{players} Spieler, {teams} Teams. Bereit zum Fortfahren.',
    'wizard.noPlayers': 'Noch keine Spieler hinzugefügt.',
    'wizard.nameColumn': 'Name',
    'wizard.removePlayer': '{name} entfernen',
    'wizard.teamPlayerLabel': '{team} Spieler {number}',
    'wizard.selectPlayer': '— Spieler auswählen —',
    'wizard.teamsTitle': 'Teams',
    'wizard.randomPairing': 'Zufällig zuordnen',
    'wizard.teamNameLabel': 'Name von Team {number}',

    'wizard.pointsTitle': 'Punkte',
    'wizard.perRoundInvalid': 'Die Punkte pro Runde müssen eine ganze Zahl zwischen 1 und 999 sein.',
    'wizard.wtlInvalid': 'Die Punkte für Sieg, Unentschieden und Niederlage müssen ganze Zahlen zwischen 0 und 999 sein.',
    'wizard.perRoundTitle': 'Punkte pro Runde',
    'wizard.perRoundDescription': 'Die beiden Ergebnisse eines Spiels ergeben zusammen immer diese Zahl.',
    'wizard.perRoundInput': 'Punkte pro Runde (1–999)',
    'wizard.wtlTitle': 'Punkte für Sieg / Unentschieden / Niederlage',
    'wizard.wtlDescription': 'Punkte, die jeder Spieler für das Ergebnis eines Spiels erhält.',
    'wizard.win': 'Sieg',
    'wizard.tie': 'Unentschieden',
    'wizard.loss': 'Niederlage',

    'wizard.settingsTitle': 'Einstellungen',
    'wizard.titleRequired': 'Bitte gib einen Titel ein.',
    'wizard.create': 'Turnier erstellen',
    'wizard.titleLabel': 'Titel',
    'wizard.titlePlaceholder': 'Turniertitel',
    'wizard.rankMode': 'Rangfolge nach',
    'wizard.tieBreak': 'Tie-Break',

    'details.fallbackTitle': 'Turnier',
    'details.notFound': 'Turnier nicht gefunden',
    'details.delete': 'Turnier löschen',
    'details.deleteTitle': 'Turnier löschen?',
    'details.deleteMessage': '„{title}“ und alle Ergebnisse werden endgültig gelöscht.',
    'details.deleteConfirm': 'Löschen',
    'details.leaderboardTab': 'Rangliste',
    'details.roundTab': 'R{number}',
    'details.matchesPlayed': '{played} / {total} Spiele gespielt',
    'details.columnRecord': 'S/U/N',
    'details.columnRecordHint': 'Siege / Unentschieden / Niederlagen',
    'details.columnPoints': 'Punkte',
    'details.columnPointsWtlHint': 'Punkte aus Siegen / Unentschieden / Niederlagen',
    'details.columnDiff': '+/−',
    'details.rankingNote': 'Rangfolge: {rank}, Tie-Break: {tieBreak}. ',
    'details.pointsNoteWtl': 'Sieg {win} · Unentschieden {tie} · Niederlage {loss} Punkte.',
    'details.pointsNotePerRound': '{perRound} Punkte pro Runde.',
    'details.winner': 'Sieger',
    'details.jointWinners': 'Gemeinsame Sieger',
    'details.congratulations': 'Herzlichen Glückwunsch, {names}!',
    'details.round': 'Runde {number}',
    'details.matchCount': { one: '{count} Spiel', other: '{count} Spiele' },
    'details.match': 'Spiel {number}',
    'details.scoreLabel': 'Ergebnis {name}',
    'details.versus': 'VS',

    'results.points': { one: '{count} Punkt', other: '{count} Punkte' },
    'results.record': '{wins}S {ties}U {losses}N',

    'export.copy': 'Rangliste kopieren',
    'export.copied': 'Kopiert!',
    'export.copyFailed': 'Kopieren fehlgeschlagen',
    'export.leaderboardCsv': 'Rangliste als CSV',
    'export.matchesCsv': 'Spiele als CSV',
    'export.fileLeaderboard': 'Rangliste',
    'export.fileMatches': 'Spiele',
    'export.fileFallback': 'Turnier',

    'csv.rank': 'Rang',
    'csv.members': 'Mitglieder',
    'csv.wins': 'Siege',
    'csv.ties': 'Unentschieden',
    'csv.losses': 'Niederlagen',
    'csv.points': 'Punkte',
    'csv.diff': 'Punktedifferenz',
    'csv.round': 'Runde',
    'csv.match': 'Spiel',
    'csv.teamPlayer': 'Team {team} Spieler {player}',
    'csv.score': 'Ergebnis {number}',
  },
};

const DEFAULT_LANGUAGE = 'en';

let language = DEFAULT_LANGUAGE;

/** The selectable languages, each named in its own language. */
export const LANGUAGES = Object.keys(TRANSLATIONS).map((code) => ({ code, name: TRANSLATIONS[code]['language.name'] }));

export function currentLanguage() {
  return language;
}

export function applyLanguage(code) {
  language = Object.hasOwn(TRANSLATIONS, code) ? code : DEFAULT_LANGUAGE;
  document.documentElement.setAttribute('lang', language);
  document.title = tr('app.title');
}

/** Returns the text for `key` in the current language with its `{placeholders}` filled in. */
export function tr(key, params = {}) {
  const entry = TRANSLATIONS[language][key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
  const text = typeof entry === 'string'
    ? entry
    : entry[new Intl.PluralRules(language).select(params.count)] ?? entry.other;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
