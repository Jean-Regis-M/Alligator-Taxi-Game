import { useRef, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "./useGameStore";

interface Props {
  taxiPosition: MutableRefObject<THREE.Vector3>;
}

function buildArrowTex(): THREE.CanvasTexture {
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, N, N);
  ctx.fillStyle = "#ffffff";
  const mx = N / 2;
  ctx.beginPath();
  ctx.moveTo(mx,              N * 0.82);
  ctx.lineTo(mx + N * 0.38,  N * 0.38);
  ctx.lineTo(mx + N * 0.16,  N * 0.38);
  ctx.lineTo(mx + N * 0.16,  N * 0.12);
  ctx.lineTo(mx - N * 0.16,  N * 0.12);
  ctx.lineTo(mx - N * 0.16,  N * 0.38);
  ctx.lineTo(mx - N * 0.38,  N * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 5;
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

const ARROW_TEX = buildArrowTex();

export default function DirectionArrow({ taxiPosition }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef   = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;

    const { activePassenger, waitingPassengers } = useGameStore.getState();
    const pos = taxiPosition.current;

    let targetX: number | null = null;
    let targetZ: number | null = null;
    let isDropoff = false;

    if (activePassenger) {
      targetX = activePassenger.destination[0];
      targetZ = activePassenger.destination[2];
      isDropoff = true;
    } else if (waitingPassengers.length > 0) {
      let minDist = Infinity;
      for (const p of waitingPassengers) {
        const dx = p.position[0] - pos.x;
        const dz = p.position[2] - pos.z;
        const d  = dx * dx + dz * dz;
        if (d < minDist) {
          minDist = d;
          targetX = p.position[0];
          targetZ = p.position[2];
        }
      }
    }

    const bob = Math.sin(clock.elapsedTime * 4.5) * 0.28;
    g.position.set(pos.x, pos.y + 4.8 + bob, pos.z);

    if (targetX !== null && targetZ !== null) {
      const dx = targetX - pos.x;
      const dz = targetZ - pos.z;
      g.rotation.y = Math.atan2(dx, dz);
    }

    if (matRef.current) {
      matRef.current.color.set(isDropoff ? "#ff3311" : "#00ee55");
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2 - 0.66, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          ref={matRef}
          map={ARROW_TEX}
          color="#00ee55"
          transparent
          alphaTest={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
