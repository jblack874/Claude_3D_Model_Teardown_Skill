# HANDOFF — Claude 3D Model Teardown Skill

Session date: 2026-10-31. Status: **paused after Step 4.** The two vetted options are delivered and waiting on Joe's `GO A` or `GO B`. No 3D build has started.

This document lays out the work: what was run, in what order, and why each decision went the way it did. It covers every command, every agent prompt and every criterion, so a fresh session can pick it up cold. It does not reproduce internal reasoning traces; it gives the decisions and the evidence behind each one.

---

## 0. Pick-up checklist for a fresh session

1. Clone `jblack874/Claude_3D_Model_Teardown_Skill`, which holds this file, `PROJECT.md`, `viz/` and `scripts/`.
2. Re-create the working tree (section 3). The skill and the reference repos are third-party and are cloned, not committed.
3. Set `CHROMIUM` (section 3.3) before running any capture.
4. Read `PROJECT.md` for the gap log and the specs of both options.
5. When Joe picks an option, follow section 9 (Step 5 build plan). Hard stop at 10 minutes: save, then send 3 critical questions.

---

## 1. Objective as given (Joe's 7-step brief)

| Step | Ask | Status |
|---|---|---|
| 1 | Y/N: is the goal clear once the project is formed | **Y**. Goal: an interactive 3D simulator of a real robot built with the teardown skill, at the visual standard of the Pelagos OC-8 clips, with exploded views of its mechanisms |
| 2 | A proceed-or-stop prompt | Delivered as `GO A` / `GO B` / `STOP`. Joe replied **STOP**, plus 3 interim asks (this document is one of them) |
| 3 | 2 robot options, vetted by a coordinator agent against criteria the coordinator writes | Done (sections 5–7) |
| 4 | Send the 2 validated options and ask which to build | Done. Visual boards are in `viz/` |
| 5 | Build efficiently; the broad 3D motion beats component precision; **hard stop at 10 min**, save, send 3 critical questions | Not started |
| 6 | Wait for answers | — |
| 7 | Collaboration phase | — |

Constraints Joe set: no 3D models before the pick. Fill gaps instead of asking. Joe supplies no sources; the coordinator finds them. Complexity is mid-level. Exploded and multi-layer views are required.

---

## 2. Inputs and how each was parsed

| Input | Type | How it was read | What it contributed |
|---|---|---|---|
| `Claude_3D_Model_Teardown_Skill_2.zip` (146 MB) | zip | `unzip` into a fresh, empty project folder (`src/`). `__MACOSX/` resource forks ignored | Holds **no skill code**: a PDF of the article, 6 phone screenshots and 2 screen recordings |
| Article PDF (inside the zip) | PDF | `pdftotext -layout` produced 150 lines of plain text | The full text of all 9 prompts, which are cut off at the right edge in the screenshots, plus the GitHub link to the skill |
| 16 chat-attached images | images | Read visually, in context | Article screenshots (steps, prompts, examples) and 4 OC-8 frames, which set the **visual target**: pale studio, orange accent, mono-type HUD panels, assembly/display buttons, an operation-log scrubber |
| 2 screen recordings (`.mp4`) | video | Not decoded this session. The 4 still frames Joe attached carry the same visual information | The motion target for later. Frame extraction is planned for the build (section 9) |
| Memory: `/areas/ai-3d-explorer-portfolio.md` | memory | `memory_read` | Joe's earlier 3D explorer work (Scramjet, CRM). His bar is to judge fidelity side by side against reference frames. He uses HANDOFF.md for resuming work |

### Commands used to parse

```bash
mkdir -p /home/claude/Claude_3D_Model_Teardown_Skill_2/src
cd /home/claude/Claude_3D_Model_Teardown_Skill_2/src
unzip -q -o /mnt/user-data/uploads/Claude_3D_Model_Teardown_Skill_2.zip
find . -type f ; du -sh .

pdftotext -layout "One free Claude skill builds a working 3D model of any machine, with….pdf" article.txt
```

---

