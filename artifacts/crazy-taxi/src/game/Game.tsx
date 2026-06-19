import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import City from "./City";
import Taxi from "./Taxi";
import Traffic from "./Traffic";
import PassengerMarkers from "./PassengerMarker";
import FollowCamera from "./FollowCamera";
import GameHUD from "./GameHUD";
import MiniMap from "./MiniMap";
import DirectionArrow from "./DirectionArrow";
import AudioController from "./AudioController";
import LoadingScreen from "./LoadingScreen";
import { useGameStore } from "./useGameStore";
import { TAXI_SPAWN, WEATHER_CONFIGS, SEASON_CONFIGS, WeatherType, SeasonType } from "./constants";


enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  boost = "boost",
}

const KEY_MAP = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
  { name: Controls.boost, keys: ["ShiftLeft", "ShiftRight"] },
];
function Scene({
  taxiPositionRef,
  taxiRotationRef,
}: {
  taxiPositionRef: React.MutableRefObject<THREE.Vector3>;
  taxiRotationRef: React.MutableRefObject<number>;
}) {
  const { gameState, timeOfDay, weather } = useGameStore();

  const handlePositionChange = (pos: THREE.Vector3, rotation: number) => {
    taxiPositionRef.current.copy(pos);
    taxiRotationRef.current = rotation;
  };

  // Base day-night cycle colors
  const baseDaySky = new THREE.Color("#A8D8F0");
  const baseNightSky = new THREE.Color("#0B0D20");
  const baseSkyColor = baseDaySky.clone().lerp(baseNightSky, timeOfDay);

  const baseDayFog = new THREE.Color("#A8D8F0");
  const baseNightFog = new THREE.Color("#0B0D20");
  const baseFogColor = baseDayFog.clone().lerp(baseNightFog, timeOfDay);

  const baseDayHemisphereSky = new THREE.Color("#99DDFF");
  const baseNightHemisphereSky = new THREE.Color("#000033");
  const baseDayHemisphereGround = new THREE.Color("#D4B870");
  const baseNightHemisphereGround = new THREE.Color("#000011");
  const baseHemisphereSkyColor = baseDayHemisphereSky.clone().lerp(baseNightHemisphereSky, timeOfDay);
  const baseHemisphereGroundColor = baseDayHemisphereGround.clone().lerp(baseNightHemisphereGround, timeOfDay);

  const baseDayAmbient = new THREE.Color("#FFFFFF");
  const baseNightAmbient = new THREE.Color("#222222");
  const baseAmbientColor = baseDayAmbient.clone().lerp(baseNightAmbient, timeOfDay);

  const baseDayDirect = new THREE.Color("#FFFFFF");
  const baseNightDirect = new THREE.Color("#444466");
  const baseDirectColor = baseDayDirect.clone().lerp(baseNightDirect, timeOfDay);

  const baseDayDirect2 = new THREE.Color("#CCF0FF");
  const baseNightDirect2 = new THREE.Color("#222244");
  const baseDirect2Color = baseDayDirect2.clone().lerp(baseNightDirect2, timeOfDay);

  // Apply weather color shifts
  const weatherConfig = WEATHER_CONFIGS[weather.currentWeather as keyof typeof WEATHER_CONFIGS];
  const seasonConfig = SEASON_CONFIGS[weather.currentSeason as keyof typeof SEASON_CONFIGS];

  // Combine weather and seasonal color shifts
  const combinedColorShift = {
    r: (weatherConfig.colorShift.r || 0) + (seasonConfig.colorShift.r || 0),
    g: (weatherConfig.colorShift.g || 0) + (seasonConfig.colorShift.g || 0),
    b: (weatherConfig.colorShift.b || 0) + (seasonConfig.colorShift.b || 0)
  };

  // Apply color shifts to all colors
  const skyColor = baseSkyColor.clone();
  skyColor.r += combinedColorShift.r;
  skyColor.g += combinedColorShift.g;
  skyColor.b += combinedColorShift.b;

  const fogColor = baseFogColor.clone();
  fogColor.r += combinedColorShift.r;
  fogColor.g += combinedColorShift.g;
  fogColor.b += combinedColorShift.b;

  const hemisphereSkyColor = baseHemisphereSkyColor.clone();
  hemisphereSkyColor.r += combinedColorShift.r;
  hemisphereSkyColor.g += combinedColorShift.g;
  hemisphereSkyColor.b += combinedColorShift.b;

  const hemisphereGroundColor = baseHemisphereGroundColor.clone();
  hemisphereGroundColor.r += combinedColorShift.r;
  hemisphereGroundColor.g += combinedColorShift.g;
  hemisphereGroundColor.b += combinedColorShift.b;

  const ambientColor = baseAmbientColor.clone();
  ambientColor.r += combinedColorShift.r;
  ambientColor.g += combinedColorShift.g;
  ambientColor.b += combinedColorShift.b;

  const directColor = baseDirectColor.clone();
  directColor.r += combinedColorShift.r;
  directColor.g += combinedColorShift.g;
  directColor.b += combinedColorShift.b;

  const direct2Color = baseDirect2Color.clone();
  direct2Color.r += combinedColorShift.r;
  direct2Color.g += combinedColorShift.g;
  direct2Color.b += combinedColorShift.b;

  // Adjust fog density based on weather visibility
  const baseFogNear = 200;
  const baseFogFar = 520;
  const weatherFogNear = baseFogNear * (weatherConfig.visibilityModifier || 1.0);
  const weatherFogFar = baseFogFar * (weatherConfig.visibilityModifier || 1.0);

    return (
    <>
      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[500, 16, 16]} />
        <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
      </mesh>

      {/* Dynamic lighting based on time of day and weather */}
      <directionalLight
        position={[80, 200, 60]}
        intensity={5.0}
        color={directColor}
      />
      <hemisphereLight args={[hemisphereSkyColor, hemisphereGroundColor, 1.6]} />
      <ambientLight intensity={0.75} color={ambientColor} />
      <directionalLight position={[0, 10, 0]} intensity={0.5} color={direct2Color} />

      {/* Fog adjusted for weather visibility */}
      <fog attach="fog" args={[fogColor, weatherFogNear, weatherFogFar]} />

      <City />
      <Traffic />
      <PassengerMarkers />
      {/* Weather effects (particles) */}
      {weather.particleEnabled && (
        <WeatherEffects
          weatherType={weather.currentWeather as WeatherType}
          intensity={1.0}
        />
      )}

      {gameState !== "menu" && (
        <Taxi onPositionChange={handlePositionChange} />
      )}

      <FollowCamera
        targetPosition={taxiPositionRef}
        targetRotation={taxiRotationRef}
        gameState={gameState}
      />
      {gameState === "playing" && (
        <DirectionArrow
          taxiPosition={taxiPositionRef}
          taxiRotation={taxiRotationRef}
        />
      )}
    </>
  );

