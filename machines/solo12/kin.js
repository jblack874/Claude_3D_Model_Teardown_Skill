// ODRI Solo-12 — the math. Metres, radians. One input: gait phase (0..1 per stride) plus time.
// SOURCED (open_robot_actuator_hardware/actuator_module_v1/README.md): 9:1 = two 3:1 AT3 belt stages (10T→30T),
// belts 50T/150 mm + 67T/201 mm, T-Motor Antigravity 4004 300 kV, segment 160 mm, 2.5 N·m @ 12 A.
// ASSUMED (tagged): body size, hip offsets, gait stride/lift/height, mass split.
export const P = {
  ratio: 9, stage: 3, pulleySmallT: 10, pulleyBigT: 30, pitch: 0.003,     // SOURCED
  belt1T: 50, belt2T: 67,                                                  // SOURCED
  upper: 0.16, lower: 0.16,                                                // SOURCED (segment 160 mm)
  tauMax: 2.5, iMax: 12,                                                   // SOURCED
  bodyL: 0.42, bodyW: 0.12, bodyH: 0.07, hipX: 0.195, hipY: 0.075,         // ASSUMED
  haaOff: 0.06,                                                            // ASSUMED (HAA → HFE lateral)
  mass: 2.5, g: 9.81,                                                      // ASSUMED (Solo-12 ~2.5 kg)
  height: 0.24, stride: 0.10, lift: 0.05, freq: 1.6,                       // ASSUMED trot
};
// gaits (ASSUMED standard quadruped patterns): leg phase offsets FL, FR, HL, HR and stance duty
export const GAITS = {
  TROT: {off: [0, 0.5, 0.5, 0], duty: 0.5, freq: 1.6},
  WALK: {off: [0, 0.5, 0.75, 0.25], duty: 0.75, freq: 1.0},
  BOUND: {off: [0, 0, 0.5, 0.5], duty: 0.45, freq: 2.0},
};
export const KT_OUT = P.tauMax / P.iMax;              // 0.208 N·m/A at the output
export const LEGS = [
  {id: 'FL', sx: 1, sy: 1, ph: 0}, {id: 'FR', sx: 1, sy: -1, ph: 0.5},
  {id: 'HL', sx: -1, sy: 1, ph: 0.5}, {id: 'HR', sx: -1, sy: -1, ph: 0},
];
// hand check (printed at load): 67 T × 3 mm = 201 mm; (30/10)^2 = 9
export const CHECK = {belt2mm: P.belt2T * P.pitch * 1000, ratio: (P.pulleyBigT / P.pulleySmallT) ** 2};

/** foot target in the hip frame (x fwd, z down) for leg phase u in 0..1: stance 0..0.5, swing 0.5..1 */
function foot(u, gait) {
  const s = gait.stride, h = gait.lift, D = gait.duty ?? 0.5;
  if (u < D) { const k = u / D; return {x: s / 2 - s * k, z: gait.height, stance: true}; }
  const k = (u - D) / (1 - D);
  return {x: -s / 2 + s * (0.5 - 0.5 * Math.cos(Math.PI * k)), z: gait.height - h * Math.sin(Math.PI * k), stance: false};
}
/** planar 2-link IK, knee bent backward (Solo "X" or "<" stance): returns hfe, kfe */
function ik(x, z) {
  const a = P.upper, b = P.lower;
  const d = Math.min(Math.hypot(x, z), a + b - 1e-4);
  const c = (a * a + b * b - d * d) / (2 * a * b);
  const kfe = Math.PI - Math.acos(Math.max(-1, Math.min(1, c)));
  const alpha = Math.atan2(x, z);
  const beta = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  return {hfe: alpha + beta, kfe: -kfe};
}
/** full state at time t (s) — pure function */
export function state(t, gait = P) {
  const phase = (((t * gait.freq) % 1) + 1) % 1;
  const nStance = Math.max(1, Math.round(4 * (gait.duty ?? 0.5)));
  const legs = LEGS.map((L, li) => {
    const u = (phase + (gait.off ? gait.off[li] : L.ph)) % 1;
    const f = foot(u, gait);
    const {hfe, kfe} = ik(f.x, f.z);
    const haa = 0.04 * Math.sin(2 * Math.PI * (phase + (gait.off ? gait.off[li] : L.ph))) * L.sy + (gait.side || 0) * L.sy * 0.25;          // ASSUMED small sway
    const w = 2 * Math.PI * gait.freq;
    // joint speeds by finite difference of the same model (still pure)
    const f2 = foot((u + 1e-3) % 1, gait), j2 = ik(f2.x, f2.z), dt = 1e-3 / gait.freq;
    const dHfe = (j2.hfe - hfe) / dt, dKfe = (j2.kfe - kfe) / dt;
    // quasi-static knee torque in stance: weight share × horizontal moment arm of the knee→foot
    const Fz = f.stance ? (gait.mass * gait.g) / nStance : 0.4;               // swing: link inertia ~0.4 N
    const tauK = Fz * P.lower * Math.sin(hfe + kfe) * -1;
    const tauH = Fz * (f.x);
    const iK = Math.abs(tauK) / KT_OUT, iH = Math.abs(tauH) / KT_OUT;
    return {
      ...L, u, stance: f.stance, footX: f.x, footZ: f.z, footLift: gait.height - f.z,
      haa, hfe, kfe, dHfe, dKfe, w,
      motorKfe: kfe * P.ratio, motorHfe: hfe * P.ratio,                       // motor angle = joint × 9
      stage1Kfe: kfe * P.stage,                                               // middle pulley = joint × 3
      rpmK: (dKfe * P.ratio * 60) / (2 * Math.PI), rpmH: (dHfe * P.ratio * 60) / (2 * Math.PI),
      beltK: Math.abs(dKfe * P.ratio) * (P.pulleySmallT * P.pitch / (2 * Math.PI)), // m/s on stage 1
      tauK, tauH, iK, iH,
    };
  });
  return {t, phase, legs};
}
