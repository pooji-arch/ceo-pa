import { PrismaClient, KaizenStatus, KaizenApproval, MilestoneStatus, YesNoNA, TaskStatus, Priority, ApprovalStatus, MeetingLinkStatus, MeetingStatus, DietStatus, OtherTaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Dev-only accounts for local/staging seeding. Not used in production seeding.
const DEV_PASSWORD = "123456";

const DEPARTMENTS = [
  { name: "Marketing", code: "MK" }, { name: "Management", code: "MM" }, { name: "Sales Offline", code: "S-OFF" },
  { name: "Sales Online", code: "S-ON" }, { name: "Medical Team L1", code: "OP-L1" }, { name: "Medical Team L2", code: "OP-L2" },
  { name: "Student Support Team", code: "OP-CS" }, { name: "Technology", code: "TECH" }, { name: "HR", code: "HR" },
  { name: "Admin", code: "AD" }, { name: "NSI", code: "NSI" }, { name: "TFS", code: "TFS" }, { name: "Food Master", code: "FM" },
  { name: "Content Creating", code: "CC" }, { name: "Accounts", code: "AC" }, { name: "Physio", code: "PHY" },
  { name: "Dental", code: "Den" }, { name: "FFC", code: "FFC" }, { name: "R&D", code: "R&D" },
];

function d(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function buildMonthWeeks(year: number, monthIndex: number) {
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MABR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const ORD = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const groups: Date[][] = [];
  let cur: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const dow = date.getDay();
    if (dow === 0) { if (cur.length) groups.push(cur); cur = []; continue; }
    if (dow === 1 && cur.length) { groups.push(cur); cur = []; }
    cur.push(date);
    if (dow === 6) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);

  return groups.map((g, i) => {
    const first = g[0], last = g[g.length - 1];
    const range = first.getDate() === last.getDate()
      ? `${String(first.getDate()).padStart(2, "0")} ${MABR[monthIndex]}`
      : `${String(first.getDate()).padStart(2, "0")} - ${String(last.getDate()).padStart(2, "0")} ${MABR[monthIndex]}`;
    return {
      monthLabel,
      weekLabel: `${MABR[monthIndex]} ${ORD[i] || `${i + 1}th`} Week`,
      rangeLabel: range,
      days: g.map((day) => ({
        date: new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())),
        label: DOW[day.getDay()],
        hours: 0,
        notes: "",
      })),
    };
  });
}

