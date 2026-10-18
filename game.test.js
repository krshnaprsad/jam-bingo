const assert = require('assert'); const G = require('./game.js');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const rng = () => Math.random();
for (let t = 0; t < 500; t++) {
  const c = G.makeCard(rng);
  ok(c[12] === 0, 'free centre');
  for (let col = 0; col < 5; col++) {
    const vals = [0, 1, 2, 3, 4].map(r => c[r * 5 + col]).filter(v => v);
    ok(new Set(vals).size === vals.length, 'unique in column');
    vals.forEach(v => ok(v > col * 15 && v <= col * 15 + 15, 'column range'));
  }
}
const g = G.newGame('ABCD', 4000);
G.addPlayer(g, 'a', 'Ann'); G.addPlayer(g, 'b', 'Bo', true);
ok(g.players.length === 2 && g.players[0].color !== g.players[1].color, 'players');
ok(G.start(g, rng), 'start'); ok(g.status === 'playing', 'playing');
const a = G.find(g, 'a'), b = G.find(g, 'b');
ok(!G.mark(g, 'a', 0).ok, 'cannot mark uncalled');
const seen = new Set(); for (let i = 0; i < 75; i++) { const x = G.callNext(g); ok(!seen.has(x), 'no repeat'); seen.add(x); }
ok(G.callNext(g) === null, 'pool empties');
// full flow on a fresh game
const h = G.newGame('WXYZ'); G.addPlayer(h, 'a', 'A'); G.addPlayer(h, 'b', 'B'); G.start(h, rng);
const A = G.find(h, 'a'), B = G.find(h, 'b');
G.callNext(h); G.callNext(h);
const first = h.calls[0]; const idx = A.card.indexOf(first);
if (idx >= 0) {
  ok(G.jam(h, 'b', 'a', idx).ok, 'jam works'); ok(B.jams === 2, 'jam used');
  ok(G.mark(h, 'a', idx).why === 'frozen', 'frozen blocks marking');
  ok(G.freezeLeft(h, A, idx) === 2, 'freeze 2');
  G.callNext(h); G.callNext(h);
  ok(G.freezeLeft(h, A, idx) === 0, 'thawed'); ok(G.mark(h, 'a', idx).ok, 'mark after thaw');
  ok(!G.jam(h, 'b', 'a', idx).ok, 'cannot jam a marked square');
}
ok(!G.jam(h, 'a', 'a', 0).ok, 'no self jam');
// win
while (h.pool.length) G.callNext(h);
for (let i = 0; i < 25; i++) G.mark(h, 'a', i);
ok(G.lineOf(A), 'line found'); ok(G.claim(h, 'a').ok, 'claim'); ok(h.status === 'over' && h.winner.id === 'a', 'winner');
ok(!G.claim(h, 'b').ok, 'second claim fails');
ok(!('pool' in G.publicView(h)), 'pool hidden');
G.toLobby(h); ok(h.status === 'lobby' && A.marks.length === 0, 'back to lobby');
ok(!G.claim(h, 'a').ok, 'no claim in lobby');
// no claim without line
const k = G.newGame('QQQQ'); G.addPlayer(k, 'a', 'A'); G.addPlayer(k, 'b', 'B'); G.start(k, rng);
ok(!G.claim(k, 'a').ok, 'no line, no win');
console.log(n + ' checks passed');
