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
  // jam a square whose number was already called: it is out for good
  const r = G.jam(h, 'b', 'a', idx); ok(r.ok && r.burned === true, 'jam on called number knocks it out'); ok(B.jams === 2, 'jam used');
  ok(A.burned[idx] === true, 'square burned');
  ok(G.mark(h, 'a', idx).why === 'missed', 'burned square cannot be marked');
  G.callNext(h); G.callNext(h);
  ok(G.freezeLeft(h, A, idx) === 0, 'no freeze left'); ok(G.mark(h, 'a', idx).why === 'missed', 'still out after the calls pass');
  ok(!G.jam(h, 'b', 'a', idx).ok, 'cannot jam a burned square');
}
// jam an uncalled square: frozen, and out if its number is called while frozen
{
  const unc = A.card.findIndex(n => n !== 0 && h.calls.indexOf(n) < 0);
  ok(unc >= 0, 'found uncalled square');
  const r = G.jam(h, 'b', 'a', unc); ok(r.ok && !r.burned, 'jam on uncalled number freezes');
  ok(G.freezeLeft(h, A, unc) === 2, 'freeze 2');
  ok(G.mark(h, 'a', unc).why === 'frozen', 'frozen blocks marking');
  // call until that number comes up (it is still in the pool), while frozen only for the next 2 calls
  let guard = 0;
  while (h.calls.indexOf(A.card[unc]) < 0 && guard++ < 80) G.callNext(h);
  const calledWhileFrozen = h.calls.indexOf(A.card[unc]) <= h.calls.length - 1;
  if (G.freezeLeft(h, A, unc) > 0 || A.burned[unc]) {
    ok(A.burned[unc] === true, 'number called while frozen is burned');
    ok(G.mark(h, 'a', unc).why === 'missed', 'cannot mark it later');
  } else {
    ok(G.mark(h, 'a', unc).ok, 'number called after thaw can be marked');
  }
}
// a square jammed and thawed before its number is called stays markable
{
  const k = G.newGame('KKKK'); G.addPlayer(k, 'x', 'X'); G.addPlayer(k, 'y', 'Y'); G.start(k, rng);
  const X = G.find(k, 'x');
  G.callNext(k);
  const tgt = X.card.findIndex(n => n !== 0 && k.calls.indexOf(n) < 0);
  ok(G.jam(k, 'y', 'x', tgt).ok, 'freeze uncalled square');
  G.callNext(k); G.callNext(k);
  ok(G.freezeLeft(k, X, tgt) === 0 && !X.burned[tgt], 'thawed and not burned');
  let guard = 0;
  while (k.calls.indexOf(X.card[tgt]) < 0 && guard++ < 80) G.callNext(k);
  ok(G.mark(k, 'x', tgt).ok, 'markable when called after thaw');
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
