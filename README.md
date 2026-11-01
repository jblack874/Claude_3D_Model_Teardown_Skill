# Claude 3D Model Teardown Skill

Joe's project for turning a real robot into an interactive 3D simulator, using the open-source **teardown** Claude skill. The simulator should open up into exploded views and show live gauges.

**Status:** Building the ODRI Solo-12 quadruped (option A1). v4 adds the live page, auto-tour, drive controls and a 60 fps scored film.

## What's in here
| Path | What it is |
|---|---|
| `machines/solo12/` | **The build.** `dist/solo12.html` is the offline page: download it and double-click to open. `film/solo12.mp4` is the 24 s film at 60 fps with sound. `kin.js` + `main.js` are the source; see its README for controls and the quality criteria |
| `refs/odri/` | The ODRI actuator spec and licence that the drivetrain numbers come from |
| `HANDOFF.md` | The full method: how the files were read, the commands run, the agent prompts, the criteria, the number checks against the sources, and the 10-minute build plan. **Start here when resuming.** |
| `PROJECT.md` | The gap log, the vetting criteria and the specs for both options |
| `viz/` | One visual board per option, opened as PNG images |
| `skill/teardown/` | Unmodified copy of the teardown skill (MIT, credit kept). `VENDORED.md` has setup steps |
| `scripts/` | Board builders, the mesh packer (`pack_meshes.py`) and film capture (`solo12_film.mjs`) |
| `scripts/option_boards.py` | Builds the boards from the robots' source images and PAROL6's forward kinematics (its published DH table) |

## How to open
Click any PNG in `viz/`, or open `HANDOFF.md`, and GitHub renders it in the browser.

## Sources
- teardown skill, MIT. Vendored copy in `skill/teardown/`; upstream: https://github.com/elvarofficial/teardown (built on https://github.com/whaleyxbt/claude-motion)
- ODRI open robot actuator hardware (Solo-8/12), BSD-3: https://github.com/open-dynamic-robot-initiative/open_robot_actuator_hardware
- PAROL6 arm, GPLv3: https://github.com/PCrnjak/PAROL6-Desktop-robot-arm
- PAROL6 control software (DH table): https://github.com/PCrnjak/PAROL-commander-software
- NASA JPL Open Source Rover, Apache-2.0: https://github.com/nasa-jpl/open-source-rover
- Berkeley Humanoid Lite, MIT: https://github.com/HybridRobotics/Berkeley-Humanoid-Lite · assets, CC-BY-SA-4.0: https://github.com/HybridRobotics/Berkeley-Humanoid-Lite-Assets
- Source article: "How I Turn Any Machine Into a 3D Simulator You Can Take Apart" by @elvar_official on X, Oct 30 2026
