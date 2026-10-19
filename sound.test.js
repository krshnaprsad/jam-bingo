/* Checks the sound module with fake browser objects, so no real audio or speech is needed. */
let failures = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('FAIL:', msg); } }

function fakeRoot(withSpeech) {
  const made = { osc: [], buffers: [], spoken: [], storage: {}, ctxs: [] };
  const param = v => ({ value: v, setValueAtTime(v2) { this.value = v2; }, exponentialRampToValueAtTime(v2) { this.value = v2; } });
  class FakeCtx {
    constructor() { this.state = 'suspended'; this.destination = {}; this.currentTime = 0; this.sampleRate = 8000; made.ctxs.push(this); }
    createGain() { return { gain: param(1), connect() { } }; }
    createOscillator() { const o = { type: '', frequency: param(440), connect() { }, start() { }, stop() { } }; made.osc.push(o); return o; }
    createBuffer(ch, len) { return { getChannelData() { return new Float32Array(len); } }; }
    createBufferSource() { const s = { connect() { }, start() { } }; made.buffers.push(s); return s; }
    createBiquadFilter() { return { type: '', frequency: param(1000), connect() { } }; }
    resume() { this.state = 'running'; }
  }
  const root = {
    AudioContext: FakeCtx,
    localStorage: { getItem: k => (k in made.storage ? made.storage[k] : null), setItem: (k, v) => { made.storage[k] = String(v); } },
    _made: made
  };
  if (withSpeech !== false) {
    root.SpeechSynthesisUtterance = function (text) { this.text = text; this.pitch = 1; this.rate = 1; this.volume = 1; };
    root.speechSynthesis = { getVoices: () => [{ lang: 'en-US', name: 'Test Voice' }], speak: u => made.spoken.push(u), cancel() { } };
  }
  return root;
}
function load(root) {
  global.self = root;
  delete require.cache[require.resolve('./sound.js')];
  return require('./sound.js');
}

/* 1. every named effect runs and builds oscillators or noise, and wakes a suspended context */
const names = ['click', 'pop', 'bloop', 'zap', 'freeze', 'knock', 'nope', 'lose', 'fanfare'];
for (const n of names) {
  const root = fakeRoot();
  const S = load(root);
  S.play(n);
  const total = root._made.osc.length + root._made.buffers.length;
  ok(total > 0, n + ' makes sound nodes');
  ok(root._made.ctxs[0].state === 'running', n + ' resumes the audio context');
}

/* 2. the winner plays the fanfare and shouts BINGO twice, excited */
{
  const root = fakeRoot();
  const S = load(root);
  S.play('win');
  ok(root._made.osc.length >= 6, 'win plays the fanfare notes');
  ok(root._made.spoken.length === 2, 'win shouts twice');
  ok(root._made.spoken[0].text === 'BINGO!', 'first shout says BINGO!');
  ok(root._made.spoken[1].text === 'BINGOOOO!', 'second shout stretches it');
  ok(root._made.spoken[1].pitch === 2 && root._made.spoken[1].rate === 0.7, 'second shout is high and slow');
  ok(root._made.spoken[0].voice && root._made.spoken[0].voice.lang === 'en-US', 'shout picks an English voice');
}

/* 3. win without speech support still plays the fanfare and does not crash */
{
  const root = fakeRoot(false);
  const S = load(root);
  let threw = false;
  try { S.play('win'); } catch (e) { threw = true; }
  ok(!threw, 'win without speech does not crash');
  ok(root._made.osc.length >= 6, 'win without speech still plays the fanfare');
}

/* 4. mute silences everything and is remembered */
{
  const root = fakeRoot();
  const S = load(root);
  S.setMuted(true);
  ok(root._made.storage.jb_mute === '1', 'mute is saved');
  const before = root._made.osc.length;
  S.play('pop'); S.play('win');
  ok(root._made.osc.length === before, 'muted play makes no sound nodes');
  ok(root._made.spoken.length === 0, 'muted win does not shout');
  const S2 = load(fakeRoot());
  ok(S2.isMuted() === false, 'fresh device starts unmuted');
  const root3 = fakeRoot(); root3._made.storage.jb_mute = '1';
  ok(load(root3).isMuted() === true, 'saved mute is picked up on load');
}

/* 5. the log records what was asked for, even while muted */
{
  const root = fakeRoot();
  const S = load(root);
  S.setMuted(true);
  S.play('pop');
  ok(S._log[S._log.length - 1] === 'pop', 'log records muted plays too');
}

console.log((failures ? 'FAILED ' + failures + ' of ' : 'All ') + checks + ' sound checks' + (failures ? '' : ' passed'));
process.exit(failures ? 1 : 0);
