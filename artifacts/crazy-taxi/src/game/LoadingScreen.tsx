import { useProgress } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

export default function LoadingScreen() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [dots, setDots] = useState(".");
  const startTime = useRef(Date.now()).current;

  useEffect(() => {
    if (!active && progress >= 100) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 5000 - elapsed);
      const t = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 700);
      }, remaining);
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  useEffect(() => {
    const t = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 500);
    return () => clearInterval(t);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "#0a1520",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.7s ease",
    }}>
      {/* Emoji cab */}
      <div style={{ fontSize: 72, lineHeight: 1 }}>🐊🚕</div>

      {/* Title */}
      <div style={{
        fontFamily: "Impact, Arial Black, sans-serif",
        fontSize: "clamp(36px, 8vw, 72px)",
        color: "#FFD700",
        letterSpacing: 4,
        textShadow: "0 0 30px rgba(255,215,0,0.5)",
        textAlign: "center",
      }}>
        ALLIGATOR TAXI
      </div>

      {/* Tagline */}
      <div style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "clamp(13px, 2vw, 17px)",
        color: "#7aadcc",
        letterSpacing: 3,
        textTransform: "uppercase",
      }}>
        Drive Fast. Cause Chaos. Get Tips.
      </div>

      {/* Loading text */}
      <div style={{
        marginTop: 16,
        fontFamily: "Arial, sans-serif",
        fontSize: 15,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: 2,
        width: 120,
      }}>
        Loading{dots}
      </div>
    </div>
  );
}
