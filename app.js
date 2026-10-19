/* Jam Bingo UI and networking. Rules live in src/game.js. */
const G = window.JamGame;
const TRYSTERO = 'https://cdn.jsdelivr.net/npm/trystero@0.26.0/+esm';
const APP_ID = 'net.zero3creatives.jambingo';
const $app = document.getElementById('app');
const LETTERS = 'BINGO';
const BOT_NAMES = ['Nova', 'Pixel', 'Echo', 'Byte', 'Rune'];
const rng = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const letterFor = n => LETTERS[Math.min(4, Math.floor((n - 1) / 15))];

let S = {
  screen: 'home', role: null, g: null, myId: 'me', name: localStorage.getItem('jb_name') || '',
  aim: false, err: '', toast: '', code: '', sendState: null, sendAct: null, room: null, selfId: null,
  prev: null, lastCallAt: 0, lastCalls: 0, hostId: null, timers: [], botMem: {}, calledAt: {}, joinTimer: null
};

/* ---------- host side: the host's browser runs the whole game ---------- */
function hostPush() {
  if (S.sendState) S.sendState(G.publicView(S.g));
  onState(G.publicView(S.g));
}
function hostAct(act, from) {
  const g = S.g; let r = { ok: true };
  if (act.t === 'hello') {
    if (g.status === 'lobby') G.addPlayer(g, from, act.name);
  } else if (act.t === 'mark') r = G.mark(g, from, act.i);
  else if (act.t === 'jam') r = G.jam(g, from, act.to, act.i);
  else if (act.t === 'claim') r = G.claim(g, from);
  if (g.status === 'over') stopTimers();
  hostPush();
  return r;
}
function stopTimers() { S.timers.forEach(clearInterval); S.timers = []; }
function hostStartGame() {
  if (!G.start(S.g, rng)) return;
  S.calledAt = {}; S.botMem = {};
  S.g.players.filter(p => p.bot).forEach(p => {
    S.botMem[p.id] = { react: 1300 + rng() * 2200, nextJam: Date.now() + 7000 + rng() * 6000, lastMark: 0 };
  });
  hostPush();
  stopTimers();
  setTimeout(() => hostCall(), 1200);
  S.timers.push(setInterval(hostCall, S.g.speed));
  S.timers.push(setInterval(botTick, 500));
}
function hostCall() {
  const n = G.callNext(S.g);
  if (n === null) { stopTimers(); }
  else S.calledAt[n] = Date.now();
  hostPush();
}
function botTick() {
  const g = S.g; if (g.status !== 'playing') return;
  const now = Date.now(); let changed = false;
  g.players.filter(p => p.bot).forEach(b => {
    const m = S.botMem[b.id]; if (!m || g.status !== 'playing') return;
    for (let i = 0; i < 25; i++) {
      const n = b.card[i];
      if (!b.marks[i] && !(b.burned && b.burned[i]) && n && S.calledAt[n] && now - S.calledAt[n] > m.react && G.freezeLeft(g, b, i) === 0) {
        if (G.mark(g, b.id, i).ok) { m.lastMark = now; changed = true; }
        break;
      }
    }
    if (G.lineOf(b) && now - m.lastMark > 700) {
      if (G.claim(g, b.id).ok) { changed = true; stopTimers(); }
    }
    if (g.status === 'playing' && b.jams > 0 && now > m.nextJam) {
      m.nextJam = now + 7000 + rng() * 8000;
      const foes = g.players.filter(p => p.id !== b.id).sort((x, y) => G.bestLineProgress(y) - G.bestLineProgress(x));
      const foe = foes[0];
      if (foe) {
        let best = null, bestScore = -1;
        G.LINES.forEach(l => {
          const done = l.filter(i => foe.marks[i]).length;
          if (done === 5) return;
          const open = l.filter(i => !foe.marks[i] && !(foe.burned && foe.burned[i]) && G.freezeLeft(g, foe, i) === 0);
          if (!open.length) return;
          const score = done + rng() * 0.8;
          if (score > bestScore) { bestScore = score; best = open; }
        });
        if (best) {
          const hot = best.filter(i => g.calls.indexOf(foe.card[i]) >= 0);
          const pick = (hot.length ? hot : best)[Math.floor(rng() * (hot.length || best.length))];
          if (G.jam(g, b.id, foe.id, pick).ok) changed = true;
        }
      }
    }
  });
  if (changed) hostPush();
}

