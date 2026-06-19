import { create } from "zustand";
import type {
  GameState,
  Passenger,
  PassengerPersonality,
  SpecialRequest,
  ReputationSystem,
  ReputationLevel,
  WeatherType,
  SeasonType,
  WeatherSystem
} from "./types";
import {
  INITIAL_TIME,
  TIME_BONUS,
  PASSENGER_NAMES,
  PASSENGER_EMOJIS,
  PASSENGER_COLORS,
  LANDMARK_NAMES,
  MAX_WAITING_PASSENGERS,
  randomIntersection,
  PERSONALITY_CONFIGS,
  VIP_TYPES,
  SPECIAL_REQUEST_CONFIGS,
  REPUTATION_THRESHOLDS,
  REPUTATION_LEVEL_NAMES,
  WEATHER_CONFIGS,
  SEASON_CONFIGS
} from "./constants";

let passengerIdCounter = 0;

function generatePassenger(excludePositions: Array<[number, number]> = []): Passenger {
  const nameIdx = Math.floor(Math.random() * PASSENGER_NAMES.length);
  const emojiIdx = Math.floor(Math.random() * PASSENGER_EMOJIS.length);
  const colorIdx = Math.floor(Math.random() * PASSENGER_COLORS.length);

  let destIdx = Math.floor(Math.random() * LANDMARK_NAMES.length);
  const destLabel = LANDMARK_NAMES[destIdx];

  let [px, pz] = randomIntersection();
  // avoid spawning on top of existing passengers
  let tries = 0;
  while (
    excludePositions.some(([ex, ez]) => Math.abs(ex - px) < 20 && Math.abs(ez - pz) < 20) &&
    tries < 20
  ) {
    [px, pz] = randomIntersection();
    tries++;
  }

  let [dx, dz] = randomIntersection();
  tries = 0;
  while (Math.abs(dx - px) < 40 && Math.abs(dz - pz) < 40 && tries < 15) {
    [dx, dz] = randomIntersection();
    tries++;
  }

  const dist = Math.sqrt((dx - px) ** 2 + (dz - pz) ** 2);
  const baseReward = Math.floor(dist / 10) * 60 + 150;

  // Determine if this passenger is VIP (15% chance)
  const isVip = Math.random() < 0.15;

  // Select personality (weighted toward VIP types if VIP)
  const personalityPool = isVip ? VIP_TYPES : PASSENGER_PERSONALITIES.filter(p => !VIP_TYPES.includes(p as any));
  const personalityIdx = Math.floor(Math.random() * personalityPool.length);
  const personality = personalityPool[personalityIdx] as PassengerPersonality;

  // Get personality config
  const personalityConfig = PERSONALITY_CONFIGS[personality];

  // Determine if this passenger has a special request (30% chance)
  const hasSpecialRequest = Math.random() < 0.3;
  let specialRequest: SpecialRequest | null = null;
  if (hasSpecialRequest) {
    const specialRequestIdx = Math.floor(Math.random() * SPECIAL_REQUESTS.length);
    specialRequest = SPECIAL_REQUESTS[specialRequestIdx] as SpecialRequest;
  }

  // Determine if this passenger is time-sensitive (20% chance)
  const isTimeSensitive = Math.random() < 0.2;
  const timeLimit = isTimeSensitive ? Math.floor(dist / 5) + 30 : 0; // 30-90 seconds based on distance

  // Calculate final reward based on VIP status, personality, and special requests
  let finalReward = baseReward;
  if (isVip && personalityConfig.isVip) {
    finalReward *= personalityConfig.baseRewardMultiplier;
  }

  // Apply special request modifiers
  if (specialRequest && SPECIAL_REQUEST_CONFIGS[specialRequest as keyof typeof SPECIAL_REQUEST_CONFIGS]) {
    finalReward *= SPECIAL_REQUEST_CONFIGS[specialRequest as keyof typeof SPECIAL_REQUEST_CONFIGS].bonusMultiplier;
  }

  // Calculate reputation impact based on personality
  const reputationImpact = personalityConfig.reputationImpact;

  return {
    id: ++passengerIdCounter,
    position: [px, 0, pz],
    destination: [dx, 0, dz],
    reward: Math.round(finalReward),
    name: PASSENGER_NAMES[nameIdx],
    destLabel,
    emoji: PASSENGER_EMOJIS[emojiIdx],
    color: PASSENGER_COLORS[colorIdx],
    personality,
    isVip,
    isTimeSensitive,
    timeLimit: Math.round(timeLimit),
    specialRequest,
    reputationImpact
  };
}

