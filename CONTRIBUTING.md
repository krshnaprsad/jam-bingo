# Contributing

No dependencies to install. You need Node 18 or newer to run the tests.

```
npm test
```

That runs `game.test.js`: card rules, number calling, jams and winning.

Layout:

- `game.js` has the rules and no browser code, so Node can test it.
- `app.js` is the page: screens, bots and the peer to peer connection (Trystero, loaded from a CDN).
- `app.css` is the look.

Change a rule in `game.js`, run the tests, then open `index.html` in two tabs to try it. Press Ctrl+F5 if you see an old version.
