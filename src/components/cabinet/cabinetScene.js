/* eslint-disable */
// @ts-nocheck
/**
 * GGM-Node 3D cabinet — port of the legacy single-file viewer (Three.js r128, pinned).
 * Geometry builders (room, cabinets, equip, gpus, buildBricks, setBlanks, applyShell, pipes, cables,
 * signals, airflow, dimensions, VIEWS, flyTo) are byte-identical to legacy/index.html. Changes:
 *  (a) ES imports instead of the global THREE,
 *  (b) DOM/UI bindings replaced by the CabinetHandle API (see cabinetScene.d.ts),
 *  (c) component register from src/data/cabinet, localized names and text sprites,
 *  (d) render on demand; paused when off-screen or the tab is hidden.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COMPONENTS } from '../../data/cabinet/components.ts';

const HL = 0xecf0ea;
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

const pickables=[]; const compMeshes={}; const shellMats=[]; const shellMeshes=[]; const equipGlass=[]; const faceMats=[];
function reg(o,cid){o.userData.cid=cid;pickables.push(o);(compMeshes[cid]=compMeshes[cid]||[]).push(o);return o;}
function M(color,o){return new THREE.MeshStandardMaterial(Object.assign({color,roughness:.72,metalness:.08},o||{}));}
function box(x0,x1,y0,y1,z0,z1,m){const g=new THREE.BoxGeometry(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0));const b=new THREE.Mesh(g,m);b.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return b;}
function edges(mesh,color,op){const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:op==null?1:op}));e.position.copy(mesh.position);e.rotation.copy(mesh.rotation);return e;}
function add(parent,o,cid){parent.add(o);if(cid)reg(o,cid);return o;}
const U0=0.10, UH=0.04445; const uy=u=>U0+(u-1)*UH;
function grp(name){const g=new THREE.Group();g.name=name;scene.add(g);g.userData.base=new THREE.Vector3();return g;}

const FRAME=0xC9CCC5, DARK=0x2B302D, DARK2=0x3A403C;
function shell(parent,x0,x1,y0,y1,z0,z1,cid){
  const m=M(FRAME,{transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});
  const b=box(x0,x1,y0,y1,z0,z1,m); b.renderOrder=5; parent.add(b); reg(b,cid); b.userData.shell=true;
  shellMats.push(m); shellMeshes.push(b);
  const e=edges(b,0x5d6661,.85); parent.add(e);
  return b;
}

/* --- room --- */
const gRoom=grp('room');
const floorMat=M(0xCBD1CB,{roughness:.95}); const groundMat=M(0xB9C0B4,{roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(7.2,5.6),floorMat); floor.rotation.x=-Math.PI/2; floor.position.set(-0.4,0,0.85); gRoom.add(floor);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(7.2,2.6),groundMat); ground.rotation.x=-Math.PI/2; ground.position.set(-0.4,-0.002,-3.25); gRoom.add(ground);
let grid=new THREE.GridHelper(7,14,0xAEB6AF,0xAEB6AF); grid.position.set(-0.4,0.002,0.85); grid.scale.z=5.6/7; gRoom.add(grid);
const wallMat=M(0xB5BAB2,{transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide});
const wall=box(-4,3.2,0,2.8,-1.95,-1.75,wallMat); gRoom.add(wall); gRoom.add(edges(wall,0x8a928c,.5));
const wallL=box(-4,-3.8,0,2.8,-1.75,3.6,wallMat); gRoom.add(wallL); gRoom.add(edges(wallL,0x8a928c,.35));

