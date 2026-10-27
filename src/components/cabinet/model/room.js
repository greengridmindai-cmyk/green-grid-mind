/** Room: floor, outdoor ground, grid, building walls. Colours of floor/ground/wall/grid follow the CSS theme (engine). */
import * as THREE from 'three';
export function buildRoom(k) {
  const { M, box, edges, grp } = k;
  const gRoom = grp('room');
  const floorMat = M(0xCBD1CB, { roughness: .95 }); const groundMat = M(0xB9C0B4, { roughness: 1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 5.6), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(-0.4, 0, 0.85); gRoom.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.6), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.set(-0.4, -0.002, -3.25); gRoom.add(ground);
  const grid = new THREE.GridHelper(7, 14, 0xAEB6AF, 0xAEB6AF); grid.position.set(-0.4, 0.002, 0.85); grid.scale.z = 5.6 / 7; gRoom.add(grid);
  const wallMat = M(0xB5BAB2, { transparent: true, opacity: .34, depthWrite: false, side: THREE.DoubleSide });
  const wall = box(-4, 3.2, 0, 2.8, -1.95, -1.75, wallMat); gRoom.add(wall); gRoom.add(edges(wall, 0x8a928c, .5));
  const wallL = box(-4, -3.8, 0, 2.8, -1.75, 3.6, wallMat); gRoom.add(wallL); gRoom.add(edges(wallL, 0x8a928c, .35));
  /** replaces the floor grid with the theme colour */
  function setGrid(color) {
    gRoom.remove(room.grid);
    room.grid = new THREE.GridHelper(7, 14, color, color); room.grid.position.set(-0.4, 0.002, 0.85); room.grid.scale.z = 5.6 / 7; gRoom.add(room.grid);
  }
  const room = { gRoom, floorMat, groundMat, wallMat, grid, setGrid };
  return room;
}
