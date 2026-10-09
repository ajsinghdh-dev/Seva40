# Contributing

## Development workflow

1. Create a branch from `main`.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and use a development Supabase project.
4. Make a focused change without committing credentials or generated build output.
5. Run the required checks:

```bash
npm run typecheck
npm test
npm run build
```

## Pull requests

Describe the behavior before and after the change, the role affected, and how it was tested. Include desktop and iPhone checks for visible interface changes. Changes to authorization or workflow transitions should include a meaningful regression test.

## Security expectations

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Do not weaken table or storage protections to solve a client error.
- Authorize records by the authenticated user ID, never by a client-supplied identity.
- Preserve the rule that committee members cannot approve their own hours.
- Do not commit student photos, exported records, production data, or `.env` files.

## Interface expectations

- Preserve keyboard access and visible focus states.
- Maintain 44-pixel touch targets on mobile.
- Test 390×844 and desktop viewports.
- Respect reduced-motion preferences and iPhone safe areas.
- Keep student and committee workspaces clearly separated.