## 3. Getting the skill to run (smoke test)

### 3.1 Get the code (fills Gap 1: the zip has no code)

```bash
cd /home/claude/Claude_3D_Model_Teardown_Skill_2
git clone --depth 1 https://github.com/elvarofficial/teardown.git teardown_repo
cat teardown_repo/SKILL.md            # read in full
cat teardown_repo/package.json
```

Repo layout confirmed:

```
teardown_repo/
  SKILL.md  README.md  LICENSE(MIT)  package.json  paths.mjs  sheet.mjs  wave.mjs  run_sfx.py
  sims/
    build.mjs  capture.mjs  beats.py
    kit/ runtime.js director.js hud.js stage3d.js util.js warm.js style.css
    v8-{shared,film,live}/  cessna-{shared,film,live}/  strandbeest-{shared,film,live}/
  sfx/  (pure-Python synth + mastering, CC0 samples)
```

Pinned dependencies: `three 0.186.1`, `esbuild 0.28.1`, `playwright 1.58.2`, Inter and JetBrains Mono fonts.

### 3.2 Install and build

```bash
cd teardown_repo
npm install --no-audit --no-fund      # 7 packages, ~2 s
node sims/build.mjs                   # builds all 6 example pages
```

Result: 6 offline HTML pages of **799–811 KB** each, which meets the skill's own under-1 MB rule.

### 3.3 Capture (fills Gap 3: a browser path the skill can actually use)

The skill's setup line `npx playwright install chromium` is **not allowed** in this cloud environment, because Chromium comes preinstalled. Playwright's default path (`chromium-1208`) does not exist here. The browser that is actually present was found with:

```bash
ls /opt/pw-browsers/             # chromium-1243, chromium_headless_shell-1243, ffmpeg-1011
```

Fix:

```bash
export CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
node sims/capture.mjs cessna-film --size 1600x900 --dpr 1 --still 8 --out teardown-out/cessna-8.png
# prints: gpu: ANGLE (... SwiftShader ...)  → software renderer, works
```

The still was read back and inspected. The Cessna console, gear, callouts and timeline all rendered correctly, which proves the pipeline end to end: build, then headless render, then PNG.

### 3.4 Skill code blocks that matter for our build

From `SKILL.md`, the **render(t) contract**. Every machine has to follow it:

```js
import {runSim} from '../kit/runtime.js';

const DEFAULTS = {duration: 20, fps: 60, hud: {enabled: false}, director: {enabled: false}};

runSim(DEFAULTS, async ({cfg, canvas, capture}) => {
  // build the scene, precompute anything stateful
  return {render(t) { /* draw frame t from scratch */ return {}; }, resize() {}};
});
```

Rules attached to that contract:
- `render(t)` is pure. It uses no `Math.random` (use `rng(seed)` from `kit/util.js`), no `Date`, and carries no state between frames.
- Anything with its own dynamics is simulated once at load into typed arrays.
- Each beat goes into `<name>-film/timeline.json`. Frame 0 is the thumbnail.

A **custom machine** lives outside the skill folder and is built like this:

```bash
mkdir my-machine && $EDITOR my-machine/main.js
#   import {runSim} from 'teardown-kit/runtime.js'
node teardown_repo/sims/build.mjs ./my-machine
```

Recommended file split per machine, taken from SKILL.md:

| File | Job |
|---|---|
| `kin.js` | The math only. Real units, one input, every pose and readout as a function of it. No three.js |
| `<machine>.js` | Geometry built in code (lathed parts, tubes, instancing). `update(input)` poses it |
| `stage.js` | Studio, lights, shadows, post-processing. `frame(state, cam)` |
| `console.js` | A fixed 1600×900 overlay. `update(state)` redraws every panel |
| `film.js` | `SCRIPT` of operator moves, plus `render(t)` |
| `live.js` | Real-time page: buttons, orbit, an auto-tour cursor, 25 s idle hands control back to the tour |

Review commands, used in Step 6 of the build:

