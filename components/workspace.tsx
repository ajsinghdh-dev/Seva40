"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Home,
  Camera,
  CalendarDays,
  BookOpen,
  ShieldCheck,
  Award,
  Settings,
  HelpCircle,
  Search,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  Check,
  ArrowRight,
  ArrowUpRight,
  X,
  LogIn,
  RotateCcw,
  WifiOff,
  Users,
  ClipboardCheck,
  Megaphone,
  BarChart3,
  LockKeyhole,
  Plus,
  FileCheck,
  UserRoundCheck,
  Activity,
} from "lucide-react";
import type { Store, Task, Claim, Action } from "@/lib/model";
import { viewerId, activeClaims, dateLabel } from "@/lib/model";
import {
  readWorkspace,
  updateWorkspace,
  enrollCommittee,
  signOut,
  ConnectionError,
} from "@/lib/live";
import AuthGate from "./auth-gate";
import { exportPDF } from "@/lib/exports";
import Dashboard from "./dashboard";
import { Logo, Modal } from "./ui";
import {
  Opportunities,
  CalendarPage,
  EvidencePage,
  Logbook,
  Achievements,
  Settings as SettingsPage,
  Help,
} from "./student-pages";
import dynamic from "next/dynamic";
const Committee = dynamic(() => import("./committee"));
const TaskDialog = dynamic(() => import("./dialogs").then((m) => m.TaskDialog));
const ClaimDialog = dynamic(() =>
  import("./dialogs").then((m) => m.ClaimDialog),
);
const ReviewDialog = dynamic(() =>
  import("./dialogs").then((m) => m.ReviewDialog),
);
const TaskEditor = dynamic(() => import("./dialogs").then((m) => m.TaskEditor));
const SignInDialog = dynamic(() =>
  import("./dialogs").then((m) => m.SignInDialog),
);
type Dialog =
  | { type: "task"; id: string }
  | { type: "claim"; id: string }
  | { type: "review"; id: string }
  | { type: "editor"; task?: Task }
  | { type: "signin" }
  | { type: "notifications" }
  | { type: "reset" }
  | null;
