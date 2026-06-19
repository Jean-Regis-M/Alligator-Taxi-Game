import { Suspense, useMemo } from "react";
import { useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ROAD_WIDTH, BLOCK_SIZE, CITY_SIZE, getRoadXPositions, getBlockCenters } from "./constants";
import { getBuildings, type BuildingData } from "./buildingData";


// ── PARKED VEHICLE MODELS ─────────────────────────────────────────────────────
const PARKED_CAR_MODELS: string[] = [];

// ── GLB BUILDINGS ─────────────────────────────────────────────────────────────
useGLTF.preload("/models/game_ready_mid_poly_building.glb");
useGLTF.preload("/models/game_ready_building_5.glb");
useGLTF.preload("/models/game_ready_city_buildings.glb");
useGLTF.preload("/models/game_ready_mid_poly_building_2.glb");
useGLTF.preload("/models/chicago_b2.glb");
useGLTF.preload("/models/bayard_building_opt.glb");

function GLBBuilding({ path, scale, yOffset = 0, xOffset = 0, zOffset = 0, rot = 0 }: { path: string; scale: number; yOffset?: number; xOffset?: number; zOffset?: number; rot?: number }) {
  const { scene } = useGLTF(path);
  const centered = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => { obj.castShadow = true; obj.receiveShadow = true; });
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    clone.position.set(-scale * cx + xOffset, -scale * box.min.y + yOffset, -scale * cz + zOffset);
    return clone;
  }, [scene, scale, yOffset, xOffset, zOffset]);
  return <primitive object={centered} scale={scale} rotation={[0, rot, 0]} />;
}


// Muted tones matching the beach / building palette
const PC_COLORS = [
  "#C4B4A4","#8898A8","#A8B49A","#B4A490",
  "#98AAB4","#C2BAA8","#A49898","#B0B8A8",
  "#A8A8B8","#BEB4A0",
];

function recolorGlb(scene: THREE.Object3D, bodyColor: string): THREE.Object3D {
  const clone = scene.clone(true);
  clone.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const applyToMat = (mat: THREE.Material): THREE.Material => {
      if (!("color" in mat)) return mat;
      const name = (mat.name ?? "").toLowerCase();
      if (
        name.includes("window") || name.includes("glass") ||
        name.includes("wheel")  || name.includes("rubber") ||
        name.includes("tire")   || name.includes("black")  ||
        name.includes("dark")   || name.includes("light")
      ) return mat;
      const m = (mat as THREE.MeshStandardMaterial).clone();
      (m as THREE.MeshStandardMaterial).color.set(bodyColor);
      return m;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(applyToMat)
      : applyToMat(mesh.material);
    
  });
  return clone;
}

// ── ALL BUILDING TEXTURES ─────────────────────────────────────────────────────
const ALL_TEX = {
  // walls
  brick_sand:  "/models/wall_brick_small_sand.png",
  brick_stone: "/models/wall_brick_stone_center.png",
  stone:       "/models/wall_stone.png",
  timber_wall: "/models/wall_timber.png",
  sand_center: "/models/wall_brick_sand_center.png",
  // windows
  win_square:  "/models/window_square_pane.png",
  win_divided: "/models/window_square_divided.png",
  win_lit:     "/models/window_square_divided_lit.png",
  win_tall:    "/models/window_tall_divided.png",
  // doors
  door_wood:   "/models/door_wood.png",
  door_metal:  "/models/door_metal_frame.png",
  // roofs
  roof_red:    "/models/roof_clay_red_center.png",
  roof_grey:   "/models/roof_clay_grey_center.png",
  // sidewalk / floor
  floor_tiles: "/models/floor_tiles_tan_small.png",
  floor_tiles_blue: "/models/floor_tiles_blue_small.png",
  floor_stone: "/models/floor_stone.png",
  // timber panels
  timber_clay: "/models/timber_square_clay.png",
} as const;
type TexKey = keyof typeof ALL_TEX;
Object.values(ALL_TEX).forEach(url => useTexture.preload(url));

function useTiledTex(key: TexKey, rx: number, ry: number): THREE.Texture {
  const base = useTexture(ALL_TEX[key]);
  return useMemo(() => {
    const t = base.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    return t;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);
}
function useBuildingWall(key: TexKey, bw: number, bh: number) {
  return useTiledTex(key, Math.max(1, Math.round(bw / 4)), Math.max(1, Math.round(bh / 3)));
}
function useBuildingRoof(key: TexKey, bw: number, bd: number) {
  return useTiledTex(key, Math.max(1, Math.round(bw / 3)), Math.max(1, Math.round(bd / 3)));
}

function createArrowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 128);
  ctx.fillStyle = "#F0EBE0";
  ctx.fillRect(22, 50, 20, 60);
  ctx.beginPath();
  ctx.moveTo(32, 8); ctx.lineTo(6, 52); ctx.lineTo(58, 52);
  ctx.closePath();
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}
let _arrowTex: THREE.CanvasTexture | null = null;
function getArrowTexture(): THREE.CanvasTexture {
  if (!_arrowTex) _arrowTex = createArrowTexture();
  return _arrowTex;
}


function createCasinoSignTex(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#2A1848";
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = "#6EFFC6"; ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, 496, 240);
  ctx.shadowColor = "#6EFFC6"; ctx.shadowBlur = 18;
  ctx.fillStyle = "#6EFFC6";
  ctx.font = "bold 108px Impact, Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GATOR", 256, 115);
  ctx.shadowColor = "#F0EBE0"; ctx.shadowBlur = 12;
  ctx.fillStyle = "#F0EBE0";
  ctx.font = "bold 88px Impact, Arial Black, sans-serif";
  ctx.fillText("CASINO", 256, 228);
  const t = new THREE.CanvasTexture(c);
  return t;
}
let _casinoTex: THREE.CanvasTexture | null = null;
function getCasinoSignTex() {
  if (!_casinoTex) _casinoTex = createCasinoSignTex();
  return _casinoTex;
}

function createGasGoTex(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 200;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#C94D46";
  ctx.fillRect(0, 0, 256, 130);
  ctx.fillStyle = "#EEE8DC";
  ctx.fillRect(0, 130, 256, 70);
  ctx.fillStyle = "#F0EBE0";
  ctx.font = "bold 72px Impact, Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Gas:GO", 128, 96);
  ctx.fillStyle = "#3A3430";
  ctx.font = "17px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("REGULAR   3.49", 12, 152);
  ctx.fillText("PLUS      3.79", 12, 170);
  ctx.fillText("PREMIUM   4.09", 12, 188);
  const t = new THREE.CanvasTexture(c);
  return t;
}
let _gasGoTex: THREE.CanvasTexture | null = null;
function getGasGoTex() {
  if (!_gasGoTex) _gasGoTex = createGasGoTex();
  return _gasGoTex;
}

function createSidewalkTex(): THREE.CanvasTexture {
  const SIZE = 512, TILES = 4, TILE = SIZE / TILES, GROUT = 5;
  const c = document.createElement("canvas");
  c.width = SIZE; c.height = SIZE;
  const ctx = c.getContext("2d")!;
  // Grout background
  ctx.fillStyle = "#7A7672";
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let row = 0; row < TILES; row++) {
    for (let col = 0; col < TILES; col++) {
      const light = (row + col) % 2 === 0;
      const x = col * TILE + GROUT, y = row * TILE + GROUT;
      const w = TILE - GROUT * 2, h = TILE - GROUT * 2;
      // Base slab color
      ctx.fillStyle = light ? "#CBC5BF" : "#B2ACA6";
      ctx.fillRect(x, y, w, h);
      // Top-left highlight → bottom-right shadow to fake depth
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, "rgba(255,255,255,0.10)");
      grad.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  return t;
}
let _sidewalkTex: THREE.CanvasTexture | null = null;
function getSidewalkTex(): THREE.CanvasTexture {
  if (!_sidewalkTex) _sidewalkTex = createSidewalkTex();
  return _sidewalkTex;
}

function createFreshGatorTex(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0E3818";
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = "#4E8F55"; ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 308);
  ctx.fillStyle = "#4E8F55";
  ctx.font = "bold 58px Impact, Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FRESH", 128, 80);
  ctx.fillStyle = "#D8B840";
  ctx.font = "bold 62px Impact, Arial Black, sans-serif";
  ctx.fillText("GATOR", 128, 160);
  ctx.fillStyle = "#F0EBE0";
  ctx.font = "bold 66px Impact, Arial Black, sans-serif";
  ctx.fillText("BITES!", 128, 250);
  const t = new THREE.CanvasTexture(c);
  return t;
}
let _freshGatorTex: THREE.CanvasTexture | null = null;
function getFreshGatorTex() {
  if (!_freshGatorTex) _freshGatorTex = createFreshGatorTex();
  return _freshGatorTex;
}

// ── GRAFFITI TEXTURES ─────────────────────────────────────────────────────────

function _makeGraffitiCanvas(W: number, H: number) {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  return { c, ctx: c.getContext("2d")! };
}

