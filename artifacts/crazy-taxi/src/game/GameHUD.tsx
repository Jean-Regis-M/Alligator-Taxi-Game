import { useEffect, useRef, useState } from "react";
import { useGameStore } from "./useGameStore";
import { initAudio, setMusicVolume, setSfxVolume } from "./audio";
import type { ReputationLevel } from "./types";

function Speedometer({ velocity }: { velocity: number }) {
  const mph = Math.round(Math.abs(velocity) * 3.2);
  const maxMph = 80;
  const pct = Math.min(mph / maxMph, 1);
  const angle = -135 + pct * 270;

  return (
    <>
      <div style={{
        position: "fixed",
        bottom: 18,
        left: 18,
        width: 170,
        height: 170,
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 55%, #242424 30%, #181818 65%, #0e0e0e 100%)",
        border: "5px solid #3a3a3a",
        boxShadow: "0 4px 24px rgba(0,0,0,0.9), inset 0 0 18px rgba(0,0,0,0.7)",
        zIndex: 200,
        overflow: "hidden",
      }}>
        {/* Tick marks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const a = -135 + i * 33.75;
          return (
            <div key={i} style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 2, height: i % 2 === 0 ? 14 : 9,
              background: i % 2 === 0 ? "#aaa" : "#666",
              transformOrigin: "top center",
              transform: `translateX(-50%) rotate(${a}deg) translateY(-70px)`,
              borderRadius: 1,
            }} />
          );
        })}
        {/* Needle */}
        <div style={{
          position: "absolute",
          bottom: "50%",
          left: "50%",
          width: 3,
          height: 62,
          background: "linear-gradient(to top, #ff3300 30%, #ffffff 100%)",
          transformOrigin: "bottom center",
          transform: `translateX(-50%) rotate(${angle}deg)`,
          borderRadius: 2,
          transition: "transform 0.07s linear",
          boxShadow: "0 0 5px rgba(255,80,0,0.6)",
        }} />
        {/* Center hub */}
        <div style={{
          position: "absolute",
          width: 16, height: 16,
          borderRadius: "50%",
          background: "radial-gradient(circle, #888 30%, #444 100%)",
          border: "2px solid #999",
          bottom: "calc(50% - 8px)",
          left: "calc(50% - 8px)",
          zIndex: 2,
        }} />
        {/* Speed number */}
        <div style={{
          position: "absolute",
          bottom: 30,
          left: 0, right: 0,
          textAlign: "center",
          fontSize: 52,
          fontFamily: "Impact, Arial Black, sans-serif",
          color: "#ffffff",
          lineHeight: 1,
          letterSpacing: -1,
        }}>{String(mph).padStart(3, "0")}</div>
        <div style={{
          position: "absolute",
          bottom: 14,
          left: 0, right: 0,
          textAlign: "center",
          fontSize: 13,
          fontFamily: "Impact, Arial Black, sans-serif",
          color: "#aaaaaa",
          letterSpacing: 4,
        }}>MPH</div>
      </div>
      {/* DOWNTOWN label */}
      <div style={{
        position: "fixed",
        bottom: 6,
        left: 18,
        width: 170,
        textAlign: "center",
        color: "rgba(255,255,255,0.55)",
        fontSize: 11,
        fontFamily: "Impact, Arial Black, sans-serif",
        letterSpacing: 3,
        zIndex: 200,
      }}>DOWNTOWN</div>
      {/* Developer label */}
      <div style={{
        position: "fixed",
        bottom: 6,
        right: 18,
        width: 170,
        textAlign: "center",
        color: "rgba(255,255,255,0.55)",
        fontSize: 11,
        fontFamily: "Impact, Arial Black, sans-serif",
        letterSpacing: 3,
        zIndex: 200,
      }}>REGIS</div>
    </>
  );
}

