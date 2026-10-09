"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Upload,
  Clock,
  MapPin,
  Users,
  Bookmark,
  Check,
  ArrowRight,
  Play,
  ShieldCheck,
  CalendarPlus,
  FileCheck,
  AlertCircle,
  Download,
} from "lucide-react";
import type { Store, Task, Claim, Action, Category } from "@/lib/model";
import {
  seatsLeft,
  dateLabel,
  CATEGORIES,
  id,
  STATUS_LABEL,
  viewerId,
} from "@/lib/model";
import { photo } from "@/lib/storage";
import { exportICS, exportPDF } from "@/lib/exports";
import { googleSignIn, googleConfigured } from "@/lib/auth";
import { Modal, StatusPill } from "./ui";
type Commit = (a: Action, message?: string) => Promise<boolean>;
export function TaskDialog({
  task: t,
  s,
  commit,
  onClose,
  openClaim,
}: {
  task: Task;
  s: Store;
  commit: Commit;
  onClose: () => void;
  openClaim: (c: Claim) => void;
}) {
  const claim = s.claims.find(
    (c) =>
      c.taskId === t.id &&
      c.studentId === viewerId(s) &&
      !["cancelled", "rejected"].includes(c.status),
  );
  const saved = s.saved.includes(t.id);
  return (
    <Modal
      title={t.title}
      subtitle={`${t.category} · ${dateLabel(t.date)}`}
      onClose={onClose}
      wide
    >
      <div className="task-detail-image">
        <div className="seva-hero-surface" aria-hidden="true" />
        <span className="glass-tag">{t.category} seva</span>
      </div>
      <div className="detail-metrics">
        <span>
          <Clock />
          {t.hours} hours
        </span>
        <span>
          <Users />
          {seatsLeft(s, t)} spaces
        </span>
        <span>
          <MapPin />
          {t.location}
        </span>
      </div>
      <p className="description">{t.description}</p>
      <div className="two-col">
        <div className="inset">
          <h4>Your shift</h4>
          <p>
            {dateLabel(t.date)} at {t.time} · Toronto time
          </p>
          <p>Grades {t.grades.join(", ")}</p>
          <p>Supervisor: {t.supervisor}</p>
          <p>
            {t.accessible
              ? "Accessible, seated options available"
              : "Outdoor / movement-based activity"}
          </p>
        </div>
        <div className="inset">
          <h4>What to bring</h4>
          <p>{t.supplies}</p>
          <p>
            Capture the task area before starting. Avoid faces and personal
            information in evidence photos.
          </p>
        </div>
      </div>
      <h4>What you’ll help with</h4>
      <div className="check-list">
        {t.checklist.map((item) => (
          <div key={item}>
            <Check size={17} />
            {item}
          </div>
        ))}
      </div>
      <div className="guidance-note">
        <ShieldCheck size={17} />
        <span>
          Confirm this activity’s eligibility with your school. Hours are added
          only after committee approval.
        </span>
      </div>
      <div className="modal-actions">
        <button
          className={`button ${saved ? "selected" : ""}`}
          onClick={() =>
            commit(
              { type: "save", taskId: t.id },
              saved ? "Removed from saved" : "Opportunity saved",
            )
          }
        >
          <Bookmark size={16} />
          {saved ? "Saved" : "Save"}
        </button>
        <button className="button" onClick={() => exportICS([t])}>
          <CalendarPlus size={16} />
          Add to calendar
        </button>
        {claim ? (
          <button className="orange-button" onClick={() => openClaim(claim)}>
            Open your shift
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="orange-button"
            disabled={
              seatsLeft(s, t) === 0 || !t.grades.includes(s.profile.grade)
            }
            onClick={async () => {
              if (
                await commit(
                  { type: "reserve", taskId: t.id },
                  "Your space is reserved. Open My evidence to begin.",
                )
              )
                onClose();
            }}
          >
            {!t.grades.includes(s.profile.grade)
              ? `Grades ${t.grades.join(" & ")} only`
              : seatsLeft(s, t) === 0
                ? "Shift is full"
                : "Reserve my space"}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </Modal>
  );
}
export function ClaimDialog({
  claim: c,
  s,
  commit,
  onClose,
  toast,
}: {
  claim: Claim;
  s: Store;
  commit: Commit;
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const [reflection, setReflection] = useState(c.reflection),
    [hours, setHours] = useState(c.hours),
    [checks, setChecks] = useState(c.checks),
    [uploading, setUploading] = useState("");
  const t = s.tasks.find((t) => t.id === c.taskId);
  const ownClaim = c.studentId === viewerId(s);
  const editable =
    ownClaim &&
    ["reserved", "in_progress", "changes_requested"].includes(c.status);
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem("seva40-draft-" + c.id);
      if (draft) {
        const d = JSON.parse(draft);
        setReflection(d.reflection ?? c.reflection);
        setHours(d.hours ?? c.hours);
        setChecks(d.checks ?? c.checks);
      }
    } catch {}
  }, [c.id]);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "seva40-draft-" + c.id,
        JSON.stringify({ reflection, hours, checks }),
      );
    } catch {}
  }, [c.id, reflection, hours, checks]);
  async function addPhoto(file: File | undefined, phase: "before" | "after") {
    if (!file) return;
    setUploading(phase);
    try {
      await commit(
        { type: "evidence", claimId: c.id, phase, evidence: await photo(file) },
        `${phase === "before" ? "Before" : "After"} photo saved`,
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setUploading("");
    }
  }
  return (
    <Modal
      title={c.taskTitle}
      subtitle="Your evidence workspace"
      onClose={onClose}
      wide
    >
      <div className="workflow-steps">
        {["Reserve", "Before photo", "Do seva", "Submit", "Approved"].map(
          (label, i) => (
            <div
              className={
                i === 0 ||
                (i === 1 && c.before) ||
                (i === 2 && c.startedAt) ||
                (i === 3 && c.submittedAt) ||
                (i === 4 && c.status === "approved")
                  ? "done"
                  : ""
              }
              key={label}
            >
              <span>{i + 1}</span>
              {label}
            </div>
          ),
        )}
      </div>
      <div className="claim-status">
        <StatusPill status={c.status} />
        <span>
          {c.status === "approved" ? c.approvedHours : c.hours} hours{" "}
          {c.status === "approved" ? "approved" : "requested"}
        </span>
      </div>
      {c.reviewNote && (
        <div className="guidance-note">
          <AlertCircle size={18} />
          <span>
            <b>Committee feedback</b>
            <br />
            {c.reviewNote}
          </span>
        </div>
      )}
      <div className="two-col evidence-grid">
        {(["before", "after"] as const).map((phase) => (
          <div className="photo-slot" key={phase}>
            <div className="photo-label">
              <b>
                {phase === "before"
                  ? "01 · Before your seva"
                  : "02 · After your seva"}
              </b>
              <span>{c[phase] ? "Added" : "Required"}</span>
            </div>
            {c[phase] ? (
              <div className="photo-preview">
                <Image
                  src={c[phase]!.data}
                  alt={`${phase} evidence`}
                  fill
                  unoptimized
                  sizes="320px"
                />
              </div>
            ) : (
              <div className="photo-placeholder">
                <Camera size={36} />
                <p>
                  {phase === "before"
                    ? "Capture your starting point"
                    : "Show the work you completed"}
                </p>
              </div>
            )}
            {editable && (
              <label
                className={`button upload-button ${uploading ? "disabled" : ""}`}
              >
                <Upload size={16} />
                {uploading === phase
                  ? "Processing photo…"
                  : c[phase]
                    ? "Replace photo"
                    : "Upload or take photo"}
                <input
                  aria-label={`${phase} photo`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!!uploading}
                  onChange={(e) => {
                    addPhoto(e.target.files?.[0], phase);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {c[phase] && (
              <small>
                Saved{" "}
                {new Date(c[phase]!.capturedAt).toLocaleString("en-CA", {
                  timeZone: "America/Toronto",
                })}
              </small>
            )}
          </div>
        ))}
      </div>
      <p className="small muted">
        JPG, PNG, WebP · up to 15 MB. Photos are resized and metadata is
        removed. Photograph the task, and keep faces out of frame.
      </p>
      {ownClaim && c.status === "reserved" && (
        <div className="inset start-shift">
          <div>
            <h4>Ready to lend a hand?</h4>
            <p>Upload your before photo, then start your shift.</p>
          </div>
          <button
            className="orange-button"
            disabled={!c.before || !!uploading}
            onClick={() =>
              commit(
                { type: "start", claimId: c.id },
                "Shift started. Complete your checklist and add an after photo.",
              )
            }
          >
            <Play size={16} />
            Start shift
          </button>
        </div>
      )}
      {c.startedAt && (
        <div className="inline-meta">
          <Clock size={15} />
          Started{" "}
          {new Date(c.startedAt).toLocaleTimeString("en-CA", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Toronto",
          })}{" "}
          · Your committee verifies the actual time served.
        </div>
      )}
      {ownClaim && ["in_progress", "changes_requested"].includes(c.status) && (
        <>
          <h4>Task checklist</h4>
          <div className="check-list">
            {(t?.checklist ?? []).map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={checks.includes(item)}
                  onChange={() =>
                    setChecks((p) =>
                      p.includes(item)
                        ? p.filter((x) => x !== item)
                        : [...p, item],
                    )
                  }
                />
                {item}
              </label>
            ))}
          </div>
          <div className="form-row">
            <label>
              Hours completed
              <input
                aria-label="Hours completed"
                type="number"
                min="0.25"
                step="0.25"
                max={t?.hours ?? c.hours}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
              <small>Maximum {t?.hours ?? c.hours} hours for this shift.</small>
            </label>
          </div>
          <label className="field">
            A little reflection
            <textarea
              aria-label="Reflection"
              placeholder="What did you help with? What did you learn?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              maxLength={1500}
            />
            <small>{reflection.length}/1500 · at least 20 characters</small>
          </label>
          <div className="modal-actions">
            <button
              className="orange-button"
              disabled={!!uploading}
              onClick={async () => {
                if (
                  await commit(
                    {
                      type: "finish",
                      claimId: c.id,
                      hours,
                      reflection,
                      checks,
                    },
                    "Sent to your committee. Your hours stay pending until approved.",
                  )
                ) {
                  sessionStorage.removeItem("seva40-draft-" + c.id);
                  onClose();
                }
              }}
            >
              <FileCheck size={16} />
              Submit for approval
            </button>
          </div>
        </>
      )}
      {!editable && (
        <div className="inset">
          <h4>Your reflection</h4>
          <p>{c.reflection || "No reflection recorded."}</p>
          <p>
            {c.status === "approved"
              ? `Verified by ${c.reviewedBy}. ${c.approvedHours} hours are in your logbook.`
              : "You can follow this submission’s status in My evidence."}
          </p>
        </div>
      )}
      <div className="modal-actions">
        {["reserved", "in_progress", "changes_requested"].includes(
          c.status,
        ) && (
          <button
            className="button danger"
            onClick={async () => {
              if (
                await commit(
                  { type: "cancel", claimId: c.id },
                  "Reservation cancelled and space released.",
                )
              )
                onClose();
            }}
          >
            Cancel reservation
          </button>
        )}
        {c.status === "approved" && (
          <button
            className="button"
            onClick={() => exportPDF(s, c).catch((e) => toast(e.message))}
          >
            <Download size={16} />
            Download service record
          </button>
        )}
      </div>
    </Modal>
  );
}
export function ReviewDialog({
  claim: c,
  commit,
  onClose,
}: {
  claim: Claim;
  commit: Commit;
  onClose: () => void;
}) {
  const [hours, setHours] = useState(c.hours),
    [note, setNote] = useState(""),
    [decision, setDecision] = useState<
      "approved" | "changes_requested" | "rejected"
    >("approved");
  return (
    <Modal
      title="A little care in every review"
      subtitle={`${c.studentName} · ${c.taskTitle}`}
      onClose={onClose}
      wide
    >
      <div className="detail-metrics">
        <span>
          <Clock size={18} />
          {c.hours} hours requested
        </span>
        <span>
          <MapPin size={18} />
          {c.location}
        </span>
      </div>
      <div className="two-col evidence-grid">
        {(["before", "after"] as const).map((p) => (
          <div key={p}>
            <h4>{p === "before" ? "Before seva" : "After seva"}</h4>
            <div className="photo-preview">
              {c[p] ? (
                <Image
                  src={c[p]!.data}
                  alt={`${p} submission evidence`}
                  fill
                  unoptimized
                  sizes="320px"
                />
              ) : (
                <span>Evidence missing</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="inset">
        <h4>Student reflection</h4>
        <p>{c.reflection}</p>
        <p>
          Task date: {c.taskDate} · Supervisor: {c.supervisor}
        </p>
        <div className="check-list">
          {c.checks.map((x) => (
            <div key={x}>
              <Check size={15} />
              {x}
            </div>
          ))}
        </div>
      </div>
      <div className="form-row">
        <label>
          Decision
          <select
            aria-label="Review decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value as typeof decision)}
          >
            <option value="approved">Approve hours</option>
            <option value="changes_requested">Request changes</option>
            <option value="rejected">Do not approve</option>
          </select>
        </label>
        <label>
          Hours to approve
          <input
            aria-label="Hours to approve"
            type="number"
            min="0.25"
            step="0.25"
            max={c.hours}
            value={hours}
            disabled={decision !== "approved"}
            onChange={(e) => setHours(Number(e.target.value))}
          />
        </label>
      </div>
      <label className="field">
        Committee note
        <textarea
          aria-label="Committee note"
          placeholder={
            decision === "approved"
              ? "Add a helpful note (optional)"
              : "Explain what needs to change (required)"
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
        />
      </label>
      <div className="guidance-note">
        <ShieldCheck size={18} />
        <span>
          Verify the actual work and hours with the supervisor. A photo by
          itself does not prove the time served.
        </span>
      </div>
      <div className="modal-actions">
        <button
          className="orange-button"
          onClick={async () => {
            if (
              await commit(
                { type: "review", claimId: c.id, decision, hours, note },
                decision === "approved"
                  ? "Hours approved and added to the student’s logbook."
                  : "Review saved. The student can see your feedback.",
              )
            )
              onClose();
          }}
        >
          <ShieldCheck size={16} />
          Save review
        </button>
      </div>
    </Modal>
  );
}
export function TaskEditor({
  task,
  s,
  commit,
  onClose,
}: {
  task?: Task;
  s: Store;
  commit: Commit;
  onClose: () => void;
}) {
  const [t, setT] = useState<Task>(
    () =>
      task ?? {
        id: id(),
        title: "",
        description: "",
        category: "Langar",
        date: new Date().toLocaleDateString("en-CA"),
        time: "10:00",
        hours: 2,
        capacity: 8,
        location: "Gurdwara · Community room",
        supervisor: "",
        checklist: [
          "Meet your supervisor",
          "Complete the assigned task",
          "Clean your workspace",
        ],
        grades: [10, 11, 12],
        published: true,
        archived: false,
        accessible: true,
        supplies: "Head covering and comfortable shoes",
        featured: false,
      },
  );
  const update = (k: keyof Task, v: unknown) => setT((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={task ? "Edit opportunity" : "Make room for more good"}
      subtitle="Publish this week’s seva for your students."
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await commit(
              { type: "task", task: t },
              t.published
                ? "Opportunity published to the student board."
                : "Draft saved for your committee.",
            )
          )
            onClose();
        }}
      >
        <label className="field">
          Task title
          <input
            required
            maxLength={80}
            value={t.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Saturday langar hall setup"
          />
        </label>
        <label className="field">
          Description
          <textarea
            required
            maxLength={2000}
            value={t.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Explain the impact and what students will do."
          />
        </label>
        <div className="form-row">
          <label>
            Category
            <select
              value={t.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Shift date
            <input
              required
              type="date"
              value={t.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </label>
          <label>
            Start time
            <input
              required
              type="time"
              value={t.time}
              onChange={(e) => update("time", e.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Hours
            <input
              required
              type="number"
              min="0.25"
              step="0.25"
              max="8"
              value={t.hours}
              onChange={(e) => update("hours", Number(e.target.value))}
            />
          </label>
          <label>
            Volunteer capacity
            <input
              required
              type="number"
              min="1"
              max="100"
              value={t.capacity}
              onChange={(e) => update("capacity", Number(e.target.value))}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Location
            <input
              required
              maxLength={100}
              value={t.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </label>
          <label>
            Supervisor
            <input
              required
              maxLength={80}
              value={t.supervisor}
              onChange={(e) => update("supervisor", e.target.value)}
              placeholder="Supervising volunteer name"
            />
          </label>
        </div>
        <label className="field">
          What students should bring
          <input
            required
            maxLength={200}
            value={t.supplies}
            onChange={(e) => update("supplies", e.target.value)}
          />
        </label>
        <label className="field">
          Task checklist (one item per line)
          <textarea
            value={t.checklist.join("\n")}
            onChange={(e) => update("checklist", e.target.value.split("\n"))}
          />
        </label>
        <div className="grade-selector">
          <b>Eligible grades</b>
          {[10, 11, 12].map((g) => (
            <label key={g}>
              <input
                type="checkbox"
                checked={t.grades.includes(g)}
                onChange={() =>
                  update(
                    "grades",
                    t.grades.includes(g)
                      ? t.grades.filter((x) => x !== g)
                      : [...t.grades, g],
                  )
                }
              />
              Grade {g}
            </label>
          ))}
        </div>
        <div className="check-list">
          <label>
            <input
              type="checkbox"
              checked={t.accessible}
              onChange={(e) => update("accessible", e.target.checked)}
            />
            Accessible / seated options available
          </label>
          <label>
            <input
              type="checkbox"
              checked={t.featured}
              onChange={(e) => update("featured", e.target.checked)}
            />
            Feature on the student dashboard
          </label>
          <label>
            <input
              type="checkbox"
              checked={t.published}
              onChange={(e) => update("published", e.target.checked)}
            />
            Publish now (uncheck to save a draft)
          </label>
        </div>
        <div className="modal-actions">
          <button className="orange-button" type="submit">
            {t.published ? "Publish opportunity" : "Save draft"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function SignInDialog({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Your seva starts here."
      subtitle="One community. A world of difference."
      onClose={onClose}
    >
      <div className="signin-art">
        <ShieldCheck size={48} />
      </div>
      <p className="description">
        Join with your Google account to keep your journey connected.
      </p>
      <button
        className="google-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await googleSignIn();
          } catch (e) {
            toast((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 5-.9 6.6-2.4L15.4 17c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.4 13.7a6 6 0 0 1 0-3.4V7.7H3.1a10 10 0 0 0 0 8.6l3.3-2.6Z"
          />
          <path
            fill="#EA4335"
            d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.7A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.7l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1Z"
          />
        </svg>
        {busy ? "Connecting…" : "Continue with Google"}
      </button>
      <button className="button full" onClick={onClose}>
        Back to your workspace
        <ArrowRight size={16} />
      </button>
      <p className="small muted auth-note">
        {googleConfigured()
          ? "Your Google account opens your personal seva workspace."
          : "Google sign-in is waiting for the account connection. Please try again shortly."}
      </p>
    </Modal>
  );
}
