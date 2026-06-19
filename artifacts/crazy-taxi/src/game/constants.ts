import * as THREE from "three";

export const ROAD_WIDTH = 16;
export const BLOCK_SIZE = 60;
export const CITY_SIZE = 5;
export const TAXI_SPEED = 25;
export const TAXI_TURN_SPEED = 2.2;
export const FRICTION = 0.88;
export const INITIAL_TIME = 60;
export const TIME_BONUS = 20;
export const PICKUP_RADIUS = 6;
export const DROPOFF_RADIUS = 6;
export const MAX_WAITING_PASSENGERS = 4;

// Spawns at intersection of roads x=30, z=-30 (both are grid roads, no buildings there)
export const TAXI_SPAWN = new THREE.Vector3(30, 0.6, -30);

export const PASSENGER_NAMES = [
  "Bob", "Sue", "Dave", "Karen", "Mike",
  "Linda", "Tom", "Amy", "Joe", "Tina",
  "Rex", "Flo", "Bert", "Nora", "Gus",
];

export const PASSENGER_EMOJIS = ["🧑", "👩", "👴", "🧔", "👷", "🕵️", "🧟", "🦸", "🤡", "🧛"];

export const PASSENGER_COLORS = [
  "#ff6b6b", "#4ecdc4", "#ffe66d", "#a29bfe", "#fd79a8",
  "#55efc4", "#fdcb6e", "#e17055", "#74b9ff", "#00cec9",
];

export const LANDMARK_NAMES = [
  "Airport", "City Hall", "Stadium", "Hospital", "Big Mall",
  "University", "Museum", "Grand Hotel", "Casino", "City Park",
  "Harbor", "Theater", "Library", "Food Market", "Zoo",
  "Train Station", "Police HQ", "The Swamp", "Gator Club", "Bayou Bar",
];

export const GATOR_QUIPS = [
  "SNAP SNAP, let's GO!",
  "Fastest scales in town!",
  "No one out-swims the GATOR!",
  "CHOMP chomp, here we come!",
  "Gator Express, never late!",
  "Watch out, I bite corners!",
  "Cold-blooded SPEED!",
  "I ate the last driver 😈",
  "Tip well or swim home!",
  "HISSSSSS — that's a BONUS!",
];

// Advanced Passenger System 2.0 Constants
export const PASSENGER_PERSONALITIES = [
  "chatty",
  "silent",
  "generous",
  "impatient",
  "adventurous",
  "business",
  "elderly",
  "tourist",
  "celebrity",
  "athlete",
  "executive",
  "student",
  "elite"
] as const;

export const SPECIAL_REQUESTS = [
  "scenicRoute",
  "quickTrip",
  "smoothRide",
  "funDrive",
  "quietTrip",
  "paparraziAvoid",
  "eventDropoff",
  "meetingPrep",
  "sightseeingTour",
  null
] as const;

export const VIP_TYPES = [
  "celebrity",
  "athlete",
  "executive",
  "student",
  "elite"
] as const;