```bash
node sims/capture.mjs <name>-film --size 1600x900 --dpr 1.2 --stills beats --cols 4 --out teardown-out/<name>-beats.png
node sims/capture.mjs <name>-film --size 1600x900 --dpr 1.2 --stills every:0.2 --from A --to B --out ...
node sims/capture.mjs <name>-film --size 1600x900 --dpr 1.2 --out teardown-out/<name>-silent.mp4
```

---

## 4. Gap log: everything that would have stopped progress, and the fix

| # | Gap | Fix applied |
|---|---|---|
| 1 | The zip has no skill code | Cloned the repo from the GitHub link in the article |
| 2 | The prompts for Steps 3–9 are cut off in the screenshots | Extracted the full text from the PDF |
| 3 | `npx playwright install` is not allowed, and the default Chromium path is missing | `CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` |
| 4 | The install route `npx skills add -g` doesn't apply to a cloud session | Build custom machines directly with `build.mjs ./<machine>` |
| 5 | This environment has no GPU (SwiftShader), so the Step 7 integrated-GPU test isn't possible here and 60 fps video capture is slow | Review with stills and beat sheets here. Joe runs the fps test on his laptop. The video step is optional or last |
| 6 | Step 9 deploys to Vercel, which isn't connected here | Publish as a claude.ai Artifact, or push to Joe's GitHub (section 8). Keep the page under 1 MB |
| 7 | Step 2 needs a reference, and Joe supplies none | The coordinator sourced open CAD, papers and code (sections 5–7) |
| 8 | The OC-8 octopus is fictional and has no real numbers | Used as the **look target only**. The build target is a real, documented robot |
| 9 | A stop-hook flagged uncommitted changes, caused by a no-checkout clone of PAROL6 showing every file as deleted | Did **not** push to third-party repos. Switched to a sparse checkout, so the clone is clean |

---

## 5. How the criteria were set

Principle: each criterion is something that **makes or breaks the final simulator**, and each one traces back to a rule in the skill or to Joe's brief.

| ID | Criterion | Derived from |
|---|---|---|
| C1 | **Source depth.** At least one public exploded or assembly view, plus a detail drawing, cutaway or CAD | Skill rule 1 ("start from a reference, never from imagination") and Joe's requirement for exploded, multi-layer views |
| C2 | **Real dimensioned numbers.** Link lengths, ratios and motor specs, each traceable to a URL or a repo file | Skill rule 2 ("real numbers, one source") |
| C3 | **One-input kinematics.** A single scalar poses everything in closed form | Skill rule 3 ("one input drives everything"). This also protects motion over precision, per Joe's Step 5 |
| C4 | **Mid-level complexity.** 6–12 subsystems and at least 3 mechanism types | Joe: "simple in concept, mid-level complexity in criteria for components" |
| C5 | **Hand-checkable number** | The article's Cessna check (32T × 4 mm module, giving 201 mm) and Joe's "show me the check" ethic |
| C6 | **At least 4 live readouts** that can be derived from the model | Skill Step 4: every panel redraws from state, and no number is typed in |
| C7 | **License and IP clean** | So the result can be published or pushed publicly with no brand problem |
| C8 | **Coordinator spot-check** of the key numbers against the primary repo, not the agents' summaries | Joe: "verify the 2 options shipped have been vetted thoroughly." Agents can misquote, and one did (section 7) |

### How the candidates were chosen

- **Seed pool.** The candidates were well-known robots that are open-source or heavily documented and have visible mechanisms (belts, gears, linkages). That matches the OC-8 look: segmented arms with exposed drive wheels.
- **Two families**, so Joe gets a real choice. The legged family is closest to the octopus's limb motion. The manipulator/rover family has the deepest gear trains.
  - Legged: Stanford Doggo, ODRI Solo-8/12, MIT Mini Cheetah.
  - Manipulator/rover: PAROL6 arm, Perseverance rocker-bogie, Robotiq 2F-85.
- **Excluded up front:**
  - The octopus itself, which is fictional and so fails C2.
  - Branded consumer robots (Spot and similar), which fail C7.

---

