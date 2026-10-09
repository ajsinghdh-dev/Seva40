"use client";
import { useState, useMemo } from "react";
import {
  ArrowUpRight,
  Clock,
  MapPin,
  Bookmark,
  Users,
  SlidersHorizontal,
  Search,
  Leaf,
  UtensilsCrossed,
  HeartHandshake,
  GraduationCap,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  ShieldCheck,
  Award,
  Flame,
  Check,
  Target,
  Camera,
  ArrowRight,
  BookOpen,
  Accessibility,
  HelpCircle,
  Bell,
  Palette,
  LockKeyhole,
  FileText,
  Database,
  LogOut,
} from "lucide-react";
import type {
  Store,
  Task,
  Claim,
  Action,
  Profile,
  Status,
  Category,
} from "@/lib/model";
import {
  viewerId,
  CATEGORIES,
  STATUS_LABEL,
  dateLabel,
  approvedHours,
  seatsLeft,
  weekStart,
  activeClaims,
} from "@/lib/model";
import { exportCSV, exportICS, exportPDF, download } from "@/lib/exports";
import { SectionTitle, StatusPill, Empty, ClaimLine } from "./ui";
const categoryIcon = {
  Langar: UtensilsCrossed,
  Community: HeartHandshake,
  Environment: Leaf,
  Education: GraduationCap,
};
export function Opportunities({
  s,
  search,
  openTask,
  commit,
}: {
  s: Store;
  search: string;
  openTask: (t: Task) => void;
  commit: (a: Action, m?: string) => Promise<boolean>;
}) {
  const [category, setCategory] = useState("All"),
    [savedOnly, setSavedOnly] = useState(false),
    [accessible, setAccessible] = useState(false),
    [sort, setSort] = useState("date"),
    [maxHours, setMaxHours] = useState("8");
  const tasks = s.tasks
    .filter(
      (t) =>
        t.published &&
        !t.archived &&
        t.grades.includes(s.profile.grade) &&
        t.date >=
          new Date().toLocaleDateString("en-CA", {
            timeZone: "America/Toronto",
          }) &&
        (category === "All" || t.category === category) &&
        (!savedOnly || s.saved.includes(t.id)) &&
        (!accessible || t.accessible) &&
        t.hours <= Number(maxHours) &&
        `${t.title} ${t.description} ${t.location}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "hours"
        ? b.hours - a.hours
        : sort === "spaces"
          ? seatsLeft(s, b) - seatsLeft(s, a)
          : a.date.localeCompare(b.date),
    );
  return (
    <>
      <SectionTitle
        eyebrow="YOUR NEXT ACT OF GOOD"
        title="Find your seva."
        body="A few hours of your time can change someone’s whole day."
        action={
          <button
            className={`button ${savedOnly ? "selected" : ""}`}
            onClick={() => setSavedOnly(!savedOnly)}
          >
            <Bookmark size={16} />
            {savedOnly ? "Show all" : "Saved opportunities"}
          </button>
        }
      />
      <div className="filter-bar">
        <div className="tabs">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="filter-options">
          <button
            className={`button small ${accessible ? "selected" : ""}`}
            onClick={() => setAccessible(!accessible)}
          >
            <Accessibility size={16} />
            Accessible
          </button>
          <label className="sr-only" htmlFor="max-hours">
            Maximum shift hours
          </label>
          <select
            id="max-hours"
            value={maxHours}
            onChange={(e) => setMaxHours(e.target.value)}
          >
            <option value="8">Any duration</option>
            <option value="2">Up to 2 hours</option>
            <option value="3">Up to 3 hours</option>
          </select>
          <label className="sr-only" htmlFor="sort-tasks">
            Sort opportunities
          </label>
          <select
            id="sort-tasks"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date">Soonest first</option>
            <option value="hours">Most hours</option>
            <option value="spaces">Most spaces</option>
          </select>
        </div>
      </div>
      <div className="results-caption">
        {tasks.length} opportunities for Grade {s.profile.grade}
        <span>Supervised. Meaningful. Open to you.</span>
      </div>
      {tasks.length ? (
        <div className="task-grid">
          {tasks.map((t) => {
            const Icon = categoryIcon[t.category];
            const reserved = s.claims.some(
              (c) =>
                c.taskId === t.id &&
                c.studentId === viewerId(s) &&
                !["cancelled", "rejected"].includes(c.status),
            );
            return (
              <article className="task-card card" key={t.id}>
                <div className={`task-art ${t.category.toLowerCase()}`}>
                  <Icon size={72} strokeWidth={1} />
                  <span className="glass-tag">{t.category}</span>
                  <button
                    aria-label={
                      s.saved.includes(t.id)
                        ? `Unsave ${t.title}`
                        : `Save ${t.title}`
                    }
                    className={`icon-button bookmark-button ${s.saved.includes(t.id) ? "saved" : ""}`}
                    onClick={() =>
                      commit(
                        { type: "save", taskId: t.id },
                        "Saved opportunities updated",
                      )
                    }
                  >
                    <Bookmark
                      size={18}
                      fill={s.saved.includes(t.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="task-content">
                  <div className="task-date">
                    {dateLabel(t.date)} <span>{t.time} · ET</span>
                  </div>
                  <h2>{t.title}</h2>
                  <p>{t.description}</p>
                  <div className="inline-meta">
                    <MapPin size={14} />
                    {t.location}
                  </div>
                  <div className="task-card-bottom">
                    <span>
                      <Clock size={15} />
                      {t.hours} hrs <Users size={15} />
                      {seatsLeft(s, t)} spots
                    </span>
                    <button
                      className="orange-button"
                      onClick={() => openTask(t)}
                    >
                      {reserved ? "Your shift" : "View task"}
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          title="A fresh opportunity is on its way."
          body="Try another category or clear your filters."
          action={
            <button
              className="button"
              onClick={async () => {
                setCategory("All");
                setSavedOnly(false);
                setAccessible(false);
                setMaxHours("8");
              }}
            >
              Clear filters
            </button>
          }
        />
      )}
    </>
  );
}
export function CalendarPage({
  s,
  openTask,
}: {
  s: Store;
  openTask: (t: Task) => void;
}) {
  const [offset, setOffset] = useState(0),
    [mine, setMine] = useState(false);
  const base = weekStart();
  base.setDate(base.getDate() + offset * 7);
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const tasks = s.tasks.filter(
    (t) =>
      t.published &&
      !t.archived &&
      (!mine ||
        s.claims.some(
          (c) =>
            c.taskId === t.id &&
            c.studentId === viewerId(s) &&
            !["cancelled", "rejected"].includes(c.status),
        )),
  );
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
  const shifts = tasks.filter((t) => days.some((d) => dayKey(d) === t.date));
  return (
    <>
      <SectionTitle
        eyebrow="MAKE TIME FOR WHAT MATTERS"
        title="Your week, with purpose."
        body="Plan ahead. Show up. Make a difference."
        action={
          <button
            className="button"
            onClick={() => exportICS(shifts)}
            disabled={!shifts.length}
          >
            <CalendarPlus size={16} />
            Export this week
          </button>
        }
      />
      <div className="calendar-toolbar">
        <div className="tabs">
          <button
            className={!mine ? "active" : ""}
            onClick={() => setMine(false)}
          >
            Community shifts
          </button>
          <button
            className={mine ? "active" : ""}
            onClick={() => setMine(true)}
          >
            My reservations
          </button>
        </div>
        <div className="calendar-nav">
          <button
            className="icon-button"
            aria-label="Previous week"
            onClick={() => setOffset(offset - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <b>
            {dateLabel(dayKey(days[0]))} — {dateLabel(dayKey(days[6]))}
          </b>
          <button
            className="icon-button"
            aria-label="Next week"
            onClick={() => setOffset(offset + 1)}
          >
            <ChevronRight size={18} />
          </button>
          <button className="button small" onClick={() => setOffset(0)}>
            Today
          </button>
        </div>
      </div>
      <div className="week-grid">
        {days.map((d) => (
          <div
            className={`day-column ${dayKey(d) === new Date().toLocaleDateString("en-CA") ? "today" : ""}`}
            key={dayKey(d)}
          >
            <div className="day-heading">
              <span>{d.toLocaleDateString("en-CA", { weekday: "short" })}</span>
              <b>{d.getDate()}</b>
            </div>
            <div className="day-events">
              {tasks
                .filter((t) => t.date === dayKey(d))
                .map((t) => (
                  <button
                    className={`calendar-event ${t.category.toLowerCase()}`}
                    key={t.id}
                    onClick={() => openTask(t)}
                  >
                    <span>
                      {t.time} · {t.hours}h
                    </span>
                    <b>{t.title}</b>
                    <small>{t.category}</small>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      {!shifts.length && (
        <p className="empty-calendar">
          No shifts this week. Explore another week or view all community
          shifts.
        </p>
      )}
      <div className="guidance-note">
        <Clock size={17} />
        <span>
          All shifts are shown in Toronto time. Export an .ics file to add them
          to your preferred calendar.
        </span>
      </div>
    </>
  );
}
export function EvidencePage({
  s,
  openClaim,
  search,
}: {
  s: Store;
  openClaim: (c: Claim) => void;
  search: string;
}) {
  const [filter, setFilter] = useState("active");
  const claims = s.claims.filter(
    (c) =>
      c.studentId === viewerId(s) &&
      (filter === "all" ||
        (filter === "active" &&
          !["approved", "rejected", "cancelled"].includes(c.status)) ||
        c.status === filter) &&
      c.taskTitle.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <SectionTitle
        eyebrow="FROM GOOD INTENTIONS TO REAL IMPACT"
        title="Your seva workspace."
        body="Capture the before. Do the good. Share the after."
      />
      <div className="tabs wide-tabs">
        {[
          ["active", "Active shifts"],
          ["awaiting_review", "In review"],
          ["changes_requested", "Needs changes"],
          ["approved", "Approved"],
          ["all", "All activity"],
        ].map(([key, label]) => (
          <button
            className={filter === key ? "active" : ""}
            key={key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="card list-panel">
        {claims.length ? (
          claims.map((c) => (
            <ClaimLine key={c.id} claim={c} onClick={() => openClaim(c)} />
          ))
        ) : (
          <Empty
            title="You’re all caught up."
            body="Reserve an opportunity to start your next seva journey."
          />
        )}
      </div>
      <div className="mini-workflow">
        <div>
          <Camera />
          <b>1. Before photo</b>
          <p>Capture the task area and start your shift.</p>
        </div>
        <div>
          <HeartHandshake />
          <b>2. Do your seva</b>
          <p>Complete the checklist, then capture the result.</p>
        </div>
        <div>
          <ShieldCheck />
          <b>3. Committee review</b>
          <p>Verified hours flow into your digital logbook.</p>
        </div>
      </div>
    </>
  );
}
export function Logbook({
  s,
  openClaim,
  search,
  toast,
}: {
  s: Store;
  openClaim: (c: Claim) => void;
  search: string;
  toast: (m: string) => void;
}) {
  const [status, setStatus] = useState("approved"),
    [sort, setSort] = useState("newest");
  const mine = s.claims.filter((c) => c.studentId === viewerId(s));
  const claims = mine
    .filter(
      (c) =>
        (status === "all" || c.status === status) &&
        `${c.taskTitle} ${c.supervisor}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "hours"
        ? b.approvedHours - a.approvedHours
        : sort === "oldest"
          ? a.taskDate.localeCompare(b.taskDate)
          : b.taskDate.localeCompare(a.taskDate),
    );
  const hours = approvedHours(s);
  return (
    <>
      <SectionTitle
        eyebrow="EVERY HOUR HAS A STORY"
        title="Your seva, on record."
        body="A clear record of the time you gave and the difference you made."
        action={
          <div className="inline-actions">
            <button className="button" onClick={() => exportCSV(s)}>
              <Download size={16} />
              CSV
            </button>
            <button
              className="orange-button"
              onClick={() => exportPDF(s).catch((e) => toast(e.message))}
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        }
      />
      <div className="summary-grid">
        <div className="card summary">
          <span>Committee-approved</span>
          <b>
            {hours}
            <small> hours</small>
          </b>
        </div>
        <div className="card summary">
          <span>Goal progress</span>
          <b>
            {Math.round((hours / s.profile.goal) * 100)}
            <small>%</small>
          </b>
        </div>
        <div className="card summary">
          <span>Under review</span>
          <b>
            {mine
              .filter((c) => c.status === "awaiting_review")
              .reduce((a, c) => a + c.hours, 0)}
            <small> hours</small>
          </b>
        </div>
        <div className="card summary">
          <span>Completed acts of seva</span>
          <b>{mine.filter((c) => c.status === "approved").length}</b>
        </div>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          <button
            className={status === "approved" ? "active" : ""}
            onClick={() => setStatus("approved")}
          >
            Approved entries
          </button>
          <button
            className={status === "all" ? "active" : ""}
            onClick={() => setStatus("all")}
          >
            All submissions
          </button>
        </div>
        <div className="inline-actions">
          <select
            aria-label="Sort logbook"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="hours">Most hours</option>
          </select>
          <button className="button small" onClick={() => window.print()}>
            <Printer size={15} />
            Print
          </button>
        </div>
      </div>
      <div className="card table-panel">
        <table>
          <thead>
            <tr>
              <th>ACTIVITY</th>
              <th>DATE</th>
              <th>HOURS</th>
              <th>STATUS</th>
              <th>REVIEWER</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.taskTitle}</b>
                  <small>{c.location}</small>
                </td>
                <td>{dateLabel(c.taskDate)}</td>
                <td>
                  <b>{c.status === "approved" ? c.approvedHours : c.hours}</b>
                  <small>
                    {c.status === "approved" ? "approved" : "requested"}
                  </small>
                </td>
                <td>
                  <StatusPill status={c.status} />
                </td>
                <td>{c.reviewedBy ?? "Pending"}</td>
                <td>
                  <button
                    className="icon-button"
                    onClick={() => openClaim(c)}
                    aria-label={`Open ${c.taskTitle} record`}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!claims.length && (
          <Empty
            title="Your next chapter starts with seva."
            body="Your records will appear here as you complete shifts."
          />
        )}
      </div>
      <div className="guidance-note">
        <ShieldCheck size={17} />
        <span>
          This is a committee logbook for your school to review. Confirm your
          school’s eligibility and signature requirements. Only approved hours
          appear in your exported records.
        </span>
      </div>
    </>
  );
}
export function Achievements({
  s,
  commit,
}: {
  s: Store;
  commit: (a: Action, m?: string) => Promise<boolean>;
}) {
  const hours = approvedHours(s),
    acts = s.claims.filter(
      (c) => c.studentId === viewerId(s) && c.status === "approved",
    ).length;
  const start = weekStart().toISOString().slice(0, 10);
  const weekHours = s.claims
    .filter(
      (c) =>
        c.studentId === viewerId(s) &&
        c.status === "approved" &&
        c.taskDate >= start,
    )
    .reduce((a, c) => a + c.approvedHours, 0);
  return (
    <>
      <SectionTitle
        eyebrow="A JOURNEY WORTH CELEBRATING"
        title="Good grows with you."
        body="Build a habit of service, one meaningful moment at a time."
      />
      <div className="achievement-hero card">
        <div className="medal-art">
          <Award size={74} strokeWidth={1} />
        </div>
        <div>
          <span className="eyebrow">YOUR IMPACT SO FAR</span>
          <h2>{hours} hours of kindness.</h2>
          <p>{acts} acts of seva. A community made a little stronger.</p>
          <div className="long-progress">
            <span
              style={{
                width: Math.min(100, (hours / s.profile.goal) * 100) + "%",
              }}
            />
          </div>
          <small>
            {Math.max(0, s.profile.goal - hours)} hours until your{" "}
            {s.profile.goal}-hour milestone
          </small>
        </div>
      </div>
      <div className="milestone-grid">
        {[5, 10, 20, 30, 40].map((h, i) => (
          <div
            className={`card milestone ${hours >= h ? "unlocked" : ""}`}
            key={h}
          >
            <div className="milestone-icon">
              <Award size={32} />
            </div>
            <span className="eyebrow">
              {hours >= h ? "UNLOCKED" : "KEEP GROWING"}
            </span>
            <h3>
              {
                [
                  "First spark",
                  "Helping hands",
                  "Halfway hero",
                  "Community champion",
                  "The seva 40",
                ][i]
              }
            </h3>
            <p>{h} approved hours</p>
            <span className="milestone-state">
              {hours >= h ? (
                <Check size={16} />
              ) : (
                <span>{Math.max(0, h - hours)}h to go</span>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="card padded">
          <h3>
            <Target size={20} /> A little intention, each week.
          </h3>
          <p>Set a gentle weekly goal for your service journey.</p>
          <label className="field">
            Weekly goal: {s.weeklyGoal} hours
            <input
              aria-label="Weekly hour goal"
              type="range"
              min="1"
              max="20"
              value={s.weeklyGoal}
              onChange={(e) =>
                commit({ type: "goal", hours: Number(e.target.value) })
              }
            />
          </label>
          <div className="long-progress">
            <span
              style={{
                width: Math.min(100, (weekHours / s.weeklyGoal) * 100) + "%",
              }}
            />
          </div>
          <small>
            {weekHours} of {s.weeklyGoal} approved hours this week
          </small>
        </div>
        <div className="card padded">
          <h3>
            <HeartHandshake size={20} /> The heart of seva.
          </h3>
          <p>
            Seva is selfless service. Your milestones celebrate the time you’ve
            shared. Every act matters, whether it’s your first hour or your
            fortieth.
          </p>
          <p className="small muted">
            Milestones reflect your committee-approved records.
          </p>
        </div>
      </div>
    </>
  );
}
export function Settings({
  s,
  commit,
  reset,
}: {
  s: Store;
  commit: (a: Action, m?: string) => Promise<boolean>;
  reset: () => void;
}) {
  const [p, setP] = useState<Profile>(s.profile);
  const [weeklyGoal, setWeeklyGoal] = useState(s.weeklyGoal);
  const update = (k: keyof Profile, v: unknown) =>
    setP((x) => ({ ...x, [k]: v }));
  return (
    <>
      <SectionTitle
        eyebrow="MAKE THIS SPACE YOURS"
        title="Your profile & preferences."
        body="A few details to make your seva journey fit you."
      />
      <div className="settings-grid">
        <form
          className="card padded"
          onSubmit={async (e) => {
            e.preventDefault();
            commit(
              { type: "profile", profile: p },
              "Profile saved. Your opportunities now match your grade.",
            );
          }}
        >
          <h3>Student profile</h3>
          <div className="form-row">
            <label>
              Name
              <input
                aria-label="Student name"
                required
                maxLength={60}
                value={p.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            <label>
              Grade
              <select
                aria-label="Student grade"
                value={p.grade}
                onChange={(e) => update("grade", Number(e.target.value))}
              >
                {[10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            School
            <input
              required
              maxLength={100}
              value={p.school}
              onChange={(e) => update("school", e.target.value)}
            />
          </label>
          <div className="form-row">
            <label>
              Hour goal
              <input
                type="number"
                min="40"
                max="500"
                value={p.goal}
                onChange={(e) => update("goal", Number(e.target.value))}
              />
            </label>
            <label>
              Target date
              <input
                type="date"
                value={p.targetDate}
                onChange={(e) => update("targetDate", e.target.value)}
              />
            </label>
          </div>
          <h4>Seva interests</h4>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button
                className={`button small ${p.interests.includes(c) ? "selected" : ""}`}
                type="button"
                key={c}
                onClick={() =>
                  update(
                    "interests",
                    p.interests.includes(c)
                      ? p.interests.filter((x) => x !== c)
                      : [...p.interests, c],
                  )
                }
              >
                {c}
              </button>
            ))}
          </div>
          <div className="check-list">
            <label>
              <input
                type="checkbox"
                checked={p.schoolConfirmed}
                onChange={(e) => update("schoolConfirmed", e.target.checked)}
              />
              I have confirmed activity eligibility with my school.
            </label>
            <label>
              <input
                type="checkbox"
                checked={p.guardianConsent}
                onChange={(e) => update("guardianConsent", e.target.checked)}
              />
              I have discussed volunteering with my parent or guardian.
            </label>
          </div>
          <button className="orange-button" type="submit">
            Save profile
            <Check size={16} />
          </button>
        </form>
        <div className="settings-side">
          <div className="card padded settings-panel">
            <h3><Palette size={20} /> Appearance</h3>
            <p>Choose how Seva 40 looks across this account.</p>
            <div className="settings-choice" role="group" aria-label="Colour theme">
              {(["light", "dark"] as const).map((theme) => (
                <button
                  type="button"
                  key={theme}
                  className={s.preferences.theme === theme ? "active" : ""}
                  aria-pressed={s.preferences.theme === theme}
                  onClick={() =>
                    commit({
                      type: "preferences",
                      preferences: { ...s.preferences, theme },
                    }, `${theme === "light" ? "Light" : "Dark"} appearance saved.`)
                  }
                >
                  <span className={`theme-preview ${theme}`} />
                  {theme === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </div>

          <div className="card padded settings-panel">
            <h3><Target size={20} /> Weekly service target</h3>
            <p>Set a realistic weekly pace toward your overall hour goal.</p>
            <div className="goal-setting-row">
              <input
                aria-label="Weekly service target"
                type="range"
                min="1"
                max="20"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
              />
              <strong>{weeklyGoal}h</strong>
            </div>
            <button
              type="button"
              className="button small full"
              onClick={() => commit({ type: "goal", hours: weeklyGoal }, "Weekly service target saved.")}
            >
              Save weekly target
            </button>
          </div>

          <div className="card padded">
            <h3><Accessibility size={20} /> Workspace & accessibility</h3>
            {(
              [
                {
                  key: "compact",
                  name: "Compact lists",
                  body: "Fit more activity into your workspace.",
                },
                {
                  key: "reminders",
                  name: "In-app shift reminders",
                  body: "See a reminder for your next reservation.",
                },
                {
                  key: "reducedMotion",
                  name: "Reduce motion",
                  body: "Keep transitions calm and still.",
                },
              ] as const
            ).map((x) => (
              <label className="preference" key={x.key}>
                <span>
                  <b>{x.name}</b>
                  <small>{x.body}</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={s.preferences[x.key]}
                  onChange={(e) =>
                    commit({
                      type: "preferences",
                      preferences: {
                        ...s.preferences,
                        [x.key]: e.target.checked,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <div className="card padded">
            <h3><Bell size={20} /> Notifications</h3>
            <p>Shift reminders appear inside Seva 40 and never expose private evidence.</p>
            <div className="settings-status-row">
              <span>Reservation reminders</span>
              <b>{s.preferences.reminders ? "On" : "Off"}</b>
            </div>
            <div className="settings-status-row">
              <span>Committee review updates</span>
              <b>On</b>
            </div>
            <div className="settings-status-row">
              <span>Milestone updates</span>
              <b>On</b>
            </div>
          </div>
          <div className="card padded">
            <h3><LockKeyhole size={20} /> Google account & security</h3>
            <p>
              Your Seva 40 workspace is protected by Google sign-in. Sign out
              from the account menu when you finish on a shared device.
            </p>
            <div className="connection-state" role="status">
              <Check size={16} />
              Secure session active
            </div>
            <button
              type="button"
              className="button small full settings-signout"
              onClick={() => window.location.assign("/api/auth/signout")}
            >
              <LogOut size={15} /> Sign out of this device
            </button>
          </div>
          <div className="card padded">
            <h3><Database size={20} /> Privacy & service records</h3>
            <p>
              Evidence is private to you and authorized committee members. Your
              verified logbook can be downloaded whenever you need it.
            </p>
            <div className="record-downloads">
              <button className="button small" onClick={() => void exportPDF(s)}>
                <FileText size={15} /> Official PDF
              </button>
              <button className="button small" onClick={() => exportCSV(s)}>
                <Download size={15} /> Hours CSV
              </button>
              <button className="button small" onClick={() => exportICS(s.tasks)}>
                <CalendarPlus size={15} /> Calendar file
              </button>
              <button
                className="button small"
                onClick={() =>
                  download(
                    JSON.stringify(s, null, 2),
                    "seva40-records.json",
                    "application/json",
                  )
                }
              >
                <Database size={15} /> Full backup
              </button>
            </div>
            <div className="inline-actions settings-help-row">
              <button className="button small danger" onClick={reset}>
                Record help
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export function Help() {
  const [open, setOpen] = useState(0);
  const faqs = [
    [
      "How do I get my hours?",
      "Reserve a supervised shift, upload a before photo, and start your task. Complete the checklist, add an after photo and reflection, then submit. The committee checks the work and approves the hours; approved entries appear in your logbook.",
    ],
    [
      "Can I use these hours for school?",
      "Check activity eligibility with your school before volunteering. Ontario requires 40 community involvement hours for an OSSD. Religious, cultural and community activities can qualify, but your school determines acceptance and required documentation.",
    ],
    [
      "What should my photos show?",
      "Show the task area and completed work. Avoid photographing faces, children, names or personal documents. Before and after photos support a supervisor’s verification, but do not prove the duration of a shift.",
    ],
    [
      "What if the committee requests changes?",
      "Open the submission in My evidence. Read the committee note, replace photos if needed, update your reflection or requested hours, then resubmit. Hours remain uncredited until approval.",
    ],
    [
      "Who can approve my hours?",
      "Only registered committee members can review submissions and approve hours. Another committee member must review a committee member’s own submission. Your approved hours then appear in your logbook.",
    ],
    [
      "How can the committee post weekly tasks?",
      "Committee members can open the Committee portal. Open Weekly tasks and choose New task. Add the activity, date, time, duration, capacity, supervisor, checklist and eligible grades. Publish immediately or save a draft.",
    ],
    [
      "Is my evidence public?",
      "Your evidence is stored privately. You can view your own photos, and authorized committee members can view photos to review submissions. Other students cannot open your evidence. Photo access links expire automatically.",
    ],
  ];
  return (
    <>
      <SectionTitle
        eyebrow="EVERYONE STARTS SOMEWHERE"
        title="A little guidance goes a long way."
        body="Everything you need for your first act of seva."
      />
      <div className="mini-workflow">
        <div>
          <Bookmark />
          <b>Find your place</b>
          <p>Choose an opportunity that fits your time and grade.</p>
        </div>
        <div>
          <Camera />
          <b>Show your impact</b>
          <p>Upload your evidence and let your supervisor guide you.</p>
        </div>
        <div>
          <BookOpen />
          <b>Keep your story</b>
          <p>Export a clear logbook of committee-approved hours.</p>
        </div>
      </div>
      <section className="ontario-guide card" aria-labelledby="ontario-guide-title">
        <div className="ontario-guide-copy">
          <span className="eyebrow">OFFICIAL ONTARIO GUIDANCE</span>
          <h2 id="ontario-guide-title">Know what counts before you begin.</h2>
          <p>
            Ontario students need at least 40 community involvement hours for
            the OSSD. Your school board sets its recording process, and your
            principal decides whether an activity is eligible. If you are under
            18, plan with a parent or guardian and have them approve your record.
          </p>
          <div className="official-actions">
            <a
              className="orange-button"
              href="https://www.ontario.ca/page/get-your-high-school-volunteer-hours"
              target="_blank"
              rel="noreferrer"
            >
              Ontario’s official 40-hour guide
              <ArrowUpRight size={16} />
            </a>
            <a
              className="button"
              href="https://www.ontario.ca/document/education-ontario-policy-and-program-direction/policyprogram-memorandum-124"
              target="_blank"
              rel="noreferrer"
            >
              Read Policy/Program Memorandum 124
            </a>
          </div>
        </div>
        <div className="ontario-rules">
          <div>
            <Check size={17} />
            <span>
              <b>Check first</b>
              Confirm your board’s approved activities or ask your principal.
            </span>
          </div>
          <div>
            <ShieldCheck size={17} />
            <span>
              <b>Keep it safe</b>
              Activities must follow age, workplace and organization rules.
            </span>
          </div>
          <div>
            <BookOpen size={17} />
            <span>
              <b>Record it properly</b>
              Submit the supervisor and school information your board requires.
            </span>
          </div>
          <div>
            <HelpCircle size={17} />
            <span>
              <b>Know what does not count</b>
              Class requirements, paid-work duties, household chores and
              court-ordered service are examples of ineligible activities.
            </span>
          </div>
        </div>
      </section>
      <div className="card faq-panel">
        {faqs.map(([q, a], i) => (
          <div className="faq" key={q}>
            <button
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <b>{q}</b>
              <ChevronRight size={18} className={open === i ? "rotated" : ""} />
            </button>
            {open === i && <p>{a}</p>}
          </div>
        ))}
      </div>
      <div className="guidance-note">
        <GraduationCap size={18} />
        <span>
          School guidance:{" "}
          <a
            href="https://www.ontario.ca/page/get-your-high-school-volunteer-hours"
            target="_blank"
            rel="noreferrer"
          >
            Ontario’s community involvement information
            <ArrowUpRight size={13} />
          </a>
        </span>
      </div>
    </>
  );
}
