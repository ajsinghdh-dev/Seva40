import type { Claim, Store, Task } from "./model";
import { approvedHours, viewerId } from "./model";
export function download(
  content: string | Uint8Array,
  filename: string,
  type: string,
) {
  const b = new Blob(
    [typeof content === "string" ? content : Uint8Array.from(content)],
    { type },
  );
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}
const safe = (s: unknown) => {
  let v = String(s ?? "");
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return '"' + v.replaceAll('"', '""') + '"';
};
export function exportCSV(s: Store) {
  const rows = s.claims.filter(
    (c) => c.studentId === viewerId(s) && c.status === "approved",
  );
  download(
    [
      [
        "Student",
        "School",
        "Grade",
        "Activity",
        "Date",
        "Location",
        "Supervisor",
        "Approved hours",
        "Reviewed by",
        "Review date",
      ],
      ...rows.map((c) => [
        s.profile.name,
        s.profile.school,
        s.profile.grade,
        c.taskTitle,
        c.taskDate,
        c.location,
        c.supervisor,
        c.approvedHours,
        c.reviewedBy,
        c.reviewedAt,
      ]),
    ]
      .map((r) => r.map(safe).join(","))
      .join("\r\n"),
    "seva40-approved-logbook.csv",
    "text/csv;charset=utf-8",
  );
}
export function exportICS(tasks: Task[]) {
  const esc = (s: string) =>
    s
      .replaceAll("\\", "\\\\")
      .replaceAll("\n", "\\n")
      .replaceAll(",", "\\,")
      .replaceAll(";", "\\;");
  const events = tasks.map((t) => {
    const start =
      t.date.replaceAll("-", "") + "T" + t.time.replace(":", "") + "00";
    const endDate = new Date(`${t.date}T${t.time}:00Z`);
    endDate.setUTCMinutes(endDate.getUTCMinutes() + t.hours * 60);
    const end = endDate
      .toISOString()
      .replaceAll("-", "")
      .replaceAll(":", "")
      .slice(0, 15);
    return [
      "BEGIN:VEVENT",
      `UID:${t.id}@seva40.local`,
      `DTSTAMP:${new Date().toISOString().replaceAll("-", "").replaceAll(":", "").slice(0, 15)}Z`,
      `DTSTART;TZID=America/Toronto:${start}`,
      `DTEND;TZID=America/Toronto:${end}`,
      `SUMMARY:${esc(t.title)}`,
      `LOCATION:${esc(t.location)}`,
      `DESCRIPTION:${esc(t.description + "\nSupervisor: " + t.supervisor)}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  download(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Seva 40//Community Service//EN",
      "CALSCALE:GREGORIAN",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n"),
    "seva40-shifts.ics",
    "text/calendar",
  );
}
const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, " ");
export async function exportPDF(s: Store, single?: Claim) {
  if (single && single.studentId !== viewerId(s)) {
    const member = s.members?.find((m) => m.id === single.studentId);
    s = {
      ...s,
      viewerId: single.studentId,
      profile: {
        ...s.profile,
        name: member?.name ?? single.studentName,
        school: member?.school ?? "",
        grade: member?.grade ?? 0,
        goal: 40,
      },
    };
  }
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(
    single
      ? "Seva 40 - Community service record"
      : "Seva 40 - Community service logbook",
  );
  doc.setAuthor("Seva 40");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.12, 0.13),
    muted = rgb(0.42, 0.42, 0.44),
    orange = rgb(1, 0.35, 0.1);
  let page = doc.addPage([595, 842]),
    y = 780;
  const text = (
    value: string,
    x: number,
    baseline: number,
    size = 10,
    strong = false,
    color = ink,
  ) =>
    page.drawText(ascii(value), {
      x,
      y: baseline,
      size,
      font: strong ? bold : font,
      color,
    });
  const wrap = (value: string, width = 460, size = 9) => {
    const words = ascii(value).split(/\s+/),
      lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines;
  };
  const header = (continuation = false) => {
    text("SEVA 40", 44, 784, 24, true);
    text("COMMITTEE VERIFIED", 438, 793, 7, true, orange);
    page.drawLine({
      start: { x: 44, y: 765 },
      end: { x: 551, y: 765 },
      thickness: 1.5,
      color: orange,
    });
    text(
      single ? "Community service record" : "Community service logbook",
      44,
      736,
      17,
      true,
    );
    text(
      "COMMITTEE SERVICE RECORD - SUBJECT TO SCHOOL ACCEPTANCE",
      44,
      716,
      7,
      false,
      muted,
    );
    y = 690;
    if (continuation) {
      text(
        `${s.profile.name} | Grade ${s.profile.grade} | Continued`,
        44,
        y,
        10,
      );
      y -= 30;
    }
  };
  const newPage = () => {
    page = doc.addPage([595, 842]);
    header(true);
  };
  header();
  text("STUDENT", 44, y, 7, true, muted);
  text(s.profile.name, 44, y - 20, 13, true);
  text(
    s.profile.grade ? `Grade ${s.profile.grade}` : "Grade not recorded",
    44,
    y - 40,
    10,
    false,
    muted,
  );
  for (const [i, line] of wrap(s.profile.school, 260, 10).entries())
    text(line, 44, y - 57 - i * 14, 10, false, muted);
  text("APPROVED HOURS", 386, y, 7, true, muted);
  text(
    String(single ? single.approvedHours : approvedHours(s)),
    386,
    y - 40,
    36,
    true,
    orange,
  );
  text(`Goal: ${s.profile.goal} hours`, 386, y - 59, 9, false, muted);
  y -= Math.max(95, wrap(s.profile.school, 260, 10).length * 14 + 80);
  const claims = single
    ? [single]
    : s.claims.filter(
        (c) => c.studentId === viewerId(s) && c.status === "approved",
      );
  for (const c of claims) {
    const titleLines = wrap(c.taskTitle, 345, 12);
    const details = [
      `Date: ${c.taskDate} | Location: ${c.location}`,
      `Supervisor: ${c.supervisor}`,
      `Reviewed by: ${c.reviewedBy ?? "Unreviewed"} | Review date: ${(c.reviewedAt ?? "").slice(0, 10)}`,
      ...(c.reviewNote ? [`Review note: ${c.reviewNote}`] : []),
      ...(single && c.reflection ? [`Reflection: ${c.reflection}`] : []),
    ].flatMap((line) => wrap(line, 465, 9));
    const height = Math.max(
      106,
      44 + titleLines.length * 16 + details.length * 14,
    );
    if (y - height < 104) newPage();
    page.drawRectangle({
      x: 44,
      y: y - height + 10,
      width: 507,
      height: height - 10,
      color: rgb(0.97, 0.97, 0.965),
      borderColor: rgb(0.89, 0.89, 0.88),
      borderWidth: 0.5,
    });
    titleLines.forEach((line, i) => text(line, 58, y - 25 - i * 16, 12, true));
    text(`${c.approvedHours} hrs`, 483, y - 25, 11, true, orange);
    let baseline = y - 44 - titleLines.length * 16;
    for (const line of details) {
      text(line, 58, baseline, 9, false, muted);
      baseline -= 14;
    }
    y -= height + 9;
  }
  if (y < 165) newPage();
  const schoolLines = wrap(
    "School acceptance and any required signatures must be confirmed separately.",
    505,
    9,
  );
  schoolLines.forEach((line) => {
    text(line, 44, y - 13, 9, false, muted);
    y -= 14;
  });
  y -= 23;
  text("Student signature: ____________________", 44, y, 9);
  text("Parent/guardian: ____________________", 308, y, 9);
  y -= 27;
  text("Supervisor signature: ____________________", 44, y, 9);
  text("Date: ____________________", 308, y, 9);
  const pages = doc.getPages();
  pages.forEach((p, index) => {
    p.drawLine({
      start: { x: 44, y: 50 },
      end: { x: 551, y: 50 },
      thickness: 0.5,
      color: rgb(0.84, 0.84, 0.84),
    });
    p.drawText(
      `SEVA 40 | Committee records | Generated ${new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" })}`,
      { x: 44, y: 34, size: 7, font, color: muted },
    );
    p.drawText(`${index + 1} / ${pages.length}`, {
      x: 530,
      y: 34,
      size: 7,
      font,
      color: muted,
    });
  });
  download(
    await doc.save(),
    single ? "seva40-service-record.pdf" : "seva40-logbook.pdf",
    "application/pdf",
  );
}
