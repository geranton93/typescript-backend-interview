# University Scheduling API

This service powers the interview scheduling exercise. It is a NestJS API backed by Prisma/PostgreSQL and exposes student scheduling endpoints with Swagger documentation at `/docs`.

## Prerequisites
- Node.js 20+
- Docker (for the Postgres service)

## Getting Started
```bash
# start database only (optional if you prefer running the API locally)
$ docker compose up -d db

# install dependencies
$ cd api
$ npm install

# generate prisma client and apply migrations
$ npm run prisma:generate:client
$ npm run prisma:migrate:deploy
$ npx prisma db seed

# run the API locally
$ npm run start:dev

# or run the API in Docker (builds the image on first run)
$ docker compose up --build api

# rebuild the API container image after code changes
$ docker compose build api
```

Visit `http://localhost:3000/docs` for interactive Swagger docs.

## Key Commands
- `npm run lint` – ESLint with Prettier integration.
- `npm run format` – Format TypeScript sources with Prettier.
- `npm run test` – Jest unit tests (extend with scenario coverage).
- `npm run test:e2e` – End-to-end Nest testing harness.

## Domain Overview
- **Subjects**, **Teachers**, **Classrooms**: queryable catalogue endpoints.
- **Sections**: map a teacher, subject, and classroom with weekly meetings.
- **Students**: enroll/drop sections with conflict checks and PDF export.

Seed data creates sample catalogue entries and two students (`alice@example.edu`, `bob@example.edu`).
