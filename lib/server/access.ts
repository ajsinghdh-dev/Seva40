import type { Action, Store } from "../model.ts";

export function authorizeAction(
  s: Store,
  action: Action,
  userId: string,
  role: "student" | "committee",
) {
  if (
    ["task", "archive", "notice", "review"].includes(action.type) &&
    role !== "committee"
  )
    throw new Error("Committee access is required for this action.");
  if ("claimId" in action) {
    const c = s.claims.find((c) => c.id === action.claimId);
    if (!c) throw new Error("That submission could not be found.");
    if (action.type !== "review" && c.studentId !== userId)
      throw new Error("You can only change your own submission.");
    if (action.type === "review" && c.studentId === userId)
      throw new Error("Another committee member must review your own hours.");
  }
  if (
    action.type === "read" &&
    role === "student" &&
    action.audience === "committee"
  )
    throw new Error("Committee access is required.");
}

export function filterWorkspace(
  s: Store,
  userId: string,
  role: "student" | "committee",
) {
  const out = structuredClone(s);
  out.viewerId = userId;
  out.viewerRole = role;
  out.occupancy = Object.fromEntries(
    s.tasks.map((t) => [
      t.id,
      s.claims.filter(
        (c) =>
          c.taskId === t.id && !["cancelled", "rejected"].includes(c.status),
      ).length,
    ]),
  );
  if (role === "student") {
    out.tasks = out.tasks.filter(
      (t) =>
        t.published ||
        s.claims.some((c) => c.studentId === userId && c.taskId === t.id),
    );
    out.claims = out.claims.filter((c) => c.studentId === userId);
    out.audit = [];
  }
  out.notices = out.notices.filter(
    (n) =>
      (n.audience === "all" ||
        n.audience === (role === "committee" ? "committee" : "students")) &&
      (!n.recipientId || n.recipientId === userId),
  );
  return out;
}
