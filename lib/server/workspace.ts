import "server-only";
import type { Action, Store, Profile } from "@/lib/model";
import { transition } from "@/lib/model";
import { identity, ApiError } from "./supabase";
import { authorizeAction, filterWorkspace } from "./access";

type Account = {
  onboarded?: boolean;
  profile: Profile;
  preferences: Store["preferences"];
  saved: string[];
  weeklyGoal: number;
  read: string[];
};
type Document = { workspace: Store; accounts: Record<string, Account> };
export type Context = Awaited<ReturnType<typeof identity>>;
function defaultAccount(ctx: Context): Account {
  return {
    profile: {
      name: String(
        ctx.user.user_metadata?.full_name ||
          ctx.user.user_metadata?.name ||
          "Student",
      ).slice(0, 60),
      grade: 10,
      school: "",
      goal: 40,
      targetDate: new Date(Date.now() + 90 * 86400000)
        .toISOString()
        .slice(0, 10),
      interests: [],
      guardianConsent: false,
      schoolConfirmed: false,
    },
    preferences: {
      compact: false,
      reminders: true,
      reducedMotion: false,
      theme: "dark",
    },
    saved: [],
    weeklyGoal: 4,
    read: [],
  };
}
export async function load(ctx: Context) {
  const { data, error } = await ctx.admin
    .from("seva_workspace")
    .select("revision,document")
    .eq("id", 1)
    .single();
  if (error || !data)
    throw new ApiError(
      503,
      "The shared workspace is unavailable. Please try again shortly.",
    );
  const document = data.document as Document;
  const account = document.accounts[ctx.user.id] ?? defaultAccount(ctx);
  const s: Store = {
    ...document.workspace,
    profile: account.profile,
    preferences: account.preferences,
    saved: account.saved,
    weeklyGoal: account.weeklyGoal,
    viewerId: ctx.user.id,
    viewerRole: ctx.role,
    onboardingComplete: !!account.onboarded,
  };
  s.notices = s.notices.map((n) => ({
    ...n,
    read: account.read.includes(n.id),
  }));
  return { revision: data.revision as number, document, account, s };
}
export async function view(ctx: Context) {
  const loaded = await load(ctx);
  const s = filterWorkspace(loaded.s, ctx.user.id, ctx.role);
  s.revision = loaded.revision;
  if (ctx.role === "committee")
    s.members = Object.entries(loaded.document.accounts)
      .filter(([, a]) => a.onboarded)
      .map(([id, a]) => ({
        id,
        name: a.profile.name,
        grade: a.profile.grade,
        school: a.profile.school,
      }));
  if (ctx.role === "committee") {
    const [{ data: memberships }, { data: authUsers }] = await Promise.all([
      ctx.admin
        .from("seva_committee")
        .select("user_id,added_at")
        .order("added_at", { ascending: true }),
      ctx.admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const users = new Map((authUsers?.users ?? []).map((user) => [user.id, user]));
    s.committeeMembers = (memberships ?? []).map((membership) => {
      const user = users.get(membership.user_id);
      return {
        id: membership.user_id,
        name: String(
          user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.email?.split("@")[0] ||
            "Committee member",
        ).slice(0, 60),
        email: user?.email ?? "Google account",
        addedAt: membership.added_at,
      };
    });
  }
  const evidence = s.claims
    .flatMap((c) => [c.before, c.after])
    .filter((e) => e?.data.startsWith("storage:"));
  const paths = [...new Set(evidence.map((e) => e!.data.slice(8)))];
  if (paths.length) {
    const { data, error } = await ctx.admin.storage
      .from("seva-evidence")
      .createSignedUrls(paths, 3600);
    if (error || !data || data.some((e) => e.error || !e.signedUrl))
      throw new ApiError(
        503,
        "Photo storage is unavailable. Please refresh shortly.",
      );
    const urls = new Map(data.map((e) => [e.path, e.signedUrl]));
    for (const e of evidence) e!.data = urls.get(e!.data.slice(8))!;
  }
  return s;
}
export async function mutate(ctx: Context, action: Action) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { revision, document, account, s } = await load(ctx);
    try {
      authorizeAction(s, action, ctx.user.id, ctx.role);
    } catch (e) {
      throw new ApiError(403, (e as Error).message);
    }
    if (action.type === "reserve" && !account.onboarded)
      throw new ApiError(
        409,
        "Save your name, school, and grade in Profile before reserving your first shift.",
      );
    let next: Store;
    try {
      next = transition(s, action);
    } catch (e) {
      throw new ApiError(409, (e as Error).message);
    }
    const now = new Date().toISOString();
    next.audit[0].actor = `${account.profile.name} (${ctx.user.id})`;
    if (action.type === "review") {
      const c = next.claims.find((c) => c.id === action.claimId)!;
      c.reviewedBy = account.profile.name;
      next.notices[0].recipientId = c.studentId;
    }
    if (action.type === "notice")
      next.notices[0] = { ...next.notices[0], date: now, read: false };
    const read =
      action.type === "read"
        ? next.notices
            .filter(
              (n) =>
                n.read &&
                (!n.recipientId || n.recipientId === ctx.user.id) &&
                (n.audience === "all" ||
                  n.audience ===
                    (ctx.role === "committee" ? "committee" : "students")),
            )
            .map((n) => n.id)
        : account.read;
    next.onboardingComplete = action.type === "profile" || !!account.onboarded;
    document.accounts[ctx.user.id] = {
      onboarded: next.onboardingComplete,
      profile: next.profile,
      preferences: next.preferences,
      saved: next.saved,
      weeklyGoal: next.weeklyGoal,
      read,
    };
    const {
      revision: _revision,
      viewerId: _,
      viewerRole: __,
      occupancy: ___,
      members: ____,
      committeeMembers: ______,
      onboardingComplete: _____,
      ...shared
    } = next;
    document.workspace = {
      ...shared,
      notices: shared.notices.map((n) => ({ ...n, read: false })),
      saved: [],
      profile: document.workspace.profile,
      preferences: document.workspace.preferences,
      weeklyGoal: 4,
    };
    const { data, error } = await ctx.admin.rpc("seva_compare_and_swap", {
      expected_revision: revision,
      next_document: document,
    });
    if (error)
      throw new ApiError(
        503,
        "Your change could not be saved. Please try again.",
      );
    if (data) return next;
  }
  throw new ApiError(
    409,
    "Another change happened at the same time. Refresh and try again.",
  );
}
