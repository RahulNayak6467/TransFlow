# Transflow — Technology Stack

## 1. Stack philosophy

Transflow deliberately uses technologies that each solve a concrete problem in the product.

The project does **not** add tools merely to increase résumé keyword count.

Core choices:

- TypeScript/Node.js for backend **control-plane** services
- **Go for the dedicated transcoding worker/data plane**
- Express for explicit backend fundamentals
- PostgreSQL + raw SQL rather than an ORM
- S3 for large media objects
- Kafka for asynchronous distributed processing
- Redis for caching and distributed rate limiting
- FFmpeg/FFprobe for media processing
- HLS for adaptive playback
- Docker/Compose for packaging and local integration
- Kubernetes for deployment/scaling
- Pino + OpenTelemetry + Prometheus + Grafana for observability
- GitHub Actions for CI/CD
- Terraform for infrastructure as code

---

# 2. TypeScript

**Role:** primary backend language.

Used by:

- API
- coordinator
- finalizer
- authentication/email/business logic
- PostgreSQL/Redis control-plane integrations
- shared TypeScript packages
- TypeScript tests

### Why

- compile-time safety
- strong Node ecosystem
- AWS/Kafka/PostgreSQL support
- shared domain/event types
- good fit for control-plane/backend work

### Practices

- `strict: true`
- avoid uncontrolled `any`
- runtime validation at external boundaries
- narrow types
- explicit state types where useful
- pin the supported Node.js and pnpm versions and install from the committed lockfile

### Important distinction

TypeScript types disappear at runtime. External input still needs runtime validation.

### Introduced

Phase 0.

---

# 3. Node.js

**Role:** runtime for TypeScript services.

Important concepts:

- process lifecycle
- signals
- HTTP server
- asynchronous I/O
- child process spawning
- graceful shutdown
- environment configuration

### Important boundary

Node/TypeScript does **not** own the production transcoding worker. The CPU/process-heavy worker orchestration is intentionally implemented in Go.

### Introduced

Phase 0.

---


# 4. Go

**Role:** dedicated transcoding worker language.

Go is intentionally restricted to one meaningful microservice boundary rather than being spread throughout Transflow.

Used for:

- Kafka consumer for transcoding/rendition jobs
- worker lifecycle
- worker pools
- bounded concurrency
- S3 source acquisition
- FFprobe execution
- FFmpeg process management
- 360p/480p/720p/1080p generation
- HLS segments/playlists
- FFmpeg progress parsing
- progress reporting
- S3 output upload
- bounded concurrent output uploads
- multipart upload when a generated individual object genuinely requires it
- job cancellation
- `context.Context`
- safe FFmpeg termination
- graceful shutdown/draining
- temporary-file/workspace lifecycle
- cleanup
- worker heartbeats/health state
- resource/concurrency limits
- worker-local transient retries
- idempotent duplicate Kafka handling
- publishing `TranscodingStarted`, `TranscodingProgress`, `RenditionCompleted`, and `TranscodingFailed`
- worker metrics

### Why Go here

The worker is long-running and operationally different from the HTTP control plane. It benefits from explicit concurrency and cancellation primitives:

- goroutines
- channels
- `select`
- worker pools
- `context.Context`
- `os/exec`
- signal handling
- strong standard-library support for long-running services

FFmpeg still performs the actual encoding. Go controls the lifecycle around FFmpeg.

### Go concepts Transflow should teach

#### Core
- modules/packages
- structs/methods
- interfaces at useful boundaries
- pointers
- slices/maps
- errors and error wrapping
- `defer`
- standard library testing

#### Concurrency
- goroutines
- channels
- `select`
- `sync.WaitGroup`
- mutexes when necessary
- bounded worker pools
- backpressure inside one worker process

#### Cancellation/lifecycle
- `context.Context`
- deadlines/timeouts
- root service context
- per-job child context
- signal handling
- graceful drain

#### Process management
- `os/exec`
- `exec.CommandContext`
- stdout/stderr
- exit status
- FFmpeg progress pipe/output
- child-process termination
- preventing orphan processes

#### Production worker concerns
- structured logging with `log/slog`
- `go test`
- `go vet`
- race detector during reliability work
- metrics
- profiling basics later if required
- temporary workspace ownership/cleanup

### Explicitly not written in Go