/* --- E cabinet --- */
const gE=grp('ecab');
shell(gE,-0.8,0,0,2.0,-0.8,0,'ecab');
add(gE,box(-0.8,0,0,0.1,-0.8,0,M(DARK)),'ecab');
add(gE,box(-0.76,-0.04,1.04,1.96,-0.79,-0.77,M(0xD8D9D2)),'board');
// DIN rows
const comp=(x0,x1,y0,y1,c,cid)=>add(gE,box(x0,x1,y0,y1,-0.77,-0.70,M(c)),cid);
comp(-0.72,-0.60,1.76,1.93,0x4A4F4C,'board'); // NH00
comp(-0.58,-0.51,1.80,1.92,0x6B4C9A,'board'); // SPD
comp(-0.49,-0.40,1.80,1.92,0xE2E2DA,'board'); // RCD/RCM
for(let i=0;i<9;i++)comp(-0.38+i*0.035,-0.355+i*0.035,1.81,1.91,0xEDEDE6,'board');
comp(-0.72,-0.62,1.55,1.68,0x2F4F6F,'board'); // MID
comp(-0.60,-0.50,1.55,1.68,0x2F4F6F,'board'); // P_cool meter
for(let i=0;i<8;i++)comp(-0.47+i*0.035,-0.445+i*0.035,1.56,1.66,0xEDEDE6,'board');
comp(-0.72,-0.60,1.33,1.47,0x1F7A5A,'ems'); // WAGO CC100
comp(-0.58,-0.52,1.33,1.47,0x9AA09A,'ems'); // 24V
for(let i=0;i<3;i++)comp(-0.50+i*0.03,-0.475+i*0.03,1.34,1.45,0xD2B33A,'ems'); // relays
comp(-0.38,-0.25,1.34,1.44,0x2B302D,'ems'); // OT switch
add(gE,box(-0.74,-0.06,1.12,1.16,-0.77,-0.73,M(0x8E948F)),'board'); // terminals
add(gE,box(-0.62,-0.18,0.15,0.537,-0.741,-0.05,M(0x2A2E2C)),'ups');
add(gE,box(-0.62,-0.18,0.43,0.52,-0.05,-0.035,M(0x3E4541)),'ups');
add(gE,box(-0.52,-0.28,0.70,0.90,-0.70,-0.58,M(0x55605A)),'ups'); // service bypass
add(gE,box(-0.74,-0.30,0.105,0.125,-0.72,-0.66,M(0xB87333,{metalness:.6,roughness:.35})),'pe');
// Not-Aus
const na=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.035,24),M(0xC8271E)); na.rotation.x=Math.PI/2; na.position.set(-0.12,1.45,0.03); add(gE,na,'notaus');
const nab=box(-0.18,-0.06,1.39,1.51,0,0.012,M(0xE8C21A)); add(gE,nab,'notaus');

/* --- IT rack --- */
const gRack=grp('rack');
shell(gRack,0,0.8,0,2.0,-1.2,0,'rack');
add(gRack,box(0,0.8,0,0.1,-1.2,0,M(DARK)),'rack');
[0.159,0.641].forEach(x=>{[-0.04,-1.0].forEach(z=>add(gRack,box(x-0.008,x+0.008,0.1,1.97,z-0.01,z+0.01,M(0x7d8580)),'rack'));});
// PDUs
[0.05,0.75].forEach(x=>{add(gRack,box(x-0.028,x+0.028,0.14,1.86,-1.17,-1.11,M(0x1F2321)),'pdu');for(let i=0;i<12;i++)add(gRack,box(x-0.012,x+0.012,0.2+i*0.13,0.24+i*0.13,-1.11,-1.105,M(0x9AA09A)),'pdu');});
// sensors
const sph=(x,y,z,c,cid)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(0.018,16,12),M(c,{emissive:c,emissiveIntensity:.25}));s.position.set(x,y,z);add(gRack,s,cid);};
[0.45,1.05,1.7].forEach(y=>sph(0.7,y,-0.03,0x2F6FB8,'sensors'));
[0.6,1.4].forEach(y=>sph(0.7,y,-1.17,0xC93A2B,'sensors'));
add(gRack,box(0.94,0.96,0.105,0.115,-1.15,-0.1,M(0xD9B44A)),'sensors'); // leak cable under LCP
// blanking (dynamic)
const blankMat=M(0x5E6661,{transparent:true});
const blanks=new THREE.Group(); gRack.add(blanks);
function purge(g){g.traverse(o=>{if(o===g)return;const i=pickables.indexOf(o);if(i>=0)pickables.splice(i,1);const cid=o.userData&&o.userData.cid;if(cid&&compMeshes[cid])compMeshes[cid]=compMeshes[cid].filter(x=>x!==o);if(o.material){const j=equipGlass.indexOf(o.material);if(j>=0)equipGlass.splice(j,1);}});g.clear();}
function setBlanks(ranges){purge(blanks);ranges.forEach(([a,b])=>{const p=box(0.18,0.62,uy(a)+0.001,uy(b+1)-0.001,-0.07,-0.06,blankMat);reg(p,'rack');blanks.add(p);});}