function _outlineText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, stroke: string) {
  ctx.font = `900 ${size}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = size * 0.15;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

// 1 — "GATOR" lime green bubble
function _makeGraffitiGator(): THREE.CanvasTexture {
  const { c, ctx } = _makeGraffitiCanvas(256, 128);
  ctx.clearRect(0, 0, 256, 128);
  _outlineText(ctx, "GATOR", 128, 55, 72, "#A8FF00", "#1A3A00");
  // drips
  ctx.fillStyle = "#A8FF00";
  [[50,80],[90,85],[140,82],[190,78],[220,83]].forEach(([dx,dy]) => {
    ctx.beginPath(); ctx.ellipse(dx, dy, 4, 12, 0, 0, Math.PI*2); ctx.fill();
  });
  _outlineText(ctx, "ZONE", 128, 108, 34, "#CCFF44", "#1A3A00");
  return new THREE.CanvasTexture(c);
}

// 2 — "TAXI" hot pink
function _makeGraffitiTaxi(): THREE.CanvasTexture {
  const { c, ctx } = _makeGraffitiCanvas(256, 128);
  ctx.clearRect(0, 0, 256, 128);
  // Wild background splat
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#FF00AA";
  ctx.beginPath(); ctx.arc(128, 64, 75, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  _outlineText(ctx, "TAXI", 128, 64, 88, "#FF44CC", "#330022");
  // Stars
  [[30,20],[220,18],[240,95],[18,90]].forEach(([sx,sy]) => {
    ctx.fillStyle = "#FF88EE"; ctx.font = "bold 18px Arial";
    ctx.textAlign = "center"; ctx.fillText("★", sx, sy);
  });
  return new THREE.CanvasTexture(c);
}

// 3 — Lightning bolt
function _makeGraffitiLightning(): THREE.CanvasTexture {
  const { c, ctx } = _makeGraffitiCanvas(128, 256);
  ctx.clearRect(0, 0, 128, 256);
  ctx.shadowColor = "#FFEE00"; ctx.shadowBlur = 16;
  ctx.fillStyle = "#FFEE00";
  ctx.beginPath();
  ctx.moveTo(85,5); ctx.lineTo(30,120); ctx.lineTo(68,120);
  ctx.lineTo(42,252); ctx.lineTo(100,118); ctx.lineTo(60,118);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#FF8800"; ctx.lineWidth = 3;
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

// 4 — "WILD" orange bubble
function _makeGraffitiWild(): THREE.CanvasTexture {
  const { c, ctx } = _makeGraffitiCanvas(256, 128);
  ctx.clearRect(0, 0, 256, 128);
  _outlineText(ctx, "WILD", 128, 54, 80, "#FF8800", "#3A1400");
  ctx.fillStyle = "#FF8800";
  [[60,82],[100,88],[155,84],[195,79]].forEach(([dx,dy]) => {
    ctx.beginPath(); ctx.ellipse(dx, dy, 5, 13, 0.2, 0, Math.PI*2); ctx.fill();
  });
  _outlineText(ctx, "STYLE", 128, 108, 28, "#FFAA44", "#3A1400");
  return new THREE.CanvasTexture(c);
}

// 5 — Crown + stars (gold)
function _makeGraffitiCrown(): THREE.CanvasTexture {
  const { c, ctx } = _makeGraffitiCanvas(256, 256);
  ctx.clearRect(0, 0, 256, 256);
  ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 20;
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#8B5E00"; ctx.lineWidth = 6;
  // Crown body
  ctx.beginPath();
  ctx.moveTo(20,200); ctx.lineTo(20,100); ctx.lineTo(60,150); ctx.lineTo(128,60);
  ctx.lineTo(196,150); ctx.lineTo(236,100); ctx.lineTo(236,200); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Gems
  [[60,180],[128,180],[196,180]].forEach(([gx,gy]) => {
    ctx.fillStyle="#FF4488"; ctx.beginPath(); ctx.arc(gx,gy,10,0,Math.PI*2); ctx.fill();
  });
  ctx.shadowBlur = 0;
  _outlineText(ctx, "★ KING ★", 128, 232, 30, "#FFD700", "#5A3A00");
  return new THREE.CanvasTexture(c);
}

// 6 — "RUSH" with speed lines
function _makeGraffitiRush(): THREE.CanvasTexture {
  const { c, ctx } = _makeGraffitiCanvas(256, 128);
  ctx.clearRect(0, 0, 256, 128);
  // Speed lines (left side)
  ctx.strokeStyle = "#FF4400";
  [20,35,50,65,80].forEach((y, i) => {
    ctx.globalAlpha = 0.3 + i*0.1;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(60, y); ctx.stroke();
  });
  ctx.globalAlpha = 1;
  _outlineText(ctx, "RUSH", 128, 55, 74, "#FF4400", "#1A0800");
  ctx.fillStyle = "#FF8844";
  [[40,82],[70,90],[120,86],[170,80]].forEach(([dx,dy]) => {
    ctx.beginPath(); ctx.ellipse(dx, dy, 4, 11, -0.2, 0, Math.PI*2); ctx.fill();
  });
  return new THREE.CanvasTexture(c);
}

const GRAFFITI_TEXTURES: THREE.CanvasTexture[] = [];
function getGraffitiTex(i: number): THREE.CanvasTexture {
  if (GRAFFITI_TEXTURES.length === 0) {
    GRAFFITI_TEXTURES.push(
      _makeGraffitiGator(),
      _makeGraffitiTaxi(),
      _makeGraffitiLightning(),
      _makeGraffitiWild(),
      _makeGraffitiCrown(),
      _makeGraffitiRush(),
    );
  }
  return GRAFFITI_TEXTURES[i % GRAFFITI_TEXTURES.length];
}

interface GraffitiInfo {
  x: number; y: number; z: number;
  rotY: number;
  w: number; h: number;
  texIdx: number;
}

function useGraffitiData(buildings: BuildingData[]): GraffitiInfo[] {
  return useMemo(() => {
    let s = 31337;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const list: GraffitiInfo[] = [];

    buildings.forEach((b) => {
      // Each face has ~18% chance of graffiti
      const faces: Array<{ x: number; z: number; rotY: number; maxW: number }> = [
        { x: b.x,          z: b.z + b.d / 2 + 0.06, rotY: 0,             maxW: b.w },
        { x: b.x,          z: b.z - b.d / 2 - 0.06, rotY: Math.PI,       maxW: b.w },
        { x: b.x + b.w/2 + 0.06, z: b.z,            rotY: Math.PI / 2,   maxW: b.d },
        { x: b.x - b.w/2 - 0.06, z: b.z,            rotY: -Math.PI / 2,  maxW: b.d },
      ];
      faces.forEach((f) => {
        if (rand() > 0.18) return;
        const texIdx = Math.floor(rand() * 6);
        // Width is 30-60% of wall width, but cap at 6 units max
        const w = Math.min(f.maxW * (0.30 + rand() * 0.30), 6.5);
        const h = w * (texIdx === 2 || texIdx === 4 ? 1.6 : 0.55);
        const yPos = 1.5 + rand() * 1.8 + h / 2;
        list.push({ x: f.x, y: yPos, z: f.z, rotY: f.rotY, w, h, texIdx });
      });
    });
    return list;
  }, [buildings]);
}

function GraffitiDecals({ buildings }: { buildings: BuildingData[] }) {
  const decals = useGraffitiData(buildings);
  return (
    <>
      {decals.map((d, i) => (
        <mesh key={`grf-${i}`} position={[d.x, d.y, d.z]} rotation={[0, d.rotY, 0]}>
          <planeGeometry args={[d.w, d.h]} />
          <meshBasicMaterial
            map={getGraffitiTex(d.texIdx)}
            transparent
            alphaTest={0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ── BUILDING SIGN & AWNING TEXTURES ───────────────────────────────────────────

function _makeSignTex(label: string, sub: string, bg: string, fg: string): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 512; c.height = 148;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 148);
  ctx.strokeStyle = fg; ctx.lineWidth = 5; ctx.strokeRect(5, 5, 502, 138);
  ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (sub) {
    ctx.font = "bold 60px Impact, Arial Black, sans-serif"; ctx.fillText(label, 256, 52);
    ctx.globalAlpha = 0.7;
    ctx.font = "bold 38px Impact, Arial Black, sans-serif"; ctx.fillText(sub, 256, 112);
    ctx.globalAlpha = 1;
  } else {
    ctx.font = "bold 72px Impact, Arial Black, sans-serif"; ctx.fillText(label, 256, 74);
  }
  return new THREE.CanvasTexture(c);
}
let _signCache: Map<string, THREE.CanvasTexture> | null = null;
function getSignTex(type: string): THREE.CanvasTexture {
  if (!_signCache) {
    _signCache = new Map([
      ["fastfood",    _makeSignTex("BURT'S EATS",  "GATOR GRILL",  "#1A0E0A", "#D8B040")],
      ["hotel",       _makeSignTex("PALM HOTEL",   "SUITES & SPA", "#120818", "#C8B8F0")],
      ["mall",        _makeSignTex("CITY MALL",    "OPEN DAILY",   "#101828", "#88CCFF")],
      ["gas_station", _makeSignTex("GAS:GO",       "FULL SERVICE", "#1A0808", "#FF9988")],
      ["arcade",      _makeSignTex("GAME ZONE",    "PLAY TO WIN",  "#100808", "#7BFFEA")],
      ["office",      _makeSignTex("PLAZA CORP",   "",             "#080E18", "#88AAFF")],
      ["apartment",   _makeSignTex("THE PALMS",    "RESIDENCES",   "#180810", "#FFB8CC")],
      ["skyscraper",  _makeSignTex("METRO TOWER",  "",             "#080810", "#A8C8FF")],
      ["diner",       _makeSignTex("THE DINER",    "OPEN 24/7",    "#14080C", "#FFD0A8")],
      ["church",      _makeSignTex("FIRST CHURCH", "OF BAYOU",     "#181410", "#D8C8A0")],
    ]);
  }
  return _signCache!.get(type) ?? _signCache!.get("office")!;
}

// Striped awning texture — red/cream alternating columns
let _awningTex: THREE.CanvasTexture | null = null;
function getAwningTex(): THREE.CanvasTexture {
  if (_awningTex) return _awningTex;
  const c = document.createElement("canvas"); c.width = 256; c.height = 64;
  const ctx = c.getContext("2d")!;
  const sw = 18;
  for (let i = 0; i * sw < 256; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#EEE8DC" : "#C94D46";
    ctx.fillRect(i * sw, 0, sw, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  _awningTex = t;
  return t;
}


// ── STREET FLYER TEXTURES ─────────────────────────────────────────────────────

function _makeFlyerTex(
  title: string, sub: string,
  bg: string, tc: string, sc: string
): THREE.CanvasTexture {
  const W = 128, H = 192;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H * 0.33); ctx.lineTo(W, H * 0.33); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H * 0.66); ctx.lineTo(W, H * 0.66); ctx.stroke();
  ctx.strokeStyle = tc;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.fillStyle = tc;
  ctx.textAlign = "center";
  ctx.font = "bold 26px Impact, Arial Black, sans-serif";
  ctx.fillText(title, W / 2, H * 0.28);
  ctx.fillStyle = sc;
  ctx.font = "13px Arial, sans-serif";
  const words = sub.split(" ");
  let line = "", y = H * 0.50;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > W - 16 && line) {
      ctx.fillText(line.trim(), W / 2, y); line = word + " "; y += 18;
    } else { line = test; }
  }
  if (line.trim()) ctx.fillText(line.trim(), W / 2, y);
  return new THREE.CanvasTexture(c);
}

const FLYER_DEFS = [
  { title: "SALE!",        sub: "50% OFF EVERYTHING TODAY ONLY",         bg: "#C8E8C0", tc: "#1A4A10", sc: "#2A3A22" },
  { title: "LOST CAT",     sub: "FLUFFY ORANGE TABBY CALL 555-0104",     bg: "#B8DDB0", tc: "#144010", sc: "#283820" },
  { title: "BAND TONIGHT", sub: "THE GATOR KINGS LIVE 9PM NO COVER",     bg: "#D0EEC8", tc: "#0E4A18", sc: "#224030" },
  { title: "TAXI ZONE",    sub: "PICK-UP DROP-OFF ONLY NO PARKING",      bg: "#A8D8A0", tc: "#1A5010", sc: "#2A3A22" },
  { title: "2 FOR 1",      sub: "PIZZA TUESDAYS AT GATOR EATS",          bg: "#BCE8B4", tc: "#124808", sc: "#243A1A" },
  { title: "WANTED",       sub: "TAXI DRIVER CRAZY CAB CO APPLY INSIDE", bg: "#C4EAB8", tc: "#165210", sc: "#283C20" },
  { title: "OPEN!",        sub: "GRAND OPENING SATURDAY ALL WELCOME",    bg: "#AADCA0", tc: "#0A4010", sc: "#203018" },
  { title: "FREE!",        sub: "WITH ANY PURCHASE WHILE SUPPLIES LAST", bg: "#D4F0CC", tc: "#185A14", sc: "#2C4224" },
];

let _flyerTexCache: THREE.CanvasTexture[] | null = null;
function getFlyerTex(i: number): THREE.CanvasTexture {
  if (!_flyerTexCache) {
    _flyerTexCache = FLYER_DEFS.map(d => _makeFlyerTex(d.title, d.sub, d.bg, d.tc, d.sc));
  }
  return _flyerTexCache[i % _flyerTexCache.length];
}

interface FlyerData { x: number; z: number; rotY: number; texIdx: number; sc: number; }

function useStreetFlyerData(): FlyerData[] {
  return useMemo(() => {
    const rand = makeRand(77777);
    const roads = getRoadXPositions();
    const margin = ROAD_WIDTH / 2 + 1.5;
    const flyers: FlyerData[] = [];
    for (let i = 0; i < 220; i++) {
      const x     = (rand() - 0.5) * (CITY_SIZE * BLOCK_SIZE) * 0.88;
      const z     = (rand() - 0.5) * (CITY_SIZE * BLOCK_SIZE) * 0.88;
      const rotY  = rand() * Math.PI * 2;
      const texIdx = Math.floor(rand() * FLYER_DEFS.length);
      const sc    = 0.5 + rand() * 0.35;
      if (roads.some(r => Math.abs(x - r) < margin) || roads.some(r => Math.abs(z - r) < margin)) continue;
      if (flyers.length < 110) flyers.push({ x, z, rotY, texIdx, sc });
    }
    return flyers;
  }, []);
}

function StreetFlyers() {
  const flyers = useStreetFlyerData();
  return (
    <>
      {flyers.map((f, i) => (
        <mesh key={`fly-${i}`} position={[f.x, 0.022, f.z]} rotation={[-Math.PI / 2, 0, f.rotY]}>
          <planeGeometry args={[f.sc * 0.6, f.sc * 0.9]} />
          <meshBasicMaterial
            map={getFlyerTex(f.texIdx)}
            transparent
            alphaTest={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}


const HALF_CITY = (CITY_SIZE * BLOCK_SIZE) / 2;


function makeRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ── PALM TREE ─────────────────────────────────────────────────────────────────
function PalmTree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.8, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.31, 5.6, 7]} />
        <meshLambertMaterial color="#8B6838" />
      </mesh>
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={i}
            position={[Math.sin(rad) * 1.5, 5.8, Math.cos(rad) * 1.5]}
            rotation={[Math.PI / 3.5 * Math.cos(rad + 0.3), rad, Math.PI / 3.5 * Math.sin(rad + 0.3)]}
           >
            <coneGeometry args={[0.13, 2.6, 4]} />
            <meshLambertMaterial color={i % 2 === 0 ? "#5D9B62" : "#4D8952"} />
          </mesh>
        );
      })}
      <mesh position={[0, 5.8, 0]}>
        <sphereGeometry args={[0.55, 6, 5]} />
        <meshLambertMaterial color="#3A7248" />
      </mesh>
    </group>
  );
}

// ── TRAFFIC LIGHT ─────────────────────────────────────────────────────────────
function TrafficLight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Slim tapered pole */}
      <mesh position={[0, 2.9, 0]}>
        <cylinderGeometry args={[0.055, 0.085, 5.8, 5]} />
        <meshLambertMaterial color="#2A2C34" />
      </mesh>
      {/* Horizontal arm — clean L-shape, no diagonal */}
      <mesh position={[0.65, 5.85, 0]}>
        <boxGeometry args={[1.3, 0.1, 0.1]} />
        <meshLambertMaterial color="#2A2C34" />
      </mesh>
      {/* Compact signal housing */}
      <mesh position={[1.28, 5.55, 0]}>
        <boxGeometry args={[0.34, 1.08, 0.28]} />
        <meshLambertMaterial color="#18191E" />
      </mesh>
      {/* Visor cap */}
      <mesh position={[1.28, 6.12, 0.16]}>
        <boxGeometry args={[0.34, 0.07, 0.18]} />
        <meshLambertMaterial color="#18191E" />
      </mesh>
      {/* Three signal bulbs */}
      {([ ["#C94D46", 0.34], ["#D48030", 0], ["#48A858", -0.34] ] as [string, number][]).map(([c, oy], i) => (
        <mesh key={i} position={[1.28, 5.55 + oy, 0.15]}>
          <sphereGeometry args={[0.1, 7, 7]} />
          <meshBasicMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

// ── BILLBOARD ─────────────────────────────────────────────────────────────────
const BB_COLORS = ["#C94D46","#C76A4A","#C8A040","#4E8F55","#5A6FA8","#8B5FBF","#D96C8A","#C87848"];
const BB_FG     = ["#F0EBE0","#F0EBE0","#1C1E24","#F0EBE0","#F0EBE0","#F0EBE0","#F0EBE0","#F0EBE0"];

function Billboard({ x, z, rot = 0, ci = 0 }: { x: number; z: number; rot?: number; ci?: number }) {
  const bg = BB_COLORS[ci % BB_COLORS.length];
  const fg = BB_FG[ci % BB_FG.length];
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 5.5, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 11, 5]} />
        <meshLambertMaterial color="#444" />
      </mesh>
      <mesh position={[0, 12.5, 0]}>
        <boxGeometry args={[8.5, 3.8, 0.32]} />
        <meshBasicMaterial color={bg} />
      </mesh>
      <mesh position={[0, 12.9, 0.18]}>
        <boxGeometry args={[7.6, 0.9, 0.05]} />
        <meshBasicMaterial color={fg} />
      </mesh>
      <mesh position={[0, 12.1, 0.18]}>
        <boxGeometry args={[5.8, 0.6, 0.05]} />
        <meshBasicMaterial color={fg} transparent opacity={0.75} />
      </mesh>
      {[-3.8, 3.8].map((ox, i) => (
        <mesh key={i} position={[ox, 11.6, 0]}>
          <boxGeometry args={[0.28, 2.8, 0.28]} />
          <meshLambertMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

// ── PARKED CAR ────────────────────────────────────────────────────────────────
function ParkedCar({ x, z, rot = 0, ci = 0 }: { x: number; z: number; rot?: number; ci?: number }) {
  const modelPath = PARKED_CAR_MODELS[ci % PARKED_CAR_MODELS.length];
  const color     = PC_COLORS[ci % PC_COLORS.length];
  const { scene } = useGLTF(modelPath);
  const clone     = useMemo(() => recolorGlb(scene, color), [scene, color]);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <primitive object={clone} scale={[1.8, 1.8, 1.8]} />
    </group>
  );
}

// ── BUS ───────────────────────────────────────────────────────────────────────
function Bus({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  const { scene } = useGLTF("/models/van.glb");
  const clone     = useMemo(() => recolorGlb(scene, "#A8B09A"), [scene]);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <primitive object={clone} scale={[2.2, 2.2, 2.2]} />
    </group>
  );
}

// ── BUS STOP ──────────────────────────────────────────────────────────────────
function BusStop({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[4, 0.22, 1.6]} />
        <meshLambertMaterial color="#6A7A8A" />
      </mesh>
      <mesh position={[0, 1.7, -0.7]}>
        <boxGeometry args={[4, 3.4, 0.1]} />
        <meshLambertMaterial color="#A8BCC8" transparent opacity={0.5} />
      </mesh>
      {[-1.8, 1.8].map((ox, i) => (
        <mesh key={i} position={[ox, 1.7, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 3.4, 5]} />
          <meshLambertMaterial color="#5A6A78" />
        </mesh>
      ))}
      <mesh position={[0, 4.0, 0]}>
        <boxGeometry args={[1.4, 0.55, 0.14]} />
        <meshBasicMaterial color="#B8A870" />
      </mesh>
    </group>
  );
}

// ── FIRE HYDRANT ──────────────────────────────────────────────────────────────
function Hydrant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.7, 8]} />
        <meshLambertMaterial color="#C94D46" />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.2, 8]} />
        <meshLambertMaterial color="#A84038" />
      </mesh>
      {[-0.28, 0.28].map((ox, i) => (
        <mesh key={i} position={[ox, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.25, 6]} />
          <meshLambertMaterial color="#C8A040" />
        </mesh>
      ))}
    </group>
  );
}

// ── BENCH ─────────────────────────────────────────────────────────────────────
function Bench({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[2.0, 0.1, 0.65]} />
        <meshLambertMaterial color="#7B5A2A" />
      </mesh>
      <mesh position={[0, 0.78, -0.26]}>
        <boxGeometry args={[2.0, 0.6, 0.09]} />
        <meshLambertMaterial color="#7B5A2A" />
      </mesh>
      {([-0.8, 0.8] as number[]).map((ox, i) => (
        <mesh key={i} position={[ox, 0.22, 0]}>
          <boxGeometry args={[0.1, 0.42, 0.6]} />
          <meshLambertMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

// ── MAILBOX ───────────────────────────────────────────────────────────────────
function Mailbox({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 1.2, 6]} />
        <meshLambertMaterial color="#444" />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.55, 0.5, 0.42]} />
        <meshLambertMaterial color="#607080" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.2, 0.29, 0.18, 8]} />
        <meshLambertMaterial color="#607080" />
      </mesh>
    </group>
  );
}

// ── TRASH CAN ─────────────────────────────────────────────────────────────────
function TrashCan({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.24, 0.2, 1.0, 8]} />
        <meshLambertMaterial color="#6A7860" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.26, 0.24, 0.12, 8]} />
        <meshLambertMaterial color="#585E50" />
      </mesh>
    </group>
  );
}

// ── PEDESTRIAN SIGNAL ─────────────────────────────────────────────────────────
function PedestrianSignal({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 4.4, 5]} />
        <meshLambertMaterial color="#222" />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[0.42, 0.8, 0.18]} />
        <meshLambertMaterial color="#111" />
      </mesh>
      <mesh position={[0, 4.55, 0.1]}>
        <boxGeometry args={[0.28, 0.22, 0.05]} />
        <meshBasicMaterial color="#C94D46" />
      </mesh>
      <mesh position={[0, 3.88, 0.1]}>
        <boxGeometry args={[0.28, 0.22, 0.05]} />
        <meshBasicMaterial color="#48A858" />
      </mesh>
    </group>
  );
}

// ── BEACH PROPS ───────────────────────────────────────────────────────────────
const UMBRELLA_COLS = ["#FF3030","#FF8C00","#FFD700","#00CC55","#2288FF","#CC00CC","#FF69B4","#00BBBB"];

function BeachUmbrella({ x, z, rot = 0, ci = 0 }: { x: number; z: number; rot?: number; ci?: number }) {
  const col  = UMBRELLA_COLS[ci % UMBRELLA_COLS.length];
  const col2 = UMBRELLA_COLS[(ci + 4) % UMBRELLA_COLS.length];
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 3.6, 6]} />
        <meshLambertMaterial color="#E0E0E0" />
      </mesh>
      {/* Canopy outer */}
      <mesh position={[0, 3.55, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[3.0, 1.1, 10]} />
        <meshLambertMaterial color={col} />
      </mesh>
      {/* Canopy stripe band */}
      <mesh position={[0, 3.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[3.0, 0.38, 10]} />
        <meshLambertMaterial color={col2} />
      </mesh>
      {/* Pole tip */}
      <mesh position={[0, 3.85, 0]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshLambertMaterial color="#AAAAAA" />
      </mesh>
    </group>
  );
}

function SunLounger({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* Frame */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.9, 0.14, 2.2]} />
        <meshLambertMaterial color="#C8A05A" />
      </mesh>
      {/* Raised headrest */}
      <mesh position={[0, 0.44, -0.68]} rotation={[-0.62, 0, 0]}>
        <boxGeometry args={[0.86, 0.1, 0.72]} />
        <meshLambertMaterial color="#C8A05A" />
      </mesh>
      {/* Cushion */}
      <mesh position={[0, 0.32, 0.18]}>
        <boxGeometry args={[0.78, 0.1, 1.55]} />
        <meshLambertMaterial color="#F4C8C8" />
      </mesh>
      {/* Legs */}
      {([ [-0.38, 0.72], [0.38, 0.72], [-0.38, -0.72], [0.38, -0.72] ] as [number,number][]).map(([lx,lz],i) => (
        <mesh key={i} position={[lx, 0.07, lz]}>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 4]} />
          <meshLambertMaterial color="#888" />
        </mesh>
      ))}
    </group>
  );
}

const BALL_PALETTES: [string, string][] = [
  ["#FF2020","#FFFFFF"], ["#FF8C00","#0044FF"], ["#FFD700","#FF1493"],
  ["#00CC44","#FFFFFF"], ["#CC00CC","#FFFF00"], ["#0088FF","#FF4400"],
];

function BeachBall({ x, z, ci = 0 }: { x: number; z: number; ci?: number }) {
  const [c1, c2] = BALL_PALETTES[ci % BALL_PALETTES.length];
  return (
    <group position={[x, 0.58, z]}>
      <mesh>
        <sphereGeometry args={[0.58, 14, 10]} />
        <meshLambertMaterial color={c1} />
      </mesh>
      {/* Three colored wedge bands */}
      {[0, 1, 2].map(i => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <cylinderGeometry args={[0.59, 0.59, 0.3, 14, 1, true, 0, Math.PI / 2.2]} />
          <meshLambertMaterial color={c2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

const TOWEL_COLS = ["#FF4040","#FF8C00","#3399FF","#FF69B4","#00CC66","#FFD700","#CC44CC","#FF6644"];

function BeachTowel({ x, z, rot = 0, ci = 0 }: { x: number; z: number; rot?: number; ci?: number }) {
  const col = TOWEL_COLS[ci % TOWEL_COLS.length];
  return (
    <group position={[x, 0.03, z]} rotation={[0, rot, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 2.6]} />
        <meshLambertMaterial color={col} side={THREE.DoubleSide} />
      </mesh>
      {/* White centre stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.005]}>
        <planeGeometry args={[0.55, 2.4]} />
        <meshLambertMaterial color="#FFFFFF" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── FACADE CONSTANTS ──────────────────────────────────────────────────────────
const GFH = 4.2;   // ground floor height
const FLH = 3.4;   // upper floor height
function facadeFloors(bh: number) { return Math.max(0, Math.floor((bh - GFH - 1) / FLH)); }
function facadeWins(bw: number)   { return Math.max(1, Math.floor(bw / 3.8)); }

// ── FACADE MODULES ────────────────────────────────────────────────────────────

// Evenly-spaced window strip using real window textures
function WindowStrip({ bw, bd, y, count, winKey = "win_square" }: {
  bw: number; bd: number; y: number; count: number; winKey?: TexKey;
}) {
  const winTex = useTexture(ALL_TEX[winKey]);
  const winH = FLH * 0.7;
  const winW = Math.min(2.2, bw / count - 0.2);
  const cy = y + FLH * 0.54;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i + 0.5) * (bw / count) - bw / 2;
        return (
          <mesh key={i} position={[x, cy, bd / 2 + 0.07]}>
            <planeGeometry args={[winW, winH]} />
            <meshBasicMaterial map={winTex} />
          </mesh>
        );
      })}
    </>
  );
}

// Horizontal cornice band — tall enough to read from street level
function FloorBand({ bw, bd, y, col }: { bw: number; bd: number; y: number; col: string }) {
  const H = 0.52;  // tall enough to be clearly visible
  const T = 0.22;  // projects out from wall face
  return (
    <>
      <mesh position={[0, y, bd / 2 + T / 2]}>
        <boxGeometry args={[bw + T * 2, H, T]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[0, y, -bd / 2 - T / 2]}>
        <boxGeometry args={[bw + T * 2, H, T]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[bw / 2 + T / 2, y, 0]}>
        <boxGeometry args={[T, H, bd]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[-bw / 2 - T / 2, y, 0]}>
        <boxGeometry args={[T, H, bd]} />
        <meshLambertMaterial color={col} />
      </mesh>
      {/* Cap shelf on top of the band */}
      <mesh position={[0, y + H / 2 + 0.07, 0]}>
        <boxGeometry args={[bw + T * 2 + 0.12, 0.12, bd + T * 2 + 0.12]} />
        <meshLambertMaterial color="#C0B090" />
      </mesh>
    </>
  );
}

// Ground-floor retail storefront: pilasters, large glass, door, striped awning, canvas sign
function StoreFront({ bw, bd, baseCol, glassCol, signType, doorKey = "door_wood" }: {
  bw: number; bd: number; baseCol: string; glassCol: string; signType?: string; doorKey?: TexKey;
}) {
  const doorTex  = useTexture(ALL_TEX[doorKey]);
  const panels   = Math.max(1, Math.round(bw / 3.5));
  const panelW   = bw / panels - 0.22;
  const ctr      = Math.floor(panels / 2);
  return (
    <>
      {/* Dark skirting base */}
      <mesh position={[0, 0.36, bd / 2 + 0.07]}>
        <boxGeometry args={[bw + 0.1, 0.52, 0.14]} />
        <meshLambertMaterial color="#1A1C22" />
      </mesh>
      {/* Pilasters — thick enough to read as columns */}
      {Array.from({ length: panels + 1 }).map((_, i) => (
        <mesh key={`pl-${i}`} position={[(i / panels - 0.5) * bw, GFH * 0.5, bd / 2 + 0.1]}>
          <boxGeometry args={[0.3, GFH, 0.18]} />
          <meshLambertMaterial color={baseCol} />
        </mesh>
      ))}
      {/* Large glass storefront panels */}
      {Array.from({ length: panels }).map((_, i) => {
        const x = (i + 0.5) * (bw / panels) - bw / 2;
        return (
          <group key={`gp-${i}`} position={[x, 0, 0]}>
            <mesh position={[0, GFH * 0.50, bd / 2 + 0.11]}>
              <boxGeometry args={[panelW, GFH * 0.72, 0.07]} />
              <meshBasicMaterial color={glassCol} transparent opacity={0.58} />
            </mesh>
            {i === ctr && (
              <mesh position={[0, GFH * 0.30, bd / 2 + 0.13]}>
                <planeGeometry args={[panelW * 0.52, GFH * 0.62]} />
                <meshBasicMaterial map={doorTex} />
              </mesh>
            )}
          </group>
        );
      })}
      {/* Canvas business sign — backed on a dark board */}
      <mesh position={[0, GFH * 0.91, bd / 2 + 0.13]}>
        <boxGeometry args={[bw * 0.86, 0.96, 0.22]} />
        <meshLambertMaterial color="#1A1C22" />
      </mesh>
      {signType && (
        <mesh position={[0, GFH * 0.91, bd / 2 + 0.25]}>
          <boxGeometry args={[bw * 0.84, 0.92, 0.04]} />
          <meshBasicMaterial map={getSignTex(signType)} />
        </mesh>
      )}
      {/* Striped awning — the signature detail */}
      <mesh position={[0, GFH * 0.82, bd / 2 + 1.25]}>
        <boxGeometry args={[bw + 0.2, 0.18, 2.6]} />
        <meshLambertMaterial map={getAwningTex()} />
      </mesh>
      {/* Awning valance (front lip) */}
      <mesh position={[0, GFH * 0.82 - 0.16, bd / 2 + 2.53]}>
        <boxGeometry args={[bw + 0.2, 0.32, 0.08]} />
        <meshLambertMaterial map={getAwningTex()} />
      </mesh>
    </>
  );
}

// Vertical corner accent pillars
function CornerStrips({ bw, bd, bh, col }: { bw: number; bd: number; bh: number; col: string }) {
  return (
    <>
      {([ [-bw/2-0.04, -bd/2-0.04], [bw/2+0.04, -bd/2-0.04],
          [-bw/2-0.04,  bd/2+0.04], [bw/2+0.04,  bd/2+0.04] ] as [number,number][]).map(([x,z],i) => (
        <mesh key={i} position={[x, bh/2, z]}>
          <boxGeometry args={[0.22, bh, 0.22]} />
          <meshLambertMaterial color={col} />
        </mesh>
      ))}
    </>
  );
}

// Rooftop parapet railing with cap
function RoofRailing({ bw, bd, y, col }: { bw: number; bd: number; y: number; col: string }) {
  const H = 0.7, T = 0.14;
  return (
    <>
      <mesh position={[0, y + H/2, bd/2 + T/2]}>
        <boxGeometry args={[bw + T*2, H, T]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[0, y + H/2, -bd/2 - T/2]}>
        <boxGeometry args={[bw + T*2, H, T]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[bw/2 + T/2, y + H/2, 0]}>
        <boxGeometry args={[T, H, bd]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[-bw/2 - T/2, y + H/2, 0]}>
        <boxGeometry args={[T, H, bd]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[0, y + H + 0.07, 0]}>
        <boxGeometry args={[bw + T*2 + 0.1, 0.12, bd + T*2 + 0.1]} />
        <meshLambertMaterial color="#C0B8A8" />
      </mesh>
    </>
  );
}

// Rooftop HVAC unit
function HVACUnit({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh><boxGeometry args={[1.8, 0.72, 1.2]} /><meshLambertMaterial color="#6A7280" /></mesh>
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.6, 0.12, 1.0]} /><meshLambertMaterial color="#545E68" /></mesh>
      <mesh position={[0, 0.22, 0.55]}><boxGeometry args={[1.6, 0.44, 0.08]} /><meshLambertMaterial color="#383C44" /></mesh>
    </group>
  );
}

// Rooftop satellite dish
function SatDish({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.84, 5]} />
        <meshLambertMaterial color="#3A3C44" />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[Math.PI/3, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.07, 8]} />
        <meshLambertMaterial color="#C8C0B0" />
      </mesh>
    </group>
  );
}

// Flat roof plane with tiling roof texture
function BuildingRoof({ bw, bd, y, roofKey }: { bw: number; bd: number; y: number; roofKey: TexKey }) {
  const tex = useBuildingRoof(roofKey, bw, bd);
  return (
    <mesh position={[0, y + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[bw, bd]} />
      <meshLambertMaterial map={tex} />
    </mesh>
  );
}

// 4-sided hip/pyramid roof
function HipRoof({ bw, bd, y, col, height }: { bw: number; bd: number; y: number; col: string; height?: number }) {
  const h = height ?? Math.min(bw, bd) * 0.35;
  const r = Math.sqrt((bw / 2) ** 2 + (bd / 2) ** 2) * 0.88;
  return (
    <mesh position={[0, y + h / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[r, h, 4]} />
      <meshLambertMaterial color={col} />
    </mesh>
  );
}

// Simple gable roof (two angled box halves)
function GableRoof({ bw, bd, y, col }: { bw: number; bd: number; y: number; col: string }) {
  const h = bd * 0.38;
  const angle = Math.atan2(h, bd / 2);
  const sl = Math.sqrt((bd / 2) ** 2 + h ** 2) + 0.3;
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, h / 2, -bd / 4]} rotation={[angle, 0, 0]}>
        <boxGeometry args={[bw + 0.3, 0.18, sl]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[0, h / 2, bd / 4]} rotation={[-angle, 0, 0]}>
        <boxGeometry args={[bw + 0.3, 0.18, sl]} />
        <meshLambertMaterial color={col} />
      </mesh>
      {/* Gable end triangles */}
      <mesh position={[-bw / 2 - 0.06, h / 2, 0]}>
        <coneGeometry args={[bd * 0.31, h, 3]} />
        <meshLambertMaterial color={col} />
      </mesh>
      <mesh position={[bw / 2 + 0.06, h / 2, 0]}>
        <coneGeometry args={[bd * 0.31, h, 3]} />
        <meshLambertMaterial color={col} />
      </mesh>
    </group>
  );
}

// ── BUILDING TYPES ────────────────────────────────────────────────────────────

function FastFoodBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d, bh = b.h;
  const bandCol = "#6A4820";
  const glassCol = "#88B8D8";
  const numPilasters = Math.max(2, Math.round(bw / 3));
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main body */}
      <mesh position={[0, bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Ground floor large glass panels */}
      <mesh position={[0, GFH * 0.47, bd / 2 + 0.08]}>
        <boxGeometry args={[bw - 0.5, GFH * 0.78, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.62} />
      </mesh>
      {/* Dark pilasters framing glass */}
      {Array.from({ length: numPilasters + 1 }).map((_, i) => (
        <mesh key={i} position={[(i / numPilasters) * bw - bw / 2, GFH * 0.5, bd / 2 + 0.1]}>
          <boxGeometry args={[0.28, GFH, 0.18]} />
          <meshLambertMaterial color={bandCol} />
        </mesh>
      ))}
      {/* Brown band at floor transition */}
      <mesh position={[0, GFH, 0]}>
        <boxGeometry args={[bw + 0.28, 0.44, bd + 0.28]} />
        <meshLambertMaterial color={bandCol} />
      </mesh>
      {/* Upper floor windows */}
      <WindowStrip bw={bw} bd={bd} y={GFH + 0.6} count={Math.max(2, Math.floor(bw / 3.5))} winKey="win_square" />
      {/* Sign board */}
      <mesh position={[0, GFH * 0.85, bd / 2 + 0.18]}>
        <boxGeometry args={[bw * 0.72, 0.8, 0.09]} />
        <meshBasicMaterial map={getSignTex("fastfood")} />
      </mesh>
      {/* Canopy overhang above entry */}
      <mesh position={[0, bh + 0.14, bd / 2 + 1.4]}>
        <boxGeometry args={[bw + 0.4, 0.24, 2.9]} />
        <meshLambertMaterial color={bandCol} />
      </mesh>
      {/* Support columns holding up the canopy */}
      {Array.from({ length: Math.max(2, Math.round(bw / 4.5)) }).map((_, i) => {
        const n = Math.max(2, Math.round(bw / 4.5));
        const x = (i / (n - 1)) * bw - bw / 2;
        return (
          <mesh key={`col-${i}`} position={[x, (bh + 0.14) / 2, bd / 2 + 2.7]}>
            <boxGeometry args={[0.22, bh + 0.14, 0.22]} />
            <meshLambertMaterial color={bandCol} />
          </mesh>
        );
      })}
      {/* Roof parapet */}
      <mesh position={[0, bh + 0.28, 0]}>
        <boxGeometry args={[bw + 0.28, 0.54, bd + 0.28]} />
        <meshLambertMaterial color="#B8A880" />
      </mesh>
    </group>
  );
}

function HotelBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d, bh = b.h;
  const bandCol = "#6A4820";
  const glassCol = "#88B8D8";
  const floors = Math.max(1, Math.floor((bh - GFH) / FLH));
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main box */}
      <mesh position={[0, bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshLambertMaterial color={b.color} />
      </mesh>

      {/* Glass facade — 2 floor bands + single glass plane */}
      <FloorBand bw={bw} bd={bd} y={GFH - 0.1} col={bandCol} />
      <FloorBand bw={bw} bd={bd} y={bh - FLH * 0.5} col={bandCol} />
      <mesh position={[0, bh * 0.55, bd / 2 + 0.09]}>
        <planeGeometry args={[bw - 0.4, bh * 0.75]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.55} />
      </mesh>

      {/* Ground floor glass entry */}
      <mesh position={[0, GFH * 0.47, bd / 2 + 0.1]}>
        <boxGeometry args={[bw * 0.55, GFH * 0.78, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.65} />
      </mesh>

      {/* Hotel sign near top */}
      <mesh position={[0, bh * 0.91, bd / 2 + 0.18]}>
        <boxGeometry args={[bw * 0.78, 1.1, 0.1]} />
        <meshBasicMaterial map={getSignTex("hotel")} />
      </mesh>

      {/* Roof parapet */}
      <mesh position={[0, bh + 0.3, 0]}>
        <boxGeometry args={[bw + 0.3, 0.6, bd + 0.3]} />
        <meshLambertMaterial color="#B8A880" />
      </mesh>
      <HVACUnit x={0} y={bh + 0.82} z={0} />
      <SatDish x={bw * 0.3} y={bh + 0.5} z={-bd * 0.2} />
    </group>
  );
}

function MallBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d, bh = b.h;
  const wingW = bw * 0.32, wingD = bd * 0.54, wingH = bh;
  const glassCol = "#88B8D8";
  const bandCol = "#7A5830";
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Back main bar */}
      <mesh position={[0, bh / 2, -bd * 0.24]}>
        <boxGeometry args={[bw, bh, bd * 0.52]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Left forward wing */}
      <mesh position={[-bw * 0.34, wingH / 2, bd * 0.12]}>
        <boxGeometry args={[wingW, wingH, wingD]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Right forward wing */}
      <mesh position={[bw * 0.34, wingH / 2, bd * 0.12]}>
        <boxGeometry args={[wingW, wingH, wingD]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Upper glass band across back bar face */}
      <mesh position={[0, bh * 0.62, -bd * 0.24 + bd * 0.26 + 0.1]}>
        <boxGeometry args={[bw - 0.4, bh * 0.32, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.62} />
      </mesh>
      {/* Glass on wing fronts */}
      {([-bw * 0.34, bw * 0.34] as number[]).map((wx, i) => (
        <mesh key={i} position={[wx, wingH * 0.6, bd * 0.12 + wingD / 2 + 0.1]}>
          <boxGeometry args={[wingW - 0.4, wingH * 0.32, 0.12]} />
          <meshBasicMaterial color={glassCol} transparent opacity={0.62} />
        </mesh>
      ))}
      {/* Floor bands on all 3 volumes */}
      <mesh position={[0, GFH, -bd * 0.24]}>
        <boxGeometry args={[bw + 0.28, 0.44, bd * 0.52 + 0.28]} />
        <meshLambertMaterial color={bandCol} />
      </mesh>
      {([-bw * 0.34, bw * 0.34] as number[]).map((wx, i) => (
        <mesh key={i} position={[wx, GFH, bd * 0.12]}>
          <boxGeometry args={[wingW + 0.28, 0.44, wingD + 0.28]} />
          <meshLambertMaterial color={bandCol} />
        </mesh>
      ))}
      {/* Corner columns supporting each wing's floor band */}
      {([-bw * 0.34, bw * 0.34] as number[]).flatMap((wx, wi) =>
        ([-wingW / 2, wingW / 2] as number[]).map((ox, oi) => (
          <mesh key={`wc-${wi}-${oi}`}
            position={[wx + ox, GFH / 2, bd * 0.12 + wingD / 2 + 0.14]}
           >
            <boxGeometry args={[0.28, GFH, 0.28]} />
            <meshLambertMaterial color={bandCol} />
          </mesh>
        ))
      )}
      {/* Ground glass entry in courtyard opening */}
      <mesh position={[0, GFH * 0.47, -bd * 0.24 + bd * 0.26 + 0.08]}>
        <boxGeometry args={[bw * 0.55, GFH * 0.78, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.60} />
      </mesh>
      {/* Sign */}
      <mesh position={[0, bh * 0.45, -bd * 0.24 + bd * 0.26 + 0.2]}>
        <boxGeometry args={[bw * 0.5, 0.9, 0.06]} />
        <meshBasicMaterial map={getSignTex("mall")} />
      </mesh>
      {/* Solar panels on back bar roof */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[-bw * 0.28 + i * bw * 0.28, bh + 0.22, -bd * 0.24]} rotation={[-0.28, 0, 0]}>
          <boxGeometry args={[bw * 0.18, 0.1, bd * 0.18]} />
          <meshBasicMaterial color="#3A5870" />
        </mesh>
      ))}
      {/* Roof parapet */}
      <mesh position={[0, bh + 0.28, -bd * 0.24]}>
        <boxGeometry args={[bw + 0.28, 0.55, bd * 0.52 + 0.28]} />
        <meshLambertMaterial color="#B8A880" />
      </mesh>
    </group>
  );
}

function GasStationBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d;
  const bh = Math.min(b.h, 6.5);
  // L-shape: main tall block (right portion) + lower wing (left+forward) — BOTH within bw×bd
  const mainW = bw * 0.62, mainD = bd * 0.58;
  const wingW = bw * 0.44, wingD = bd * 0.46, wingH = bh * 0.65;
  const glassCol = "#88B8D8";
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main taller block — right-back quadrant of footprint */}
      <mesh position={[bw * 0.18, bh / 2, -bd * 0.18]}>
        <boxGeometry args={[mainW, bh, mainD]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Lower wing — left-front quadrant of footprint (stays within bw×bd) */}
      <mesh position={[-bw * 0.26, wingH / 2, bd * 0.22]}>
        <boxGeometry args={[wingW, wingH, wingD]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Horizontal glass strip on main block front */}
      <mesh position={[bw * 0.18, bh * 0.68, -bd * 0.18 + mainD / 2 + 0.08]}>
        <boxGeometry args={[mainW - 0.4, bh * 0.2, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.60} />
      </mesh>
      <mesh position={[bw * 0.18, bh * 0.32, -bd * 0.18 + mainD / 2 + 0.08]}>
        <boxGeometry args={[mainW - 0.4, bh * 0.18, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.60} />
      </mesh>
      {/* Glass strip on wing front */}
      <mesh position={[-bw * 0.26, wingH * 0.6, bd * 0.22 + wingD / 2 + 0.08]}>
        <boxGeometry args={[wingW - 0.4, wingH * 0.22, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.60} />
      </mesh>
      {/* Mid band on main block */}
      <mesh position={[bw * 0.18, bh * 0.52, -bd * 0.18]}>
        <boxGeometry args={[mainW + 0.25, 0.35, mainD + 0.25]} />
        <meshLambertMaterial color="#A0A098" />
      </mesh>
      {/* Roof parapets */}
      <mesh position={[bw * 0.18, bh + 0.24, -bd * 0.18]}>
        <boxGeometry args={[mainW + 0.28, 0.48, mainD + 0.28]} />
        <meshLambertMaterial color="#C8C4BC" />
      </mesh>
      <mesh position={[-bw * 0.26, wingH + 0.22, bd * 0.22]}>
        <boxGeometry args={[wingW + 0.28, 0.44, wingD + 0.28]} />
        <meshLambertMaterial color="#C8C4BC" />
      </mesh>
      <HVACUnit x={bw * 0.18} y={bh + 0.58} z={-bd * 0.18} />
    </group>
  );
}

function ArcadeBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d, bh = b.h;
  const floors = Math.max(1, Math.floor((bh - GFH) / FLH));
  const bandCol = "#7A5830";
  const glassCol = "#88B8D8";
  const numPanels = Math.min(4, Math.max(2, Math.floor(bw / 3)));
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main tan box */}
      <mesh position={[0, bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Glass facade — single planes */}
      <FloorBand bw={bw} bd={bd} y={GFH - 0.1} col={bandCol} />
      <FloorBand bw={bw} bd={bd} y={bh - FLH * 0.5} col={bandCol} />
      <mesh position={[0, bh * 0.55, bd / 2 + 0.08]}>
        <planeGeometry args={[bw - 0.5, bh * 0.75]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.52} />
      </mesh>
      {/* Ground floor glass entry */}
      <mesh position={[0, GFH * 0.47, bd / 2 + 0.1]}>
        <boxGeometry args={[bw * 0.7, GFH * 0.78, 0.12]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.62} />
      </mesh>
      {/* Green roof garden */}
      <mesh position={[0, bh + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bw - 0.5, bd - 0.5]} />
        <meshLambertMaterial color="#5A9048" />
      </mesh>
      {/* Solar panels */}
      {Array.from({ length: numPanels }).map((_, i) => (
        <mesh key={i}
          position={[-bw * 0.32 + i * (bw * 0.64 / Math.max(numPanels - 1, 1)), bh + 0.22, 0]}
          rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[bw * 0.12, 0.1, bd * 0.22]} />
          <meshBasicMaterial color="#3A5870" />
        </mesh>
      ))}
      <RoofRailing bw={bw} bd={bd} y={bh + 0.08} col={bandCol} />
    </group>
  );
}

function OfficeBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d, bh = b.h;
  const floors = Math.max(1, Math.floor((bh - GFH) / FLH));
  const bandCol = "#1A1E2C";
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Tall glass tower — all navy glass */}
      <mesh position={[0, bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Glass facade — 2 bands + 4 single planes */}
      <FloorBand bw={bw} bd={bd} y={GFH - 0.1} col={bandCol} />
      <FloorBand bw={bw} bd={bd} y={bh - FLH * 0.5} col={bandCol} />
      <mesh position={[0, bh * 0.55, bd / 2 + 0.09]}>
        <planeGeometry args={[bw - 0.4, bh * 0.78]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, bh * 0.55, -bd / 2 - 0.09]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[bw - 0.4, bh * 0.78]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.45} />
      </mesh>
      <mesh position={[bw / 2 + 0.09, bh * 0.55, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[bd - 0.4, bh * 0.78]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.45} />
      </mesh>
      <mesh position={[-bw / 2 - 0.09, bh * 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[bd - 0.4, bh * 0.78]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.45} />
      </mesh>
      {/* Company sign near top */}
      <mesh position={[0, bh * 0.90, bd / 2 + 0.2]}>
        <boxGeometry args={[bw * 0.88, 1.35, 0.1]} />
        <meshBasicMaterial map={getSignTex("office")} />
      </mesh>
      {/* Rooftop spire */}
      <mesh position={[0, bh + 3.5, 0]}>
        <cylinderGeometry args={[0.07, 0.2, 6, 4]} />
        <meshLambertMaterial color={bandCol} />
      </mesh>
      <RoofRailing bw={bw} bd={bd} y={bh} col={bandCol} />
      <HVACUnit x={bw * 0.22} y={bh + 0.5} z={0} />
    </group>
  );
}

function ApartmentBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d, bh = b.h;
  const floors = Math.max(1, Math.floor((bh - GFH) / FLH));
  const glassCol = "#88B8D8";
  const glassRows = Math.max(1, floors + 1);
  const glassCols = Math.max(2, Math.floor(bw / 3.2));
  const frameCol = "#C0B898";
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main warm brown box */}
      <mesh position={[0, bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Glass facade — single plane */}
      <mesh position={[0, bh * 0.55, bd / 2 + 0.08]}>
        <planeGeometry args={[bw * 0.88, bh * 0.78]} />
        <meshBasicMaterial color={glassCol} transparent opacity={0.60} />
      </mesh>
      {/* Roof parapet */}
      <mesh position={[0, bh + 0.28, 0]}>
        <boxGeometry args={[bw + 0.28, 0.55, bd + 0.28]} />
        <meshLambertMaterial color="#A89878" />
      </mesh>
      <HVACUnit x={0} y={bh + 0.65} z={0} />
    </group>
  );
}

function SkyscraperBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d, bh = b.h;
  const s1 = bh * 0.44, s2 = bh * 0.28, s3 = bh * 0.18, s4 = bh * 0.10;
  const floors1 = facadeFloors(s1);
  const trim = "#1A1E28";
  return (
    <group position={[b.x, 0, b.z]}>
      {/* 4-step setback dark glass tower */}
      <mesh position={[0, s1 / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bw, s1, bd]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      <mesh position={[0, s1 + 0.2, 0]}>
        <boxGeometry args={[bw + 0.9, 0.4, bd + 0.9]} />
        <meshLambertMaterial color={trim} />
      </mesh>
      <mesh position={[0, s1 + s2 / 2, 0]} castShadow>
        <boxGeometry args={[bw * 0.72, s2, bd * 0.72]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      <mesh position={[0, s1 + s2 + 0.15, 0]}>
        <boxGeometry args={[bw * 0.72 + 0.7, 0.3, bd * 0.72 + 0.7]} />
        <meshLambertMaterial color={trim} />
      </mesh>
      <mesh position={[0, s1 + s2 + s3 / 2, 0]} castShadow>
        <boxGeometry args={[bw * 0.48, s3, bd * 0.48]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      <mesh position={[0, s1 + s2 + s3 + 0.12, 0]}>
        <boxGeometry args={[bw * 0.48 + 0.5, 0.25, bd * 0.48 + 0.5]} />
        <meshLambertMaterial color={trim} />
      </mesh>
      <mesh position={[0, s1 + s2 + s3 + s4 / 2, 0]}>
        <boxGeometry args={[bw * 0.28, s4, bd * 0.28]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Glass curtain-wall — single plane per face */}
      <mesh position={[0, s1 * 0.55, bd / 2 + 0.09]}>
        <planeGeometry args={[bw - 0.4, s1 * 0.82]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, s1 * 0.55, -bd / 2 - 0.09]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[bw - 0.4, s1 * 0.82]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.45} />
      </mesh>
      <mesh position={[bw / 2 + 0.09, s1 * 0.55, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[bd - 0.4, s1 * 0.82]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.45} />
      </mesh>
      <mesh position={[-bw / 2 - 0.09, s1 * 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[bd - 0.4, s1 * 0.82]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.45} />
      </mesh>
      {/* Helipad disk — the Apex Tower signature */}
      <mesh position={[0, bh + 0.55, 0]}>
        <cylinderGeometry args={[bw * 0.42, bw * 0.38, 0.5, 20]} />
        <meshLambertMaterial color="#5A6070" />
      </mesh>
      <mesh position={[0, bh + 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[bw * 0.38, 20]} />
        <meshLambertMaterial color="#5A6070" side={THREE.DoubleSide} />
      </mesh>
      {/* Helipad yellow ring */}
      <mesh position={[0, bh + 0.84, 0]}>
        <cylinderGeometry args={[bw * 0.36, bw * 0.36, 0.1, 20]} />
        <meshBasicMaterial color="#F0D040" />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, bh + 5.5, 0]}>
        <cylinderGeometry args={[0.06, 0.18, 6, 5]} />
        <meshLambertMaterial color={trim} />
      </mesh>
      <mesh position={[0, bh + 9, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#C94D46" />
      </mesh>
      <HVACUnit x={-bw * 0.22} y={s1 + 0.5} z={0} />
    </group>
  );
}

function DinerBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d;
  const bh = Math.min(b.h, 7);
  const cr = Math.min(bw, bd) * 0.4;
  const diskR = cr * 2.0;
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Short cylindrical base */}
      <mesh position={[0, bh / 2, 0]}>
        <cylinderGeometry args={[cr, cr * 1.05, bh, 18]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Glass band around cylinder */}
      <mesh position={[0, bh * 0.55, 0]}>
        <cylinderGeometry args={[cr + 0.06, cr + 0.06, bh * 0.38, 18]} />
        <meshBasicMaterial color="#88B8D8" transparent opacity={0.58} />
      </mesh>
      {/* 4 support columns */}
      {Array.from({ length: 4 }).map((_, i) => {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.sin(ang) * cr * 0.72, bh * 0.4, Math.cos(ang) * cr * 0.72]}>
            <cylinderGeometry args={[0.2, 0.24, bh * 0.8, 6]} />
            <meshLambertMaterial color="#C8C4BC" />
          </mesh>
        );
      })}
      {/* Large flat disk roof — Data Pavilion signature */}
      <mesh position={[0, bh + 0.3, 0]}>
        <cylinderGeometry args={[diskR, diskR * 0.96, 0.65, 24]} />
        <meshLambertMaterial color="#C0BCAC" />
      </mesh>
      {/* Disk top surface */}
      <mesh position={[0, bh + 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[diskR, 24]} />
        <meshLambertMaterial color="#B4B0A4" />
      </mesh>
      {/* Chrome underside ring */}
      <mesh position={[0, bh + 0.28, 0]}>
        <cylinderGeometry args={[diskR + 0.12, diskR + 0.12, 0.28, 24]} />
        <meshLambertMaterial color="#D0CCC0" />
      </mesh>
      {/* Central antenna */}
      <mesh position={[0, bh + 2.5, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 3.6, 5]} />
        <meshLambertMaterial color="#888" />
      </mesh>
    </group>
  );
}

function ChurchBuilding({ b }: { b: BuildingData }) {
  const bw = b.w, bd = b.d;
  const bh = Math.min(b.h, 9);
  const wingW = bw * 0.5, wingD = bd * 0.75, wingH = bh * 0.6;
  const glassCol = "#88B8D8";
  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main taller box */}
      <mesh position={[-bw * 0.22, bh / 2, 0]}>
        <boxGeometry args={[bw * 0.6, bh, bd]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Attached lower wing */}
      <mesh position={[bw * 0.4, wingH / 2, -bd * 0.1]}>
        <boxGeometry args={[wingW, wingH, wingD]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      {/* Window grid on main box front */}
      {Array.from({ length: 2 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <mesh key={`m${row}${col}`} position={[
            -bw * 0.22 + (col - 1) * (bw * 0.6 / 3.2),
            bh * 0.28 + row * bh * 0.4,
            bd / 2 + 0.08
          ]}>
            <boxGeometry args={[bw * 0.11, bh * 0.24, 0.1]} />
            <meshBasicMaterial color={glassCol} transparent opacity={0.65} />
          </mesh>
        ))
      )}
      {/* Window grid on wing front */}
      {Array.from({ length: 2 }).map((_, row) =>
        Array.from({ length: 2 }).map((_, col) => (
          <mesh key={`w${row}${col}`} position={[
            bw * 0.4 + (col - 0.5) * wingW * 0.56,
            wingH * 0.28 + row * wingH * 0.48,
            -bd * 0.1 + wingD / 2 + 0.08
          ]}>
            <boxGeometry args={[wingW * 0.3, wingH * 0.26, 0.1]} />
            <meshBasicMaterial color={glassCol} transparent opacity={0.65} />
          </mesh>
        ))
      )}
      {/* R&D sign on main box */}
      <mesh position={[-bw * 0.22, bh + 0.48, bd / 2 + 0.15]}>
        <boxGeometry args={[bw * 0.44, 1.1, 0.1]} />
        <meshBasicMaterial map={getSignTex("church")} />
      </mesh>
      {/* Labs sign on wing */}
      <mesh position={[bw * 0.4, wingH + 0.44, -bd * 0.1 + wingD / 2 + 0.12]}>
        <boxGeometry args={[wingW * 0.7, 0.95, 0.1]} />
        <meshBasicMaterial map={getSignTex("arcade")} />
      </mesh>
      {/* Roof parapets */}
      <mesh position={[-bw * 0.22, bh + 0.28, 0]}>
        <boxGeometry args={[bw * 0.6 + 0.28, 0.55, bd + 0.28]} />
        <meshLambertMaterial color="#C8C4BC" />
      </mesh>
      <mesh position={[bw * 0.4, wingH + 0.24, -bd * 0.1]}>
        <boxGeometry args={[wingW + 0.28, 0.48, wingD + 0.28]} />
        <meshLambertMaterial color="#C8C4BC" />
      </mesh>
      <HVACUnit x={-bw * 0.22} y={bh + 0.65} z={0} />
    </group>
  );
}


function BuildingMesh({ b }: { b: BuildingData }) {
  switch (b.type) {
    case "fastfood":    return <FastFoodBuilding b={b} />;
    case "hotel":       return <HotelBuilding b={b} />;
    case "mall":        return <MallBuilding b={b} />;
    case "gas_station": return <GasStationBuilding b={b} />;
    case "arcade":      return <ArcadeBuilding b={b} />;
    case "office":      return <OfficeBuilding b={b} />;
    case "apartment":   return <ApartmentBuilding b={b} />;
    case "skyscraper":  return <SkyscraperBuilding b={b} />;
    case "diner":       return <DinerBuilding b={b} />;
    case "church":      return <ChurchBuilding b={b} />;
    default:            return null;
  }
}



// ── GATOR CASINO LANDMARK ─────────────────────────────────────────────────────
function GatorCasinoLandmark() {
  const bw = 28, bh = 26, bd = 15;
  return (
    <group position={[-52, 0, -62]}>
      <mesh position={[0, bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshLambertMaterial color="#8A8098" />
      </mesh>
      {/* Window grid */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 4 + i * 4.2, bd / 2 + 0.07]}>
          <boxGeometry args={[bw * 0.88, 2.8, 0.1]} />
          <meshBasicMaterial color="#B8D0E8" transparent opacity={0.35} />
        </mesh>
      ))}
      {/* Main sign backing */}
      <mesh position={[0, bh * 0.68, bd / 2 + 0.2]}>
        <boxGeometry args={[bw * 1.08, bh * 0.52, 0.35]} />
        <meshLambertMaterial color="#6A6478" />
      </mesh>
      {/* Sign face — DoubleSide so the back isn't invisible */}
      <mesh position={[0, bh * 0.68, bd / 2 + 0.4]}>
        <planeGeometry args={[bw * 1.04, bh * 0.5]} />
        <meshBasicMaterial map={getCasinoSignTex()} side={THREE.DoubleSide} />
      </mesh>
      {/* Trim border on sign top */}
      <mesh position={[0, bh + 0.4, bd / 2 + 0.4]}>
        <boxGeometry args={[bw * 1.08, 0.25, 0.1]} />
        <meshBasicMaterial color="#B0A8C0" />
      </mesh>
      {/* Side pillar */}
      <mesh position={[bw / 2 + 1.2, bh * 0.45, 0]}>
        <boxGeometry args={[2.2, bh * 0.82, bd * 0.28]} />
        <meshLambertMaterial color="#747088" />
      </mesh>
      {/* Trim strips on side pillar */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <mesh key={i} position={[bw / 2 + 2.4, bh * t, 0]}>
          <boxGeometry args={[0.14, 2.0, bd * 0.22]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#C0B8D0" : "#A89AB8"} />
        </mesh>
      ))}
      {/* Soft ambient light around casino — no longer neon purple */}
      <pointLight position={[0, bh * 0.68, bd / 2 + 3]} intensity={12} color="#D0C8E8" distance={30} />
      <pointLight position={[bw / 2 + 3, bh * 0.5, 0]} intensity={8} color="#C8C0D8" distance={20} />
    </group>
  );
}

// ── GAS:GO SIGN ───────────────────────────────────────────────────────────────
function GasGoSign() {
  return (
    <group position={[66, 0, -68]}>
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 16, 6]} />
        <meshLambertMaterial color="#444" />
      </mesh>
      <mesh position={[0, 16.5, 0]}>
        <boxGeometry args={[7.8, 6.2, 0.5]} />
        <meshLambertMaterial color="#A84038" />
      </mesh>
      <mesh position={[0, 16.5, 0.28]}>
        <planeGeometry args={[7.4, 5.8]} />
        <meshBasicMaterial map={getGasGoTex()} />
      </mesh>
    </group>
  );
}

// ── FRESH GATOR BITES BILLBOARD ───────────────────────────────────────────────
function FreshGatorBitesBillboard() {
  return (
    <group position={[72, 0, -85]}>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 12, 5]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      <mesh position={[0, 13.5, 0]}>
        <boxGeometry args={[6.5, 8.8, 0.36]} />
        <meshLambertMaterial color="#2A6A20" />
      </mesh>
      <mesh position={[0, 13.5, 0.2]}>
        <planeGeometry args={[6.2, 8.5]} />
        <meshBasicMaterial map={getFreshGatorTex()} side={THREE.DoubleSide} />
      </mesh>
      {[-3.3, 3.3].map((ox, i) => (
        <mesh key={i} position={[ox, 12.2, 0]}>
          <boxGeometry args={[0.28, 3.2, 0.28]} />
          <meshLambertMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
}

// ── LANE LINES ────────────────────────────────────────────────────────────────
function useRoadMarkings() {
  return useMemo(() => {
    const roads = getRoadXPositions();
    const marks: { x: number; z: number; w: number; d: number; rot: boolean }[] = [];
    const dashLen = 5; const dashGap = 16;
    const halfCity = HALF_CITY;
    for (const r of roads) {
      for (let p = -halfCity + 4; p < halfCity - 4; p += dashLen + dashGap) {
        // single center dash — horizontal road
        marks.push({ x: p + dashLen / 2, z: r, w: dashLen, d: 0.30, rot: false });
        // single center dash — vertical road
        marks.push({ x: r, z: p + dashLen / 2, w: 0.30, d: dashLen, rot: false });
      }
    }
    return marks;
  }, []);
}

// ── MAIN CITY COMPONENT ───────────────────────────────────────────────────────
export default function City() {
  const buildings = getBuildings();
  const roads = getRoadXPositions();
  const centers = getBlockCenters();

  // Street furniture via seeded randoms
  const palms = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    const rand = makeRand(777);
    const hw = ROAD_WIDTH / 2;
    for (const r of roads) {
      for (let p = -HALF_CITY + 10; p < HALF_CITY - 10; p += 36) {
        if (rand() > 0.55) list.push({ x: p + rand() * 5 - 2.5, z: r + hw + 2.8 });
        if (rand() > 0.55) list.push({ x: p + rand() * 5 - 2.5, z: r - hw - 2.8 });
        if (rand() > 0.55) list.push({ z: p + rand() * 5 - 2.5, x: r + hw + 2.8 });
        if (rand() > 0.55) list.push({ z: p + rand() * 5 - 2.5, x: r - hw - 2.8 });
      }
    }
    const margin = hw + 3;
    return list.filter(t =>
      !roads.some(cr => Math.abs(t.x - cr) < margin) &&
      !roads.some(cr => Math.abs(t.z - cr) < margin)
    );
  }, []);

  const parkedCars = useMemo(() => {
    const list: { x: number; z: number; rot: number; ci: number }[] = [];
    const rand = makeRand(333); let ci = 0;
    const hw = ROAD_WIDTH / 2;
    for (const r of roads) {
      for (let p = -HALF_CITY + 14; p < HALF_CITY - 14; p += 40) {
        if (rand() > 0.72 && Math.abs(p % BLOCK_SIZE) > 8)
          list.push({ x: p + rand() * 3, z: r + hw + 2.2, rot: Math.PI / 2, ci: ci++ });
        if (rand() > 0.75 && Math.abs(p % BLOCK_SIZE) > 8)
          list.push({ z: p + rand() * 3, x: r + hw + 2.2, rot: 0, ci: ci++ });
      }
    }
    return list;
  }, []);

  const buses = useMemo(() => {
    const list: { x: number; z: number; rot: number }[] = [];
    const rand = makeRand(888);
    for (const r of roads) {
      for (let p = -HALF_CITY + 30; p < HALF_CITY - 30; p += 180) {
        if (rand() > 0.65) list.push({ x: p + rand() * 10, z: r + ROAD_WIDTH / 2 + 2.5, rot: Math.PI / 2 });
        if (rand() > 0.65) list.push({ z: p + rand() * 10, x: r + ROAD_WIDTH / 2 + 2.5, rot: 0 });
      }
    }
    return list;
  }, []);

  const busStops = useMemo(() => {
    const list: { x: number; z: number; rot: number }[] = [];
    const rand = makeRand(222);
    for (const r of roads) {
      for (let p = -HALF_CITY + 25; p < HALF_CITY - 25; p += 60) {
        if (rand() > 0.45) list.push({ x: p + rand() * 8, z: r + ROAD_WIDTH / 2 + 3.5, rot: 0 });
      }
    }
    return list;
  }, []);

  const hydrants = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    const rand = makeRand(444);
    for (const r of roads) {
      for (let p = -HALF_CITY + 15; p < HALF_CITY - 15; p += 60) {
        if (rand() > 0.6) list.push({ x: p + rand() * 4, z: r + ROAD_WIDTH / 2 + 1.5 });
        if (rand() > 0.6) list.push({ z: p + rand() * 4, x: r + ROAD_WIDTH / 2 + 1.5 });
      }
    }
    return list;
  }, []);

  const billboards = useMemo(() => {
    const list: { x: number; z: number; rot: number; ci: number }[] = [];
    const rand = makeRand(555); let ci = 0;
    const inset = BLOCK_SIZE / 2 - ROAD_WIDTH / 2 - 3; // safely on the sidewalk
    for (const [cx, cz] of centers) {
      if (rand() > 0.4) {
        const side = rand() > 0.5 ? 1 : -1;
        list.push({ x: cx + side * inset, z: cz, rot: side > 0 ? 0 : Math.PI, ci: ci++ });
      }
      if (rand() > 0.55) {
        const side = rand() > 0.5 ? 1 : -1;
        list.push({ x: cx, z: cz + side * inset, rot: side > 0 ? Math.PI / 2 : -Math.PI / 2, ci: ci++ });
      }
    }
    return list;
  }, []);

  const trafficLights = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    const hw = ROAD_WIDTH / 2;
    for (const x of roads) {
      for (const z of roads) {
        list.push({ x: x + hw + 0.9, z: z + hw + 0.9 });
      }
    }
    return list;
  }, []);

  const pedestrianSignals = useMemo(() => {
    const list: { x: number; z: number; rot: number }[] = [];
    const hw = ROAD_WIDTH / 2;
    for (const rx of roads) {
      for (const rz of roads) {
        list.push({ x: rx + hw + 1.2, z: rz - hw - 1.2, rot: 0 });
        list.push({ x: rx - hw - 1.2, z: rz + hw + 1.2, rot: Math.PI });
      }
    }
    return list;
  }, []);

  const parkingZones = useMemo(() => {
    const list: { x: number; z: number; rot: number }[] = [];
    const rand = makeRand(789);
    const hw = ROAD_WIDTH / 2;
    for (const r of roads) {
      for (let p = -HALF_CITY + 16; p < HALF_CITY - 16; p += 22) {
        if (rand() > 0.5 && Math.abs(p % BLOCK_SIZE) > 6) {
          list.push({ x: p + rand() * 4, z: r + hw + 2.2, rot: Math.PI / 2 });
          list.push({ z: p + rand() * 4, x: r + hw + 2.2, rot: 0 });
        }
      }
    }
    return list;
  }, []);


  const benches = useMemo(() => {
    const list: { x: number; z: number; rot: number }[] = [];
    const rand = makeRand(111);
    const hw = ROAD_WIDTH / 2;
    for (const r of roads) {
      for (let p = -HALF_CITY + 12; p < HALF_CITY - 12; p += 56) {
        if (rand() > 0.65) list.push({ x: p + rand() * 6, z: r + hw + 5.2, rot: 0 });
        if (rand() > 0.65) list.push({ x: p + rand() * 6, z: r - hw - 5.2, rot: Math.PI });
        if (rand() > 0.65) list.push({ z: p + rand() * 6, x: r + hw + 5.2, rot: Math.PI / 2 });
        if (rand() > 0.65) list.push({ z: p + rand() * 6, x: r - hw - 5.2, rot: -Math.PI / 2 });
      }
    }
    // Remove any bench that landed inside a road corridor
    const margin = hw + 2;
    return list.filter(b =>
      !roads.some(cr => Math.abs(b.x - cr) < margin) &&
      !roads.some(cr => Math.abs(b.z - cr) < margin)
    );
  }, []);

  const mailboxes = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    const rand = makeRand(666);
    const hw = ROAD_WIDTH / 2;
    for (const r of roads) {
      for (let p = -HALF_CITY + 18; p < HALF_CITY - 18; p += 80) {
        if (rand() > 0.6) list.push({ x: p + rand() * 5, z: r + hw + 3.0 });
        if (rand() > 0.6) list.push({ z: p + rand() * 5, x: r + hw + 3.0 });
      }
    }
    return list;
  }, []);

  const trashCans = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    const rand = makeRand(123);
    const hw = ROAD_WIDTH / 2;
    for (const r of roads) {
      for (let p = -HALF_CITY + 10; p < HALF_CITY - 10; p += 50) {
        if (rand() > 0.6) list.push({ x: p + rand() * 5 - 2.5, z: r + hw + 2.4 });
        if (rand() > 0.6) list.push({ x: p + rand() * 5 - 2.5, z: r - hw - 2.4 });
        if (rand() > 0.6) list.push({ z: p + rand() * 5 - 2.5, x: r + hw + 2.4 });
        if (rand() > 0.6) list.push({ z: p + rand() * 5 - 2.5, x: r - hw - 2.4 });
      }
    }
    return list;
  }, []);

  const manholes = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    const rand = makeRand(456);
    for (const r of roads) {
      for (let p = -HALF_CITY + 20; p < HALF_CITY - 20; p += 35) {
        if (rand() > 0.45) list.push({ x: p + rand() * 8 - 4, z: r - 2 });
        if (rand() > 0.45) list.push({ z: p + rand() * 8 - 4, x: r + 2 });
      }
    }
    return list;
  }, []);

  // Beach props scattered in the sandy ring outside the city (dist 165–230)
  const beachItems = useMemo(() => {
    const rand = makeRand(9977);
    const umbrellas: { x: number; z: number; rot: number; ci: number }[] = [];
    const loungers:  { x: number; z: number; rot: number }[] = [];
    const balls:     { x: number; z: number; ci: number }[] = [];
    const towels:    { x: number; z: number; rot: number; ci: number }[] = [];
    let uci = 0, bci = 0, tci = 0;
    const COUNT = 28;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + (rand() - 0.5) * 0.4;
      const dist  = 168 + rand() * 52;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const facingIn = angle + Math.PI + (rand() - 0.5) * 0.6;

      umbrellas.push({ x, z, rot: facingIn, ci: uci++ });

      // Lounger(s) next to each umbrella
      const lOff = (rand() - 0.5) * 3.5;
      loungers.push({ x: x + Math.cos(angle + Math.PI / 2) * lOff + Math.cos(angle) * 2.5,
                      z: z + Math.sin(angle + Math.PI / 2) * lOff + Math.sin(angle) * 2.5,
                      rot: facingIn });
      if (rand() > 0.45) {
        loungers.push({ x: x + Math.cos(angle + Math.PI / 2) * (lOff + 1.2) + Math.cos(angle) * 2.5,
                        z: z + Math.sin(angle + Math.PI / 2) * (lOff + 1.2) + Math.sin(angle) * 2.5,
                        rot: facingIn });
      }

      // Towel near the umbrella
      towels.push({ x: x + (rand() - 0.5) * 4, z: z + (rand() - 0.5) * 4,
                    rot: rand() * Math.PI, ci: tci++ });

      // Occasional beach ball
      if (rand() > 0.55) {
        balls.push({ x: x + (rand() - 0.5) * 6, z: z + (rand() - 0.5) * 6, ci: bci++ });
      }
    }
    return { umbrellas, loungers, balls, towels };
  }, []);



  const citySpan = CITY_SIZE * BLOCK_SIZE + ROAD_WIDTH;

  return (
    <group>
      {/* ── Ocean & Beach ───────────────────────────────────────────────────── */}
      {/* Deep ocean — fills the whole horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshLambertMaterial color="#1A6FAA" />
      </mesh>
      {/* Shallow surf band — lighter teal ring around the island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[760, 760]} />
        <meshLambertMaterial color="#3AAECC" />
      </mesh>
      {/* Wet sand / shoreline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[520, 520]} />
        <meshLambertMaterial color="#D4BA6E" />
      </mesh>

      {/* ── Ground ─────────────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[citySpan + 60, citySpan + 60]} />
        <meshLambertMaterial color="#4A4844" />
      </mesh>

      {/* Block ground pads — dark urban base under buildings */}
      {centers.map(([cx, cz], i) => (
        <mesh key={`grass-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]}>
          <planeGeometry args={[BLOCK_SIZE - ROAD_WIDTH + 1, BLOCK_SIZE - ROAD_WIDTH + 1]} />
          <meshLambertMaterial color={i % 3 === 0 ? "#4E4C48" : i % 3 === 1 ? "#484644" : "#4A4846"} />
        </mesh>
      ))}

      {/* ── Roads ─────────────────────────────────────────────────────────── */}
      {roads.map((z) => (
        <mesh key={`hz-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}>
          <planeGeometry args={[citySpan, ROAD_WIDTH]} />
          <meshLambertMaterial color="#22252B" />
        </mesh>
      ))}
      {roads.map((x) => (
        <mesh key={`vx-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, 0]}>
          <planeGeometry args={[ROAD_WIDTH, citySpan]} />
          <meshLambertMaterial color="#22252B" />
        </mesh>
      ))}

      {/* ── Road markings ────────────────────────────────────────────────── */}
      {/* Horizontal road centre dashes — skip intersection zones */}
      {roads.map((z) =>
        Array.from({ length: Math.floor(citySpan / 12) }, (_, i) => {
          const x = -citySpan / 2 + i * 12 + 4;
          const atIntersection = roads.some(rx => Math.abs(x - rx) < ROAD_WIDTH / 2 + 1);
          if (atIntersection) return null;
          return (
            <mesh key={`hd-${z}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, z]}>
              <planeGeometry args={[7, 0.4]} />
              <meshBasicMaterial color="#FFFFFF" opacity={0.85} transparent />
            </mesh>
          );
        })
      )}
      {/* Vertical road centre dashes — skip intersection zones */}
      {roads.map((x) =>
        Array.from({ length: Math.floor(citySpan / 12) }, (_, i) => {
          const z = -citySpan / 2 + i * 12 + 4;
          const atIntersection = roads.some(rz => Math.abs(z - rz) < ROAD_WIDTH / 2 + 1);
          if (atIntersection) return null;
          return (
            <mesh key={`vd-${x}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, z]}>
              <planeGeometry args={[0.4, 7]} />
              <meshBasicMaterial color="#FFFFFF" opacity={0.85} transparent />
            </mesh>
          );
        })
      )}


      {/* Sidewalks — tiled concrete slabs */}
      {centers.map(([cx, cz], i) => (
        <mesh key={`sw-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, cz]}>
          <planeGeometry args={[BLOCK_SIZE - ROAD_WIDTH + 0.4, BLOCK_SIZE - ROAD_WIDTH + 0.4]} />
          <meshLambertMaterial map={getSidewalkTex()} />
        </mesh>
      ))}

      {/* Curbs — raised stone lip at each block edge */}
      {centers.map(([cx, cz], i) => {
        const sw = BLOCK_SIZE - ROAD_WIDTH + 0.4; // 50.4
        const hw = sw / 2;                         // 25.2
        const ch = 0.19;                           // curb height
        const cd = 0.72;                           // curb depth (road-facing dimension)
        const CURB = "#9A9490";
        const WEAR = "#787270";                    // darker wear strip on road face
        return (
          <group key={`curb-${i}`}>
            {/* North */}
            <mesh position={[cx, ch / 2, cz - hw - cd / 2 + 0.02]}>
              <boxGeometry args={[sw + cd * 2, ch, cd]} />
              <meshLambertMaterial color={CURB} />
            </mesh>
            <mesh position={[cx, ch * 0.3, cz - hw - cd + 0.02]}>
              <boxGeometry args={[sw + cd * 2, ch * 0.6, 0.12]} />
              <meshLambertMaterial color={WEAR} />
            </mesh>
            {/* South */}
            <mesh position={[cx, ch / 2, cz + hw + cd / 2 - 0.02]}>
              <boxGeometry args={[sw + cd * 2, ch, cd]} />
              <meshLambertMaterial color={CURB} />
            </mesh>
            <mesh position={[cx, ch * 0.3, cz + hw + cd - 0.02]}>
              <boxGeometry args={[sw + cd * 2, ch * 0.6, 0.12]} />
              <meshLambertMaterial color={WEAR} />
            </mesh>
            {/* West */}
            <mesh position={[cx - hw - cd / 2 + 0.02, ch / 2, cz]}>
              <boxGeometry args={[cd, ch, sw]} />
              <meshLambertMaterial color={CURB} />
            </mesh>
            <mesh position={[cx - hw - cd + 0.02, ch * 0.3, cz]}>
              <boxGeometry args={[0.12, ch * 0.6, sw]} />
              <meshLambertMaterial color={WEAR} />
            </mesh>
            {/* East */}
            <mesh position={[cx + hw + cd / 2 - 0.02, ch / 2, cz]}>
              <boxGeometry args={[cd, ch, sw]} />
              <meshLambertMaterial color={CURB} />
            </mesh>
            <mesh position={[cx + hw + cd - 0.02, ch * 0.3, cz]}>
              <boxGeometry args={[0.12, ch * 0.6, sw]} />
              <meshLambertMaterial color={WEAR} />
            </mesh>
          </group>
        );
      })}






      {/* ── GLB Buildings ─────────────────────────────────────────────────── */}
      <group position={[-120, 0, -120]}><GLBBuilding path="/models/game_ready_mid_poly_building.glb" scale={130} yOffset={-4} /></group>
      <group position={[-60,  0, -120]}><GLBBuilding path="/models/game_ready_building_5.glb" scale={80} zOffset={8} /></group>
      <group position={[0,    0, -120]}><GLBBuilding path="/models/chicago_b2.glb" scale={0.22} /></group>
      <group position={[60,   0, -120]}><GLBBuilding path="/models/game_ready_city_buildings.glb" scale={12} /></group>
      <group position={[120,  0, -120]}><GLBBuilding path="/models/game_ready_mid_poly_building_2.glb" scale={120} /></group>
      <group position={[-120, 0, -60]}><GLBBuilding path="/models/bayard_building_opt.glb" scale={1} /></group>
      <group position={[-60,  0, -60]}><GLBBuilding path="/models/game_ready_city_buildings.glb" scale={12} /></group>
      <group position={[0,    0, -60]}><GLBBuilding path="/models/game_ready_mid_poly_building.glb" scale={130} yOffset={-4} /></group>
      <group position={[60,   0, -60]}><GLBBuilding path="/models/chicago_b2.glb" scale={0.22} /></group>
      <group position={[120,  0, -60]}><GLBBuilding path="/models/game_ready_building_5.glb" scale={80} zOffset={8} /></group>
      <group position={[-120, 0, 0]}><GLBBuilding path="/models/game_ready_mid_poly_building_2.glb" scale={120} /></group>
      <group position={[-60,  0, 0]}><GLBBuilding path="/models/chicago_b2.glb" scale={0.22} /></group>
      <group position={[0,    0, 0]}><GLBBuilding path="/models/game_ready_building_5.glb" scale={80} zOffset={8} /></group>
      <group position={[60,   0, 0]}><GLBBuilding path="/models/bayard_building_opt.glb" scale={1} /></group>
      <group position={[120,  0, 0]}><GLBBuilding path="/models/game_ready_city_buildings.glb" scale={12} /></group>
      <group position={[-120, 0, 60]}><GLBBuilding path="/models/game_ready_building_5.glb" scale={80} zOffset={8} /></group>
      <group position={[-60,  0, 60]}><GLBBuilding path="/models/game_ready_mid_poly_building.glb" scale={130} yOffset={-4} /></group>
      <group position={[0,    0, 60]}><GLBBuilding path="/models/bayard_building_opt.glb" scale={1} /></group>
      <group position={[60,   0, 60]}><GLBBuilding path="/models/game_ready_mid_poly_building_2.glb" scale={120} /></group>
      <group position={[120,  0, 60]}><GLBBuilding path="/models/chicago_b2.glb" scale={0.22} /></group>
      <group position={[-120, 0, 120]}><GLBBuilding path="/models/game_ready_city_buildings.glb" scale={12} /></group>
      <group position={[-60,  0, 120]}><GLBBuilding path="/models/bayard_building_opt.glb" scale={1} /></group>
      <group position={[0,    0, 120]}><GLBBuilding path="/models/game_ready_mid_poly_building.glb" scale={130} yOffset={-4} /></group>
      <group position={[60,   0, 120]}><GLBBuilding path="/models/chicago_b2.glb" scale={0.22} /></group>
      <group position={[120,  0, 120]}><GLBBuilding path="/models/game_ready_mid_poly_building_2.glb" scale={120} /></group>

      {/* ── Bus Stops ─────────────────────────────────────────────────────── */}
      {busStops.map((s, i) => <BusStop key={`bs-${i}`} x={s.x} z={s.z} rot={s.rot} />)}

      {/* ── Fire Hydrants ─────────────────────────────────────────────────── */}
      {hydrants.map((h, i) => <Hydrant key={`hy-${i}`} x={h.x} z={h.z} />)}




      {/* ── Benches ───────────────────────────────────────────────────────── */}
      {benches.map((s, i) => <Bench key={`bn-${i}`} x={s.x} z={s.z} rot={s.rot} />)}

      {/* ── Mailboxes ─────────────────────────────────────────────────────── */}
      {mailboxes.map((m, i) => <Mailbox key={`mb-${i}`} x={m.x} z={m.z} />)}

      {/* ── Trash Cans ────────────────────────────────────────────────────── */}
      {trashCans.map((t, i) => <TrashCan key={`tc-${i}`} x={t.x} z={t.z} />)}


      {/* ── Manhole covers ────────────────────────────────────────────────── */}
      {manholes.map((m, i) => (
        <mesh key={`mh-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[m.x, 0.025, m.z]}>
          <circleGeometry args={[0.55, 10]} />
          <meshBasicMaterial color="#252220" />
        </mesh>
      ))}

      {/* ── Street Lights ─────────────────────────────────────────────────── */}
      {roads.map((x) =>
        roads.map((z) => (
          <group key={`sl-${x}-${z}`} position={[x + ROAD_WIDTH / 2 + 1, 0, z + ROAD_WIDTH / 2 + 1]}>
            <mesh position={[0, 3.2, 0]}>
              <cylinderGeometry args={[0.09, 0.13, 6.4, 6]} />
              <meshLambertMaterial color="#333" />
            </mesh>
            <mesh position={[-0.9, 6.4, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 1.8, 5]} />
              <meshLambertMaterial color="#333" />
            </mesh>
            <mesh position={[-1.65, 5.85, 0]}>
              <boxGeometry args={[0.55, 0.22, 0.35]} />
              <meshLambertMaterial color="#111" />
            </mesh>
            <mesh position={[-1.65, 5.65, 0]}><sphereGeometry args={[0.18, 5, 4]} /><meshBasicMaterial color="#FFF8CC" /></mesh>
          </group>
        ))
      )}

      {/* ── Beach Decor ───────────────────────────────────────────────────── */}
      {beachItems.loungers.map((l, i)  => <SunLounger   key={`sl-${i}`} {...l} />)}
    </group>
  );
}
