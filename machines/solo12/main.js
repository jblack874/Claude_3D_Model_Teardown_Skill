// ODRI Solo-12 field simulator — teardown-style page. Every pose and every number reads from kin.js state(t).
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {P, LEGS, CHECK, GAITS, state as kstate} from './kin.js';
import {MESH, MESH_META} from './meshes.js';

console.log(`hand check: belt2 = ${CHECK.belt2mm} mm (spec 201), ratio = ${CHECK.ratio}:1 (spec 9)`);

// live drive state (WASD/QE/X, 1-2-3 gaits); film/tour always uses TROT straight ahead
const drive = {gait: 'TROT', v: 1, side: 0, yaw: 0, x: 0, z: 0, heading: 0, live: false};
const gaitFor = () => (drive.live ? {...P, ...GAITS[drive.gait], stride: P.stride * drive.v, side: drive.side * 0.2} : P);
const state = (t) => kstate(t, gaitFor());
// ---------------------------------------------------------------- page shell
const css = `
:root{--bg:#f3f0ea;--ink:#1d1d1f;--mute:#8a857c;--acc:#e8562a;--ok:#2e9d6a;--card:#fbfaf7;--line:#ddd7cc}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:'JetBrains Mono',monospace;overflow:hidden}
#c{position:fixed;inset:0}
.hud{position:fixed;inset:0;pointer-events:none}
.card{position:absolute;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:10px 12px;pointer-events:auto;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.h{font-size:11px;letter-spacing:.18em;font-weight:700;display:flex;justify-content:space-between;margin-bottom:8px}
.h::before{content:'';width:3px;height:12px;background:var(--acc);margin-right:8px;display:inline-block}
.h span:first-child{flex:1}.n{color:var(--mute);font-weight:400}
.big{font-family:Inter,sans-serif;font-size:34px;font-weight:700}.u{font-size:13px;color:var(--mute);margin-left:4px}
.lab{font-size:9px;letter-spacing:.16em;color:var(--mute)}
.row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}
.btn{display:inline-block;font-size:10px;letter-spacing:.14em;font-weight:700;border:1px solid var(--line);border-radius:4px;padding:6px 9px;margin:0 6px 6px 0;cursor:pointer;background:#fff;user-select:none}
.btn.on{background:var(--acc);color:#fff;border-color:var(--acc)}
.tag{font-size:9px;font-weight:700;letter-spacing:.12em;padding:2px 6px;border-radius:3px;background:var(--ok);color:#fff}
.tag.s{background:var(--acc)}
#brand{position:fixed;left:0;top:0;background:var(--acc);color:#fff;font-weight:700;letter-spacing:.2em;padding:26px 30px;font-size:15px}
#title{position:fixed;left:150px;top:16px}
#title .k{font-size:10px;letter-spacing:.24em;color:var(--mute)}
#title .t{font-family:Inter,sans-serif;font-size:34px;font-weight:700;margin:2px 0}
#title .t i{color:var(--acc);font-style:normal}
#mode{position:fixed;left:420px;bottom:150px}
#mode .m{font-family:Inter,sans-serif;font-size:40px;font-weight:800;color:var(--acc)}
#foot{position:fixed;bottom:8px;left:20px;right:20px;display:flex;justify-content:space-between;font-size:9px;letter-spacing:.2em;color:var(--mute)}
canvas.ch{width:100%;height:110px;display:block}
#log input{width:100%}
.callout{position:absolute;font-size:9px;letter-spacing:.14em;font-weight:700;color:var(--ink);white-space:nowrap;transform:translate(10px,-50%)}
.callout::before{content:'';position:absolute;left:-10px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:var(--acc)}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
document.body.insertAdjacentHTML('beforeend', `
<canvas id="c"></canvas>
<div id="brand">SOLO·12</div>
<div id="title"><div class="k">OPEN DYNAMIC ROBOT INITIATIVE · TWELVE-DOF QUADRUPED</div>
<div class="t">ODRI Solo-12 <i>/</i></div><div class="k">TORQUE-CONTROLLED BELT ACTUATORS / FIELD SIMULATOR</div></div>
<div class="hud">
 <div class="card" style="left:20px;top:110px;width:300px"><div class="h"><span>KNEE · FL</span><span class="n">01</span></div>
  <div style="display:flex;justify-content:space-between;align-items:baseline"><div><span class="big" id="tq">0</span><span class="u">N·m</span><div class="lab">KNEE TORQUE</div></div>
  <div style="text-align:right"><span class="big" id="rpm" style="font-size:24px">0</span><span class="u">rpm</span><div class="lab">MOTOR</div></div></div>
  <canvas class="ch" id="ch1" width="560" height="220"></canvas>
  <div class="row"><span class="lab">PHASE</span><span id="ph">0</span><span class="lab">BELT 1</span><span id="belt">0</span></div></div>
 <div class="card" style="left:20px;top:345px;width:300px"><div class="h"><span>DRIVE TRAIN</span><span class="n">02</span></div>
  <div class="row"><span class="lab">MOTOR</span><span>ANTIGRAVITY 4004 · 300 KV</span></div>
  <div class="row"><span class="lab">STAGE 1</span><span>10T → 30T · AT3 150 MM</span></div>
  <div class="row"><span class="lab">STAGE 2</span><span>10T → 30T · AT3 ${CHECK.belt2mm} MM</span></div>
  <div class="row"><span class="lab">TOTAL</span><span>${CHECK.ratio}:1 · 2.5 N·M @ 12 A</span></div>
  <div class="row"><span class="lab">CURRENT FL·K</span><span id="cur">0 A</span></div></div>
 <div class="card" style="left:20px;top:500px;width:300px"><div class="h"><span>JOINTS</span><span class="n">03</span><span class="tag" id="gt">TROT</span></div>
  <div id="jt"></div></div>
 <div class="card" style="right:20px;top:110px;width:300px"><div class="h"><span>FOOT HEIGHT</span><span class="n">04</span></div>
  <canvas class="ch" id="ch2" width="560" height="220"></canvas>
  <div class="row"><span class="lab">STRIDE</span><span>${P.stride * 1000} MM</span><span class="lab">LIFT</span><span>${P.lift * 1000} MM</span></div></div>
 <div class="card" style="right:20px;top:330px;width:300px"><div class="h"><span>ASSEMBLIES</span><span class="n">05</span></div><div id="asm"></div></div>
 <div class="card" style="right:20px;top:445px;width:300px"><div class="h"><span>DISPLAY</span><span class="n">06</span></div><div id="disp"></div></div>
 <div class="card" style="right:20px;top:560px;width:300px"><div class="h"><span>SUBSYSTEMS</span><span class="n">07</span></div><div id="sub"></div></div>
 <div class="card" id="log" style="left:420px;right:420px;bottom:40px"><div class="h"><span>OPERATION LOG</span><span class="n">08</span></div>
  <div style="display:flex;gap:12px;align-items:center"><span class="btn on" id="play" style="margin:0">❚❚</span>
  <input type="range" id="scrub" min="0" max="1000" value="0"><span id="clock" style="font-size:11px;width:120px">0.0 S</span></div></div>
 <div id="mode"><div class="lab">OPERATING MODE</div><div class="m" id="modeT">TROTTING</div><div class="lab" id="modeS">GAIT PHASE 0.00</div></div>
 <div id="callouts"></div>
