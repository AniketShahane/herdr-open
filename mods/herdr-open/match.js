// The match: You against the Net, scored like real tennis.
// An agent finishing a turn wins you the point; an agent getting stuck
// (needing you) gives it to the Net. 15, 30, 40, deuce and advantage; six games
// a set with a tiebreak at six all; best of three sets. The serve changes
// every game. Kept in shared state so every part (and restarts) see one score.

export const MATCH = "herdr-open.match";

const NAME = ["You", "the Net"];
const WORD = ["Love", "Fifteen", "Thirty", "Forty"];
const ORD = ["first", "second", "third"];

export const fresh = (record = [0, 0]) => ({
  p: [0, 0], g: [0, 0], sets: [], tb: false, server: 0, done: null,
  call: "Love all. Play.", note: "", record,
});

// A plain copy: the match is plain JSON.
export const copy = (m) => JSON.parse(JSON.stringify(m ?? fresh()));

// What the point box shows for one side.
export function points(m, side) {
  const me = m.p[side], them = m.p[1 - side];
  if (m.tb) return String(me);
  if (me >= 3 && them >= 3) return me > them ? "AD" : "40";
  return ["0", "15", "30", "40"][me] ?? "0";
}

// One point to `who` (0 you, 1 the Net). Returns "point", "game", "set" or "match".
export function award(m, who, note) {
  if (m.done) Object.assign(m, fresh(m.record));
  const other = 1 - who;
  m.note = note ?? "";
  m.p[who]++;
  if (m.tb) {
    if (m.p[who] >= 7 && m.p[who] - m.p[other] >= 2) return game(m, who);
    const [a, b] = m.p;
    m.call = a === b ? `${a} all, tiebreak` : `${a}–${b}, tiebreak`;
    return "point";
  }
  if (m.p[who] >= 4 && m.p[who] - m.p[other] >= 2) return game(m, who);
  const [a, b] = m.p;
  if (a >= 3 && b >= 3) m.call = a === b ? "Deuce" : `Advantage, ${NAME[a > b ? 0 : 1]}`;
  else m.call = a === b ? `${WORD[a]} all` : `${WORD[a]}–${WORD[b]}`;
  return "point";
}

function game(m, who) {
  const other = 1 - who;
  m.g[who]++;
  m.p = [0, 0];
  m.server = 1 - m.server;
  if (m.tb || (m.g[who] >= 6 && m.g[who] - m.g[other] >= 2)) {
    m.sets.push([...m.g]);
    m.g = [0, 0];
    m.tb = false;
    const won = m.sets.filter((s) => s[who] > s[other]).length;
    if (won === 2) {
      m.record[who]++;
      m.done = who === 0 ? "won" : "lost";
      m.call = `Game, set and match, ${NAME[who]}`;
      return "match";
    }
    m.call = `Game and ${ORD[m.sets.length - 1]} set, ${NAME[who]}`;
    return "set";
  }
  m.tb = m.g[0] === 6 && m.g[1] === 6;
  m.call = m.tb ? `Game, ${NAME[who]}. Six all, tiebreak` : `Game, ${NAME[who]}`;
  return "game";
}
