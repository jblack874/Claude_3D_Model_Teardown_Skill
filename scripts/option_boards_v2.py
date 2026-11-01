"""Rerun boards: A = JPL Open Source Rover, B = Berkeley Humanoid Lite leg (real STL meshes posed from its URDF)."""
import sys, numpy as np, xml.etree.ElementTree as ET, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from PIL import Image, ImageDraw, ImageFont
R, OUT = sys.argv[1], sys.argv[2]
INK, ACC, BG = "#1d1d1f", "#e8562a", "#f6f3ee"

def read_stl(p):
    b=open(p,'rb').read()
    if b[:5]==b'solid' and b'facet' in b[:300]:
        v=[list(map(float,l.split()[1:4])) for l in b.decode(errors='ignore').splitlines() if l.strip().startswith('vertex')]
        return np.array(v).reshape(-1,3,3)
    n=np.frombuffer(b,dtype='<u4',count=1,offset=80)[0]
    a=np.frombuffer(b,dtype=np.dtype([('n','<f4',3),('v','<f4',(3,3)),('a','<u2')]),count=n,offset=84)
    return a['v'].astype(float)
def rpy(r,p,y):
    cr,sr,cp,sp,cy,sy=np.cos(r),np.sin(r),np.cos(p),np.sin(p),np.cos(y),np.sin(y)
    return np.array([[cy*cp,cy*sp*sr-sy*cr,cy*sp*cr+sy*sr],[sy*cp,sy*sp*sr+cy*cr,sy*sp*cr-cy*sr],[-sp,cp*sr,cp*cr]])
def tf(el):
    M=np.eye(4)
    if el is not None:
        M[:3,3]=[float(x) for x in el.get('xyz','0 0 0').split()]
        M[:3,:3]=rpy(*[float(x) for x in el.get('rpy','0 0 0').split()])
    return M

U=f"{R}/bhl_Assets/data/robots/berkeley_humanoid/berkeley_humanoid_lite"
root=ET.parse(f"{U}/urdf/berkeley_humanoid_lite_biped.urdf").getroot()
joints={j.find('child').get('link'):(j.find('parent').get('link'),tf(j.find('origin'))) for j in root.findall('joint')}
def world(link):
    M=np.eye(4)
    while link in joints:
        par,T=joints[link]; M=T@M; link=par
    return M
parts=[]
for L in root.findall('link'):
    n=L.get('name')
    if not n.startswith('leg_left'): continue
    vis=L.find('visual'); 
    if vis is None: continue
    m=vis.find('geometry/mesh')
    if m is None: continue
    f=m.get('filename').split('/')[-1]
    tri=read_stl(f"{U}/meshes/{f}")
    W=world(n)@tf(vis.find('origin'))
    parts.append((n,(tri@W[:3,:3].T)+W[:3,3]))
def render(path, explode):
    fig=plt.figure(figsize=(5,6),dpi=150); fig.patch.set_facecolor(BG)
    ax=fig.add_subplot(projection='3d'); ax.set_facecolor(BG)
    cen=np.mean([t.reshape(-1,3).mean(0) for _,t in parts],0)
    cols=["#f2f0ec","#2b2b2b",ACC,"#f2f0ec","#2b2b2b","#f2f0ec"]
    order=sorted(parts,key=lambda p:-p[1].reshape(-1,3).mean(0)[2])
    for i,(n,t) in enumerate(order):
        off=np.array([0,0,-1.0])*i*explode
        pc=Poly3DCollection(t+off,facecolor=cols[i%len(cols)],edgecolor=(0,0,0,0.08),linewidths=0.1)
        ax.add_collection3d(pc)
        if explode: c=(t+off).reshape(-1,3).mean(0); ax.text(c[0]+0.09,c[1],c[2],n.replace('leg_left_','').replace('_',' '),fontsize=6,color=INK)
    allp=np.concatenate([(t).reshape(-1,3) for _,t in parts]); lo,hi=allp.min(0),allp.max(0)
    lo[2]-=explode*len(parts); s=(hi-lo).max()/2; m=(hi+lo)/2
    ax.set_xlim(m[0]-s,m[0]+s); ax.set_ylim(m[1]-s,m[1]+s); ax.set_zlim(m[2]-s,m[2]+s)
    ax.view_init(18,-60); ax.set_axis_off(); fig.tight_layout(); fig.savefig(path); plt.close(fig)
render(f"{OUT}/_bhl_leg.png",0.0); render(f"{OUT}/_bhl_leg_exploded.png",0.06)
_all=parts; parts=[p for p in _all if 'hip_pitch' in p[0] or 'knee' in p[0]]; render(f"{OUT}/_bhl_hipknee.png",0.0); parts=_all

def fit(p,w,h):
    from PIL import ImageChops
    im=Image.open(p).convert("RGB")
    bb=ImageChops.difference(im,Image.new("RGB",im.size,im.getpixel((2,2)))).getbbox()
    if bb: im=im.crop((max(bb[0]-20,0),max(bb[1]-20,0),min(bb[2]+20,im.width),min(bb[3]+20,im.height)))
    if im.width<w and im.height<h:
        k=min(w/im.width,h/im.height); im=im.resize((int(im.width*k),int(im.height*k)),Image.LANCZOS)
    im.thumbnail((w,h)); c=Image.new("RGB",(w,h),BG); c.paste(im,((w-im.width)//2,(h-im.height)//2)); return c
def font(s):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
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
O=f"{R}/osr"
board("OPTION A — NASA JPL Open Source Rover","JPL / Caltech · Apache-2.0 · OSHWA US002551 · 6-wheel rocker-bogie, 4-corner steering, differential",
  [f"{O}/images/osr_outside.jpg",f"{O}/mechanical/rocker_bogie/images/exploded_view.png",f"{O}/mechanical/images/exploded_mechanical.png"],
  ["Hero: the rover","Exploded: rocker-bogie joint","Exploded: full mechanical build"],
  ["Drive: 6 × goBILDA 5203 planetary gearmotor 26.9:1, 223 RPM, encoder   ·   4 × corner-steer servos   ·   wheel Ø144 mm",
   "Hand check: 144 mm × π × 223 RPM ÷ 60 = 1.68 m/s  →  matches published top speed ~1.6 m/s",
   "One input: position along a terrain profile → bogie + rocker solve → differential sets body pitch → wheel loads, angles, steer"],f"{OUT}/option_A_osr.png")
board("OPTION B — Berkeley Humanoid Lite leg","UC Berkeley Hybrid Robotics · code MIT / assets CC-BY-SA-4.0 · 6 joints per leg, 3D-printed cycloidal actuators",
  [f"{OUT}/_bhl_leg.png",f"{OUT}/_bhl_leg_exploded.png",f"{OUT}/_bhl_hipknee.png"],
  ["Real STL meshes, posed from URDF","Exploded: the 6 joint modules","Close-up: hip-pitch + knee modules"],
  ["Actuator: gear_ratio 15 (motor_configuration.json) · Kt 0.1176 N·m/A · 14 pole pairs · 4096-cpr encoder · thigh 150 mm, shank 160 mm",
   "Hand check: 0.1176 × 15 × 20 A current limit ≈ 35 N·m output torque ceiling (pre-losses)",
   "One input: gait phase → hip pitch / knee / ankle angles → motor angle = joint × 15 → eccentric cam phase, torque, foot height"],f"{OUT}/option_B_bhl_leg.png")
print("ok")
