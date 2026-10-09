import {
  identity,
  origin,
  reply,
  failure,
  ApiError,
} from "@/lib/server/supabase";
import { view } from "@/lib/server/workspace";

export async function POST(request: Request) {
  try {
    origin(request);
    const ctx = await identity();
    const { error } = await ctx.admin
      .from("seva_committee")
      .upsert({ user_id: ctx.user.id }, { onConflict: "user_id" });
    if (error)
      throw new ApiError(
        503,
        "Your committee workspace could not be created. Please try again.",
      );
    const committeeContext = { ...ctx, role: "committee" as const };
    return reply({ workspace: await view(committeeContext) });
  } catch (error) {
    return failure(error);
  }
}