function equip(parent,u,nU,depth,col,cid,front){
  const y0=uy(u),y1=uy(u+nU);
  const mat=M(col,{transparent:true,opacity:1}); equipGlass.push(mat);
  const b=box(0.18,0.62,y0+0.002,y1-0.002,-0.06-depth,-0.06,mat); add(parent,b,cid);
  parent.add(edges(b,0x111111,.6));
  const fm=M(front||DARK2,{transparent:true}); faceMats.push(fm); const fp=box(0.165,0.635,y0+0.002,y1-0.002,-0.06,-0.045,fm); add(parent,fp,cid);
  return b;
}
function gpus(parent,u,n,emptyN){
  const yc=(uy(u)+uy(u+4))/2;
  for(let i=0;i<8;i++){
    const x=0.215+i*0.052; const filled=i<n;
    if(filled){const c=box(x-0.018,x+0.018,yc-0.056,yc+0.056,-0.92,-0.65,M(0x24453A,{metalness:.3,roughness:.5}));add(parent,c,parent.userData.cid);
      add(parent,box(x-0.019,x+0.019,yc+0.045,yc+0.058,-0.92,-0.65,M(0xB89B4A,{metalness:.6,roughness:.4})),parent.userData.cid);}
    else{const c=box(x-0.018,x+0.018,yc-0.056,yc+0.056,-0.92,-0.65,M(0xffffff));const e=edges(c,0x8a8f8b,.9);parent.add(e);}
  }
  // CPUs + fan wall
  add(parent,box(0.24,0.33,uy(u)+0.01,uy(u)+0.04,-0.45,-0.35,M(0x8C918D,{metalness:.5})),parent.userData.cid);
  add(parent,box(0.47,0.56,uy(u)+0.01,uy(u)+0.04,-0.45,-0.35,M(0x8C918D,{metalness:.5})),parent.userData.cid);
  const fw=M(0x1A1D1B,{transparent:true}); faceMats.push(fw); add(parent,box(0.19,0.61,uy(u)+0.01,uy(u+4)-0.01,-0.22,-0.17,fw),parent.userData.cid);
}
const gB1=grp('brick1'); gB1.userData.cid='brick1';
const gB2=grp('brick2'); gB2.userData.cid='brick2';
const gCPU=grp('cpu'), gLB=grp('loadbank'), gNet=grp('net'), gFire=grp('fire');
function buildBricks(){
  [gB1,gB2].forEach(g=>purge(g));
  const c=S.config;
  const n1 = c==='P0'?4:8, n2 = c==='M'?4:8;
  equip(gB1,1,4,0.887,0x4E5651,'brick1'); gpus(gB1,1,n1);
  equip(gB2,5,4,0.887,0x4E5651,'brick2'); gpus(gB2,5,n2);
  gB2.visible = c!=='P0';
  gCPU.visible = c!=='P0';
  gLB.visible = c==='P0';
  setBlanks(c==='P0'?[[5,10],[20,36]]:[[11,36]]);
  applyShell();
}
equip(gCPU,9,2,0.75,0x5D6661,'cpu');
for(let k=0;k<3;k++){const u=11+k*3;equip(gLB,u,3,0.6,0xC9A227,'loadbank',0x8E6F12);}
equip(gNet,37,1,0.45,0x343A36,'net'); equip(gNet,38,1,0.45,0x343A36,'net',0x2E5B8A); equip(gNet,39,1,0.40,0x343A36,'net',0x2E7D4F);
equip(gNet,40,1,0.10,0x2B302D,'net',0x6E7671); equip(gNet,41,1,0.10,0x2B302D,'net',0x4A504C);
equip(gFire,42,1,0.45,0xB43A2A,'fire',0x8E2A1E);

/* --- LCP --- */
const gL=grp('lcp');
shell(gL,0.8,1.1,0,2.0,-1.2,0,'lcp');
add(gL,box(0.8,1.1,0,0.1,-1.2,0,M(DARK)),'lcp');
add(gL,box(0.83,1.07,0.15,1.85,-0.72,-0.64,M(0x6E8FA8,{metalness:.5,roughness:.4})),'lcp'); // coil
for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.CylinderGeometry(0.105,0.105,0.05,28),M(0x23282A));f.rotation.x=Math.PI/2;f.position.set(0.95,0.38+i*0.4,-0.45);add(gL,f,'lcp');
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.055,16),M(0x9AA09A));hub.rotation.x=Math.PI/2;hub.position.copy(f.position);gL.add(hub);}
add(gL,box(0.86,1.04,1.86,1.96,-0.25,-0.05,M(0x2B302D)),'lcp');
[0.9,1.0].forEach((x,i)=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.14,16),M(i?0xD4812A:0x2F6FB8));p.position.set(x,0.07,-1.0);add(gL,p,'pipes');});