// Weather effects component for particle systems
function WeatherEffects({
  weatherType,
  intensity = 1.0
}: {
  weatherType: WeatherType;
  intensity?: number;
}) {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (particlesRef.current) {
      // Rotate particle systems slightly for dynamic effect
      particlesRef.current.rotation.y += 0.001 * intensity;
    }
  });

  // Create particle geometry based on weather type
  let particleCount = 0;
  let positions: number[] = [];
  let colors: number[] = [];
  let sizes: number[] = [];

  // Define particle properties based on weather type
  switch (weatherType) {
    case "rainy":
      particleCount = Math.floor(1500 * intensity);
      // Create vertical lines for rain
      for (let i = 0; i < particleCount; i++) {
        // Position in a volume around the camera
        const x = (Math.random() - 0.5) * 400;
        const y = Math.random() * 200;
        const z = (Math.random() - 0.5) * 400;

        positions.push(x, y, z);

        // Light blue color for rain
        colors.push(0.6, 0.8, 1.0);

        // Size for rain particles (will be stretched in shader)
        sizes.push(Math.random() * 1.5 * intensity + 0.5);
      }
      break;

    case "snowy":
      particleCount = Math.floor(1000 * intensity);
      // Create snowflakes
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = Math.random() * 200;
        const z = (Math.random() - 0.5) * 400;

        positions.push(x, y, z);

        // White color for snow
        colors.push(0.9, 0.9, 1.0);

        // Size for snowflakes
        sizes.push(Math.random() * 2.0 * intensity + 0.5);
      }
      break;

    case "foggy":
      particleCount = Math.floor(800 * intensity);
      // Create fog particles
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 300;
        const y = Math.random() * 100;
        const z = (Math.random() - 0.5) * 300;

        positions.push(x, y, z);

        // Gray color for fog
        colors.push(0.7, 0.7, 0.8);

        // Size for fog particles
        sizes.push(Math.random() * 3.0 * intensity + 1.0);
      }
      break;

    case "stormy":
      particleCount = Math.floor(2000 * intensity);
      // Create heavy rain with some variation for storm
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = Math.random() * 200;
        const z = (Math.random() - 0.5) * 400;

        positions.push(x, y, z);

        // Darker blue for stormy rain
        colors.push(0.4, 0.6, 0.9);

        // Size for storm particles
        sizes.push(Math.random() * 2.0 * intensity + 0.5);
      }
      break;

    default:
      // Clear, cloudy, etc. - no particles
      return null;
  }

  if (particleCount === 0) return null;

  // Create buffer geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  // Create material for particles
  const material = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(geometry, material);
  particlesRef.current = particles;
}