/* ---------- screens ---------- */
function setScreen(s) { S.screen = s; render(); }
function onState(view) {
  const old = S.g && S.role !== 'host' && S.role !== 'solo' ? S.g : null;
  if (S.role === 'host' || S.role === 'solo') {
    /* host keeps its own authoritative copy in S.g; view is only used to render */
  } else S.g = view;
  const g = (S.role === 'host' || S.role === 'solo') ? S.g : view;
  if (g.calls.length !== S.lastCalls) { S.lastCalls = g.calls.length; S.lastCallAt = Date.now(); S.newBall = true; }
  if (S.role === 'client' && S.joinTimer) { clearTimeout(S.joinTimer); S.joinTimer = null; S.err = ''; }
  if (g.status === 'playing' || g.status === 'over') S.screen = 'game';
  else if (S.screen === 'game') { S.screen = 'lobby'; S.aim = false; }
  else if (S.screen === 'home' && S.role) S.screen = 'lobby';
  render();
}

function render() {
  const g = S.g;
  if (S.screen === 'home') return renderHome();
  if (S.screen === 'lobby') return renderLobby();
  if (S.screen === 'game') return renderGame();
}

function renderHome() {
  const q = new URLSearchParams(location.search).get('room') || '';
  $app.innerHTML = `
  <div class="home">
   <section class="card">
    <h2>Play</h2>
    <label for="nm">Your name</label>
    <input type="text" id="nm" maxlength="14" placeholder="Name" value="${esc(S.name)}" autocomplete="off">
    <div class="row" style="margin-top:14px">
      <button class="btn pri grow" id="mk">Create a room</button>
      <button class="btn grow" id="bot">Play a bot</button>
    </div>
    <label for="cd">Got a code from a friend?</label>
    <div class="row"><input type="text" id="cd" class="grow" maxlength="4" placeholder="ABCD" value="${esc(q.toUpperCase().slice(0, 4))}" autocomplete="off" style="text-transform:uppercase;letter-spacing:4px"><button class="btn" id="jn">Join</button></div>
    <div class="err" id="err">${esc(S.err)}</div>
   </section>
   <section class="card">
    <h2>How it works</h2>
    <ol class="steps">
      <li>Everyone gets a Bingo card. A number is called every few seconds.</li>
      <li>Tap a number on your card once it has been called. The first full line wins, so press BINGO fast.</li>
      <li>The twist: you get 3 Jams. Hit JAM, then tap an unmarked square on a rival's card. If its number was already called, that square is out for the round. If not, it freezes for 2 calls, and if its number gets called while frozen, it is out too.</li>
      <li>Two players is a duel. One player plus a bot works too, handy for trying it alone.</li>
    </ol>
    <p class="note">I built this one for fun. It is free, there is no sign-up, and nothing goes through my server. Players connect straight to each other.</p>
   </section>
  </div>`;
  const nm = () => { S.name = document.getElementById('nm').value.trim().slice(0, 14) || 'Player'; localStorage.setItem('jb_name', S.name); };
  document.getElementById('bot').onclick = () => { nm(); startSolo(); };
  document.getElementById('mk').onclick = () => { nm(); startHost(); };
  document.getElementById('jn').onclick = () => { nm(); startClient(document.getElementById('cd').value.trim().toUpperCase()); };
  if (q) document.getElementById('cd').focus();
}

