# Alligator Taxi Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-black)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.3-38bdf8)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-ff1493)](https://zustand-demo.pmndrs.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-0891b2)](https://orm.drizzle.team/)

## Description

**Alligator Taxi** is a Crazy Taxi-inspired 3D arcade game where you play as an alligator‑themed taxi driver navigating a bustling city. Pick up passengers, race against the clock, and drop them off at their destinations to earn points and unlock new areas.

- **Genre**: Arcade / Driving / Action  
- **Core Mechanics**: Time‑based fares, realistic vehicle physics, passenger targeting, city exploration  
- **Target Platform**: Web (desktop & mobile browsers) – runs anywhere with a modern browser  
- **Player Experience**: Fast‑paced, vibrant low‑poly city, immersive sound effects, responsive controls (keyboard/gamepad)

### Key Features
- **3D Cityscape** powered by Three.js with custom low‑poly buildings and dynamic traffic  
- **Real‑time passenger system**: UI markers, audio cues, and destination arrows guide you  
- **Scoring & combos**: Chain successful drop‑offs for bonus points  
- **Responsive UI** built with Radix UI primitives and Tailwind CSS  
- **State management** via Zustand for predictable, debuggable game state  
- **Modular architecture**: Separate concerns – rendering, audio, input, UI, game logic  
- **Extensible backend** (optional) – Express API with PostgreSQL + Drizzle ORM for leaderboards, user accounts, or persistent saves  
- **Fast development cycle** with Vite (HMR) and TypeScript strict checking  

