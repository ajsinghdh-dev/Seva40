import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/server/supabase";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const destination =
    url.searchParams.get("next") === "committee" ? "committee" : "dashboard";
  if (
    code &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const jar = await cookies();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => jar.getAll(),
          setAll: (values) =>
            values.forEach((v) => jar.set(v.name, v.value, v.options)),
        },
      },
    );
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      if (destination === "committee") {
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!user?.email_confirmed_at)
          return NextResponse.redirect(new URL("/?auth=error", url.origin));
        const { error: enrollmentError } = await adminDB()
          .from("seva_committee")
          .upsert({ user_id: user.id }, { onConflict: "user_id" });
        if (enrollmentError)
          return NextResponse.redirect(new URL("/?auth=error", url.origin));
      }
      return NextResponse.redirect(
        new URL(
          `/?auth=connected#${destination === "committee" ? "committee" : "dashboard"}`,
          url.origin,
        ),
      );
    }
  }
  return NextResponse.redirect(new URL("/?auth=error", url.origin));
}
