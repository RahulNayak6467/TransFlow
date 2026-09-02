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