- Express API
- authentication
- upload-control APIs/presigning
- coordinator
- finalizer
- PostgreSQL business/domain layer
- Redis caching/rate limiting
- email logic
- frontend-facing business logic

### Event ownership

The Go worker publishes:

- `TranscodingStarted`
- throttled `TranscodingProgress`
- `RenditionCompleted`
- `TranscodingFailed`

The Go worker does **not** publish `VideoReady`.

`VideoReady` is owned by the TypeScript finalizer after it verifies all required rendition completion.

### Introduced

Go learning can happen alongside early phases, but production project code begins in **Phase 3** with the media execution core. Kafka-backed long-running worker behavior is introduced in Phase 4.

---

# 5. Express.js

**Role:** HTTP framework for API service.

Used for:

- routing
- middleware
- validation integration
- error middleware
- authentication integration
- health endpoints

### Why Express

- explicit
- minimal hidden behavior
- strong ecosystem
- exposes important backend design choices directly

### Why not NestJS

The project intentionally uses Express so lifecycle, middleware, dependency, and application-structure decisions remain visible rather than framework-driven.

### Introduced

Phase 0.

---

# 6. pnpm workspaces

**Role:** monorepo package management.

Target layout:

```text
apps/api
apps/coordinator
apps/worker
apps/finalizer

packages/config
packages/db
packages/logger
packages/shared
```

### Why pnpm

- first-class workspaces
- efficient dependency storage
- clear package boundaries
- simpler than adding Nx/Turborepo immediately

### Not initially using

- Nx
- Turborepo
- remote build cache
- complex monorepo release orchestration

### Introduced

Phase 0.

---

# 7. PostgreSQL

**Role:** durable relational source of truth.

Stores:

- users
- videos
- upload sessions
- source metadata
- renditions
- processing jobs
- retry state
- preferences
- workflow status

### Why

- transactions
- constraints
- relational modeling
- mature indexing/query planner
- strong ecosystem
- good fit for video/job/user relationships

### Concepts to learn

- indexes
- transactions
- MVCC
- locks/deadlocks
- connection pooling
- query planning
- EXPLAIN ANALYZE
- constraints
- migrations
- pagination
- normalization

### Introduced

Connection foundation in Phase 0; real domain work in Phase 1.

---

# 8. node-postgres (`pg`)

**Role:** PostgreSQL driver.

### Why raw `pg`

The project intentionally uses raw SQL to learn:

- SQL
- schema design
- query plans
- indexing
- transactions
- locking
- database failure behavior

### Patterns

- one shared `Pool` per service/process
- `pool.query()` for independent queries
- checked-out client for transactions
- parameterized SQL
- `pool.end()` during shutdown

### Not using as primary data access

- Prisma
- TypeORM
- Sequelize
- Drizzle ORM

### Introduced

Phase 0.

---

# 9. Raw SQL migrations

**Role:** version database schema.

Conceptual structure:

```text
packages/db/migrations/
001_initial.sql
002_create_videos.sql
003_add_upload_sessions.sql
...
```

### Requirements

- deterministic order
- applied migration tracking
- concurrency guard/advisory lock around migration execution
- transactional application where PostgreSQL and the migration operation permit it
- CI/test compatibility
- backward-compatible expand/contract changes once rolling deployment begins
- no casual manual production schema mutation

### Introduced

Phase 0.

---

# 10. Zod

**Role:** runtime validation.

Used for:

- environment variables
- request bodies
- path params
- query params
- event payload boundaries where useful

### Why

```text
untrusted external data
→ Zod
→ validated typed value
```

### Introduced

Phase 0.

---

# 11. Pino

**Role:** structured logging for TypeScript services.

### Why

- JSON structured logs
- efficient
- child/context loggers
- good Node support

### Context fields

Eventually:

- service
- requestId
- traceId
- videoId
- uploadId
- renditionId
- jobId
- workerId
- attempt
- errorCode

### Go worker logging

The Go worker should use structured JSON logging, preferably the standard-library `log/slog` unless a stronger requirement appears. Log field names should align with the TypeScript services so cross-service searches can use the same IDs.

### Introduced

Phase 0 for TypeScript services; Go logging when the worker begins.

---

# 12. Vitest

**Role:** TypeScript service test runner.

Used for:

