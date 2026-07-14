# Repository Guidelines

## Project Structure & Module Organization

Piano360 is an npm workspace with two main apps. `apps/api` contains the Express,
Mongoose, and TypeScript API; course seed data and scripts live under
`apps/api/src/courses` and `apps/api/src/scripts`. `apps/client` contains the
React, Vite, and TypeScript frontend, with UI code in `apps/client/src`, shared
helpers in `apps/client/src/shared`, feature code in `apps/client/src/features`,
and static assets in `apps/client/public`. Browser-level Playwright specs live
in `tests/browser`. Build output is generated in `dist` folders and should not
be edited directly.

## Build, Test, and Development Commands

- `npm install`: install all workspace dependencies.
- `npm run dev`: run API and client together; API defaults to port `4000`, Vite
  client to `5173`.
- `npm run build`: build all workspaces.
- `npm run build:api`: build only `@piano360/api`.
- `npm run lint`: run ESLint across the repo.
- `npm run typecheck`: run TypeScript checks for all workspaces.
- `npm test`: run workspace unit and integration tests.
- `npm run test:browser`: run Playwright specs from `tests/browser`.
- `npm run seed:courses`: reset and seed MongoDB course content.

## Coding Style & Naming Conventions

Use TypeScript and ES modules. Follow the existing React component style in the
client and Express route/service style in the API. Prettier is authoritative:
100-character print width, semicolons, double quotes, and no trailing commas.
Use PascalCase for React components, camelCase for functions and variables, and
descriptive file names that match nearby patterns.

## Testing Guidelines

Client tests use Vitest, React Testing Library, and `*.test.tsx` files near the
code under test. API tests use Jest, Supertest, and `mongodb-memory-server` in
`apps/api/test`. Add or update tests when behavior changes, and prefer focused
regression coverage over broad snapshots. Run `npm test`, plus
`npm run test:browser` for user-flow or layout-sensitive changes.

## Commit & Pull Request Guidelines

Recent commits mostly use short conventional prefixes such as `feat:`, `test:`,
and `docs:`. Keep subjects imperative and specific, for example
`test: cover course timeline validation`. Pull requests should summarize the
change, list validation commands run, link related issues or specs, and include
screenshots or recordings for visible UI changes.

## Security & Configuration Tips

Do not commit secrets. Start from `apps/api/.env.example` and
`apps/client/.env.example` for local configuration. MongoDB defaults to
`mongodb://127.0.0.1:27017/piano360`; override with `MONGODB_URI` when needed.
