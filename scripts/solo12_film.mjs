// Seeked capture: render(t) per frame at 60 fps, 1920×1080, piped to ffmpeg (H.264, yuv420p, faststart).
// usage: node solo12_film.mjs <page.html> <out.mp4> [fps] [maxSeconds] [stillsDir]
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const require = createRequire(process.env.TEARDOWN_DIR + '/x.js');
const {chromium} = require('playwright');
const [,, html, out, fpsA = '60', maxA, stills] = process.argv;
const fps = +fpsA;
const b = await chromium.launch({executablePath: process.env.CHROMIUM, args: ['--ignore-gpu-blocklist', '--enable-webgl']});
const p = await b.newPage({viewport: {width: 1600, height: 900}, deviceScaleFactor: 1});
await p.goto('file://' + html + '?film');
await p.waitForFunction(() => window.__ready === true, null, {timeout: 60000});
const DUR = Math.min(await p.evaluate(() => window.__film.DUR), maxA ? +maxA : 1e9);
const N = Math.round(DUR * fps);
const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-vf', 'scale=1920:1080', out], {stdio: ['pipe', 'ignore', 'inherit']});
const t0 = Date.now();
if (stills) fs.mkdirSync(stills, {recursive: true});
for (let i = 0; i < N; i++) {
  const t = i / fps;
  await p.evaluate((t) => window.__film.renderAt(t), t);
  const jpg = await p.screenshot({type: 'jpeg', quality: 92});
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
  if (stills && i % fps === 0) fs.writeFileSync(`${stills}/t${String(t).padStart(2, '0')}.jpg`, jpg);
  if (i % 60 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/frame`);
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close();
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0), 's');
