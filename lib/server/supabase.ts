import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function configured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
export function adminDB() {
  if (!configured())
    throw new ApiError(
      503,
      "Seva 40 is waiting for its account connection. Please try again shortly.",
    );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function authDB() {
  if (!configured())
    throw new ApiError(
      503,
      "Seva 40 is waiting for its account connection. Please try again shortly.",
    );
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) =>
          values.forEach((v) => jar.set(v.name, v.value, v.options)),
      },
    },
  );
}
export async function identity() {
  const db = await authDB();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    throw new ApiError(401, "Sign in to open your seva workspace.");
  if (!user.email_confirmed_at)
    throw new ApiError(403, "Please verify your email before continuing.");
  const admin = adminDB();
  const { data: membership, error: membershipError } = await admin
    .from("seva_committee")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
    let keyProject: string | undefined;
    if (serviceKey.startsWith("eyJ")) {
      try {
        keyProject = JSON.parse(
          Buffer.from(serviceKey.split(".")[1], "base64url").toString(),
        ).ref;
      } catch {}
    }
    console.error("Seva 40 committee membership lookup failed", {
      code: membershipError.code,
      message: membershipError.message,
      details: membershipError.details,
      hint: membershipError.hint,
      keyFormat: serviceKey.startsWith("eyJ")
        ? "legacy-jwt"
        : serviceKey.startsWith("sb_secret_")
          ? "secret-key"
          : "unknown",
      keyLength: serviceKey.length,
      keyProject,
    });
    throw new ApiError(503, "Your workspace connection is unavailable.");
  }
  return {
    user,
    admin,
    role: membership ? ("committee" as const) : ("student" as const),
  };
}
export function origin(request: Request) {
  const supplied = request.headers.get("origin");
  const expected = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : new URL(request.url).origin;
  if (supplied !== expected)
    throw new ApiError(403, "This request did not come from Seva 40.");
}
export function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
export function failure(error: unknown) {
  return reply(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "Something could not be saved. Please try again.",
    },
    error instanceof ApiError ? error.status : 500,
  );
}
