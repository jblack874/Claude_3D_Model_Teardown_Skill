"""Build one simple visual board per option from the robots' own repo images + a DH-driven schematic."""
import sys, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont
from math import pi
R = sys.argv[1]            # refs dir
OUT = sys.argv[2]          # output dir
INK, ACC, BG = "#1d1d1f", "#e8562a", "#f6f3ee"

# ---- PAROL6 forward kinematics from PAROL6_ROBOT.py (standard DH) ----
a1,a2,a3,a4,a5,a6,a7 = [v/1000 for v in (110.50,23.42,180,43.5,176.35,62.8,45.25)]
DH = [(a1,a2,-pi/2),(0,a3,pi),(0,-a4,pi/2),(-a5,0,-pi/2),(0,0,pi/2),(-a6,-a7,pi)]  # (d,a,alpha)
def T(th,d,a,al):
    ct,st,ca,sa = np.cos(th),np.sin(th),np.cos(al),np.sin(al)
    return np.array([[ct,-st*ca,st*sa,a*ct],[st,ct*ca,-ct*sa,a*st],[0,sa,ca,d],[0,0,0,1]])
def chain(q):
    M=np.eye(4); pts=[M[:3,3].copy()]
    for qi,(d,a,al) in zip(q,DH):
        M=M@T(qi,d,a,al); pts.append(M[:3,3].copy())
    return np.array(pts)

fig,ax=plt.subplots(figsize=(6,6),dpi=150); fig.patch.set_facecolor(BG); ax.set_facecolor(BG)
standby=np.deg2rad([0,-90,180,0,0,180]); reach=np.deg2rad([0,-50,140,0,40,180])
for q,c,lw,lab in [(standby,"#9a958c",3,"standby  (0,-90,180,0,0,180)°"),(reach,ACC,4,"reach    (0,-50,140,0,40,180)°")]:
    p=chain(q); ax.plot(p[:,0]*1000,p[:,2]*1000,"-o",color=c,lw=lw,ms=7,mfc="white",mec=c,label=lab)
ax.axhline(0,color=INK,lw=1); ax.set_aspect("equal"); ax.set_xlabel("x (mm)"); ax.set_ylabel("z (mm)")
ax.set_title("PAROL6 side view — posed from its published DH table",fontsize=10,color=INK)
ax.legend(fontsize=7,loc="lower right",frameon=False); ax.grid(alpha=.25)
fig.tight_layout(); fig.savefig(f"{OUT}/_parol_fk.png"); plt.close(fig)

def fit(p,w,h):
    im=Image.open(p).convert("RGB"); im.thumbnail((w,h)); c=Image.new("RGB",(w,h),BG); c.paste(im,((w-im.width)//2,(h-im.height)//2)); return c
def font(s):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf","/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        try: return ImageFont.truetype(f,s)
        except OSError: pass
    return ImageFont.load_default()
def board(name,sub,panels,caps,specs,out):
    W,H,PH=1800,1000,620; b=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(b)
    d.rectangle([0,0,22,H],fill=ACC); d.text((60,40),name,fill=INK,font=font(46)); d.text((60,100),sub,fill="#6b665e",font=font(22))
    pw=(W-60*2-30*2)//3
    for i,(p,cap) in enumerate(zip(panels,caps)):
        x=60+i*(pw+30); b.paste(fit(p,pw,PH),(x,160)); d.rectangle([x,160,x+pw,160+PH],outline="#d8d2c8",width=2)
        d.text((x,160+PH+12),cap,fill=INK,font=font(20))
    y=160+PH+60
    for s in specs: d.text((60,y),s,fill=INK,font=font(21)); y+=32
    b.save(out)

A=f"{R}/odri_hw/mechanics"
board("OPTION A — ODRI Solo-12 quadruped","Open Dynamic Robot Initiative · BSD-3 · 12 DOF · 4 legs × 3 actuator modules",
  [f"{A}/quadruped_robot_12dof_v1.1/images/quadruped_12dof_v1.1_1.jpg",f"{A}/actuator_module_v1/images/actuator_module_component_overview_1.jpg",f"{A}/actuator_module_v1/images/actuator_module_open_1.jpg"],
  ["Hero: the full robot","Exploded: one actuator module","Cutaway target: 2-stage belt drive"],
  ["Drive: T-Motor Antigravity 4004 300 kV → 10T:30T → 10T:30T AT3 belts = 9:1   ·   segment 160 mm   ·   module 150 g   ·   2.5 N·m @ 12 A",
   "Hand check: 2nd-stage belt 67 teeth × 3 mm pitch = 201 mm (matches spec)   ·   (30/10)² = 9:1",
   "One input: gait phase → closed-form 3-DOF leg IK → 12 joint angles → belts, encoders, torque gauges"],f"{OUT}/option_A_solo12.png")
P=f"{R}/parol_hw/Images"
board("OPTION B — PAROL6 6-axis desktop arm","Source Robotics · GPLv3 · 6 DOF · NEMA17 steppers, planetary + belt reductions",
  [f"{P}/img1.jpg",f"{OUT}/_parol_fk.png",f"{P}/img3.png"],
  ["Hero: the arm","Model: FK from the real DH table","Context: arm in a working pose"],
  ["Reductions per joint: J1 6.4 · J2 20 · J3 20×38/42 ≈ 18.1 · J4 4 · J5 4 · J6 10   ·   links 110.5 / 180 / 176.35 mm",
   "Hand check: J1 sweep 246.094° × 6.4 ÷ 0.05625°/µstep = 28,000 motor microsteps",
   "One input: trajectory phase t → 6 joint angles → FK pose, step counts, gear/belt speeds (torques estimated, masses unpublished)"],f"{OUT}/option_B_parol6.png")
print("ok")
