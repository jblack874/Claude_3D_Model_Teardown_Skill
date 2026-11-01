# Vendored copy: teardown skill

- Upstream: https://github.com/elvarofficial/teardown
- Commit: a91262ac1109051e014662d42ecb0b7bc1f113b1 (2026-10-31)
- License: MIT. The copyright lines for elvarofficial and whaleyxbt are kept in `LICENSE`. The audio samples in `sfx/samples/` are CC0 (see `SOURCES.md`).
- Copied unchanged. Nothing in this folder has been edited.

## Running it in a Claude cloud session
```bash
cd skill/teardown && npm install
export CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome   # don't run `npx playwright install` here
node sims/build.mjs                    # builds the 3 example machines (6 pages, about 800 KB each) into ./teardown-out/dist
```
On a normal machine, follow `SKILL.md` as written: `npm install && npx playwright install chromium`.
