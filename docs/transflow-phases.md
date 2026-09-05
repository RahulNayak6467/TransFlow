# Transflow — Extremely Detailed Phase Plan

## Overview

Transflow is built **feature-first**, not technology-first. Every technology is introduced because a product or operational requirement makes it necessary.

Approximate schedule:

- **Core MVP:** ~6 months
- **Terraform:** ~15 additional days

The schedule is a planning boundary, not a reason to ship broken work. At the same time, phases should not expand indefinitely through unnecessary abstractions.

---

# Scope guard

Add work to a phase when it closes a concrete correctness, security, recovery, testability, or operability gap in functionality already introduced by that phase. Prefer a small explicit implementation or documented runbook before adopting another platform.

Defer service mesh, schema-registry infrastructure, secrets platforms, workflow engines, extra databases, and generalized internal frameworks until a measured requirement makes one necessary. A concept may be learned or documented without becoming an MVP dependency.

---

# Continuous practices across every phase

## Testing

Testing starts in Phase 0 and continues in every phase.

Every phase should add:

- happy-path tests
- failure-path tests
- boundary cases
- integration tests when real dependencies matter

Phase 11 is not “the testing phase.” It is specifically the phase for:

- full E2E validation
- failure injection
- load testing
- stress testing
- performance analysis
- bottleneck analysis
- capacity estimation

## Logging

Structured logging starts in Phase 0.

Context grows with the system:

- requestId
- videoId
- uploadId
- renditionId
- jobId
- workerId
- attempt
- traceId

## Error handling

Centralized API errors begin in Phase 0.

Later, provider-specific failures are translated into application-level failures:

- PostgreSQL
- S3
- Kafka
- Redis
- FFmpeg
- email provider
- authentication provider

## Documentation

Continuously maintain:

- README
- ADRs
- architecture diagrams
- API contracts
- event contracts
- failure-mode notes
- benchmark results
- deployment notes
- interview notes

## Interview/theory notes

For each major concept, capture:

1. What is it?
2. What problem does it solve?
3. How does it work?
4. What alternatives exist?
5. What are the trade-offs?
6. What are the failure modes?
7. How does it scale?
8. How is it observed?
9. How does Transflow use it?
10. What interview questions could be asked?

---

# Phase 0 — Production-ready project foundation

**Target:** ~1 week / approximately 22–30 focused hours.

## Product goal

There is almost no video-specific functionality yet. The goal is to establish a foundation that can safely support all later services.

End-state:

```text
start application
→ validate configuration
→ initialize logger
→ PostgreSQL available
→ migrations work
→ Express starts
→ health endpoints work
→ errors are centralized
→ tests/lint/typecheck/build pass
→ CI verifies repository
→ SIGTERM closes HTTP + DB cleanly
```

## Theory to learn

### Monorepo/workspaces
- monorepo vs polyrepo
- workspace packages
- app vs shared package
- service vs repository
- dependency boundaries
- why four services can live in one Git repo

### TypeScript project configuration
- strict mode
- target
- module
- moduleResolution
- rootDir/outDir
- source maps
- noUncheckedIndexedAccess
- exactOptionalPropertyTypes
- typecheck vs build vs runtime

### Node.js process lifecycle
- process startup
- process.env
- SIGINT
- SIGTERM
- exit codes
- resource ownership
- uncaughtException/unhandledRejection concept
- graceful termination

### Express architecture
- request lifecycle
- middleware ordering
- app.ts vs server.ts
- routes
- async errors
- error middleware
- not-found middleware

### Configuration management
- environment variables
- secrets vs config
- fail-fast startup
- typed config
- Zod validation
- `.env` vs `.env.example`

### Structured logging
- JSON logs
- log levels
- request IDs
- contextual/child loggers
- stdout
- dev pretty logs vs production JSON

### Docker Compose
- services
- ports
- networking
- service discovery
- named volumes
- health checks
- startup order vs readiness
- meaning of localhost inside containers

### PostgreSQL connection management
- connection cost
- connection pool
- pool.query
- pool.connect
- client.release
- pool.end
- idle timeout
- connection timeout
- transaction requires one client

