# piano360

TypeScript fullstack boilerplate with a React + Vite client and an Express API in an npm workspaces monorepo.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Apps

- `apps/client`: React + Vite frontend
- `apps/api`: Node.js + Express backend

## Setup

```bash
npm install
```

Copy environment examples before local development if you need to change defaults:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env
```

The default API port is `4000`. The client runs on Vite's default port, `5173`, and proxies `/api` requests to the API during development.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run format
```

## API

Health check:

```http
GET /health
```

Example response:

```json
{
  "service": "piano360-api",
  "status": "ok",
  "timestamp": "2026-07-07T12:00:00.000Z"
}
```

## Testing

- Client tests use Vitest and React Testing Library.
- API tests use Jest and Supertest.

## CI

GitHub Actions runs install, lint, typecheck, test, and build on pull requests and pushes to `main`.
