# Claude 3D Model Teardown Skill 2 — project log

## Status: Steps 1–4 done, waiting on the option pick (A or B)

## Audit of the zip
- The zip holds the source article as a PDF, 6 screenshots and 2 screen recordings of the Pelagos OC-8 reference. It contains no skill code.
- The skill code is in github.com/elvarofficial/teardown (MIT). It is cloned to `teardown_repo/` and is complete: kit, 3 examples, capture, sfx.
- Smoke test passed. `npm install` installed 7 packages. `build.mjs` built all 6 pages, each about 800 KB. `capture.mjs` rendered a Cessna still (teardown_repo/teardown-out/cessna-8.png).

## Gaps found and how each was filled
| # | Gap | Fix |
|---|-----|-----|
| 1 | The zip has no skill code | Cloned the repo from the GitHub link in the article |
| 2 | Article Steps 3–9 prompts are cut off in the screenshots | The full text is in the PDF and was extracted |
| 3 | `npx playwright install chromium` is not allowed in this environment | Use `export CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. The chromium-1208 path does not exist here |
| 4 | `npx skills add -g` is not needed | Build a custom machine with `node teardown_repo/sims/build.mjs ./<machine>` and `import ... from 'teardown-kit/...'` |
| 5 | This environment has no GPU (SwiftShader). Step 7 calls for an integrated-GPU test, and 60 fps video capture is slow | Review with stills and beat sheets here. Run the fps/tier test on Joe's laptop. Treat the video (Step 8) as optional or last |
| 6 | Step 9 deploys to Vercel, which has no connection here | Publish as a claude.ai Artifact. Keep the 1 MB rule |
| 7 | Step 2 needs a reference, and Joe is not supplying sources | The coordinator sourced open CAD, papers and code (below) |
| 8 | The OC-8 octopus is a fictional machine with no real numbers | Used as the target for the look only. The build target is a real robot with published numbers |

## Vetting criteria (coordinator)
- C1: Source depth. At least one public exploded or assembly view, plus a cutaway or detail drawing or CAD.
- C2: Real dimensioned numbers (links, ratios, motors), each one traceable to a source.
- C3: One scalar input poses the whole machine using closed-form kinematics.
- C4: Mid-level complexity. 6–12 subsystems and at least 3 mechanism types.
- C5: One number that can be checked by hand.
- C6: At least 4 live readouts that can be derived from the model.
- C7: Clean license or IP.
- C8: Coordinator spot-check against the primary repo. Passed for both options.

## Option A: ODRI Solo-12 quadruped (BSD-3)
- Repo: refs/odri_hw/mechanics/quadruped_robot_12dof_v1.1 (SolidWorks zip + STL) and actuator_module_v1 (PDF drawings)
- 9:1 reduction from 2 × 3:1 AT3 belt stages (10T→30T). Belts are 50T/150 mm and 67T/201 mm. Motor is a T-Motor Antigravity 4004 300 kV. Segment length 160 mm. Module mass 150 g. Output 2.5 N·m at 12 A (README; one agent wrote 2.7, which is wrong).
- Hand check: 67 × 3 mm = 201 mm belt, and (30/10)² = 9:1.
- Weak spot: no published cutaway. The section view will be cut from the STL and PDF drawings.

## Option B: PAROL6 6-axis desktop arm (GPLv3)
- Repo: refs/parol_sw/GUI/files/PAROL6_ROBOT.py (DH params, ratios, limits); refs/parol_hw (43 STL, BOM). There is no STEP in the repo.
- DH: a1–a7 = 110.50 / 23.42 / 180 / 43.5 / 176.35 / 62.8 / 45.25 mm. Ratios are [6.4, 20, 20×38/42, 4, 4, 10]. J1 range is ±123.047°. Steppers are 200 steps × 32 microsteps.
- Hand check: J1 sweep 246.094° × 6.4 / 0.05625° = 28,000 motor microsteps.
- Weak spot: link masses are unpublished, so torques will be estimated and labelled as estimates.

---
## Round 2 (2026-10-31, 20:36): Joe rejected A (Solo-12) and B (PAROL6) and asked for a rerun
Assumption: the rerun excludes quadrupeds and desktop arms. The same criteria, C1–C8, apply.

Candidates vetted: JPL Open Source Rover, the best open-source tentacle/continuum robot (OpenCR), Berkeley Humanoid Lite, LEAP Hand, and the scferro cycloidal actuator.
Rejected:
- OpenCR: segment geometry is unpublished, so it fails C2.
- LEAP Hand: the servos are sealed boxes with no visible drive, so it fails C1/C4.
- scferro actuator: it's a single actuator with no licence.

### Option A2: NASA JPL Open Source Rover (Apache-2.0, OSHWA US002551)
- Repo: refs/osr. It has Onshape CAD and exploded views (`mechanical/rocker_bogie/images/exploded_view.png`, `mechanical/images/exploded_mechanical.png`).
- Drive: 6 × goBILDA 5203 gearmotors (26.9:1, 223 RPM) and 4 corner-steering servos. Wheel diameter is 144 mm (parts_list/README.md line 17). The agent had said Traxxas tires at about 137 mm; corrected from the source.
- Hand check: 144 mm × π × 223 RPM ÷ 60 = 1.68 m/s, which matches the README's top speed of about 1.6 m/s.
- Weak spot: rocker and bogie link lengths are not published. They'll be measured from the CAD, or assumed and tagged ASSUMED.

### Option B2: Berkeley Humanoid Lite leg (code MIT, assets CC-BY-SA-4.0)
- Repos: refs/bhl_Lite and refs/bhl_Assets. These have the URDF/MJCF, per-link STL meshes and OpenSCAD files.
- From `motor_configuration.json`: gear_ratio 15 (the file says −15; the sign is direction), Kt 0.1176 N·m/A, 14 pole pairs, 4096-cpr encoder, 20 A current limit.
- From the URDF: thigh 150 mm, shank 160 mm. Joint limits: knee 0–140°, ankle pitch ±45°, ankle roll ±15°, hip pitch −108.75° to +56.25°.
- Hand check: 0.1176 × 15 × 20 A ≈ 35 N·m output ceiling before losses.
- Weak spot: the cycloidal pin and lobe counts are unpublished. A 15:1 ratio fits a 16-pin, 15-lobe disc; that will be ASSUMED unless the CAD shows otherwise.

Boards: viz/option_A_osr.png, viz/option_B_bhl_leg.png (scripts/option_boards_v2.py)