/* --- outdoor --- */
const gOut=grp('outdoor');
add(gOut,box(-0.05,1.45,0,0.1,-3.35,-2.35,M(0x8E948F)),'chiller');
const ch=box(0,1.4,0.1,1.45,-3.3,-2.4,M(0xD6D8D2)); add(gOut,ch,'chiller'); gOut.add(edges(ch,0x5d6661,.8));
add(gOut,box(-0.005,0.002,0.25,1.35,-3.25,-2.45,M(0x5C6560)),'chiller'); // FC coil side
add(gOut,box(1.398,1.405,0.25,1.35,-3.25,-2.45,M(0x5C6560)),'chiller');
[0.37,1.03].forEach(x=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.06,32),M(0x23282A));f.position.set(x,1.48,-2.85);add(gOut,f,'chiller');const r=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.012,8,32),M(0x9AA09A));r.rotation.x=Math.PI/2;r.position.set(x,1.51,-2.85);gOut.add(r);});
// heat recovery option (indoor, near wall)
const hx=box(1.62,1.86,0.25,0.95,-1.68,-1.52,M(0xB0B6B0,{transparent:true,opacity:.55})); add(gOut,hx,'hrx'); gOut.add(edges(hx,0x6b736e,.9));
// NSHV
add(gRoom,box(-3.8,-3.55,0.95,2.0,-0.65,0.25,M(0xD5D6CF)),'nshv');
add(gRoom,box(-3.551,-3.54,1.45,1.58,-0.30,-0.15,M(0x2F4F6F)),'nshv');
// tray
const gTray=grp('tray');
const tray=box(-3.55,1.2,2.28,2.30,-0.78,-0.42,M(0x9AA09A,{metalness:.5,roughness:.5})); add(gTray,tray,'tray');
add(gTray,box(-3.55,1.2,2.30,2.36,-0.605,-0.595,M(0x9AA09A,{metalness:.5})),'tray');
// uplink entry
add(gRoom,box(-1.3,-1.1,2.05,2.25,-1.76,-1.72,M(0x2E5B8A)),'uplink');
// drip tray
add(gRoom,box(0.84,1.06,0.0,0.03,-1.72,-0.95,M(0x8E948F,{transparent:true,opacity:.8})),'pipes');

/* --- pipes (water) --- */
const gWater=grp('water');
function tube(pts,r,color,cid,parent){const cur=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'catmullrom',0.08);const t=new THREE.Mesh(new THREE.TubeGeometry(cur,Math.max(40,pts.length*24),r,10,false),M(color,{roughness:.5}));add(parent,t,cid);t.userData.curve=cur;return t;}
const supPts=[[0.9,0.45,-2.4],[0.9,0.4,-2.2],[0.9,0.36,-1.95],[0.9,0.32,-1.75],[0.9,0.1,-1.62],[0.9,0.05,-1.4],[0.9,0.05,-1.12],[0.9,0.1,-1.0]];
const retPts=[[1.0,0.1,-1.0],[1.0,0.05,-1.12],[1.0,0.05,-1.4],[1.0,0.1,-1.62],[1.0,0.32,-1.75],[1.0,0.36,-1.95],[1.0,0.4,-2.2],[1.0,0.45,-2.4]];
const tSup=tube(supPts,0.026,0x2F6FB8,'pipes',gWater), tRet=tube(retPts,0.026,0xD4812A,'pipes',gWater);
// HX dashed branch
const hxLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.0,0.06,-1.45),new THREE.Vector3(1.4,0.06,-1.6),new THREE.Vector3(1.62,0.4,-1.6)]),new THREE.LineDashedMaterial({color:0xD4812A,dashSize:.05,gapSize:.035}));hxLine.computeLineDistances();gWater.add(hxLine);
const beads=[];
[[tSup,0x7FB3F0],[tRet,0xF6C27D]].forEach(([t,c])=>{for(let i=0;i<14;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(0.03,10,8),new THREE.MeshBasicMaterial({color:c}));b.userData={curve:t.userData.curve,u:i/14};gWater.add(b);beads.push(b);}});