## 6. Coordination: how the agents were run

Pattern: **one coordinator (this session) and two parallel research agents**, one per family. Both ran in the foreground at the same time, because the next step depended on both results. Each agent got the full criteria, a word cap and an explicit instruction not to fabricate.

### 6.1 Agent prompt, legged family (verbatim)

```
You are a research vetting agent. Today is 2026-10-31. Use WebSearch/WebFetch. Be fast and factual; DO NOT fabricate. If you can't verify a number, mark it UNVERIFIED.

Context: we will build a high-fidelity procedural three.js 3D simulator of a REAL robot (exploded views, cutaways, live gauges driven from one kinematic input). We need public source material so the build doesn't produce a "generic toy".

Vet these LEGGED robot candidates: (1) Stanford Doggo (Kau et al. 2019, coaxial 5-bar leg, belt reduction), (2) Open Dynamic Robot Initiative Solo-12 / Solo-8, (3) MIT Mini Cheetah.

Score each PASS/FAIL against these criteria:
C1 Source depth: at least one exploded/assembly view AND one section/cutaway or detailed actuator drawing, publicly available (paper figure, CAD on GitHub/Onshape, docs). Give URLs.
C2 Real dimensioned numbers: link lengths, reduction ratios (belt/planetary), motor model, mass, joint ranges. List the numbers with source URL each.
C3 One-input kinematics: can the whole motion be posed from one scalar (gait phase) with closed-form leg IK/FK? Note the leg mechanism math (e.g. 5-bar closed form).
C4 Mid-level component count: 6–12 nameable subsystems, ≥3 distinct mechanism types (gear/belt reduction, linkage, actuator/motor, bearings, electronics). List subsystems.
C5 One hand-checkable number (like "32 teeth × 4 mm module = 128 mm pitch dia; half circumference = 201 mm"). Propose one and verify it from sources.
C6 ≥4 live readouts derivable from the model (joint torque, foot height, motor current, belt speed, etc.).
C7 License/IP clean: open-source hardware license or public paper; no brand mascots.

Return a compact table per candidate (criteria, PASS/FAIL, key evidence + URL), then your recommended single best legged candidate with a 2-sentence justification. Keep the whole reply under 600 words.
```

### 6.2 Agent prompt, arm/rover family (verbatim, with the same criteria block)

```
Vet these candidates: (1) PAROL6 open-source 6-axis desktop robot arm (Source Robotics), (2) NASA Perseverance/Curiosity rover rocker-bogie mobility system (6 wheels, differential, steering actuators), (3) Robotiq 2F-85 adaptive gripper (underactuated linkage).
[C1–C7 as above, adapted: DH parameters, wheel diameter, grip stroke, TCP position, bogie angle]
Return a compact table per candidate ... Keep the whole reply under 600 words.
```

Run stats: the legged agent made 16 tool calls in about 94 s. The arm/rover agent made 20 tool calls in about 102 s.

### 6.3 Agent results

| Candidate | C1 | C2 | C3 | C4 | C5 | C6 | C7 | Verdict |
|---|---|---|---|---|---|---|---|---|
| Stanford Doggo | weak (no exploded view, CAD unreachable) | partial | PASS | PASS | PASS (48/16 = 3:1) | PASS | license unverified | Out |
| **ODRI Solo-8/12** | PASS (exploded view, STL, PDF drawings, SolidWorks) | PASS | PASS | PASS | PASS | PASS | BSD-3 | **Option A** |
| MIT Mini Cheetah | PASS (thesis has exploded and section views) | partial | PASS | PASS | inferred | PASS | **FAIL** (no open CAD) | Out |
| **PAROL6** | PASS (STL, URDF, BOM, assembly guide) | PASS | PASS | PASS | PASS | PASS | GPLv3 | **Option B** |
| Perseverance rocker-bogie | **FAIL** (drivetrain internals not public) | partial | partial (closed-loop solve) | PASS | PASS | PASS | public domain | Out |
| Robotiq 2F-85 | partial | partial | partial (underactuated) | **FAIL** (4–5 subsystems) | weak | partial | **FAIL** (patent, brand) | Out |