- TypeScript unit tests
- API/integration tests
- TypeScript failure-path tests

The Go worker uses Go's native `testing` package with `go test ./...`; later reliability work should also use `go test -race` where appropriate.

API tests may use Supertest or direct app invocation.

PostgreSQL integration tests should prefer a real test DB/service rather than mocking SQL semantics.

### Introduced

Phase 0.

---

# 13. ESLint + Prettier

**Role:** code quality and formatting.

### ESLint

Catches suspicious/disallowed patterns.

### Prettier

Automates formatting.

These are separate from:

- TypeScript type checking
- tests
- build

### Introduced

Phase 0.

---

# 14. GitHub Actions

**Role:** CI from Phase 0; full CI/CD later.

## Phase 0 pipeline

```text
install TypeScript dependencies with frozen lockfile
→ typecheck
→ lint
→ format check
→ test
→ build
```

PostgreSQL can run as a service container for integration tests.

## From Phase 3

When the Go worker enters production code, CI also runs `gofmt` checks, `go vet`, `go test ./...`, targeted race-detector tests, and the Go worker build.

## Later

- build Docker images
- publish images
- deploy Kubernetes
- verify rollout
- handle migrations safely

### Introduced

Phase 0.

---

# 15. Docker

**Role:** reproducible packaging.

Eventually build separate images for:

- API
- coordinator
- worker
- finalizer

### Production topics

- multi-stage builds
- image layers
- `.dockerignore`
- non-root user
- PID 1/signals
- health checks
- immutable image

### Introduced

Conceptually early; production image work in Phase 8.

---

# 16. Docker Compose

**Role:** local integration environment.

Evolution:

### Phase 0
- PostgreSQL

### Phase 4
- Kafka

### Phase 7
- Redis

### Later
- all services
- optional local observability components

### Why

One reproducible command should start local dependencies instead of manually running every service.

---

# 17. AWS S3

**Role:** object storage.

Stores:

- source videos
- HLS segments
- rendition playlists
- master playlist

### Why

- large-object storage
- direct upload
- multipart upload
- lifecycle management
- CloudFront integration

### Concepts

- buckets
- object keys
- multipart upload
- presigned URLs
- lifecycle
- IAM
- metadata
- abort incomplete uploads
- checksum/integrity verification
- private bucket access through least-privilege IAM

### Introduced

Phase 2.

---

# 18. AWS SDKs for S3

**Role:** S3 control plane from backend.

Used for:

- create multipart upload
- presign part URLs
- complete multipart upload
- abort multipart upload
- object operations

### Security

Browser receives only temporary scoped presigned URLs, never long-lived AWS credentials.

### Introduced

Phase 2.

---

# 19. FFprobe

**Role:** media inspection.

Extracts:

- duration
- width/height
- container
- video/audio codec
- frame rate
- stream metadata

### Why

Client MIME type or file extension is not trustworthy proof of valid media.

### Introduced

Phase 3.

---

# 20. FFmpeg

**Role:** actual video transcoding engine.

Outputs:

- 1080p
- 720p
- 480p
- 360p
- HLS segments/playlists

The rendition ladder is source-aware: Transflow does not upscale lower-resolution input by default.

### Important implementation concerns

- spawn with argument arrays
- avoid shell interpolation
- inspect exit codes
- capture stderr
- timeout/cancellation
- temporary workspaces
- cleanup
- resource limits

### Introduced

Phase 3.

---

# 21. HLS

**Role:** adaptive streaming output.

Components:

- master playlist
- rendition/media playlists
- media segments

### Why

- widely supported
- CDN-friendly
- natural fit for multiple quality levels
- demonstrates a realistic transcoding pipeline

### Introduced

Phase 3.

---

# 22. Apache Kafka

**Role:** asynchronous event/work distribution.

Used for:

- processing requests
- rendition jobs
- rendition completion/failure
- finalization triggers
- possibly notification triggers

### Why

- partitions
- consumer groups
- durable event log
- horizontal worker consumption
- real distributed-system semantics

### Concepts

- producer
- consumer
- topic
- partition
- offset
- consumer group
- retention
- ordering
- at-least-once
- rebalancing
- lag
- retries
- DLQ patterns

### Introduced

Phase 4.

---

# 23. KafkaJS

