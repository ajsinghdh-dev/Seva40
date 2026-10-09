import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  transition,
  approvedHours,
  seatsLeft,
  illustrationEvidence,
} from "../lib/model.ts";
function reserved() {
  const s = seed();
  s.tasks[0].date = "2099-01-01";
  return transition(s, { type: "reserve", taskId: s.tasks[0].id });
}
function started() {
  const s = reserved();
  const c = s.claims[0];
  return transition(
    transition(s, {
      type: "evidence",
      claimId: c.id,
      phase: "before",
      evidence: illustrationEvidence("Before"),
    }),
    { type: "start", claimId: c.id },
  );
}
function submitted() {
  let s = started();
  const c = s.claims[0];
  s = transition(s, {
    type: "evidence",
    claimId: c.id,
    phase: "after",
    evidence: illustrationEvidence("After"),
  });
  return transition(s, {
    type: "finish",
    claimId: c.id,
    hours: 2,
    reflection: "Prepared and served the community meal with the kitchen team.",
    checks: s.tasks[0].checklist,
  });
}
test("sample starts at 24 approved hours", () =>
  assert.equal(approvedHours(seed()), 24));
test("reservation reduces capacity without granting hours", () => {
  const s = reserved();
  assert.equal(seatsLeft(s, s.tasks[0]), 11);
  assert.equal(approvedHours(s), 24);
});
test("duplicate reservation is rejected", () => {
  const s = reserved();
  assert.throws(
    () => transition(s, { type: "reserve", taskId: s.tasks[0].id }),
    /already/,
  );
});
test("full shift cannot be reserved", () => {
  const s = seed();
  s.tasks[1].capacity = 1;
  s.tasks[1].date = "2099-01-01";
  assert.throws(
    () => transition(s, { type: "reserve", taskId: "pantry" }),
    /full/,
  );
});
test("grade restriction is enforced", () => {
  const s = seed();
  s.profile.grade = 10;
  s.tasks[3].date = "2099-01-01";
  assert.throws(
    () => transition(s, { type: "reserve", taskId: "tutor" }),
    /grade/,
  );
});
test("archived shift cannot be reserved", () => {
  const s = seed();
  s.tasks[0].archived = true;
  assert.throws(
    () => transition(s, { type: "reserve", taskId: "langar" }),
    /not open/,
  );
});
test("before photo is required to start", () => {
  const s = reserved();
  assert.throws(
    () => transition(s, { type: "start", claimId: s.claims[0].id }),
    /before photo/,
  );
});
test("both photos are required for submission", () => {
  const s = started();
  assert.throws(
    () =>
      transition(s, {
        type: "finish",
        claimId: s.claims[0].id,
        hours: 2,
        reflection: "This reflection is long enough for a valid submission.",
        checks: s.tasks[0].checklist,
      }),
    /photos/,
  );
});
test("overclaimed hours cannot be submitted", () => {
  let s = started();
  s = transition(s, {
    type: "evidence",
    claimId: s.claims[0].id,
    phase: "after",
    evidence: illustrationEvidence("After"),
  });
  assert.throws(
    () =>
      transition(s, {
        type: "finish",
        claimId: s.claims[0].id,
        hours: 4,
        reflection: "This reflection is long enough for a valid submission.",
        checks: s.tasks[0].checklist,
      }),
    /Requested hours/,
  );
});
test("checklist must be completed", () => {
  let s = started();
  s = transition(s, {
    type: "evidence",
    claimId: s.claims[0].id,
    phase: "after",
    evidence: illustrationEvidence("After"),
  });
  assert.throws(
    () =>
      transition(s, {
        type: "finish",
        claimId: s.claims[0].id,
        hours: 2,
        reflection: "This reflection is long enough for a valid submission.",
        checks: [],
      }),
    /checklist/,
  );
});
test("submission does not grant hours before committee review", () => {
  const s = submitted();
  assert.equal(s.claims[0].status, "awaiting_review");
  assert.equal(approvedHours(s), 24);
});
test("approval credits only the verified amount", () => {
  const s = submitted();
  const r = transition(s, {
    type: "review",
    claimId: s.claims[0].id,
    decision: "approved",
    hours: 1.5,
    note: "Supervisor confirmed ninety minutes.",
  });
  assert.equal(approvedHours(r), 25.5);
  assert.equal(r.claims[0].reviewedBy, "Demo committee");
});
test("duplicate approval cannot double count hours", () => {
  let s = submitted();
  s = transition(s, {
    type: "review",
    claimId: s.claims[0].id,
    decision: "approved",
    hours: 2,
    note: "",
  });
  assert.throws(
    () =>
      transition(s, {
        type: "review",
        claimId: s.claims[0].id,
        decision: "approved",
        hours: 2,
        note: "",
      }),
    /already been reviewed/,
  );
  assert.equal(approvedHours(s), 26);
});
test("approval cannot exceed requested hours", () => {
  const s = submitted();
  assert.throws(
    () =>
      transition(s, {
        type: "review",
        claimId: s.claims[0].id,
        decision: "approved",
        hours: 3,
        note: "",
      }),
    /up to 2/,
  );
});
test("changes requested require explanation and no credit", () => {
  const s = submitted();
  assert.throws(
    () =>
      transition(s, {
        type: "review",
        claimId: s.claims[0].id,
        decision: "changes_requested",
        hours: 0,
        note: "",
      }),
    /explain/,
  );
  const r = transition(s, {
    type: "review",
    claimId: s.claims[0].id,
    decision: "changes_requested",
    hours: 0,
    note: "Please show the cleaned serving station.",
  });
  assert.equal(approvedHours(r), 24);
});
test("requested changes can be resubmitted and approved", () => {
  let s = submitted();
  const cid = s.claims[0].id;
  s = transition(s, {
    type: "review",
    claimId: cid,
    decision: "changes_requested",
    hours: 0,
    note: "Please add a little more detail.",
  });
  s = transition(s, {
    type: "finish",
    claimId: cid,
    hours: 2,
    reflection:
      "I prepared the station, served meals and cleaned the hall with my supervisor.",
    checks: s.tasks[0].checklist,
  });
  s = transition(s, {
    type: "review",
    claimId: cid,
    decision: "approved",
    hours: 2,
    note: "Verified.",
  });
  assert.equal(approvedHours(s), 26);
});
test("approved evidence is immutable", () => {
  let s = submitted();
  s = transition(s, {
    type: "review",
    claimId: s.claims[0].id,
    decision: "approved",
    hours: 2,
    note: "",
  });
  assert.throws(
    () =>
      transition(s, {
        type: "evidence",
        claimId: s.claims[0].id,
        phase: "before",
        evidence: illustrationEvidence("Replacement"),
      }),
    /locked/,
  );
});
test("cancelled reservation releases capacity", () => {
  const s = reserved();
  const r = transition(s, { type: "cancel", claimId: s.claims[0].id });
  assert.equal(seatsLeft(r, r.tasks[0]), 12);
  assert.equal(approvedHours(r), 24);
});
test("editing a reserved shift requires duplication", () => {
  const s = reserved();
  assert.throws(
    () => transition(s, { type: "task", task: { ...s.tasks[0], hours: 4 } }),
    /reservations/,
  );
});
test("archive retains approved logbook history", () => {
  const s = seed();
  const r = transition(s, { type: "archive", taskId: "langar" });
  assert.equal(r.claims.length, s.claims.length);
  assert.equal(approvedHours(r), 24);
});
test("mutation adds activity without mutating original", () => {
  const s = seed();
  const r = transition(s, { type: "save", taskId: "langar" });
  assert.equal(s.audit.length, 0);
  assert.equal(r.audit.length, 1);
  assert.equal(r.saved.includes("langar"), true);
  assert.equal(s.saved.includes("langar"), false);
});