---

## 7. Coordinator spot-check (C8)

The agents' numbers were **not taken on trust**. The primary repos were cloned and grepped directly.

```bash
mkdir -p refs && cd refs
git clone --depth 1 https://github.com/PCrnjak/PAROL-commander-software.git parol_sw
git clone --depth 1 https://github.com/open-dynamic-robot-initiative/open_robot_actuator_hardware.git odri_hw
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/PCrnjak/PAROL6-Desktop-robot-arm.git parol_hw

grep -nE "^(a[1-7]|alpha|Joint_reduction_ratio|Joint_limits_degree|Microstep|steps)" \
  parol_sw/GUI/files/PAROL6_ROBOT.py
grep -niE "9:1|belt|pulley|4004|teeth|mm" odri_hw/mechanics/actuator_module_v1/README.md
cd parol_hw && git ls-tree -r --name-only HEAD | sed 's/.*\.//' | sort | uniq -c   # file types: 43 STL, no STEP
```

What was confirmed in the source files:

| Claim | Source file | Result |
|---|---|---|
| PAROL6 DH a1–a7 = 110.50 / 23.42 / 180 / 43.5 / 176.35 / 62.8 / 45.25 mm | `PAROL6_ROBOT.py` lines 25–31 | ✅ |
| Ratios [6.4, 20, 20×38/42, 4, 4, 10] | line 65 | ✅ |
| J1 limits ±123.046875° | line 56 | ✅ |
| 200 steps × 32 microsteps | lines 17–18 | ✅ |
| PAROL6 CAD source is open | repo tree | ❌ STL only (43 files), no STEP. STL is enough for geometry reference |
| Solo 9:1 from 2 × 3:1 belt stages | actuator README lines 20–21 | ✅ |
| Belts AT3: 50T/150 mm and 67T/201 mm | lines 56–61 | ✅ |
| T-Motor Antigravity 4004 300 kV | line 32 | ✅ |
| Segment 160 mm, module 150 g | line 8 | ✅ |
| Output torque | line 8 says **2.5 N·m at 12 A** | ⚠️ The agent said 2.7. **Corrected to 2.5** |
| Solo-12 CAD | `quadruped_robot_12dof_v1.1/` contains a SolidWorks zip, 7 STLs and reference images | ✅ |

Hand checks, worked by the coordinator:

- **Solo:** 67 teeth × 3 mm pitch = 201 mm, which matches the listed belt length. (30/10)² = 9:1.
- **PAROL6:** one motor microstep is 360° / (200 × 32) = 0.05625°. The J1 sweep is 2 × 123.046875 = 246.09375°. Steps = 246.09375 × 6.4 / 0.05625 = **28,000**.

---

## 8. GitHub: the push path

- Joe's repo `jblack874/Claude_3D_Model_Teardown_Skill` is attached to the session and cloned to `/home/claude/claude_3d_model_teardown_skill` (it holds one commit, the README).
- **Reads work. Pushes are refused** because the Claude GitHub App has no write access to this repo for Joe's account.
- To fix, do one of these:
  - Install the Claude GitHub App on the repo: https://github.com/apps/claude/installations/select_target
  - Or reconnect GitHub in claude.ai Settings → Connectors.
- A **test commit is staged locally** on branch `handoff-test`, with this file, `PROJECT.md`, `viz/` and `scripts/`. Once access is granted, run the test push:

```bash
cd /home/claude/claude_3d_model_teardown_skill
git fetch origin main && git push -u origin handoff-test
```

- Recommendation: **yes, test first.** It proves auth and branch rules with zero risk to `main`. The full build then goes to a `build/<option>` branch and merges after Joe's review.
- Never commit `node_modules/`, `teardown-out/` renders over 1 MB, or the third-party reference clones. Add them to `.gitignore`.

---

## 9. Step 5 build plan (ready to run after the pick)

Time-box: **10 minutes, then stop, save and send 3 questions.**