**Role:** Kafka client for Node/TypeScript services.

Used by the TypeScript side:

- API producer
- coordinator
- finalizer

The Go worker uses a Go-native Kafka client rather than KafkaJS.

### Important concerns

- consumer lifecycle
- message keys
- event schema
- shutdown
- error handling
- trace context
- retry semantics

### Introduced

Phase 4.

### Go Kafka client

The Go worker needs a native Go Kafka consumer/producer client. Prefer a mature client such as **franz-go** unless implementation experiments justify another choice.

It is responsible for:

- joining the worker consumer group
- decoding versioned rendition-job messages
- committing/handling offsets according to the chosen processing semantics
- publishing `TranscodingStarted`, throttled `TranscodingProgress`, `RenditionCompleted`, and `TranscodingFailed`
- clean shutdown/rebalance behavior
- trace/event metadata propagation

The exact Kafka client is an implementation-level decision; the architecture requirement is a production-capable Go client with explicit consumer lifecycle control.

---

# 24. Redis

**Role:** caching and distributed rate limiting.

### Caching

Likely cache-aside with:

- TTL
- invalidation
- fallback
- stampede considerations
- metrics

### Rate limiting

Shared state across API replicas.

### Explicitly not used for

- authoritative upload state
- authoritative job state
- HLS manifests
- durable workflow state

### Introduced

Phase 7.

---

# 25. Kubernetes

**Role:** deployment, lifecycle management, and scaling.

Deploys:

- API
- coordinator
- worker
- finalizer

### Concepts

- Pod
- Deployment
- ReplicaSet
- Service
- ConfigMap
- Secret
- requests/limits
- probes
- rolling update
- HPA
- graceful termination
- service discovery

### Go worker-specific value

- independent scaling from the TypeScript API/control plane
- control of replica count separately from in-process Go concurrency
- rolling replacement
- SIGTERM-driven draining
- stop claiming new Kafka work while draining
- safe FFmpeg child-process handling during termination
- CPU/memory/ephemeral-storage resource control

### Introduced

Phase 8.

---

# 26. OpenTelemetry

**Role:** distributed tracing/telemetry instrumentation.

Target cross-language trace:

```text
TypeScript API
→ PostgreSQL
→ Kafka producer
→ TypeScript coordinator
→ Go worker
→ S3 / FFprobe / FFmpeg
→ TypeScript finalizer
```

### Important concern

Trace context must be explicitly propagated through asynchronous Kafka messages **and across the TypeScript↔Go boundary**. Use the appropriate OpenTelemetry SDK/instrumentation in each language.

### Introduced

Phase 9.

---

# 27. Prometheus

**Role:** metrics collection.

Metrics include:

- API latency
- request rate
- errors
- Go worker utilization
- active Go worker jobs
- Go worker CPU/memory
- transcoding duration
- FFmpeg duration
- FFmpeg failures
- cancellations
- Kafka lag
- retries
- cache hit ratio
- readiness failures

### Introduced

Phase 9.

---

# 28. Grafana

**Role:** operational dashboards.

Dashboards can cover:

- API
- workers
- processing
- Kafka
- cache
- failures
- system health

### Introduced

Phase 9.

---

# 29. Authentication

Supported scope:

- email/password
- Google OAuth
- GitHub OAuth
- email verification
- password reset

The exact library/provider is chosen during Phase 10 based on security, integration quality, cost, and learning value.

### Important rule

Do not implement OAuth protocol or password cryptography from scratch when mature libraries/providers solve it safely.

### Explicitly excluded

- SAML
- enterprise SSO
- MFA
- organizations
- teams
- API keys

### Introduced

Phase 10.

---

# 30. Email provider

**Role:** transactional email.

Required messages:

- verify email
- reset password
- video READY
- video permanently failed

### Architectural rule

Email is a side effect. Email-delivery failure must not turn a successful video-processing workflow into a failed video.

### Introduced

Phase 10.

---

# 31. k6

**Role:** load/performance testing.

Used for:

- API load
- status-query load
- upload-control endpoint load
- capacity experiments

Huge object-upload throughput may need complementary scripts because it behaves differently from normal API load.

### Introduced

Phase 11.

---

# 32. AWS CloudFront

**Role:** CDN for HLS output.

Flow:

```text
viewer
→ CloudFront
→ S3 origin
```