// Personality behavior configurations
export const PERSONALITY_CONFIGS = {
  chatty: {
    tipMultiplier: 1.0,
    talkFrequency: 0.8, // chances per minute to say something
    speedPreference: 0.5,
    safetyPreference: 0.5,
    funPreference: 0.3,
    reputationImpact: 0.1
  },
  silent: {
    tipMultiplier: 0.9,
    talkFrequency: 0.1,
    speedPreference: 0.5,
    safetyPreference: 0.6,
    funPreference: 0.2,
    reputationImpact: 0.05
  },
  generous: {
    tipMultiplier: 1.8,
    talkFrequency: 0.4,
    speedPreference: 0.6,
    safetyPreference: 0.5,
    funPreference: 0.4,
    reputationImpact: 0.2
  },
  impatient: {
    tipMultiplier: 0.7,
    talkFrequency: 0.3,
    speedPreference: 0.9,
    safetyPreference: 0.3,
    funPreference: 0.2,
    reputationImpact: -0.15, // negative impact if driven slowly
    speedPenaltyThreshold: 0.3 // penalty if driving below 30% of max speed
  },
  adventurous: {
    tipMultiplier: 1.2,
    talkFrequency: 0.5,
    speedPreference: 0.8,
    safetyPreference: 0.4,
    funPreference: 0.9,
    reputationImpact: 0.15,
    driftBonus: 0.2 // bonus points for drifting
  },
  business: {
    tipMultiplier: 1.1,
    talkFrequency: 0.2,
    speedPreference: 0.7,
    safetyPreference: 0.6,
    funPreference: 0.1,
    reputationImpact: 0.1,
    directRouteBonus: 0.25 // bonus for taking direct routes
  },
  elderly: {
    tipMultiplier: 1.0,
    talkFrequency: 0.3,
    speedPreference: 0.3,
    safetyPreference: 0.9,
    funPreference: 0.1,
    reputationImpact: 0.2,
    smoothDriveBonus: 0.3 // bonus for minimal collisions/jerking
  },
  tourist: {
    tipMultiplier: 1.3,
    talkFrequency: 0.6,
    speedPreference: 0.4,
    safetyPreference: 0.7,
    funPreference: 0.5,
    reputationImpact: 0.15,
    scenicRouteBonus: 0.4 // bonus for taking scenic routes
  },
  celebrity: {
    tipMultiplier: 2.5,
    talkFrequency: 0.1,
    speedPreference: 0.6,
    safetyPreference: 0.7,
    funPreference: 0.2,
    reputationImpact: 0.5,
    isVip: true,
    baseRewardMultiplier: 3.0,
    paparazziAvoidance: true // avoids certain areas
  },
  athlete: {
    tipMultiplier: 2.0,
    talkFrequency: 0.3,
    speedPreference: 0.9,
    safetyPreference: 0.5,
    funPreference: 0.6,
    reputationImpact: 0.4,
    isVip: true,
    baseRewardMultiplier: 2.5,
    eventTimeBonus: 0.5 // bonus for arriving early to events
  },
  executive: {
    tipMultiplier: 1.8,
    talkFrequency: 0.15,
    speedPreference: 0.7,
    safetyPreference: 0.8,
    funPreference: 0.1,
    reputationImpact: 0.45,
    isVip: true,
    baseRewardMultiplier: 2.8,
    punctualityBonus: 0.4 // bonus for on-time arrival
  },
  student: {
    tipMultiplier: 1.4,
    talkFrequency: 0.5,
    speedPreference: 0.5,
    safetyPreference: 0.6,
    funPreference: 0.4,
    reputationImpact: 0.3,
    isVip: true,
    baseRewardMultiplier: 2.0,
    friendlinessBonus: 0.3 // bonus for polite driving (no aggression)
  },
  elite: {
    tipMultiplier: 3.5,
    talkFrequency: 0.2,
    speedPreference: 0.7,
    safetyPreference: 0.8,
    funPreference: 0.6,
    reputationImpact: 0.8,
    isVip: true,
    baseRewardMultiplier: 5.0,
    specificPreferences: true // has very specific combination of preferences
  }
};

