import {
  identity,
  origin,
  reply,
  failure,
  ApiError,
} from "@/lib/server/supabase";
import { load, mutate, view } from "@/lib/server/workspace";
export async function POST(request: Request) {
  let uploaded:
    { path: string; ctx: Awaited<ReturnType<typeof identity>> } | undefined;
  try {
    origin(request);
    const ctx = await identity();
    // Client compresses photos; enforce a strict bound before multipart parsing.
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError(400, "Choose a photo.");
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4 * 1024 * 1024) {
        await reader.cancel();
        throw new ApiError(413, "Choose a smaller photo.");
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let at = 0;
    for (const p of parts) {
      bytes.set(p, at);
      at += p.length;
    }
    const form = await new Response(bytes, {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
    const claimId = String(form.get("claimId")),
      phase = String(form.get("phase"));
    const file = form.get("photo");
    if (
      !["before", "after"].includes(phase) ||
      !(file instanceof File) ||
      file.type !== "image/jpeg"
    )
      throw new ApiError(400, "Choose a JPEG photo.");
    const data = new Uint8Array(await file.arrayBuffer());
    if (
      data.length < 4 ||
      data[0] !== 255 ||
      data[1] !== 216 ||
      data[data.length - 2] !== 255 ||
      data[data.length - 1] !== 217
    )
      throw new ApiError(400, "This file is not a valid JPEG photo.");
    const { s } = await load(ctx);
    const c = s.claims.find((c) => c.id === claimId);
    if (!c || c.studentId !== ctx.user.id)
      throw new ApiError(
        403,
        "You can only upload evidence for your own shift.",
      );
    if (!["reserved", "in_progress", "changes_requested"].includes(c.status))
      throw new ApiError(409, "This submission is locked.");
    const path = `${ctx.user.id}/${claimId}/${phase}/${crypto.randomUUID()}.jpg`;
    const { error } = await ctx.admin.storage
      .from("seva-evidence")
      .upload(path, data, { contentType: "image/jpeg", upsert: false });
    if (error)
      throw new ApiError(
        503,
        "Your photo could not be uploaded. Please try again.",
      );
    uploaded = { path, ctx };
    await mutate(ctx, {
      type: "evidence",
      claimId,
      phase: phase as "before" | "after",
      evidence: {
        data: `storage:${path}`,
        name: file.name.slice(0, 120),
        capturedAt: new Date().toISOString(),
      },
    });
    uploaded = undefined;
    // Replaced photos are never exposed; remove the old unreferenced file.
    const old = c[phase as "before" | "after"]?.data;
    if (old?.startsWith("storage:"))
      await ctx.admin.storage.from("seva-evidence").remove([old.slice(8)]);
    return reply({ workspace: await view(ctx) });
  } catch (e) {
    if (uploaded) {
      try {
        const current = await load(uploaded.ctx);
        const referenced = current.s.claims.some((c) =>
          [c.before, c.after].some(
            (photo) => photo?.data === `storage:${uploaded!.path}`,
          ),
        );
        if (!referenced)
          await uploaded.ctx.admin.storage
            .from("seva-evidence")
            .remove([uploaded.path]);
      } catch {
        /* Preserve the photo when the database outcome is uncertain. */
      }
    }
    return failure(e);
  }
}
