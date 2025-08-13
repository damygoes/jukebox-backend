 - init a package.json using pnpm `pnpm init -y`
 - Install runtime + dev dependencies  `pnpm add express socket.io cors pino dotenv`
   - 	express — simple HTTP server for REST endpoints (search proxy, health). 
   - socket.io — real-time events (rooms, reconnection, recovery). 
   - cors — for local dev cross-origin. 
   - pino — a fast logger (replaceable with any logger). 
   - dotenv — load env vars locally.
 - Dev deps: `pnpm add -D typescript ts-node-dev @types/express @types/node @types/cors eslint prettier eslint-config-prettier husky lint-staged vitest @types/jest`
   - typescript — types and static checking. 
   - ts-node-dev — fast restart dev server (fallback if you don’t use Node native .ts run). 
   - eslint / prettier / husky / lint-staged — code quality and pre-commit checks. 
     - vitest — fast unit tests.
 - Add these scripts to package.json:
   `{
   "scripts": {
   "dev:node": "node --watch src/index.ts",            // requires Node >= 23.6 (native TS)
   "dev:legacy": "ts-node-dev --respawn --transpile-only src/index.ts",
   "build": "tsc -p tsconfig.json",
   "start": "node dist/index.js",
   "lint": "eslint . --ext .ts",
   "test": "vitest"
   }
   }
`