async function main() {
  console.log("Seeding CEO PA database...");

  // --- Dev accounts --------------------------------------------------------
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: "ceo@gmail.com" },
    update: {},
    create: { email: "ceo@gmail.com", passwordHash, name: "CEO (Dev)", role: "CEO" },
  });
  const pa = await prisma.user.upsert({
    where: { email: "pa@gmail.com" },
    update: {},
    create: { email: "pa@gmail.com", passwordHash, name: "PA (Dev)", role: "PA" },
  });
  console.log(`Dev accounts ready — ceo@gmail.com / pa@gmail.com, password: ${DEV_PASSWORD}`);

  // --- Departments -----------------------------------------------------------
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept,
    });
  }

  // --- Appointments & visitor history ----------------------------------------
  await prisma.appointment.createMany({
    data: [
      { requester: "Anil Kapoor", dept: "Finance", purpose: "Q3 budget sign-off", date: d("2026-09-10"), time: "10:00", priority: Priority.High, approval: ApprovalStatus.Approved, meeting: MeetingLinkStatus.Scheduled },
      { requester: "Meera Iyer", dept: "HR", purpose: "New hire onboarding plan", date: d("2026-09-10"), time: "11:30", priority: Priority.Medium, approval: ApprovalStatus.Pending, meeting: MeetingLinkStatus.Pending },
      { requester: "Vendor — Siemens", dept: "External", purpose: "Equipment demo", date: d("2026-09-10"), time: "14:00", priority: Priority.Low, approval: ApprovalStatus.Pending, meeting: MeetingLinkStatus.Pending },
      { requester: "Rahul Singh", dept: "Sales", purpose: "Key account escalation", date: d("2026-09-11"), time: "09:30", priority: Priority.Critical, approval: ApprovalStatus.Approved, meeting: MeetingLinkStatus.Scheduled },
      { requester: "GM - Ops", dept: "Operations", purpose: "Plant audit findings review", date: d("2026-09-12"), time: "16:00", priority: Priority.High, approval: ApprovalStatus.Approved, meeting: MeetingLinkStatus.Scheduled },
      { requester: "Press / Media", dept: "External", purpose: "Interview request", date: d("2026-09-14"), time: "12:00", priority: Priority.Medium, approval: ApprovalStatus.Rejected, meeting: MeetingLinkStatus.Cancelled },
    ],
  });

  await prisma.visitorHistoryEntry.createMany({
    data: [
      { name: "Suresh Iyer", date: d("2026-08-28"), purpose: "Vendor demo", outcome: "Proceeded to contract review" },
      { name: "Neha Kapoor", date: d("2026-08-30"), purpose: "Media interview", outcome: "Completed" },
    ],
  });

  // --- Tasks -------------------------------------------------------------------
  await prisma.task.createMany({
    data: [
      { title: "Finalize Diwali CSR budget", owner: "GM - CSR", dept: "CSR", priority: Priority.High, status: TaskStatus.InProgress, due: d("2026-09-09"), followup: d("2026-09-11"), remarks: "Draft shared, awaiting CEO input" },
      { title: "Vendor contract renewal — logistics", owner: "AGM - SCM", dept: "Supply Chain", priority: Priority.Medium, status: TaskStatus.New, due: d("2026-09-16"), followup: d("2026-09-14"), remarks: "" },
      { title: "Prepare town-hall talking points", owner: "PA", dept: "CEO Office", priority: Priority.Critical, status: TaskStatus.InProgress, due: d("2026-09-09"), followup: d("2026-09-09"), remarks: "Draft v2 in review" },
      { title: "Safety compliance certificate renewal", owner: "GM - Plant", dept: "Operations", priority: Priority.High, status: TaskStatus.Blocked, due: d("2026-09-08"), followup: d("2026-09-10"), remarks: "Awaiting external inspector" },
      { title: "Annual appraisal cycle sign-off", owner: "GM - HR", dept: "HR", priority: Priority.Medium, status: TaskStatus.Postponed, due: d("2026-09-05"), followup: d("2026-09-20"), remarks: "Postponed — CEO travel" },
    ],
  });

  // --- Meetings & action points --------------------------------------------
  const boardMeeting = await prisma.meeting.create({
    data: { purpose: "Board pre-read alignment", participants: "CFO, Company Secretary", date: d("2026-09-11"), time: "09:00", agenda: "Q3 numbers, board deck review", status: MeetingStatus.Scheduled },
  });
  await prisma.meeting.create({
    data: { purpose: "Kaizen Steering Committee", participants: "PA, Champions (4)", date: d("2026-09-13"), time: "11:00", agenda: "Milestone review, new idea pipeline", status: MeetingStatus.Scheduled },
  });
  await prisma.actionPoint.create({
    data: { meetingId: boardMeeting.id, point: "Circulate revised board deck", owner: "CFO", due: d("2026-09-12"), status: "New" },
  });

  // --- Daily activities, diet queries, other tasks -----------------------
  await prisma.dailyActivity.createMany({
    data: [
      { date: d("2026-09-09"), type: "Meeting", desc: "Reviewed CSR budget with GM-CSR", outcome: "Approved with 5% trim" },
      { date: d("2026-09-09"), type: "Decision", desc: "Approved vendor shortlist for logistics", outcome: "3 vendors shortlisted" },
    ],
  });

  await prisma.dietQuery.create({
    data: { query: "Low-sodium meal plan request", requester: "CEO", responsible: "PA", date: d("2026-09-08"), followup: d("2026-09-12"), status: DietStatus.InProgress, remarks: "Coordinating with nutritionist" },
  });

  await prisma.otherTask.create({
    data: { title: "Renew club membership", owner: "PA", due: d("2026-09-20"), status: OtherTaskStatus.New },
  });

  // --- Notifications & audit log --------------------------------------------
  await prisma.appNotification.createMany({
    data: [
      { userId: pa.id, icon: "⚡", text: 'Kaizen milestone "Paperless visitor pass system" marked Completed.', time: "3 hrs ago", unread: true },
      { userId: pa.id, icon: "📅", text: "Appointment with Rahul Singh confirmed for tomorrow.", time: "5 hrs ago", unread: true },
      { userId: pa.id, icon: "👥", text: 'Meeting "Kaizen Steering Committee" confirmed for 13 Sep, 11:00.', time: "Yesterday", unread: true },
    ],
  });

  await prisma.auditEntry.createMany({
    data: [
      { ts: new Date("2026-09-09T18:10:00.000Z"), user: "PA", action: "Created task TSK-305" },
      { ts: new Date("2026-08-08T16:30:00.000Z"), user: "Priya Nair", action: "Updated Kaizen milestone MS-04 to Completed" },
    ],
  });

  // --- Day notes ---------------------------------------------------------------
  await prisma.dayNote.create({
    data: { date: d("2026-09-10"), planned: "Review Q3 budget deck with CFO", actuals: ["Handled an urgent vendor escalation call instead"] },
  });

  // --- Kaizen ideas, milestones, contributors --------------------------------
  const kaizenSeed = [
    { key: "KZ-01", dept: "Admin", deptCode: "AD", date: "2026-08-20", title: "Reduce visitor check-in time by introducing a self-service kiosk at reception.", champion: "Priya Nair", executedBy: ["Priya Nair", "IT Team"], impactDept: "Admin", approval: KaizenApproval.Approved, status: KaizenStatus.UnderProcess, projectEndDate: "2026-09-30", impact: "Reduces visitor wait time", impactTimeline: "2 weeks", impactStudy: "Kiosk hardware installed, staff training in progress", addToEffort: YesNoNA.Yes, progress: 65,
      contributors: [{ name: "Priya Nair", idea: 1, execution: 1, ontime: 0, impact: 0.5 }, { name: "IT Team", idea: 0, execution: 1, ontime: 0, impact: 0.5 }] },
    { key: "KZ-02", dept: "Accounts", deptCode: "AC", date: "2026-08-25", title: "Digitize the expense approval flow to remove paper forms.", champion: "Arjun Rao", executedBy: ["Arjun Rao", "Finance Team"], impactDept: "Accounts", approval: KaizenApproval.Hold, status: KaizenStatus.UnderProcess, projectEndDate: "2026-10-05", impact: "Faster reimbursement cycle", impactTimeline: "3 weeks", impactStudy: "IT resourcing constraint pushed the rollout out by 10 days", addToEffort: YesNoNA.Yes, progress: 40, contributors: [] },
    { key: "KZ-03", dept: "Technology", deptCode: "TECH", date: "2026-09-01", title: "Standardize meeting room booking through a shared calendar tool.", champion: "Divya Menon", executedBy: [], impactDept: "", approval: KaizenApproval.Hold, status: KaizenStatus.New, projectEndDate: null, impact: "", impactTimeline: "", impactStudy: "", addToEffort: YesNoNA.Unset, progress: 10, contributors: [] },
    { key: "KZ-04", dept: "Technology", deptCode: "TECH", date: "2026-08-10", title: "Cut plant energy wastage by 10% through smarter HVAC scheduling.", champion: "Suresh Pillai", executedBy: ["Suresh Pillai", "Facilities Team"], impactDept: "Technology", approval: KaizenApproval.Approved, status: KaizenStatus.UnderProcess, projectEndDate: "2026-09-25", impact: "Cuts plant energy usage", impactTimeline: "1 month", impactStudy: "New schedule live, tracking meter readings weekly", addToEffort: YesNoNA.Yes, progress: 78,
      contributors: [{ name: "Suresh Pillai", idea: 1, execution: 1, ontime: 0, impact: 0.5 }, { name: "Facilities Team", idea: 0, execution: 1, ontime: 0, impact: 0.5 }] },
    { key: "KZ-05", dept: "Admin", deptCode: "AD", date: "2026-08-01", title: "Replace paper visitor passes with a paperless QR-based system.", champion: "Priya Nair", executedBy: ["Priya Nair", "Security Team"], impactDept: "Admin", approval: KaizenApproval.Approved, status: KaizenStatus.Completed, projectEndDate: "2026-08-30", impact: "Removes paper wastage, faster gate entry", impactTimeline: "Immediate", impactResult: "Zero paper passes issued since rollout", completionMonth: "August", scoringStatus: "Done", impactStudy: "Rolled out to main gate, positive guard and visitor feedback", yesNo: YesNoNA.Yes, addToEffort: YesNoNA.Yes, progress: 100,
      contributors: [{ name: "Priya Nair", idea: 1, execution: 1, ontime: 0.5, impact: 0.5 }, { name: "Security Team", idea: 0, execution: 1, ontime: 0.5, impact: 0.5 }] },
    { key: "KZ-06", dept: "Accounts", deptCode: "AC", date: "2026-09-05", title: "Speed up purchase order turnaround time.", champion: "Arjun Rao", executedBy: [], impactDept: "", approval: KaizenApproval.Hold, status: KaizenStatus.New, projectEndDate: null, impact: "", impactTimeline: "", impactStudy: "", addToEffort: YesNoNA.Unset, progress: 5, contributors: [] },
  ];

  const kaizenIdMap = new Map<string, string>();
  for (const k of kaizenSeed) {
    const created = await prisma.kaizenIdea.create({
      data: {
        dept: k.dept, deptCode: k.deptCode, date: d(k.date), title: k.title, champion: k.champion,
        executedBy: k.executedBy, impactDept: k.impactDept, approval: k.approval, status: k.status,
        projectEndDate: k.projectEndDate ? d(k.projectEndDate) : null, impact: k.impact, impactTimeline: k.impactTimeline,
        impactResult: k.impactResult ?? "-", completionMonth: k.completionMonth ?? "-", scoringStatus: k.scoringStatus ?? "-",
        impactStudy: k.impactStudy, yesNo: k.yesNo ?? YesNoNA.Unset, addToEffort: k.addToEffort, progress: k.progress,
        contributors: { create: k.contributors },
      },
    });
    kaizenIdMap.set(k.key, created.id);
  }

  const milestoneSeed = [
    { kaizenKey: "KZ-01", title: "Install self check-in kiosk hardware at reception", startDate: "2026-08-22", endDate: "2026-09-20", secondEndDate: null, completedDate: null, status: MilestoneStatus.NA },
    { kaizenKey: "KZ-02", title: "Roll out digital expense form in the finance portal", startDate: "2026-08-28", endDate: "2026-09-18", secondEndDate: "2026-09-28", completedDate: null, status: MilestoneStatus.OverdueCompletion },
    { kaizenKey: "KZ-04", title: "Retune HVAC scheduling for off-peak hours", startDate: "2026-08-12", endDate: "2026-09-12", secondEndDate: null, completedDate: null, status: MilestoneStatus.NA },
    { kaizenKey: "KZ-05", title: "Roll out QR-based visitor passes at the main gate", startDate: "2026-08-03", endDate: "2026-08-28", secondEndDate: null, completedDate: "2026-08-27", status: MilestoneStatus.OnTimeCompletion },
  ];
  for (const m of milestoneSeed) {
    await prisma.milestone.create({
      data: {
        kaizenIdeaId: kaizenIdMap.get(m.kaizenKey)!,
        title: m.title,
        startDate: m.startDate ? d(m.startDate) : null,
        endDate: m.endDate ? d(m.endDate) : null,
        secondEndDate: m.secondEndDate ? d(m.secondEndDate) : null,
        completedDate: m.completedDate ? d(m.completedDate) : null,
        status: m.status,
      },
    });
  }

  // --- CEO Weekly Scoring — September 2026 --------------------------------
  const weeks = buildMonthWeeks(2026, 8);
  if (weeks[0]) weeks[0].days.forEach((day, i) => { day.hours = [8, 7, 6, 8, 7, 6][i] ?? 0; day.notes = "Regular office day"; });
  if (weeks[1]) weeks[1].days.forEach((day, i) => { day.hours = [9, 8, 7, 8, 7, 6][i] ?? 0; day.notes = "Board prep week"; });

  for (const week of weeks) {
    await prisma.weeklyScore.create({
      data: {
        monthLabel: week.monthLabel,
        weekLabel: week.weekLabel,
        rangeLabel: week.rangeLabel,
        days: { create: week.days },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