const navigation = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "tasks", label: "Find seva", icon: Users },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "evidence", label: "My evidence", icon: Camera },
  { id: "logbook", label: "Logbook", icon: BookOpen },
  { id: "achievements", label: "Milestones", icon: Award },
];
const committeeNavigation = [
  { id: "launchpad", label: "Launchpad", icon: Home, tab: "home" },
  { id: "review", label: "Review queue", icon: FileCheck, tab: "review" },
  { id: "opportunities", label: "Opportunities", icon: CalendarDays, tab: "tasks" },
  { id: "students", label: "Students", icon: Users, tab: "students" },
  { id: "updates", label: "Updates", icon: Megaphone, tab: "announcements" },
  { id: "impact", label: "Impact", icon: BarChart3, tab: "reports" },
  { id: "activity", label: "Activity", icon: Activity, tab: "audit" },
] as const;
export default function Workspace() {
  const [s, setS] = useState<Store | null>(null),
    [page, setPage] = useState("dashboard"),
    [role, setRole] = useState<"student" | "committee">("student"),
    [committeeTab, setCommitteeTab] = useState("home"),
    [search, setSearch] = useState(""),
    [dialog, setDialog] = useState<Dialog>(null),
    [message, setMessage] = useState(""),
    [menu, setMenu] = useState(false),
    [offline, setOffline] = useState(false),
    [signedOut, setSignedOut] = useState(false),
    [committeeBusy, setCommitteeBusy] = useState(false),
    [connectionProblem, setConnectionProblem] = useState("");
  const searchRef = useRef<HTMLInputElement>(null),
    stateRef = useRef<Store | null>(null),
    writeQueue = useRef(Promise.resolve());
  const toast = useCallback((text: string) => setMessage(text), []);
  const close = useCallback(() => setDialog(null), []);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (document.hidden) return;
      readWorkspace()
        .then((v) => {
          if (!alive) return;
          if ((v.revision ?? 0) < (stateRef.current?.revision ?? 0)) return;
          stateRef.current = v;
          setS(v);
          setSignedOut(false);
          setConnectionProblem("");
          if (
            window.location.hash === "#committee" &&
            v.viewerRole !== "committee"
          ) {
            setPage("committee-access");
            setRole("student");
            window.history.replaceState(null, "", "#committee-access");
          } else if (v.viewerRole === "committee") {
            const destination = window.location.hash.slice(1);
            setRole("committee");
            if (["settings", "help", "committee"].includes(destination)) {
              setPage(destination || "committee");
            } else {
              setPage("committee");
              window.history.replaceState(null, "", "#committee");
            }
          }
        })
        .catch((e) => {
          if (!alive) return;
          if (e instanceof ConnectionError && e.status === 401) {
            setSignedOut(true);
            setS(null);
            stateRef.current = null;
          } else {
            setConnectionProblem((e as Error).message);
          }
        });
    };
    refresh();
    const refreshTimer = setInterval(refresh, 60000);
    const hash = window.location.hash.slice(1);
    if (
      [
        ...navigation.map((n) => n.id),
        "help",
        "settings",
        "committee",
        "committee-access",
      ].includes(hash)
    )
      setPage(hash);
    if (hash === "committee") setRole("committee");
    const updateOnline = () => setOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", key);
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth === "connected")
      toast("Signed in. Welcome to your seva workspace.");
    if (auth === "error")
      toast(
        "Google sign-in could not complete. Check your OAuth configuration.",
      );
    return () => {
      alive = false;
      clearInterval(refreshTimer);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("keydown", key);
    };
  }, [toast]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 7000);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    if (!s) return;
    document.documentElement.dataset.theme = s.preferences.theme;
  }, [s?.preferences.theme]);
  const commit = useCallback(
    async (a: Action, m?: string): Promise<boolean> => {
      let success = false;
      const run = async () => {
        if (!stateRef.current) return;
        try {
          const next = await updateWorkspace(a);
          if ((next.revision ?? 0) >= (stateRef.current?.revision ?? 0)) {
            stateRef.current = next;
            setS(next);
          }

          if (m) toast(m);
          success = true;
        } catch (e) {
          toast((e as Error).message);
        }
      };
      writeQueue.current = writeQueue.current.catch(() => {}).then(run);
      await writeQueue.current;
      return success;
    },
    [toast],
  );
  const go = useCallback(
    (v: string) => {
      if (stateRef.current?.viewerRole === "committee") {
        const destination = ["settings", "help", "committee"].includes(v)
          ? v
          : "committee";
        setPage(destination);
        setRole("committee");
        setSearch("");
        setMenu(false);
        window.history.replaceState(null, "", "#" + destination);
        return;
      }
      if (v === "committee") {
        setPage("committee-access");
        setRole("student");
        setSearch("");
        setMenu(false);
        window.history.replaceState(null, "", "#committee-access");
        return;
      }
      setPage(v);
      setSearch("");
      setMenu(false);
      setRole(v === "committee" ? "committee" : "student");
      window.history.replaceState(null, "", "#" + v);
    },
    [],
  );
  const createCommitteeWorkspace = useCallback(async () => {
    setCommitteeBusy(true);
    try {
      const next = await enrollCommittee();
      stateRef.current = next;
      setS(next);
      setRole("committee");
      setPage("committee");
      window.history.replaceState(null, "", "#committee");
      toast("Committee account created. You can publish and review now.");
    } catch (error) {
      toast((error as Error).message);
    } finally {
      setCommitteeBusy(false);
    }
  }, [toast]);
  const openTask = (t: Task) => setDialog({ type: "task", id: t.id }),
    openClaim = (c: Claim) => setDialog({ type: "claim", id: c.id });
  if (signedOut || (!s && connectionProblem))
    return (
      <AuthGate
        problem={connectionProblem}
        retry={() => window.location.reload()}
      />
    );
  if (!s)
    return (
      <div className="loading-screen">
        <Logo />
        <span className="loading-line" />
        <p>Making room for a little good.</p>
      </div>
    );
  const unread = s.notices.filter(
    (n) =>
      !n.read &&
      (n.audience === "all" ||
        n.audience === (role === "student" ? "students" : "committee")),
  ).length;
  const task =
    dialog?.type === "task"
      ? s.tasks.find((t) => t.id === dialog.id)
      : undefined;
  const claim =
    dialog?.type === "claim" || dialog?.type === "review"
      ? s.claims.find((c) => c.id === dialog.id)
      : undefined;
  const notifications = s.notices.filter(
    (n) =>
      n.audience === "all" ||
      n.audience === (role === "student" ? "students" : "committee"),
  );
  const nextShift = activeClaims(s).find((c) => c.status === "reserved");
  const isCommittee = role === "committee" && s.viewerRole === "committee";
  return (
    <div
      className={`app-shell ${isCommittee ? "community-shell" : ""} ${page === "dashboard" ? "dashboard-shell" : ""} ${s.preferences.compact ? "compact" : ""} ${s.preferences.reducedMotion ? "reduce-motion" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="brand-button"
          onClick={() => {
            if (isCommittee) setCommitteeTab("home");
            go(isCommittee ? "committee" : "dashboard");
          }}
          aria-label="Seva 40 home"
        >
          <Logo />
        </button>
        <div className="topbar-right">
          <div className="search-box">
            <Search size={18} />
            <input
              ref={searchRef}
              aria-label="Search workspace"
              placeholder={isCommittee ? "Search students and opportunities" : "Search your community"}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (page === "dashboard") setPage("tasks");
              }}
            />
            <kbd>⌘ K</kbd>
            {search && (
              <button
                className="search-clear"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className="topbar-cta"
            onClick={() =>
              role === "committee"
                ? setDialog({ type: "editor" })
                : go("tasks")
            }
          >
            <Plus size={17} />
            {role === "committee" ? "New opportunity" : "Find seva"}
          </button>
          <div className="theme-switch" aria-label="Color theme">
            <button
              className={s.preferences.theme === "dark" ? "active" : ""}
              aria-label="Dark theme"
              onClick={() =>
                commit({
                  type: "preferences",
                  preferences: { ...s.preferences, theme: "dark" },
                })
              }
            >
              <Moon size={16} />
            </button>
            <button
              className={s.preferences.theme === "light" ? "active" : ""}
              aria-label="Light theme"
              onClick={() =>
                commit({
                  type: "preferences",
                  preferences: { ...s.preferences, theme: "light" },
                })
              }
            >
              <Sun size={17} />
            </button>
          </div>
          <button
            className="icon-button notification-button"
            aria-label={`Notifications, ${unread} unread`}
            onClick={() => setDialog({ type: "notifications" })}
          >
            <Bell size={19} />
            {unread > 0 && <span />}
          </button>
          <div className="profile-wrapper">
            <button
              className="profile-button"
              aria-label="Open profile menu"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <span className="avatar small">{s.profile.name[0]}</span>
              <ChevronDown size={14} />
            </button>
            {menu && (
              <div className="profile-menu">
                <b>{s.profile.name}</b>
                <small>
                  Grade {s.profile.grade} ·{" "}
                  {s.viewerRole === "committee"
                    ? "Committee member"
                    : "Student"}
                </small>
                <button
                  onClick={() => {
                    go("settings");
                  }}
                >
                  {isCommittee ? "Community settings" : "Profile & preferences"}
                  <Settings size={15} />
                </button>
                <button
                  onClick={() => {
                    setMenu(false);
                    signOut().catch((e) => toast(e.message));
                  }}
                >
                  Sign out
                  <LogIn size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="workspace-layout">
        <aside className="sidebar">
          <nav aria-label="Main navigation">
            <div className="nav-primary">
              <span className="sidebar-section-label">MAIN</span>
              {isCommittee ? (
                committeeNavigation.map((n) => (
                  <button
                    className={page === "committee" && committeeTab === (n.tab ?? "review") ? "active" : ""}
                    key={n.id}
                    aria-label={n.label}
                    aria-current={page === "committee" && committeeTab === (n.tab ?? "review") ? "page" : undefined}
                    onClick={() => {
                      setCommitteeTab(n.tab ?? "review");
                      go("committee");
                    }}
                  >
                    <n.icon size={21} strokeWidth={1.7} />
                    <span className="nav-label">{n.label}</span>
                    <span className="nav-tooltip">{n.label}</span>
                  </button>
                ))
              ) : (
                <>
                  {navigation.map((n) => (
                    <button
                      className={page === n.id ? "active" : ""}
                      key={n.id}
                      aria-label={n.label}
                      aria-current={page === n.id ? "page" : undefined}
                      onClick={() => go(n.id)}
                    >
                      <n.icon size={21} strokeWidth={1.7} />
                      <span className="nav-label">{n.label}</span>
                      <span className="nav-tooltip">{n.label}</span>
                    </button>
                  ))}
                  <button
                    className={page === "committee" || page === "committee-access" ? "active" : ""}
                    aria-label="Committee portal"
                    aria-current={page === "committee" || page === "committee-access" ? "page" : undefined}
                    onClick={() => go("committee")}
                  >
                    <ShieldCheck size={21} strokeWidth={1.7} />
                    <span className="nav-label">Committee</span>
                    <span className="nav-tooltip">Committee portal</span>
                  </button>
                </>
              )}
            </div>
            <div className="nav-bottom">
              <span className="sidebar-section-label">TOOLS</span>
              <button
                className={page === "help" ? "active" : ""}
                aria-label="Help & guidance"
                onClick={() => go("help")}
              >
                <HelpCircle size={21} strokeWidth={1.7} />
                <span className="nav-label">Guidance</span>
                <span className="nav-tooltip">Guidance</span>
              </button>
              <button
                className={page === "settings" ? "active" : ""}
                aria-label="Settings"
                onClick={() => go("settings")}
              >
                <Settings size={21} strokeWidth={1.7} />
                <span className="nav-label">Settings</span>
                <span className="nav-tooltip">Settings</span>
              </button>
            </div>
          </nav>
        </aside>
        <main id="main-content">
          <div className="workspace-mode">
            {isCommittee ? (
              <span className="mode-button community-mode">
                <ShieldCheck size={14} /> Community administration
              </span>
            ) : (
              <button className="mode-button" onClick={() => go("committee")}>
                <GraduationIcon /> Student workspace <ChevronDown size={13} />
              </button>
            )}
          </div>
          {!isCommittee && !s.onboardingComplete && (
            <div className="guidance-note">
              <BookOpen size={16} />
              <span>
                Welcome! Save your school and grade before reserving your first
                shift.
              </span>
              <button className="button small" onClick={() => go("settings")}>
                Set up profile
              </button>
            </div>
          )}
          {offline && (
            <div className="guidance-note">
              <WifiOff size={16} />
              You’re offline. Reconnect before saving changes or uploading
              evidence.
            </div>
          )}
          {page === "dashboard" && (
            <Dashboard
              s={s}
              go={go}
              openTask={openTask}
              openClaim={openClaim}
              notify={() => setDialog({ type: "notifications" })}
              exportLog={() => exportPDF(s).catch((e) => toast(e.message))}
            />
          )}
          {page === "tasks" && (
            <Opportunities
              s={s}
              search={search}
              openTask={openTask}
              commit={commit}
            />
          )}
          {page === "calendar" && <CalendarPage s={s} openTask={openTask} />}
          {page === "evidence" && (
            <EvidencePage s={s} openClaim={openClaim} search={search} />
          )}
          {page === "logbook" && (
            <Logbook
              s={s}
              openClaim={openClaim}
              search={search}
              toast={toast}
            />
          )}
          {page === "achievements" && <Achievements s={s} commit={commit} />}
          {page === "settings" && (
            isCommittee ? (
              <CommunitySettings s={s} go={go} signOutNow={() => signOut().catch((e) => toast(e.message))} />
            ) : (
              <SettingsPage
                s={s}
                commit={commit}
                reset={() =>
                  toast(
                    "Your shared records are retained securely. Contact your committee for record changes.",
                  )
                }
              />
            )
          )}
          {page === "help" && (isCommittee ? <CommunityHelp /> : <Help />)}
          {page === "committee" && (
            <Committee
              key={committeeTab}
              initialTab={committeeTab}
              s={s}
              search={search}
              commit={commit}
              editTask={(t) => setDialog({ type: "editor", task: t })}
              review={(c) => setDialog({ type: "review", id: c.id })}
              viewClaim={openClaim}
            />
          )}
          {page === "committee-access" && (
            <section className="committee-access-page">
              <div className="committee-access-hero card">
                <div className="committee-lock">
                  <LockKeyhole size={24} />
                </div>
                <span className="eyebrow">COMMITTEE ADMINISTRATION</span>
                <h1>Create your committee workspace and start organizing.</h1>
                <p>
                  Register this Google account as a committee member. It will be
                  recorded in the committee directory and can immediately publish
                  opportunities, review evidence and verify student hours.
                </p>
                <div className="committee-access-state">
                  <ShieldCheck size={16} />
                  No approval queue. This account becomes a committee account as
                  soon as you create the workspace.
                </div>
                <button
                  className="orange-button committee-create-button"
                  disabled={committeeBusy}
                  onClick={createCommitteeWorkspace}
                >
                  <ShieldCheck size={17} />
                  {committeeBusy
                    ? "Creating committee workspace…"
                    : "Create committee account"}
                  <ArrowRight size={17} />
                </button>
              </div>
              <div className="committee-capabilities">
                <article className="card padded">
                  <ClipboardCheck size={21} />
                  <h3>Review submissions</h3>
                  <p>Compare before and after evidence, reflections and hours.</p>
                </article>
                <article className="card padded">
                  <CalendarDays size={21} />
                  <h3>Publish weekly tasks</h3>
                  <p>Create shifts, capacities, grade rules and checklists.</p>
                </article>
                <article className="card padded">
                  <Megaphone size={21} />
                  <h3>Guide the community</h3>
                  <p>Share announcements and request thoughtful corrections.</p>
                </article>
                <article className="card padded">
                  <BarChart3 size={21} />
                  <h3>Track impact</h3>
                  <p>See verified hours, student progress and audit history.</p>
                </article>
              </div>
            </section>
          )}
          {s.preferences.reminders && nextShift && page === "dashboard" && (
            <button
              className="shift-reminder"
              onClick={() => openClaim(nextShift)}
            >
              <CalendarDays size={17} />
              <span>
                Your next seva: <b>{nextShift.taskTitle}</b> ·{" "}
                {dateLabel(nextShift.taskDate)}
              </span>
              <ArrowRight size={16} />
            </button>
          )}
        </main>
      </div>
      {dialog?.type === "task" && task && (
        <TaskDialog
          task={task}
          s={s}
          commit={commit}
          onClose={close}
          openClaim={openClaim}
        />
      )}
      {dialog?.type === "claim" && claim && (
        <ClaimDialog
          claim={claim}
          s={s}
          commit={commit}
          onClose={close}
          toast={toast}
        />
      )}
      {dialog?.type === "review" && claim && (
        <ReviewDialog claim={claim} commit={commit} onClose={close} />
      )}
      {dialog?.type === "editor" && (
        <TaskEditor task={dialog.task} s={s} commit={commit} onClose={close} />
      )}
      {dialog?.type === "signin" && (
        <SignInDialog onClose={close} toast={toast} />
      )}
      {dialog?.type === "notifications" && (
        <Modal
          title="A little news from your community."
          subtitle={`${unread} unread updates`}
          onClose={close}
        >
          <div className="panel-heading">
            <h4>Your updates</h4>
            <button
              className="text-button"
              onClick={() =>
                commit(
                  {
                    type: "read",
                    audience: role === "student" ? "students" : "committee",
                  },
                  "All updates marked as read.",
                )
              }
            >
              <Check size={14} />
              Mark all read
            </button>
          </div>
          {notifications.length ? (
            notifications.map((n) => (
              <button
                className={`notice notification-item ${n.read ? "read" : ""}`}
                key={n.id}
                onClick={() => commit({ type: "read", noticeId: n.id })}
              >
                <h4>
                  {!n.read && <span className="live-dot" />}
                  {n.title}
                </h4>
                <p>{n.body}</p>
                <small>{new Date(n.date).toLocaleDateString("en-CA")}</small>
              </button>
            ))
          ) : (
            <p className="description">
              Your community updates will appear here.
            </p>
          )}
        </Modal>
      )}
      {message && (
        <div className="toast" role="status">
          <span className="toast-icon">
            <Check size={16} />
          </span>
          <p>{message}</p>
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function CommunitySettings({
  s,
  go,
  signOutNow,
}: {
  s: Store;
  go: (page: string) => void;
  signOutNow: () => void;
}) {
  const committeeCount = s.committeeMembers?.length ?? 0;
  const studentCount = s.members?.length ?? 0;
  return (
    <section className="community-settings-page">
      <div className="section-heading">
        <span className="eyebrow">COMMUNITY ADMINISTRATION</span>
        <h1>Community settings.</h1>
        <p>Manage the operational workspace used to publish, review and report on seva.</p>
      </div>
      <div className="community-settings-grid">
        <article className="card padded">
          <h3><ShieldCheck size={20} /> Workspace identity</h3>
          <p>This Google account is registered as a committee administrator.</p>
          <div className="connection-state"><Check size={16} /> Committee access active</div>
        </article>
        <article className="card padded">
          <h3><UserRoundCheck size={20} /> Committee directory</h3>
          <p>{committeeCount} committee {committeeCount === 1 ? "member" : "members"} can publish opportunities and review submissions.</p>
          <button className="button small full" onClick={() => go("committee")}>Open committee directory</button>
        </article>
        <article className="card padded">
          <h3><Users size={20} /> Student community</h3>
          <p>{studentCount} registered {studentCount === 1 ? "student" : "students"} are visible to this committee workspace.</p>
          <button className="button small full" onClick={() => go("committee")}>Open student directory</button>
        </article>
        <article className="card padded">
          <h3><ClipboardCheck size={20} /> Review standards</h3>
          <p>Approvals require submitted evidence, a reflection and a verified hour total. Every decision stays in the activity record.</p>
        </article>
        <article className="card padded">
          <h3><Megaphone size={20} /> Community communications</h3>
          <p>Updates can be sent to students, committee members or the whole community from the Updates workspace.</p>
          <button className="button small full" onClick={() => go("committee")}>Manage updates</button>
        </article>
        <article className="card padded">
          <h3><LockKeyhole size={20} /> Account security</h3>
          <p>Google protects this administrator session. Sign out when using a shared device.</p>
          <button className="button small danger full" onClick={signOutNow}><LogIn size={15} /> Sign out</button>
        </article>
      </div>
    </section>
  );
}
function CommunityHelp() {
  return (
    <section className="community-help-page">
      <div className="section-heading">
        <span className="eyebrow">COMMITTEE GUIDE</span>
        <h1>Run the community workspace.</h1>
        <p>Clear operational guidance for reviewing evidence, publishing opportunities and maintaining accountable records.</p>
      </div>
      <div className="community-settings-grid">
        {[
          ["Review evidence", "Compare before and after photos, confirm the reflection and approve only the hours supported by the submission."],
          ["Publish opportunities", "Set dates, capacity, eligible grades, accessibility information, supplies and a clear supervisor before publishing."],
          ["Request corrections", "Explain exactly what the student must change. The submission remains uncredited until it is resubmitted and approved."],
          ["Protect privacy", "Use evidence only for service verification. Avoid downloading or sharing student photos outside the committee workflow."],
          ["Keep an audit trail", "Use committee actions inside Seva 40 so opportunity edits, review decisions and communications remain visible in Activity."],
          ["Report community impact", "Use Impact to monitor verified hours and student participation without exposing private evidence."],
        ].map(([title, body]) => (
          <article className="card padded" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function GraduationIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m2 8 10-5 10 5-10 5-10-5Zm4 2v7c4 3 8 3 12 0v-7M22 8v7" />
    </svg>
  );
}
