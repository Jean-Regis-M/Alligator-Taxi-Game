import * as THREE from "three";

// Written by Taxi.tsx every frame, read by Traffic.tsx and DirectionArrow
export const taxiPos = new THREE.Vector3(30, 0, -30);
const _state = { rot: 0 };
export function setTaxiRot(r: number) { _state.rot = r; }
export function getTaxiRot(): number   { return _state.rot; }