function renderLobby() {
  const g = S.g, host = S.role === 'host' || S.role === 'solo';
  const link = location.origin + location.pathname + '?room=' + g.code;
  $app.innerHTML = `
  <section class="card">
    ${S.role === 'solo' ? '<h2>You vs the bot</h2>' : `<h2>Room code</h2><div class="code">${esc(g.code)}</div>
    <p class="note">Send this code, or the link, to your friends. Keep this tab open, it hosts the game.</p>
    ${host ? '<div class="row"><button class="btn" id="cp">Copy invite link</button></div>' : ''}`}
    <div class="chips">${g.players.map(p => `<span class="chip"><i class="dot" style="background:${p.color}"></i>${esc(p.name)}${p.id === S.myId ? ' <small>you</small>' : ''}${p.bot ? ' <small>bot</small>' : ''}</span>`).join('')}</div>
    ${host ? `<div class="row">
      ${S.role === 'host' ? '<button class="btn" id="ab">Add a bot</button>' : ''}
      <label style="margin:0">Call speed <select id="sp"><option value="5500">Calm</option><option value="4000">Normal</option><option value="2500">Fast</option></select></label>
      <button class="btn pri" id="go" ${g.players.length < 2 ? 'disabled' : ''}>Start game</button>
    </div>
    <p class="note">${g.players.length < 2 ? 'Waiting for at least one more player.' : 'Up to 6 can play.'}</p>`
      : '<p class="note">You are in. Waiting for the host to start.</p>'}
    <div><button class="btn" id="lv" style="margin-top:8px">Leave</button></div>
  </section>`;
  const $ = id => document.getElementById(id);
  if ($('sp')) { $('sp').value = String(g.speed); $('sp').onchange = e => { g.speed = +e.target.value; hostPush(); }; }
  if ($('cp')) $('cp').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link); toast('Link copied'); };
  if ($('ab')) $('ab').onclick = () => { const used = g.players.filter(p => p.bot).length; G.addPlayer(g, 'bot-' + (used + 1) + '-' + Date.now() % 1000, BOT_NAMES[used % BOT_NAMES.length], true); hostPush(); };
  if ($('go')) $('go').onclick = hostStartGame;
  $('lv').onclick = leave;
}

function cardHtml(p, mine, g) {
  const lastN = g.calls.length;
  const win = g.winner && g.winner.id === p.id ? g.winner.line : [];
  let h = '';
  if (mine) h += '<div class="hdr">' + [...LETTERS].map(l => `<span>${l}</span>`).join('') + '</div>';
  h += '<div class="grid5">';
  for (let i = 0; i < 25; i++) {
    const n = p.card[i], on = p.marks[i], fl = G.freezeLeft(g, p, i);
    const burned = !on && p.burned && p.burned[i];
    const called = n && g.calls.indexOf(n) >= 0;
    const cls = ['sq'];
    if (n === 0) cls.push('free', 'on');
    else if (on) cls.push('on');
    else if (burned) cls.push('burned');
    else if (fl > 0) cls.push('frozen');
    else if (called && mine) cls.push('called');
    if (win.indexOf(i) >= 0) cls.push('win');
    const isNew = S.prev && S.prev[p.id] && S.prev[p.id].marks[i] !== on && on;
    h += `<button class="${cls.join(' ')}" data-p="${esc(p.id)}" data-i="${i}" ${fl > 0 && !burned ? `data-f="${fl}"` : ''}>${n === 0 ? 'FREE' : n}</button>`;
  }
  return h + '</div>';
}