## Table of Contents
- [Installation & Setup](#installation--setup)
- [How to Play](#how-to-play)
- [Development](#development)
  - [Folder Structure](#folder-structure)
  - [Available Scripts](#available-scripts)
  - [Type Checking & Linting](#type-checking--linting)
  - [Testing](#testing)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Credits & Acknowledgements](#credits--acknowledgements)

## Installation & Setup

### Prerequisites
- **Node.js** >= 20.x (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** >= 9.x (the workspace uses pnpm for deterministic installs)
- **PostgreSQL** >= 15 (only required if you want to run the API server locally)
- **Git** (to clone the repository)

### Clone the Repository
```bash
git clone https://github.com/your-username/alligator-taxi-game.git
cd alligator-taxi-game
```

### Install Dependencies
```bash
pnpm install
```
This will hoist workspace dependencies and install packages for:
- The **client** (`artifacts/crazy-taxi`)
- The **API server** (`artifacts/api-server`)
- Shared libraries (`lib/*`)

### Environment Variables
Create a `.env` file in the root (or in `artifacts/api-server`) based on the example below:

```env
# Database connection (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/alligator_taxi
# Optional: API port (defaults to 3000)
PORT=3000
```

If you do not provide `DATABASE_URL`, the API server will fail to start; the client can still run in standalone mode without persistence.

### Initialize Database (Optional)
Run Drizzle Kit to push the schema to your PostgreSQL instance:
```bash
pnpm --filter @workspace/db push
```
You can also use `push-force` to drop and recreate tables during development.

## How to Play

### Controls
| Action            | Keyboard          | Gamepad (XInput) |
|-------------------|-------------------|------------------|
| Accelerate        | `W` or `↑`        | Right Trigger    |
| Brake / Reverse   | `S` or `↓`        | Left Trigger     |
| Steer Left        | `A` or `←`        | Left Stick X‑    |
| Steer Right       | `D` or `→`        | Left Stick X+    |
| Handbrake / Drift | `Space`           | Right Bumper (RB)|
| Camera Reset      | `C`               | Right Stick Click|
| Pause / Menu      | `Esc`             | Start Button     |

### Objectives
1. **Pick up passengers** highlighted with a floating marker and audio cue.  
2. **Follow the on‑screen arrow** to the passenger's destination.  
3. **Drop off** within the time limit to earn fare points.  
4. **Chain pickups** without letting the timer expire for combo bonuses.  
5. **Avoid collisions** with traffic and buildings – they incur time penalties.  

### Game Modes (Current Build)
- **Free Roam** – Explore the city with no timer.  
- **Career** – Series of timed fares with increasing difficulty.  
- **Endless** – See how many passengers you can serve before time runs out.

## Development

### Folder Structure
```
alligator-taxi-game/
├─ artifacts/
│  ├─ api-server/          # Express + TypeScript backend
│  ├─ crazy-taxi/          # Main Vite + React + Three.js client
│  └─ mockup-sandbox/      # UI prototyping sandbox
├─ lib/
│  ├─ api-client-react/    # React hooks for API communication
│  ├─ api-spec/            # OpenAPI / Zod schemas
│  ├─ api-zod/             # Shared Zod types
│  └─ db/                  # Drizzle ORM + PostgreSQL schema
├─ scripts/                # Helper scripts (db migrations, asset pipelines, etc.)
├─ .gitignore
├─ .npmrc
├─ .replit
├─ .replitignore
├─ IMPLEMENTATION_SUMMARY.md
├─ package.json            # Workspace root (defines scripts & dev tools)
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

### Available Scripts (Root)

| Script | Description |
|--------|-------------|
| `pnpm run build` | Runs type checking then builds **all** workspace packages (client & server). |
| `pnpm run typecheck` | Executes `tsc` on libs and filters client/server for type safety. |
| `pnpm run dev` *(Not defined at root – use workspace filters)* | See below. |

### Package‑Specific Scripts

#### Client (`artifacts/crazy-taxi`)
```bash
pnpm --filter @workspace/crazy-taxi dev   # Vite dev server (HMR) on http://localhost:5173
pnpm --filter @workspace/crazy-taxi build # Production build (output to dist/)
pnpm --filter @workspace/crazy-taxi serve # Preview production build locally
pnpm --filter @workspace/crazy-taxi typecheck # tsc check
```

#### Server (`artifacts/api-server`)
```bash
pnpm --filter @workspace/api-server dev   # Builds then starts Express server (default port 3000)
pnpm --filter @workspace/api-server build # Compiles TS to ./dist
pnpm --filter @workspace/api-server start # Runs compiled server
pnpm --filter @workspace/api-server typecheck # tsc check
```

#### Shared Libraries
Each library under `lib/` exposes a `typecheck` script (if needed) and can be built/consumed via the workspace.

### Type Checking & Linting
- **TypeScript**: `pnpm run typecheck` runs `tsc --noEmit` across relevant packages.
- **Formatting**: The repo uses **Prettier** (configured implicitly via editor settings). Run:
  ```bash
  pnpm dlx prettier --write .
  ```
- **Linting**: No ESLint config is currently committed; you may add one following standard React/TS guidelines.

### Testing
The project does not yet include automated tests. As a next step, consider adding:
- **Unit tests** with Vitest or Jest for utils, hooks, and store logic.
- **Integration tests** using Playwright or Cypress for critical user flows (pickup → dropoff).
- **Visual regression** with Chromatic for UI components.

## Deployment

### Client (Static Site)
The client builds to static assets via Vite. Deploy to any static host:
- **Netlify**: Connect repo, set build command `pnpm --filter @workspace/crazy-taxi build`, publish directory `artifacts/crazy-taxi/dist`.
- **Vercel**: Same; Vercel automatically detects Vite output.
- **GitHub Pages**: Use `pnpm --filter @workspace/crazy-taxi build` then push `dist` to `gh-pages` branch.
- **Docker (optional)**: Serve with `nginx` or `caddy`.

Example Dockerfile for client:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/crazy-taxi build

FROM nginx:alpine
COPY --from=builder /app/artifacts/crazy-taxi/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Server (API)
The API server is a standard Node.js/Express app.

#### Using PM2 (process manager)
```bash
pnpm --filter @workspace/api-server build
pm2 start ./dist/index.mjs --name alligator-taxi-api
```

#### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
# Install only production deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
# Build TS
COPY . .
RUN pnpm --filter @workspace/api-server build

EXPOSE 3000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
```
Set `DATABASE_URL` and `PORT` as environment variables when running the container.

### Full‑Stack Deployment (Example)
You can deploy both client and server to the same host (e.g., a VPS) and reverse‑proxy `/api` to the Node server while serving static files from the client build.

## Configuration

| File | Purpose |
|------|---------|
| `artifacts/crazy-taxi/vite.config.ts` | Vite plugins, server port, build options |
| `artifacts/crazy-taxi/tsconfig.json` | Client‑specific TypeScript configuration |
| `artifacts/api-server/tsconfig.json` | Server‑specific TypeScript configuration |
| `lib/db/drizzle.config.ts` | Drizzle Kit migration configuration |
| `.replit` / `.replitignore` | Replit IDE settings (if you develop via Replit) |
| `pnpm-workspace.yaml` | Workspace package layout |

No runtime configuration files are required beyond the optional `.env` for the API server.

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository and create a new branch (`git checkout -b feature/amazing-idea`).
2. Keep your changes **focused** and **well‑documented**.
3. Ensure **type‑check** passes (`pnpm run typecheck`).
4. Run the client locally (`pnpm --filter @workspace/crazy-taxi dev`) to verify UI/behavior.
5. If modifying the API or database, run migrations (`pnpm --filter @workspace/db push`) and test endpoints.
6. Submit a **Pull Request** with a clear description of the problem and solution.
7. Please adhere to the existing code style (Prettier formatting, meaningful commit messages).

### Code of Conduct
Please note that this project is released with a Contributor Covenant Code of Conduct. By participating, you agree to uphold its standards. See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) if added later.

## License

This project is licensed under the **MIT License** – see the [`LICENSE`](LICENSE) file for details.

## Credits & Acknowledgements

- **Original Inspiration**: The classic *Crazy Taxi* (SEGA) – recreated as a tribute and learning exercise.
- **Open Source Libraries**:
  - [Three.js](https://threejs.org/) & [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) for 3D rendering
  - [React](https://reactjs.org/) & [React DOM] for UI
  - [Vite](https://vitejs.dev/) for fast dev/build tooling
  - [Tailwind CSS](https://tailwindcss.com/) for utility‑first styling
  - [Zustand](https://zustand-demo.pmndrs.com/) for state management
  - [Radix UI](https://www.radix-ui.com/) for accessible primitive components
  - [framer-motion](https://www.framer.com/motion/) for animations
  - [recharts](https://recharts.org/) for any charting needs
  - [sonner](https://sonner.emilkowal.ski/) for toast notifications
  - [zod](https://zod.dev/) for schema validation
  - [date-fns](https://date-fns.org/) for date utilities
  - [embla-carousel-react](https://embla-carousel.com/) for carousels
  - [vaul](https://vaul.pantheon.site/) for bottom sheets
  - [sonner](https://sonner.emilkowal.ski/) for toasts
  - [postprocessing](https://github.com/vanruesc/postprocessing) for Three.js post‑process effects
- **Audio & Assets**: Any custom models, textures, and sound effects are either created for this project or sourced from free libraries (credits in `assets/` if applicable).
- **Tooling**: pnpm, TypeScript, ESLint/Prettier (as added), Docker, GitHub Actions (potential CI).

Enjoy driving your Alligator Taxi through the city — may your fares be plentiful and your drifts legendary! 🚕💨