/* --- power cables --- */
const gPow=grp('power');
const pw=(pts,r)=>tube(pts,r||0.011,0x9A6A12,null,gPow);
pw([[-3.55,1.95,-0.6],[-3.4,2.27,-0.6],[-2.5,2.27,-0.62],[-0.6,2.27,-0.62],[-0.5,2.1,-0.55],[-0.5,1.97,-0.5],[-0.6,1.92,-0.72]],0.017);
pw([[-0.3,1.97,-0.6],[-0.3,2.22,-0.56],[0.05,2.22,-0.56],[0.05,2.02,-0.8],[0.05,1.9,-1.14]]);
pw([[-0.25,1.97,-0.62],[-0.25,2.24,-0.58],[0.75,2.24,-0.58],[0.75,2.02,-0.8],[0.75,1.9,-1.14]]);
pw([[-0.2,1.97,-0.64],[-0.2,2.26,-0.64],[0.95,2.26,-0.64],[0.95,2.0,-0.3],[0.95,1.96,-0.15]]);
pw([[-0.15,1.97,-0.66],[-0.15,2.27,-0.68],[1.15,2.27,-0.68],[1.6,2.27,-1.2],[1.6,2.25,-1.85],[1.6,1.9,-2.2],[1.55,1.1,-2.6],[1.4,1.0,-2.85]]);
pw([[-0.45,1.05,-0.73],[-0.45,0.8,-0.6],[-0.45,0.55,-0.5]],0.009); // board→UPS
pw([[-0.3,0.4,-0.74],[-0.1,0.5,-0.78],[-0.1,1.95,-0.75]],0.009); // UPS out up
gPow.children.forEach(o=>{o.userData.cid=o.userData.cid||'feeder';});
reg(gPow.children[0],'feeder');

/* --- signal lines --- */
const gSig=grp('signal');
function sig(pts){const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));const l=new THREE.Line(g,new THREE.LineDashedMaterial({color:0x1F8571,dashSize:.06,gapSize:.035}));l.computeLineDistances();gSig.add(l);return l;}
sig([[-3.54,1.5,-0.22],[-3.4,2.34,-0.5],[-0.65,2.34,-0.5],[-0.65,2.0,-0.5],[-0.66,1.42,-0.68]]);
sig([[-0.55,1.42,-0.68],[-0.4,2.0,-0.45],[-0.4,2.34,-0.47],[0.4,2.34,-0.47],[0.4,2.0,-0.3],[0.4,uy(39)+0.02,-0.04]]);
sig([[-0.5,1.40,-0.68],[-0.35,2.0,-0.47],[-0.35,2.35,-0.48],[0.97,2.35,-0.48],[0.97,1.96,-0.18]]);
sig([[-0.45,1.40,-0.68],[-0.3,2.35,-0.5],[1.18,2.35,-0.5],[1.7,2.35,-1.2],[1.7,2.3,-1.85],[1.7,1.6,-2.3],[1.4,1.2,-2.9]]);
sig([[-0.6,1.35,-0.69],[-0.5,0.9,-0.6],[-0.42,0.52,-0.3]]);
sig([[-1.2,2.15,-1.72],[-1.0,2.34,-0.6],[0.3,2.34,-0.6],[0.3,2.0,-0.35],[0.3,uy(37)+0.02,-0.04]]);
sig([[0.4,uy(42)+0.02,-0.3],[0.45,2.0,-0.3],[0.45,2.33,-0.44],[-0.45,2.33,-0.44],[-0.45,2.0,-0.5],[-0.58,1.44,-0.69]]);
const naLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.12,1.45,0.0),new THREE.Vector3(-0.3,1.6,-0.4),new THREE.Vector3(-0.66,1.8,-0.69)]),new THREE.LineDashedMaterial({color:0xC8271E,dashSize:.03,gapSize:.02}));naLine.computeLineDistances();gSig.add(naLine);