function generateInitialPassengers(): Passenger[] {
  const passengers: Passenger[] = [];
  for (let i = 0; i < MAX_WAITING_PASSENGERS; i++) {
    const exclude = passengers.map((p) => [p.position[0], p.position[2]] as [number, number]);
    passengers.push(generatePassenger(exclude));
  }
  return passengers;
}

interface GameStoreState {
  gameState: GameState;
  score: number;
  timeLeft: number;
  waitingPassengers: Passenger[];
  activePassenger: Passenger | null;
  lastQuip: string;
  trips: number;
  highScore: number;
  taxiVelocity: number;
  // Day-night cycle: 0 (midnight) to 1 (next midnight), 0.5 = noon
  timeOfDay: number;
  // Upgrade levels: 0-3 for each category
  upgradeLevels: {
    speed: number;
    acceleration: number;
    handling: number;
    braking: number;
  };
  // Fuel for boost (0-100)
  fuel: number;
  // Is boost button currently held?
  boosting: boolean;
  // Is currently drifting
  isDrifting: boolean;
  // Is perfect drift bonus active (max combo sustained)
  isPerfectDriftActive: boolean;
  // Drift system
  driftScore: number;
  driftCombo: number;
  // Reputation system
  reputation: ReputationSystem;
  // Weather and season system
  weather: WeatherSystem;
  startGame: () => void;
  endGame: () => void;
  toMenu: () => void;
  tick: (dt: number) => void;
  pickupPassenger: (id: number) => void;
  dropoffPassenger: () => void;
  setTaxiVelocity: (v: number) => void;
  applyCollisionPenalty: (penalty: number) => void;
  purchaseUpgrade: (category: keyof typeof upgradeLevels) => void;
  getUpgradeCost: (category: keyof typeof upgradeLevels) => number;
  // Boost related
  setBoosting: (isBoosting: boolean) => void;
  updateFuel: (dt: number) => void;
  // Drift related
  addDriftScore: (points: number) => void;
  setDriftCombo: (combo: number) => void;
  setIsDrifting: (isDrifting: boolean) => void;
  resetDrift: () => void;
  // Reputation related
  updateReputation: (points: number, personality: PassengerPersonality, isVip: boolean) => void;
  getReputationLevel: () => ReputationLevel;
  getReputationLevelName: () => string;
  // Weather related
  updateWeather: (dt: number) => void;
}

import { GATOR_QUIPS } from "./constants";

