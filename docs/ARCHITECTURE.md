# Architecture

## Overview

Seva 40 is a Next.js application with server-owned authorization and persistence. React components render two role-specific workspaces, while authenticated API routes mediate every shared read, write, and evidence upload.

```text
Browser
  ├─ Google OAuth through Supabase Auth
  ├─ GET/POST /api/workspace
  ├─ POST /api/evidence
  └─ POST /api/committee/enroll
          │
          ▼
Next.js server routes
  ├─ verify authenticated Supabase user
  ├─ resolve student or committee role
  ├─ validate request with Zod
  ├─ enforce object-level authorization
  └─ use server-only Supabase credentials
          │
          ▼
Supabase
  ├─ protected Postgres workspace
  ├─ committee membership table
  ├─ append-only audit table
  └─ private evidence bucket
```

## Authentication and roles

The client starts Google OAuth through Supabase. `/auth/callback` exchanges the authorization code for a cookie-based session.

- The Student path returns to `#dashboard`.
- The Committee path verifies the Google account and creates its `seva_committee` membership before returning to `#committee`.
- Every API request calls `getUser()` again on the server. UI state is never accepted as proof of identity or role.

Committee membership is stored separately from user-editable profile information. A student cannot change their profile payload to gain committee permissions.

## Data model

The current release supports one community workspace. `seva_workspace` stores a versioned JSON document with shared tasks, claims, notices, and recent activity plus account-scoped profiles and preferences. The server filters that document before returning it.

Key domain objects are defined in `lib/model.ts`:

- `Task`: published or draft service opportunity
- `Claim`: reservation, evidence, reflection, review state, and credited hours
- `Profile`: name, grade, school, goal, and eligibility confirmations
- `Notice`: role-targeted or account-targeted message
- `Audit`: actor, action, detail, and timestamp

## Read flow

1. `GET /api/workspace` verifies the session.
2. The server loads the current revision and workspace document.
3. Account-scoped settings are merged into the response.
4. Students are filtered to published or relevant tasks and their own claims.
5. Committee members receive review data, the student directory, and the committee directory.
6. Stored evidence paths are converted to one-hour signed URLs after authorization.

## Write flow

1. The API validates the action with the discriminated Zod schema.
2. `authorizeAction` checks the role and record ownership.
3. Domain transitions enforce capacity, checklist, evidence, hour, and status rules.
4. The server assigns the authenticated actor and reviewer information.
5. A Postgres compare-and-swap function writes only if the revision still matches.
6. Conflicting writes retry and eventually return a clear conflict response.
7. The newest audit event is copied to the protected audit table.

## Evidence flow

The browser resizes and converts selected images to JPEG before upload. `/api/evidence` verifies the claim and student identity, checks phase and file constraints, writes to the private `seva-evidence` bucket, and stores only a storage path in the workspace. Responses contain temporary signed URLs rather than public bucket addresses.

## UI architecture

`components/workspace.tsx` owns the authenticated shell, navigation, dialogs, and role routing. Student screens live in `student-pages.tsx`; committee operations live in `committee.tsx`. The committee iPhone interface uses a dedicated launchpad and seven bottom-navigation destinations so each tool opens directly at the top of its own page.

The interface uses custom CSS in `app/globals.css`, self-hosted DM Sans, safe-area insets, `100dvh`, touch-sized controls, reduced-motion support, and mobile table-to-card transformations.

## Current scope

This version is designed for one community. Multi-organization tenancy, committee invitation governance, school-system integrations, and automated school submission are outside the current data model.
