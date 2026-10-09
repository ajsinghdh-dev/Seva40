# Validation

## Automated checks

The current source passes:

- TypeScript validation with `tsc --noEmit`
- A production Next.js build
- 30 automated authorization, workflow, and database tests

The tests cover role escalation, cross-student access, self-review prevention, capacity, reservations, evidence requirements, quarter-hour rules, resubmission, approval, immutable approved records, archival history, atomic revision updates, and append-only audit permissions.

The database test uses PGlite, an actual local Postgres engine with stub Supabase auth and storage schemas. It validates the migration behavior locally; it does not replace hosted Supabase verification.

## Hosted checks

The production deployment at [https://seva40.vercel.app](https://seva40.vercel.app) has been verified for:

- Google OAuth account selection and callback
- Authenticated committee sign-in
- Role-specific student and committee routing
- Anonymous workspace rejection
- Authenticated workspace loading and persistence
- Responsive desktop layout
- Responsive 390×844 iPhone landing page
- Committee launchpad and all seven committee mobile navigation destinations
- No horizontal overflow across committee pages
- Mobile opportunity cards and the create-opportunity sheet

## Release checklist

For any change that affects persistence, authorization, or evidence, repeat the full hosted journey with separate student and committee accounts:

1. Publish an opportunity from the committee workspace.
2. Reserve it from a student account.
3. Upload before evidence and start the shift.
4. Upload after evidence, complete the checklist, and submit a reflection and hours.
5. Request changes from the committee account.
6. Resubmit and approve verified hours.
7. Confirm the student dashboard and PDF/CSV logbook update.
8. Confirm another student cannot read or change the evidence.

Production-ready status depends on this end-to-end check, not only on a successful build or READY deployment.
