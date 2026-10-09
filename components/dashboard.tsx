"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Download,
  Sparkles,
  Users,
} from "lucide-react";
import type { Store, Task, Claim } from "@/lib/model";
import {
  approvedHours,
  activeClaims,
  dateLabel,
  viewerId,
  weekStart,
} from "@/lib/model";

export default function Dashboard({
  s,
  go,
  openTask,
  openClaim,
  notify,
  exportLog,
}: {
  s: Store;
  go: (v: string) => void;
  openTask: (t: Task) => void;
  openClaim: (c: Claim) => void;
  notify: () => void;
  exportLog: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(6);
  const [showRemaining, setShowRemaining] = useState(false);
  const hours = approvedHours(s);
  const pending = s.claims.filter(
    (claim) =>
      claim.studentId === viewerId(s) && claim.status === "awaiting_review",
  ).length;
  const approved = s.claims.filter(
    (claim) => claim.studentId === viewerId(s) && claim.status === "approved",
  );
  const available = s.tasks.filter(
    (task) =>
      task.published && !task.archived && task.grades.includes(s.profile.grade),
  );
  const featured =
    available.find((task) => task.featured) ?? available[0] ?? s.tasks[0];
  const active = activeClaims(s)[0];
  const percentage = Math.min(100, Math.round((hours / s.profile.goal) * 100));
  const remaining = Math.max(0, s.profile.goal - hours);
  const trendData = useMemo(() => {
    const key = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(12, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      return {
        key: key(date),
        label: date.toLocaleDateString("en-CA", { weekday: "short" }).slice(0, 1),
        fullLabel: date.toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" }),
        hours: 0,
      };
    });
    approved.forEach((claim) => {
      const date = new Date(claim.reviewedAt ?? `${claim.taskDate}T12:00:00`);
      const day = days.find((item) => item.key === key(date));
      if (day) day.hours += claim.approvedHours;
    });
    return days;
  }, [approved]);
  const trendMax = Math.max(1, ...trendData.map((day) => day.hours));
  const selectedTrend = trendData[selectedDay];

  return (
    <div className="overview-dashboard">
      <header className="dashboard-heading reference-heading">
        <div>
          <h1>Hello, {s.profile.name.split(" ")[0]}!</h1>
          <p>Here’s your community service overview.</p>
        </div>
        <button className="week-tag" onClick={() => go("calendar")}>
          <CalendarDays size={15} /> Week of{" "}
          {dateLabel(weekStart().toLocaleDateString("en-CA"))}
        </button>
      </header>

      <div className="reference-grid">
        <button className="reference-card metric-card" onClick={() => go("tasks")}>
          <span className="metric-icon dark"><Users size={19} /></span>
          <strong>{available.length}</strong>
          <span>open opportunities</span>
          <small>Ready to reserve</small>
        </button>

        <button className="reference-card metric-card" onClick={() => go("logbook")}>
          <span className="metric-icon violet"><CheckCircle2 size={19} /></span>
          <strong>{hours}</strong>
          <span>approved hours</span>
          <small>{approved.length} verified entries</small>
        </button>

        <button className="reference-card metric-card" onClick={() => go("evidence")}>
          <span className="metric-icon orange"><Clock3 size={19} /></span>
          <strong>{pending}</strong>
          <span>awaiting review</span>
          <small>With your committee</small>
        </button>

        <section className="reference-card progress-ring-card">
          <button
            type="button"
            className="reference-ring"
            style={{ "--progress": `${percentage * 3.6}deg` } as CSSProperties}
            onClick={() => setShowRemaining((value) => !value)}
            aria-label={`${percentage}% complete, ${remaining} hours remaining. Select to switch display.`}
          >
            <div>
              <strong>{showRemaining ? `${remaining}h` : `${percentage}%`}</strong>
              <span>{showRemaining ? "remaining" : "complete"}</span>
            </div>
          </button>
          <h3>Your 40-hour goal</h3>
          <div className="ring-legend">
            <span><i className="violet-dot" />Complete <b>{hours}h</b></span>
            <span><i />Remaining <b>{remaining}h</b></span>
          </div>
        </section>

        <section className="reference-card trends-card">
          <div className="reference-card-heading">
            <div>
              <h2>Progress trend</h2>
              <p>Hours moving toward your goal</p>
            </div>
            <span>{hours}h total</span>
          </div>
          <div className="trend-selection" role="status">
            <strong>{selectedTrend.hours}h</strong>
            <span>{selectedTrend.fullLabel}</span>
          </div>
          <div className="reference-bars" aria-label="Approved hours over the last seven days">
            {trendData.map((day, index) => (
              <button
                type="button"
                key={day.key}
                className={selectedDay === index ? "selected" : ""}
                onClick={() => setSelectedDay(index)}
                aria-label={`${day.fullLabel}: ${day.hours} approved hours`}
                aria-pressed={selectedDay === index}
              >
                <span
                  style={{ height: `${Math.max(8, (day.hours / trendMax) * 100)}%` }}
                  className={selectedDay === index ? "striped" : ""}
                >
                  <i>{day.hours}h</i>
                </span>
                <small>{day.label}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="reference-card feature-panel">
          <div className="reference-card-heading">
            <div>
              <span className="reference-overline">FEATURED THIS WEEK</span>
              <h2>{featured?.title ?? "Your next act of seva"}</h2>
            </div>
            <span className="metric-icon orange"><Sparkles size={18} /></span>
          </div>
          <p>{featured?.location ?? "New opportunities will appear here."}</p>
          <div className="feature-meta">
            <span><Clock3 size={14} />{featured ? `${featured.hours} hours` : "Coming soon"}</span>
            <span><CalendarDays size={14} />{featured ? dateLabel(featured.date) : "This week"}</span>
          </div>
          <button
            className="reference-primary"
            onClick={() => (featured ? openTask(featured) : go("tasks"))}
          >
            View opportunity <ArrowUpRight size={17} />
          </button>
        </section>

        <section className="reference-card active-panel">
          <span className="metric-icon dark"><Camera size={19} /></span>
          <div>
            <h3>{active ? "Continue your seva" : "Capture your impact"}</h3>
            <p>{active ? active.taskTitle : "Start with a before photo, then document the difference."}</p>
          </div>
          <button onClick={() => (active ? openClaim(active) : go("tasks"))}>
            {active ? "Open workspace" : "Find seva"} <ArrowRight size={16} />
          </button>
        </section>

        <section className="reference-card logbook-panel">
          <div className="reference-card-heading">
            <div>
              <h2>Your logbook</h2>
              <p>{approved.length} verified entries</p>
            </div>
            <span className="metric-icon violet"><BookOpen size={18} /></span>
          </div>
          <button onClick={exportLog}><Download size={16} /> Export official record</button>
        </section>

        <section className="insight-panel">
          <span><Sparkles size={14} /> SEVA INSIGHT</span>
          <h3>{remaining ? `${remaining} hours to go.` : "Your goal is complete."}</h3>
          <p>{remaining ? "One more act of service this week keeps your momentum moving." : "Your approved record is ready to celebrate and export."}</p>
          <button onClick={() => (remaining ? go("tasks") : exportLog())}>
            {remaining ? "Find an opportunity" : "Export logbook"}
          </button>
          <button className="insight-secondary" onClick={notify}>View updates</button>
        </section>
      </div>
    </div>
  );
}
