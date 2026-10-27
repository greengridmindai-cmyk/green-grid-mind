/**
 * GGM-Node 3D model — builds every part of the scene in a fixed order.
 * One file per section; this file only wires them together. The engine (../cabinetScene.js) never
 * needs to change for a new model revision.
 *
 * To add a new part: create a builder (see kit.js for helpers), call it here, register its meshes
 * with a component id from src/data/cabinet/components.ts, and add a marker in layout.js → ANCHORS.
 */
import { buildRoom } from './room.js';
import { buildEnergyCabinet } from './ecab.js';
import { buildRack } from './rack.js';
import { buildLcp } from './lcp.js';
import { buildOutdoor } from './outdoor.js';
import { buildWater } from './water.js';
import { buildPower } from './power.js';
import { buildSignals } from './signals.js';
import { buildAirflow } from './airflow.js';
import { buildDims } from './dims.js';

export function buildModel(k, { getConfig }) {
  const room = buildRoom(k);
  const ecab = buildEnergyCabinet(k);
  const rack = buildRack(k);
  const lcp = buildLcp(k);
  const outdoor = buildOutdoor(k, { gRoom: room.gRoom });
  const water = buildWater(k);
  const power = buildPower(k);
  const signals = buildSignals(k);
  const air = buildAirflow(k, getConfig);
  const dims = buildDims(k);

  /** named groups (names used by layout.js → ANCHORS / EXPLODE) */
  const groups = {
    room: room.gRoom,
    ecab: ecab.gE,
    rack: rack.gRack,
    brick1: rack.gB1,
    brick2: rack.gB2,
    cpu: rack.gCPU,
    loadbank: rack.gLB,
    net: rack.gNet,
    fire: rack.gFire,
    lcp: lcp.gL,
    outdoor: outdoor.gOut,
    tray: outdoor.gTray,
    water: water.gWater,
    power: power.gPow,
    signal: signals.gSig,
    air: air.gAir,
    dims: dims.gDim,
    static: dims.gStatic,
  };
  return { groups, room, rack, water, air, dims };
}
