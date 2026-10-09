export const googleConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
export async function googleSignIn(destination: "student" | "committee" = "student") {
  if (!googleConfigured())
    throw new Error(
      "Google sign-in is waiting for the account connection. Please try again shortly.",
    );
  const { createBrowserClient } = await import("@supabase/ssr");
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        window.location.origin +
        "/auth/callback" +
        (destination === "committee" ? "?next=committee" : ""),
      scopes: "openid email profile",
    },
  });
  if (error) throw error;
}
