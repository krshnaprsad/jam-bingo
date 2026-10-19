/* Jam Bingo sounds. Every effect is made in code with the Web Audio API, there are no
   audio files. The winner shout uses the browser's built-in speech voices, so the exact
   voice depends on the device. Works once the player has tapped something (phone browsers
   stay quiet until the first tap). */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JamSound = api;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var ctx = null, master = null;
  var muted = false;
  try { muted = !!(root.localStorage && root.localStorage.getItem('jb_mute') === '1'); } catch (e) { }
  var log = []; /* names of the last sounds asked for, handy for testing */

  function ac() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }
  /* call this from any tap so phone browsers allow sound from then on */
  function unlock() {
    ac();
    if (root.speechSynthesis) { try { root.speechSynthesis.getVoices(); } catch (e) { } }
  }
  function tone(o) {
    var c = ac(); if (!c || !master) return;
    var t0 = c.currentTime + (o.t || 0);
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(1, o.f0), t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t0 + o.d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.v || 0.2, t0 + (o.a || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + o.d + 0.05);
  }
  function noiseBurst(o) {
    var c = ac(); if (!c || !master) return;
    var t0 = c.currentTime + (o.t || 0);
    var len = Math.max(1, Math.floor(c.sampleRate * o.d));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(); src.buffer = buf;
    var fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.f || 1000;
    var g = c.createGain(); g.gain.value = o.v || 0.3;
    src.connect(fl); fl.connect(g); g.connect(master);
    src.start(t0);
  }

  var SFX = {
    /* plain button tap: short woody tick */
    click: function () { tone({ f0: 840, f1: 620, d: 0.05, type: 'triangle', v: 0.12 }); },
    /* marking a called number: bright pop that jumps up */
    pop: function () { tone({ f0: 420, f1: 980, d: 0.09, type: 'sine', v: 0.3 }); noiseBurst({ d: 0.02, v: 0.07, f: 5000 }); },
    /* new number called: soft ball-drop bloop */
    bloop: function () { tone({ f0: 350, f1: 185, d: 0.14, type: 'triangle', v: 0.2 }); },
    /* JAM aim on: quick rising zap */
    zap: function () { tone({ f0: 240, f1: 1400, d: 0.09, type: 'sawtooth', v: 0.12 }); },
    /* a square freezes: two icy falling notes */
    freeze: function () { tone({ f0: 1250, f1: 620, d: 0.16, type: 'sine', v: 0.18 }); tone({ f0: 940, f1: 470, d: 0.22, type: 'sine', v: 0.14, t: 0.07 }); },
    /* a square gets knocked out: low thud with a buzz */
    knock: function () { tone({ f0: 150, f1: 60, d: 0.22, type: 'square', v: 0.2 }); noiseBurst({ d: 0.08, v: 0.18, f: 500 }); },
    /* a tap that is not allowed: two grumpy low notes */
    nope: function () { tone({ f0: 170, d: 0.09, type: 'square', v: 0.14 }); tone({ f0: 128, d: 0.15, type: 'square', v: 0.14, t: 0.1 }); },
    /* someone else won: three notes sliding down */
    lose: function () { [392, 330, 262].forEach(function (f, i) { tone({ f0: f, d: 0.22, type: 'triangle', v: 0.18, t: i * 0.18 }); }); },
    /* the winner fanfare: a little funky climb with a bass line under it */
    fanfare: function () {
      var seq = [330, 392, 440, 587, 659, 784], i;
      for (i = 0; i < seq.length; i++) tone({ f0: seq[i], d: i === seq.length - 1 ? 0.55 : 0.13, type: 'triangle', v: 0.26, t: i * 0.11 });
      [82, 110, 82, 123].forEach(function (f, i) { tone({ f0: f, d: 0.16, type: 'square', v: 0.11, t: i * 0.22 }); });
      noiseBurst({ d: 0.35, v: 0.1, f: 7000, t: 0.55 });
    }
  };

  /* The winner shout: the browser says "BINGO!" twice, the second one slow and excited.
     Uses the device's own speech voice, so it sounds a bit different on each phone and laptop. */
  function shout() {
    var ss = root.speechSynthesis;
    if (!ss || typeof root.SpeechSynthesisUtterance === 'undefined') return false;
    var mk = function (text, pitch, rate) {
      var u = new root.SpeechSynthesisUtterance(text);
      u.pitch = pitch; u.rate = rate; u.volume = 1;
      var vs = ss.getVoices() || [];
      for (var i = 0; i < vs.length; i++) if (/^en([-_]|$)/i.test(vs[i].lang || '')) { u.voice = vs[i]; break; }
      return u;
    };
    try {
      ss.cancel();
      ss.speak(mk('BINGO!', 1.6, 1.1));
      ss.speak(mk('BINGOOOO!', 2, 0.7));
    } catch (e) { return false; }
    return true;
  }

  function play(name) {
    log.push(name); if (log.length > 60) log.shift();
    if (muted) return;
    if (name === 'win') { SFX.fanfare(); shout(); return; }
    var f = SFX[name];
    if (f) f();
  }
  function isMuted() { return muted; }
  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : 0.9;
    try { root.localStorage && root.localStorage.setItem('jb_mute', muted ? '1' : '0'); } catch (e) { }
    if (muted && root.speechSynthesis) { try { root.speechSynthesis.cancel(); } catch (e) { } }
  }
  return { play: play, unlock: unlock, isMuted: isMuted, setMuted: setMuted, _log: log };
});