/* --- airflow particles --- */
const gAir=grp('air');
const NP=900; const airGeo=new THREE.BufferGeometry(); const pos=new Float32Array(NP*3), col=new Float32Array(NP*3);
airGeo.setAttribute('position',new THREE.BufferAttribute(pos,3)); airGeo.setAttribute('color',new THREE.BufferAttribute(col,3));
const airPts=new THREE.Points(airGeo,new THREE.PointsMaterial({size:0.042,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));
gAir.add(airPts);
const P=[]; const cCold=new THREE.Color(0x2F6FB8), cHot=new THREE.Color(0xC93A2B), tmpC=new THREE.Color();
function zonesY(){const c=S.config;const z=[[uy(1),uy(9)]];if(c!=='P0')z.push([uy(9),uy(11)]);if(c==='P0'){z.length=0;z.push([uy(1),uy(5)],[uy(11),uy(20)]);}z.push([uy(37),uy(43)]);return z;}
function respawn(p){const z=zonesY();const tot=z.reduce((a,b)=>a+(b[1]-b[0]),0);let r=Math.random()*tot;let y=z[0][0];for(const [a,b] of z){if(r<b-a){y=a+r;break;}r-=b-a;}p.y=y+0.005;p.x=0.2+Math.random()*0.4;p.yl=0.2+Math.random()*1.65;}
for(let i=0;i<NP;i++){const p={t:Math.random(),v:0.06+Math.random()*0.05};respawn(p);P.push(p);}
const SEG=[0.16,0.40,0.12,0.06,0.20,0.06];const SEGC=[];{let a=0;SEG.forEach(s=>{a+=s;SEGC.push(a);});}
function airPos(p,out){let t=p.t,i=0;while(i<SEG.length-1&&t>SEGC[i])i++;const t0=i?SEGC[i-1]:0;const k=(t-t0)/SEG[i];let x,y,z,h;
 const yl=p.yl;
 switch(i){
  case 0: x=0.78+(p.x-0.78)*k; y=yl+(p.y-yl)*k; z=-0.025; h=0; break;
  case 1: x=p.x; y=p.y; z=-0.03-1.12*k; h=k; break;
  case 2: x=p.x+(0.86-p.x)*k; y=p.y; z=-1.16; h=1; break;
  case 3: x=0.86+0.09*k; y=p.y+(yl-p.y)*k; z=-1.16+0.12*k; h=1; break;
  case 4: x=0.95; y=yl; z=-1.04+0.9*k; h=k<0.45?1:Math.max(0,1-(k-0.45)/0.12); break;
  default: x=0.95-0.17*k; y=yl; z=-0.14+0.115*k; h=0;
 }
 out[0]=x;out[1]=y;out[2]=z;return h;}

/* --- dimensions --- */
const gDim=grp('dims');

/* --- dimensions (labels localized) --- */
function textSprite(txt,color,size){const c=document.createElement('canvas');const ctx=c.getContext('2d');const fs=56;const font=`500 ${fs}px "JetBrains Mono", Menlo, monospace`;ctx.font=font;const w=Math.ceil(ctx.measureText(txt).width)+20;c.width=w;c.height=Math.ceil(fs*1.35);ctx.font=font;ctx.fillStyle=color;ctx.textBaseline='middle';ctx.fillText(txt,10,c.height/2);const t=new THREE.CanvasTexture(c);t.anisotropy=4;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(size*c.width/c.height,size,1);s.renderOrder=999;return s;}
function dimLine(a,b,label,color,off){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);gDim.add(new THREE.Line(g,new THREE.LineBasicMaterial({color})));const s=textSprite(label,color,0.11);s.position.set((a[0]+b[0])/2+(off?off[0]:0),(a[1]+b[1])/2+(off?off[1]:0),(a[2]+b[2])/2+(off?off[2]:0));gDim.add(s);}
function staticLabel(txt,p,color,size){const s=textSprite(txt,color,size||0.1);s.position.set(...p);gDim.add(s);return s;}
const gStatic=grp('static');
function cssVar(n){return getComputedStyle(host).getPropertyValue(n).trim();}
function buildDims(){
  gDim.clear(); gStatic.clear();
  const ink=cssVar('--ink')||'#ECF0EA', mut=cssVar('--muted')||'#9AA39C';
  dimLine([-0.8,0.01,0.4],[1.1,0.01,0.4],LABELS.total,ink,[0,0.08,0]);
  dimLine([-0.8,0.01,0.25],[0,0.01,0.25],LABELS.s800,mut,[0,0.06,0]);
  dimLine([0,0.01,0.25],[0.8,0.01,0.25],LABELS.s800,mut,[0,0.06,0]);
  dimLine([0.8,0.01,0.25],[1.1,0.01,0.25],LABELS.s300,mut,[0,0.06,0]);
  dimLine([-0.95,0,0.02],[-0.95,2.0,0.02],LABELS.height,ink,[-0.25,0,0]);
  dimLine([1.3,0.01,0],[1.3,0.01,-1.2],LABELS.depth,ink,[0.32,0.05,0]);
  const fr=new THREE.BufferGeometry().setFromPoints([[-0.8,0.006,0],[-0.8,0.006,1.2],[1.1,0.006,1.2],[1.1,0.006,0]].map(p=>new THREE.Vector3(...p)));
  const l=new THREE.Line(fr,new THREE.LineDashedMaterial({color:mut,dashSize:.06,gapSize:.04}));l.computeLineDistances();gDim.add(l);
  staticLabel(LABELS.service,[0.15,0.05,0.85],mut,0.1);
  const sw=(t,p)=>{const s=textSprite(t,mut,0.09);s.position.set(...p);gStatic.add(s);};
  sw(LABELS.wall,[-1.9,2.62,-1.85]); sw(LABELS.outside,[0.7,0.15,-3.75]); sw(LABELS.room,[-2.0,0.15,1.6]);
}

