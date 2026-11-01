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
