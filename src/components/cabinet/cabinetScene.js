/* eslint-disable */
// @ts-nocheck
/**
 * 3D ENGINE — renderer, camera, controls, render-on-demand loop, markers, picking, highlight,
 * enclosure modes, layers, exploded view, camera views and the CabinetHandle API (cabinetScene.d.ts).
 *
 * The model itself (geometry, positions, views) lives in ./model/ and src/data/cabinet/.
 * A new model revision normally does NOT touch this file — see src/components/cabinet/MODEL.md.
 *
 * three.js is pinned to r128 (the original viewer); see LAUNCH_CHECKLIST.md → "Later".
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COMPONENTS, isAvailable } from '../../data/cabinet/components.ts';
import { createKit } from './model/kit.js';
import { buildModel } from './model/index.js';
import { ANCHORS, COLORS, EXPLODE, FLY_FAR, VIEWS } from './model/layout.js';

const DEFAULT_LABELS = {
  total: '1 900 mm', s800: '800', s300: '300', height: '2 000 mm', depth: '1 200 mm',
  service: 'Wartungszone ≥ 1 200 mm', wall: 'Gebäudewand', outside: 'außen', room: 'Raum',
};

export function mountCabinet(host, opts = {}) {
const S={config:opts.config||'L',view:'iso',shell:'glass',layers:{explode:false,air:true,water:true,power:true,signal:true,labels:true,dims:false},sel:null};
let LABELS = Object.assign({}, DEFAULT_LABELS, opts.labels || {});
const COMP = COMPONENTS.map((c) => ({ id: c.id, n: c.n, name: (opts.names && opts.names[c.id]) || c.id }));
const listeners = new Set();
const emit = () => listeners.forEach((cb) => cb(S.sel));

/* ---------------- Three setup ---------------- */
const viewer=host;
const canvas=document.createElement('canvas'); canvas.className='cab-canvas'; canvas.setAttribute('role','img'); host.appendChild(canvas);
const mkWrap=document.createElement('div'); mkWrap.className='cab-markers'; host.appendChild(mkWrap);

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(34,1,0.05,200);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true; controls.dampingFactor=0.09; controls.maxPolarAngle=Math.PI*0.495; controls.minDistance=0.8; controls.maxDistance=18;
scene.add(new THREE.HemisphereLight(0xffffff,0x80877f,0.9));
const d1=new THREE.DirectionalLight(0xffffff,0.7); d1.position.set(4,7,6); scene.add(d1);
const d2=new THREE.DirectionalLight(0xffffff,0.28); d2.position.set(-6,4,-5); scene.add(d2);

/* ---------------- model ---------------- */
const k=createKit(scene);
const { pickables, compMeshes, shellMeshes, equipGlass, faceMats } = k;
const model=buildModel(k,{ getConfig: () => S.config });
const G=model.groups;
const blankMat=model.rack.blankMat;
const ANCH=Object.fromEntries(Object.entries(ANCHORS).map(([id,[g,x,y,z]])=>[id,[G[g],x,y,z]]));
const EXP=Object.fromEntries(Object.entries(EXPLODE).map(([g,v])=>[g,[G[g],v]]));
function cssVar(n){return getComputedStyle(host).getPropertyValue(n).trim();}
function buildDims(){model.dims.rebuild(LABELS,cssVar('--ink')||'#ECF0EA',cssVar('--muted')||'#9AA39C');}
function buildBricks(){model.rack.applyConfig(S.config,applyShell);}

/* ---------------- markers ---------------- */
const MK={};
COMP.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='mk';b.textContent=c.n;b.title=c.name;b.setAttribute('aria-label',c.n+'. '+c.name);b.tabIndex=-1;b.addEventListener('click',e=>{e.stopPropagation();select(c.id,true);});mkWrap.appendChild(b);MK[c.id]=b;});
const vtmp=new THREE.Vector3();
function visibleChain(o){while(o){if(!o.visible)return false;o=o.parent;}return true;}
const occRay=new THREE.Raycaster(); const wpos=new THREE.Vector3();
function occluded(a){wpos.set(a[1],a[2],a[3]);a[0].localToWorld(wpos);const dir=wpos.clone().sub(camera.position);const d=dir.length();occRay.set(camera.position,dir.normalize());occRay.far=d-0.06;
  const hs=occRay.intersectObjects(pickables,false);for(const h of hs){if(h.object.userData.shell)continue;if(!visibleChain(h.object))continue;if(h.object.material&&h.object.material.opacity<0.6)continue;return true;}return false;}
