# piano360

Piano360 is a MongoDB-backed course MVP for guided piano learning. The app uses a Course -> Lesson -> Step content model, an Express API, and a React/Vite client with local-only learner progress.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB available locally or through `MONGODB_URI`

## Apps

- `apps/api`: Node.js + Express + Mongoose API
- `apps/client`: React + Vite frontend

## Setup

```bash
npm install
```

Copy environment examples before local development if you need to change defaults:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env
```

Default API settings:

```txt
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/piano360
```

Reset and seed course content:

```bash
npm run seed:courses
```

The seed script replaces only MongoDB course content. Learner progress is never stored in MongoDB; the browser stores it under `piano360.progress.v1`.

## Course authoring

Course content is authored in `apps/api/src/courses/seedCourses.ts` and published deliberately with:

```bash
npm run seed:courses
```

The seed command is not part of application startup or deployment. For the MVP, longer practice is modeled by adding more uniquely identified lesson steps to seed content while preserving the existing Course -> Lesson -> Step schema.

Use a simple lesson progression for new material:

```text
Introduce -> Repeat -> Mix -> Challenge
```

For songs, split the piece into short phrase lessons, then add a final lesson that combines the phrases into the complete playable passage.

## Development

```bash
npm run dev
```

The client runs on Vite's default port, `5173`, and proxies `/api` requests to the API on port `4000`.

## API

Health:

```http
GET /health
GET /api/health
```

Course content:

```http
GET /api/courses
GET /api/courses/:courseSlug
GET /api/courses/:courseSlug/lessons/:lessonSlug
```

Seeded courses:

- Finger Placement
- Beginner Chords
- Ode to Joy
- Three Little Birds Limited Excerpt
- One Love Limited Excerpt
- Redemption Song Limited Excerpt
- Rivers of Babylon Limited Excerpt
- Island Sunrise
- One-Drop Walk
- Kingston Evening
- Positive Vibration Study
- Ska Step-Up
- Offbeat Run
- Echo Bass Melody
- Space and Delay Study

## Scripts

```bash
npm run dev
npm run seed:courses
npm run lint
npm run typecheck
npm test
npm run build
npm run format
```

## Testing

- Client tests use Vitest and React Testing Library.
- API tests use Jest, Supertest, and `mongodb-memory-server`.
