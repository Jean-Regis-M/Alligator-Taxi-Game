import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ROAD_WIDTH, getRoadXPositions } from "./constants";
import { useGameStore } from "./useGameStore";
import { taxiPos } from "./sharedState";

const CAR_MODELS = [
  "/models/red_luxury.glb",
  "/models/blue_sedan.glb",
  "/models/red_luxury.glb",
  "/models/blue_sedan.glb",
  "/models/red_luxury.glb",
  "/models/blue_sedan.glb",
];
CAR_MODELS.forEach(p => useGLTF.preload(p));

const CAR_SCALE = 1.3;

export const NUM_TRAFFIC = 14;

export const trafficWorldPositions: THREE.Vector3[] = Array.from(
  { length: NUM_TRAFFIC }, () => new THREE.Vector3()
);
export const trafficPushVelocities: THREE.Vector3[] = Array.from(
  { length: NUM_TRAFFIC }, () => new THREE.Vector3()
);

interface CarData {
  id: number;
  pos: THREE.Vector3;
  speed: number;
  modelPath: string;
  axis: "x" | "z";
  dir: 1 | -1;
}

function useSeedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const MESHY_ROT = Math.PI / 2;
const MODEL_ROT_Y: Record<string, number> = {
  "/models/red_luxury.glb": MESHY_ROT,
  "/models/blue_sedan.glb": MESHY_ROT,
};
const MODEL_SCALE_MULT: Record<string, number> = {
  "/models/red_luxury.glb": 2.2,
  "/models/blue_sedan.glb": 2.2,
};

function CarMesh({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  const scale = CAR_SCALE * (MODEL_SCALE_MULT[modelPath] ?? 1);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    clone.position.set(-scale * cx, -scale * box.min.y, -scale * cz);
    return clone;
  }, [scene, scale]);
  const rotY = MODEL_ROT_Y[modelPath] ?? 0;
  return (
    <group rotation={[0, rotY, 0]}>
      <primitive object={model} scale={scale} />
    </group>
  );
}

export default function Traffic() {
  const { gameState } = useGameStore();

  const cars = useMemo<CarData[]>(() => {
    const rand = useSeedRand(99);
    const roads = getRoadXPositions();
    const citySize = roads[roads.length - 1] - roads[0];
    return Array.from({ length: NUM_TRAFFIC }, (_, i) => {
      const road = roads[Math.floor(rand() * roads.length)];
      const axis: "x" | "z" = rand() > 0.5 ? "x" : "z";
      const dir: 1 | -1 = rand() > 0.5 ? 1 : -1;
      const lane = (rand() > 0.5 ? 1 : -1) * (ROAD_WIDTH / 4);
      return {
        id: i,
        pos: new THREE.Vector3(
          axis === "x" ? rand() * citySize - citySize / 2 : road + lane,
          0,
          axis === "z" ? rand() * citySize - citySize / 2 : road + lane
        ),
        speed: 6 + rand() * 8,
        modelPath: CAR_MODELS[i % CAR_MODELS.length],
        axis,
        dir,
      };
    });
  }, []);

  // One array of refs — index matches car id
  const refs = useRef<(THREE.Group | null)[]>(Array(NUM_TRAFFIC).fill(null));

  // Single useFrame for all cars
  useFrame((_, delta) => {
    if (gameState !== "playing") return;
    const dt = Math.min(delta, 0.05);
    const roads = getRoadXPositions();
    const halfCity = (roads[roads.length - 1] - roads[0]) / 2;

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const ref = refs.current[i];
      if (!ref) continue;

      const dist = car.pos.distanceTo(taxiPos);
      const avoid = dist < 14 ? Math.max(0, (dist - 3) / 11) : 1;

      if (car.axis === "x") {
        car.pos.x += car.speed * car.dir * avoid * dt;
        if (car.pos.x > halfCity + 5) car.pos.x = -halfCity - 5;
        if (car.pos.x < -halfCity - 5) car.pos.x = halfCity + 5;
      } else {
        car.pos.z += car.speed * car.dir * avoid * dt;
        if (car.pos.z > halfCity + 5) car.pos.z = -halfCity - 5;
        if (car.pos.z < -halfCity - 5) car.pos.z = halfCity + 5;
      }

      const push = trafficPushVelocities[i];
      if (push.lengthSq() > 0.04) {
        car.pos.x += push.x * dt;
        car.pos.z += push.z * dt;
        push.multiplyScalar(0.78);
        if (push.lengthSq() < 0.04) push.set(0, 0, 0);
      }

      trafficWorldPositions[i].copy(car.pos);
      ref.position.copy(car.pos);
      ref.rotation.y =
        car.axis === "x"
          ? (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2)
          : (car.dir > 0 ? 0 : Math.PI);
    }
  });

  return (
    <>
      {cars.map((car, i) => (
        <group
          key={car.id}
          ref={(el) => { refs.current[i] = el; }}
          position={[car.pos.x, car.pos.y, car.pos.z]}
        >
          <CarMesh modelPath={car.modelPath} />
        </group>
      ))}
    </>
  );
}