### Migrations
- schema versioning
- ordered migrations
- migration history
- forward migrations
- rollback concept
- danger of manual production schema edits

### Health checks
- liveness
- readiness
- dependency checks
- orchestrator/load-balancer use

### Error handling
- expected/operational errors
- unexpected/programmer failures
- safe client messages
- internal logging
- HTTP status semantics
- stable error envelope
- provider-error translation concept

### Graceful shutdown
- stop accepting traffic
- in-flight requests
- close HTTP server
- close DB pool
- cleanup ordering
- shutdown timeout concept
- relation to containers/Kubernetes

### Testing
- unit
- integration
- E2E concept
- setup/teardown
- isolation
- happy/failure paths
- DB integration testing

### API design foundation
- resource-oriented endpoints
- HTTP methods
- idempotency basics
- status codes
- path/query/body semantics
- validation boundary
- versioning basics
- error contract
- backward compatibility concept

### CI
- workflow
- job
- step
- runner
- push/pull_request triggers
- exit codes
- dependency caching concept
- secrets concept
- service containers
- quality gates

## Implementation

- Git repository
- pnpm workspace
- pin the supported Node.js and pnpm versions
- commit `pnpm-lock.yaml` and use frozen-lockfile installs in CI
- `.gitignore`, `.env.example`, and basic repository hygiene
- initial monorepo layout
- strict TypeScript
- Express `app.ts` / `server.ts` split
- Zod config package
- Pino logger
- request ID middleware
- Docker Compose with PostgreSQL
- PostgreSQL named volume
- PostgreSQL container healthcheck
- shared `pg.Pool`
- DB health helper
- raw SQL migration mechanism
- migration concurrency guard so two processes cannot apply the same migration simultaneously
- `/health/live` in Phase 0C
- `/health/ready` with PostgreSQL dependency checking in Phase 0D
- centralized error middleware
- 404 middleware
- consistent JSON error shape
- graceful SIGTERM/SIGINT handling
- bounded shutdown timeout and a documented fatal-process-error policy
- basic HTTP defaults: disable `X-Powered-By` and apply a request-body size limit
- Vitest
- health tests
- DB integration test
- isolated test database/schema with deterministic cleanup
- invalid-config test
- ESLint
- formatter
- `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `migrate` scripts
- GitHub Actions CI
- README
- initial ADRs

## Explicitly not in Phase 0

- video schema beyond tiny setup test if needed
- S3
- multipart upload
- FFmpeg/FFprobe
- HLS
- Kafka
- Redis
- coordinator
- worker
- finalizer
- authentication
- email
- Kubernetes
- OpenTelemetry
- Prometheus/Grafana
- CloudFront
- Terraform

## Definition of done

```text
pnpm/docker startup
→ config validates
→ logger works
→ PostgreSQL works
→ migration works
→ API starts
→ live = 200
→ ready = 200 when DB works
→ ready = 503 when DB unavailable
→ tests pass
→ lint/typecheck/build pass
→ CI passes
→ SIGTERM closes HTTP and DB cleanly within the shutdown deadline
```

You should also be able to explain **why every component exists**.

---

# Phase 1 — Video metadata and domain model

**Target:** ~2 weeks.

## Product goal

Create and manage video resources safely in PostgreSQL using raw SQL.

The system now has a real `Video` domain even though media bytes are not yet uploaded.

## Theory

### Relational modeling
- entities
- primary keys
- foreign keys
- constraints
- uniqueness
- nullability
- timestamps
- state representation
- normalization
- denormalization trade-offs

### PostgreSQL indexes
- B-tree
- selectivity
- composite indexes
- order of columns
- unique indexes
- partial indexes concept
- covering/index-only scan concept

### Query planning
- sequential scan
- index scan
- EXPLAIN
- EXPLAIN ANALYZE
- planner cost concept

### Transactions
- ACID
- BEGIN/COMMIT/ROLLBACK
- atomic updates
- isolation overview
- locks
- deadlock concept
- MVCC overview

### API design
- resource representation
- create/get/list/update/delete semantics
- pagination
- filtering
- sorting
- validation
- conflict semantics
- idempotency considerations

### Domain state
- video states
- legal transitions
- why arbitrary string status updates are dangerous

## Implementation

Create migrations/tables for the video domain.

Build APIs such as:

```http
POST   /api/v1/videos
GET    /api/v1/videos
GET    /api/v1/videos/:videoId
PATCH  /api/v1/videos/:videoId
DELETE /api/v1/videos/:videoId
```

Add:

- Zod request validation
- parameterized raw SQL
- pagination
- filtering
- sorting
- indexes based on actual access patterns
- transactions only where needed
- domain-specific error codes
- integration tests
- EXPLAIN ANALYZE experiments

## Definition of done

A video resource can be created, listed, fetched, updated within allowed rules, and deleted with consistent SQL/API behavior.

---

# Phase 2 — Reliable multi-gigabyte uploads

**Target:** ~3 weeks.

## Product goal

Upload very large local videos reliably without proxying file bytes through the Node API.

## Theory

### Object storage
- bucket/object model
- object keys
- metadata
- durability concept
- lifecycle rules
- object storage vs filesystem

### Presigned URLs
- purpose
- temporary scoped permission
- expiration
- security implications
- server-controlled object keys

### Multipart upload
- initiate
- part upload
- ETag
- complete
- abort
- part sizing constraints
- retry per part
- parallelism
- resume

### Reliability
- bounded concurrency
- exponential backoff
- jitter
- client interruption
- stale upload sessions
- abandoned multipart cleanup

### Security
- ownership
- max file size
- allowed media type
- object-key safety
- short-lived URLs
- trust boundaries

## Implementation

- S3 integration
- upload-session schema
- initialize multipart upload endpoint
- generate presigned URLs for parts
- complete endpoint
- abort endpoint
- ownership validation
- stable object-key convention
- client-side resumability
- bounded part concurrency
- part retry
- cleanup strategy for abandoned uploads
- S3 lifecycle rule for abandoned multipart uploads as a safety net
- verify completed object size and checksum/integrity metadata where supported
- reconcile S3 completion with durable upload-session state so repeated completion is safe
- persist object/upload state
- upload logging/metrics
- tests for resume and retry behavior

## Important correctness rule

Before upload, only perform basic client validation.

FFprobe occurs after the object exists in S3.

## Definition of done

A multi-GB upload can fail partially and resume without restarting the entire file.

---


# Parallel Go preparation before the dedicated worker

Go should not be introduced into Phase 0 just for the sake of using another language. During Phases 0–2, learn Go separately in small blocks so the project does not stall when the worker arrives.

Before implementing the Go worker, be comfortable with:

### Core Go
- modules/packages
- variables and basic types
- slices/maps
- structs
- methods
- interfaces
- pointers
- error handling and wrapping
- composition
- basic testing with `go test`

### Concurrency/lifecycle preparation
- goroutines
- channels
- `select`
- `sync.WaitGroup`
- mutexes conceptually
- bounded worker pools
- `context.Context`
- cancellation
- timeouts
- OS signals
- `os/exec`

You do **not** need advanced reflection, `unsafe`, compiler internals, custom networking stacks, or advanced generics for Transflow.

This is a preparation track only. The actual production Go code begins when the transcoding worker/media execution boundary appears.

---

# Phase 3 — Go media worker core: one uploaded video becomes playable HLS

**Target:** ~3 weeks.

## Product goal

Prove the complete media execution pipeline in **Go** before combining it with Kafka and distributed workflow complexity.

At this phase the Go worker can run through a development command/test harness rather than a production Kafka consumer. The purpose is to isolate:

```text
S3 source
→ Go worker core
→ FFprobe
→ FFmpeg
→ HLS
→ S3 output
```

## Go theory

### Core production Go
- package/module organization
- structs and methods
- small interfaces at real boundaries
- error wrapping
- explicit resource ownership
- `defer`
- standard library testing

### Context/cancellation
- `context.Context`
- deadline
- timeout
- cancellation propagation
- why context is passed down a call tree rather than stored globally

### Process management
- `os/exec`
- `exec.CommandContext`
- stdout/stderr pipes
- process exit codes
- cancellation
- process groups/signals concept
- avoiding shell interpolation

### Temporary resources
- `os.MkdirTemp`
- unique job workspace
- deterministic cleanup
- partial-output cleanup

## Media theory

### Media fundamentals
- container vs codec
- video/audio streams
- bitrate
- resolution
- frame rate
- GOP/keyframes
- transcoding vs transmuxing

### FFprobe
- stream/container inspection
- codec detection
- duration
- frame rate
- resolution
- invalid/corrupt detection

### FFmpeg
- process lifecycle
- arguments
- exit status
- stderr
- CPU/memory behavior
- cancellation/timeout

### HLS
- master playlist
- rendition/media playlists
- segments
- adaptive bitrate
- player behavior

## Implementation — Go

Build a Go media-execution core that can:

- obtain the uploaded source object from S3
- create a per-job temporary workspace
- run FFprobe
- parse FFprobe output into typed Go structs
- return detected codec, dimensions, duration, frame rate, and audio metadata in the structured result
- reject invalid/unsupported source media
- spawn FFmpeg safely
- generate:
  - 360p
  - 480p
  - 720p
  - 1080p
  - HLS segments/playlists
- avoid upscaling: generate only renditions allowed by the detected source dimensions
- parse FFmpeg progress
- expose progress to a callback/channel/internal reporter
- use `context.Context` for timeout/cancellation
- terminate FFmpeg safely when context is cancelled
- upload generated HLS files to S3
- use bounded concurrent uploads for the many small HLS files
- use multipart upload for a generated object only if object size actually warrants it
- clean temporary files on success
- clean partial artifacts on failure/cancellation
- return a structured success/failure result with stable error codes
- persist detected metadata through the TypeScript-owned business-state boundary; the Go worker must not write unrelated business state directly
- perform a development playback/playlist validation smoke test; production master-playlist ownership remains with the Phase 5 finalizer
- add Go unit/integration tests around command construction, valid/corrupt/unsupported media, FFmpeg failure, progress parsing, cancellation, and cleanup

The TypeScript API/coordinator/finalizer are **not rewritten in Go**.

## Definition of done

Given one uploaded source video and a local/development job specification, the Go media core can produce a source-appropriate HLS ladder in S3, report progress, persist detected metadata through the TypeScript boundary, validate playback, cancel safely, and leave no leaked temporary workspace.

---

# Phase 4 — Kafka-backed asynchronous Go transcoding worker

**Target:** ~3 weeks.

## Product goal

Turn the Phase 3 Go media core into a real long-running Kafka worker so media processing leaves the HTTP request path.

## Theory

### Kafka fundamentals
- producer
- consumer
- topic
- partition
- offset
- consumer group
- retention
- ordering
- at-least-once delivery
- rebalance
- consumer lifecycle

### Cross-language contracts
- TypeScript producer vs Go consumer
- language-neutral event envelope
- schema/version compatibility
- unknown/new fields
- validation at service boundaries

### Go long-running service lifecycle
- startup dependency initialization
- context tree
- goroutine ownership
- consumer loop
- cancellation
- clean resource shutdown
- OS signals

### Progress/event reporting
- event frequency
- throttling/coalescing
- why FFmpeg frame-level progress should not become frame-level Kafka/DB writes

## Implementation

### TypeScript control plane
- add Kafka to Docker Compose
- API publishes processing request
- introduce TypeScript coordinator
- coordinator creates/publishes rendition jobs
- maintain durable job/video state in PostgreSQL
- define versioned event schemas under `contracts/events`
- choose and document the Kafka partition key and ordering guarantee for every event type
- document the initial PostgreSQL-to-Kafka failure window and its recovery path; Phase 6 must close any unsafe dual-write gap

### Go worker
- add Kafka consumer for rendition/transcoding jobs
- decode and validate versioned job contracts
- initialize worker lifecycle
- tie each job to a `context.Context`
- call the Phase 3 media core
- publish:
  - `TranscodingStarted`
  - throttled `TranscodingProgress`
  - `RenditionCompleted`
  - `TranscodingFailed`
- include IDs required for correlation:
  - eventId
  - videoId
  - renditionId
  - jobId
  - attempt
  - workerId
  - trace context where available
- add clean Kafka consumer shutdown
- commit/acknowledge Kafka work only after the outcome is durably represented or safely published
- ensure cancellation shuts the FFmpeg child process down safely
- add worker health endpoint/health state if appropriate
- integration-test TypeScript → Kafka → Go worker → result event

### Important ownership rule

The Go worker does **not** publish `VideoReady`.

`VideoReady` belongs to the TypeScript finalizer once all required renditions have completed.

## Definition of done

The API returns quickly while a Kafka-delivered job is consumed and transcoded by the Go worker, with visible progress and completion/failure events.

---

# Phase 5 — Distributed Go worker pool and multi-rendition fan-out/fan-in

**Target:** ~3 weeks.

## Product goal

Process multiple renditions concurrently across multiple Go worker replicas and safely converge them through the TypeScript finalizer.

## Theory

### Go concurrency
- goroutines
- channels
- `select`
- WaitGroup
- mutexes where actually required
- worker pools
- bounded concurrency
- cancellation propagation
- avoiding goroutine leaks

### Distributed workers
- consumer groups
- work distribution
- process-level replicas vs goroutine-level concurrency
- oversubscription
- CPU-bound workload behavior

### Fan-out/fan-in
- independent rendition jobs
- completion aggregation
- finalizer ownership

### Atomicity/races
- unique constraints
- conditional updates
- transactions
- duplicate job creation
- race conditions

### Resource control
- jobs per worker
- FFmpeg CPU pressure
- memory pressure
- local disk/temp pressure
- Kubernetes replica count vs in-process concurrency

## Implementation

### Coordinator — TypeScript
- derive the required rendition ladder from persisted source metadata and never upscale by default
- create one durable job per required rendition, selected from:
  - 360p
  - 480p
  - 720p
  - 1080p
- prevent duplicate job creation with durable constraints
- use atomic claims/conditional state transitions so competing workers cannot both own the same attempt
- publish one work message per rendition

### Worker — Go
- implement bounded internal worker pool
- control max concurrently running FFmpeg processes
- expose active-job count
- assign stable worker ID
- process multiple Kafka messages safely
- cancel individual jobs independently
- use bounded concurrent S3 output uploads
- add worker resource/concurrency configuration
- add low-frequency worker heartbeat/last-seen mechanism where justified
- make heartbeat behavior non-blocking and non-critical to transcoding
- handle graceful process-level shutdown while jobs are active

### Finalizer — TypeScript
- consume rendition completion events
- verify durable state for all required renditions
- generate/verify final master playlist
- mark video READY
- publish `VideoReady`
- remain idempotent

### Tests
- multiple worker replicas
- concurrent rendition execution
- race/duplicate tests
- cancellation of one rendition without cancelling unrelated jobs
- oversubscription/resource-limit tests

## Definition of done

360p, 480p, 720p, and 1080p can execute concurrently across multiple Go workers and converge safely to one TypeScript-owned `VideoReady` transition.

---

# Phase 6 — Go worker reliability: crashes, duplicates, retries, and poison jobs

**Target:** ~3 weeks.

## Product goal

Make failures, duplicate deliveries, cancellation, and worker crashes normal operating conditions rather than exceptional surprises.

## Theory

### Distributed-system failure
- partial failure
- duplicate delivery
- lost acknowledgment
- stale work
- worker death
- at-least-once implications

### Retry design
- retryable vs permanent
- operation retry vs whole-job retry
- exponential backoff
- jitter
- bounded attempts
- retry storms

### Idempotency
- idempotent consumers
- stable output keys
- durable state checks
- unique constraints
- repeat-safe S3 writes
- crash-after-success-before-ack

### DLQ
- poison jobs
- dead-letter state/topic
- replay considerations
- operator visibility

### Go process reliability
- child-process cleanup
- context cancellation
- shutdown grace periods
- goroutine leaks
- panic boundaries
- resource cleanup on every path

### Transactional messaging
- dual-write problem
- outbox pattern concept
- when an outbox is justified
- inbox/deduplication record concept

## Implementation

### Go worker
- classify errors with stable error codes
- mark/report `retryable: true/false`
- retry short-lived worker-local S3/network operations safely
- **do not hide unlimited full-job retries inside the worker**
- handle duplicate Kafka jobs idempotently
- ensure already-completed rendition messages become harmless no-ops
- handle crash-after-upload / before-ack scenarios
- kill FFmpeg safely on timeout/cancellation
- clean local temporary files after:
  - success
  - FFmpeg failure
  - S3 failure
  - cancellation
  - shutdown
- handle worker shutdown while idle and while busy
- test FFmpeg process termination
- test duplicate message delivery
- test cancellation at multiple stages

### TypeScript workflow/job state
- own visible job attempt count
- schedule/resubmit retryable jobs
- exponential backoff + jitter
- max attempts
- permanent failure state
- DLQ
- video-level failure behavior
- failure timeline for UI
- recover stale claims/leases after worker death without stealing healthy work
- make an explicit outbox/reconciliation decision for every database-plus-Kafka state transition
- add durable event deduplication where database constraints alone are insufficient
- run targeted Go race-detector tests for worker concurrency paths

## Definition of done

A duplicate message, worker crash, cancellation, transient S3 failure, FFmpeg failure, or crash-after-success cannot corrupt rendition/video state or produce unsafe duplicate output.

---

# Phase 7 — Faster APIs and abuse protection

**Target:** ~2 weeks.

## Product goal

Add Redis only when the application has real read paths and multiple API replicas that justify shared cache/limit state.

## Theory

### Caching
- cache-aside
- TTL
- invalidation
- stale data
- hit/miss
- negative caching
- cache stampede
- TTL jitter
- hot keys
- eviction overview
- Redis failure fallback

### Rate limiting
- fixed window
- sliding log/window
- token bucket
- leaky bucket
- burst behavior
- shared state
- atomicity
- per-user vs per-IP
- 429
- Retry-After
- fail-open vs fail-closed

## Implementation

- add Redis to Compose
- cache one or more measured/justified endpoints
- invalidation on writes
- TTL
- Redis outage fallback
- cache hit/miss/error metrics
- distributed rate limiter
- rate-limit headers
- tests for boundaries and Redis failures
- explicit fail-open/fail-closed behavior per rate-limited endpoint
- cache-stampede protection only for endpoints where load tests show it is needed

## Definition of done

Selected reads are measurably faster and abuse-prone endpoints are limited consistently across replicas.

---

# Phase 8 — Production containers and Kubernetes

**Target:** ~3 weeks.

## Product goal

Run and scale the distributed application as independently deployable workloads.

## Theory

### Production Docker
- multi-stage builds
- layers
- build context
- `.dockerignore`
- non-root user
- PID 1/signals
- health checks
- immutable images
- config/secrets separation

### Kubernetes
- Pod
- Deployment
- ReplicaSet
- Service
- ConfigMap
- Secret
- requests/limits
- ephemeral-storage requests/limits for FFmpeg temporary workspaces
- non-root security contexts and least-privilege filesystem permissions
- liveness/readiness
- scheduling
- rolling deployment
- HPA
- graceful termination
- service discovery

### Scaling
- stateless API scaling
- worker scaling
- CPU-bound workload behavior
- bottleneck relocation

## Implementation

- production Dockerfile for each service
- complete local Compose stack
- K8s manifests
- API Deployment/Service
- coordinator Deployment
- worker Deployment
- finalizer Deployment
- probes
- requests/limits
- ConfigMaps/Secrets
- worker scaling
- HPA where justified
- prefer queue lag/backlog and measured worker saturation over CPU-only scaling when practical
- rolling deployment tests
- worker draining
- termination grace period

## Definition of done

Services deploy independently and worker capacity can scale without scaling the API.

---

# Phase 9 — Observability and diagnosis

**Target:** ~3 weeks.

## Product goal

Diagnose a failed or slow video from telemetry rather than manually inspecting scattered logs.

## Theory

### Observability
- logs vs metrics vs traces
- correlation
- instrumentation
- cardinality
- RED/USE concepts

### Metrics
- counters
- gauges
- histograms
- percentiles
- latency distributions

### Distributed tracing
- trace
- span
- parent/child
- context propagation
- async Kafka propagation

### SLI/SLO basics
- availability
- latency
- failure rate
- bounded metric labels to avoid high-cardinality Prometheus data
- sensitive-field redaction across logs and traces
- actionable alerts for a small set of user-impacting failures and saturation signals
- objective concept

## Implementation

- enrich Pino context
- Prometheus metrics
- OpenTelemetry instrumentation
- propagate trace context through Kafka
- traces across API → coordinator → worker → finalizer
- Grafana dashboards
- Go worker metrics:
  - transcoding duration
  - FFmpeg duration
  - CPU/memory
  - active jobs
  - completed/failed jobs
  - FFmpeg failures
  - cancellations
  - retries
- worker heartbeat/last-seen visibility
- Kafka lag
- cache metrics
- API p95
- transcoding duration
- failure rate
- service-health UI

## Definition of done

Given a video ID, job ID, or trace ID, you can explain where time was spent and where a failure occurred.

---

# Phase 10 — Authentication, authorization, security, and email

**Target:** ~2 weeks.

## Product goal

Add real identity, ownership, upload security, and the intentionally small email feature set.

## Theory

### Authentication
- password hashing
- sessions/tokens depending chosen solution
- OAuth/OIDC basics
- Google/GitHub flow
- callback security
- email verification
- password reset

### Authorization
- authn vs authz
- ownership
- 401 vs 403
- resource isolation

### API/security
- input validation
- secret management
- secure headers
- CORS
- presigned URL security
- SQL injection prevention
- least privilege
- dependency hygiene

### Email
- transactional email
- verification/reset security
- provider failure
- idempotent notification
- asynchronous delivery concept

## Implementation

Authentication:

- email/password
- Google
- GitHub
- email verification
- forgot/reset password
- secure password hashing parameters and single-use, expiring verification/reset tokens
- explicit cookie/session or bearer-token strategy, including CSRF protection when cookies are used
- OAuth state/nonce validation and safe account-linking rules

Authorization:

- user owns videos
- user owns upload sessions
- protected playback/status APIs

Email:

- video-ready email
- permanent-failure email
- verification/reset emails

Preferences:

- email on ready
- email on permanent failure
- keep original source

Security:

- CORS policy
- secure headers
- ownership before presigned URLs
- file constraints
- secrets handling
- safe errors
- container hardening review
- abuse tests
- audit-friendly security event logs without credentials or tokens

## Non-goals

- organizations
- teams
- invitations
- enterprise RBAC
- SAML
- enterprise SSO
- MFA
- API keys
- browser push
- weekly summaries

---

# Phase 11 — Load, failure, bottleneck, and capacity validation

**Target:** ~3 weeks.

## Product goal

Prove how the system behaves under load and failure instead of assuming it scales.

## Theory

### Load testing
- throughput
- latency
- concurrency
- arrival rate
- saturation

### Capacity planning
- upload bandwidth
- storage growth
- transcoding CPU time
- worker throughput
- Kafka lag
- DB connections
- cache behavior

### Performance
- CPU-bound vs I/O-bound
- bottlenecks
- queueing delay
- resource contention

### Failure testing
- dependency outage
- worker kill
- duplicate event
- Kafka pause
- Redis outage
- Postgres slowdown
- S3 transient errors

## Implementation

- complete E2E test
- k6 API/load scenarios
- multiple concurrent uploads
- processing queue load
- worker scaling experiments
- throughput at 1/2/4/8+ workers
- kill workers mid-job
- Redis outage
- Kafka disruption tests where safe
- DB latency experiment
- malformed media
- representative media corpus across codecs, resolutions, durations, and corrupt inputs
- soak test long-running workers for goroutine, child-process, file-descriptor, and temporary-disk leaks
- retry exhaustion
- DLQ validation
- capacity calculations
- cost-oriented measurements such as CPU time and output storage per input minute
- benchmark report

## Definition of done

You can answer:

- what limits throughput?
- how much does adding workers help?
- where does latency accumulate?
- what happens during dependency failure?
- what capacity can the current deployment support?

---

# Phase 12 — Delivery, CDN, API docs, final engineering polish

**Target:** ~2 weeks.

## Product goal

Make Transflow deployable, reviewable, and understandable as a production-style system.

## Theory

### CI/CD
- image build
- registry
- deployment pipeline
- environment separation
- rolling rollout
- rollback
- migration safety
- deployment verification

### CDN
- origin
- edge cache
- cache-control
- HLS delivery
- invalidation vs versioned assets

### API documentation
- OpenAPI
- contract documentation
- examples
- auth/error documentation

## Implementation

CI expands to:

- all service builds
- all tests
- image builds
- useful dependency/security checks

CD:

- publish images
- deploy K8s workloads
- rollout verification
- migration strategy
- backward-compatible expand/contract migrations and rollback procedure
- deployment rollback and post-deploy smoke test

CDN:

- CloudFront in front of S3 HLS output
- private S3 origin access; do not make the media bucket public
- intentional cache-control/versioned object-key policy
- playback URL integration

Data protection and operations:

- PostgreSQL backup policy and at least one restore drill
- S3 source/output retention and lifecycle rules aligned with product preferences
- documented secret rotation and incident/recovery runbook at an MVP-appropriate level

Documentation:

- OpenAPI
- architecture docs
- ADR cleanup
- local setup guide
- deployment guide
- failure model
- benchmark results
- interview notes
- architecture diagrams

## Definition of done

A new reviewer can clone, understand, run, test, deploy, and inspect the system without undocumented tribal knowledge.

---

# Phase 13 — Terraform / Infrastructure as Code

**Target:** ~15 days.

## Product goal

Reproduce important infrastructure through code instead of manual cloud-console setup.

## Days 1–3 — Fundamentals

Learn:

- providers
- resources
- variables
- outputs
- plan
- apply
- destroy
- dependency graph
- interpolation

Implement small isolated resources.

## Days 4–6 — State and lifecycle

Learn:

- Terraform state
- remote state
- locking
- drift
- dependencies
- lifecycle
- import concept

## Days 7–9 — Modules

Learn:

- module inputs/outputs
- reusable boundaries
- avoiding over-modularization
- environment configuration

## Days 10–12 — Transflow infrastructure

Codify practical pieces such as:

- S3
- IAM
- container registry
- networking
- CloudFront
- Kubernetes infrastructure
- DB/cache/messaging infrastructure where feasible and cost-appropriate

## Days 13–15 — Safety and finalization

- remote state
- encrypted remote state with locking and tightly scoped access
- plan/apply workflow
- pin provider versions and review saved plans before apply
- secret handling
- consistent resource tags and basic cost visibility
- destroy protection where appropriate
- documentation
- diagrams
- reproducibility test

## Important distinction

```text
Terraform → provisions infrastructure
Kubernetes → runs/manages workloads
```

Terraform should not become an enterprise platform project.

---

# Final Transflow definition of done

A completed Transflow should support:

```text
authenticate
→ create video
→ multipart upload directly to S3
→ retry/resume parts
→ complete upload
→ validate media
→ queue processing
→ create 360p/480p/720p/1080p rendition jobs
→ process on distributed Go workers
→ parse/report FFmpeg progress
→ survive retries/duplicates/cancellation/crashes
→ finalize HLS
→ mark READY
→ apply retention preference
→ send optional ready/failure email
→ stream through CloudFront
```

And the engineering system should include:

- raw SQL PostgreSQL
- Redis
- Kafka
- S3
- FFmpeg/FFprobe
- HLS
- Docker/Compose
- Kubernetes
- worker draining
- observability
- CI/CD
- k6/load testing
- Terraform
- docs/ADRs
- interview notes
