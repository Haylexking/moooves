# Test Utilities for MOOOVES

This folder contains a lightweight, modular framework for API and auth testing across mock (offline) and live backends.

Usage

- Default (mock) mode: set TEST_MODE=mock (or leave unset) — tests will read mock JSON files from `lib/test-utils/mocks`.
- Live mode: set TEST_MODE=live and set `NEXT_PUBLIC_API_BASE_URL` or `API_BASE_URL` to point to your backend.

Commands

Run tests (mock mode by default):

```bash
TEST_MODE=mock npm test
```

Run against live backend:

```bash
TEST_MODE=live NEXT_PUBLIC_API_BASE_URL=https://mooves.onrender.com npm test
```

Adding mocks

Mock files live under `lib/test-utils/mocks` and are named by sanitizing the path. Example:

Path: `/api/v1/auth/register` -> file: `lib/test-utils/mocks/api_v1_auth_register.json`

Extend the mocks by copying the example mock files and updating the responses.

Extending tests

Use `callApi({ method, path, body, headers })` from `lib/test-utils/apiTestClient.ts` and `loginAs(role)` from `lib/test-utils/auth.ts`.