// ── Gator quip speech bubble ──────────────────────────────────────────────────
function QuipBubble({ quip }: { quip: string }) {
  const [visible, setVisible] = useState(true);
  const [cur, setCur] = useState(quip);

  useEffect(() => {
    setCur(quip);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, [quip]);

  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 90,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.88)",
        border: "2px solid #2ecc71",
        borderRadius: 20,
        padding: "8px 20px",
        color: "#2ecc71",
        fontSize: 17,
        fontFamily: "Impact, Arial Black, sans-serif",
        letterSpacing: 1,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        animation: "fadeInOut 2.8s ease forwards",
        zIndex: 100,
      }}
    >
      🐊 &quot;{cur}&quot;
    </div>
  );
}

// ── Mute button ───────────────────────────────────────────────────────────────
function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={muted ? "Unmute" : "Mute"}
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 300,
        background: "rgba(0,10,5,0.85)",
        border: "2px solid rgba(46,204,113,0.5)",
        borderRadius: 10,
        color: "#fff",
        fontSize: 20,
        width: 44,
        height: 44,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        pointerEvents: "auto",
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

// ── Main HUD ──────────────────────────────────────────────────────────────────
export default function GameHUD() {
  const {
    gameState,
    score,
    timeLeft,
    waitingPassengers,
    activePassenger,
    lastQuip,
    trips,
    highScore,
    taxiVelocity,
    startGame,
    toMenu,
    tick,
    upgradeLevels,
    timeOfDay,
    purchaseUpgrade,
    getUpgradeCost,
    useBoost,
    fuel,
    driftScore,
    driftCombo,
    isDrifting,
    isPerfectDriftActive,
    getReputationLevel,
    getReputationLevelName,
  } = useGameStore();

  const lastTimeRef = useRef<number | null>(null);
  const [muted, setMuted] = useState(false);
  const audioStarted = useRef(false);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (gameState !== "playing") return;
    const keyToUpgrade: { [key: string]: keyof typeof upgradeLevels } = {
      "1": "speed",
      "2": "acceleration",
      "3": "handling",
      "4": "braking",
    };
    const category = keyToUpgrade[e.key];
    if (category) {
      const cost = getUpgradeCost(category);
      if (score >= cost) {
        purchaseUpgrade(category);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, score, getUpgradeCost, purchaseUpgrade]);

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") { lastTimeRef.current = null; return; }
    let animId: number;
    const loop = (now: number) => {
      if (lastTimeRef.current !== null) tick((now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, tick]);

  const handleMute = () => {
    const next = !muted;
    setMuted(next);
    setMusicVolume(next ? 0 : 0.45);
    setSfxVolume(next ? 0 : 1.0);
  };

  const handleStartGame = () => {
    if (!audioStarted.current) {
      initAudio();
      audioStarted.current = true;
    }
    startGame();
  };

  // ── MENU ────────────────────────────────────────────────────────────────────
  if (gameState === "menu") {
    return (
      <>
        <MuteButton muted={muted} onToggle={handleMute} />
        <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <div
            className="pointer-events-auto flex flex-col items-center gap-4 px-10 py-8 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(0,20,5,0.97) 0%, rgba(10,40,10,0.98) 100%)",
              border: "3px solid #2ecc71",
              boxShadow: "0 0 60px #2ecc7188, 0 8px 40px rgba(0,0,0,0.9)",
              maxWidth: 520,
            }}
          >
            <div style={{ fontSize: 56, lineHeight: 1, filter: "drop-shadow(0 0 12px #2ecc71)" }}>🐊</div>
            <div
              style={{
                fontSize: 50,
                fontWeight: 900,
                fontFamily: "Impact, Arial Black, sans-serif",
                color: "#2ecc71",
                textShadow: "0 0 24px #2ecc71aa, 4px 4px 0 #145a32",
                letterSpacing: 4,
                textTransform: "uppercase",
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              GATOR<br />TAXI
            </div>
            <div style={{ color: "#a8d8a0", fontSize: 13, marginTop: -4, textAlign: "center" }}>
              The city&apos;s coldest-blooded cab service
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 14,
                color: "#eee",
                lineHeight: 2,
                textAlign: "center",
                border: "1px solid rgba(46,204,113,0.3)",
              }}
            >
              <span style={{ color: "#2ecc71", fontWeight: "bold" }}>W / ↑</span>&nbsp; Gas it!
              &nbsp;&nbsp;
              <span style={{ color: "#2ecc71", fontWeight: "bold" }}>S / ↓</span>&nbsp; Bite the brakes
              <br />
              <span style={{ color: "#2ecc71", fontWeight: "bold" }}>A / ←</span>&nbsp; Snap left
              &nbsp;&nbsp;
              <span style={{ color: "#2ecc71", fontWeight: "bold" }}>D / →</span>&nbsp; Snap right
              <br />
              <span style={{ color: "#FFD700" }}>Drive to a glowing passenger to pick them up!</span>
            </div>

            {highScore > 0 && (
              <div style={{ color: "#FFD700", fontSize: 15, fontWeight: "bold" }}>
                🏆 Best Run: ${highScore.toLocaleString()}
              </div>
            )}

            <div style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
              Developed by REGIS
            </div>

            <button
              onClick={handleStartGame}
              style={{
                marginTop: 8,
                padding: "15px 56px",
                fontSize: 24,
                fontWeight: 900,
                fontFamily: "Impact, Arial Black, sans-serif",
                background: "linear-gradient(180deg, #2ecc71 0%, #1a8a3c 100%)",
                color: "#000",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                letterSpacing: 3,
                textTransform: "uppercase",
                boxShadow: "0 5px 0 #145a32, 0 0 24px #2ecc7155",
              }}
            >
              START ENGINE 🐊
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── GAME OVER ────────────────────────────────────────────────────────────────
  if (gameState === "gameover") {
    const isNewHigh = score >= highScore && score > 0;
    return (
      <>
        <MuteButton muted={muted} onToggle={handleMute} />
        <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <div
            className="pointer-events-auto flex flex-col items-center gap-5 px-10 py-8 rounded-2xl"
            style={{
              background: "rgba(5,5,5,0.97)",
              border: "3px solid #e74c3c",
              boxShadow: "0 0 50px #e74c3c66",
              maxWidth: 460,
            }}
          >
            <div style={{ fontSize: 42, lineHeight: 1 }}>😤🐊</div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                fontFamily: "Impact, Arial Black, sans-serif",
                color: "#e74c3c",
                textShadow: "0 0 20px #e74c3c",
                letterSpacing: 4,
                textAlign: "center",
              }}
            >
              SNAPPED!
              <br />
              <span style={{ fontSize: 18, color: "#aaa", letterSpacing: 2 }}>OUT OF TIME</span>
            </div>

            <div style={{ display: "flex", gap: 36, marginTop: 4 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: 11, letterSpacing: 2 }}>EARNINGS</div>
                <div style={{ color: "#FFD700", fontSize: 34, fontFamily: "Impact, sans-serif" }}>
                  ${score.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: 11, letterSpacing: 2 }}>TRIPS</div>
                <div style={{ color: "#fff", fontSize: 34, fontFamily: "Impact, sans-serif" }}>{trips}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: 11, letterSpacing: 2 }}>BEST</div>
                <div style={{ color: "#FFD700", fontSize: 34, fontFamily: "Impact, sans-serif" }}>
                  ${highScore.toLocaleString()}
                </div>
              </div>
            </div>

            {isNewHigh && (
              <div
                style={{
                  color: "#FFD700",
                  fontSize: 20,
                  fontFamily: "Impact, sans-serif",
                  letterSpacing: 3,
                  animation: "pulse 0.6s infinite alternate",
                }}
              >
                🏆 NEW RECORD! 🏆
              </div>
            )}

            {driftScore > 0 && (
              <div style={{ color: "#FFD700", fontSize: 16, fontFamily: "Impact, sans-serif", marginTop: 4 }}>
                🐊 Drift Score: ${driftScore.toLocaleString()}
              </div>
            )}

            <div style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
              Developed by REGIS
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
              <button
                onClick={handleStartGame}
                style={{
                  padding: "13px 36px",
                  fontSize: 20,
                  fontWeight: 900,
                  fontFamily: "Impact, sans-serif",
                  background: "linear-gradient(180deg, #2ecc71 0%, #1a8a3c 100%)",
                  color: "#000",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  letterSpacing: 2,
                }}
              >
                AGAIN 🐊
              </button>
              <button
                onClick={toMenu}
                style={{
                  padding: "13px 28px",
                  fontSize: 20,
                  fontWeight: 900,
                  fontFamily: "Impact, sans-serif",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "2px solid #555",
                  borderRadius: 10,
                  cursor: "pointer",
                  letterSpacing: 2,
                }}
              >
                MENU
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PLAYING HUD ──────────────────────────────────────────────────────────────
  const timePercent = Math.max(0, Math.min(100, (timeLeft / 99) * 100));
  const timeColor = timeLeft < 15 ? "#e74c3c" : timeLeft < 30 ? "#f39c12" : "#2ecc71";
  const isUrgent = timeLeft < 15;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{ fontFamily: "Impact, Arial Black, sans-serif" }}
    >
      <MuteButton muted={muted} onToggle={handleMute} />
      <Speedometer velocity={taxiVelocity} />

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 20,
          padding: "8px 28px",
          background: "rgba(0,10,5,0.82)",
          borderRadius: 14,
          border: "2px solid rgba(46,204,113,0.45)",
          alignItems: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ fontSize: 26, lineHeight: 1 }}>🐊</div>

        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>EARNINGS</div>
          <div style={{ color: "#FFD700", fontSize: 28, lineHeight: 1 }}>${score.toLocaleString()}</div>
        </div>

        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />

        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>TIME</div>
          <div
            style={{
              color: timeColor,
              fontSize: 38,
              lineHeight: 1,
              animation: isUrgent ? "pulse 0.45s infinite alternate" : "none",
            }}
          >
            {Math.ceil(timeLeft)}
          </div>
          <div style={{ height: 4, width: 80, background: "#222", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${timePercent}%`,
                background: timeColor,
                transition: "width 0.1s, background 0.3s",
                borderRadius: 2,
              }}
            />
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />

        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>TRIPS</div>
          <div style={{ color: "#fff", fontSize: 28, lineHeight: 1 }}>{trips}</div>
        </div>

        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />

        <div style={{ textAlign: "center", minWidth: 100 }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>UPGRADES</div>
          <div style={{ color: "#fff", fontSize: 20, fontFamily: "monospace", letterSpacing: 1 }}>
            Spd:{upgradeLevels.speed} Acc:{upgradeLevels.acceleration} Hnd:{upgradeLevels.handling} Brk:{upgradeLevels.braking}
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />

        <div style={{ textAlign: "center", minWidth: 100 }}>
          <div style={{ color: isDrifting ? "#ffeb3b" : "#888", fontSize: 10, letterSpacing: 2 }}>DRIFT</div>
          <div style={{ color: isDrifting ? "#ffeb3b" : "#fff", fontSize: 20, fontFamily: "monospace", letterSpacing: 1 }}>
            Score:{driftScore.toLocaleString()} Combo:{driftCombo}x
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />

        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>TIME OF DAY</div>
          <div style={{ color: "#fff", fontSize: 20, display: "flex", alignItems: "center", gap: 4 }}>
            {/* Sun/Moon icon */}
            <span style={{ fontSize: 24 }}>{timeOfDay < 0.25 || timeOfDay > 0.75 ? "🌙" : timeOfDay < 0.5 ? "🌤️" : "☀️"}</span>
            <div>
              <div style={{ fontSize: 14, fontFamily: "monospace" }}>
                {String(Math.floor(timeOfDay * 24)).padStart(2, "0")}:{String(Math.floor((timeOfDay * 24 * 60) % 60)).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />
        <div style={{ textAlign: "center", minWidth: 100 }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>DEVELOPER</div>
          <div style={{ color: "#fff", fontSize: 18, fontFamily: "Impact, Arial Black, sans-serif", letterSpacing: 1 }}>
            REGIS
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />
        <div style={{ textAlign: "center", minWidth: 100 }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>REPUTATION</div>
          <div style={{ color: "#fff", fontSize: 18, fontFamily: "Impact, Arial Black, sans-serif", letterSpacing: 1 }}>
            {getReputationLevelName()}
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />
        <div style={{ textAlign: "center", minWidth: 100 }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 2 }}>FUEL</div>
          <div style={{ color: "#fff", fontSize: 20, fontFamily: "monospace" }}>
            {/* Fuel bar */}
            <div style={{
              width: 80,
              height: 12,
              background: "#222",
              borderRadius: 6,
              overflow: "hidden",
              margin: "4px auto 0",
            }}>
              <div
                style={{
                  height: "100%",
                  width: `${fuel}%`,
                  background: "linear-gradient(to right, #e74c3c, #f1c40f, #2ecc71)",
                  transition: "width 0.1s",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "#ccc" }}>
              {Math.round(fuel)}%
            </div>
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: "rgba(46,204,113,0.3)" }} />

      {/* Waiting fares panel */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ color: "#2ecc71", fontSize: 11, letterSpacing: 2, marginBottom: 2 }}>
          WAITING FARES ({waitingPassengers.length})
        </div>
        {waitingPassengers.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,10,5,0.8)",
              border: `1px solid ${p.color}55`,
              borderLeft: `3px solid ${p.color}`,
              borderRadius: 8,
              padding: "5px 10px",
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 18 }}>{p.emoji}</div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>{p.name}</div>
              <div style={{ color: "#888", fontSize: 10 }}>→ {p.destLabel}</div>
            </div>
            <div style={{ marginLeft: "auto", color: "#FFD700", fontSize: 12 }}>${p.reward}</div>
          </div>
        ))}
      </div>

      {/* Active passenger */}
      {activePassenger && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 28px",
            background: "rgba(0,10,5,0.92)",
            borderRadius: 14,
            border: `2px solid ${activePassenger.color}`,
            boxShadow: `0 0 20px ${activePassenger.color}44`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 300,
          }}
        >
          <div style={{ fontSize: 32 }}>{activePassenger.emoji}</div>
          <div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: "#fff", fontSize: 13, letterSpacing: 2 }}>
                ON BOARD: <span style={{ color: activePassenger.color }}>{activePassenger.name}</span>
                {activePassenger.isVip && <span style={{ color: "#FFD700", marginLeft: 4 }}>👑 VIP</span>}
                {activePassenger.isTimeSensitive && (
                  <span style={{ color: "#ffeb3b", marginLeft: 4 }}>
                    ⏰ {Math.ceil(activePassenger.timeLimit / 60)}s limit
                  </span>
                )}
              </div>
              {activePassenger.specialRequest && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <span style={{
                    background: `rgba(0,0,0,0.3)`,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    color: "#ffeb3b"
                  }}>
                    SPECIAL REQUEST
                  </span>
                  <span style={{ fontSize: 10, color: "#ccc", textTransform: "capitalize" }}>
                    {activePassenger.specialRequest}
                  </span>
                </div>
              )}
              <div style={{ color: "#e74c3c", fontSize: 18, fontWeight: 900, lineHeight: 1.3, marginTop: 2 }}>
                🏁 {activePassenger.destLabel}
              </div>
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "center" }}>
            <div style={{ color: "#888", fontSize: 10, letterSpacing: 1 }}>REWARD</div>
            <div style={{ color: "#FFD700", fontSize: 22 }}>${activePassenger.reward}</div>
            <div style={{ color: "#2ecc71", fontSize: 10 }}>+20s bonus</div>
          </div>
        </div>
      )}

      {/* No passenger hint */}
      {!activePassenger && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 24px",
            background: "rgba(0,10,5,0.8)",
            borderRadius: 12,
            border: "2px solid #2ecc7155",
            color: "#2ecc71",
            fontSize: 15,
            letterSpacing: 1,
            animation: "pulse 1.2s infinite alternate",
          }}
        >
          🐊 Drive to a glowing passenger to pick them up!
        </div>
      )}

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 210,
          color: "rgba(255,255,255,0.35)",
          fontSize: 11,
          fontFamily: "sans-serif",
          textAlign: "right",
        }}
      >
        WASD / Arrows to drive
      </div>

      <style>{`
        @keyframes pulse { from { opacity: 1; } to { opacity: 0.35; } }
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0);    }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
