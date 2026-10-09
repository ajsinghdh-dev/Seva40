export type Category = "Langar" | "Community" | "Environment" | "Education";
export type Status =
  | "reserved"
  | "in_progress"
  | "awaiting_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "cancelled";
export type Task = {
  id: string;
  title: string;
  description: string;
  category: Category;
  date: string;
  time: string;
  hours: number;
  capacity: number;
  location: string;
  supervisor: string;
  checklist: string[];
  grades: number[];
  published: boolean;
  archived: boolean;
  accessible: boolean;
  supplies: string;
  featured: boolean;
};
export type Evidence = { data: string; name: string; capturedAt: string };
export type Claim = {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  status: Status;
  before?: Evidence;
  after?: Evidence;
  startedAt?: string;
  finishedAt?: string;
  hours: number;
  approvedHours: number;
  reflection: string;
  checks: string[];
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  submittedAt?: string;
  taskTitle: string;
  taskDate: string;
  supervisor: string;
  location: string;
};
export type Notice = {
  recipientId?: string;
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  audience: "all" | "students" | "committee";
};
export type Audit = {
  id: string;
  action: string;
  detail: string;
  at: string;
  actor: string;
};
export type Profile = {
  name: string;
  grade: number;
  school: string;
  goal: number;
  targetDate: string;
  interests: Category[];
  guardianConsent: boolean;
  schoolConfirmed: boolean;
};
export type Store = {
  revision?: number;
  onboardingComplete?: boolean;
  members?: { id: string; name: string; grade: number; school: string }[];
  committeeMembers?: {
    id: string;
    name: string;
    email: string;
    addedAt: string;
  }[];
  viewerId?: string;
  viewerRole?: "student" | "committee";
  occupancy?: Record<string, number>;
  version: 1;
  tasks: Task[];
  claims: Claim[];
  saved: string[];
  notices: Notice[];
  audit: Audit[];
  profile: Profile;
  preferences: {
    compact: boolean;
    reminders: boolean;
    reducedMotion: boolean;
    theme: "dark" | "light";
  };
  weeklyGoal: number;
};
export const STUDENT = "student-demo";
export const STATUS_LABEL: Record<Status, string> = {
  reserved: "Reserved",
  in_progress: "In progress",
  awaiting_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Not approved",
  cancelled: "Cancelled",
};
export const CATEGORIES: Category[] = [
  "Langar",
  "Community",
  "Environment",
  "Education",
];
export const id = () => crypto.randomUUID();
export const viewerId = (s: Store) => s.viewerId ?? STUDENT;
export const approvedHours = (s: Store, studentId = viewerId(s)) =>
  s.claims
    .filter((c) => c.studentId === studentId && c.status === "approved")
    .reduce((sum, c) => sum + c.approvedHours, 0);
export const activeClaims = (s: Store) =>
  s.claims.filter(
    (c) =>
      c.studentId === viewerId(s) &&
      !["approved", "rejected", "cancelled"].includes(c.status),
  );
export const seatsLeft = (s: Store, t: Task) =>
  Math.max(
    0,
    t.capacity -
      (s.occupancy?.[t.id] ??
        s.claims.filter(
          (c) =>
            c.taskId === t.id && !["cancelled", "rejected"].includes(c.status),
        ).length),
  );