function renderGame() {
  const g = S.g, me = G.find(g, S.myId);
  const rivals = g.players.filter(p => p.id !== S.myId);
  const last = g.calls[g.calls.length - 1];
  const hist = g.calls.slice(-9, -1).reverse();
  const over = g.status === 'over';
  const ready = me && !over && !!G.lineOf(me);
  const elapsed = Date.now() - S.lastCallAt;
  $app.innerHTML = `
  <div class="play ${S.aim ? 'aim' : ''}">
   <div>
    <div class="ballbox">
      <div class="ball ${last ? (S.newBall ? 'drop' : '') : 'wait'}">${last ? `<i>${letterFor(last)}</i><b>${last}</b>` : '<b>?</b>'}</div>
      <div><div class="meta">${last ? 'Call ' + g.calls.length + ' of 75' : 'First number coming'}</div><div class="hist">${hist.map(n => `<span>${letterFor(n)}${n}</span>`).join('') || '<span class="tiny" style="border:0">Earlier calls show here</span>'}</div></div>
      ${!over && last ? `<div class="bar" style="animation-duration:${g.speed}ms;animation-delay:-${Math.min(elapsed, g.speed)}ms"></div>` : ''}
    </div>
    ${me ? `<div class="me">
      <div class="top"><h3>${esc(me.name)}</h3><span class="tiny">Jams left: ${me.jams}</span><span class="sp"></span>
        <button class="jbtn ${S.aim ? 'on' : ''}" id="jm" ${me.jams < 1 || over ? 'disabled' : ''}>${S.aim ? 'Cancel' : 'JAM (' + me.jams + ')'}</button>
        <button class="bingo ${ready ? 'ready' : ''}" id="bg" ${over ? 'disabled' : ''}>BINGO</button></div>
      ${cardHtml(me, true, g)}
      <p class="note">${S.aim ? 'Now tap a square on a rival card. A called number gets knocked out, any other freezes for 2 calls.' : 'Tap a number once it has been called. Called numbers glow.'}</p>
    </div>` : '<p class="note">You are watching this round.</p>'}
   </div>
   <div>${rivals.map(p => `<div class="rival"><div class="top"><i class="dot" style="background:${p.color}"></i><h4>${esc(p.name)}${p.bot ? ' (bot)' : ''}</h4><span class="sp"></span><span class="tiny">Jams ${p.jams}</span></div>${cardHtml(p, false, g)}</div>`).join('')}</div>
  </div>
  ${over ? overlay(g, me) : ''}
  ${S.toast ? `<div class="toast">${esc(S.toast)}</div>` : ''}`;
  S.newBall = false;
  S.prev = Object.fromEntries(g.players.map(p => [p.id, { marks: p.marks.slice() }]));
  const $ = id => document.getElementById(id);
  if ($('jm')) $('jm').onclick = () => { S.aim = !S.aim; render(); };
  if ($('bg')) $('bg').onclick = () => { act({ t: 'claim' }, r => { if (!r.ok) { toast('No full line yet'); const b = $('bg'); if (b) { b.classList.add('shake'); } } }); };
  document.querySelectorAll('.sq').forEach(el => el.onclick = () => squareTap(el));
  if ($('again')) $('again').onclick = () => { G.toLobby(S.g); S.aim = false; S.screen = 'lobby'; S.lastCalls = 0; hostPush(); };
  if ($('lv2')) $('lv2').onclick = leave;
}

function overlay(g, me) {
  const w = G.find(g, g.winner && g.winner.id), mine = w && w.id === S.myId, host = S.role === 'host' || S.role === 'solo';
  return `<div class="over"><div class="box"><h2>${w ? (mine ? 'BINGO! You win' : esc(w.name) + ' wins') : 'Round over'}</h2>
  <p class="note">${mine ? 'Nice and fast.' : 'Their line is lit up white on their card.'}</p>
  <div class="row" style="justify-content:center;margin-top:14px">${host ? '<button class="btn pri" id="again">Play again</button>' : '<span class="tiny">Waiting for the host</span>'}<button class="btn" id="lv2">Leave</button></div></div></div>`;
}

function squareTap(el) {
  const pid = el.dataset.p, i = +el.dataset.i, g = S.g;
  if (g.status !== 'playing') return;
  if (pid === S.myId) {
    act({ t: 'mark', i }, r => {
      if (!r.ok) {
        const m = { notcalled: 'That number has not been called yet', frozen: 'That square is frozen', missed: 'That square is out. Its number was called while it was jammed', done: '' }[r.why];
        if (m) toast(m);
        el.classList.add('shake');
      }
    });
  } else if (S.aim) {
    act({ t: 'jam', to: pid, i }, r => {
      if (r.ok) { S.aim = false; toast(r.burned ? 'Number knocked out' : 'Jammed for 2 calls'); } else toast({ target: 'Pick an unmarked square', already: 'Already frozen', nojams: 'No jams left' }[r.why] || 'Cannot jam that');
    });
  }
}

/* send an action: the host applies it straight away, clients ask the host and render when the new state arrives */
function act(a, cb) {
  if (S.role === 'host' || S.role === 'solo') { const r = hostAct(a, S.myId); cb && cb(r); }
  else if (S.sendAct) {
    S.sendAct(a);
    if (cb) cb({ ok: true, pending: true }); /* result comes back as a toast message */
  }
}
let toastT;
function toast(m) { S.toast = m; render(); clearTimeout(toastT); toastT = setTimeout(() => { S.toast = ''; render(); }, 1600); }

/* ---------- starting, joining, leaving ---------- */
function newCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 4; i++) s += a[Math.floor(rng() * a.length)]; return s; }

function startSolo() {
  S.role = 'solo'; S.myId = 'me'; S.g = G.newGame('SOLO', 4000);
  G.addPlayer(S.g, 'me', S.name); G.addPlayer(S.g, 'bot-1', BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)], true);
  S.lastCalls = 0; setScreen('lobby');
}