/* ---------------- markers ---------------- */
const ANCH={rack:[gRack,0.4,2.02,0.0],lcp:[gL,0.95,2.05,0.0],chiller:[gOut,0.7,1.65,-2.85],pipes:[gWater,0.95,0.12,-1.45],hrx:[gOut,1.74,1.02,-1.6],
 ecab:[gE,-0.4,2.05,0.0],board:[gE,-0.4,1.8,-0.68],ems:[gE,-0.62,1.4,-0.68],ups:[gE,-0.4,0.36,0.0],notaus:[gE,-0.12,1.55,0.04],
 pdu:[gRack,0.05,1.0,-1.14],brick1:[gB1,0.4,(uy(1)+uy(5))/2,0.0],brick2:[gB2,0.4,(uy(5)+uy(9))/2,0.0],cpu:[gCPU,0.4,(uy(9)+uy(11))/2,0.0],loadbank:[gLB,0.4,(uy(11)+uy(20))/2,0.0],
 net:[gNet,0.4,uy(38)+0.02,0.0],fire:[gFire,0.4,uy(42)+0.02,0.0],sensors:[gRack,0.7,1.7,-0.03],nshv:[gRoom,-3.54,1.75,-0.2],feeder:[gPow,-2.2,2.27,-0.62],
 tray:[gTray,-1.6,2.36,-0.45],uplink:[gRoom,-1.2,2.15,-1.72],pe:[gE,-0.52,0.13,-0.69]};
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
function visibleChainIgnoringLayers(o){if(o===gB2||o===gCPU)return S.config!=='P0';if(o===gLB)return S.config==='P0';return true;}

/* ---------------- highlight ---------------- */
function setHL(id,on){(compMeshes[id]||[]).forEach(m=>{if(!m.material||!m.material.emissive)return;if(m.userData.shell){m.material.opacity=on?0.22:shellOpacity();m.material.emissive.setHex(on?HL:0x000000);m.material.emissiveIntensity=on?.35:0;return;}
  if(m.userData.e0===undefined){m.userData.e0=m.material.emissive.getHex();m.userData.ei=m.material.emissiveIntensity;}
  if(on){m.material.emissive.setHex(HL);m.material.emissiveIntensity=.55;}else{m.material.emissive.setHex(m.userData.e0);m.material.emissiveIntensity=m.userData.ei;}});}
function select(id,fly){if(S.sel)setHL(S.sel,false);S.sel=id;if(id)setHL(id,true);
  if(id&&fly){const a=ANCH[id];if(a){const t=new THREE.Vector3(a[1],a[2],a[3]);a[0].localToWorld(t);const dir=camera.position.clone().sub(controls.target).normalize();const dist=['chiller','nshv','tray','uplink','feeder','pipes','hrx'].includes(id)?3.2:2.0;flyTo(t.clone().add(dir.multiplyScalar(dist)),t);}}
  emit(); invalidate();}

/* ---------------- modes ---------------- */
function shellOpacity(){return S.shell==='solid'?1:.12;}
function applyShell(){shellMeshes.forEach(m=>{m.visible=S.shell!=='off';m.material.opacity=shellOpacity();m.material.depthWrite=S.shell==='solid';m.material.transparent=S.shell!=='solid';});
  equipGlass.forEach(m=>{m.transparent=true;m.opacity=S.shell==='solid'?1:0.5;m.depthWrite=S.shell==='solid';});
  faceMats.forEach(m=>{m.opacity=S.shell==='solid'?1:0.38;m.depthWrite=S.shell==='solid';});
  blankMat.opacity=S.shell==='solid'?1:(S.shell==='glass'?0.5:0.18);blankMat.depthWrite=S.shell==='solid';
  if(S.sel)setHL(S.sel,true);}
const EXP={ecab:[gE,[-0.75,0,0]],lcp:[gL,[0.75,0,0]],b1:[gB1,[0,0,1.15]],b2:[gB2,[0,0,0.9]],cpu:[gCPU,[0,0,0.65]],lb:[gLB,[0,0,0.75]],net:[gNet,[0,0,0.45]],fire:[gFire,[0,0,0.45]]};
let expK=0;
function applyLayers(){const L=S.layers;gWater.visible=L.water;gPow.visible=L.power;gTray.visible=L.power||L.signal;gSig.visible=L.signal;gDim.visible=L.dims;
  gAir.visible=L.air&&expK<0.02;
  const conn=expK<0.02; if(!conn){gWater.visible=false;gPow.visible=false;gSig.visible=false;}}

/* ---------------- camera views ---------------- */
const VIEWS={iso:[[3.9,3.0,4.3],[0.05,0.95,-0.6]],front:[[0.15,1.1,5.0],[0.15,1.0,-0.5]],rear:[[0.35,1.5,-6.4],[0.35,0.95,-1.0]],
 top:[[0.0,8.2,-0.55],[0.0,0,-0.9]],rack:[[1.3,1.35,2.35],[0.42,1.0,-0.55]],system:[[5.6,4.6,4.0],[-0.9,0.7,-1.2]]};
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

