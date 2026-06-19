import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { TAXI_SPEED, TAXI_TURN_SPEED, FRICTION, PICKUP_RADIUS, DROPOFF_RADIUS } from "./constants";
import { useGameStore } from "./useGameStore";
import { getBuildings } from "./buildingData";
import { trafficWorldPositions, trafficPushVelocities } from "./Traffic";
import { taxiPos, setTaxiRot } from "./sharedState";
import { playCollision, playScreech, playPassengerGreet, playDriftScreech, playPerfectDriftSound, playDriftStreakSound } from "./audio";
import { TAXI_SPAWN } from "./constants";

useGLTF.preload("/models/gator_car.glb");

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
}

interface TaxiProps {
  onPositionChange?: (pos: THREE.Vector3, rotation: number) => void;
}

const COLLISION_COOLDOWN = 1.4;
const TRAFFIC_HIT_RADIUS = 3.2;
const BUILDING_MARGIN    = 1.8;
const CAR_SCALE          = 3.0;

const BUILDINGS = getBuildings();

export default function Taxi({ onPositionChange }: TaxiProps) {
  const meshRef      = useRef<THREE.Group>(null);
  const velocityRef  = useRef(0);
  const rotationRef  = useRef(0);
  const positionRef  = useRef(new THREE.Vector3(0, 0.5, 0));
  const bodyRef      = useRef<THREE.Group>(null);
  const lastCollisionRef = useRef(-999);
  const wasBreaking  = useRef(false);
  const greetedRef   = useRef<Set<number>>(new Set());
  // Drift system refs
  const lastDriftTimeRef = useRef(0);
  const driftPointsRef   = useRef(0);
  const driftTimerRef    = useRef(0);
  // Drift bonus tracking
  const perfectDriftTimerRef = useRef(0);
  const lastDriftEndTimeRef  = useRef(0);
  const driftStreakCountRef  = useRef(0);
  // Drift particle effects
  const driftParticlesRef = useRef<Array<{position: THREE.Vector3; velocity: THREE.Vector3; life: number; maxLife: number; color: string}>>([]);
  const particleClockRef  = useRef(0);

  const [, getControls] = useKeyboardControls<Controls>();
  const {
    gameState,
    waitingPassengers,
    activePassenger,
    pickupPassenger,
    dropoffPassenger,
    setTaxiVelocity,
    applyCollisionPenalty,
    upgradeLevels,
    fuel,
    boosting,
    setBoosting,
    updateFuel,
    driftScore,
    driftCombo,
    isDrifting,
    isPerfectDriftActive,
    setIsDrifting,
    setIsPerfectDriftActive,
    addDriftScore,
    setDriftCombo,
    resetDrift,
  } = useGameStore();

  const { scene: carScene } = useGLTF("/models/gator_car.glb");

  const carModel = useMemo(() => {
    const clone = carScene.clone(true);
    clone.traverse((obj: THREE.Object3D) => {  });
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    clone.position.set(-CAR_SCALE * cx, -CAR_SCALE * box.min.y, -CAR_SCALE * cz);
    return clone;
  }, [carScene]);

  useEffect(() => {
    if (gameState === "playing") {
      positionRef.current.copy(TAXI_SPAWN);
      velocityRef.current = 0;
      rotationRef.current = 0;
      lastCollisionRef.current = -999;
      greetedRef.current.clear();
      // Reset drift refs
      lastDriftTimeRef.current = 0;
      driftPointsRef.current = 0;
      driftTimerRef.current = 0;
      // Reset bonus tracking
      perfectDriftTimerRef.current = 0;
      lastDriftEndTimeRef.current = 0;
      driftStreakCountRef.current = 0;
      // Clear any existing particles
      driftParticlesRef.current = [];
      if (meshRef.current) {
        meshRef.current.position.copy(positionRef.current);
        meshRef.current.rotation.y = 0;
      }
    }
  }, [gameState]);

  useFrame(({ clock }, delta) => {
    if (gameState !== "playing") return;
    const controls = getControls();
    const dt = Math.min(delta, 0.05);
    const now = clock.getElapsedTime();

    // Compute upgrade modifiers
    const speedMod = 1 + upgradeLevels.speed * 0.1; // +10% per level
    const accelMod = 1 + upgradeLevels.acceleration * 0.15; // +15% per level
    const handlingMod = 1 + upgradeLevels.handling * 0.1; // +10% per level
    const brakingMod = 1 + upgradeLevels.braking * 0.1; // +10% per level

    const effectiveTaxiSpeed = TAXI_SPEED * speedMod;
    const effectiveTurnSpeed = TAXI_TURN_SPEED * handlingMod;
    const effectiveFriction = FRICTION / brakingMod; // higher braking -> lower friction -> more deceleration
    // Clamp friction to reasonable range
    const clampedFriction = Math.max(0.8, Math.min(0.98, effectiveFriction));

    // Boost handling: active when boost key pressed, moving forward, and have fuel
    const boostActive = controls.boost && controls.forward && fuel > 0;
    // Update boost state in store (so UI and fuel logic know)
    if (boostActive !== boosting) {
      setBoosting(boostActive);
    }
    const boostFactor = boostActive ? 2.0 : 1.0;
    // Update fuel each frame (drain when boosting, regen otherwise)
    updateFuel(dt);

    // ── Drift Detection ─────────────────────────────────────────────────────
    // Calculate velocity vector in world space
    const velocity = new THREE.Vector3(
      Math.sin(rotationRef.current) * velocityRef.current,
      0,
      Math.cos(rotationRef.current) * velocityRef.current
    );

    // Get forward vector (car's facing direction)
    const forward = new THREE.Vector3(
      Math.sin(rotationRef.current),
      0,
      Math.cos(rotationRef.current)
    );

    // Normalize velocity to get direction
    const speed = velocity.length();
    let isDrifting = false;
    let driftAngle = 0;
    let lateralSpeed = 0;

    if (speed > 0.1) {
      velocity.normalize();
      // Dot product gives cosine of angle between velocity and forward direction
      const forwardDot = velocity.dot(forward);
      // Clamp to avoid numerical errors
      const clampedDot = Math.max(-1, Math.min(1, forwardDot));
      driftAngle = Math.acos(clampedDot); // 0 = straight, π/2 = fully sideways
      // Lateral speed is the component perpendicular to forward direction
      lateralSpeed = Math.sqrt(1 - clampedDot * clampedDot) * speed;

      // Adjusted drift sensitivity - easier to initiate but still skill-based
      // Reduced thresholds for more accessible drifting
      isDrifting = lateralSpeed > 2.8 && Math.abs(velocityRef.current) > 5;
    }

    // Drift scoring and combo system
    if (isDrifting) {
      // Update drift timer
      driftTimerRef.current += dt;

      // Award points based on drift quality
      if (driftTimerRef.current >= 0.1) { // Score every 100ms to avoid too frequent updates
        // Base points per second - increased for more rewarding drifting
        const basePointsPerSecond = 25;

        // Factors that increase score:
        // 1. Lateral speed (how sideways we are) - increased sensitivity
        const lateralFactor = Math.min(lateralSpeed / 6, 2); // Increased cap to 2x

        // 2. Drift angle (how sharp the drift is) - same calculation
        const angleFactor = driftAngle / (Math.PI / 2); // 0 to 1+

        // 3. Current speed (faster = more points) - increased sensitivity
        const speedFactor = Math.min(Math.abs(velocityRef.current) / 15, 2.5); // Increased cap to 2.5x

        // 4. Combo multiplier - increased max combo
        const comboFactor = Math.min(driftCombo, 8); // Increased cap to 8x

        // Calculate base points for this interval
        let points = basePointsPerSecond * dt * lateralFactor * angleFactor * speedFactor * comboFactor;

        // Perfect drift bonus: extra 50% points when at max combo (8x) for sustained time
        if (driftCombo >= 8) {
          perfectDriftTimerRef.current += dt;
          // Award bonus points after maintaining max combo for 1+ seconds
          if (perfectDriftTimerRef.current > 1.0) {
            const perfectBonus = points * 0.5; // 50% bonus
            points += perfectBonus;
            // Play perfect drift sound when bonus is awarded (but not continuously)
            if (perfectDriftTimerRef.current > 1.0 && perfectDriftTimerRef.current < 1.1) {
              playPerfectDriftSound();
            }
            // Set perfect drift active state in store
            setIsPerfectDriftActive(true);
          } else {
            // Not sustained long enough yet
            setIsPerfectDriftActive(false);
          }
        } else {
          perfectDriftTimerRef.current = 0; // Reset if not at max combo
          setIsPerfectDriftActive(false);
        }

        const pointsToAdd = Math.max(0.1, points); // Ensure we always add something when drifting

        // Add to score and update store
        driftPointsRef.current += pointsToAdd;
        if (driftPointsRef.current >= 1) {
          addDriftScore(Math.floor(driftPointsRef.current));
          driftPointsRef.current = driftPointsRef.current % 1;
        }

        // Update combo based on drift duration
        // Increase combo every 1.5 seconds of continuous drifting, up to 8x (faster buildup)
        const driftDuration = driftTimerRef.current;
        const newCombo = 1 + Math.min(Math.floor(driftDuration / 1.5), 7);
        if (newCombo !== driftCombo) {
          setDriftCombo(newCombo);
        }

        // Reset timer for next scoring interval
        driftTimerRef.current = 0;
      }

      // Mark that we're currently drifting
      if (!isDrifting) {
        setIsDrifting(true);
        lastDriftTimeRef.current = clock.getElapsedTime();

        // Play drift start sound with intensity based on drift quality
        const driftIntensity = Math.min(
          (lateralSpeed / 10) *  // 0-1+ based on lateral speed
          (driftAngle / (Math.PI / 2)) *  // 0-1+ based on angle
          (Math.abs(velocityRef.current) / 15)  // 0-1+ based on speed
        , 1.0); // Cap at 1.0
        playDriftScreech(0.5 + driftIntensity * 0.5); // Range 0.5 to 1.0
      }

      // Spawn drift particles when actively drifting
      if (isDrifting && particleClockRef.current <= 0) {
        // Spawn particles from rear wheels
        const wheelOffset = new THREE.Vector3(-0.4, -0.3, 0.8); // Rear left wheel offset
        const wheelOffset2 = new THREE.Vector3(0.4, -0.3, 0.8); // Rear right wheel offset

        // Transform wheel offsets to world space
        const wheelPos1 = new THREE.Vector3()
          .copy(wheelOffset)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationRef.current)
          .add(positionRef.current);
        const wheelPos2 = new THREE.Vector3()
          .copy(wheelOffset2)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationRef.current)
          .add(positionRef.current);

        // Enhanced particle effects based on drift performance
        const isPerfectDrift = driftCombo >= 8 && perfectDriftTimerRef.current > 1.0;
        const isHighCombo = driftCombo >= 5;

        // More particles and better properties for high performance drifting
        const baseParticlesPerWheel = 2 + Math.min(Math.floor(driftCombo / 2), 3);
        const numParticlesPerWheel = baseParticlesPerWheel + (isPerfectDrift ? 3 : isHighCombo ? 2 : 0);

        // Particle life and speed bonuses
        const lifeBase = isPerfectDrift ? 1.0 : isHighCombo ? 0.8 : 0.6; // 0.6-1.0
        const lifeVariance = isPerfectDrift ? 0.6 : isHighCombo ? 0.4 : 0.4; // 0.4-0.6
        const speedBase = isPerfectDrift ? 1.2 : isHighCombo ? 0.8 : 0.5; // 0.5-1.2
        const speedVariance = isPerfectDrift ? 0.8 : isHighCombo ? 0.5 : 0.5; // 0.5-0.8

        for (let w = 0; w < 2; w++) {
          const wheelPos = w === 0 ? wheelPos1 : wheelPos2;
          for (let p = 0; p < numParticlesPerWheel; p++) {
            // Enhanced particle properties
            const life = lifeBase + Math.random() * lifeVariance;
            const speed = speedBase + Math.random() * speedVariance;
            const angle = Math.random() * Math.PI * 2; // Random direction

            // Special colors for different drift states
            let particleColor;
            if (isPerfectDriftActive) {
              // Cyan/blueish particles for perfect drift
              particleColor = `hsl(${180 + Math.random() * 40}, ${80 + Math.random() * 20}%, ${50 + Math.random() * 30}%)`;
            } else if (isHighCombo) {
              // Yellow/orange particles for high combo
              particleColor = `hsl(${40 + Math.random() * 20}, ${80 + Math.random() * 20}%, ${40 + Math.random() * 30}%)`;
            } else {
              // Standard brownish smoke
              particleColor = `hsl(${30 + Math.random() * 20}, ${80 + Math.random() * 20}%, ${40 + Math.random() * 30}%)`;
            }

            const particle = {
              position: wheelPos.clone(),
              velocity: new THREE.Vector3(
                Math.cos(angle) * speed,
                -0.1 - Math.random() * 0.2, // Less downward drift for more floaty effect
                Math.sin(angle) * speed
              ),
              life: life,
              maxLife: life,
              color: particleColor
            };
            driftParticlesRef.current.push(particle);
          }
        }

        // Set particle spawn timer - spawn less frequently at higher speeds to avoid overcrowding
        // More frequent spawning for better visual effect during good drifts
        const baseSpawnRate = 0.05 + Math.max(0, (6 - Math.abs(velocityRef.current)) * 0.01); // 0.05-0.15 seconds
        particleClockRef.current = baseSpawnRate * (isPerfectDrift ? 0.5 : isHighCombo ? 0.7 : 1.0); // More frequent for good drifts
      }
    } else {
      // Not drifting - reset drift timer but keep combo for a short buffer
      if (isDrifting) {
        // If we were drifting but stopped, play a slightly different screech for drift end
        // Only if we were drifting for at least 0.3 seconds (to distinguish from normal turning)
        if (clock.getElapsedTime() - lastDriftTimeRef.current > 0.3) {
          // Play end screech with lower intensity
          // Recalculate intensity with current values (they're still valid from above)
          const driftIntensity = Math.min(
            (lateralSpeed / 10) * 0.5 +
            (driftAngle / (Math.PI / 2)) * 0.5 +
            (Math.abs(velocityRef.current) / 15) * 0.5
          , 0.7); // Lower intensity for drift end
          playDriftScreech(0.3 + driftIntensity * 0.4); // Range 0.3 to 0.7
        }

        // Drift streak bonus: award points for chaining drifts with minimal breaks
        const timeSinceLastDriftEnd = clock.getElapsedTime() - lastDriftEndTimeRef.current;
        if (timeSinceLastDriftEnd < 2.0 && driftTimerRef.current > 1.0) {
          // Chained drift detected - award streak bonus
          const streakBonus = Math.floor(driftTimerRef.current * 10) * driftStreakCountRef.current; // Based on duration and streak count
          if (streakBonus > 0) {
            addDriftScore(streakBonus);
            // Play streak bonus audio feedback
            playDriftStreakSound();
            // Visual feedback: briefly boost headlight intensity for streak
            // This will be handled by the existing headlight pulse logic which already responds to combo
          }
          driftStreakCountRef.current++;
        } else {
          // Reset streak if break was too long
          driftStreakCountRef.current = 1;
        }
        lastDriftEndTimeRef.current = clock.getElapsedTime();

        setIsDrifting(false);

        // Start combo decay timer - combo decays after 1.0 seconds of not drifting
        // We'll handle this in the else driftTimer logic below
      }

      // Decay combo when not drifting - slightly slower decay to reward sustained skill
      driftTimerRef.current += dt;
      if (driftTimerRef.current > 1.0 && driftCombo > 1) {
        // Gradually decrease combo
        const newCombo = Math.max(1, driftCombo - 0.3 * dt); // Slower decay
        setDriftCombo(Math.ceil(newCombo)); // Round up to avoid frequent updates
        driftTimerRef.current = 0; // Reset timer for next decay check
      }

      // Reset drift points accumulator when not drifting to avoid carrying over
      if (driftPointsRef.current > 0) {
        // Add any remaining fractional points
        if (driftPointsRef.current >= 0.5) {
          addDriftScore(1);
        }
        driftPointsRef.current = 0;
      }
    }

    // Reset drift combo if we've been not drifting for too long - increased timeout
    if (!isDrifting && driftTimerRef.current > 5.0) {
      setDriftCombo(1);
      driftTimerRef.current = 0;
    }

    // ── Drift Particle Effects ─────────────────────────────────────────────
    // Update particle clock
    particleClockRef.current -= dt;

    // Update existing particles
    for (let i = driftParticlesRef.current.length - 1; i >= 0; i--) {
      const particle = driftParticlesRef.current[i];

      // Update position
      particle.position.add(particle.velocity);

      // Apply gravity and drag
      particle.velocity.y -= 9.8 * dt * 0.3; // Reduced gravity for floaty smoke
      particle.velocity.multiplyScalar(1.0 - dt * 2.0); // Drag

      // Decrease life
      particle.life -= dt;

      // Remove dead particles
      if (particle.life <= 0) {
        driftParticlesRef.current.splice(i, 1);
      }
    }

    // ── Acceleration ──────────────────────────────────────────────────
    if (controls.forward) {
      const targetSpeed = effectiveTaxiSpeed * boostFactor;
      velocityRef.current = Math.min(velocityRef.current + effectiveTaxiSpeed * dt * accelMod * boostFactor, targetSpeed);
    } else if (controls.back) {
      velocityRef.current = Math.max(velocityRef.current - effectiveTaxiSpeed * dt * 0.8, -effectiveTaxiSpeed * 0.5);
    } else {
      velocityRef.current *= clampedFriction;
      if (Math.abs(velocityRef.current) < 0.1) velocityRef.current = 0;
    }

    // Screech on hard brake
    const isBraking = controls.back && Math.abs(velocityRef.current) > 8;
    if (isBraking && !wasBreaking.current) playScreech();
    wasBreaking.current = isBraking;

    // ── Steering ──────────────────────────────────────────────────────
    const turnDir = velocityRef.current >= 0 ? 1 : -1;
    if (controls.left)  rotationRef.current += effectiveTurnSpeed * dt * turnDir;
    if (controls.right) rotationRef.current -= effectiveTurnSpeed * dt * turnDir;

    // ── Move ──────────────────────────────────────────────────────────
    const newX = positionRef.current.x + Math.sin(rotationRef.current) * velocityRef.current * dt;
    const newZ = positionRef.current.z + Math.cos(rotationRef.current) * velocityRef.current * dt;
    const boundary = 150;
    positionRef.current.x = THREE.MathUtils.clamp(newX, -boundary, boundary);
    positionRef.current.z = THREE.MathUtils.clamp(newZ, -boundary, boundary);

    // Body lean on turns and drift
    if (bodyRef.current) {
      const speed = Math.abs(velocityRef.current);
      let leanAmount = 0;

      // Regular turning lean
      if (controls.left && speed > 2) {
        leanAmount = 0.06;
      } else if (controls.right && speed > 2) {
        leanAmount = -0.06;
      }

      // Additional drift lean (more pronounced when drifting)
      if (isDrifting) {
        // Increase lean based on drift angle and speed
        const driftLean = Math.min(driftAngle / (Math.PI / 2) * 0.15, 0.25); // Increased lean effect
        // Apply in the direction of drift
        if (controls.left) {
          leanAmount -= driftLean; // More left lean when drifting left
        } else if (controls.right) {
          leanAmount += driftLean; // More right lean when drifting right
        } else {
          // If no steering input but drifting, lean based on velocity direction
          leanAmount = Math.sin(rotationRef.current - Math.atan2(velocity.x, velocity.z)) * 0.15;
        }
      }

      bodyRef.current.rotation.z = leanAmount;
    }

    // ── Collision detection ───────────────────────────────────────────
    if (now - lastCollisionRef.current > COLLISION_COOLDOWN && Math.abs(velocityRef.current) > 2) {
      let hit = false;

      for (let ci = 0; ci < trafficWorldPositions.length; ci++) {
        const tp = trafficWorldPositions[ci];
        const dx = positionRef.current.x - tp.x;
        const dz = positionRef.current.z - tp.z;
        if (dx * dx + dz * dz < TRAFFIC_HIT_RADIUS * TRAFFIC_HIT_RADIUS) {
          applyCollisionPenalty(120);
          playCollision();
          velocityRef.current *= -0.35;
          const pushDir = new THREE.Vector3(dx === 0 && dz === 0 ? 1 : -dx, 0, -dz).normalize();
          trafficPushVelocities[ci].copy(pushDir.multiplyScalar(24));
          lastCollisionRef.current = now;
          hit = true;
          break;
        }
      }

      if (!hit) {
        for (const b of BUILDINGS) {
          const margin = b.type === "gas_station" ? 0.6 : BUILDING_MARGIN;
          const dx = Math.abs(positionRef.current.x - b.x);
          const dz = Math.abs(positionRef.current.z - b.z);
          if (dx < b.w / 2 + margin && dz < b.d / 2 + margin) {
            applyCollisionPenalty(60);
            playCollision();
            velocityRef.current *= -0.3;
            lastCollisionRef.current = now;
            break;
          }
        }
      }
    }

    // ── Apply to mesh ─────────────────────────────────────────────────
    if (meshRef.current) {
      meshRef.current.position.copy(positionRef.current);
      meshRef.current.rotation.y = rotationRef.current;
    }

    taxiPos.copy(positionRef.current);
    setTaxiRot(rotationRef.current);
    onPositionChange?.(positionRef.current.clone(), rotationRef.current);
    setTaxiVelocity(velocityRef.current);

    // ── Passenger greet sound ─────────────────────────────────────────────────
    if (!activePassenger) {
      for (const p of waitingPassengers) {
        const [gpx, , gpz] = p.position;
        if (positionRef.current.distanceTo(new THREE.Vector3(gpx, 0, gpz)) < 18
            && !greetedRef.current.has(p.id)) {
          greetedRef.current.add(p.id);
          playPassengerGreet();
        }
      }
    }

    // ── Pickup / dropoff ──────────────────────────────────────────────
    if (!activePassenger) {
      for (const p of waitingPassengers) {
        const [px, , pz] = p.position;
        if (positionRef.current.distanceTo(new THREE.Vector3(px, 0, pz)) < PICKUP_RADIUS) {
          pickupPassenger(p.id);
          break;
        }
      }
    }
    if (activePassenger) {
      const [dx, , dz] = activePassenger.destination;
      if (positionRef.current.distanceTo(new THREE.Vector3(dx, 0, dz)) < DROPOFF_RADIUS) {
        dropoffPassenger();
      }
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.6, 0]}>
      <group ref={bodyRef}>
        <primitive object={carModel} scale={CAR_SCALE} rotation={[0, Math.PI / 2, 0]} />

        {/* Headlights */}
        {[-0.5, 0.5].map((x, i) => {
          // Enhanced headlight pulsing when drifting - more intense and color-shifting
          let headlightIntensity = 22;
          let headlightColor = "#fffacd"; // Default warm white

          if (isDrifting) {
            // More intense pulsing with color shift
            let pulseSpeed = 15 + Math.min(driftCombo * 2, 10); // Faster pulse at higher combos
            let pulseAmount = 20 + Math.min(driftCombo * 3, 25); // More intense pulse

            if (isPerfectDriftActive) {
              // Special effect for perfect drift: faster pulsing and brighter
              pulseSpeed = 25; // Much faster pulse
              pulseAmount = 40; // Much more intense
            }

            headlightIntensity = 25 + Math.sin(clock.getElapsedTime() * pulseSpeed) * pulseAmount;

            // Color shifts based on state
            if (isPerfectDriftActive) {
              headlightColor = "#00ffff"; // Cyan for perfect drift bonus
            } else if (driftCombo >= 5) {
              headlightColor = "#ffeb3b"; // Yellow at high combo
            } else if (driftCombo >= 3) {
              headlightColor = "#fff9c4"; // Light yellow at medium combo
            } else {
              headlightColor = "#fffacd"; // Warm white at low combo
            }
          }

          return (
            <group key={i} position={[x, 0.5, 1.8]}>
              <pointLight intensity={headlightIntensity} distance={14} color={headlightColor} />
            </group>
          );
        })}

        {/* Passenger riding on trunk */}
        {activePassenger && (
          <group position={[0, 1.55, -1.55]} scale={1.3}>
            {/* hair */}
            <mesh position={[0, 0.70, 0]}>
              <sphereGeometry args={[0.175, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshLambertMaterial color="#2A1A0A" />
            </mesh>
            {/* head */}
            <mesh position={[0, 0.54, 0]}>
              <sphereGeometry args={[0.165, 12, 10]} />
              <meshLambertMaterial color="#FDBCB4" />
            </mesh>
            {/* neck */}
            <mesh position={[0, 0.36, 0]}>
              <capsuleGeometry args={[0.06, 0.10, 4, 7]} />
              <meshLambertMaterial color="#FDBCB4" />
            </mesh>
            {/* upper torso */}
            <mesh position={[0, 0.22, 0]}>
              <capsuleGeometry args={[0.14, 0.16, 3, 8]} />
              <meshLambertMaterial color="#E53935" />
            </mesh>
            {/* lower torso */}
            <mesh position={[0, 0.04, 0]}>
              <capsuleGeometry args={[0.11, 0.10, 3, 8]} />
              <meshLambertMaterial color="#E53935" />
            </mesh>
            {/* left arm */}
            <mesh position={[-0.20, 0.22, 0.04]} rotation={[0.4, 0, -0.65]}>
              <capsuleGeometry args={[0.048, 0.24, 3, 7]} />
              <meshLambertMaterial color="#E53935" />
            </mesh>
            {/* right arm */}
            <mesh position={[0.20, 0.22, 0.04]} rotation={[0.4, 0, 0.65]}>
              <capsuleGeometry args={[0.048, 0.24, 3, 7]} />
              <meshLambertMaterial color="#E53935" />
            </mesh>
            {/* left upper leg */}
            <mesh position={[-0.085, -0.10, 0.12]} rotation={[1.1, 0, 0]}>
              <capsuleGeometry args={[0.062, 0.20, 3, 7]} />
              <meshLambertMaterial color="#1565C0" />
            </mesh>
            {/* right upper leg */}
            <mesh position={[0.085, -0.10, 0.12]} rotation={[1.1, 0, 0]}>
              <capsuleGeometry args={[0.062, 0.20, 3, 7]} />
              <meshLambertMaterial color="#1565C0" />
            </mesh>
            {/* left lower leg */}
            <mesh position={[-0.085, -0.28, 0.24]} rotation={[-0.4, 0, 0]}>
              <capsuleGeometry args={[0.052, 0.18, 3, 7]} />
              <meshLambertMaterial color="#1565C0" />
            </mesh>
            {/* right lower leg */}
            <mesh position={[0.085, -0.28, 0.24]} rotation={[-0.4, 0, 0]}>
              <capsuleGeometry args={[0.052, 0.18, 3, 7]} />
              <meshLambertMaterial color="#1565C0" />
            </mesh>
            {/* left shoe */}
            <mesh position={[-0.085, -0.38, 0.30]}>
              <boxGeometry args={[0.10, 0.07, 0.18]} />
              <meshLambertMaterial color="#1A1A1A" />
            </mesh>
            {/* right shoe */}
            <mesh position={[0.085, -0.38, 0.30]}>
              <boxGeometry args={[0.10, 0.07, 0.18]} />
              <meshLambertMaterial color="#1A1A1A" />
            </mesh>
          </group>
        )}

      </group>
    </group>

    {/* Drift particles (smoke/trails) */}
    <group>
      {driftParticlesRef.current.map((p, index) => (
        <group key={index} position={[p.position.x, p.position.y, p.position.z]}>
          <sphereGeometry args={[0.05 + (p.life / p.maxLife) * 0.05, 4, 4]} />
          <meshLambertMaterial
            color={p.color}
            opacity={p.life / p.maxLife}
            transparent={true}
          />
        </group>
      ))}
    </group>
  );
}
