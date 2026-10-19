/* Jam Bingo game rules. No browser code in here, so Node can test it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JamGame = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var JAMS_EACH = 3, FREEZE_CALLS = 2, MAX_PLAYERS = 6;
  var COLORS = ['#3d7bff', '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#f87171'];
  var LINES = [];
  (function () {
    var i, r, c, l;
    for (r = 0; r < 5; r++) { l = []; for (c = 0; c < 5; c++) l.push(r * 5 + c); LINES.push(l); }
    for (c = 0; c < 5; c++) { l = []; for (r = 0; r < 5; r++) l.push(r * 5 + c); LINES.push(l); }
    LINES.push([0, 6, 12, 18, 24]); LINES.push([4, 8, 12, 16, 20]);
  })();

  function shuffle(a, rng) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function makeCard(rng) {
    var cols = [], c, r, n, card = new Array(25);
    for (c = 0; c < 5; c++) {
      var pool = [];
      for (n = 1; n <= 15; n++) pool.push(c * 15 + n);
      cols.push(shuffle(pool, rng).slice(0, 5));
    }
    for (r = 0; r < 5; r++) for (c = 0; c < 5; c++) card[r * 5 + c] = cols[c][r];
    card[12] = 0;
    return card;
  }
  function newGame(code, speedMs) {
    return { code: code, status: 'lobby', speed: speedMs || 4000, players: [], calls: [], winner: null, round: 0 };
  }
  function find(g, id) {
    for (var i = 0; i < g.players.length; i++) if (g.players[i].id === id) return g.players[i];
    return null;
  }
  function addPlayer(g, id, name, bot) {
    if (find(g, id)) return find(g, id);
    if (g.players.length >= MAX_PLAYERS || g.status !== 'lobby') return null;
    var used = g.players.map(function (p) { return p.color; });
    var color = COLORS.filter(function (c) { return used.indexOf(c) < 0; })[0] || COLORS[0];
    var p = { id: id, name: String(name || 'Player').slice(0, 14), bot: !!bot, color: color, card: [], marks: [], jams: JAMS_EACH, jammed: {}, burned: [] };
    g.players.push(p);
    return p;
  }
  function removePlayer(g, id) {
    g.players = g.players.filter(function (p) { return p.id !== id; });
  }
  function start(g, rng) {
    if (g.players.length < 2) return false;
    g.status = 'playing'; g.calls = []; g.winner = null; g.round++;
    g.pool = shuffle(Array.apply(null, Array(75)).map(function (_, i) { return i + 1; }), rng);
    g.players.forEach(function (p) {
      p.card = makeCard(rng); p.marks = p.card.map(function (n) { return n === 0; });
      p.jams = JAMS_EACH; p.jammed = {}; p.burned = p.card.map(function () { return false; });
    });
    return true;
  }
  function callNext(g) {
    if (g.status !== 'playing' || !g.pool || !g.pool.length) return null;
    var n = g.pool.shift();
    g.calls.push(n);
    /* a number called while its square is frozen is out for the rest of the round */
    g.players.forEach(function (p) {
      for (var i = 0; i < 25; i++) {
        if (!p.marks[i] && p.card[i] === n && freezeLeft(g, p, i) > 0) p.burned[i] = true;
      }
    });
    return n;
  }
  function freezeLeft(g, p, i) {
    var u = p.jammed[i];
    return u === undefined ? 0 : Math.max(0, u - g.calls.length);
  }
  function mark(g, pid, i) {
    var p = find(g, pid);
    if (g.status !== 'playing' || !p || !(i >= 0 && i < 25)) return { ok: false, why: 'state' };
    if (p.marks[i]) return { ok: false, why: 'done' };
    if (p.burned && p.burned[i]) return { ok: false, why: 'missed' };
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JamGame = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var JAMS_EACH = 3, FREEZE_CALLS = 2, MAX_PLAYERS = 6;
  var COLORS = ['#3d7bff', '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#f87171'];
  var LINES = [];
  (function () {
    var i, r, c, l;
    for (r = 0; r < 5; r++) { l = []; for (c = 0; c < 5; c++) l.push(r * 5 + c); LINES.push(l); }
    for (c = 0; c < 5; c++) { l = []; for (r = 0; r < 5; r++) l.push(r * 5 + c); LINES.push(l); }
    LINES.push([0, 6, 12, 18, 24]); LINES.push([4, 8, 12, 16, 20]);
  })();

  function shuffle(a, rng) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function makeCard(rng) {
    var cols = [], c, r, n, card = new Array(25);
    for (c = 0; c < 5; c++) {
      var pool = [];
      for (n = 1; n <= 15; n++) pool.push(c * 15 + n);
      cols.push(shuffle(pool, rng).slice(0, 5));
    }
    for (r = 0; r < 5; r++) for (c = 0; c < 5; c++) card[r * 5 + c] = cols[c][r];
    card[12] = 0;
    return card;
  }
  function newGame(code, speedMs) {
    return { code: code, status: 'lobby', speed: speedMs || 4000, players: [], calls: [], winner: null, round: 0 };
  }
  function find(g, id) {
    for (var i = 0; i < g.players.length; i++) if (g.players[i].id === id) return g.players[i];
    return null;
  }
  function addPlayer(g, id, name, bot) {
    if (find(g, id)) return find(g, id);
    if (g.players.length >= MAX_PLAYERS || g.status !== 'lobby') return null;
    var used = g.players.map(function (p) { return p.color; });
    var color = COLORS.filter(function (c) { return used.indexOf(c) < 0; })[0] || COLORS[0];
    var p = { id: id, name: String(name || 'Player').slice(0, 14), bot: !!bot, color: color, card: [], marks: [], jams: JAMS_EACH, jammed: {}, burned: [] };
    g.players.push(p);
    return p;
  }
  function removePlayer(g, id) {
    g.players = g.players.filter(function (p) { return p.id !== id; });
  }
  function start(g, rng) {
    if (g.players.length < 2) return false;
    g.status = 'playing'; g.calls = []; g.winner = null; g.round++;
    g.pool = shuffle(Array.apply(null, Array(75)).map(function (_, i) { return i + 1; }), rng);
    g.players.forEach(function (p) {
      p.card = makeCard(rng); p.marks = p.card.map(function (n) { return n === 0; });
      p.jams = JAMS_EACH; p.jammed = {}; p.burned = p.card.map(function () { return false; });
    });
    return true;
  }
  function callNext(g) {
    if (g.status !== 'playing' || !g.pool || !g.pool.length) return null;
    var n = g.pool.shift();
    g.calls.push(n);
    /* a number called while its square is frozen is out for the rest of the round */
    g.players.forEach(function (p) {
      for (var i = 0; i < 25; i++) {
        if (!p.marks[i] && p.card[i] === n && freezeLeft(g, p, i) > 0) p.burned[i] = true;
      }
    });
    return n;
  }
  function freezeLeft(g, p, i) {
    var u = p.jammed[i];
    return u === undefined ? 0 : Math.max(0, u - g.calls.length);
  }
  function mark(g, pid, i) {
    var p = find(g, pid);
    if (g.status !== 'playing' || !p || !(i >= 0 && i < 25)) return { ok: false, why: 'state' };
    if (p.marks[i]) return { ok: false, why: 'done' };
    if (p.burned && p.burned[i]) return { ok: false, why: 'missed' };
    if (freezeLeft(g, p, i) > 0) return { ok: false, why: 'frozen' };
    if (g.calls.indexOf(p.card[i]) < 0) return { ok: false, why: 'notcalled' };
    p.marks[i] = true;
    return { ok: true };
  }
  function jam(g, byId, toId, i) {
    var by = find(g, byId), to = find(g, toId);
    if (g.status !== 'playing' || !by || !to || byId === toId) return { ok: false, why: 'state' };
    if (by.jams < 1) return { ok: false, why: 'nojams' };
    if (!(i >= 0 && i < 25) || to.marks[i] || (to.burned && to.burned[i])) return { ok: false, why: 'target' };
    if (freezeLeft(g, to, i) > 0) return { ok: false, why: 'already' };
    by.jams--;
    if (g.calls.indexOf(to.card[i]) >= 0) {
      /* its number was already called: the jam knocks it out for good */
      to.burned[i] = true;
      return { ok: true, burned: true };
    }
    to.jammed[i] = g.calls.length + FREEZE_CALLS;
    return { ok: true };
  }
  function lineOf(p) {
    for (var k = 0; k < LINES.length; k++) {
      if (LINES[k].every(function (i) { return p.marks[i]; })) return LINES[k];
    }
    return null;
  }
  function claim(g, pid) {
    var p = find(g, pid);
    if (g.status !== 'playing' || !p) return { ok: false };
    var l = lineOf(p);
    if (!l) return { ok: false };
    g.status = 'over'; g.winner = { id: pid, line: l };
    return { ok: true };
  }
  function toLobby(g) {
    g.status = 'lobby'; g.calls = []; g.winner = null; delete g.pool;
    g.players.forEach(function (p) { p.card = []; p.marks = []; p.jams = JAMS_EACH; p.jammed = {}; p.burned = []; });
  }
  /* what we send to everyone: no pool, so nobody can peek at upcoming numbers */
  function publicView(g) {
    var o = JSON.parse(JSON.stringify(g)); delete o.pool; return o;
  }
  function bestLineProgress(p) {
    var best = 0;
    LINES.forEach(function (l) {
      var c = l.filter(function (i) { return p.marks[i]; }).length; if (c > best) best = c;
    });
    return best;
  }
  return { LINES: LINES, MAX_PLAYERS: MAX_PLAYERS, JAMS_EACH: JAMS_EACH, FREEZE_CALLS: FREEZE_CALLS, makeCard: makeCard, newGame: newGame, find: find, addPlayer: addPlayer, removePlayer: removePlayer, start: start, callNext: callNext, freezeLeft: freezeLeft, mark: mark, jam: jam, lineOf: lineOf, claim: claim, toLobby: toLobby, publicView: publicView, bestLineProgress: bestLineProgress };
});
