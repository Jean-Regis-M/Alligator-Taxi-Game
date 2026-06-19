import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "./useGameStore";

const G  = "#1a8a3c";   // body green
const GD = "#145a2e";   // dark green (back/ridges)
const GB = "#b8e8a8";   // belly cream
const GY = "#FFD700";   // cap gold

export default function AlligatorDriver() {
  const headRef  = useRef<THREE.Group>(null);
  const jawRef   = useRef<THREE.Group>(null);
  const armLRef  = useRef<THREE.Group>(null);
  const armRRef  = useRef<THREE.Group>(null);
  const tail1Ref = useRef<THREE.Group>(null);
  const tail2Ref = useRef<THREE.Group>(null);
  const tail3Ref = useRef<THREE.Group>(null);
  const tail4Ref = useRef<THREE.Group>(null);

  const { taxiVelocity, activePassenger } = useGameStore();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const spd = Math.abs(taxiVelocity);

    // Head bob
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * (2 + spd * 0.08)) * 0.07;
      headRef.current.rotation.x = activePassenger ? Math.sin(t * 1.6) * 0.05 : 0;
    }

    // Jaw chatter when picked up
    if (jawRef.current) {
      jawRef.current.rotation.x = activePassenger
        ? Math.max(0, Math.sin(t * 5)) * 0.22
        : 0;
    }

    // Arms steer
    if (armLRef.current) armLRef.current.rotation.z =  0.38 + Math.sin(t * 1.8) * 0.12;
    if (armRRef.current) armRRef.current.rotation.z = -(0.38 + Math.sin(t * 1.8 + 1.1) * 0.12);

    // Tail — chained sine waves, each segment lags more than the last
    const swing = 0.28 + spd * 0.015;
    const freq  = 2.6 + spd * 0.04;
    if (tail1Ref.current) tail1Ref.current.rotation.y = Math.sin(t * freq)              * swing * 0.7;
    if (tail2Ref.current) tail2Ref.current.rotation.y = Math.sin(t * freq - 0.85)       * swing;
    if (tail3Ref.current) tail3Ref.current.rotation.y = Math.sin(t * freq - 1.7)        * swing * 1.3;
    if (tail4Ref.current) tail4Ref.current.rotation.y = Math.sin(t * freq - 2.55)       * swing * 1.6;
  });

  return (
    <group position={[-0.42, 1.08, 0.1]}>

      {/* ── TORSO ──────────────────────────────────────────────────────────── */}
      {/* Main body — tapered cylinder, wider at hips */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.16, 0.21, 0.44, 10]} />
        <meshLambertMaterial color={G} />
      </mesh>
      {/* Belly plate */}
      <mesh position={[0, -0.18, 0.12]}>
        <cylinderGeometry args={[0.12, 0.16, 0.38, 10]} />
        <meshLambertMaterial color={GB} />
      </mesh>
      {/* Spine ridge bumps */}
      {[0.02, -0.12, -0.26].map((y, i) => (
        <mesh key={i} position={[0, y, -0.19]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.04, 0.1, 5]} />
          <meshLambertMaterial color={GD} />
        </mesh>
      ))}

      {/* ── HEAD ───────────────────────────────────────────────────────────── */}
      <group ref={headRef} position={[0, 0.16, 0]}>
        {/* Rounded skull */}
        <mesh position={[0, 0.11, -0.02]}>
          <sphereGeometry args={[0.19, 12, 9]} />
          <meshLambertMaterial color={G} />
        </mesh>
        {/* Flatten bottom of skull */}
        <mesh position={[0, -0.01, -0.02]}>
          <cylinderGeometry args={[0.18, 0.18, 0.06, 10]} />
          <meshLambertMaterial color={G} />
        </mesh>

        {/* Upper snout — tapered box, wide at base */}
        <mesh position={[0, 0.07, 0.26]}>
          <boxGeometry args={[0.28, 0.13, 0.30]} />
          <meshLambertMaterial color={G} />
        </mesh>
        {/* Snout tip — narrower */}
        <mesh position={[0, 0.06, 0.44]}>
          <boxGeometry args={[0.20, 0.10, 0.14]} />
          <meshLambertMaterial color={G} />
        </mesh>
        {/* Nostril bumps */}
        {[-0.07, 0.07].map((tx, i) => (
          <mesh key={i} position={[tx, 0.12, 0.50]}>
            <sphereGeometry args={[0.030, 6, 5]} />
            <meshLambertMaterial color={GD} />
          </mesh>
        ))}

        {/* Lower jaw (animated) */}
        <group ref={jawRef} position={[0, 0.01, 0.28]}>
          <mesh>
            <boxGeometry args={[0.26, 0.08, 0.28]} />
            <meshLambertMaterial color={GB} />
          </mesh>
          {/* Teeth — lower row */}
          {[-0.08, 0, 0.08].map((tx, i) => (
            <mesh key={i} position={[tx, -0.06, 0.09]}>
              <cylinderGeometry args={[0.018, 0.024, 0.07, 5]} />
              <meshLambertMaterial color="#EEE8CC" />
            </mesh>
          ))}
        </group>
        {/* Teeth — upper row */}
        {[-0.08, 0, 0.08].map((tx, i) => (
          <mesh key={i} position={[tx, 0.02, 0.36]} rotation={[Math.PI, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.022, 0.065, 5]} />
            <meshLambertMaterial color="#EEE8CC" />
          </mesh>
        ))}

        {/* Eyes — raised dome spheres */}
        {[-0.1, 0.1].map((tx, i) => (
          <group key={i} position={[tx, 0.26, 0.06]}>
            {/* Eye socket bump */}
            <mesh>
              <sphereGeometry args={[0.072, 9, 8]} />
              <meshLambertMaterial color={GD} />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0.03, 0.055]}>
              <sphereGeometry args={[0.052, 8, 7]} />
              <meshLambertMaterial color="#FFE800" />
            </mesh>
            {/* Slit pupil */}
            <mesh position={[0, 0.035, 0.098]}>
              <boxGeometry args={[0.012, 0.040, 0.01]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          </group>
        ))}

        {/* Sunglasses */}
        {[-0.1, 0.1].map((tx, i) => (
          <mesh key={i} position={[tx, 0.29, 0.107]}>
            <boxGeometry args={[0.14, 0.055, 0.01]} />
            <meshBasicMaterial color="#111" transparent opacity={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.29, 0.107]}>
          <boxGeometry args={[0.055, 0.022, 0.01]} />
          <meshBasicMaterial color="#333" />
        </mesh>

        {/* Cap */}
        <mesh position={[0, 0.30, -0.04]}>
          <cylinderGeometry args={[0.20, 0.21, 0.06, 10]} />
          <meshLambertMaterial color={GY} />
        </mesh>
        {/* Cap dome */}
        <mesh position={[0, 0.35, -0.06]}>
          <sphereGeometry args={[0.20, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshLambertMaterial color={GY} />
        </mesh>
        {/* Brim */}
        <mesh position={[0, 0.29, 0.16]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.38, 0.03, 0.18]} />
          <meshLambertMaterial color={GY} />
        </mesh>
        {/* Cap badge */}
        <mesh position={[0, 0.33, 0.17]}>
          <boxGeometry args={[0.07, 0.038, 0.01]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* ── LEFT ARM (steering side) ────────────────────────────────────────── */}
      <group ref={armLRef} position={[0.20, -0.06, 0.08]}>
        {/* Upper arm */}
        <mesh position={[0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.052, 0.062, 0.18, 7]} />
          <meshLambertMaterial color={G} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0.16, -0.04, 0]}>
          <sphereGeometry args={[0.055, 7, 6]} />
          <meshLambertMaterial color={GD} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0.22, -0.05, 0.06]} rotation={[0.3, 0, Math.PI / 2.2]}>
          <cylinderGeometry args={[0.044, 0.054, 0.16, 7]} />
          <meshLambertMaterial color={G} />
        </mesh>
        {/* Claws */}
        {[-0.02, 0.02].map((tz, i) => (
          <mesh key={i} position={[0.30, -0.09, tz]} rotation={[-0.4, 0, 0]}>
            <coneGeometry args={[0.018, 0.060, 4]} />
            <meshLambertMaterial color={GB} />
          </mesh>
        ))}
      </group>

      {/* ── RIGHT ARM ──────────────────────────────────────────────────────── */}
      <group ref={armRRef} position={[-0.20, -0.06, 0.08]}>
        <mesh position={[-0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.052, 0.062, 0.18, 7]} />
          <meshLambertMaterial color={G} />
        </mesh>
        <mesh position={[-0.16, -0.04, 0]}>
          <sphereGeometry args={[0.055, 7, 6]} />
          <meshLambertMaterial color={GD} />
        </mesh>
        <mesh position={[-0.22, -0.05, 0.06]} rotation={[0.3, 0, -Math.PI / 2.2]}>
          <cylinderGeometry args={[0.044, 0.054, 0.16, 7]} />
          <meshLambertMaterial color={G} />
        </mesh>
        {[-0.02, 0.02].map((tz, i) => (
          <mesh key={i} position={[-0.30, -0.09, tz]} rotation={[-0.4, 0, 0]}>
            <coneGeometry args={[0.018, 0.060, 4]} />
            <meshLambertMaterial color={GB} />
          </mesh>
        ))}
      </group>

      {/* Steering wheel */}
      <mesh position={[0.18, -0.04, 0.20]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.10, 0.018, 7, 16]} />
        <meshLambertMaterial color="#222" />
      </mesh>

      {/* ── TAIL (chained segments, swings side-to-side) ────────────────────── */}
      {/* Segment 1 — base, wide */}
      <group ref={tail1Ref} position={[0, -0.30, -0.26]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.10, 0.16, 0.32, 8]} />
          <meshLambertMaterial color={G} />
        </mesh>
        {/* Ridge */}
        <mesh position={[0, 0.16, -0.04]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.038, 0.09, 5]} />
          <meshLambertMaterial color={GD} />
        </mesh>

        {/* Segment 2 */}
        <group ref={tail2Ref} position={[0, 0, -0.32]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.072, 0.10, 0.30, 7]} />
            <meshLambertMaterial color={G} />
          </mesh>
          <mesh position={[0, 0.12, -0.04]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.030, 0.080, 5]} />
            <meshLambertMaterial color={GD} />
          </mesh>

          {/* Segment 3 */}
          <group ref={tail3Ref} position={[0, 0, -0.30]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.046, 0.072, 0.26, 7]} />
              <meshLambertMaterial color={G} />
            </mesh>
            <mesh position={[0, 0.09, -0.04]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.022, 0.065, 5]} />
              <meshLambertMaterial color={GD} />
            </mesh>

            {/* Segment 4 — tip */}
            <group ref={tail4Ref} position={[0, 0, -0.26]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.016, 0.046, 0.22, 6]} />
                <meshLambertMaterial color={GD} />
              </mesh>
              {/* Pointed tip */}
              <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.016, 0.12, 5]} />
                <meshLambertMaterial color={GD} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

    </group>
  );
}