| Minute | Action | Output |
|---|---|---|
| 0–1 | Pull 6–8 key frames from Joe's 2 OC-8 recordings (ffmpeg scene detection) to use as the look reference | `ref/frames/*.jpg` |
| 1–3 | `kin.js`: the closed-form model from one input. **A:** gait phase, then leg IK (hip ab/ad, hip, knee), then 9:1 belt angles and torque. **B:** trajectory phase, then 6 joint angles, then DH forward kinematics, step counts and gear speeds | Hand check printed to the console |
| 3–6 | Geometry from primitives in real millimetres, built as a body plus N repeated modules. Each module gets a housing, motor can, pulleys, belt (instanced teeth) and bearings | `<machine>.js` |
| 6–8 | Clone the Cessna `stage.js` and `console.js` and restyle them to the OC-8 look: assembly buttons (HERO plus one per subsystem), display toggles (LABELS / EXPLODED / X-RAY / TURNTABLE), and 3–4 live panels | Builds clean |
| 8–9 | Exploded-view offsets along each module's local axis, driven by one `explode` scalar | — |
| 9–10 | Build, render a beat sheet, save, commit locally. **Stop.** | `teardown-out/*-beats.png` |

Priority rule from Joe: **broad 3D motion over individual component precision.** If a part fights back, simplify it to a primitive, tag it `ASSUMED`, and move on.

---

## 10. Visual boards (interim ask 1)

`scripts/option_boards.py` builds one board per option. Each board uses the robot's **own repo images** (open-licensed) plus, for PAROL6, a forward-kinematics schematic computed from its published DH table (standby and reach poses).

```bash
python3 -I scripts/option_boards.py "$PWD/refs" "$PWD/viz"
# → viz/option_A_solo12.png, viz/option_B_parol6.png
```

The core of the PAROL6 forward kinematics (standard DH), taken from the script:

```python
a1,a2,a3,a4,a5,a6,a7 = [v/1000 for v in (110.50,23.42,180,43.5,176.35,62.8,45.25)]
DH = [(a1,a2,-pi/2),(0,a3,pi),(0,-a4,pi/2),(-a5,0,-pi/2),(0,0,pi/2),(-a6,-a7,pi)]  # (d,a,alpha)
def T(th,d,a,al):
    ct,st,ca,sa = np.cos(th),np.sin(th),np.cos(al),np.sin(al)
    return np.array([[ct,-st*ca,st*sa,a*ct],[st,ct*ca,-ct*sa,a*st],[0,sa,ca,d],[0,0,0,1]])
```

---

## 11. Tools and skills used this session

| Tool or skill | Used for |
|---|---|
| Bash: unzip, pdftotext, git, npm, node, python3 | Parsing, cloning, building, capture, grep verification, board rendering |
| Read (image) | Inspecting the rendered Cessna still and both option boards before shipping |
| Agent (2 × general-purpose, in parallel) | Research vetting, one agent per robot family |
| WebSearch / WebFetch (inside the agents) | Papers, docs and spec sheets |
| memory_read | Joe's prior 3D project context |
| add_repo / register_repo_root | Attaching Joe's GitHub repo (read OK, push refused) |
| teardown skill (third-party, MIT) | The simulator kit. Read in full, not installed globally |
| `ai-3d-explorer-workflow` (Joe's own skill) | Not loaded yet. **Load it at the start of the build** (reference first, scaffold then fidelity) |

## 12. Folder map

```
/home/claude/Claude_3D_Model_Teardown_Skill_2/
  HANDOFF.md  PROJECT.md
  src/               unzipped originals (PDF, screenshots, 2 MP4s)
  teardown_repo/     the skill (MIT); node_modules; teardown-out/ (6 builds + cessna-8.png)
  refs/              parol_sw, parol_hw (sparse), odri_hw — third-party, do not commit
  scripts/option_boards.py
  viz/option_A_solo12.png  viz/option_B_parol6.png
/home/claude/claude_3d_model_teardown_skill/   Joe's GitHub clone (branch handoff-test staged)
```