function updateMarkers(){
  const w=viewer.clientWidth,h=viewer.clientHeight;
  COMP.forEach(c=>{const a=ANCH[c.id];const b=MK[c.id];if(!a){b.hidden=true;return;}
    const show=S.layers.labels&&visibleChain(a[0]);
    if(!show){b.hidden=true;return;}
    vtmp.set(a[1],a[2],a[3]);a[0].localToWorld(vtmp);vtmp.project(camera);
    if(vtmp.z>1||vtmp.x<-1.05||vtmp.x>1.05||vtmp.y<-1.05||vtmp.y>1.05){b.hidden=true;return;}
    b.hidden=false;b.style.opacity=occluded(a)?'0.32':'1';b.style.transform=`translate(${(vtmp.x*.5+.5)*w}px,${(-vtmp.y*.5+.5)*h}px)`;
    b.classList.toggle('sel',S.sel===c.id);});
}

/* ---------------- highlight ---------------- */
const HL=COLORS.HL;
function setHL(id,on){(compMeshes[id]||[]).forEach(m=>{if(!m.material||!m.material.emissive)return;if(m.userData.shell){m.material.opacity=on?0.22:shellOpacity();m.material.emissive.setHex(on?HL:0x000000);m.material.emissiveIntensity=on?.35:0;return;}
  if(m.userData.e0===undefined){m.userData.e0=m.material.emissive.getHex();m.userData.ei=m.material.emissiveIntensity;}
  if(on){m.material.emissive.setHex(HL);m.material.emissiveIntensity=.55;}else{m.material.emissive.setHex(m.userData.e0);m.material.emissiveIntensity=m.userData.ei;}});}
function select(id,fly){if(S.sel)setHL(S.sel,false);S.sel=id;if(id)setHL(id,true);
  if(id&&fly){const a=ANCH[id];if(a){const t=new THREE.Vector3(a[1],a[2],a[3]);a[0].localToWorld(t);const dir=camera.position.clone().sub(controls.target).normalize();const dist=FLY_FAR.includes(id)?3.2:2.0;flyTo(t.clone().add(dir.multiplyScalar(dist)),t);}}
  emit(); invalidate();}

/* ---------------- modes ---------------- */
function shellOpacity(){return S.shell==='solid'?1:.12;}
function applyShell(){shellMeshes.forEach(m=>{m.visible=S.shell!=='off';m.material.opacity=shellOpacity();m.material.depthWrite=S.shell==='solid';m.material.transparent=S.shell!=='solid';});
  equipGlass.forEach(m=>{m.transparent=true;m.opacity=S.shell==='solid'?1:0.5;m.depthWrite=S.shell==='solid';});
  faceMats.forEach(m=>{m.opacity=S.shell==='solid'?1:0.38;m.depthWrite=S.shell==='solid';});
  blankMat.opacity=S.shell==='solid'?1:(S.shell==='glass'?0.5:0.18);blankMat.depthWrite=S.shell==='solid';
  if(S.sel)setHL(S.sel,true);}
let expK=0;
function applyLayers(){const L=S.layers;G.water.visible=L.water;G.power.visible=L.power;G.tray.visible=L.power||L.signal;G.signal.visible=L.signal;G.dims.visible=L.dims;
  G.air.visible=L.air&&expK<0.02;
  const conn=expK<0.02; if(!conn){G.water.visible=false;G.power.visible=false;G.signal.visible=false;}}

/* ---------------- camera views ---------------- */
let fly=null;
function flyTo(p,t,inst){if(inst){camera.position.set(...(p.toArray?p.toArray():p));controls.target.set(...(t.toArray?t.toArray():t));controls.update();fly=null;return;}
  fly={p0:camera.position.clone(),t0:controls.target.clone(),p1:p.isVector3?p.clone():new THREE.Vector3(...p),t1:t.isVector3?t.clone():new THREE.Vector3(...t),k:0};}
function setView(v,inst){S.view=v;const [p,t]=VIEWS[v];const a=camera.aspect||1.4;const k=a<1.25?Math.min(2.2,Math.pow(1.25/a,0.85)):1;const pv=new THREE.Vector3(...t).add(new THREE.Vector3(...p).sub(new THREE.Vector3(...t)).multiplyScalar(k));flyTo(pv,t,inst);invalidate();}

/* picking */
const ray=new THREE.Raycaster(); const ndc=new THREE.Vector2(); let down=null;
const onDown=e=>{down=[e.clientX,e.clientY];};
const onUp=e=>{if(!down)return;const dx=e.clientX-down[0],dy=e.clientY-down[1];down=null;if(dx*dx+dy*dy>25)return;
  const r=canvas.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(pickables,false).filter(h=>visibleChain(h.object)&&h.object.userData.cid);
  let h=hits.find(x=>!x.object.userData.shell)||hits[0]; if(S.shell==='solid')h=hits[0];
  select(h?h.object.userData.cid:null,false);};
canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointerup',onUp);

