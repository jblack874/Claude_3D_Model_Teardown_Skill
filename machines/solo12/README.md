# Solo-12 simulator — v1 checkpoint (10-minute build)

- **Open:** `dist/solo12.html` is a single offline file of 740 KB. Download it and double-click to open it in Chrome.
- **Source:** `kin.js` holds the math. Gait phase drives the IK, the 9:1 drivetrain angles, torque and current. `main.js` holds the geometry, the panels and the controls.
- **Rebuild:** `cd skill/teardown && npm install && node sims/build.mjs ../../machines/solo12`
- **Controls:** drag to orbit, scroll to zoom. Buttons switch views (HERO / ACTUATOR / SIDE / TOP / BODY) and display modes (LABELS / EXPLODED / X-RAY / TURNTABLE). The scrubber at the bottom sets the time.
- **Numbers taken from the source:** 9:1 reduction (two 3:1 AT3 belt stages), belts of 50T/150 mm and 67T/201 mm, the 4004 300 kV motor, a 160 mm segment, and 2.5 N·m at 12 A (`refs/odri/actuator_module_v1_README.md`).
- **ASSUMED:** body dimensions, hip offsets, the trot parameters (100 mm stride, 50 mm lift, 1.6 Hz), mass of 2.5 kg, and that the HAA module is a scaled copy of the leg module.

## Known issues for the next pass
1. In exploded view, the parts spread too far on the outer legs, and the HAA modules float as loose bars.
2. The belt loops are drawn as thin tubes with no teeth.
3. The film/tour (an auto cursor following the render(t) contract) is not built yet.
4. Fps has only been tested on a software renderer. It still needs a test on a laptop's integrated GPU.

## v2 (2026-10-31, 21:06 brief): real meshes, auto-tour, film
Quality criteria set by the coordinator. They are taken from the teardown article's 9 prompts and the example screenshots, because X blocked automated reading of the post itself:

| # | Criterion (source) | Check | Status |
|---|---|---|---|
| Q1 | One input drives everything; nothing is hand-keyed (Step 3) | Gait phase poses the joints, pulleys, gauges, charts and score | PASS |
| Q2 | Console (Step 4): big live number at top left, charts that move with the machine, a button per assembly, camera views, callouts | Knee torque/rpm, torque chart, foot-height chart, 5 views, 4 display modes, 5 callouts | PASS (the callouts are dot markers, not leader lines) |
| Q3 | Look (Step 5): pale studio, one accent for the working part, machine fills 60–70% of the view, ink outline on near-white parts | Stills read at each beat | PASS |
| Q4 | Critic (Step 6): a still at every beat; nothing passes through another part; labels never cover what they name | Beat stills in `film/beats/` | PARTIAL: two callouts sit close together at the HERO angle |
| Q5 | Page you drive (Step 7): cursor tour; any click, drag, scroll or key hands over; 25 s idle returns the tour; orbit and zoom; a key hides the panels | Implemented; `H` hides the HUD | PASS (no integrated-GPU test yet) |
| Q6 | Film (Step 8): render(t) is pure; 60 fps, 1920×1080, H.264 yuv420p faststart; score on the same timeline | `scripts/solo12_film.mjs`, `film/score.py`, `film/timeline.json` | PASS (the 1080p frame is rendered at 1600×900 and upscaled) |
| Q7 | Publish (Step 9): page under 1 MB | 1.22 MB, because of the real ODRI meshes | ACCEPTED trade-off; hosted as a claude.ai artifact |

Coordinator rulings:
- Real meshes are worth the extra 0.2 MB.
- 60 fps is kept even though rendering on the CPU is slow.
- The procedural pulleys and belts stay, because they are what show the 9:1 motion.
- The mesh fit is automatic: the longest axis of each part goes along the leg.

## v3 (21:23): controls taken from visual-learning.app (the author's live site)
- WASD/QE move, X stop, 1/2/3 switch gaits (TROT / WALK / BOUND, phase patterns ASSUMED), space pause, H hide panels, drag to orbit, AUTO ▶ resumes the tour
- Coordinator fixes: ACTUATOR camera pulled back to the 60–70% fill rule; timeline clock corrected to 24 s; chart history no longer flatlines in the first second

## v5 close-out (21:53)
- Joe's laptop test (2862×1632 screen): the robot shrank and walked out of frame, and the HUD was tiny. **Fixed.** Driving now uses a treadmill (the robot stays centred while the floor scrolls), and the HUD scales with the window.
- Film is final: `film/solo12.mp4` is v2 (24 s, 1920×1080, 60 fps, AAC score). The camera now moves on a sphere around the robot, so it never passes through it. Beat stills are in `film/beats/`, the contact sheet is `film/beats-sheet.png`.
- Meshes **kept**. The page is 1.2 MB, which fails the 1 MB link-preview rule but is fine on the claude.ai artifact host. Drop `meshes.js` only if the page has to unfurl as an X link card.

## v6 bug cleanup (2026-11-01)
Swept every view and mode with `scripts/solo12_sweep.mjs` (stills in `stills/`; no console errors, no NaN on any panel).
- Callouts: each label now sits beside its part with a thin leader line, and labels are stacked so they never overlap. Before this, MOTOR / STAGE 1 collided and FOOT CONTACT covered the foot.
- Camera moves and the explode animation run on real time, so they no longer crawl on a slow GPU.
- SIDE and BODY views pulled back so the robot stays clear of the side panels.
- Test hook `__solo.settle()` added so automated sweeps capture finished transitions.
