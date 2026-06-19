import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TAXI_SPAWN } from "./constants";

const CAMERA_DISTANCE = 14;
const CAMERA_HEIGHT   = 7;

interface FollowCameraProps {
  targetPosition: React.MutableRefObject<THREE.Vector3>;
  targetRotation: React.MutableRefObject<number>;
  gameState: string;
}

export default function FollowCamera({
  targetPosition,
  targetRotation,
  gameState,
}: FollowCameraProps) {
  // Initialise camera directly behind the spawn point
  const initCamPos = new THREE.Vector3(
    TAXI_SPAWN.x,
    TAXI_SPAWN.y + CAMERA_HEIGHT,
    TAXI_SPAWN.z - CAMERA_DISTANCE
  );
  const cameraPositionRef = useRef(initCamPos.clone());
  const snapNextFrame = useRef(true);

  // Snap camera instantly whenever the game transitions to "playing"
  useEffect(() => {
    if (gameState === "playing") {
      snapNextFrame.current = true;
    }
  }, [gameState]);

  useFrame(({ camera }) => {
    const pos = targetPosition.current;
    const rot = targetRotation.current;

    const desiredX = pos.x - Math.sin(rot) * CAMERA_DISTANCE;
    const desiredY = pos.y + CAMERA_HEIGHT;
    const desiredZ = pos.z - Math.cos(rot) * CAMERA_DISTANCE;
    const desired  = new THREE.Vector3(desiredX, desiredY, desiredZ);

    if (snapNextFrame.current) {
      // Hard-snap so the taxi is immediately visible
      cameraPositionRef.current.copy(desired);
      snapNextFrame.current = false;
    } else {
      // Faster lerp (0.14) for snappier Crazy Taxi feel
      cameraPositionRef.current.lerp(desired, 0.14);
    }

    camera.position.copy(cameraPositionRef.current);
    camera.lookAt(pos.x, pos.y + 1.5, pos.z);
  });

  return null;
}
