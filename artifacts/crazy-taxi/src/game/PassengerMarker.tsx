import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "./useGameStore";
import type { Passenger } from "./types";
import { VIP_TYPES } from "./constants";

// Orange spinning dollar coin texture
function makeDollarTex(): THREE.CanvasTexture {
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d")!;
  // Orange coin face
  ctx.fillStyle = "#E86010";
  ctx.beginPath();
  ctx.arc(N / 2, N / 2, N / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  // Darker rim
  ctx.strokeStyle = "#B04400";
  ctx.lineWidth = 10;
  ctx.stroke();
  // Gold $ sign
  ctx.fillStyle = "#FFD700";
  ctx.font = `bold ${Math.round(N * 0.62)}px Arial Black, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", N / 2, N / 2 + 4);
  return new THREE.CanvasTexture(c);
}
const DOLLAR_TEX = makeDollarTex();

const SKIN_TONES  = ["#F5CBA7","#E59866","#CA6F1E","#784212","#F0D9B5"];
const SHIRT_COLORS = ["#E74C3C","#3498DB","#2ECC71","#F39C12","#9B59B6","#1ABC9C","#E67E22","#E91E63"];
const HAIR_COLORS  = ["#2A1A0A","#6B3A1F","#C8A850","#1A1A1A","#8B4513"];

function SimplePassenger({ passengerId, color }: { passengerId: number; color: string }) {
  const skin  = SKIN_TONES[passengerId % SKIN_TONES.length];
  const shirt = SHIRT_COLORS[passengerId % SHIRT_COLORS.length];
  const hair  = HAIR_COLORS[passengerId % HAIR_COLORS.length];
  return (
    <group>
      {/* hair cap */}
      <mesh position={[0, 2.66, 0]}>
        <sphereGeometry args={[0.275, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshLambertMaterial color={hair} />
      </mesh>
      {/* head */}
      <mesh position={[0, 2.44, 0]}>
        <sphereGeometry args={[0.255, 12, 10]} />
        <meshLambertMaterial color={skin} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.11, 2.52, 0.24]}>
        <sphereGeometry args={[0.052, 6, 5]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh position={[0.11, 2.52, 0.24]}>
        <sphereGeometry args={[0.052, 6, 5]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      {/* neck */}
      <mesh position={[0, 2.12, 0]}>
        <capsuleGeometry args={[0.09, 0.18, 3, 7]} />
        <meshLambertMaterial color={skin} />
      </mesh>
      {/* upper torso */}
      <mesh position={[0, 1.82, 0]}>
        <capsuleGeometry args={[0.22, 0.24, 3, 8]} />
        <meshLambertMaterial color={shirt} />
      </mesh>
      {/* lower torso */}
      <mesh position={[0, 1.48, 0]}>
        <capsuleGeometry args={[0.18, 0.18, 3, 8]} />
        <meshLambertMaterial color={shirt} />
      </mesh>
      {/* left arm */}
      <mesh position={[-0.34, 1.75, 0]} rotation={[0.1, 0, -0.18]}>
        <capsuleGeometry args={[0.08, 0.56, 3, 7]} />
        <meshLambertMaterial color={shirt} />
      </mesh>
      {/* right arm */}
      <mesh position={[0.34, 1.75, 0]} rotation={[0.1, 0, 0.18]}>
        <capsuleGeometry args={[0.08, 0.56, 3, 7]} />
        <meshLambertMaterial color={shirt} />
      </mesh>
      {/* left thigh */}
      <mesh position={[-0.13, 1.06, 0]}>
        <capsuleGeometry args={[0.10, 0.38, 3, 7]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* right thigh */}
      <mesh position={[0.13, 1.06, 0]}>
        <capsuleGeometry args={[0.10, 0.38, 3, 7]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* left shin */}
      <mesh position={[-0.13, 0.50, 0]}>
        <capsuleGeometry args={[0.085, 0.30, 3, 7]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* right shin */}
      <mesh position={[0.13, 0.50, 0]}>
        <capsuleGeometry args={[0.085, 0.30, 3, 7]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* left shoe */}
      <mesh position={[-0.13, 0.14, 0.09]}>
        <boxGeometry args={[0.18, 0.12, 0.34]} />
        <meshLambertMaterial color="#1A1A1A" />
      </mesh>
      {/* right shoe */}
      <mesh position={[0.13, 0.14, 0.09]}>
        <boxGeometry args={[0.18, 0.12, 0.34]} />
        <meshLambertMaterial color="#1A1A1A" />
      </mesh>
    </group>
  );
}

function WaitingPassengerMarker({ passenger }: { passenger: Passenger }) {
  const groupRef  = useRef<THREE.Group>(null);
  const coinRef   = useRef<THREE.Group>(null);
  const personRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + passenger.id * 1.3;
    if (coinRef.current) {
      coinRef.current.rotation.y = t * 2.8;
      coinRef.current.position.y = 5.2 + Math.sin(t * 2.2) * 0.35;
    }
    if (personRef.current) {
      personRef.current.rotation.z = Math.sin(t * 3) * 0.15;
      personRef.current.position.y = 0.05 + Math.abs(Math.sin(t * 4)) * 0.08;
    }
    if (groupRef.current) {
      groupRef.current.children[0].rotation.y = t * 1.2;
    }
  });

  const color = passenger.color;
  const isVip = VIP_TYPES.includes(passenger.personality as any);

  return (
    <group ref={groupRef} position={passenger.position}>
      {/* Spinning ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[2.8, 3.4, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Glow fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[2.8, 32]} />
        <meshBasicMaterial color={color} opacity={0.18} transparent />
      </mesh>

      {/* Waiting person */}
      <group ref={personRef}>
        <SimplePassenger passengerId={passenger.id} color={color} />
      </group>

      {/* VIP indicators */}
      {isVip && (
        <>
          {/* VIP crown */}
          <group position={[0, 6.5, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.3, 8]} />
              <meshBasicMaterial color="#FFD700" />
            </mesh>
            {/* Jewels */}
            {[-0.3, 0, 0.3].map((x, i) => (
              <mesh key={i} position={[x, 0.2, 0]}>
                <sphereGeometry args={[0.1, 0.1, 0.1, 6]} />
                <meshBasicMaterial color={["#FF0000", "#00FF00", "#0000FF"][i]} />
              </mesh>
            ))}
          </group>
        </>
      )}

      {/* Special request indicators */}
      {passenger.specialRequest && (
        <group position={[0, 5.8, 0]}>
          {/* Colored request indicator */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
            <ringGeometry args={[0.4, 0.5, 16]} />
            <meshBasicMaterial
              color={passenger.specialRequest === "quickTrip" ? "#ffeb3b" :
                      passenger.specialRequest === "scenicRoute" ? "#4caf50" :
                      passenger.specialRequest === "funDrive" ? "#e91e63" :
                      passenger.specialRequest === "smoothRide" ? "#2196f3" :
                      passenger.specialRequest === "quietTrip" ? "#9e9e9e" :
                      passenger.specialRequest === "paparraziAvoid" ? "#ff9800" :
                      passenger.specialRequest === "eventDropoff" ? "#f44336" :
                      passenger.specialRequest === "meetingPrep" ? "#607d8b" :
                      passenger.specialRequest === "sightseeingTour" ? "#8bc34a" :
                      "#ffffff"}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Spinning dollar coin — like the original Crazy Taxi */}
      <group ref={coinRef} position={[0, 5.2, 0]}>
        {/* Front face */}
        <mesh>
          <circleGeometry args={[1.6, 32]} />
          <meshBasicMaterial map={DOLLAR_TEX} side={THREE.DoubleSide} />
        </mesh>
        {/* Coin rim (thin cylinder standing upright) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.6, 1.6, 0.18, 32, 1, true]} />
          <meshBasicMaterial color="#B04400" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// Horizontal scan-line heights for the green aura cage
const SCAN_Y = [0.5, 1.8, 3.2, 4.6, 6.0, 7.4, 8.8];
const AURA_R = 5.5;   // radius of the green cage
const ARROW_Y_BASE = 13;

function DestinationMarker({ passenger }: { passenger: Passenger }) {
  const arrowRef  = useRef<THREE.Group>(null);
  const glowRef   = useRef<THREE.Mesh>(null);
  const scanRefs  = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Arrow bobs up and down
    if (arrowRef.current) {
      arrowRef.current.position.y = ARROW_Y_BASE + Math.sin(t * 3) * 0.6;
    }

    // Ground glow pulses in opacity
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.35 + Math.sin(t * 4) * 0.15;
    }

    // Scan lines scroll upward and wrap
    scanRefs.current.forEach((m, i) => {
      if (!m) return;
      const scroll = ((t * 1.8 + i * 1.1) % (SCAN_Y[SCAN_Y.length - 1] + 1.5));
      m.position.y = scroll;
      (m.material as THREE.MeshBasicMaterial).opacity =
        0.18 + Math.sin(t * 3 + i) * 0.08;
    });
  });

  return (
    <group position={passenger.destination}>

      {/* ── Ground glow ─────────────────────────────────────── */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[AURA_R, 40]} />
        <meshBasicMaterial
          color={passenger.isTimeSensitive && passenger.timeLimit > 0 ? "#ffeb3b" :
                 VIP_TYPES.includes(passenger.personality as any) ? "#FFD700" :
                 "#00FF44"}
          transparent
          opacity={0.38}
        />
      </mesh>
      {/* Bright ring at ground level */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[AURA_R - 0.5, AURA_R + 0.3, 40]} />
        <meshBasicMaterial
          color={passenger.isTimeSensitive && passenger.timeLimit > 0 ? "#ffeb3b" :
                 VIP_TYPES.includes(passenger.personality as any) ? "#FFD700" :
                 "#00FF44"}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Green scan-line cage ─────────────────────────────── */}
      {SCAN_Y.map((_, i) => (
        <mesh
          key={`scan-${i}`}
          ref={el => { if (el) scanRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, SCAN_Y[i], 0]}
        >
          <ringGeometry args={[AURA_R * 0.3, AURA_R + 0.2, 40]} />
          <meshBasicMaterial
            color={passenger.isTimeSensitive && passenger.timeLimit > 0 ? "#ffeb3b" :
                   VIP_TYPES.includes(passenger.personality as any) ? "#FFD700" :
                   "#00FF44"}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ── Vertical corner pillars ──────────────────────────── */}
      {([[-1,-1],[1,-1],[1,1],[-1,1]] as [number,number][]).map(([sx,sz],i) => (
        <mesh key={`pillar-${i}`} position={[sx * AURA_R * 0.72, 4.5, sz * AURA_R * 0.72]}>
          <cylinderGeometry args={[0.12, 0.12, 9, 6]} />
          <meshBasicMaterial
            color={passenger.isTimeSensitive && passenger.timeLimit > 0 ? "#ffeb3b" :
                   VIP_TYPES.includes(passenger.personality as any) ? "#FFD700" :
                   "#00FF44"}
            transparent
            opacity={0.55}
          />
        </mesh>
      )})

      {/* ── Special indicators ──────────────────────────────── */}
      {VIP_TYPES.includes(passenger.personality as any) && (
        <group position={[0, ARROW_Y_BASE + 2, 0]}>
          {/* VIP star */}
          <mesh>
            <octahedronGeometry args={[0.6, 0]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        </group>
      )}
      {passenger.isTimeSensitive && passenger.timeLimit > 0 && (
        <group position={[0, ARROW_Y_BASE + 2, 0]}>
          {/* Timer icon */}
          <group>
            {/* Outer circle */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.4, 0.5, 16]} />
              <meshBasicMaterial color="#ffeb3b" />
            </mesh>
            {/* Center dot */}
            <mesh>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
            {/* Timer hands - simple fixed position for demo */}
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <cylinderGeometry args={[0.05, 0.05, 0.3, 4]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <cylinderGeometry args={[0.03, 0.03, 0.2, 4]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          </group>
        </group>
      )}

      {/* ── Big red downward arrow ───────────────────────────── */}
      <group ref={arrowRef} position={[0, ARROW_Y_BASE, 0]}>
        {/* Arrow head */}
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[2.2, 3.5, 4]} />
          <meshBasicMaterial color="#FF1111" />
        </mesh>
        {/* Arrow shaft */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[1.1, 3.0, 0.6]} />
          <meshBasicMaterial color="#FF1111" />
        </mesh>
      </group>

    </group>
  );
}

export default function PassengerMarkers() {
  const { waitingPassengers, activePassenger, gameState } = useGameStore();
  if (gameState !== "playing") return null;

  return (
    <>
      {waitingPassengers.map((p) => (
        <WaitingPassengerMarker key={p.id} passenger={p} />
      ))}
      {activePassenger && <DestinationMarker passenger={activePassenger} />}
    </>
  );
}
