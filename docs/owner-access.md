# Owner access and draft persistence

## Scope

This block introduces single-owner access, signed eight-hour HttpOnly sessions, a database-backed login attempt limit, and GET/POST /api/content. It does not yet add multi-user registration, the Jhon agent, autonomous publishing, AI spending limits, or a persistent media library. The existing draft modal still uses React state and must be wired to this API in a subsequent change.

The proxy protects existing private screens, AI endpoints and social endpoints. Legal pages remain public. OAuth callbacks require the existing owner session; they must be tested on the authorized deployment. The health route is also private in this initial configuration. New worker/webhook integrations will require separately authenticated routes rather than disabling this protection.

## Before enabling

Do not merge or promote this branch before configuring access and applying the migration in a separate preview database. Without configuration, private screens redirect to /login and login fails closed. Check whether Vercel preview environments share production resources before setting variables.

1. Back up the target database and inspect existing tables and dependencies.
2. Configure DATABASE_URL privately. Preserve the provider's TLS requirements; do not disable certificate verification. Existing social-connection pool initialization still requires a TLS review.
3. Generate CLYVORA_OWNER_PASSWORD_HASH locally. Its format is salt:digest, with a random 16-byte salt encoded as 32 hex characters and a 64-byte scrypt digest encoded as 128 hex characters. Use a unique, strong password of at least 20 characters. The implementation derives with Node crypto.scrypt(password, saltHexString, 64), using the hexadecimal string as the salt input. Never send the password, digest, session secret or database URL in chat.
4. Generate CLYVORA_SESSION_SECRET using 32 random bytes encoded as 64 hex characters. Set both new variables only in the intended environment.
5. After approval to change that database, run node --env-file=.env.local scripts/migrate.mjs from the repository root with Node 22. The script applies versioned SQL transactionally under an advisory lock and verifies checksums of previously applied migrations. It does not remove social_connections or assign existing connections to new users.
6. Deploy the preview and open /login. Verify correct and incorrect passwords, persistence after refresh, logout, expiration and access denial without a session.

## API verification in an authenticated browser

GET /api/content returns up to 50 owner-filtered drafts. POST /api/content requires Content-Type: application/json, a same-origin browser request and an Idempotency-Key header of 16-100 letters, digits, underscores or hyphens. Body fields: title, body, optional platform (multiplatform/tiktok/facebook/instagram), optional contentType (text/meme/script/carousel/campaign). Only draft status is supported; a script is not a rendered video and meme text is not an image asset.

Create a draft, refresh and retrieve it. Repeat with the same key and identical content: the API must return the original draft. Reuse that key for different content: expect HTTP 409. Repeat without a session: expect HTTP 401. No publication is performed.

DELETE /api/session logs out the current browser. It must be sent from the same origin. Rotating CLYVORA_SESSION_SECRET invalidates all sessions. Password changes alone do not revoke existing sessions; rotate the session secret as well. Stolen individual tokens cannot yet be revoked centrally before expiry.

## Verification status

Source prepared only; do not mark this block working until CI and the authenticated preview/database checks pass. No database migration or credential configuration is executed by saving these files. Remaining work includes integrating the current composer/library, owner-authorized agent tools, usage budgets, media storage, social ownership migration, scheduling, publishing and end-to-end tests.