// Weather effects component for particle systems
function WeatherEffects({
  weatherType,
  intensity = 1.0
}: {
  weatherType: WeatherType;
  intensity?: number;
}) {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (particlesRef.current) {
      // Rotate particle systems slightly for dynamic effect
      particlesRef.current.rotation.y += 0.001 * intensity;
    }
  });

  // Create particle geometry based on weather type
  let particleCount = 0;
  let positions: number[] = [];
  let colors: number[] = [];
  let sizes: number[] = [];

  // Define particle properties based on weather type
  switch (weatherType) {
    case "rainy":
      particleCount = Math.floor(1500 * intensity);
      // Create vertical lines for rain
      for (let i = 0; i < particleCount; i++) {
        // Position in a volume around the camera
        const x = (Math.random() - 0.5) * 400;
        const y = Math.random() * 200;
        const z = (Math.random() - 0.5) * 400;

        positions.push(x, y, z);

        // Light blue color for rain
        colors.push(0.6, 0.8, 1.0);

        // Size for rain particles (will be stretched in shader)
        sizes.push(Math.random() * 1.5 * intensity + 0.5);
      }
      break;

    case "snowy":
      particleCount = Math.floor(1000 * intensity);
      // Create snowflakes
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = Math.random() * 200;
        const z = (Math.random() - 0.5) * 400;

        positions.push(x, y, z);

        // White color for snow
        colors.push(0.9, 0.9, 1.0);

        // Size for snowflakes
        sizes.push(Math.random() * 2.0 * intensity + 0.5);
      }
      break;

    case "foggy":
      particleCount = Math.floor(800 * intensity);
      // Create fog particles
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 300;
        const y = Math.random() * 100;
        const z = (Math.random() - 0.5) * 300;

        positions.push(x, y, z);

        // Gray color for fog
        colors.push(0.7, 0.7, 0.8);

        // Size for fog particles
        sizes.push(Math.random() * 3.0 * intensity + 1.0);
      }
      break;

    case "stormy":
      particleCount = Math.floor(2000 * intensity);
      // Create heavy rain with some variation for storm
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = Math.random() * 200;
        const z = (Math.random() - 0.5) * 400;

        positions.push(x, y, z);

        // Darker blue for stormy rain
        colors.push(0.4, 0.6, 0.9);

        // Size for storm particles
        sizes.push(Math.random() * 2.0 * intensity + 0.5);
      }
      break;

    default:
      // Clear, cloudy, etc. - no particles
      return null;
  }

  if (particleCount === 0) return null;

  // Create buffer geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  // Create material for particles
  const material = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(geometry, material);
  particlesRef.current = particles;

  return <primitive object={particles} />;
}

export default function Game() {
  const taxiPositionRef = useRef(TAXI_SPAWN.clone());
  const taxiRotationRef = useRef(0);

  return (
    <>
      <div style={{ width: "100vw", height: "100vh", background: "#0a1520", overflow: "hidden" }}>
        <KeyboardControls map={KEY_MAP}>
          <Canvas
            camera={{ position: [0, 8, -14], fov: 65, near: 0.5, far: 600 }}
            gl={{ antialias: true }}
            style={{ width: "100%", height: "100%" }}
          >
            <Suspense fallback={null}>
              <Scene
                taxiPositionRef={taxiPositionRef}
                taxiRotationRef={taxiRotationRef}
              />
            </Suspense>
          </Canvas>
          <LoadingScreen />
          <GameHUD />
          <MiniMap
            taxiPosition={taxiPositionRef}
            taxiRotation={taxiRotationRef}
          />
        </KeyboardControls>
      </div>
    </>
  );
};