// Special request configurations
export const SPECIAL_REQUEST_CONFIGS = {
  scenicRoute: {
    description: "Wants to see the sights",
    bonusMultiplier: 1.4,
    preferredDetection: (route: RouteInfo) => route.scenicScore > 0.7
  },
  quickTrip: {
    description: "In a hurry to get there",
    bonusMultiplier: 1.3,
    timeLimitReduction: 0.7 // must complete in 70% of normal time
  },
  smoothRide: {
    description: "Prefers a comfortable ride",
    bonusMultiplier: 1.2,
    collisionPenalty: 0.5, // penalty for each collision
    jerkPenalty: 0.3 // penalty for harsh acceleration/braking
  },
  funDrive: {
    description: "Wants an exciting ride",
    bonusMultiplier: 1.5,
    driftBonus: 0.3,
    speedBonus: 0.2
  },
  quietTrip: {
    description: "Prefers peace and quiet",
    bonusMultiplier: 1.1,
    boostPenalty: 0.4, // penalty for using boost
    hornPenalty: 0.5 // penalty for using horn
  },
  paparraziAvoid: {
    description: "Wants to avoid paparazzi hotspots",
    bonusMultiplier: 1.6,
    avoidanceZones: ["City Park", "Theater", "Casino"] // areas to avoid
  },
  eventDropoff: {
    description: "Needs to be at event by specific time",
    bonusMultiplier: 2.0,
    timeCritical: true,
    latenessPenalty: 0.5 // 50% penalty per minute late
  },
  meetingPrep: {
    description: "Executive preparing for meeting",
    bonusMultiplier: 1.3,
    quietRequired: true,
    preparationTimeBonus: 0.2 // bonus if trip takes >2 minutes (time to prepare)
  },
  sightseeingTour: {
    description: "Tourist wants specific landmark tour",
    bonusMultiplier: 1.7,
    requiredLandmarks: ["City Hall", "Museum", "Grand Hotel"] // must pass near these
  }
};

// Weather system configurations
export const WEATHER_CONFIGS = {
  clear: {
    description: "Clear skies",
    visibilityModifier: 1.0,
    handlingModifier: 1.0,
    passengerMoodModifier: 0.1, // Slightly happier
    colorShift: { r: 0, g: 0, b: 0 }, // No color shift
    particleEnabled: false,
    soundVolume: 0.0
  },
  cloudy: {
    description: "Overcast skies",
    visibilityModifier: 0.8,
    handlingModifier: 1.0,
    passengerMoodModifier: -0.1, // Slightly gloomy
    colorShift: { r: -0.1, g: -0.05, b: 0 }, // Slightly blue-shifted
    particleEnabled: false,
    soundVolume: 0.1
  },
  foggy: {
    description: "Foggy conditions",
    visibilityModifier: 0.4,
    handlingModifier: 1.0,
    passengerMoodModifier: -0.2, // Nervous due to low visibility
    colorShift: { r: -0.05, g: -0.05, b: 0.1 }, // Blue-gray tint
    particleEnabled: true,
    particleType: "fog",
    soundVolume: 0.2
  },
  rainy: {
    description: "Rainy weather",
    visibilityModifier: 0.6,
    handlingModifier: 0.7, // Reduced traction
    passengerMoodModifier: -0.15, // Unhappy about getting wet
    colorShift: { r: -0.1, g: -0.05, b: 0 }, // Slightly desaturated
    particleEnabled: true,
    particleType: "rain",
    soundVolume: 0.5
  },
  stormy: {
    description: "Stormy weather",
    visibilityModifier: 0.3,
    handlingModifier: 0.5, // Very slippery
    passengerMoodModifier: -0.3, // Scared/Nervous
    colorShift: { r: -0.2, g: -0.1, b: 0 }, // Dark and gloomy
    particleEnabled: true,
    particleType: "storm",
    soundVolume: 0.8
  },
  snowy: {
    description: "Snowy weather",
    visibilityModifier: 0.5,
    handlingModifier: 0.6, // Slippery but predictable
    passengerMoodModifier: 0.0, // Neutral/nastalgic for some
    colorShift: { r: 0.1, g: 0.1, b: 0.2 }, // Blue-white tint
    particleEnabled: true,
    particleType: "snow",
    soundVolume: 0.3
  },
  icy: {
    description: "Icy conditions",
    visibilityModifier: 0.9,
    handlingModifier: 0.3, // Extremely slippery
    passengerMoodModifier: -0.25, // Very nervous
    colorShift: { r: 0.05, g: 0.05, b: 0.1 }, // Slightly blue
    particleEnabled: true,
    particleType: "ice",
    soundVolume: 0.1
  }
};

