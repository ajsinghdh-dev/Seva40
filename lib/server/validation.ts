import { z } from "zod";
const id = z.string().uuid();
const text = (max: number) => z.string().trim().min(1).max(max);
const category = z.enum(["Langar", "Community", "Environment", "Education"]);
const hours = z.number().finite().min(0.25).max(8).multipleOf(0.25);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
  );
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("reserve"), taskId: id }).strict(),
  z.object({ type: z.literal("save"), taskId: id }).strict(),
  z.object({ type: z.literal("cancel"), claimId: id }).strict(),
  z.object({ type: z.literal("start"), claimId: id }).strict(),
  z
    .object({
      type: z.literal("finish"),
      claimId: id,
      hours,
      reflection: text(1500).min(20),
      checks: z.array(text(150)).max(30),
    })
    .strict(),
  z
    .object({
      type: z.literal("review"),
      claimId: id,
      decision: z.enum(["approved", "changes_requested", "rejected"]),
      hours,
      note: z.string().trim().max(1500),
    })
    .strict(),
  z.object({ type: z.literal("archive"), taskId: id }).strict(),
  z
    .object({
      type: z.literal("task"),
      task: z
        .object({
          id,
          title: text(120),
          description: text(3000),
          category,
          date,
          time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          hours,
          capacity: z.number().int().min(1).max(500),
          location: text(200),
          supervisor: text(120),
          checklist: z.array(text(150)).min(1).max(30),
          grades: z
            .array(z.union([z.literal(10), z.literal(11), z.literal(12)]))
            .min(1)
            .max(3),
          published: z.boolean(),
          archived: z.boolean(),
          accessible: z.boolean(),
          supplies: z.string().max(1000),
          featured: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("notice"),
      notice: z
        .object({
          id,
          title: text(150),
          body: text(3000),
          date: z.string().datetime(),
          read: z.boolean(),
          audience: z.enum(["all", "students", "committee"]),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("read"),
      noticeId: id.optional(),
      audience: z.enum(["all", "students", "committee"]).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("profile"),
      profile: z
        .object({
          name: text(60),
          grade: z.union([z.literal(10), z.literal(11), z.literal(12)]),
          school: text(150),
          goal: z.number().int().min(40).max(500),
          targetDate: date,
          interests: z.array(category).max(4),
          guardianConsent: z.boolean(),
          schoolConfirmed: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("preferences"),
      preferences: z
        .object({
          compact: z.boolean(),
          reminders: z.boolean(),
          reducedMotion: z.boolean(),
          theme: z.enum(["dark", "light"]),
        })
        .strict(),
    })
    .strict(),
  z
    .object({ type: z.literal("goal"), hours: z.number().int().min(1).max(20) })
    .strict(),
]);