/* theme (dark only): scene colours from CSS custom properties on the stage */
function applyTheme(){scene.background=new THREE.Color(cssVar('--scene')||'#DDE2DD');model.room.floorMat.color.set(cssVar('--floor')||'#CBD1CB');model.room.wallMat.color.set(cssVar('--wall')||'#B5BAB2');model.room.groundMat.color.set(cssVar('--ground')||'#B9C0B4');
  model.room.setGrid(cssVar('--grid')||'#AEB6AF');buildDims();}
/* resize */
function resize(){const w=viewer.clientWidth,h=viewer.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();invalidate();}
const ro=new ResizeObserver(resize); ro.observe(viewer);

/* ---------------- loop: render on demand ---------------- */
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock=new THREE.Clock();
let raf=0, onScreen=true, disposed=false, damping=0;
function animating(){return !!fly||expK!==(S.layers.explode?1:0)||damping>0||(!reduce&&(G.air.visible||G.water.visible));}
function schedule(){if(!raf&&!disposed&&onScreen&&!document.hidden){clock.getDelta();raf=requestAnimationFrame(frame);}}
function invalidate(){schedule();}
function frame(){raf=0;const dt=Math.min(clock.getDelta(),0.05);
  if(fly){fly.k=Math.min(1,fly.k+dt*1.8);const e=fly.k<.5?2*fly.k*fly.k:1-Math.pow(-2*fly.k+2,2)/2;camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.t0,fly.t1,e);if(fly.k>=1)fly=null;}
  const tgt=S.layers.explode?1:0; const pk=expK; expK+=(tgt-expK)*Math.min(1,dt*5); if(Math.abs(tgt-expK)<0.001)expK=tgt;
  if(pk!==expK){Object.values(EXP).forEach(([g,v])=>g.position.set(v[0]*expK,v[1]*expK,v[2]*expK));applyLayers();}
  if(G.air.visible&&!reduce)model.air.step(dt);
  if(G.water.visible&&!reduce)model.water.step(dt);
  const moved=controls.update(); damping=moved?8:Math.max(0,damping-1);
  renderer.render(scene,camera); updateMarkers();
  if(animating())schedule();}
controls.addEventListener('change',invalidate);
const io=new IntersectionObserver(es=>{onScreen=es.some(e=>e.isIntersecting);if(onScreen)schedule();},{rootMargin:'50px'}); io.observe(viewer);
const onVis=()=>{if(!document.hidden)schedule();}; document.addEventListener('visibilitychange',onVis);

/* init */
buildBricks(); applyLayers(); resize(); setView('iso',true);
model.air.warm();
applyTheme();
const fontsReady=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('500 56px "JetBrains Mono"'),document.fonts.ready]).catch(()=>{}):Promise.resolve();
fontsReady.then(()=>{if(!disposed){buildDims();invalidate();}});
schedule();

const LAYER={explode:'explode',air:'air',water:'water',power:'power',signals:'signal',numbers:'labels',dims:'dims'};
function setConfig(c){S.config=c;buildBricks();model.air.respawnAll();if(S.sel&&!isAvailable(S.sel,c))select(null);invalidate();}
function setShell(s){S.shell=s==='hidden'?'off':s;applyShell();invalidate();}
function setLayer(k,v){S.layers[LAYER[k]]=v;applyLayers();invalidate();}

const handle={
  setConfig, setShell, setLayer,
  setView(v,instant){setView(v,!!instant);},
  select(id){select(id,!!id);},
  onSelect(cb){listeners.add(cb);return()=>listeners.delete(cb);},
  resize,
  setNames(names){COMP.forEach(c=>{c.name=names[c.id]||c.id;const b=MK[c.id];if(b){b.title=c.name;b.setAttribute('aria-label',c.n+'. '+c.name);}});},
  setLabels(labels){LABELS=Object.assign({},DEFAULT_LABELS,labels||{});buildDims();invalidate();},
  isAvailable(id){return isAvailable(id,S.config);},
  get state(){return {config:S.config,view:S.view,shell:S.shell==='off'?'hidden':S.shell,sel:S.sel,layers:{...S.layers}};},
  canvas,
  dispose(){
    disposed=true; if(raf)cancelAnimationFrame(raf); raf=0;
    ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange',onVis);
    canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointerup',onUp);
    controls.removeEventListener('change',invalidate); controls.dispose(); listeners.clear();
    scene.traverse(o=>{if(o.geometry)o.geometry.dispose();const m=o.material;(Array.isArray(m)?m:m?[m]:[]).forEach(mm=>{if(mm.map)mm.map.dispose();mm.dispose();});});
    renderer.dispose(); renderer.forceContextLoss();
    canvas.remove(); mkWrap.remove();
  },
};
return handle;
}
