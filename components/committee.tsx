"use client";
import { useEffect, useState } from "react";
import {
  Home,
  Plus,
  ShieldCheck,
  Users,
  CalendarDays,
  ArrowUpRight,
  Copy,
  Archive,
  Download,
  Check,
  Send,
  FileCheck,
  Activity,
  BarChart3,
  Megaphone,
  UserRoundCheck,
  Sparkles,
} from "lucide-react";
import type { Store, Task, Claim, Action } from "@/lib/model";
import { id, seatsLeft, dateLabel, approvedHours } from "@/lib/model";
import { download } from "@/lib/exports";
import { Empty } from "./ui";
export default function Committee({
  initialTab,
  s,
  search,
  commit,
  editTask,
  review,
  viewClaim,
}: {
  initialTab?: string;
  s: Store;
  search: string;
  commit: (a: Action, m?: string) => Promise<boolean>;
  editTask: (t?: Task) => void;
  review: (c: Claim) => void;
  viewClaim: (c: Claim) => void;
}) {
  const [tab, setTab] = useState(initialTab ?? "home"),
    [archived, setArchived] = useState(false),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [audience, setAudience] = useState<"all" | "students" | "committee">("all"),
    [grade, setGrade] = useState("all");
  const pending = s.claims.filter((c) => c.status === "awaiting_review");
  const total = s.claims
    .filter((c) => c.status === "approved")
    .reduce((a, c) => a + c.approvedHours, 0);
  const students = s.members ?? [];
  const taskList = s.tasks.filter(
    (t) =>
      t.archived === archived &&
      `${t.title} ${t.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  const tabs = [
    ["home", "Launchpad", Home],
    ["review", "Review queue", FileCheck],
    ["tasks", "Opportunities", CalendarDays],
    ["students", "Students", Users],
    ["team", "Committee", UserRoundCheck],
    ["announcements", "Updates", Megaphone],
    ["reports", "Impact", BarChart3],
    ["audit", "Activity", Activity],
  ] as const;
  const pageTitles: Record<string, [string, string]> = {
    review: ["Review queue", "Verify student evidence and award service hours."],
    tasks: ["Opportunities", "Publish and manage the service work available to students."],
    students: ["Students", "See progress and recent submissions across your community."],
    team: ["Committee", "See everyone with committee access."],
    announcements: ["Community updates", "Share timely information with students and committee members."],
    reports: ["Community impact", "Understand where verified service hours are making a difference."],
    audit: ["Activity", "A clear history of committee actions and decisions."],
  };
  useEffect(() => {
    document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);
  return (
    <section className="committee-console">
      {tab === "home" && <>
      <div className="committee-command card">
        <div className="committee-command-copy">
          <span className="committee-live"><span /> LIVE COMMITTEE WORKSPACE</span>
          <h1>Run every act of seva from one place.</h1>
          <p>Publish opportunities, verify evidence, guide students and keep a clear record of every decision.</p>
        </div>
        <div className="committee-command-actions">
          <button className="orange-button" onClick={() => editTask()}>
            <Plus size={17} />
            Create opportunity
          </button>
          <button className="button" onClick={() => setTab("review")}>
            <FileCheck size={16} />
            Open review queue
          </button>
        </div>
      </div>
      <div className="summary-grid">
        <button className="card summary committee-summary" onClick={() => setTab("review")}>
          <span className="summary-icon"><FileCheck size={17} /></span>
          <span>Awaiting review</span>
          <b>
            {pending.length}
            <small> submissions</small>
          </b>
        </button>
        <button className="card summary committee-summary" onClick={() => setTab("tasks")}>
          <span className="summary-icon"><CalendarDays size={17} /></span>
          <span>Live opportunities</span>
          <b>
            {s.tasks.filter((t) => t.published && !t.archived).length}
            <small> tasks</small>
          </b>
        </button>
        <button className="card summary committee-summary" onClick={() => setTab("students")}>
          <span className="summary-icon"><Users size={17} /></span>
          <span>Student community</span>
          <b>
            {students.length}
            <small> students</small>
          </b>
        </button>
        <button className="card summary committee-summary" onClick={() => setTab("reports")}>
          <span className="summary-icon"><Sparkles size={17} /></span>
          <span>Hours verified</span>
          <b>
            {total}
            <small> hours</small>
          </b>
        </button>
      </div>
      </>}
      <div className="tabs wide-tabs committee-tabs" role="tablist" aria-label="Committee tools">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
            role="tab"
            aria-selected={tab === key}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      {tab !== "home" && pageTitles[tab] && (
        <header className="committee-page-heading">
          <span className="eyebrow">COMMITTEE WORKSPACE</span>
          <h1>{pageTitles[tab][0]}</h1>
          <p>{pageTitles[tab][1]}</p>
        </header>
      )}
      {tab === "review" && (
        <div className="card list-panel">
          {pending
            .filter((c) =>
              `${c.studentName} ${c.taskTitle}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((c) => (
              <div className="review-line" key={c.id}>
                <div className="avatar">{c.studentName.slice(0, 1)}</div>
                <div className="grow">
                  <b>{c.studentName}</b>
                  <small>
                    {c.taskTitle} · {c.hours} hours requested
                  </small>
                </div>
                <div className="evidence-pips">
                  <span className={c.before ? "good" : ""}>
                    Before
                    <Check size={12} />
                  </span>
                  <span className={c.after ? "good" : ""}>
                    After
                    <Check size={12} />
                  </span>
                </div>
                <button className="orange-button" onClick={() => review(c)}>
                  Review
                  <ArrowUpRight size={16} />
                </button>
              </div>
            ))}
          {!pending.length && (
            <Empty
              title="Every act of seva is accounted for."
              body="New student submissions will appear here for review."
            />
          )}
          <div className="review-guidance">
            <ShieldCheck size={18} />
            <p>
              Compare both photos, read the reflection, and confirm the time
              with the supervisor. Approve hours, request changes, or decline
              with a helpful note.
            </p>
          </div>
        </div>
      )}
      {tab === "tasks" && (
        <>
          <div className="filter-bar">
            <div className="tabs">
              <button
                className={!archived ? "active" : ""}
                onClick={() => setArchived(false)}
              >
                Current tasks
              </button>
              <button
                className={archived ? "active" : ""}
                onClick={() => setArchived(true)}
              >
                Archived
              </button>
            </div>
            <button className="button" onClick={() => editTask()}>
              <Plus size={16} />
              Create opportunity
            </button>
          </div>
          <div className="card table-panel committee-opportunities-panel">
            <table className="committee-opportunities-table">
              <thead>
                <tr>
                  <th>OPPORTUNITY</th>
                  <th>SHIFT</th>
                  <th>CAPACITY</th>
                  <th>VISIBILITY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {taskList.map((t) => (
                  <tr key={t.id}>
                    <td data-label="Opportunity">
                      <b>{t.title}</b>
                      <small>
                        {t.category} · Grades {t.grades.join(", ")}
                      </small>
                    </td>
                    <td data-label="Shift">
                      {dateLabel(t.date)}
                      <small>
                        {t.time} · {t.hours}h
                      </small>
                    </td>
                    <td data-label="Capacity">
                      {t.capacity - seatsLeft(s, t)} / {t.capacity}
                    </td>
                    <td data-label="Visibility">
                      <span
                        className={`status ${t.published ? "approved" : "reserved"}`}
                      >
                        <span />
                        {t.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="inline-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${t.title}`}
                          onClick={() => editTask(t)}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Duplicate ${t.title}`}
                          onClick={() =>
                            editTask({
                              ...t,
                              id: id(),
                              title: t.title + " (copy)",
                              published: false,
                              archived: false,
                            })
                          }
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`${t.archived ? "Restore" : "Archive"} ${t.title}`}
                          onClick={() =>
                            commit(
                              { type: "archive", taskId: t.id },
                              t.archived
                                ? "Task restored"
                                : "Task archived; existing student records are preserved.",
                            )
                          }
                        >
                          <Archive size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!taskList.length && (
              <Empty
                title="A clear board. A fresh start."
                body="Create or restore an opportunity for your community."
              />
            )}
          </div>
        </>
      )}
      {tab === "students" && (
        <>
          <div className="filter-bar">
            <p className="muted">Student profiles · private committee view</p>
            <select
              aria-label="Filter students by grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="all">All grades</option>
              {[10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <div className="student-grid">
            {students
              .filter(
                (p) =>
                  (grade === "all" || p.grade === Number(grade)) &&
                  p.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((p) => {
                const hours = approvedHours(s, p.id);
                const claims = s.claims.filter((c) => c.studentId === p.id);
                return (
                  <div className="card padded student-card" key={p.id}>
                    <div className="student-top">
                      <span className="avatar">{p.name[0]}</span>
                      <div>
                        <h3>{p.name}</h3>
                        <small>
                          Grade {p.grade} · {p.school}
                        </small>
                      </div>
                    </div>
                    <b className="student-hours">
                      {hours}
                      <span> / 40 hours</span>
                    </b>
                    <div className="long-progress">
                      <span
                        style={{
                          width: Math.min(100, (hours / 40) * 100) + "%",
                        }}
                      />
                    </div>
                    <p>
                      {
                        claims.filter((c) => c.status === "awaiting_review")
                          .length
                      }{" "}
                      pending ·{" "}
                      {claims.filter((c) => c.status === "approved").length}{" "}
                      approved entries
                    </p>
                    {claims[0] && (
                      <button
                        className="button"
                        onClick={() =>
                          claims[0].status === "awaiting_review"
                            ? review(claims[0])
                            : viewClaim(claims[0])
                        }
                      >
                        Latest submission
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
      {tab === "team" && (
        <div className="card committee-directory">
          <div className="panel-heading committee-directory-heading">
            <div>
              <span className="eyebrow">COMMITTEE DIRECTORY</span>
              <h3>People who can publish and verify</h3>
              <p className="small muted">Every person listed here has committee access through their Google account.</p>
            </div>
            <span className="directory-count">{s.committeeMembers?.length ?? 0} members</span>
          </div>
          <div className="directory-list">
            {(s.committeeMembers ?? []).map((member) => (
              <article key={member.id} className="directory-member">
                <span className="avatar">{member.name.slice(0, 1).toUpperCase()}</span>
                <div className="grow">
                  <b>{member.name}</b>
                  <small>{member.email}</small>
                </div>
                <span className="committee-role-pill"><ShieldCheck size={13} /> Committee</span>
                <small>Joined {new Date(member.addedAt).toLocaleDateString("en-CA")}</small>
              </article>
            ))}
            {!s.committeeMembers?.length && (
              <Empty title="Your committee starts here." body="Committee accounts will appear in this directory automatically." />
            )}
          </div>
        </div>
      )}
      {tab === "announcements" && (
        <div className="two-col">
          <form
            className="card padded"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await commit(
                  {
                    type: "notice",
                    notice: {
                      id: id(),
                      title,
                      body,
                      date: new Date().toISOString(),
                      read: false,
                      audience,
                    },
                  },
                  "Announcement posted to the selected portal.",
                )
              ) {
                setTitle("");
                setBody("");
              }
            }}
          >
            <h3>A message for your community</h3>
            <label className="field">
              Announcement title
              <input
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. This weekend’s langar shifts are open"
              />
            </label>
            <label className="field">
              Message
              <textarea
                required
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share an update, reminder, or a little encouragement."
              />
            </label>
            <label className="field">
              Audience
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
              >
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="committee">Committee</option>
              </select>
            </label>
            <button className="orange-button" type="submit">
              <Send size={16} />
              Post announcement
            </button>
            <p className="small muted">
              Posts appear inside Seva 40. No emails or external messages are
              sent.
            </p>
          </form>
          <div className="card padded">
            <h3>Community updates</h3>
            {s.notices.slice(0, 6).map((n) => (
              <article className="notice" key={n.id}>
                <span className="eyebrow">{n.audience.toUpperCase()}</span>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                <small>{new Date(n.date).toLocaleDateString("en-CA")}</small>
              </article>
            ))}
          </div>
        </div>
      )}
      {tab === "reports" && (
        <div className="two-col">
          <div className="card padded">
            <h3>
              <BarChart3 size={20} /> A picture of your community
            </h3>
            <p>Hours by service area · approved submissions only</p>
            <div className="report-bars">
              {["Langar", "Community", "Environment", "Education"].map(
                (cat) => {
                  const h = s.claims
                    .filter(
                      (c) =>
                        c.status === "approved" &&
                        (s.tasks.find((t) => t.id === c.taskId)?.category ===
                          cat ||
                          (!s.tasks.find((t) => t.id === c.taskId) &&
                            (
                              {
                                Langar: /langar|meal/i,
                                Community: /food|welcome/i,
                                Environment: /garden/i,
                                Education: /learning/i,
                              } as Record<string, RegExp>
                            )[cat].test(c.taskTitle))),
                    )
                    .reduce((a, c) => a + c.approvedHours, 0);
                  return (
                    <div key={cat}>
                      <span>
                        {cat}
                        <b>{h}h</b>
                      </span>
                      <div className="long-progress">
                        <span
                          style={{
                            width: total
                              ? Math.max(2, (h / total) * 100) + "%"
                              : "0%",
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
            <button
              className="button"
              onClick={() =>
                download(
                  JSON.stringify(
                    {
                      generatedAt: new Date().toISOString(),
                      approvedHours: total,
                      pendingReviews: pending.length,
                      students: students.length,
                      tasks: s.tasks.map((t) => ({
                        title: t.title,
                        capacity: t.capacity,
                        reserved: t.capacity - seatsLeft(s, t),
                      })),
                    },
                    null,
                    2,
                  ),
                  "seva40-impact-report.json",
                  "application/json",
                )
              }
            >
              <Download size={16} />
              Export impact report
            </button>
          </div>
          <div className="card padded">
            <h3>
              <Users size={20} /> Weekly capacity
            </h3>
            {s.tasks
              .filter((t) => t.published && !t.archived)
              .map((t) => (
                <div className="capacity-line" key={t.id}>
                  <div>
                    <b>{t.title}</b>
                    <small>
                      {t.capacity - seatsLeft(s, t)} reserved ·{" "}
                      {seatsLeft(s, t)} spaces available
                    </small>
                  </div>
                  <div className="long-progress">
                    <span
                      style={{
                        width:
                          ((t.capacity - seatsLeft(s, t)) / t.capacity) * 100 +
                          "%",
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      {tab === "audit" && (
        <div className="card padded">
          <div className="panel-heading">
            <h3>
              <Activity size={20} /> Workspace activity
            </h3>
            <button
              className="button small"
              onClick={() =>
                download(
                  JSON.stringify(s.audit, null, 2),
                  "seva40-activity-log.json",
                  "application/json",
                )
              }
            >
              <Download size={15} />
              Export
            </button>
          </div>
          <p className="small muted">
            Secure activity records of your community’s changes and reviews.
          </p>
          {s.audit.length ? (
            s.audit
              .filter((a) =>
                a.detail.toLowerCase().includes(search.toLowerCase()),
              )
              .map((a) => (
                <div className="audit-row" key={a.id}>
                  <span className="audit-dot" />
                  <div>
                    <b>{a.detail}</b>
                    <small>
                      {a.actor} ·{" "}
                      {new Date(a.at).toLocaleString("en-CA", {
                        timeZone: "America/Toronto",
                      })}
                    </small>
                  </div>
                </div>
              ))
          ) : (
            <Empty
              title="A new chapter is ready."
              body="Reservations, reviews, and task updates will be recorded here."
            />
          )}
        </div>
      )}
    </section>
  );
}
