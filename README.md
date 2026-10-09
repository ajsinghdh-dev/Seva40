# Seva 40

Seva 40 is a full-stack community-service platform for Ontario students in Grades 10–12. Students can find volunteer opportunities, reserve shifts, submit before-and-after evidence, request verified hours, and export a service logbook. Committee members receive a separate workspace for publishing opportunities, reviewing evidence, communicating with students, and tracking community impact.

**Live application:** [seva40.vercel.app](https://seva40.vercel.app)

## What the application includes

### Student workspace

- Google sign-in and an account-specific profile
- Grade-aware community-service opportunities
- Shift reservations with capacity protection
- Before-and-after photo evidence stored privately
- Checklists, reflections, and quarter-hour validation
- Committee feedback, corrections, and resubmission
- Approved-hour dashboard and progress milestones
- Calendar, downloadable PDF/CSV logbook, and print view
- Responsive desktop and iPhone interfaces

### Committee workspace

- A dedicated mobile and desktop launchpad
- Committee accounts created through the Committee Google sign-in path
- Opportunity creation, drafts, publishing, duplication, and archiving
- Evidence-review queue with partial approval and written feedback
- Student progress directory
- Targeted announcements
- Impact reporting and append-only activity history
- Role-specific navigation and settings

The detailed feature inventory is in [docs/FEATURES.md](docs/FEATURES.md).

## Technology

| Layer | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| Authentication | Supabase Auth with Google OAuth |
| Database | Supabase Postgres |
| Evidence storage | Private Supabase Storage bucket |
| Validation | Zod and domain-level transition checks |
| Exports | `pdf-lib`, CSV, calendar files |
| Hosting | Vercel |
| Interface | Custom responsive CSS and Lucide icons |

## Quick start

Requirements:

- Node.js 22 or newer
- npm
- A Supabase project
- A Google OAuth web client connected to Supabase

```bash
git clone https://github.com/ajsinghdh-dev/Seva40.git
cd Seva40
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:3040](http://127.0.0.1:3040).

Add these values to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=http://127.0.0.1:3040
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it through a `NEXT_PUBLIC_` variable or commit it to Git.

Apply [supabase/migrations/001_live_workspace.sql](supabase/migrations/001_live_workspace.sql) to the intended Supabase project before using the app. The migration creates the protected workspace, committee membership, audit records, atomic revision function, and private evidence bucket.

Complete provider and redirect setup using [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Commands

```bash
npm run dev        # Development server on port 3040
npm run typecheck  # TypeScript validation
npm test           # Authorization, workflow, and database tests
npm run build      # Production build
npm start          # Run the production build on port 3040
```

## Project structure

```text
app/
  api/                 Authenticated API routes
  auth/callback/       Google OAuth callback
components/            Student, committee, dashboard, dialog, and UI components
lib/
  server/              Authorization, validation, and Supabase persistence
  model.ts             Domain types and workflow transitions
public/fonts/           Self-hosted DM Sans files and font license
supabase/migrations/    Database and storage setup
tests/                  Access-control, workflow, and Postgres tests
docs/                   Architecture, deployment, features, and validation notes
```

## Security model

Browser clients never receive the Supabase service-role key and cannot directly read the protected workspace tables. Each API request verifies the Supabase user, resolves their role, validates its payload, and applies authorization before changing state.

- Students receive only their own claims and private notifications.
- Students cannot grant themselves committee access through profile data.
- Committee actions require a committee membership record.
- A committee member cannot approve their own service hours.
- Evidence uploads require claim ownership and are served with expiring signed URLs.
- Workspace writes use revision-based compare-and-swap updates.
- Audit records are stored separately and are append-only to application users.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete request and data flow.

## Documentation

- [Architecture and data flow](docs/ARCHITECTURE.md)
- [Deployment and OAuth setup](docs/DEPLOYMENT.md)
- [Feature inventory](docs/FEATURES.md)
- [Validation status](docs/VALIDATION.md)
- [Visual assets and licenses](docs/ASSETS.md)
- [Contributing](CONTRIBUTING.md)

## License

See [LICENSE](LICENSE).