</div>
<div id="foot"><span>WASD QE MOVE · X STOP · 1 2 3 GAITS · SPACE PAUSE · H HIDE PANELS · DRAG ORBIT</span><span>FIELD SIMULATOR · PROCEDURAL MODEL · 4 LEGS · 12 ACTUATORS · 24 BELT STAGES</span><span>BUILT FROM ODRI OPEN HARDWARE (BSD-3) //////</span></div>`);

// ---------------------------------------------------------------- stage
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f3f0ea');
const cam = new THREE.PerspectiveCamera(32, 1, 0.01, 20);
const ctl = new OrbitControls(cam, canvas);
ctl.enableDamping = true;
ctl.target.set(0, 0.17, 0);
scene.add(new THREE.HemisphereLight('#ffffff', '#cfc6b8', 1.6));
const sun = new THREE.DirectionalLight('#ffffff', 2.4);
sun.position.set(0.8, 1.6, 0.9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left: -0.6, right: 0.6, top: 0.6, bottom: -0.6, near: 0.1, far: 4});
scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({opacity: 0.16}));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.PolarGridHelper(0.55, 12, 4, 64, '#d9d2c5', '#e6e0d5');
grid.position.y = 0.0005;
scene.add(grid);

// ---------------------------------------------------------------- materials
const M = {
  white: new THREE.MeshStandardMaterial({color: '#f4f2ee', roughness: 0.55, metalness: 0.0, transparent: true}),
  dark: new THREE.MeshStandardMaterial({color: '#232325', roughness: 0.45, metalness: 0.3}),
  orange: new THREE.MeshStandardMaterial({color: '#e8562a', roughness: 0.5}),
  copper: new THREE.MeshStandardMaterial({color: '#b5703c', roughness: 0.45, metalness: 0.7}),
  alu: new THREE.MeshStandardMaterial({color: '#b9bcc0', roughness: 0.45, metalness: 0.8}),
  pul: new THREE.MeshStandardMaterial({color: '#eceae5', roughness: 0.5}),
  belt: new THREE.MeshStandardMaterial({color: '#c9443a', roughness: 0.7}),
  ink: new THREE.LineBasicMaterial({color: '#2a2a2a', transparent: true, opacity: 0.35}),
};
const shadow = (o) => (o.traverse((m) => m.isMesh && ((m.castShadow = true), (m.receiveShadow = true))), o);
const outline = (mesh) => mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), M.ink));