// Season configurations
export const SEASON_CONFIGS = {
  spring: {
    description: "Spring",
    colorShift: { r: 0, g: 0.05, b: -0.02 }, // Slightly green tint
    weatherProbabilities: {
      clear: 0.3,
      cloudy: 0.25,
      foggy: 0.15,
      rainy: 0.25,
      stormy: 0.04,
      snowy: 0.01,
      icy: 0.0
    },
    temperatureModifier: 0.0 // Baseline
  },
  summer: {
    description: "Summer",
    colorShift: { r: 0.05, g: 0.02, b: -0.05 }, // Slightly warm tint
    weatherProbabilities: {
      clear: 0.5,
      cloudy: 0.2,
      foggy: 0.05,
      rainy: 0.15,
      stormy: 0.08,
      snowy: 0.0,
      icy: 0.0
    },
    temperatureModifier: 0.3 // Hotter
  },
  autumn: {
    description: "Autumn",
    colorShift: { r: 0.1, g: 0.05, b: -0.1 }, // Orange/brown tint
    weatherProbabilities: {
      clear: 0.25,
      cloudy: 0.3,
      foggy: 0.2,
      rainy: 0.2,
      stormy: 0.04,
      snowy: 0.01,
      icy: 0.0
    },
    temperatureModifier: -0.2 // Cooler
  },
  winter: {
    description: "Winter",
    colorShift: { r: -0.05, g: 0, b: 0.1 }, // Slightly blue tint
    weatherProbabilities: {
      clear: 0.2,
      cloudy: 0.25,
      foggy: 0.15,
      rainy: 0.1,
      stormy: 0.05,
      snowy: 0.2,
      icy: 0.05
    },
    temperatureModifier: -0.4 // Coldest
  }
};

// Reputation system constants
export const REPUTATION_THRESHOLDS = {
  unknown: 0,
  newbie: 50,
  driver: 150,
  professional: 300,
  expert: 500,
  legend: 700,
  celebrity_favorite: 850,
  vip_chauffeur: 1000
};

export const REPUTATION_LEVEL_NAMES = {
  unknown: "Unknown",
  newbie: "Newbie Driver",
  driver: "Taxi Driver",
  professional: "Professional Driver",
  expert: "Expert Driver",
  legend: "Legendary Driver",
  celebrity_favorite: "Celebrity Favorite",
  vip_chauffeur: "VIP Chauffeur"
};

export const TAXI_COLOR = "#2ecc71";
export const ROAD_COLOR = "#2a2a2a";
export const BUILDING_COLORS = [
  "#4a6fa5", "#e8a838", "#c94f4f", "#6aaa7c", "#8b6db7",
  "#3b8cb8", "#d4693d", "#5ba55b", "#c06090", "#7a7a7a",
  "#2980b9", "#e67e22", "#27ae60", "#8e44ad", "#c0392b",
];

export function getRoadXPositions(): number[] {
  const positions: number[] = [];
  for (let i = 0; i <= CITY_SIZE; i++) {
    positions.push(i * BLOCK_SIZE - (CITY_SIZE * BLOCK_SIZE) / 2);
  }
  return positions;
}

export function getRoadZPositions(): number[] {
  return getRoadXPositions();
}

export function getBlockCenters(): Array<[number, number]> {
  const centers: Array<[number, number]> = [];
  for (let i = 0; i < CITY_SIZE; i++) {
    for (let j = 0; j < CITY_SIZE; j++) {
      const x = i * BLOCK_SIZE - (CITY_SIZE * BLOCK_SIZE) / 2 + BLOCK_SIZE / 2;
      const z = j * BLOCK_SIZE - (CITY_SIZE * BLOCK_SIZE) / 2 + BLOCK_SIZE / 2;
      centers.push([x, z]);
    }
  }
  return centers;
}

export function randomIntersection(): [number, number] {
  const roads = getRoadXPositions();
  const x = roads[Math.floor(Math.random() * roads.length)];
  const z = roads[Math.floor(Math.random() * roads.length)];
  return [x, z];
}