export const dateLabel = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
export function weekStart(input = new Date()) {
  const d = new Date(input);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(12, 0, 0, 0);
  return d;
}
export function dateOffset(offset: number) {
  const d = weekStart();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const illustrationEvidence = (label: string): Evidence => ({
  name: "sample-evidence.svg",
  capturedAt: new Date().toISOString(),
  data:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="450"><defs><linearGradient id="g"><stop stop-color="#242c42"/><stop offset="1" stop-color="#945728"/></linearGradient></defs><rect width="700" height="450" fill="url(#g)"/><rect x="60" y="100" width="580" height="170" rx="20" fill="#14181d"/><g fill="#777b81"><ellipse cx="220" cy="220" rx="100" ry="28"/><ellipse cx="470" cy="220" rx="100" ry="28"/></g><text x="50%" y="360" text-anchor="middle" fill="white" font-family="sans-serif" font-size="22">${label} · SAMPLE EVIDENCE</text></svg>`,
    ),
});
export function seed(): Store {
  const tasks: Task[] = [
    {
      id: "langar",
      title: "Sunday langar preparation",
      description:
        "Help prepare and serve a warm community meal. Set up the serving area, portion ingredients, and clean the kitchen together. A committee supervisor will guide your shift.",
      category: "Langar",
      date: dateOffset(6),
      time: "10:00",
      hours: 3,
      capacity: 12,
      location: "Gurdwara · Langar hall",
      supervisor: "Committee supervisor",
      checklist: [
        "Wash hands and follow kitchen guidance",
        "Prepare the serving stations",
        "Help serve the community",
        "Clean and return all equipment",
      ],
      grades: [10, 11, 12],
      published: true,
      archived: false,
      accessible: true,
      supplies: "Head covering, comfortable closed-toe shoes",
      featured: true,
    },
    {
      id: "pantry",
      title: "Community food drive",
      description:
        "Sort donated food, check best-before dates, and assemble grocery hampers for local families.",
      category: "Community",
      date: dateOffset(5),
      time: "11:00",
      hours: 2,
      capacity: 8,
      location: "Gurdwara · Community room",
      supervisor: "Food drive coordinator",
      checklist: [
        "Sort donations by food type",
        "Check package condition",
        "Pack family hampers",
      ],
      grades: [10, 11, 12],
      published: true,
      archived: false,
      accessible: true,
      supplies: "Reusable water bottle",
      featured: false,
    },
    {
      id: "garden",
      title: "A greener neighbourhood",
      description:
        "Join a supervised cleanup around the gurdwara grounds. Pick up litter and care for the shared garden.",
      category: "Environment",
      date: dateOffset(5),
      time: "09:00",
      hours: 2,
      capacity: 10,
      location: "Gurdwara · Gardens",
      supervisor: "Grounds coordinator",
      checklist: [
        "Collect gloves and a litter picker",
        "Clear assigned area",
        "Sort waste and recycling",
      ],
      grades: [10, 11, 12],
      published: true,
      archived: false,
      accessible: false,
      supplies: "Weather-appropriate clothing, closed-toe shoes",
      featured: false,
    },
    {
      id: "tutor",
      title: "Homework & reading circle",
      description:
        "Support younger learners with reading and homework, under the supervision of an adult program lead.",
      category: "Education",
      date: dateOffset(3),
      time: "16:30",
      hours: 1.5,
      capacity: 6,
      location: "Gurdwara · Learning room",
      supervisor: "Education coordinator",
      checklist: [
        "Meet your supervising adult",
        "Prepare reading materials",
        "Help learners and tidy up",
      ],
      grades: [11, 12],
      published: true,
      archived: false,
      accessible: true,
      supplies: "Notebook and a pen",
      featured: false,
    },
    {
      id: "welcome",
      title: "Welcome desk seva",
      description:
        "Greet visitors, help them find their way, and keep the shoe area welcoming and organized.",
      category: "Community",
      date: dateOffset(6),
      time: "09:00",
      hours: 2,
      capacity: 4,
      location: "Gurdwara · Main entrance",
      supervisor: "Welcome coordinator",
      checklist: [
        "Meet the welcome team",
        "Greet and guide visitors",
        "Organize the shoe area",
      ],
      grades: [10, 11, 12],
      published: true,
      archived: false,
      accessible: true,
      supplies: "Comfortable clothing and head covering",
      featured: false,
    },
    {
      id: "care",
      title: "Care packages, made together",
      description:
        "Assemble hygiene and care packages for a local community partner. Count supplies and write kind notes.",
      category: "Community",
      date: dateOffset(4),
      time: "17:00",
      hours: 2,
      capacity: 8,
      location: "Gurdwara · Community room",
      supervisor: "Community coordinator",
      checklist: [
        "Count supplies",
        "Pack essential items",
        "Prepare hand-written notes",
      ],
      grades: [10, 11, 12],
      published: true,
      archived: false,
      accessible: true,
      supplies: "Everything is provided",
      featured: false,
    },
  ];
  const history = [
    ["Meal preparation", 5, "Langar"],
    ["Community food sorting", 4, "Community"],
    ["Garden cleanup", 3, "Environment"],
    ["Welcome desk", 4, "Community"],
    ["Learning circle support", 3, "Education"],
    ["Langar hall reset", 5, "Langar"],
  ];
  const claims: Claim[] = history.map(([title, hours], i) => ({
    id: `history-${i}`,
    taskId: `past-${i}`,
    studentId: STUDENT,
    studentName: "Arjun",
    status: "approved",
    hours: Number(hours),
    approvedHours: Number(hours),
    reflection:
      "Helped the team complete the shift and learned how small acts support the whole community.",
    checks: [],
    before: illustrationEvidence("Before"),
    after: illustrationEvidence("After"),
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: "Demo committee",
    reviewNote: "Shift verified by the supervising volunteer.",
    taskTitle: String(title),
    taskDate: dateOffset(-7 - i * 2),
    supervisor: "Demo committee supervisor",
    location: "Gurdwara",
  }));
  claims.push({
    id: "pending-demo",
    taskId: "pantry",
    studentId: "simran-demo",
    studentName: "Simran (sample)",
    status: "awaiting_review",
    hours: 2,
    approvedHours: 0,
    reflection: "Sorted donations and packed twelve hampers with the team.",
    checks: [
      "Sort donations by food type",
      "Check package condition",
      "Pack family hampers",
    ],
    before: illustrationEvidence("Before sorting"),
    after: illustrationEvidence("After sorting"),
    submittedAt: new Date().toISOString(),
    taskTitle: "Community food drive",
    taskDate: dateOffset(-1),
    supervisor: "Food drive coordinator",
    location: "Gurdwara · Community room",
  });
  return {
    version: 1,
    tasks,
    claims,
    saved: ["pantry"],
    notices: [
      {
        id: "welcome-notice",
        title: "This week, make a difference.",
        body: "New seva opportunities are open. Reserve a shift, capture your before photo, and let your committee verify your hours.",
        date: new Date().toISOString(),
        read: false,
        audience: "all",
      },
      {
        id: "school-notice",
        title: "A logbook your school can review",
        body: "Export your approved entries and confirm activity eligibility with your school before volunteering.",
        date: new Date().toISOString(),
        read: false,
        audience: "students",
      },
    ],
    audit: [],
    profile: {
      name: "Arjun",
      grade: 11,
      school: "Your secondary school",
      goal: 40,
      targetDate: dateOffset(90),
      interests: ["Langar", "Community"],
      guardianConsent: false,
      schoolConfirmed: false,
    },
    preferences: {
      compact: false,
      reminders: true,
      reducedMotion: false,
      theme: "dark",
    },
    weeklyGoal: 4,
  };
}
export type Action =
  | { type: "reserve"; taskId: string }
  | { type: "cancel"; claimId: string }
  | { type: "save"; taskId: string }
  | {
      type: "evidence";
      claimId: string;
      phase: "before" | "after";
      evidence: Evidence;
    }
  | { type: "start"; claimId: string }
  | {
      type: "finish";
      claimId: string;
      hours: number;
      reflection: string;
      checks: string[];
    }
  | {
      type: "review";
      claimId: string;
      decision: "approved" | "changes_requested" | "rejected";
      hours: number;
      note: string;
    }
  | { type: "task"; task: Task }
  | { type: "archive"; taskId: string }
  | { type: "notice"; notice: Notice }
  | { type: "read"; noticeId?: string; audience?: Notice["audience"] }
  | { type: "profile"; profile: Profile }
  | { type: "preferences"; preferences: Store["preferences"] }
  | { type: "goal"; hours: number };
export function transition(state: Store, action: Action): Store {
  const s: Store = structuredClone(state);
  const now = new Date().toISOString();
  let detail = "";
  let actor = "Student preview";
  const findClaim = (claimId: string) => {
    const c = s.claims.find((c) => c.id === claimId);
    if (!c) throw new Error("That submission could not be found.");
    return c;
  };
  switch (action.type) {
    case "reserve": {
      const t = s.tasks.find((t) => t.id === action.taskId);
      if (!t || !t.published || t.archived)
        throw new Error("This opportunity is not open.");
      if (!t.grades.includes(s.profile.grade))
        throw new Error("This task is not available for your grade.");
      if (
        t.date <
        new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" })
      )
        throw new Error("This opportunity has already passed.");
      if (
        s.claims.some(
          (c) =>
            c.studentId === viewerId(s) &&
            c.taskId === t.id &&
            !["cancelled", "rejected"].includes(c.status),
        )
      )
        throw new Error("You already have a reservation for this task.");
      if (seatsLeft(s, t) < 1) throw new Error("This shift is full.");
      s.claims.unshift({
        id: id(),
        taskId: t.id,
        studentId: viewerId(s),
        studentName: s.profile.name,
        status: "reserved",
        hours: t.hours,
        approvedHours: 0,
        reflection: "",
        checks: [],
        taskTitle: t.title,
        taskDate: t.date,
        supervisor: t.supervisor,
        location: t.location,
      });
      detail = `Reserved ${t.title}`;
      break;
    }
    case "cancel": {
      const c = findClaim(action.claimId);
      if (!["reserved", "in_progress", "changes_requested"].includes(c.status))
        throw new Error("This submission cannot be cancelled.");
      c.status = "cancelled";
      detail = `Cancelled ${c.taskTitle}`;
      break;
    }
    case "save": {
      s.saved = s.saved.includes(action.taskId)
        ? s.saved.filter((i) => i !== action.taskId)
        : [...s.saved, action.taskId];
      detail = "Updated saved opportunities";
      break;
    }
    case "evidence": {
      const c = findClaim(action.claimId);
      if (
        ["approved", "awaiting_review", "rejected", "cancelled"].includes(
          c.status,
        )
      )
        throw new Error("This submission is locked.");
      if (
        !action.evidence.data.startsWith("data:image/") &&
        !action.evidence.data.startsWith("storage:")
      )
        throw new Error("Please choose an image.");
      c[action.phase] = action.evidence;
      detail = `Added ${action.phase} photo to ${c.taskTitle}`;
      break;
    }
    case "start": {
      const c = findClaim(action.claimId);
      if (c.status !== "reserved")
        throw new Error("This shift has already started.");
      if (!c.before)
        throw new Error("Upload a before photo to start your shift.");
      c.startedAt = now;
      c.status = "in_progress";
      detail = `Started ${c.taskTitle}`;
      break;
    }
    case "finish": {
      const c = findClaim(action.claimId);
      if (!["in_progress", "changes_requested"].includes(c.status))
        throw new Error("Start your shift before submitting evidence.");
      if (!c.before || !c.after)
        throw new Error("Both before and after photos are required.");
      const t = s.tasks.find((t) => t.id === c.taskId);
      if (!t) throw new Error("Task not found.");
      if (
        !Number.isFinite(action.hours) ||
        action.hours < 0.25 ||
        (action.hours * 4) % 1 !== 0 ||
        action.hours > t.hours
      )
        throw new Error(`Requested hours must be between 0 and ${t.hours}.`);
      if (action.reflection.trim().length < 20)
        throw new Error("Add a reflection of at least 20 characters.");
      if (t.checklist.some((x) => !action.checks.includes(x)))
        throw new Error("Complete the task checklist before submitting.");
      c.hours = action.hours;
      c.reflection = action.reflection.trim();
      c.checks = action.checks;
      c.finishedAt = now;
      c.submittedAt = now;
      c.status = "awaiting_review";
      c.approvedHours = 0;
      detail = `Submitted ${c.taskTitle} for committee review`;
      s.notices.unshift({
        id: id(),
        title: "Submission ready for review",
        body: `${c.studentName}: ${c.taskTitle}`,
        date: now,
        read: false,
        audience: "committee",
      });
      break;
    }
    case "review": {
      const c = findClaim(action.claimId);
      if (c.status !== "awaiting_review")
        throw new Error("This submission has already been reviewed.");
      if (!c.before || !c.after)
        throw new Error("Both evidence photos are required.");
      if (
        action.decision === "approved" &&
        (!Number.isFinite(action.hours) ||
          action.hours < 0.25 ||
          (action.hours * 4) % 1 !== 0 ||
          action.hours > c.hours)
      )
        throw new Error(`Approve up to ${c.hours} requested hours.`);
      if (action.decision !== "approved" && action.note.trim().length < 5)
        throw new Error("Please explain the review decision.");
      c.status = action.decision;
      c.approvedHours = action.decision === "approved" ? action.hours : 0;
      c.reviewedBy = "Demo committee";
      c.reviewedAt = now;
      c.reviewNote = action.note.trim();
      actor = "Committee preview";
      detail = `${STATUS_LABEL[action.decision]}: ${c.taskTitle} (${c.approvedHours}h)`;
      s.notices.unshift({
        id: id(),
        title:
          action.decision === "approved"
            ? "Your hours are approved"
            : "An update on your submission",
        body: `${c.taskTitle}: ${STATUS_LABEL[action.decision]}. ${c.reviewNote}`,
        date: now,
        read: false,
        audience: "students",
      });
      break;
    }
    case "task": {
      const t = {
        ...action.task,
        checklist: action.task.checklist.map((x) => x.trim()).filter(Boolean),
      };
      if (
        !t.title.trim() ||
        !t.description.trim() ||
        !t.location.trim() ||
        !t.supervisor.trim() ||
        !t.date ||
        !t.time ||
        !t.checklist.length ||
        !t.grades.length ||
        !Number.isFinite(t.hours) ||
        t.hours < 0.25 ||
        (t.hours * 4) % 1 !== 0 ||
        t.hours > 8 ||
        !Number.isInteger(t.capacity) ||
        t.capacity < 1
      )
        throw new Error(
          "Complete the task details. Hours must be 0.25–8 and capacity at least 1.",
        );
      const prev = s.tasks.find((x) => x.id === t.id);
      if (
        prev &&
        s.claims.some(
          (c) =>
            c.taskId === t.id && !["cancelled", "rejected"].includes(c.status),
        ) &&
        JSON.stringify(prev) !== JSON.stringify(t)
      )
        throw new Error(
          "This task has reservations. Duplicate it to change shift details.",
        );
      s.tasks = prev
        ? s.tasks.map((x) => (x.id === t.id ? t : x))
        : [t, ...s.tasks];
      actor = "Committee preview";
      detail = `${t.published ? "Published" : "Saved draft"}: ${t.title}`;
      break;
    }
    case "archive": {
      const t = s.tasks.find((t) => t.id === action.taskId);
      if (!t) throw new Error("Task not found.");
      t.archived = !t.archived;
      actor = "Committee preview";
      detail = `${t.archived ? "Archived" : "Restored"} ${t.title}`;
      break;
    }
    case "notice": {
      s.notices.unshift(action.notice);
      actor = "Committee preview";
      detail = `Posted announcement: ${action.notice.title}`;
      break;
    }
    case "read": {
      s.notices = s.notices.map((n) =>
        (!action.noticeId || n.id === action.noticeId) &&
        (!action.audience ||
          n.audience === "all" ||
          n.audience === action.audience)
          ? { ...n, read: true }
          : n,
      );
      detail = "Marked notifications as read";
      break;
    }
    case "profile": {
      if (
        !action.profile.name.trim() ||
        ![10, 11, 12].includes(action.profile.grade) ||
        !Number.isFinite(action.profile.goal) ||
        action.profile.goal < 40 ||
        action.profile.goal > 500
      )
        throw new Error(
          "Enter your name, grade 10–12, and a goal of 40–500 hours.",
        );
      s.profile = action.profile;
      detail = "Updated student profile";
      break;
    }
    case "preferences":
      s.preferences = action.preferences;
      detail = "Updated preferences";
      break;
    case "goal":
      if (
        !Number.isFinite(action.hours) ||
        action.hours < 1 ||
        action.hours > 20
      )
        throw new Error("Choose a weekly goal from 1–20 hours.");
      s.weeklyGoal = action.hours;
      detail = "Updated weekly goal";
      break;
  }
  s.audit.unshift({ id: id(), action: action.type, detail, at: now, actor });
  s.audit = s.audit.slice(0, 300);
  return s;
}
