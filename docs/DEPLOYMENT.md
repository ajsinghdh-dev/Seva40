# Deployment

## 1. Create the Supabase project

Create or select the Supabase project that will own Seva 40 data. In the SQL editor, run `supabase/migrations/001_live_workspace.sql` once. Confirm that the workspace, committee, and audit tables exist and that `seva-evidence` is private.

Copy the project URL, public anon key, and server-only service-role key into the deployment environment. Do not put the service-role value in client code or a `NEXT_PUBLIC_` variable.

## 2. Configure Google OAuth

In Google Cloud, create a Web application OAuth client.

- Add the deployed site origin under Authorized JavaScript origins.
- Add the exact callback URL displayed by the Supabase Google provider under Authorized redirect URIs.
- Enable Google in Supabase Authentication and enter the OAuth client credentials.

In Supabase Authentication URL Configuration:

- Set the Site URL to the deployed application origin.
- Add `https://YOUR_DOMAIN/auth/callback` to allowed redirect URLs.
- Add the local callback if local OAuth is required.

The Google-to-Supabase callback and the Seva 40 `/auth/callback` URL are two different redirects; both must be configured in their correct dashboards.

## 3. Configure Vercel

Import the repository into Vercel as a Next.js project. Add these variables to Production and any Preview environments that should connect to real data:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_URL
```

Set `APP_URL` to the exact deployed origin, without a trailing path. Deploy the `main` branch.

## 4. Verify the release

Run local checks before deployment:

```bash
npm run typecheck
npm test
npm run build
```

Then verify the hosted application:

1. Anonymous `/api/workspace` access returns `401`.
2. Student Google sign-in returns to the student dashboard.
3. Committee Google sign-in returns to the committee launchpad and records membership.
4. A committee account can publish an opportunity.
5. A separate student account can reserve it and submit evidence.
6. The committee can request changes and later approve verified hours.
7. Approved hours appear in the student dashboard and exported logbook.
8. A different student cannot access the submitted evidence.
9. Desktop and iPhone layouts have no horizontal overflow.

## Production instance

The maintained deployment is available at [https://seva40.vercel.app](https://seva40.vercel.app).
