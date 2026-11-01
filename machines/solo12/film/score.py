"""Solo-12 film score: a quiet chord bed (Am9, 96 bpm), a soft thud on every foot touchdown (from the gait model:
touchdown when (t*1.6 + leg phase) crosses an integer), a click on every operator button press, a motor whine
under the x-ray / exploded beats, and an air swell when the modules spread and when they close."""
import os, json
from sfx.score_kit import airy, bed, chords, hz, motor, thud
from sfx.synth import click

TIMELINE = "timeline.json"
OUT = os.path.join(os.environ.get("TEARDOWN_OUT", "teardown-out"), "solo12-score.wav")
TARGET_LUFS = -14.0
SEED = 12
CHORDS = chords("Am9:A1 E2 G2 B2 C3/A0", "Fmaj7:F1 C2 E2 A2/F0", "Cmaj7:C2 G2 B2 E3/C1", "G6:G1 D2 E2 B2/G0")
MOTIF = [(0.5, hz("E5")), (1.5, hz("G5")), (2.5, hz("B4"))]

def score(mix, tl):
    dur = tl["duration"]
    left, right, low, drums = bed(dur, 96, CHORDS, MOTIF, motif_voice="epiano", kicks=(0,), snares=(), hats=8, swing=0.0, keys_vel=0.6, keys_lp=3400)
    mix.put_stereo(0, left, right, 0.10); mix.put(0, low, 0.10); mix.put(0, drums, 0.03)
    f = tl["gait_hz"]
    for ph in (0.0, 0.5):                      # diagonal pairs touch down together
        n = 0
        while True:
            t = (n - ph) / f
            n += 1
            if t < 0: continue
            if t > dur - 0.2: break
            mix.put(t, thud(70 if ph else 85, 0.04, 0.3), 0.07)
    for t in tl["beats"][1:]:
        mix.put(t, click(2400, 0.025), 0.06)
    mix.put(8.4, motor(4.0, 160, 1100, 12), 0.018)
    mix.put(12.6, airy(1.4, 600, 1800, 0.6), 0.035)
    mix.put(20.1, airy(1.4, 1800, 600, 0.6), 0.035)