function pulley(teeth, width, mat) {
  const r = (teeth * P.pitch) / (2 * Math.PI) + 0.0012;
  const g = new THREE.CylinderGeometry(r, r, width, Math.max(teeth, 12));
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  // flanges
  const f = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.002, r + 0.002, 0.0008, 32).rotateX(Math.PI / 2), M.alu);
  f.position.z = width / 2; m.add(f);
  const f2 = f.clone(); f2.position.z = -width / 2; m.add(f2);
  // a tick so rotation reads
  const tick = new THREE.Mesh(new THREE.BoxGeometry(0.0015, r * 0.9, width * 1.05), M.dark);
  tick.position.y = r * 0.45; m.add(tick);
  m.userData.r = r;
  return m;
}
function beltLoop(r1, r2, dist, width) {
  // stadium path around two pulleys along -y, belt drawn as a flat tube
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) { const a = Math.PI + (Math.PI * i) / N; pts.push(new THREE.Vector3(r1 * Math.cos(a), r1 * Math.sin(a) * -1, 0)); }
  for (let i = 0; i <= N; i++) { const a = (Math.PI * i) / N; pts.push(new THREE.Vector3(r2 * Math.cos(a), -dist - r2 * Math.sin(a), 0)); }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const g = new THREE.TubeGeometry(curve, 160, 0.0011, 4, true);
  g.scale(1, 1, width / 0.0022);
  return new THREE.Mesh(g, M.belt);
}

/** one Solo actuator module = the upper leg: housing hip→knee, motor at the hip, 2 belt stages, output at the knee */
function actuatorModule(side) {
  const g = new THREE.Group();
  const L = P.upper;
  const housing = new THREE.Mesh(new RoundedBoxGeometry(0.05, L + 0.05, 0.034, 4, 0.016), M.white);
  housing.position.y = -L / 2;
  outline(housing);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.022, 0.0352), M.orange);
  stripe.position.y = -L * 0.62;
  housing.add(stripe); stripe.position.y = -L * 0.12;
  const inner = new THREE.Group(); // drivetrain
  const motor = new THREE.Group();
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.0225, 0.0225, 0.016, 40).rotateX(Math.PI / 2), M.dark);
  const stator = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0032, 8, 24), M.copper);
  motor.add(can, stator);
  motor.position.z = -0.008 * side;
  const p1 = pulley(P.pulleySmallT, 0.005, M.alu); p1.position.z = 0.008 * side;
  const midY = -0.068;
  const p2 = pulley(P.pulleyBigT, 0.005, M.pul); p2.position.set(0, midY, 0.008 * side);
  const p3 = pulley(P.pulleySmallT, 0.006, M.alu); p3.position.set(0, midY, 0.0015 * side);
  const p4 = pulley(P.pulleyBigT, 0.006, M.pul); p4.position.set(0, -L, 0.0015 * side);
  const b1 = beltLoop(p1.userData.r, p2.userData.r, -midY, 0.004); b1.position.z = 0.008 * side;
  const b2 = beltLoop(p3.userData.r, p4.userData.r, L + midY, 0.006); b2.position.set(0, midY, 0.0015 * side);
  const bearing = new THREE.Mesh(new THREE.TorusGeometry(0.0145, 0.0025, 8, 32), M.alu);
  bearing.position.set(0, -L, -0.009 * side);
  const enc = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.003, 32).rotateX(Math.PI / 2), M.orange);
  enc.position.z = -0.018 * side;
  inner.add(motor, p1, p2, p3, p4, b1, b2, bearing, enc);
  g.add(housing, inner);
  g.userData = {housing, inner, motor, p1, p2, p3, p4, b1, b2, enc, bearing};
  return shadow(g);
}