/* theme (dark only) */
function applyTheme(){scene.background=new THREE.Color(cssVar('--scene')||'#DDE2DD');floorMat.color.set(cssVar('--floor')||'#CBD1CB');wallMat.color.set(cssVar('--wall')||'#B5BAB2');groundMat.color.set(cssVar('--ground')||'#B9C0B4');
  gRoom.remove(grid);const gc=cssVar('--grid')||'#AEB6AF';grid=new THREE.GridHelper(7,14,gc,gc);grid.position.set(-0.4,0.002,0.85);grid.scale.z=5.6/7;gRoom.add(grid);buildDims();}
/* resize */
function resize(){const w=viewer.clientWidth,h=viewer.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();invalidate();}
const ro=new ResizeObserver(resize); ro.observe(viewer);

/* ---------------- loop: render on demand ---------------- */
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock=new THREE.Clock(); const o3=[0,0,0];
let raf=0, onScreen=true, disposed=false, damping=0;
function animating(){return !!fly||expK!==(S.layers.explode?1:0)||damping>0||(!reduce&&(gAir.visible||gWater.visible));}
function schedule(){if(!raf&&!disposed&&onScreen&&!document.hidden){clock.getDelta();raf=requestAnimationFrame(frame);}}
function invalidate(){schedule();}
function frame(){raf=0;const dt=Math.min(clock.getDelta(),0.05);
  if(fly){fly.k=Math.min(1,fly.k+dt*1.8);const e=fly.k<.5?2*fly.k*fly.k:1-Math.pow(-2*fly.k+2,2)/2;camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.t0,fly.t1,e);if(fly.k>=1)fly=null;}
  const tgt=S.layers.explode?1:0; const pk=expK; expK+=(tgt-expK)*Math.min(1,dt*5); if(Math.abs(tgt-expK)<0.001)expK=tgt;
  if(pk!==expK){Object.values(EXP).forEach(([g,v])=>g.position.set(v[0]*expK,v[1]*expK,v[2]*expK));applyLayers();}
  if(gAir.visible&&!reduce){for(let i=0;i<NP;i++){const p=P[i];p.t+=dt*p.v;if(p.t>=1){p.t-=1;respawn(p);}const h=airPos(p,o3);pos[i*3]=o3[0];pos[i*3+1]=o3[1];pos[i*3+2]=o3[2];tmpC.copy(cCold).lerp(cHot,h);col[i*3]=tmpC.r;col[i*3+1]=tmpC.g;col[i*3+2]=tmpC.b;}
    airGeo.attributes.position.needsUpdate=true;airGeo.attributes.color.needsUpdate=true;}
  if(gWater.visible&&!reduce){beads.forEach(b=>{b.userData.u=(b.userData.u+dt*0.09)%1;b.position.copy(b.userData.curve.getPointAt(b.userData.u));});}
  const moved=controls.update(); damping=moved?8:Math.max(0,damping-1);
  renderer.render(scene,camera); updateMarkers();
  if(animating())schedule();}
controls.addEventListener('change',invalidate);
const io=new IntersectionObserver(es=>{onScreen=es.some(e=>e.isIntersecting);if(onScreen)schedule();},{rootMargin:'50px'}); io.observe(viewer);
const onVis=()=>{if(!document.hidden)schedule();}; document.addEventListener('visibilitychange',onVis);

/* init */
buildBricks(); applyLayers(); resize(); setView('iso',true);
// warm particle positions
for(let i=0;i<NP;i++){const h=airPos(P[i],o3);pos.set(o3,i*3);tmpC.copy(cCold).lerp(cHot,h);col.set([tmpC.r,tmpC.g,tmpC.b],i*3);}
airGeo.attributes.position.needsUpdate=true;
applyTheme();
const fontsReady=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('500 56px "JetBrains Mono"'),document.fonts.ready]).catch(()=>{}):Promise.resolve();
fontsReady.then(()=>{if(!disposed){buildDims();invalidate();}});
schedule();

const LAYER={explode:'explode',air:'air',water:'water',power:'power',signals:'signal',numbers:'labels',dims:'dims'};
function setConfig(c){S.config=c;buildBricks();P.forEach(respawn);if(S.sel&&!visibleChainIgnoringLayers(ANCH[S.sel][0]))select(null);invalidate();}
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
  isAvailable(id){const a=ANCH[id];return !a||visibleChainIgnoringLayers(a[0]);},
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
