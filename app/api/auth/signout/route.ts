import { authDB, origin, reply, failure } from "@/lib/server/supabase";
export async function POST(request: Request) {
  try {
    origin(request);
    const db = await authDB();
    const { error } = await db.auth.signOut();
    if (error) throw error;
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