// ---------------------------------------------------------------- robot
const robot = new THREE.Group();
scene.add(robot);
const body = new THREE.Group();
robot.add(body);
const chassis = new THREE.Mesh(new RoundedBoxGeometry(P.bodyL, P.bodyH, P.bodyW, 4, 0.02), M.dark);
const lid = new THREE.Mesh(new RoundedBoxGeometry(P.bodyL * 0.8, 0.012, P.bodyW * 0.85, 3, 0.005), M.white);
lid.position.y = P.bodyH / 2 + 0.006; outline(lid);
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 32), M.orange);
ring.rotation.x = Math.PI / 2; ring.position.set(0.05, P.bodyH / 2 + 0.013, 0);
const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.004, 0.06), M.orange);
board.position.set(-0.07, P.bodyH / 2 + 0.013, 0);
body.add(shadow(chassis), shadow(lid), ring, board);

const legs = LEGS.map((L) => {
  const hip = new THREE.Group();
  hip.position.set(L.sx * P.hipX, 0, L.sy * P.hipY);
  body.add(hip);
  // HAA actuator: a module lying along x, its output is the hip roll axis
  const haa = actuatorModule(L.sy);
  haa.rotation.z = (L.sx > 0 ? 1 : -1) * Math.PI / 2;
  haa.scale.setScalar(0.62);
  haa.position.set(-L.sx * 0.0, 0.0, 0);
  hip.add(haa);
  const roll = new THREE.Group();
  hip.add(roll);
  const hfeG = new THREE.Group();
  hfeG.position.z = L.sy * P.haaOff;
  roll.add(hfeG);
  const upper = actuatorModule(L.sy); // HFE motor at the hip drives the thigh; the KFE module is the thigh itself
  hfeG.add(upper);
  const knee = new THREE.Group();
  knee.position.y = -P.upper;
  hfeG.add(knee);
  const shin = new THREE.Mesh(new RoundedBoxGeometry(0.018, P.lower, 0.014, 3, 0.006), M.white);
  shin.position.y = -P.lower / 2; outline(shin);
  const footM = new THREE.Mesh(new THREE.SphereGeometry(0.014, 24, 16), M.dark);
  footM.position.y = -P.lower;
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 24), M.orange);
  cuff.position.y = -P.lower + 0.022;
  knee.add(shadow(shin), shadow(footM), cuff);
  return {L, hip, haa, roll, hfeG, upper, knee, footM};
});

// ---------------------------------------------------------------- real ODRI shells (STL → int16 → gzip)
async function decode(name) {
  const meta = MESH_META[name];
  const bin = Uint8Array.from(atob(MESH[name]), (c) => c.charCodeAt(0));
  const buf = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const q = new Int16Array(buf, 0, meta.n * 3);
  const pos = new Float32Array(meta.n * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = q[i] * meta.s;
  const idxBytes = buf.slice(meta.n * 6);
  const idx = meta.n < 65535 ? new Uint16Array(idxBytes) : new Uint32Array(idxBytes);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}
const shellMesh = (g, mat) => { const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 35), M.ink)); return m; };
const meshesReady = (async () => {
  const G = {};
  for (const k of Object.keys(MESH)) G[k] = await decode(k);
  legs.forEach((g) => {
    const sd = g.L.sy, d = g.upper.userData;
    d.housing.visible = false;
    d.shellB = shellMesh(G.upper_base, M.white); d.shellB.position.set(0, -P.upper / 2, -0.008 * sd);
    d.shellC = shellMesh(G.upper_cover, M.white); d.shellC.position.set(0, -P.upper / 2, 0.016 * sd);
    if (sd < 0) { d.shellB.rotation.y = Math.PI; d.shellC.rotation.y = Math.PI; }
    g.upper.add(d.shellB, d.shellC);
    const shin = g.knee.children[0]; shin.visible = false;
    const ll = shellMesh(G.lower_leg, M.white); ll.position.y = -P.lower / 2 - 0.006; g.knee.add(ll);
    const h = g.haa.userData; h.housing.visible = false;
    h.shellB = shellMesh(G.hipfe_base, M.white); h.shellB.scale.setScalar(1 / 0.62); h.shellB.position.set(0, -0.11, -0.012 * sd);
    h.shellC = shellMesh(G.hipfe_cover, M.white); h.shellC.scale.setScalar(1 / 0.62); h.shellC.position.set(0, -0.11, 0.03 * sd);
    g.haa.add(h.shellB, h.shellC);
  });
  const top = shellMesh(G.body_center, M.white); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.position.y = P.bodyH / 2 + 0.008; body.add(top);
  lid.visible = false;
  window.__ready = true;
})();