### Benefits

- edge delivery
- reduced S3 origin load
- better playback characteristics
- production-style media serving

### Introduced

Phase 12.

---

# 33. OpenAPI / Swagger

**Role:** API contract documentation.

Documents:

- endpoints
- path/query params
- request schemas
- responses
- error codes
- authentication requirements

Documentation should reflect real behavior rather than diverge from implementation.

### Introduced

Can begin earlier; final polish in Phase 12.

---

# 34. Terraform

**Role:** infrastructure as code.

Potentially manages:

- S3
- IAM
- CloudFront
- networking
- container registry
- Kubernetes infrastructure
- managed services where practical

### Concepts

- provider
- resource
- data source
- variable
- output
- plan
- apply
- state
- remote state
- locking
- module
- drift
- import

### Introduced

Phase 13.

---

# 35. Frontend

The frontend exists to demonstrate the real product lifecycle without becoming the main engineering focus.

Recommended:

- Next.js
- TypeScript
- Inter as main UI font
- light neutral primary theme
- restrained cobalt-blue brand accent
- HLS-capable video player
- data-fetching/state tooling only where justified

Main screens:

- sign in/sign up
- videos
- upload
- video details
- processing
- workers
- infrastructure
- observability
- settings

The interface should expose real backend state rather than fictional cloud-management features.

---

# 36. Technology introduction by phase

| Phase | Main technologies/concepts introduced |
|---|---|
| 0 | TypeScript, Node, Express, pnpm, PostgreSQL/pg, Zod, Pino, Vitest, Docker Compose, GitHub Actions |
| 1 | deeper PostgreSQL/raw SQL/API design |
| 2 | S3, AWS SDK, presigned multipart upload |
| 3 | **Go worker media core**, AWS SDK for Go v2, FFprobe, FFmpeg, HLS |
| 4 | Kafka, KafkaJS for TypeScript, Go Kafka client, TypeScript coordinator + long-running Go worker |
| 5 | Go worker pools/bounded concurrency, distributed Go worker replicas, TypeScript finalizer |
| 6 | retries, DLQ, idempotency, crash recovery |
| 7 | Redis |
| 8 | production Docker + Kubernetes |
| 9 | OpenTelemetry for TypeScript + Go, Prometheus worker metrics, Grafana |
| 10 | auth implementation + transactional email |
| 11 | k6 |
| 12 | CloudFront, full CI/CD, OpenAPI polish |
| 13 | Terraform |

---

# 37. Explicit non-stack / deferred technologies

## Not in MVP

- NestJS
- ORM
- gRPC
- Elasticsearch
- service mesh
- GraphQL
- live streaming/RTMP
- DRM
- AI/LLM features
- browser push notifications
- enterprise SSO
- organization RBAC
- multi-region active-active

## Possible later polish

### gRPC

Only if a real synchronous internal service-to-service call appears where gRPC provides a meaningful benefit.

### Elasticsearch

Only if Transflow develops a genuine full-text/indexed-search requirement.

---

# 38. Final stack summary

```text
Frontend
  Next.js + TypeScript

Backend control plane
  Node.js + TypeScript + Express

Transcoding data plane
  Go worker + Go Kafka client + AWS SDK for Go v2
  context.Context + os/exec
  FFprobe + FFmpeg orchestration

Database
  PostgreSQL + raw SQL + pg

Validation
  Zod

Logging
  Pino (TypeScript)
  log/slog structured JSON (Go worker)

Object storage
  AWS S3

Async processing
  Apache Kafka
  KafkaJS (TypeScript services)
  Go Kafka client (worker)
  versioned language-neutral event contracts

Cache / rate limit
  Redis

Media
  FFprobe + FFmpeg + HLS

Local infrastructure
  Docker + Docker Compose

Production orchestration
  Kubernetes

Observability
  OpenTelemetry + Prometheus + Grafana

Testing
  Vitest + TypeScript integration tests
  Go testing + go vet + race detector where appropriate
  k6

CI/CD
  GitHub Actions

CDN
  CloudFront

API docs
  OpenAPI / Swagger

Infrastructure as code
  Terraform

Authentication
  Email/password + Google + GitHub

Email
  Transactional email provider
```

Every technology should remain justified by a concrete system requirement rather than résumé keyword density.