function randomQuip() {
  return GATOR_QUIPS[Math.floor(Math.random() * GATOR_QUIPS.length)];
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: "menu",
  score: 0,
  timeLeft: INITIAL_TIME,
  waitingPassengers: generateInitialPassengers(),
  activePassenger: null,
  lastQuip: GATOR_QUIPS[0],
  trips: 0,
  highScore: 0,
  taxiVelocity: 0,
  // Day-night cycle: 0 (midnight) to 1 (next midnight), 0.5 = noon
  timeOfDay: 0.5, // start at noon
  // Upgrade levels: 0-3 for each category
  upgradeLevels: {
    speed: 0,
    acceleration: 0,
    handling: 0,
    braking: 0,
  },
  // Fuel for boost (0-100)
  fuel: 100,
  // Is boost button currently held?
  boosting: false,
  // Drift system
  driftScore: 0,
  driftCombo: 1,
  startGame: () => {
    set({
      gameState: "playing",
      score: 0,
      timeLeft: INITIAL_TIME,
      waitingPassengers: generateInitialPassengers(),
      activePassenger: null,
      lastQuip: randomQuip(),
      trips: 0,
      taxiVelocity: 0,
      timeOfDay: 0.5, // reset to noon
      upgradeLevels: {
        speed: 0,
        acceleration: 0,
        handling: 0,
        braking: 0,
      },
      fuel: 100,
      boosting: false,
      isDrifting: false,
      isPerfectDriftActive: false,
      driftScore: 0,
      driftCombo: 1,
      // Initialize reputation system
      reputation: {
        level: "unknown",
        points: 0,
        personalityPrefs: {
          chatty: 0,
          silent: 0,
          generous: 0,
          impatient: 0,
          adventurous: 0,
          business: 0,
          elderly: 0,
          tourist: 0,
          celebrity: 0,
          athlete: 0,
          executive: 0,
          student: 0,
          elite: 0
        },
        vipServed: 0,
        onTimeDropouts: 0,
        drivingStyle: {
          speed: 50,
          safety: 50,
          fun: 50,
          efficiency: 50
        }
      },
      // Initialize weather and season system
      weather: {
        currentWeather: "clear",
        weatherTimer: Math.random() * 300 + 300, // 5-15 minutes until first weather change
        currentSeason: "spring",
        seasonProgress: Math.random() // Start at random point in season
      }
    });
  },

  endGame: () => {
    const { score, highScore } = get();
    set({
      gameState: "gameover",
      highScore: Math.max(score, highScore),
      activePassenger: null,
    });
  },

  toMenu: () => set({ gameState: "menu" }),

  tick: (dt: number) => {
    const { gameState, timeLeft, timeOfDay } = get();
    if (gameState !== "playing") return;
    const newTime = timeLeft - dt;
    if (newTime <= 0) {
      get().endGame();
    } else {
      // Advance time of day: full cycle (0 to 1) takes 120 seconds of gameplay
      const newTimeOfDay = timeOfDay + dt / 120;
      set({
        timeLeft: newTime,
        timeOfDay: newTimeOfDay % 1, // wrap around
      }, () => {
        // Update weather and seasons
        get().updateWeather(dt);
      });
    }
  },

  pickupPassenger: (id: number) => {
    const { waitingPassengers } = get();
    const passenger = waitingPassengers.find((p) => p.id === id);
    if (!passenger) return;
    set({
      activePassenger: passenger,
      waitingPassengers: waitingPassengers.filter((p) => p.id !== id),
      lastQuip: randomQuip(),
    });
  },

  dropoffPassenger: () => {
    const { score, trips, activePassenger, waitingPassengers, timeLeft } = get();
    if (!activePassenger) return;

    let finalReward = activePassenger.reward;
    let reputationPoints = Math.round(activePassenger.reputationImpact * 10); // Base reputation impact
    let isOnTime = true;
    let specialRequestSuccess = true;

    // Check time-sensitive passenger
    if (activePassenger.isTimeSensitive && activePassenger.timeLimit > 0) {
      const timeUsed = INITIAL_TIME - timeLeft; // Approximate time used for this trip
      if (timeUsed > activePassenger.timeLimit) {
        isOnTime = false;
        // Apply lateness penalty
        const latenessMinutes = Math.max(0, (timeUsed - activePassenger.timeLimit) / 60); // Convert to minutes
        const latenessPenalty = 1 - (latenessMinutes * SPECIAL_REQUEST_CONFIGS.eventDropoff.latenessPenalty);
        finalReward *= Math.max(0.5, latenessPenalty); // Never less than 50% of reward
        reputationPoints = Math.max(0, reputationPoints - Math.floor(latenessMinutes * 5)); // Lose reputation for being late
      } else {
        // Bonus for being on time with time-sensitive passenger
        finalReward *= 1.2;
        reputationPoints += 5;
      }
    }

    // Check special request fulfillment (simplified - in a real game this would check actual driving behavior)
    if (activePassenger.specialRequest) {
      const config = SPECIAL_REQUEST_CONFIGS[activePassenger.specialRequest as keyof typeof SPECIAL_REQUEST_CONFIGS];
      if (config) {
        // For now, we'll simulate a 70% success rate based on driving style matching request
        // In a real implementation, this would check actual trip data
        const successChance = 0.7; // Base success chance
        specialRequestSuccess = Math.random() < successChance;

        if (specialRequestSuccess) {
          // Apply special request bonus
          finalReward *= config.bonusMultiplier;
          reputationPoints += Math.floor(activePassenger.reward * 0.1); // Bonus reputation for fulfilling request
        } else {
          // Penalty for failing special request
          finalReward *= 0.8;
          reputationPoints = Math.max(0, reputationPoints - Math.floor(activePassenger.reward * 0.05)); // Small reputation penalty
        }
      }
    }

    // Update VIP served count if applicable
    const vipServedIncrement = activePassenger.isVip ? 1 : 0;

    // spawn a replacement passenger
    const existingPositions = waitingPassengers.map(
      (p) => [p.position[0], p.position[2]] as [number, number]
    );
    const newPassenger = generatePassenger(existingPositions);

    set({
      score: score + Math.round(finalReward),
      trips: trips + 1,
      activePassenger: null,
      waitingPassengers: [...waitingPassengers, newPassenger],
      timeLeft: Math.min(get().timeLeft + TIME_BONUS, 99),
      lastQuip: randomQuip(),
    }, () => {
      // Update reputation after the state is set
      if (reputationPoints !== 0 || vipServedIncrement > 0) {
        get().updateReputation(reputationPoints, activePassenger.personality, activePassenger.isVip);
      }
    });
  },

  setTaxiVelocity: (v: number) => set({ taxiVelocity: v }),

  applyCollisionPenalty: (penalty: number) => {
    const { score, gameState } = get();
    if (gameState !== "playing") return;
    set({ score: Math.max(0, score - penalty) });
  },
  purchaseUpgrade: (category) => {
    const { score, upgradeLevels } = get();
    const cost = getUpgradeCost(category);
    if (score >= cost) {
      set({
        score: score - cost,
        upgradeLevels: {
          ...upgradeLevels,
          [category]: upgradeLevels[category] + 1,
        },
      });
    }
  },
  getUpgradeCost: (category) => {
    const { upgradeLevels } = get();
    const level = upgradeLevels[category];
    // Base cost 500, increases by 500 per level
    return 500 + level * 500;
  },
  setBoosting: (isBoosting) => {
    set({ boosting: isBoosting });
  },
  updateFuel: (dt) => {
    set(state => {
      const drainRate = 50; // per second when boosting
      const regenRate = 25; // per second when not boosting
      let newFuel = state.fuel;
      if (state.boosting) {
        newFuel = Math.max(0, state.fuel - drainRate * dt);
      } else {
        newFuel = Math.min(100, state.fuel + regenRate * dt);
      }
      return { fuel: newFuel };
    });
  },
  // Drift related
  addDriftScore: (points) => {
    set({ score: state.score + points, driftScore: state.driftScore + points });
  },
  setDriftCombo: (combo) => {
    set({ driftCombo: combo });
  },
  setIsDrifting: (isDrifting) => {
    set({ isDrifting: isDrifting });
  },
  setIsPerfectDriftActive: (isPerfectDriftActive) => {
    set({ isPerfectDriftActive: isPerfectDriftActive });
  },
  resetDrift: () => {
    set({ driftScore: 0, driftCombo: 1, isDrifting: false, isPerfectDriftActive: false });
  },
  // Weather related
  updateWeather: (dt: number) => {
    set(state => {
      const { weather } = state;

      // Update weather timer
      const newWeatherTimer = weather.weatherTimer - dt;

      let newWeather = weather.currentWeather;
      let newWeatherTimerValue = newWeatherTimer;

      // Check if it's time to change weather
      if (newWeatherTimer <= 0) {
        // Select new weather based on current season probabilities
        const seasonConfig = SEASON_CONFIGS[weather.currentSeason];
        const rand = Math.random();
        let cumulativeProbability = 0;

        for (const [weatherType, probability] of Object.entries(seasonConfig.weatherProbabilities)) {
          cumulativeProbability += probability;
          if (rand <= cumulativeProbability) {
            newWeather = weatherType as WeatherType;
            break;
          }
        }

        // Set timer for next weather change (5-20 minutes)
        newWeatherTimerValue = Math.random() * 900 + 300;
      }

      // Update season progress (full season cycle = 20 minutes of gameplay)
      const newSeasonProgress = (weather.seasonProgress + dt / 1200) % 1;
      let newSeason = weather.currentSeason;

      // Change season when we complete a cycle
      if (weather.seasonProgress > 0.9 && newSeasonProgress < 0.1) {
        // Cycle through seasons: spring -> summer -> autumn -> winter -> spring
        const seasonOrder: SeasonType[] = ["spring", "summer", "autumn", "winter"];
        const currentIndex = seasonOrder.indexOf(weather.currentSeason);
        newSeason = seasonOrder[(currentIndex + 1) % 4];
      }

      return {
        weather: {
          currentWeather: newWeather,
          weatherTimer: newWeatherTimerValue,
          currentSeason: newSeason,
          seasonProgress: newSeasonProgress
        }
      };
    });
  },
  // Reputation related
  updateReputation: (points: number, personality: PassengerPersonality, isVip: boolean = false) => {
    set(state => {
      let newPoints = Math.max(0, Math.min(1500, state.reputation.points + points));

      // Update personality preference tracking
      const updatedPrefs = { ...state.reputation.personalityPrefs };
      updatedPrefs[personality] = (updatedPrefs[personality] || 0) + 1;

      // Update VIP served count
      const newVipServed = state.reputation.vipServed + (isVip ? 1 : 0);

      // Determine new level based on points
      let newLevel: ReputationLevel = "unknown";
      if (newPoints >= REPUTATION_THRESHOLDS.vip_chauffeur) newLevel = "vip_chauffeur";
      else if (newPoints >= REPUTATION_THRESHOLDS.celebrity_favorite) newLevel = "celebrity_favorite";
      else if (newPoints >= REPUTATION_THRESHOLDS.legend) newLevel = "legend";
      else if (newPoints >= REPUTATION_THRESHOLDS.expert) newLevel = "expert";
      else if (newPoints >= REPUTATION_THRESHOLDS.professional) newLevel = "professional";
      else if (newPoints >= REPUTATION_THRESHOLDS.driver) newLevel = "driver";
      else if (newPoints >= REPUTATION_THRESHOLDS.newbie) newLevel = "newbie";
      else newLevel = "unknown";

      // Update driving style based on recent trips (simplified)
      const updatedDrivingStyle = { ...state.reputation.drivingStyle };
      // In a real implementation, this would be based on actual driving behavior
      // For now, we'll just slightly adjust based on personality served
      if (personality === "adventurous" || personality === "athlete") {
        updatedDrivingStyle.fun = Math.min(100, updatedDrivingStyle.fun + 2);
        updatedDrivingStyle.safety = Math.max(0, updatedDrivingStyle.safety - 1);
      } else if (personality === "elderly" || personality === "business") {
        updatedDrivingStyle.safety = Math.min(100, updatedDrivingStyle.safety + 2);
        updatedDrivingStyle.fun = Math.max(0, updatedDrivingStyle.fun - 1);
      } else if (personality === "impatient") {
        updatedDrivingStyle.speed = Math.min(100, updatedDrivingStyle.speed + 2);
        updatedDrivingStyle.safety = Math.max(0, updatedDrivingStyle.safety - 1);
      } else if (personality === "tourist") {
        updatedDrivingStyle.efficiency = Math.max(0, updatedDrivingStyle.efficiency - 1);
      }

      return {
        reputation: {
          ...state.reputation,
          points: newPoints,
          level: newLevel,
          personalityPrefs: updatedPrefs,
          vipServed: newVipServed,
          drivingStyle: updatedDrivingStyle
        }
      };
    });
  },
  getReputationLevel: () => {
    const { reputation } = get();
    return reputation.level;
  },
  getReputationLevelName: () => {
    const { reputation } = get();
    return REPUTATION_LEVEL_NAMES[reputation.level] || "Unknown";
  }
});