// ---------------------------------------------------------------- UI state
const ui = {exploded: 0, explT: 0, xray: false, labels: true, turntable: false, playing: true, t: 0, iso: 'HERO'};
const VIEWS = {
  HERO: [[0.95, 0.55, 1.2], [0, 0.13, 0]], SIDE: [[0, 0.22, 1.05], [0, 0.15, 0]],
  TOP: [[0.25, 1.75, 0.35], [0, 0.12, 0]], ACTUATOR: [[0.78, 0.36, 0.92], [P.hipX * 0.6, 0.14, P.hipY]],
  BODY: [[0.4, 0.55, 0.35], [0, 0.24, 0]],
};
let camFrom = null, camTo = null, camK = 1;
function view(name) {
  ui.iso = name;
  const [p, tg] = VIEWS[name];
  camFrom = [cam.position.clone(), ctl.target.clone()];
  camTo = [new THREE.Vector3(...p), new THREE.Vector3(...tg)];
  camK = 0;
  ui.xray = name === 'ACTUATOR' ? true : ui.xray;
  sync();
}
function btns(el, items) {
  el.innerHTML = items.map(([k, label]) => `<span class="btn" data-k="${k}">${label}</span>`).join('');
  el.querySelectorAll('.btn').forEach((b) => (b.onclick = () => act(b.dataset.k)));
}
btns(document.getElementById('asm'), [['HERO', 'HERO'], ['ACTUATOR', 'ACTUATOR'], ['SIDE', 'SIDE'], ['TOP', 'TOP'], ['BODY', 'BODY'], ['AUTO', 'AUTO ▶']]);
document.getElementById('jt').insertAdjacentHTML('beforebegin', '<div id="gaits" style="margin-bottom:6px"></div>');
btns(document.getElementById('gaits'), [['TROT', '1 TROT'], ['WALK', '2 WALK'], ['BOUND', '3 BOUND']]);
btns(document.getElementById('disp'), [['labels', 'LABELS'], ['exploded', 'EXPLODED'], ['xray', 'X-RAY'], ['turntable', 'TURNTABLE']]);
function act(k) {
  if (k === 'AUTO') { tourOn = true; tourT = 0; drive.live = false; return; }
  if (GAITS[k]) { drive.gait = k; drive.live = true; document.getElementById('gt').textContent = k; return; }
  if (VIEWS[k]) return view(k);
  if (k === 'exploded') ui.explT = ui.explT ? 0 : 1;
  else ui[k] = !ui[k];
  sync();
}
function sync() {
  document.querySelectorAll('#asm .btn').forEach((b) => b.classList.toggle('on', b.dataset.k === ui.iso));
  document.querySelectorAll('#disp .btn').forEach((b) => b.classList.toggle('on', b.dataset.k === 'exploded' ? !!ui.explT : !!ui[b.dataset.k]));
  document.getElementById('play').textContent = ui.playing ? '❚❚' : '▶';
  document.getElementById('callouts').style.display = ui.labels ? '' : 'none';
}
document.getElementById('play').onclick = () => ((ui.playing = !ui.playing), sync());
const scrub = document.getElementById('scrub');
const LOOP = 24;
scrub.oninput = () => ((ui.t = (scrub.value / 1000) * LOOP), (ui.playing = false), sync());
document.getElementById('sub').innerHTML = [
  ['01', 'ACTUATOR MODULES', '12 / 12 LIVE'], ['02', 'BELT STAGES', '24 · AT3'], ['03', 'ENCODERS', '5000 CPR'],
  ['04', 'BODY / BATTERY', 'SEALED'], ['05', 'MASTER BOARD', 'ONLINE'],
].map(([n, a, s]) => `<div class="row"><span class="lab">${n}</span><span style="flex:1;margin-left:8px">${a}</span><span class="tag">${s}</span></div>`).join('');
sync();
view('HERO');

// callouts (thin leaders drawn as dots + text anchored to 3D points)
const CALL = [
  ['MOTOR · 4004 300KV', () => legs[0].upper.userData.motor],
  ['STAGE 1 · 10T→30T', () => legs[0].upper.userData.p1],
  ['STAGE 2 · 67T 201MM', () => legs[0].upper.userData.b2],
  ['KNEE OUTPUT · 9:1', () => legs[0].upper.userData.p4],
  ['FOOT CONTACT', () => legs[0].footM],
];
const callEl = document.getElementById('callouts');
callEl.innerHTML = CALL.map(([t]) => `<div class="callout">${t}</div>`).join('');

