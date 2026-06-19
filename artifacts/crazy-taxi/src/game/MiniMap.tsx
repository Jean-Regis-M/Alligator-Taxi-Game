import { useEffect, useRef } from "react";
import { useGameStore } from "./useGameStore";
import * as THREE from "three";

interface MiniMapProps {
  taxiPosition: React.MutableRefObject<THREE.Vector3>;
  taxiRotation: React.MutableRefObject<number>;
}

const MAP_SIZE = 180;
const CITY_WORLD = 300; // full city span in world units
const SCALE = MAP_SIZE / CITY_WORLD;

function worldToMap(wx: number, wz: number): [number, number] {
  return [
    MAP_SIZE / 2 + wx * SCALE,
    MAP_SIZE / 2 + wz * SCALE,
  ];
}

export default function MiniMap({ taxiPosition, taxiRotation }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { waitingPassengers, activePassenger, gameState } = useGameStore();

  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "rgba(8, 18, 12, 0.94)";
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

      // Road grid
      const roads = [-150, -90, -30, 30, 90, 150];
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 4;
      for (const r of roads) {
        const [mx] = worldToMap(r, 0);
        ctx.beginPath();
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, MAP_SIZE);
        ctx.stroke();

        const [, mz] = worldToMap(0, r);
        ctx.beginPath();
        ctx.moveTo(0, mz);
        ctx.lineTo(MAP_SIZE, mz);
        ctx.stroke();
      }

      // Road centerlines
      ctx.strokeStyle = "#3a3a2a";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      for (const r of roads) {
        const [mx] = worldToMap(r, 0);
        ctx.beginPath();
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, MAP_SIZE);
        ctx.stroke();
        const [, mz] = worldToMap(0, r);
        ctx.beginPath();
        ctx.moveTo(0, mz);
        ctx.lineTo(MAP_SIZE, mz);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Waiting passengers — colored dots
      for (const p of waitingPassengers) {
        const [mx, mz] = worldToMap(p.position[0], p.position[2]);
        ctx.beginPath();
        ctx.arc(mx, mz, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Active destination — pulsing X marker
      if (activePassenger) {
        const [dx, dz] = worldToMap(activePassenger.destination[0], activePassenger.destination[2]);
        ctx.strokeStyle = "#ff2244";
        ctx.lineWidth = 2.5;
        const s = 7;
        ctx.beginPath();
        ctx.moveTo(dx - s, dz - s);
        ctx.lineTo(dx + s, dz + s);
        ctx.moveTo(dx + s, dz - s);
        ctx.lineTo(dx - s, dz + s);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(dx, dz, 9, 0, Math.PI * 2);
        ctx.strokeStyle = "#ff2244";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Taxi triangle ──────────────────────────────────────────────────────
      // World forward = (sin(rot), 0, cos(rot))
      // Canvas: world-X→canvas-X, world-Z→canvas-Y (positive Z goes DOWN)
      // Formula: ctx.rotate(Math.PI - angle) makes the tip point the right way.
      const [tx, tz] = worldToMap(taxiPosition.current.x, taxiPosition.current.z);
      const angle = taxiRotation.current;
      const triSize = 7;
      ctx.save();
      ctx.translate(tx, tz);
      ctx.rotate(Math.PI - angle); // corrected orientation
      ctx.beginPath();
      ctx.moveTo(0, -triSize);          // tip = forward
      ctx.lineTo(triSize * 0.65, triSize * 0.7);
      ctx.lineTo(-triSize * 0.65, triSize * 0.7);
      ctx.closePath();
      ctx.fillStyle = "#2ecc71";
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Border
      ctx.strokeStyle = "#2ecc71";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, MAP_SIZE - 2, MAP_SIZE - 2);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [waitingPassengers, activePassenger, gameState]);

  if (gameState !== "playing") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        right: 16,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 0 16px rgba(46,204,113,0.5), 0 4px 12px rgba(0,0,0,0.8)",
        border: "2px solid #2ecc71",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.85)",
          color: "#2ecc71",
          fontSize: 10,
          fontFamily: "Impact, sans-serif",
          letterSpacing: 2,
          textAlign: "center",
          padding: "2px 0",
        }}
      >
        GATOR MAP
      </div>
      <canvas ref={canvasRef} width={MAP_SIZE} height={MAP_SIZE} />
      <div
        style={{
          background: "rgba(0,0,0,0.85)",
          padding: "3px 6px",
          display: "flex",
          gap: 10,
          fontSize: 9,
          fontFamily: "sans-serif",
          color: "#ccc",
        }}
      >
        <span><span style={{ color: "#2ecc71" }}>▲</span> You</span>
        <span><span style={{ color: "#aaa" }}>●</span> Fare</span>
        <span><span style={{ color: "#ff2244" }}>✕</span> Drop</span>
      </div>
    </div>
  );
}
