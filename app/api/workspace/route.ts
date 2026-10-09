import {
  identity,
  origin,
  reply,
  failure,
  ApiError,
} from "@/lib/server/supabase";
import { view, mutate } from "@/lib/server/workspace";
import { actionSchema } from "@/lib/server/validation";
export async function GET() {
  try {
    const ctx = await identity();
    return reply({ workspace: await view(ctx) });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    origin(request);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new ApiError(415, "Send a valid workspace update.");
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError(400, "A workspace update is required.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 32768) {
        await reader.cancel();
        throw new ApiError(413, "This update is too large.");
      }
      chunks.push(value);
    }
    const raw = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      raw.set(chunk, offset);
      offset += chunk.length;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      throw new ApiError(400, "Send a valid workspace update.");
    }
    const parsed = actionSchema.safeParse(payload);
    if (!parsed.success)
      throw new ApiError(
        400,
        "Please check the information you entered and try again.",
      );
    const ctx = await identity();
    await mutate(ctx, parsed.data);
    return reply({ workspace: await view(ctx) });
  } catch (e) {
    return failure(e);
  }
}
