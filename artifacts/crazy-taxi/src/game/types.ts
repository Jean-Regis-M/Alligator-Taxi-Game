export type GameState = "menu" | "playing" | "gameover";

export interface Passenger {
  id: number;
  position: [number, number, number];
  destination: [number, number, number];
  reward: number;
  name: string;
  destLabel: string;
  emoji: string;
  color: string;

  // Advanced Passenger System 2.0 properties
  personality: PassengerPersonality;
  isVip: boolean;
  isTimeSensitive: boolean;
  timeLimit: number; // seconds to complete the trip for bonus
  specialRequest: SpecialRequest | null;
  reputationImpact: number; // how much this passenger affects reputation (+/-)
}

// Personality types that affect passenger behavior
export type PassengerPersonality =
  | "chatty"      // Talks more, gives small tips frequently
  | "silent"      // Rarely talks, standard tipping
  | "generous"    // Tips well, may give bonuses for good driving
  | "impatient"   // Gets angry if driven slowly, penalties for slow driving
  | "adventurous" // Enjoys drifting and speed, bonuses for fun driving
  | "business"    // Prefers direct routes, penalties for detours
  | "elderly"     // Prefers careful driving, penalties for rough driving
  | "tourist"     // Enjoys sightseeing, bonuses for scenic routes
  | "celebrity"   // VIP: high reward, paparazzi avoidance mechanic
  | "athlete"     // VIP: sports star, prefers quick trips to events
  | "executive"   // VIP: business executive, values punctuality and comfort
  | "student"     // VIP: limited budget but appreciates friendly service
  | "elite"       // Legendary VIP: extremely high reward, very specific preferences;

// Special request types
export type SpecialRequest =
  | "scenicRoute"   // Passenger wants to see sights, bonus for taking longer scenic path
  | "quickTrip"     // Passenger is in a hurry, bonus for fast completion
  | "smoothRide"    // Passenger wants careful driving, bonus for minimal collisions/drifting
  | "funDrive"      // Passenger wants excitement, bonus for drifting and speed
  | "quietTrip"     // Passenger prefers silence, penalty for excessive horn/boost
  | "paparraziAvoid"// Celebrity wants to avoid paparazzi routes (certain areas)
  | "eventDropoff"  // Needs to be at specific location by specific time
  | "meetingPrep"   // Executive wants quiet to prepare for meeting
  | "sightseeingTour"// Tourist wants to see specific landmarks
  | null;

// Weather types
export type WeatherType =
  | "clear"       // Clear skies
  | "cloudy"      // Overcast
  | "foggy"       // Reduced visibility
  | "rainy"       // Wet roads, reduced traction
  | "stormy"      // Heavy rain, thunder, poor visibility
  | "snowy"       // Snow accumulation, slippery roads
  | "icy";        // Black ice, very slippery

// Season types
export type SeasonType =
  | "spring"      // Mild weather, occasional rain
  | "summer"      // Hot, mostly clear, occasional thunderstorms
  | "autumn"      // Cool, variable weather, foggy mornings
  | "winter";     // Cold, snow/ice possible

// Reputation levels
export type ReputationLevel =
  | "unknown"
  | "newbie"
  | "driver"
  | "professional"
  | "expert"
  | "legend"
  | "celebrity_favorite"
  | "vip_chauffeur";

// Reputation tracking
export interface ReputationSystem {
  level: ReputationLevel;
  points: number; // 0-1000
  personalityPrefs: Record<PassengerPersonality, number>; // how well you serve each personality
  vipServed: number; // count of VIP passengers served
  onTimeDropouts: number; // percentage of time-sensitive trips completed on time
  drivingStyle: {
    speed: number; // preference for speed (0-100)
    safety: number; // preference for safe driving (0-100)
    fun: number; // preference for drifting/stunts (0-100)
    efficiency: number; // preference for direct routes (0-100)
  };
}

// Weather and season system
export interface WeatherSystem {
  currentWeather: WeatherType;
  weatherTimer: number; // Time until next weather change
  currentSeason: SeasonType;
  seasonProgress: number; // Progress through current season (0-1)
}
