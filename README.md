# Transflow

Transflow is a distributed video-processing platform for reliable large-file
uploads, asynchronous transcoding, HLS generation, and production-style
operational visibility.

## Repository structure

- `apps/` contains separately deployable services.
- `packages/` contains reusable TypeScript libraries.
- `docs/` contains architecture decisions and project documentation.

## Prerequisites

- Node.js 24.19.0
- pnpm 11.25.0
- Docker

## Installation

```bash
pnpm install --frozen-lockfile
```

## Type checking

```bash
pnpm typecheck
```

## Build

```bash
pnpm build
```

## Environment configuration

Copy the example environment file:

```bash
cp .env.example .env
```

| Variable | Required | Default | Allowed values |
|---|---|---|---|
| `NODE_ENV` | Yes | — | `development`, `test`, `production` |
| `PORT` | No | `5000` | Integer from `1` to `65535` |
| `LOG_LEVEL` | No | `info` | `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `silent` |

Environment variables are validated during application startup. The process
exits immediately when the configuration is invalid.

## Verify configuration and logging

Build the workspace:

```bash
pnpm build
```

Run the API using the local environment file:

```bash
node --env-file=.env apps/api/dist/index.js
```

Development uses readable pretty logs. Production emits structured JSON logs
with sensitive fields removed.
