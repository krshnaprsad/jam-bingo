/* Checks the install-as-an-app pieces are all in place and consistent with the version. */
const fs = require('fs');
let failures = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.error('FAIL:', msg); } }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const man = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));

ok(man.name === 'Jam Bingo' && man.short_name === 'Jam Bingo', 'manifest names the app');
ok(man.display === 'standalone', 'manifest opens full screen');
ok(man.theme_color === '#000000' && man.background_color === '#000000', 'manifest is true black');
['192x192', '512x512'].forEach(sz => ok(man.icons.some(i => i.sizes === sz), 'manifest has a ' + sz + ' icon'));
ok(man.icons.some(i => i.purpose === 'maskable'), 'manifest has a maskable icon');
man.icons.forEach(i => ok(fs.existsSync(i.src), 'icon file exists: ' + i.src));

ok(html.includes('rel="manifest"'), 'page links the manifest');
ok(html.includes('rel="apple-touch-icon"'), 'page links the iPhone icon');
ok(html.includes('apple-mobile-web-app-capable'), 'page allows iPhone full screen');
ok(html.includes('apple-mobile-web-app-title'), 'page names the iPhone app');
ok(fs.existsSync('icons/apple-touch-icon.png'), 'iPhone icon file exists');

ok(sw.includes("CACHE = 'jam-bingo-v" + pkg.version + "'"), 'service worker cache matches the version');
['app.js?v=', 'sound.js?v=', 'game.js?v=', 'app.css?v=', 'manifest.webmanifest', 'icons/icon-192.png'].forEach(f =>
  ok(sw.includes(f), 'service worker caches ' + f));
['app.js?v=' + pkg.version, 'sound.js?v=' + pkg.version, 'app.css?v=' + pkg.version].forEach(f =>
  ok(sw.includes(f), 'service worker caches the current ' + f));

const app = fs.readFileSync('app.js', 'utf8');
ok(app.includes("serviceWorker.register('sw.js')"), 'app registers the service worker');
ok(app.includes('beforeinstallprompt'), 'app catches the install prompt');
ok(app.includes('Add to Home Screen'), 'app explains the iPhone install steps');
ok(app.includes('jb_noinstall'), 'install hint can be dismissed for good');

console.log((failures ? 'FAILED ' + failures + ' of ' : 'All ') + checks + ' pwa checks' + (failures ? '' : ' passed'));
process.exit(failures ? 1 : 0);
