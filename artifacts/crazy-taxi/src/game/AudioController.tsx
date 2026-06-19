import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "./useGameStore";
import { TAXI_SPEED } from "./constants";
import {
  initAudio,
  playMenuMusic,
  playGameMusic,
  stopMusic,
  startEngine,
  updateEngine,
  stopEngine,
  playPickup,
  playDropoff,
  playGameOver,
  playHighScore,
  playEngineStart,
  playTimerBeep,
  playScreech,
} from "./audio";

export default function AudioController() {
  const {
    gameState,
    taxiVelocity,
    timeLeft,
    score,
    highScore,
    trips,
  } = useGameStore();

  const prevGameState = useRef<string | null>(null);
  const prevTrips = useRef(trips);
  const prevPassengerPickedUp = useRef(false);
  const lastBeepTime = useRef(0);
  const lastScreechTime = useRef(0);
  const prevVelocity = useRef(0);
  const audioInited = useRef(false);

  // Subscribe to store to catch pickup/dropoff events
  const { activePassenger, waitingPassengers } = useGameStore();
  const prevWaitingCount = useRef(waitingPassengers.length);
  const prevActive = useRef<number | null>(null);

  // Init audio on first render
  useEffect(() => {
    if (!audioInited.current) {
      initAudio();
      audioInited.current = true;
    }
  }, []);

  // Game state transitions
  useEffect(() => {
    const prev = prevGameState.current;
    prevGameState.current = gameState;

    if (gameState === "menu") {
      stopEngine();
      playMenuMusic();
    }

    if (gameState === "playing" && prev !== "playing") {
      playGameMusic();
      playEngineStart();
      setTimeout(() => startEngine(), 400);
      prevTrips.current = 0;
      prevActive.current = null;
    }

    if (gameState === "gameover" && prev === "playing") {
      stopEngine();
      stopMusic();
      setTimeout(() => {
        if (score >= highScore && score > 0) {
          playHighScore();
        } else {
          playGameOver();
        }
      }, 300);
    }
  }, [gameState]);

  // Passenger pickup — detected when activePassenger appears
  useEffect(() => {
    if (gameState !== "playing") return;
    const currentId = activePassenger?.id ?? null;
    if (currentId !== null && prevActive.current === null) {
      playPickup();
    }
    prevActive.current = currentId;
  }, [activePassenger, gameState]);

  // Dropoff — detected when trips increases
  useEffect(() => {
    if (gameState !== "playing") return;
    if (trips > prevTrips.current) {
      prevTrips.current = trips;
      playDropoff();
    }
  }, [trips, gameState]);

  // Continuous frame updates — engine + screech + timer beep
  useFrame((_, delta) => {
    if (gameState !== "playing") return;

    const now = performance.now();

    // Engine update
    updateEngine(taxiVelocity, TAXI_SPEED);

    // Tire screech — when decelerating hard or turning at speed
    const decel = prevVelocity.current - taxiVelocity;
    prevVelocity.current = taxiVelocity;
    if (decel > 8 && Math.abs(taxiVelocity) > 5 && now - lastScreechTime.current > 600) {
      lastScreechTime.current = now;
      playScreech();
    }

    // Low-time beep
    if (timeLeft < 15 && timeLeft > 0) {
      const beepInterval = timeLeft < 5 ? 400 : timeLeft < 10 ? 700 : 1100;
      if (now - lastBeepTime.current > beepInterval) {
        lastBeepTime.current = now;
        const urgency = Math.max(0, Math.min(1, (15 - timeLeft) / 15));
        playTimerBeep(urgency);
      }
    }
  });

  return null;
}
