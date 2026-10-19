# Clyvora: implementation baseline

## Evidence and limitations

Static source inspection only. No production database, credentials, social permissions, OpenAI calls, build, or end-to-end behavior has been verified. A successful CI run would verify installation, build and types, not real publishing.

## Findings

- app/api/ai/generate/route.ts uses OpenAI Responses server-side, but has no agent tool execution or session check.
- app/api/ai/image/route.ts calls the image API and returns base64; service availability and durable storage remain unverified.
- app/page.tsx saves draft state only in React, not PostgreSQL.
- app/components/automation-hub.tsx toggles local state, not scheduled server jobs.
- app/components/workspace-module.tsx renders informational placeholders for calendar, library, analytics and settings.
- app/lib/server/social-connections.ts stores encrypted tokens in PostgreSQL, creates its table at runtime and queries connections without owner isolation.
- app/lib/server/crypto.ts implements AES-256-GCM token encryption. Key configuration has not been verified.
- app/api/oauth/tiktok/callback/route.ts exchanges OAuth codes and persists tokens; this does not establish publishing capability.
- app/api/social/status/route.ts reports configuration presence, not verified platform permissions or token validity.
- Only TikTok was present in the inspected OAuth directory. Meta environment placeholders do not implement Facebook or Instagram OAuth.

## Next implementation gate

Before adding privileged agent tools, establish authenticated ownership and server-side authorization. Reuse existing modules and inspect remaining OAuth, health and studio files before editing them. Add versioned, non-destructive migrations and persistent drafts. Do not expose a new write endpoint without authorization.

Keep the requested phase order: diagnosis, Jhon, multimedia, social connections, publishing, automation, calendar, analytics, security review, deployment tests. Authorization and spending controls are prerequisites for privileged features, not work to defer until the final security review.

## Agent and automation acceptance requirements

- Agent tools use an explicit allowlist and enforce owner authorization in server code.
- Record tool results; never equate generated, queued, submitted and confirmed published states.
- Preserve text if media generation fails.
- Persist jobs, attempts, schedules, ownership and usage limits.
- Use transactional job claims and unique operation keys. Reconcile uncertain provider outcomes before retrying publication.
- Keep automation disabled until authorized and prerequisites are verified.
- Verify real provider permissions and technical constraints before scheduling publication.
- Default user timezone: America/Bogota. Store instants consistently and calculate recurrence in the configured timezone.

## This commit

Adds this diagnostic record and a CI workflow only. Does not implement authentication, Jhon, persistent drafts, media storage, scheduling or publication. Does not change UI, production configuration or existing database data.

CI requests no application secrets and runs npm ci, npm run build, then npm run lint. In this project lint is TypeScript checking, not ESLint. GitHub Actions availability and successful execution must be checked separately.