async function loadNet() {
  const m = await import(TRYSTERO);
  return m;
}
function hookRoom(room, handlers) {
  const a = room.makeAction('jb');
  let send;
  if (Array.isArray(a)) { send = a[0]; a[1]((d, pid) => handlers.msg(d, pid)); }
  else { send = (d, t) => a.send(d, t); a.onMessage = (d, meta) => handlers.msg(d, meta && meta.peerId ? meta.peerId : meta); }
  room.onPeerJoin = pid => handlers.join && handlers.join(pid);
  room.onPeerLeave = pid => handlers.leave && handlers.leave(pid);
  return send;
}

async function startHost() {
  S.err = ''; renderHome(); const e = document.getElementById('err'); if (e) e.textContent = 'Opening your room...';
  let net;
  try { net = await loadNet(); } catch (x) { return fail('Could not load the connection library. Check your internet and try again.'); }
  const code = newCode();
  S.role = 'host'; S.myId = net.selfId; S.g = G.newGame(code, 4000);
  G.addPlayer(S.g, S.myId, S.name);
  const room = net.joinRoom({ appId: APP_ID }, 'jb-' + code);
  S.room = room;
  const send = hookRoom(room, {
    msg: (d, pid) => {
      if (!d || typeof d !== 'object') return;
      if (d.t === 'ping') { hostPush(); return; }
      const r = hostAct(d, pid);
      if (!r.ok && d.t !== 'hello') send({ t: 'res', to: pid, why: r.why, kind: d.t }, pid);
    },
    join: pid => { send({ t: 'st', g: G.publicView(S.g), host: S.myId }, pid); },
    leave: pid => {
      if (S.g.status === 'lobby') G.removePlayer(S.g, pid);
      else { const p = G.find(S.g, pid); if (p) p.gone = true; }
      hostPush();
    }
  });
  S.sendState = v => send({ t: 'st', g: v, host: S.myId });
  S.lastCalls = 0; setScreen('lobby');
}

async function startClient(code) {
  if (!/^[A-Z]{4}$/.test(code)) { S.err = 'The code is 4 letters.'; return renderHome(); }
  S.err = ''; renderHome(); document.getElementById('err').textContent = 'Looking for the room...';
  let net;
  try { net = await loadNet(); } catch (x) { return fail('Could not load the connection library. Check your internet and try again.'); }
  S.role = 'client'; S.myId = net.selfId; S.g = null;
  const room = net.joinRoom({ appId: APP_ID }, 'jb-' + code);
  S.room = room;
  const hello = () => S.sendAct && S.sendAct({ t: 'hello', name: S.name });
  const send = hookRoom(room, {
    msg: (d, pid) => {
      if (!d) return;
      if (d.t === 'st') {
        S.hostId = d.host;
        const first = !S.g;
        S.g = d.g;
        if (first || !G.find(S.g, S.myId)) { if (!G.find(S.g, S.myId)) hello(); }
        onState(d.g);
      } else if (d.t === 'res' && d.to === S.myId) {
        const m = { notcalled: 'That number has not been called yet', frozen: 'That square is frozen', missed: 'That square is out. Its number was called while it was jammed', target: 'Pick an unmarked square', already: 'Already frozen', nojams: 'No jams left' }[d.why];
        if (m) toast(m);
      }
    },
    join: pid => { hello(); }
  });
  S.sendAct = a => send(a);
  S.joinTimer = setTimeout(() => { fail('Could not find that room. Check the code, make sure the host still has the tab open, and try again. Some work or school networks block this.'); }, 20000);
  const again = setInterval(() => { if (S.g && G.find(S.g, S.myId)) clearInterval(again); else hello(); }, 2000);
  S.timers.push(again);
}
function fail(msg) {
  leave(true); S.err = msg; render();
}
function leave(keepErr) {
  stopTimers(); clearTimeout(S.joinTimer);
  try { S.room && S.room.leave(); } catch (e) { }
  S.room = null; S.sendState = null; S.sendAct = null; S.role = null; S.g = null; S.aim = false; S.lastCalls = 0; S.prev = null;
  if (keepErr !== true) S.err = '';
  S.screen = 'home'; history.replaceState(null, '', location.pathname); render();
}

render();
window.__jb = S; /* handy when testing */
