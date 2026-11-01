// Bug sweep: one still per view/mode, console errors, NaN check on every panel number.
import {createRequire} from 'node:module';
const require = createRequire(process.env.TEARDOWN_DIR + '/x.js');
const {chromium} = require('playwright');
const [,, html, outDir] = process.argv;
const b = await chromium.launch({executablePath: process.env.CHROMIUM});
const p = await b.newPage({viewport: {width: 1600, height: 900}});
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto('file://' + html); await p.waitForFunction(() => window.__ready === true, null, {timeout: 60000});
await p.evaluate(() => window.__solo.takeover());
const shots = [['hero', 'HERO', 0, 0], ['side', 'SIDE', 0, 0], ['top', 'TOP', 0, 0], ['body', 'BODY', 0, 0], ['actuator', 'ACTUATOR', 0, 1], ['exploded', 'HERO', 1, 0], ['exploded-xray', 'ACTUATOR', 1, 1]];
for (const [name, v, ex, xr] of shots) {
  await p.evaluate(([v, ex, xr]) => { const S = window.__solo; S.view(v); S.ui.explT = ex; S.ui.xray = !!xr; S.settle(); }, [v, ex, xr]);
  await p.waitForTimeout(1500);
  const nan = await p.evaluate(() => [...document.querySelectorAll('.hud')].map((e) => e.innerText).join(' ').match(/NaN|Infinity|undefined/g));
  if (nan) errs.push(`${name}: ${nan.join(',')}`);
  await p.screenshot({path: `${outDir}/${name}.jpg`, type: 'jpeg', quality: 80});
}
console.log('errors:', errs.length ? errs.join(' | ') : 'none'); await b.close();