// ---------------------------------------------------------------- charts
function chart(id, series, colors, lo, hi) {
  const c = document.getElementById(id), x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  x.strokeStyle = '#e4ded3'; x.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const y = (c.height * i) / 4; x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y); x.stroke(); }
  series.forEach((s, k) => {
    x.strokeStyle = colors[k]; x.lineWidth = k === 0 ? 3 : 1.6; x.beginPath();
    s.forEach((v, i) => { const px = (i / (s.length - 1)) * c.width, py = c.height - ((v - lo) / (hi - lo)) * c.height; i ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.stroke();
  });
  x.fillStyle = colors[0];
  const v = series[0][series[0].length - 1];
  x.beginPath(); x.arc(c.width - 4, c.height - ((v - lo) / (hi - lo)) * c.height, 6, 0, 7); x.fill();
}

// ---------------------------------------------------------------- frame
const v3 = new THREE.Vector3();
function pose(S, e) {
  const st = S.legs;
  const avgLift = st.reduce((a, l) => a + l.footLift, 0) / 4;
  body.position.y = P.height + 0.004 * Math.sin(2 * Math.PI * S.phase * 2) - avgLift * 0.05;
  legs.forEach((g, i) => {
    const s = st[i];
    g.roll.rotation.x = s.haa;
    g.hfeG.rotation.z = s.hfe;
    g.knee.rotation.z = s.kfe;
    const u = g.upper.userData;
    // drivetrain reads the same joint angle: motor = 9×, middle = 3×, output = 1× (knee)
    u.motor.rotation.z = s.motorKfe; u.p1.rotation.z = s.motorKfe;
    u.p2.rotation.z = s.stage1Kfe; u.p3.rotation.z = s.stage1Kfe; u.p4.rotation.z = s.kfe;
    u.enc.rotation.z = s.motorKfe;
    const h = g.haa.userData;
    h.motor.rotation.z = s.haa * P.ratio; h.p1.rotation.z = s.haa * P.ratio; h.p2.rotation.z = s.haa * P.stage; h.p3.rotation.z = s.haa * P.stage; h.p4.rotation.z = s.haa;
    // exploded: housing out, drivetrain layers spread on the module's own z
    for (const m of [g.upper, g.haa]) {
      const d = m.userData, sd = g.L.sy;
      d.housing.position.z = 0.045 * e * sd;
      d.motor.position.z = (-0.008 - 0.05 * e) * sd;
      d.enc.position.z = (-0.018 - 0.085 * e) * sd;
      d.p1.position.z = d.p2.position.z = d.b1.position.z = (0.008 + 0.025 * e) * sd;
      d.p3.position.z = d.p4.position.z = d.b2.position.z = (0.0015 + 0.0 * e) * sd;
      d.bearing.position.z = (-0.009 - 0.03 * e) * sd;
      if (d.shellB) { d.shellB.position.z = (-0.008 - 0.035 * e) * sd * (m === g.haa ? 1.2 : 1); d.shellC.position.z = (0.016 + 0.05 * e) * sd * (m === g.haa ? 1.3 : 1); }
    }
    g.knee.position.y = -P.upper - 0.03 * e;
  });
  M.white.opacity = ui.xray ? 0.18 : 1;
  M.white.depthWrite = !ui.xray;
}
function panels(S) {
  const fl = S.legs[0];
  document.getElementById('tq').textContent = Math.abs(fl.tauK).toFixed(2);
  document.getElementById('rpm').textContent = Math.round(Math.abs(fl.rpmK));
  document.getElementById('ph').textContent = S.phase.toFixed(2);
  document.getElementById('belt').textContent = `${fl.beltK.toFixed(2)} M/S`;
  document.getElementById('cur').textContent = `${fl.iK.toFixed(2)} A`;
  document.getElementById('jt').innerHTML = S.legs.map((l) => `<div class="row"><span class="lab">${l.id}</span><span>${(l.haa * 57.3).toFixed(0).padStart(4)}°</span><span>${(l.hfe * 57.3).toFixed(0).padStart(4)}°</span><span>${(l.kfe * 57.3).toFixed(0).padStart(5)}°</span><span class="tag ${l.stance ? '' : 's'}">${l.stance ? 'STANCE' : 'SWING'}</span></div>`).join('');
  // charts are pure functions of time: sample the model backward
  const N = (new URLSearchParams(location.search).has('film') ? 40 : 90), hist = (f) => Array.from({length: N}, (_, i) => f(state(S.t - (N - 1 - i) * (1.08 / N))));
  chart('ch1', [hist((s) => Math.abs(s.legs[0].tauK)), hist((s) => Math.abs(s.legs[0].tauH))], ['#e8562a', '#9a958c'], 0, 2.5);
  chart('ch2', [0, 1, 2, 3].map((k) => hist((s) => s.legs[k].footLift)), ['#e8562a', '#1d1d1f', '#9a958c', '#c9c2b6'], -0.005, P.lift * 1.15);
  document.getElementById('modeT').textContent = ui.explT ? 'EXPLODED' : ui.xray ? 'X-RAY · DRIVETRAIN' : drive.live ? `${drive.gait === 'TROT' ? 'TROTTING' : drive.gait === 'WALK' ? 'WALKING' : 'BOUNDING'}${drive.v === 0 ? ' · STOPPED' : ''}` : 'TROTTING';
  document.getElementById('modeS').textContent = `GAIT PHASE ${S.phase.toFixed(2)} · ${drive.live ? GAITS[drive.gait].freq : P.freq} HZ · ${fl.stance ? 'FL STANCE' : 'FL SWING'}`;
  document.getElementById('clock').textContent = `${(S.t % LOOP).toFixed(1)} / ${LOOP}.0 S`;
  scrub.value = ((S.t % LOOP) / LOOP) * 1000;
}
function callouts() {
  const r = canvas.getBoundingClientRect();
  [...callEl.children].forEach((el, i) => {
    CALL[i][1]().getWorldPosition(v3); v3.project(cam);
    el.style.left = `${((v3.x + 1) / 2) * r.width}px`; el.style.top = `${((1 - v3.y) / 2) * r.height}px`; el.style.fontSize = `${9 * Z}px`;
  });
}
let Z = 1;
function resize() {
  const w = innerWidth, h = innerHeight;
  Z = Math.min(w / 1600, h / 900);
  document.querySelectorAll('.hud > .card, #brand, #title, #mode, #foot').forEach((el) => (el.style.zoom = Z));
  renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let last = performance.now();
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (FILM) return; // capture drives frames
  if (tourOn) { tourT += dt; renderAt(tourT); requestAnimationFrame(frame); return; }
  steer(dt);
  if (ui.playing) ui.t += dt;
  ui.exploded += (ui.explT - ui.exploded) * Math.min(1, dt * 4);
  if (camK < 1) { camK = Math.min(1, camK + dt / 1.2); const k = ease(camK); cam.position.lerpVectors(camFrom[0], camTo[0], k); ctl.target.lerpVectors(camFrom[1], camTo[1], k); }
  if (ui.turntable) robot.rotation.y += dt * 0.3;
  const S = state(ui.t);
  pose(S, ui.exploded);
  ctl.update();
  renderer.render(scene, cam);
  panels(S); callouts();
  requestAnimationFrame(frame);
}
// ---------------------------------------------------------------- SCRIPT (tour + film share it)
export const SCRIPT = [ // [t, button key, camera view, exploded, xray, caption]
  [0.0, 'HERO', 'HERO', 0, 0, 'TROTTING · 1.6 HZ'],
  [4.0, 'SIDE', 'SIDE', 0, 0, 'GAIT · STANCE / SWING'],
  [8.0, 'xray', 'ACTUATOR', 0, 1, 'X-RAY · 9:1 BELT DRIVE'],
  [12.5, 'exploded', 'ACTUATOR', 1, 1, 'EXPLODED · ACTUATOR MODULE'],
  [17.0, 'TOP', 'TOP', 1, 0, 'EXPLODED · 12 MODULES'],
  [20.0, 'HERO', 'HERO', 0, 0, 'REASSEMBLED · TROTTING'],
];
export const DUR = 24;
const cursor = document.createElement('div');
cursor.style.cssText = 'position:fixed;width:18px;height:18px;border-radius:50%;border:2px solid #1d1d1f;background:rgba(232,86,42,.25);pointer-events:none;z-index:9;transform:translate(-50%,-50%);display:none';
document.body.appendChild(cursor);
const btnPos = (k) => { const b = document.querySelector(`.btn[data-k="${k}"]`); if (!b) return [innerWidth / 2, innerHeight / 2]; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const sm = (k) => k * k * (3 - 2 * k);
/** pure: everything on screen at script time t */
function applyScript(t) {
  t = ((t % DUR) + DUR) % DUR;
  let i = 0; while (i + 1 < SCRIPT.length && SCRIPT[i + 1][0] <= t) i++;
  const cur = SCRIPT[i], prev = SCRIPT[Math.max(0, i - 1)];
  const k = sm(Math.min(1, (t - cur[0]) / 1.4));
  const [pa, ta] = VIEWS[prev[2]], [pb, tb] = VIEWS[cur[2]];
  const orbit = 0.12 * Math.sin((t / DUR) * Math.PI * 2);
  // camera moves on a sphere around the target (never through the robot): lerp radius/azimuth/elevation, not xyz
  const kk = i ? k : 1;
  const TA = new THREE.Vector3(...ta), TB = new THREE.Vector3(...tb), T = TA.clone().lerp(TB, kk);
  const sa = new THREE.Spherical().setFromVector3(new THREE.Vector3(...pa).sub(TA));
  const sb = new THREE.Spherical().setFromVector3(new THREE.Vector3(...pb).sub(TB));
  let dth = sb.theta - sa.theta; if (dth > Math.PI) dth -= 2 * Math.PI; if (dth < -Math.PI) dth += 2 * Math.PI;
  const sp = new THREE.Spherical(Math.max(0.95, sa.radius + (sb.radius - sa.radius) * kk), Math.min(sa.phi + (sb.phi - sa.phi) * kk, 1.45), sa.theta + dth * kk + orbit);
  cam.position.setFromSpherical(sp).add(T); ctl.target.copy(T);
  ui.exploded = prev[3] + (cur[3] - prev[3]) * (i ? k : 1);
  ui.explT = cur[3]; ui.xray = !!cur[4]; ui.iso = cur[2]; ui.labels = true; ui.t = t;
  // cursor walks to the next button and presses it 0.35 s before its beat
  const nxt = SCRIPT[(i + 1) % SCRIPT.length], tn = i + 1 < SCRIPT.length ? nxt[0] : DUR;
  const a = btnPos(cur[1]), b = btnPos(nxt[1]), w = sm(Math.max(0, Math.min(1, (t - (tn - 1.6)) / 1.25)));
  cursor.style.display = 'block'; cursor.style.left = `${a[0] + (b[0] - a[0]) * w}px`; cursor.style.top = `${a[1] + (b[1] - a[1]) * w}px`;
  const press = t - cur[0] < 0.3; cursor.style.transform = `translate(-50%,-50%) scale(${press ? 0.7 : 1})`;
  document.getElementById('modeS').textContent = cur[5];
  sync();
}
// tour: idle → script plays; any input → visitor; 25 s quiet → tour returns
let tourOn = true, idleAt = 0, tourT = 0;
const takeover = () => { tourOn = false; drive.live = true; idleAt = performance.now(); cursor.style.display = 'none'; camK = 1; };
['pointerdown', 'wheel', 'keydown'].forEach((ev) => addEventListener(ev, (e) => { if (e.isTrusted) takeover(); }, {capture: true}));
const held = new Set();
addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase(); held.add(k);
  if (k === ' ') { ui.playing = !ui.playing; sync(); e.preventDefault(); }
  if (k === 'x') { drive.v = 0; drive.side = 0; drive.live = true; }
  if (k === '1' || k === '2' || k === '3') act(['TROT', 'WALK', 'BOUND'][+k - 1]);
});
function steer(dt) {
  if (!drive.live) return;
  if (held.has('w')) drive.v = Math.min(1.5, drive.v + dt * 1.5);
  if (held.has('s')) drive.v = Math.max(-1, drive.v - dt * 1.5);
  drive.side = held.has('a') ? 1 : held.has('d') ? -1 : 0;
  if (held.has('q')) drive.heading += dt * 0.9;
  if (held.has('e')) drive.heading -= dt * 0.9;
  const sp = GAITS[drive.gait].freq * P.stride * drive.v;
  drive.x += Math.cos(drive.heading) * sp * dt; drive.z -= Math.sin(drive.heading) * sp * dt;
  drive.x -= Math.sin(drive.heading) * drive.side * 0.05 * dt; drive.z -= Math.cos(drive.heading) * drive.side * 0.05 * dt;
  // treadmill: the robot stays in frame, the floor rings scroll under it
  robot.rotation.y = drive.heading;
  grid.position.set(-(drive.x % 0.55), 0.0005, -(drive.z % 0.55));
}
addEventListener('keydown', (e) => { if (e.key === 'h') document.querySelector('.hud').style.display = document.querySelector('.hud').style.display === 'none' ? '' : 'none'; });
setInterval(() => { if (!tourOn && performance.now() - idleAt > 25000) { tourOn = true; tourT = 0; } }, 1000);
// film: ?film → fixed 1600×900 layout, render(t) pure, driven by capture
const FILM = new URLSearchParams(location.search).has('film');
function renderAt(t) { applyScript(t); pose(state(t), ui.exploded); ctl.update(); renderer.render(scene, cam); panels(state(t)); callouts(); }
window.__film = {renderAt, DUR, SCRIPT};
// expose for headless stills
window.__solo = {ui, view, act, setT: (t) => (ui.t = t), takeover};
requestAnimationFrame(frame);
