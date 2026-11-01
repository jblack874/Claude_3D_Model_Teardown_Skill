# Claude 3D Model Teardown Skill

Joe's project for turning a real robot into an interactive 3D simulator, using the open-source **teardown** Claude skill. The simulator should open up into exploded views and show live gauges.

**Status:** Steps 1–4 are done. Two candidate robots have been vetted, and the build starts when one is picked: **A**, the ODRI Solo-12 quadruped, or **B**, the PAROL6 6-axis arm.

## What's in here
| Path | What it is |
|---|---|
| `HANDOFF.md` | The full method: how the files were read, the commands run, the agent prompts, the criteria, the number checks against the sources, and the 10-minute build plan. **Start here when resuming.** |
| `PROJECT.md` | The gap log, the vetting criteria and the specs for both options |
| `viz/` | One visual board per option, opened as PNG images |
| `scripts/option_boards.py` | Builds the boards from the robots' source images and PAROL6's forward kinematics (its published DH table) |

## How to open
Click any PNG in `viz/`, or open `HANDOFF.md`, and GitHub renders it in the browser.

## Sources (not copied into this repo)
- teardown skill, MIT: https://github.com/elvarofficial/teardown (built on https://github.com/whaleyxbt/claude-motion)
- ODRI open robot actuator hardware (Solo-8/12), BSD-3: https://github.com/open-dynamic-robot-initiative/open_robot_actuator_hardware
- PAROL6 arm, GPLv3: https://github.com/PCrnjak/PAROL6-Desktop-robot-arm
- PAROL6 control software (DH table): https://github.com/PCrnjak/PAROL-commander-software
- Source article: "How I Turn Any Machine Into a 3D Simulator You Can Take Apart" by @elvar_official on X, Oct 30 2026
