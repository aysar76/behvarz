#!/usr/bin/env node
/**
 * Seed demo data for the Behvarz community (هم‌بهورز).
 *
 * This seed is written against PostgreSQL via the Prisma client used by the
 * app itself (PrismaPg adapter + generated client), so it runs against the
 * same database the application reads in production (Neon). It replaces the
 * old SQLite-only seed which could never write into the Postgres database.
 *
 * Idempotent & safe:
 *  - Users are matched by demo phone numbers before creation.
 *  - Every content row uses a deterministic id (or natural unique key such as
 *    `slug`/`name`), so re-running never duplicates data.
 *  - It only ever INSERTs missing rows; it never deletes or overwrites
 *    existing data (real users are never touched).
 *  - Nothing is logged except counts and demo phones — no DATABASE_URL,
 *    passwords or OTP codes.
 *
 *   pnpm db:seed
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? "";
if (!connectionString) {
  console.error("DATABASE_URL is not set; refusing to seed.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------------ helpers ---

type Delegate = {
  upsert: (args: unknown) => Promise<unknown>;
  createMany: (args: unknown) => Promise<{ count: number }>;
  count: (args?: unknown) => Promise<number>;
};

function model(name: string): Delegate {
  const delegateName = name.charAt(0).toLowerCase() + name.slice(1);
  return (prisma as unknown as Record<string, Delegate>)[delegateName];
}

/** Insert a single row by deterministic id. Existing rows are kept untouched. */
async function upsertRow(
  name: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await model(name).upsert({
    where: { id },
    update: {},
    create: { id, ...data },
  });
}

/** Insert a single row matched by a natural unique key (slug/phone/name). */
async function upsertBy(
  name: string,
  where: Record<string, unknown>,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await model(name).upsert({
    where,
    update: {},
    create: { id, ...data },
  });
}

/** Bulk-insert join rows; duplicates (any unique key) are skipped. */
async function createRows(
  name: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) return;
  await model(name).createMany({ data: rows, skipDuplicates: true });
}

const DAY = 86400000;
const HOUR = 3600000;
const nowMs = Date.now();
const ago = (days: number, hours = 0) =>
  new Date(nowMs - days * DAY - hours * HOUR);
const ahead = (days: number) => new Date(nowMs + days * DAY);

// ---------------------------------------------------------------- users -----

const demoUsers = [
  {
    phone: "09120000101",
    role: "admin",
    membershipStatus: "verified",
    displayName: "امید رستمی",
    province: "تهران",
    city: "تهران",
    workYears: "12",
    bio: "بهورز خانه بهداشت با بیش از ۱۲ سال سابقه؛ علاقه‌مند به ارتقای سلامت روستاها و مستندسازی تجربه‌های میدانی.",
  },
  {
    phone: "09120000102",
    role: "mentor",
    membershipStatus: "verified",
    displayName: "لیلا صادقی",
    province: "فارس",
    city: "شیراز",
    workYears: "9",
    bio: "منتور آموزش‌دهنده بهورزان؛ تمرکز بر آموزش همگانی و توانمندسازی جامعه.",
  },
  {
    phone: "09120000103",
    role: "verified_member",
    membershipStatus: "verified",
    displayName: "بهرام کاظمی",
    province: "اصفهان",
    city: "اصفهان",
    workYears: "7",
    bio: "بهورز جوان؛ علاقه‌مند به مدیریت پرونده سلامت و فرآیندهای اداری بهتر.",
  },
  {
    phone: "09120000104",
    role: "circle_facilitator",
    membershipStatus: "verified",
    displayName: "نرگس عباسی",
    province: "خراسان رضوی",
    city: "مشهد",
    workYears: "10",
    bio: "تسهیل‌گر حلقه‌های همیار؛ باور دارم هم‌آموزی در گروه‌های کوچک راهگشاست.",
  },
  {
    phone: "09120000105",
    role: "verified_member",
    membershipStatus: "verified",
    displayName: "سعید جعفری",
    province: "آذربایجان شرقی",
    city: "تبریز",
    workYears: "6",
    bio: "بهورز؛ فعال در آموزش دیابت و غربالگری فشار خون در روستاهای دور.",
  },
  {
    phone: "09120000106",
    role: "member",
    membershipStatus: "verified",
    displayName: "مینا رحیمی",
    province: "کرمان",
    city: "کرمان",
    workYears: "4",
    bio: "بهورز تازه‌کار؛ مشتاق یادگیری از تجربه‌های همکاران.",
  },
  {
    phone: "09120000107",
    role: "member",
    membershipStatus: "verified",
    displayName: "حمید شریفی",
    province: "گیلان",
    city: "رشت",
    workYears: "8",
    bio: "بهورز؛ درگیر آموزش سلامت و ارتباط با خانواده‌ها در مناطق کوهستانی.",
  },
  {
    phone: "09120000108",
    role: "content_moderator",
    membershipStatus: "verified",
    displayName: "پروین ملکی",
    province: "یزد",
    city: "یزد",
    workYears: "11",
    bio: "ناظر محتوای جامعه؛ همراه با تیم مدیریت محتوا برای سلامت گفتگوها.",
  },
  {
    phone: "09120000109",
    role: "member",
    membershipStatus: "none",
    displayName: "کاوه ابراهیمی",
    province: "خوزستان",
    city: "اهواز",
    workYears: "3",
    bio: "بهورز تازه استخدام؛ در انتظار تأیید عضویت رسمی.",
  },
  {
    phone: "09120000110",
    role: "member",
    membershipStatus: "none",
    displayName: "سارا نعمتی",
    province: "کرمانشاه",
    city: "کرمانشاه",
    workYears: "5",
    bio: "بهورز خانه بهداشت؛ علاقه‌مند به غربالگری و پیشگیری.",
  },
  {
    phone: "09120000111",
    role: "member",
    membershipStatus: "verified",
    displayName: "رضا مرادی",
    province: "هرمزگان",
    city: "بندرعباس",
    workYears: "6",
    bio: "بهورز مناطق ساحلی؛ تمرکز بر بهداشت محیط و آموزش خانواده‌ها درباره پسماند و آب سالم.",
  },
  {
    phone: "09120000112",
    role: "member",
    membershipStatus: "verified",
    displayName: "فاطمه برهانی",
    province: "سیستان و بلوچستان",
    city: "زاهدان",
    workYears: "4",
    bio: "بهورز فعال در مراقبت مادر و کودک و پیگیری مادران باردار در مناطق کم‌برخوردار.",
  },
  {
    phone: "09120000113",
    role: "verified_member",
    membershipStatus: "verified",
    displayName: "علی قاسمی",
    province: "مازندران",
    city: "ساری",
    workYears: "9",
    bio: "بهورز با سابقه در مراقبت از سالمندان و غربالگری فشار خون؛ علاقه‌مند به پایش منظم سلامت.",
  },
];

const demoPhones = demoUsers.map((u) => u.phone);

const skills = [
  "آموزش سلامت",
  "تغذیه",
  "بهداشت روان",
  "آمار و گزارش‌گیری",
  "بهداشت محیط",
  "بهداشت مادر و کودک",
  "سلامت سالمندان",
  "مدیریت دیابت و فشار خون",
];

const interests = [
  "همکاری شبکه",
  "آموزش شهروندی",
  "مستندسازی تجربه",
  "نوآوری میدانی",
];

async function ensureSkill(name: string): Promise<string> {
  const skill = await prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return skill.id;
}

async function ensureInterest(name: string): Promise<string> {
  const interest = await prisma.interest.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return interest.id;
}

async function ensureTag(name: string): Promise<string> {
  const tag = await prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return tag.id;
}

async function seedUsers(): Promise<Map<string, string>> {
  const skillIds = new Map<string, string>();
  for (const name of skills) skillIds.set(name, await ensureSkill(name));
  const interestIds = new Map<string, string>();
  for (const name of interests) {
    interestIds.set(name, await ensureInterest(name));
  }

  const userIds = new Map<string, string>();
  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i];
    const id = `seed-user-${String(i + 1).padStart(2, "0")}`;
    await upsertBy(
      "User",
      { phone: user.phone },
      id,
      {
        phone: user.phone,
        role: user.role,
        membershipStatus: user.membershipStatus,
        displayName: user.displayName,
        province: user.province,
        city: user.city,
        workYears: user.workYears,
        bio: user.bio,
        visibility: "public",
        onboardingCompleted: true,
        willingToHelp: true,
        allowDataContribution: true,
        accountStatus: "active",
        createdAt: ago(30),
        updatedAt: ago(1),
      },
    );
    userIds.set(user.phone, id);

    // one session per user so the pilot "session/return" metric counts them
    await upsertRow(
      "Session",
      `seed-session-${String(i + 1).padStart(2, "0")}`,
      {
        userId: id,
        tokenHash: randomBytes(32).toString("hex"),
        expiresAt: ahead(30),
        ip: "::1",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
        createdAt: ago(2),
      },
    );

    const s1 = skillIds.get(skills[i % skills.length])!;
    const s2 = skillIds.get(skills[(i + 3) % skills.length])!;
    const i1 = interestIds.get(interests[i % interests.length])!;
    const i2 = interestIds.get(interests[(i + 2) % interests.length])!;
    await createRows("UserSkill", [
      { userId: id, skillId: s1 },
      { userId: id, skillId: s2 },
    ]);
    await createRows("UserInterest", [
      { userId: id, interestId: i1 },
      { userId: id, interestId: i2 },
    ]);
  }

  // membership requests so the admin memberships page is active
  for (const phone of ["09120000109", "09120000110"]) {
    await upsertRow("MembershipRequest", `seed-mr-${phone}`, {
      userId: userIds.get(phone)!,
      status: "pending",
      note: "درخواست تأیید هویت حرفه‌ای و عضویت رسمی",
      createdAt: ago(3),
    });
  }
  await upsertRow("MembershipRequest", "seed-mr-verified", {
    userId: userIds.get("09120000103")!,
    status: "verified",
    reviewedBy: userIds.get("09120000101")!,
    reviewedAt: ago(20),
    createdAt: ago(25),
  });

  return userIds;
}

// --------------------------------------------------------------- problems ----

type SeedProblem = {
  id: string;
  author: string;
  title: string;
  description: string;
  context?: string;
  barrierType: string;
  actionsTaken?: string;
  expectedOutcome?: string;
  urgency: string;
  status: string;
  tags: string[];
  createdAt: Date;
  solved?: boolean;
  isDraft?: boolean;
  conclusion?: string;
  resultOutcome?: string;
  needsReview?: boolean;
};

const problemDefs: SeedProblem[] = [
  {
    id: "seed-problem-01",
    author: "09120000106",
    title: "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت",
    description:
      "هر ماه فرم‌های کاغذی غربالگری فشار خون دیر به دستمان می‌رسد و مجبور می‌شویم چند بار ثبت کنیم. دنبال راهکاری برای مدیریت بهتر فرم‌ها هستم.",
    context: "خانه بهداشت روستای با ۶۰۰ نفر جمعیت تحت پوشش",
    barrierType: "resources",
    actionsTaken: "دو بار با واحد آمار مکاتبه کرده‌ام ولی مشکل تکرار می‌شود.",
    expectedOutcome: "ثبت یک‌باره و بدون نیاز به فرم کاغذی",
    urgency: "medium",
    status: "open",
    tags: ["غربالگری", "تجهیزات"],
    createdAt: ago(2, 3),
  },
  {
    id: "seed-problem-02",
    author: "09120000105",
    title: "ساماندهی آموزش همگانی دیابت در روستاهای دورافتاده",
    description:
      "برای جلسات آموزش دیابت در دو روستای دور، هماهنگی و ابزار آموزشی درست نداریم و مشارکت مردم کم است.",
    context: "دو روستای دورافتاده با جمعیت سالمند بالا",
    barrierType: "knowledge",
    actionsTaken: "چند جلسه پراکنده برگزار کرده‌ام بدون برنامه واحد.",
    expectedOutcome: "بسته آموزشی ساده و زمان‌بندی منظم جلسات",
    urgency: "medium",
    status: "discussing",
    tags: ["آموزش همگانی", "دیابت"],
    createdAt: ago(6),
  },
  {
    id: "seed-problem-03",
    author: "09120000103",
    title: "راهکاری برای کاهش مراجعه‌های تکراری جهت تکمیل پرونده سلامت",
    description:
      "بسیاری از مراجعه‌ها فقط برای تکمیل اطلاعات پرونده است و وقت زیادی می‌گیرد. به دنبال فرآیندی هستم که اطلاعات در همان مراجعه اول کامل شود.",
    context: "پرونده الکترونیک سلامت در مرکز",
    barrierType: "process",
    actionsTaken: "چک‌لیست تکمیل اطلاعات طراحی کرده‌ام.",
    expectedOutcome: "کاهش مراجعه‌های تکراری به نصف",
    urgency: "high",
    status: "open",
    tags: ["مدیریت پرونده"],
    createdAt: ago(1),
  },
  {
    id: "seed-problem-04",
    author: "09120000102",
    title: "استقبال کم روستاییان از واکسیناسیون آنفلوانزا",
    description:
      "با وجود اطلاع‌رسانی، مشارکت در واکسیناسیون آنفلوانزا در روستا پایین است. چطور می‌توانم اعتماد و مشارکت را بالا ببرم؟",
    context: "گروه هدف سالمندان و مادران باردار",
    barrierType: "community",
    actionsTaken: "نصب پوستر و اعلام از بلندگوی مسجد",
    expectedOutcome: "افزایش پوشش واکسیناسیون",
    urgency: "medium",
    status: "solved",
    tags: ["واکسیناسیون", "آموزش همگانی"],
    createdAt: ago(14),
    solved: true,
    conclusion:
      "گفت‌وگوی چهره‌به‌چهره با خانواده‌ها به همراه پیگیری تلفنی باعث اعتماد و مشارکت بیشتر شد.",
    resultOutcome: "successful",
  },
  {
    id: "seed-problem-05",
    author: "09120000109",
    title: "خرابی ترازوی کودک در پایگاه سلامت",
    description:
      "ترازوی دیجیتال اندازه‌گیری کودک چند هفته است خراب است و اندازه‌گیری دقیق ممکن نیست.",
    context: "پایگاه سلامت شهری",
    barrierType: "equipment",
    actionsTaken: "به واحد تجهیزات گزارش داده‌ام.",
    expectedOutcome: "تعمیر یا جایگزینی ترازو",
    urgency: "high",
    status: "open",
    tags: ["تجهیزات"],
    createdAt: ago(3),
    needsReview: true,
  },
  {
    id: "seed-problem-06",
    author: "09120000107",
    title: "شیوه برخورد با خانواده‌های نگران درباره واکسن",
    description:
      "چند خانواده درباره عوارض واکسن نگران‌اند و مراجعه را به تعویق می‌اندازند. دنبال راهنمای گفتگو هستم.",
    context: "خانواده‌های دارای کودک زیر ۲ سال",
    barrierType: "knowledge",
    actionsTaken: "مطالب پراکنده از اینترنت جمع کرده‌ام.",
    expectedOutcome: "راهنمای عملی گفتگو با خانواده",
    urgency: "low",
    status: "discussing",
    tags: ["واکسیناسیون", "آموزش"],
    createdAt: ago(4),
  },
  {
    id: "seed-problem-07",
    author: "09120000104",
    title: "نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر",
    description:
      "برای پیگیری مادران باردار پرخطر، پروتکل مشخصی نداریم و هر بهورز به شیوه خود عمل می‌کند.",
    context: "مناطق محروم با دسترسی محدود",
    barrierType: "knowledge",
    actionsTaken: "تجربه‌های همکاران را جمع‌آوری می‌کنم.",
    expectedOutcome: "راهنمای مراقبت واحد و ساده",
    urgency: "medium",
    status: "solved",
    tags: ["بهداشت مادر و کودک"],
    createdAt: ago(18),
    solved: true,
    conclusion:
      "با جمع‌بندی تجربه همکاران، چک‌لیست پیگیری مادران پرخطر تدوین و در حلقه همیار به اشتراک گذاشته شد.",
    resultOutcome: "partial",
  },
  {
    id: "seed-problem-08",
    author: "09120000110",
    title: "هماهنگی بین بهورز و پزشک روستا در برنامه غربالگری",
    description:
      "در برنامه‌های غربالگری هماهنگی زمان‌بندی با پزشک روستا سخت است و چند بار برنامه لغو شده.",
    context: "برنامه غربالگری فشار خون و دیابت",
    barrierType: "process",
    actionsTaken: "زمان‌بندی از طریق پیامک انجام می‌شود.",
    expectedOutcome: "هماهنگی پایدار بین بهورز و پزشک",
    urgency: "low",
    status: "open",
    tags: ["غربالگری"],
    createdAt: ago(5),
  },
  {
    id: "seed-problem-09",
    author: "09120000101",
    title: "ساماندهی وسایل آموزش سلامت در خانه بهداشت",
    description:
      "وسایل و جزوات آموزشی پراکنده‌اند و پیدا کردن ابزار مناسب برای جلسه‌ها زمان می‌برد.",
    context: "اتاق آموزش خانه بهداشت",
    barrierType: "equipment",
    actionsTaken: "فهرست وسایل را تهیه می‌کنم.",
    expectedOutcome: "نظم و دسترسی آسان به وسایل آموزشی",
    urgency: "medium",
    status: "open",
    tags: ["تجهیزات", "آموزش"],
    createdAt: ago(1, 6),
  },
  {
    id: "seed-problem-10",
    author: "09120000106",
    title: "طرح باغچه سبزیجات برای آموزش تغذیه سالم",
    description:
      "می‌خواهم باغچه کوچکی در محوطه خانه بهداشت بزنم تا برای آموزش تغذیه سالم استفاده شود.",
    barrierType: "other",
    urgency: "low",
    status: "open",
    isDraft: true,
    tags: ["آموزش"],
    createdAt: ago(2),
  },
  {
    id: "seed-problem-11",
    author: "09120000101",
    title: "طرح راه‌اندازی ایستگاه سنجش سلامت محله",
    description:
      "پیشنهاد ایستگاه ماهانه سنجش سلامت در محله به دلیل نبود نیروی ثابت و هماهنگی ناکافی با پایگاه، به حالت تعلیق درآمد.",
    context: "محله شهری با جمعیت بالا",
    barrierType: "process",
    actionsTaken: "دو جلسه هماهنگی با پایگاه برگزار شد.",
    expectedOutcome: "اجرای ماهانه ایستگاه سنجش سلامت",
    urgency: "low",
    status: "archived",
    tags: ["پایش و ارزشیابی"],
    createdAt: ago(40),
  },
  {
    id: "seed-problem-12",
    author: "09120000112",
    title: "قطع مکرر آب آشامیدنی در خانه بهداشت روستا",
    description:
      "در سه ماه اخیر، آب خانه بهداشت روستا چند بار قطع شده و رعایت بهداشت و نگهداری واکسن دشوار شده است.",
    context: "خانه بهداشت روستای مرزی با ۴۵۰ نفر جمعیت",
    barrierType: "resources",
    actionsTaken: "به شبکه بهداشت گزارش داده‌ام و پیگیری شده است.",
    expectedOutcome: "تأمین پایدار آب و پیش‌بینی منابع جایگزین",
    urgency: "critical",
    status: "open",
    tags: ["بهداشت محیط"],
    createdAt: ago(2),
  },
];

async function seedProblems(users: Map<string, string>) {
  const problemIds = new Map<string, string>();

  for (const p of problemDefs) {
    await upsertRow(
      "Problem",
      p.id,
      {
        authorId: users.get(p.author)!,
        title: p.title,
        description: p.description,
        context: p.context ?? null,
        barrierType: p.barrierType,
        actionsTaken: p.actionsTaken ?? null,
        expectedOutcome: p.expectedOutcome ?? null,
        urgency: p.urgency,
        isAnonymous: false,
        status: p.status,
        isDraft: p.isDraft ?? false,
        needsReview: p.needsReview ?? false,
        moderation: "visible",
        conclusion: p.conclusion ?? null,
        resultOutcome: p.resultOutcome ?? null,
        publishedAt: p.isDraft ? null : p.createdAt,
        solvedAt: p.solved ? p.createdAt : null,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      },
    );
    problemIds.set(p.title, p.id);

    const tagIds = new Map<string, string>();
    for (const tag of p.tags) tagIds.set(tag, await ensureTag(tag));
    await createRows(
      "ProblemTag",
      p.tags.map((tag) => ({ problemId: p.id, tagId: tagIds.get(tag)! })),
    );

    // status history for the public status flow
    if (p.solved) {
      await upsertRow("ProblemStatusChange", `seed-ps-${p.id}-1`, {
        problemId: p.id,
        from: "open",
        to: "discussing",
        changedBy: users.get(p.author)!,
        createdAt: ago(12),
      });
      await upsertRow("ProblemStatusChange", `seed-ps-${p.id}-2`, {
        problemId: p.id,
        from: "discussing",
        to: "solved",
        changedBy: users.get(p.author)!,
        createdAt: p.createdAt,
      });
    } else if (p.status === "discussing") {
      await upsertRow("ProblemStatusChange", `seed-ps-${p.id}-1`, {
        problemId: p.id,
        from: "open",
        to: "discussing",
        changedBy: users.get(p.author)!,
        createdAt: p.createdAt,
      });
    }
  }

  type SeedAnswer = {
    id: string;
    problem: string;
    author: string;
    body: string;
    selected?: boolean;
  };
  const answers: SeedAnswer[] = [
    {
      id: "seed-answer-01",
      problem: "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت",
      author: "09120000103",
      body: "ما همین مشکل را داشتیم؛ با تهیه فرم یکپارچه اکسل و چاپ ماهانه از مرکز، ثبت یک‌باره شد. می‌توانم نمونه را در اختیارتان بگذارم.",
    },
    {
      id: "seed-answer-02",
      problem: "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت",
      author: "09120000105",
      body: "پیشنهاد می‌کنم با واحد آمار، زمان تحویل فرم‌ها را در قرارداد ماهانه قید کنید تا دیرکرد کمتر شود.",
    },
    {
      id: "seed-answer-03",
      problem: "ساماندهی آموزش همگانی دیابت در روستاهای دورافتاده",
      author: "09120000102",
      body: "تجربه برگزاری جلسات کوتاه ۲۰ دقیقه‌ای همراه با نمونه‌های واقعی را در بانک تجربه ثبت کرده‌ام؛ می‌توانید اجرا کنید.",
    },
    {
      id: "seed-answer-04",
      problem: "استقبال کم روستاییان از واکسیناسیون آنفلوانزا",
      author: "09120000107",
      body: "با پیگیری تلفنی خانوارها و گفت‌وگوی چهره‌به‌چهره در زمان حضور در خانه بهداشت، پوشش به شکل محسوسی بالا رفت.",
      selected: true,
    },
    {
      id: "seed-answer-05",
      problem: "شیوه برخورد با خانواده‌های نگران درباره واکسن",
      author: "09120000102",
      body: "گفت‌وگوی آرام، شنیدن نگرانی بدون قضاوت، و ارائه آمار ساده از پوشش واکسیناسیون مؤثر است. جزوه گفتگو را می‌توانم بفرستم.",
    },
    {
      id: "seed-answer-06",
      problem: "نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر",
      author: "09120000105",
      body: "چک‌لیست پیگیری هفتگی و ثبت در پرونده، کمک زیادی کرد؛ تجربه کامل آن را در بانک تجربه منتشر کرده‌ام.",
      selected: true,
    },
    {
      id: "seed-answer-07",
      problem: "قطع مکرر آب آشامیدنی در خانه بهداشت روستا",
      author: "09120000101",
      body: "در منطقه ما با هماهنگی دهیاری و شبکه بهداشت، تانکر آب اضطراری برای روزهای قطعی پیش‌بینی شد و برنامه نگهداری واکسن را برای ساعت‌های بدون برق تنظیم کردیم.",
    },
  ];

  const answerIds = new Map<string, string>();
  for (const a of answers) {
    await upsertRow(
      "ProblemAnswer",
      a.id,
      {
        problemId: problemIds.get(a.problem)!,
        authorId: users.get(a.author)!,
        body: a.body,
        isClarificationRequest: false,
        isSelectedSolution: a.selected ?? false,
        moderation: "visible",
        needsReview: false,
        helpfulCount: 0,
        thanksCount: 0,
        createdAt: ago(3),
        updatedAt: ago(3),
      },
    );
    answerIds.set(`${a.problem}@${a.author}`, a.id);
    if (a.selected) {
      await prisma.problem.update({
        where: { id: problemIds.get(a.problem)! },
        data: { selectedAnswerId: a.id },
      });
    }
  }

  // helpful marks + thanks on answers
  await createRows("ProblemAnswerHelpful", [
    {
      answerId: answerIds.get(
        "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت@09120000103",
      )!,
      userId: users.get("09120000106")!,
      createdAt: ago(2),
    },
    {
      answerId: answerIds.get("استقبال کم روستاییان از واکسیناسیون آنفلوانزا@09120000107")!,
      userId: users.get("09120000102")!,
      createdAt: ago(13),
    },
    {
      answerId: answerIds.get("استقبال کم روستاییان از واکسیناسیون آنفلوانزا@09120000107")!,
      userId: users.get("09120000104")!,
      createdAt: ago(13),
    },
    {
      answerId: answerIds.get("نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر@09120000105")!,
      userId: users.get("09120000104")!,
      createdAt: ago(17),
    },
  ]);

  const answerThanks = [
    {
      id: "seed-thanks-answer-01",
      userId: "09120000106",
      targetType: "answer",
      targetId: "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت@09120000103",
      receivedBy: "09120000103",
    },
    {
      id: "seed-thanks-answer-02",
      userId: "09120000102",
      targetType: "answer",
      targetId: "استقبال کم روستاییان از واکسیناسیون آنفلوانزا@09120000107",
      receivedBy: "09120000107",
    },
  ];
  await createRows(
    "ProfessionalThanks",
    answerThanks.map((t) => ({
      id: t.id,
      userId: users.get(t.userId)!,
      targetType: t.targetType,
      targetId: answerIds.get(t.targetId)!,
      answerId: answerIds.get(t.targetId)!,
      receivedById: users.get(t.receivedBy)!,
      createdAt: ago(2),
    })),
  );

  return { problemIds, answerIds };
}

// ------------------------------------------------------------ experiences ----

type SeedExperience = {
  id: string;
  author: string;
  slug: string;
  title: string;
  situation?: string;
  conditions?: string;
  action?: string;
  resources?: string;
  challenges?: string;
  result?: string;
  lessons?: string;
  suggestion?: string;
  status: string;
  tags: string[];
  publishedAt?: Date;
  reviewedAt?: Date;
  createdAt?: Date;
  isDraft?: boolean;
  needsReview?: boolean;
  sourceProblemTitle?: string;
  referenceAnswerKey?: string;
};

const experienceDefs: SeedExperience[] = [
  {
    id: "seed-exp-01",
    author: "09120000103",
    slug: "checklist-sobhaneh-parvandeh-salamat",
    title: "چک‌لیست صبحگاهی پرونده سلامت؛ شروع منظم روز کاری",
    situation: "مراجعه‌های تکراری برای تکمیل پرونده وقت زیادی می‌گرفت.",
    conditions: "پرونده الکترونیک سلامت فعال در مرکز",
    action: "هر صبح پیش از شروع کار، چک‌لیست موارد ناقص را مرور و پیگیری می‌کردم.",
    resources: "چک‌لیست چاپی و یادآوری تلفنی",
    challenges: "ابتدا همکاران نسبت به کار اضافه مقاوم بودند.",
    result: "مراجعه‌های تکراری به نصف کاهش یافت و پرونده‌ها به‌روز ماند.",
    lessons: "پیگیری منظم بهتر از کار فشرده آخر ماه است.",
    suggestion: "چک‌لیست را به‌صورت مشترک در تیم تنظیم کنید.",
    status: "featured",
    publishedAt: ago(16),
    reviewedAt: ago(14),
    tags: ["مدیریت پرونده"],
    referenceAnswerKey: "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت@09120000103",
  },
  {
    id: "seed-exp-02",
    author: "09120000107",
    slug: "goftegoo-moaser-ba-khanevadehaye-negaran",
    title: "گفت‌وگوی مؤثر با خانواده‌های نگران درباره واکسن",
    situation: "چند خانواده مراجعه به واکسیناسیون را به تعویق می‌انداختند.",
    conditions: "خانواده‌های دارای کودک زیر ۲ سال",
    action: "جلسات کوتاه گفت‌وگو بدون قضاوت و با ارائه آمار ساده برگزار کردم.",
    resources: "جزوه آموزش سلامت تهیه‌شده توسط مرکز بهداشت",
    challenges: "برخی خانواده‌ها به منابع آنلاین غیرمعتبر استناد می‌کردند.",
    result: "پوشش واکسیناسیون در منطقه بهبود محسوسی یافت.",
    lessons: "شنیدن نگرانی‌ها پیش از دادن توصیه، کلید اعتماد است.",
    suggestion: "آمار محلی پوشش را در گفتگو نشان دهید.",
    status: "featured",
    publishedAt: ago(12),
    reviewedAt: ago(10),
    tags: ["واکسیناسیون", "آموزش"],
  },
  {
    id: "seed-exp-03",
    author: "09120000104",
    slug: "moraghebat-az-madaran-bardar-porkhatar",
    title: "مراقبت از مادران باردار پرخطر در مناطق محروم",
    situation: "پیگیری مادران پرخطر بدون پروتکل واحد انجام می‌شد.",
    conditions: "دسترسی محدود به مرکز تخصصی",
    action: "چک‌لیست پیگیری هفتگی و هماهنگی با خانه‌های بهداشت همجوار.",
    resources: "چک‌لیست مشترک و پیگیری تلفنی",
    challenges: "نبود وسیله نقلیه برای برخی روستاها",
    result: "کاهش موارد غیبت در پیگیری و ارجاع به‌موقع.",
    lessons: "هماهنگی بین همکاران مهم‌تر از ابزار است.",
    suggestion: "چک‌لیست را در حلقه همیار به اشتراک بگذارید.",
    status: "reviewed",
    publishedAt: ago(20),
    reviewedAt: ago(18),
    tags: ["بهداشت مادر و کودک"],
    sourceProblemTitle: "نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر",
    referenceAnswerKey: "نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر@09120000105",
  },
  {
    id: "seed-exp-04",
    author: "09120000102",
    slug: "jalesat-amoozesh-hamgani-diyabet",
    title: "برگزاری جلسه آموزش همگانی دیابت با بسته ساده",
    situation: "مشارکت پایین مردم در جلسات آموزش دیابت.",
    conditions: "دو روستای دورافتاده با جمعیت سالمند",
    action: "جلسات ۲۰ دقیقه‌ای با نمونه‌های واقعی و پرسش‌وپاسخ کوتاه.",
    resources: "بسته آموزشی ساده و پوستر",
    challenges: "تنظیم وقت جلسات با زمان حضور مردم",
    result: "حضور منظم‌تر و درخواست جلسات بعدی توسط مردم.",
    lessons: "جلسه کوتاه و کاربردی بهتر از سخنرانی طولانی است.",
    suggestion: "زمان جلسه را با نظر مردم تنظیم کنید.",
    status: "reviewed",
    publishedAt: ago(9),
    reviewedAt: ago(8),
    tags: ["دیابت", "آموزش همگانی"],
    sourceProblemTitle: "ساماندهی آموزش همگانی دیابت در روستاهای دورافتاده",
  },
  {
    id: "seed-exp-05",
    author: "09120000105",
    slug: "paygiri-telefoni-ba-darsar-e-takrari",
    title: "کاهش مراجعه‌های تکراری با پیگیری تلفنی",
    situation: "مراجعه‌های تکراری برای تکمیل اطلاعات پرونده.",
    conditions: "مرکز با پرونده الکترونیک",
    action: "پیگیری تلفنی موارد ناقص پیش از مراجعه حضوری.",
    resources: "لیست تماس و زمان مشخص روزانه",
    challenges: "برخی شماره‌ها به‌روز نبودند.",
    result: "کاهش چشمگیر مراجعه‌های تکراری.",
    lessons: "پیگیری تلفنی به‌صرفه‌تر از مراجعه حضوری است.",
    suggestion: "فهرست تماس را در ابتدای ماه به‌روز کنید.",
    status: "reviewed",
    publishedAt: ago(7),
    reviewedAt: ago(6),
    tags: ["مدیریت پرونده"],
  },
  {
    id: "seed-exp-06",
    author: "09120000101",
    slug: "barnamerizi-tozi-malzomat-dar-khaneh-behdasht",
    title: "برنامه‌ریزی توزیع ملزومات در خانه بهداشت",
    situation: "ملزومات به‌صورت نامنظم توزیع می‌شد.",
    action: "فهرست مصرف ماهانه تهیه و با واحد پشتیبانی هماهنگ شد.",
    result: "کمبود ملزومات ضروری در ماه‌های حساس کمتر شد.",
    status: "user_generated",
    publishedAt: ago(5),
    tags: ["تجهیزات"],
  },
  {
    id: "seed-exp-07",
    author: "09120000108",
    slug: "saman-dehi-otagh-amoozesh-salamat",
    title: "ساماندهی اتاق آموزش سلامت",
    situation: "وسایل آموزشی پراکنده و دسترسی سخت بود.",
    action: "قفسه‌بندی و برچسب‌گذاری وسایل بر اساس موضوع جلسات.",
    result: "آماده‌سازی جلسه‌ها سریع‌تر انجام می‌شود.",
    status: "user_generated",
    publishedAt: ago(4),
    tags: ["آموزش"],
  },
  {
    id: "seed-exp-08",
    author: "09120000106",
    slug: "payesh-ghad-vazn-kodakan-dar-madreseh",
    title: "پایش قد و وزن کودکان در مدرسه",
    situation: "دسترسی به کودکان در خانه دشوار بود.",
    action: "هماهنگی با مدرسه برای پایش منظم قد و وزن.",
    result: "پایش منظم و ارجاع موارد نیازمند پیگیری.",
    status: "under_review",
    publishedAt: ago(3),
    needsReview: true,
    tags: ["بهداشت مادر و کودک"],
  },
  {
    id: "seed-exp-09",
    author: "09120000102",
    slug: "draft-rosh-e-jadid-sabt-shekayat",
    title: "روش جدید ثبت و پیگیری شکایت‌های مراجعان",
    situation: "شکایت‌ها ثبت نمی‌شد و پیگیری وجود نداشت.",
    status: "user_generated",
    isDraft: true,
    createdAt: ago(2),
    tags: ["مدیریت پرونده"],
  },
  {
    id: "seed-exp-10",
    author: "09120000111",
    slug: "saman-dehi-def-pasmand-sahel",
    title: "ساماندهی دفع پسماند در روستاهای ساحلی",
    situation: "انباشت زباله در حاشیه روستای ساحلی و نگرانی خانواده‌ها از آلودگی.",
    conditions: "روستای ساحلی با دسترسی محدود به خودروی جمع‌آوری زباله",
    action: "هماهنگی با شورای روستا برای محل دفن مشخص و آموزش تفکیک به خانواده‌ها.",
    resources: "برگزاری دو جلسه آموزش جمعی با مشارکت دهیاری",
    challenges: "مقاومت برخی خانواده‌ها در تفکیک زباله",
    result: "محل دفن مشخص شد و حجم زباله‌های رهاشده کاهش یافت.",
    lessons: "مشارکت دهیاری و بزرگان روستا، پذیرش را آسان‌تر می‌کند.",
    suggestion: "آموزش تفکیک را با چهره‌های مورد اعتماد روستا شروع کنید.",
    status: "reviewed",
    publishedAt: ago(6),
    reviewedAt: ago(5),
    tags: ["بهداشت محیط"],
  },
];

async function seedExperiences(
  users: Map<string, string>,
  problemIds: Map<string, string>,
  answerIds: Map<string, string>,
) {
  const experienceIds = new Map<string, string>();

  for (const e of experienceDefs) {
    const sourceProblemId = e.sourceProblemTitle
      ? problemIds.get(e.sourceProblemTitle) ?? null
      : null;
    await upsertBy(
      "Experience",
      { slug: e.slug },
      e.id,
      {
        authorId: users.get(e.author)!,
        slug: e.slug,
        title: e.title,
        situation: e.situation ?? "",
        conditions: e.conditions ?? null,
        action: e.action ?? "",
        resources: e.resources ?? null,
        challenges: e.challenges ?? null,
        result: e.result ?? "",
        lessons: e.lessons ?? null,
        suggestion: e.suggestion ?? null,
        status: e.status,
        isDraft: e.isDraft ?? false,
        needsReview: e.needsReview ?? false,
        moderation: "visible",
        thanksCount: 0,
        sourceProblemId,
        publishedAt: e.isDraft ? null : (e.publishedAt ?? null),
        reviewedAt: e.reviewedAt ?? null,
        createdAt: e.publishedAt ?? e.createdAt ?? ago(2),
        updatedAt: e.publishedAt ?? e.createdAt ?? ago(2),
      },
    );
    experienceIds.set(e.slug, e.id);

    const tagIds = new Map<string, string>();
    for (const tag of e.tags) tagIds.set(tag, await ensureTag(tag));
    await createRows(
      "ExperienceTag",
      e.tags.map((tag) => ({ experienceId: e.id, tagId: tagIds.get(tag)! })),
    );

    if (e.referenceAnswerKey) {
      const answerId = answerIds.get(e.referenceAnswerKey);
      if (answerId) {
        await createRows("ExperienceReference", [
          {
            id: `seed-exp-ref-${e.id}`,
            experienceId: e.id,
            answerId,
            createdAt: e.publishedAt ?? ago(2),
          },
        ]);
      }
    }
  }

  // reuses of experiences by OTHER users
  const reuses = [
    {
      experience: "goftegoo-moaser-ba-khanevadehaye-negaran",
      user: "09120000103",
      outcome: "successful",
      summary: "در دو خانواده اجرا شد و نتیجه خوبی گرفتیم.",
    },
    {
      experience: "moraghebat-az-madaran-bardar-porkhatar",
      user: "09120000102",
      outcome: "partial",
      summary: "چک‌لیست را اجرا کردم؛ برخی موارد نیاز به بومی‌سازی داشت.",
    },
    {
      experience: "checklist-sobhaneh-parvandeh-salamat",
      user: "09120000105",
      outcome: "successful",
      summary: "چک‌لیست صبحگاهی را شروع کردم؛ خیلی کمک کرد.",
    },
    {
      experience: "jalesat-amoozesh-hamgani-diyabet",
      user: "09120000106",
      outcome: "successful",
      summary: "بسته آموزشی را در روستای خودم اجرا کردم.",
    },
    {
      experience: "saman-dehi-def-pasmand-sahel",
      user: "09120000110",
      outcome: "partial",
      summary: "در روستای خودم اجرا کردم؛ بخشی از هماهنگی‌ها زمان‌بر بود.",
    },
  ];
  await createRows(
    "ExperienceReuse",
    reuses.map((r, i) => ({
      id: `seed-exp-reuse-${String(i + 1).padStart(2, "0")}`,
      experienceId: experienceIds.get(r.experience)!,
      userId: users.get(r.user)!,
      outcome: r.outcome,
      summary: r.summary,
      createdAt: ago(2),
      updatedAt: ago(2),
    })),
  );

  // professional thanks received on experiences
  const expThanks = [
    {
      id: "seed-thanks-exp-01",
      user: "09120000105",
      experience: "checklist-sobhaneh-parvandeh-salamat",
      receivedBy: "09120000103",
    },
    {
      id: "seed-thanks-exp-02",
      user: "09120000101",
      experience: "checklist-sobhaneh-parvandeh-salamat",
      receivedBy: "09120000103",
    },
    {
      id: "seed-thanks-exp-03",
      user: "09120000103",
      experience: "goftegoo-moaser-ba-khanevadehaye-negaran",
      receivedBy: "09120000107",
    },
    {
      id: "seed-thanks-exp-04",
      user: "09120000102",
      experience: "moraghebat-az-madaran-bardar-porkhatar",
      receivedBy: "09120000104",
    },
  ];
  await createRows(
    "ProfessionalThanks",
    expThanks.map((t) => ({
      id: t.id,
      userId: users.get(t.user)!,
      targetType: "experience",
      targetId: experienceIds.get(t.experience)!,
      experienceId: experienceIds.get(t.experience)!,
      receivedById: users.get(t.receivedBy)!,
      createdAt: ago(1),
    })),
  );

  return experienceIds;
}

// -------------------------------------------------------------- interactions --

async function seedInteractions(
  users: Map<string, string>,
  problemIds: Map<string, string>,
  experienceIds: Map<string, string>,
) {
  const tagId = async (name: string) =>
    (await prisma.tag.findUnique({ where: { name } }))?.id ?? (await ensureTag(name));

  const follows = [
    { user: "09120000101", targetType: "tag", targetId: "واکسیناسیون" },
    { user: "09120000101", targetType: "tag", targetId: "مدیریت پرونده" },
    { user: "09120000101", targetType: "user", targetId: "09120000103" },
    { user: "09120000102", targetType: "tag", targetId: "غربالگری" },
    { user: "09120000102", targetType: "user", targetId: "09120000104" },
    { user: "09120000103", targetType: "tag", targetId: "بهداشت مادر و کودک" },
    { user: "09120000103", targetType: "user", targetId: "09120000102" },
    { user: "09120000104", targetType: "tag", targetId: "واکسیناسیون" },
    { user: "09120000105", targetType: "tag", targetId: "آموزش همگانی" },
    { user: "09120000105", targetType: "user", targetId: "09120000107" },
    { user: "09120000106", targetType: "tag", targetId: "دیابت" },
    { user: "09120000107", targetType: "tag", targetId: "مدیریت پرونده" },
    { user: "09120000108", targetType: "tag", targetId: "آموزش" },
    { user: "09120000109", targetType: "tag", targetId: "تجهیزات" },
    { user: "09120000110", targetType: "tag", targetId: "غربالگری" },
    { user: "09120000111", targetType: "tag", targetId: "بهداشت محیط" },
    { user: "09120000112", targetType: "user", targetId: "09120000104" },
    { user: "09120000113", targetType: "tag", targetId: "سلامت سالمندان" },
  ];

  await createRows(
    "Follow",
    await Promise.all(
      follows.map(async (f, i) => ({
        id: `seed-follow-${String(i + 1).padStart(2, "0")}`,
        userId: users.get(f.user)!,
        targetType: f.targetType,
        targetId:
          f.targetType === "user"
            ? users.get(f.targetId)!
            : await tagId(f.targetId),
        createdAt: ago(3),
      })),
    ),
  );

  const saved = [
    {
      user: "09120000101",
      targetType: "problem",
      targetId: problemIds.get("کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت")!,
    },
    {
      user: "09120000101",
      targetType: "experience",
      targetId: experienceIds.get("goftegoo-moaser-ba-khanevadehaye-negaran")!,
    },
    {
      user: "09120000102",
      targetType: "problem",
      targetId: problemIds.get("راهکاری برای کاهش مراجعه‌های تکراری جهت تکمیل پرونده سلامت")!,
    },
    {
      user: "09120000102",
      targetType: "experience",
      targetId: experienceIds.get("checklist-sobhaneh-parvandeh-salamat")!,
    },
    {
      user: "09120000105",
      targetType: "problem",
      targetId: problemIds.get("شیوه برخورد با خانواده‌های نگران درباره واکسن")!,
    },
    {
      user: "09120000106",
      targetType: "experience",
      targetId: experienceIds.get("moraghebat-az-madaran-bardar-porkhatar")!,
    },
  ];
  await createRows(
    "SavedItem",
    saved.map((s, i) => ({
      id: `seed-saved-${String(i + 1).padStart(2, "0")}`,
      userId: users.get(s.user)!,
      targetType: s.targetType,
      targetId: s.targetId,
      createdAt: ago(2),
    })),
  );
}

// ---------------------------------------------------------------- circles ----

async function seedCircles(users: Map<string, string>) {
  const circleDefs = [
    {
      id: "seed-circle-01",
      name: "حلقه ارتقای سلامت روستا",
      description: "گروه کوچک بهورزان برای آموزش همگانی و ارتقای سلامت جامعه.",
      topic: "آموزش همگانی",
      province: "خراسان رضوی",
      facilitator: "09120000104",
      members: [
        "09120000104",
        "09120000101",
        "09120000102",
        "09120000105",
        "09120000106",
      ],
      createdAt: ago(30),
    },
    {
      id: "seed-circle-02",
      name: "حلقه مدیریت پرونده‌های سلامت",
      description: "هم‌فکری برای بهبود فرآیندهای پرونده و آمار.",
      topic: "فرآیند",
      province: "تهران",
      facilitator: "09120000101",
      members: ["09120000101", "09120000103", "09120000107", "09120000108"],
      createdAt: ago(22),
    },
    {
      id: "seed-circle-03",
      name: "حلقه بهورزان جوان",
      description: "فضای هم‌آموزی برای بهورزان تازه‌کار.",
      topic: "مهارت‌های ارتباطی",
      province: "یزد",
      facilitator: "09120000108",
      members: ["09120000108", "09120000109", "09120000110", "09120000102"],
      createdAt: ago(12),
    },
  ];

  for (const c of circleDefs) {
    await upsertRow(
      "Circle",
      c.id,
      {
        name: c.name,
        description: c.description,
        topic: c.topic,
        province: c.province,
        capacity: 12,
        status: "active",
        facilitatorId: users.get(c.facilitator)!,
        createdAt: c.createdAt,
        updatedAt: c.createdAt,
      },
    );
    await createRows(
      "CircleMembership",
      c.members.map((member) => ({
        id: `seed-cm-${c.id}-${member}`,
        circleId: c.id,
        userId: users.get(member)!,
        role: member === c.facilitator ? "facilitator" : "member",
        status: "active",
        joinedAt: c.createdAt,
      })),
    );
  }

  await upsertRow("CircleJoinRequest", "seed-cj-01", {
    circleId: "seed-circle-02",
    userId: users.get("09120000110")!,
    message: "علاقه‌مند به یادگیری مدیریت پرونده هستم.",
    status: "pending",
    createdAt: ago(1),
  });
  await upsertRow("CircleJoinRequest", "seed-cj-02", {
    circleId: "seed-circle-03",
    userId: users.get("09120000105")!,
    message: "می‌خواهم تجربه‌ام را با بهورزان جوان به اشتراک بگذارم.",
    status: "pending",
    createdAt: ago(2),
  });

  await upsertRow("CircleInvite", "seed-cv-01", {
    circleId: "seed-circle-01",
    userId: users.get("09120000109")!,
    invitedById: users.get("09120000104")!,
    message: "دعوت به حلقه ارتقای سلامت روستا",
    status: "pending",
    createdAt: ago(1),
  });
  await upsertRow("CircleInvite", "seed-cv-02", {
    circleId: "seed-circle-02",
    userId: users.get("09120000106")!,
    invitedById: users.get("09120000101")!,
    message: "دعوت به حلقه مدیریت پرونده‌ها",
    status: "pending",
    createdAt: ago(2),
  });

  await upsertRow("CircleMeeting", "seed-cmt-01", {
    circleId: "seed-circle-01",
    title: "برنامه‌ریزی آموزش دیابت",
    agenda: "مرور بسته آموزشی و زمان‌بندی جلسات",
    scheduledAt: ahead(3),
    createdById: users.get("09120000104")!,
    createdAt: ago(1),
    updatedAt: ago(1),
  });
  await upsertRow("CircleMeeting", "seed-cmt-02", {
    circleId: "seed-circle-02",
    title: "بازبینی چک‌لیست پرونده",
    agenda: "بازبینی نهایی چک‌لیست و تقسیم کار",
    scheduledAt: ahead(5),
    createdById: users.get("09120000101")!,
    createdAt: ago(1),
    updatedAt: ago(1),
  });
}

// ------------------------------------------------------------------- peer ----

async function seedPeer(users: Map<string, string>) {
  const requestDefs = [
    {
      id: "seed-peer-01",
      requester: "09120000106",
      title: "بهترین روش پیگیری مادران باردار غایب",
      description:
        "چند مادر باردار چند جلسه مراجعه نکرده‌اند؛ دنبال روش مؤثر پیگیری هستم.",
      barrierType: "knowledge",
      tags: ["بهداشت مادر و کودک"],
      province: "کرمان",
      status: "open",
      createdAt: ago(4),
    },
    {
      id: "seed-peer-02",
      requester: "09120000109",
      title: "آموزش گروهی فشار خون به سالمندان",
      description:
        "برای گروه سالمندان، روش آموزش ساده و جذاب می‌خواهم.",
      barrierType: "knowledge",
      tags: ["آموزش همگانی", "غربالگری"],
      province: "خوزستان",
      status: "open",
      createdAt: ago(3),
    },
    {
      id: "seed-peer-03",
      requester: "09120000107",
      title: "برخورد با سوءتغذیه کودکان",
      description:
        "چند کودک دچار سوءتغذیه شناسایی شده‌اند؛ تجربه همکاران را می‌خواهم.",
      barrierType: "community",
      tags: ["بهداشت مادر و کودک"],
      province: "گیلان",
      status: "matched",
      createdAt: ago(10),
    },
    {
      id: "seed-peer-04",
      requester: "09120000103",
      title: "جمع‌آوری و ثبت آمار ماهانه",
      description:
        "فرآیند ثبت آمار ماهانه زمان‌بر است؛ دنبال راهکار هستم.",
      barrierType: "process",
      tags: ["مدیریت پرونده"],
      province: "اصفهان",
      status: "completed",
      createdAt: ago(20),
    },
    {
      id: "seed-peer-05",
      requester: "09120000110",
      title: "برنامه ایمن‌سازی تکمیلی",
      description:
        "هماهنگی برنامه ایمن‌سازی تکمیلی در منطقه سخت است.",
      barrierType: "process",
      tags: ["واکسیناسیون"],
      province: "کرمانشاه",
      status: "closed",
      createdAt: ago(25),
    },
  ];

  const requestIds = new Map<string, string>();
  for (const r of requestDefs) {
    await upsertRow(
      "PeerHelpRequest",
      r.id,
      {
        requesterId: users.get(r.requester)!,
        title: r.title,
        description: r.description,
        barrierType: r.barrierType,
        tags: r.tags,
        province: r.province,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      },
    );
    requestIds.set(r.title, r.id);
  }

  const offers = [
    {
      helpRequest: "بهترین روش پیگیری مادران باردار غایب",
      helper: "09120000102",
      initiator: "helper",
      message: "تجربه پیگیری تلفنی را دارم؛ می‌توانم راهنمایی کنم.",
      status: "pending",
      createdAt: ago(2),
    },
    {
      helpRequest: "آموزش گروهی فشار خون به سالمندان",
      helper: "09120000104",
      initiator: "helper",
      message: "بسته آموزش فشار خون را در حلقه آماده کرده‌ایم.",
      status: "pending",
      createdAt: ago(1),
    },
    {
      helpRequest: "برخورد با سوءتغذیه کودکان",
      helper: "09120000105",
      initiator: "helper",
      message: "تجربه موفقی در این زمینه دارم؛ با هم کار کنیم.",
      status: "accepted",
      createdAt: ago(9),
      respondedAt: ago(8),
    },
    {
      helpRequest: "جمع‌آوری و ثبت آمار ماهانه",
      helper: "09120000107",
      initiator: "helper",
      message: "فرم ثبت آمار را دارم؛ کمک می‌کنم.",
      status: "accepted",
      createdAt: ago(19),
      respondedAt: ago(18),
    },
  ];
  await createRows(
    "PeerOffer",
    offers.map((o, i) => ({
      id: `seed-peer-offer-${String(i + 1).padStart(2, "0")}`,
      helpRequestId: requestIds.get(o.helpRequest)!,
      helperId: users.get(o.helper)!,
      initiator: o.initiator,
      message: o.message,
      status: o.status,
      createdAt: o.createdAt,
      respondedAt: o.respondedAt ?? null,
    })),
  );

  const cooperations = [
    {
      id: "seed-peer-coop-01",
      helpRequest: "برخورد با سوءتغذیه کودکان",
      requester: "09120000107",
      helper: "09120000105",
      goal: "برنامه پیگیری منظم وزن کودکان سوءتغذیه",
      status: "active",
      createdAt: ago(7),
    },
    {
      id: "seed-peer-coop-02",
      helpRequest: "جمع‌آوری و ثبت آمار ماهانه",
      requester: "09120000103",
      helper: "09120000107",
      goal: "تدوین فرم ساده ثبت آمار ماهانه",
      status: "completed",
      outcomeSummary: "فرم نهایی تهیه و در مرکز به کار گرفته شد.",
      requesterRating: 5,
      helperRating: 5,
      completedAt: ago(10),
      createdAt: ago(18),
    },
    {
      id: "seed-peer-coop-03",
      requester: "09120000110",
      helper: "09120000101",
      goal: "هماهنگی برنامه ایمن‌سازی تکمیلی",
      status: "closed",
      closedAt: ago(15),
      createdAt: ago(22),
    },
  ];
  for (const c of cooperations) {
    await upsertRow(
      "PeerCooperation",
      c.id,
      {
        helpRequestId: c.helpRequest ? requestIds.get(c.helpRequest) ?? null : null,
        requesterId: users.get(c.requester)!,
        helperId: users.get(c.helper)!,
        goal: c.goal ?? null,
        status: c.status,
        outcomeSummary: c.outcomeSummary ?? null,
        requesterRating: c.requesterRating ?? null,
        helperRating: c.helperRating ?? null,
        completedAt: c.completedAt ?? null,
        closedAt: c.closedAt ?? null,
        createdAt: c.createdAt,
        updatedAt: c.completedAt ?? c.closedAt ?? c.createdAt,
      },
    );
  }

  await createRows("PeerMessage", [
    {
      id: "seed-peer-msg-01",
      cooperationId: "seed-peer-coop-01",
      senderId: users.get("09120000107")!,
      body: "سلام؛ هفته گذشته وزن سه کودک را ثبت کردم و برنامه را شروع کردیم.",
      createdAt: ago(5),
    },
    {
      id: "seed-peer-msg-02",
      cooperationId: "seed-peer-coop-01",
      senderId: users.get("09120000105")!,
      body: "عالی است. لطفاً نتیجه هر هفته را در همین گفتگو ثبت کنید تا بررسی کنیم.",
      createdAt: ago(4),
    },
  ]);
}

// --------------------------------------------------------------- academy ----

async function seedAcademy(
  users: Map<string, string>,
  problemIds: Map<string, string>,
) {
  type SeedLesson = {
    id: string;
    title: string;
    summary: string;
    body: string;
    order: number;
    quiz: {
      id: string;
      question: string;
      options: unknown[];
      correctIndex: number;
      explanation?: string;
      order: number;
    }[];
  };
  type SeedCourse = {
    id: string;
    slug: string;
    title: string;
    description: string;
    level: string;
    status: string;
    owner: string;
    emoji: string;
    publishedAt?: Date;
    createdAt?: Date;
    tags: string[];
    relatedProblemTitle?: string;
    lessons: SeedLesson[];
  };

  const course1: SeedCourse = {
    id: "seed-course-01",
    slug: "barname-gharbal-feshar-diyabet",
    title: "برنامه غربالگری فشار خون و دیابت",
    description:
      "شناسایی افراد در معرض خطر، پیگیری و ارجاع به‌موقع در برنامه غربالگری.",
    level: "beginner",
    status: "published",
    owner: "09120000102",
    emoji: "🩺",
    publishedAt: ago(15),
    tags: ["غربالگری", "دیابت"],
    relatedProblemTitle: "ساماندهی آموزش همگانی دیابت در روستاهای دورافتاده",
    lessons: [
      {
        id: "seed-lesson-01",
        title: "شناسایی افراد در معرض خطر",
        summary: "معیارهای غربالگری و ابزار اندازه‌گیری",
        body: "در این درس معیارهای اصلی شناسایی افراد در معرض خطر فشار خون و دیابت را مرور می‌کنیم و نحوه استفاده از دستگاه فشارسنج و گلوکومتر را می‌آموزیم.",
        order: 1,
        quiz: [
          {
            id: "seed-quiz-01",
            question: "معیار اصلی تشخیص فشار خون بالا در غربالگری چیست؟",
            options: [
              { text: "فشار سیستول بالای ۱۲۰" },
              { text: "فشار سیستول بالای ۱۴۰ در دو نوبت" },
              { text: "فشار دیاستول بالای ۸۰ در یک نوبت" },
              { text: "تنها بر اساس سن" },
            ],
            correctIndex: 1,
            explanation: "فشار سیستول بالای ۱۴۰ در دو نوبت جداگانه معیار اصلی است.",
            order: 0,
          },
          {
            id: "seed-quiz-02",
            question: "کدام گروه در اولویت غربالگری دیابت قرار دارد؟",
            options: [
              { text: "فقط افراد علامت‌دار" },
              { text: "افراد دارای سابقه خانوادگی و اضافه‌وزن" },
              { text: "کودکان زیر ۵ سال" },
              { text: "همه افراد به‌طور تصادفی" },
            ],
            correctIndex: 1,
            explanation: "سابقه خانوادگی و اضافه‌وزن از عوامل خطر اصلی هستند.",
            order: 1,
          },
        ],
      },
      {
        id: "seed-lesson-02",
        title: "پیگیری و ارجاع به‌موقع",
        summary: "ثبت نتایج و پیگیری موارد مشکوک",
        body: "نحوه ثبت نتایج در پرونده، پیگیری موارد مشکوک و ارجاع به‌موقع به پزشک را تمرین می‌کنیم.",
        order: 2,
        quiz: [],
      },
    ],
  };

  const course2: SeedCourse = {
    id: "seed-course-02",
    slug: "maharat-ertebat-ba-khanevadeha",
    title: "مهارت‌های ارتباطی با خانواده‌ها",
    description: "گفت‌وگوی مؤثر برای جلب اعتماد و افزایش مشارکت خانواده‌ها.",
    level: "intermediate",
    status: "published",
    owner: "09120000101",
    emoji: "💬",
    publishedAt: ago(10),
    tags: ["آموزش همگانی"],
    lessons: [
      {
        id: "seed-lesson-03",
        title: "اصول گفت‌وگوی مؤثر",
        summary: "شنیدن فعال و پیام رسا",
        body: "در این درس اصول گفت‌وگوی مؤثر، شنیدن فعال و انتقال پیام سلامت به زبان ساده را می‌آموزیم.",
        order: 1,
        quiz: [
          {
            id: "seed-quiz-03",
            question: "اولین قدم در گفت‌وگو با خانواده نگران چیست؟",
            options: [
              { text: "ارائه سریع توصیه" },
              { text: "شنیدن نگرانی بدون قضاوت" },
              { text: "انجام کارهای دیگر به‌طور همزمان" },
              { text: "قانع‌کردن با اصرار" },
            ],
            correctIndex: 1,
            explanation: "شنیدن نگرانی بدون قضاوت، پایه اعتماد است.",
            order: 0,
          },
        ],
      },
    ],
  };

  const draftCourse: SeedCourse = {
    id: "seed-course-03",
    slug: "amoozesh-salamat-dar-roosta",
    title: "آموزش سلامت در روستا",
    description: "پیش‌نویس دوره آموزش سلامت برای مناطق روستایی.",
    level: "beginner",
    status: "draft",
    owner: "09120000101",
    emoji: "📚",
    createdAt: ago(2),
    tags: [],
    lessons: [],
  };

  for (const c of [course1, course2, draftCourse]) {
    const publishedAt = c.publishedAt ? new Date(c.publishedAt) : null;
    const createdAt = c.publishedAt ? new Date(c.publishedAt) : new Date(c.createdAt ?? Date.now());
    await upsertBy(
      "Course",
      { slug: c.slug },
      c.id,
      {
        slug: c.slug,
        title: c.title,
        description: c.description,
        level: c.level,
        status: c.status,
        ownerId: users.get(c.owner)!,
        version: 1,
        reviewedAt: publishedAt,
        emoji: c.emoji,
        isPaid: false,
        relatedProblemId: c.relatedProblemTitle
          ? problemIds.get(c.relatedProblemTitle) ?? null
          : null,
        publishedAt,
        createdAt,
        updatedAt: createdAt,
      },
    );

    const tagIds = new Map<string, string>();
    for (const tag of c.tags) tagIds.set(tag, await ensureTag(tag));
    await createRows(
      "CourseTag",
      c.tags.map((tag) => ({ courseId: c.id, tagId: tagIds.get(tag)! })),
    );

    for (const lesson of c.lessons) {
      await upsertRow(
        "Lesson",
        lesson.id,
        {
          courseId: c.id,
          title: lesson.title,
          summary: lesson.summary,
          body: lesson.body,
          contentType: "text",
          durationMinutes: 15,
          order: lesson.order,
          isOptional: false,
          createdAt,
          updatedAt: createdAt,
        },
      );
      await createRows(
        "CourseQuizQuestion",
        lesson.quiz.map((q) => ({
          id: q.id,
          lessonId: lesson.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? null,
          order: q.order,
        })),
      );
    }
  }

  const enrollments: Record<string, string[]> = {
    "seed-course-01": [
      "09120000103",
      "09120000105",
      "09120000106",
      "09120000107",
      "09120000108",
      "09120000109",
      "09120000110",
      "09120000112",
    ],
    "seed-course-02": ["09120000102", "09120000104", "09120000105", "09120000106"],
  };
  const enrollmentRows: Record<string, unknown>[] = [];
  for (const [courseId, phones] of Object.entries(enrollments)) {
    for (const phone of phones) {
      enrollmentRows.push({
        id: `seed-enr-${courseId}-${phone}`,
        courseId,
        userId: users.get(phone)!,
        enrolledAt: ago(8),
      });
    }
  }
  await createRows("CourseEnrollment", enrollmentRows);

  const progressRows = [
    { lessonId: "seed-lesson-01", user: "09120000103", status: "completed", quizPassed: true, completedAt: ago(5) },
    { lessonId: "seed-lesson-02", user: "09120000103", status: "in_progress", quizPassed: false, completedAt: null },
    { lessonId: "seed-lesson-01", user: "09120000105", status: "in_progress", quizPassed: false, completedAt: null },
    { lessonId: "seed-lesson-01", user: "09120000106", status: "completed", quizPassed: true, completedAt: ago(4) },
  ];
  await createRows(
    "LessonProgress",
    progressRows.map((p) => ({
      id: `seed-lp-${p.lessonId}-${p.user}`,
      lessonId: p.lessonId,
      userId: users.get(p.user)!,
      status: p.status,
      quizPassed: p.quizPassed,
      completedAt: p.completedAt,
      createdAt: ago(7),
      updatedAt: p.completedAt ?? ago(5),
    })),
  );

  const attempts = [
    { lessonId: "seed-lesson-01", user: "09120000103", score: 2, total: 2, passed: true, createdAt: ago(5) },
    { lessonId: "seed-lesson-01", user: "09120000105", score: 1, total: 2, passed: false, createdAt: ago(5) },
    { lessonId: "seed-lesson-01", user: "09120000106", score: 2, total: 2, passed: true, createdAt: ago(4) },
  ];
  await createRows(
    "QuizAttempt",
    attempts.map((a, i) => ({
      id: `seed-qa-${String(i + 1).padStart(2, "0")}`,
      lessonId: a.lessonId,
      userId: users.get(a.user)!,
      score: a.score,
      total: a.total,
      passed: a.passed,
      createdAt: a.createdAt,
    })),
  );

  const fieldApps = [
    { lessonId: "seed-lesson-01", courseId: "seed-course-01", user: "09120000103", summary: "در جلسه غربالگری این هفته اجرا شد.", outcome: "successful", createdAt: ago(3) },
    { lessonId: "seed-lesson-02", courseId: "seed-course-01", user: "09120000106", summary: "پیگیری موارد مشکوک شروع شد.", outcome: "partial", createdAt: ago(2) },
  ];
  await createRows(
    "FieldApplication",
    fieldApps.map((a) => ({
      id: `seed-fa-${a.user}-${a.lessonId}`,
      lessonId: a.lessonId,
      courseId: a.courseId,
      userId: users.get(a.user)!,
      summary: a.summary,
      outcome: a.outcome,
      createdAt: a.createdAt,
    })),
  );
}

// --------------------------------------------------------------- benefits ----

async function seedBenefits(users: Map<string, string>) {
  const providerDefs = [
    {
      id: "seed-bp-01",
      name: "مرکز آموزش ضمن خدمت بهورزان",
      category: "education",
      description: "دوره‌های کوتاه آموزش ضمن خدمت برای بهورزان عضو جامعه.",
      terms: "ثبت‌نام از طریق جامعه و رزرو آنلاین",
      logoEmoji: "🎓",
      isSponsored: false,
      createdBy: "09120000101",
      publishedAt: ago(20),
    },
    {
      id: "seed-bp-02",
      name: "تأمین لوازم بهداشتی روستایی",
      category: "equipment",
      description: "تأمین اقلام پایه بهداشتی با شرایط ویژه برای اعضا.",
      terms: "تحویل از انبار مرکزی با معرفی‌نامه جامعه",
      logoEmoji: "🧰",
      isSponsored: false,
      createdBy: "09120000101",
      publishedAt: ago(18),
    },
    {
      id: "seed-bp-03",
      name: "باشگاه سلامت و بیمه تکمیلی",
      category: "insurance",
      description: "بسته بیمه تکمیلی سلامت با پوشش‌های ویژه اعضای شبکه.",
      terms: "ویژه اعضای تأییدشده؛ شرایط در سایت اعلام شده است.",
      logoEmoji: "🛡️",
      isSponsored: true,
      createdBy: "09120000101",
      publishedAt: ago(12),
    },
    {
      id: "seed-bp-04",
      name: "همکاری با داروخانه‌های منتخب",
      category: "retail",
      description: "پیش‌نویس ارائه‌دهنده در انتظار تکمیل اطلاعات.",
      terms: "در حال بررسی",
      isSponsored: false,
      createdBy: "09120000101",
      publishedAt: null,
      createdAt: ago(2),
    },
  ];

  for (const p of providerDefs) {
    await upsertRow(
      "BenefitProvider",
      p.id,
      {
        name: p.name,
        category: p.category,
        description: p.description,
        terms: p.terms,
        website: null,
        contactNote: null,
        logoEmoji: p.logoEmoji ?? null,
        isSponsored: p.isSponsored,
        status: p.publishedAt ? "approved" : "draft",
        createdById: users.get(p.createdBy)!,
        publishedAt: p.publishedAt ?? null,
        createdAt: p.publishedAt ?? p.createdAt ?? ago(2),
        updatedAt: p.publishedAt ?? p.createdAt ?? ago(2),
      },
    );
  }

  const usages = [
    { provider: "seed-bp-01", user: "09120000103", satisfaction: 5, note: "دوره کاربردی و مفید بود." },
    { provider: "seed-bp-01", user: "09120000105", satisfaction: 4, note: "محتوا خوب بود؛ زمان کوتاه بود." },
    { provider: "seed-bp-02", user: "09120000106", satisfaction: 4, note: "اقلام به‌موقع رسید." },
    { provider: "seed-bp-02", user: "09120000107", satisfaction: 5 },
    { provider: "seed-bp-03", user: "09120000109", satisfaction: 3, note: "فرآیند ثبت‌نام طولانی بود." },
    { provider: "seed-bp-03", user: "09120000110", satisfaction: 4 },
  ];
  await createRows(
    "BenefitUsage",
    usages.map((u, i) => ({
      id: `seed-bu-${String(i + 1).padStart(2, "0")}`,
      providerId: u.provider,
      userId: users.get(u.user)!,
      note: u.note ?? null,
      satisfaction: u.satisfaction,
      createdAt: ago(4),
    })),
  );

  const reports = [
    { provider: "seed-bp-03", reporter: "09120000104", reason: "misleading", note: "توضیحات پوشش‌ها شفاف نیست.", createdAt: ago(2) },
    { provider: "seed-bp-02", reporter: "09120000102", reason: "issue_service", note: "تأخیر در تحویل یک مورد", createdAt: ago(3) },
  ];
  await createRows(
    "BenefitReport",
    reports.map((r, i) => ({
      id: `seed-br-${String(i + 1).padStart(2, "0")}`,
      providerId: r.provider,
      reporterId: users.get(r.reporter)!,
      reason: r.reason,
      note: r.note,
      status: "pending",
      createdAt: r.createdAt,
    })),
  );

  const proposals = [
    {
      id: "seed-bpr-01",
      author: "09120000101",
      title: "خرید ترازوی دیجیتال برای پایگاه‌ها",
      description: "تجهیز پایگاه‌های سلامت به ترازوی دیجیتال دقیق برای اندازه‌گیری کودک.",
      category: "equipment",
      amountEstimate: "۱۵ میلیون تومان",
      status: "voting",
      createdAt: ago(9),
    },
    {
      id: "seed-bpr-02",
      author: "09120000104",
      title: "دوره آموزش احیای قلبی و ریوی",
      description: "برگزاری دوره عملی احیای قلبی برای همه بهورزان استان.",
      category: "training",
      amountEstimate: "۸ میلیون تومان",
      status: "under_review",
      createdAt: ago(6),
    },
    {
      id: "seed-bpr-03",
      author: "09120000105",
      title: "تأمین ملزومات آموزش سلامت",
      description: "خرید ملزومات پایه برای اتاق آموزش خانه‌های بهداشت.",
      category: "equipment",
      amountEstimate: "۵ میلیون تومان",
      status: "approved",
      createdAt: ago(14),
    },
    {
      id: "seed-bpr-04",
      author: "09120000106",
      title: "تعمیر ساختمان خانه بهداشت",
      description: "رفع رطوبت و تعمیر سقف ساختمان خانه بهداشت روستا.",
      category: "infrastructure",
      amountEstimate: "۲۰ میلیون تومان",
      status: "implemented",
      implementedAt: ago(5),
      createdAt: ago(25),
    },
    {
      id: "seed-bpr-05",
      author: "09120000108",
      title: "طرح سطل‌های تفکیک زباله",
      description: "پیش‌نویس طرح سطل‌های تفکیک زباله در محوطه مراکز.",
      category: "community",
      amountEstimate: "۳ میلیون تومان",
      status: "draft",
      createdAt: ago(1),
    },
  ];
  for (const p of proposals) {
    await upsertRow(
      "BudgetProposal",
      p.id,
      {
        authorId: users.get(p.author)!,
        title: p.title,
        description: p.description,
        category: p.category,
        amountEstimate: p.amountEstimate,
        status: p.status,
        implementedAt: p.implementedAt ?? null,
        createdAt: p.createdAt,
        updatedAt: p.implementedAt ?? p.createdAt,
      },
    );
  }

  const voterPhones = [
    "09120000102",
    "09120000103",
    "09120000105",
    "09120000106",
    "09120000107",
    "09120000108",
    "09120000109",
    "09120000110",
  ];
  await createRows(
    "BudgetProposalVote",
    voterPhones.map((phone, i) => ({
      id: `seed-bv-${String(i + 1).padStart(2, "0")}`,
      proposalId: "seed-bpr-01",
      userId: users.get(phone)!,
      createdAt: ago(7),
    })),
  );

  await upsertRow("BudgetImplementation", "seed-bi-01", {
    proposalId: "seed-bpr-04",
    summary: "تعمیر سقف و رفع رطوبت با همکاری واحد پشتیبانی انجام شد.",
    expenses: [
      { item: "مصالح", amount: "۱۲ میلیون تومان" },
      { item: "دستمزد", amount: "۸ میلیون تومان" },
    ],
    reportedById: users.get("09120000106")!,
    createdAt: ago(5),
  });
}

// -------------------------------------------------------------- campaigns ----

async function seedCampaigns(users: Map<string, string>) {
  const campaignDefs = [
    {
      id: "seed-campaign-01",
      family: "learning",
      title: "چالش ثبت تجربه‌های میدانی",
      description:
        "تجربه‌های واقعی خود را از میدان ثبت و به اشتراک بگذارید تا دانش جامعه غنی‌تر شود.",
      status: "active",
      startsAt: ago(2),
      endsAt: ahead(20),
      createdBy: "09120000101",
      publishedAt: ago(2),
      participants: [
        "09120000102",
        "09120000103",
        "09120000104",
        "09120000105",
        "09120000106",
      ],
    },
    {
      id: "seed-campaign-02",
      family: "cooperation",
      title: "همکاری در برنامه غربالگری",
      description:
        "هم‌افزایی بهورزان برای اجرای بهتر برنامه‌های غربالگری استانی.",
      status: "active",
      startsAt: ago(5),
      endsAt: ahead(15),
      createdBy: "09120000101",
      publishedAt: ago(5),
      participants: ["09120000102", "09120000105", "09120000107", "09120000109"],
    },
    {
      id: "seed-campaign-03",
      family: "innovation",
      title: "بهسازی خانه بهداشت",
      description:
        "ارائه ایده‌های ساده برای بهبود فضا و کارایی خانه‌های بهداشت.",
      status: "active",
      startsAt: ago(3),
      endsAt: ahead(10),
      createdBy: "09120000101",
      publishedAt: ago(3),
      participants: ["09120000104", "09120000108", "09120000110", "09120000112"],
    },
    {
      id: "seed-campaign-04",
      family: "network",
      title: "شبکه‌سازی بهورزان استان",
      description: "پیش‌نویس کمپین شبکه‌سازی برای معرفی بعدی.",
      status: "draft",
      createdBy: "09120000101",
      publishedAt: null,
      createdAt: ago(1),
      participants: [],
    },
  ];

  for (const c of campaignDefs) {
    await upsertRow(
      "Campaign",
      c.id,
      {
        family: c.family,
        title: c.title,
        description: c.description,
        status: c.status,
        startsAt: c.startsAt ?? null,
        endsAt: c.endsAt ?? null,
        isOptional: true,
        createdById: users.get(c.createdBy)!,
        publishedAt: c.publishedAt ?? null,
        createdAt: c.publishedAt ?? c.createdAt ?? ago(1),
        updatedAt: c.publishedAt ?? c.createdAt ?? ago(1),
      },
    );
    await createRows(
      "CampaignParticipation",
      c.participants.map((phone) => ({
        id: `seed-cpart-${c.id}-${phone}`,
        campaignId: c.id,
        userId: users.get(phone)!,
        createdAt: c.publishedAt ?? ago(1),
      })),
    );
  }
}

// ------------------------------------------------------------------- tools ----

async function seedTools(users: Map<string, string>) {
  const toolDefs = [
    {
      id: "seed-tool-01",
      slug: "rahnamaye-goftegoo-ba-khanevadehaye-negaran",
      kind: "guide",
      title: "راهنمای گفت‌وگو با خانواده‌های نگران",
      summary: "گام‌های عملی برای جلب اعتماد خانواده‌ها درباره واکسن و مراقبت.",
      body: "۱) به نگرانی گوش دهید بدون قضاوت. ۲) آمار ساده و محلی ارائه دهید. ۳) توصیه را با زبان ساده بیان کنید. ۴) پیگیری بعدی را یادآوری کنید.",
      tags: ["واکسیناسیون", "آموزش"],
      createdBy: "09120000101",
      publishedAt: ago(16),
    },
    {
      id: "seed-tool-02",
      slug: "checklist-tajhizat-khaneh-behdasht",
      kind: "checklist",
      title: "چک‌لیست تجهیزات خانه بهداشت",
      summary: "بررسی ماهانه وضعیت تجهیزات و ملزومات پایه.",
      body: "موارد: ترازو، فشارسنج، گلوکومتر، یخچال واکسن، وسایل آموزش سلامت، فرم‌های پرونده.",
      tags: ["تجهیزات"],
      createdBy: "09120000101",
      publishedAt: ago(13),
    },
    {
      id: "seed-tool-03",
      slug: "baste-modakhele-amoozesh-diyabet",
      kind: "intervention",
      title: "بسته مداخله آموزش دیابت",
      summary: "بسته ۲۰ دقیقه‌ای جلسه آموزش دیابت برای گروه‌های هدف.",
      body: "ساختار جلسه: سلام و پرسش‌وپاسخ کوتاه، آموزش نشانه‌ها، تغذیه سالم، تمرین عملی، جمع‌بندی.",
      tags: ["دیابت", "آموزش همگانی"],
      createdBy: "09120000101",
      publishedAt: ago(9),
    },
    {
      id: "seed-tool-04",
      slug: "abzar-pishnevis-partvand-eleketronik",
      kind: "guide",
      title: "پیش‌نویس راهنمای پرونده الکترونیک",
      summary: "راهنمای در حال تکمیل برای ورود اطلاعات پرونده.",
      body: "پیش‌نویس این راهنما هنوز کامل نشده است.",
      tags: ["مدیریت پرونده"],
      createdBy: "09120000101",
      publishedAt: null,
      createdAt: ago(2),
    },
  ];

  for (const t of toolDefs) {
    await upsertBy(
      "Tool",
      { slug: t.slug },
      t.id,
      {
        slug: t.slug,
        kind: t.kind,
        title: t.title,
        summary: t.summary,
        body: t.body,
        status: t.publishedAt ? "published" : "draft",
        version: 1,
        reviewedAt: t.publishedAt ?? null,
        tags: t.tags,
        createdById: users.get(t.createdBy)!,
        publishedAt: t.publishedAt ?? null,
        createdAt: t.publishedAt ?? t.createdAt ?? ago(2),
        updatedAt: t.publishedAt ?? t.createdAt ?? ago(2),
      },
    );
  }
}

// --------------------------------------------------------------- governance --

async function seedGovernance(users: Map<string, string>) {
  await upsertRow("ContentReport", "seed-cr-01", {
    reporterId: users.get("09120000107")!,
    problemId: "seed-problem-03",
    reason: "نامربوط",
    note: "پاسخ کوتاه و بدون جزئیات",
    status: "pending",
    createdAt: ago(1),
  });
  await upsertRow("ContentReport", "seed-cr-02", {
    reporterId: users.get("09120000109")!,
    experienceId: "seed-exp-08",
    reason: "اطلاعات ناقص",
    note: "نتیجه نهایی ثبت نشده است",
    status: "pending",
    createdAt: ago(2),
  });

  const appeals = [
    {
      id: "seed-ap-01",
      user: "09120000106",
      targetType: "problem",
      targetId: "seed-problem-01",
      reason: "اعتراض به مخفی‌سازی اشتباه مسئله",
      status: "pending",
      createdAt: ago(2),
    },
    {
      id: "seed-ap-02",
      user: "09120000110",
      targetType: "account",
      targetId: "seed-user-10",
      reason: "درخواست رفع محدودیت حساب",
      status: "pending",
      createdAt: ago(3),
    },
    {
      id: "seed-ap-03",
      user: "09120000103",
      targetType: "experience",
      targetId: "seed-exp-01",
      reason: "اعتراض به تصمیم ناظر درباره یک تجربه",
      status: "approved",
      decisionNote: "پس از بازبینی، اعتراض پذیرفته شد.",
      decidedBy: "09120000101",
      decidedAt: ago(4),
      createdAt: ago(8),
    },
  ];
  for (const a of appeals) {
    await upsertRow(
      "Appeal",
      a.id,
      {
        userId: users.get(a.user)!,
        targetType: a.targetType,
        targetId: a.targetId,
        reason: a.reason,
        status: a.status,
        decisionNote: a.decisionNote ?? null,
        decidedBy: a.decidedBy ? users.get(a.decidedBy)! : null,
        decidedAt: a.decidedAt ?? null,
        createdAt: a.createdAt,
      },
    );
  }

  for (const term of ["پورسانت", "معاوضه"]) {
    await prisma.sensitiveTerm.upsert({
      where: { term },
      update: {},
      create: {
        term,
        description: "واژه مرتبط با فعالیت‌های غیرحرفه‌ای",
        isActive: true,
        createdById: users.get("09120000101")!,
        createdAt: ago(30),
      },
    });
  }

  const decisions = [
    {
      id: "seed-md-01",
      moderator: "09120000101",
      targetType: "user",
      targetId: "seed-user-10",
      action: "warn",
      reason: "استفاده از واژه‌های نامناسب",
      createdAt: ago(6),
    },
    {
      id: "seed-md-02",
      moderator: "09120000108",
      targetType: "user",
      targetId: "seed-user-09",
      action: "lift",
      reason: "بازگشت وضعیت عادی پس از توضیح",
      createdAt: ago(5),
    },
  ];
  for (const d of decisions) {
    await upsertRow(
      "ModerationDecision",
      d.id,
      {
        moderatorId: users.get(d.moderator)!,
        targetType: d.targetType,
        targetId: d.targetId,
        action: d.action,
        reason: d.reason,
        createdAt: d.createdAt,
      },
    );
  }
}

// ------------------------------------------------------------ notifications ---

async function seedNotifications(users: Map<string, string>) {
  const notifDefs = [
    {
      id: "seed-notif-01",
      user: "09120000106",
      type: "problem_answer",
      actor: "09120000103",
      title: "پاسخ جدید به مسئله شما",
      body: "بهرام کاظمی به مسئله شما پاسخ داد.",
      targetType: "problem",
      targetId: "seed-problem-01",
      read: false,
      createdAt: ago(2, 4),
    },
    {
      id: "seed-notif-02",
      user: "09120000106",
      type: "cooperation_offer",
      actor: "09120000102",
      title: "پیشنهاد همیاری جدید",
      body: "لیلا صادقی برای درخواست همیاری شما پیشنهاد داد.",
      targetType: "cooperation",
      targetId: "seed-peer-coop-01",
      read: false,
      createdAt: ago(1, 2),
    },
    {
      id: "seed-notif-03",
      user: "09120000102",
      type: "solution_selected",
      actor: "09120000107",
      title: "راهکار شما انتخاب شد",
      body: "پاسخ شما به‌عنوان راهکار مسئله انتخاب شد.",
      targetType: "problem",
      targetId: "seed-problem-04",
      read: true,
      readAt: ago(12),
      createdAt: ago(13),
    },
    {
      id: "seed-notif-04",
      user: "09120000105",
      type: "circle_meeting",
      actor: "09120000104",
      title: "جلسه جدید حلقه",
      body: "جلسه «برنامه‌ریزی آموزش دیابت» ثبت شد.",
      targetType: "circle",
      targetId: "seed-circle-01",
      read: false,
      createdAt: ago(1),
    },
    {
      id: "seed-notif-05",
      user: "09120000106",
      type: "circle_invite",
      actor: "09120000101",
      title: "دعوت به حلقه",
      body: "شما به حلقه «حلقه مدیریت پرونده‌های سلامت» دعوت شدید.",
      targetType: "circle",
      targetId: "seed-circle-02",
      read: false,
      createdAt: ago(2),
    },
    {
      id: "seed-notif-06",
      user: "09120000107",
      type: "cooperation_message",
      actor: "09120000105",
      title: "پیام جدید در همکاری",
      body: "سعید جعفری پیام جدیدی ارسال کرد.",
      targetType: "cooperation",
      targetId: "seed-peer-coop-01",
      read: false,
      createdAt: ago(4),
    },
    {
      id: "seed-notif-07",
      user: "09120000109",
      type: "budget_proposal_reviewed",
      actor: "09120000101",
      title: "بررسی پیشنهاد بودجه",
      body: "پیشنهاد بودجه شما بررسی شد.",
      targetType: "budget_proposal",
      read: false,
      createdAt: ago(3),
    },
    {
      id: "seed-notif-08",
      user: "09120000101",
      type: "circle_join_accepted",
      actor: "09120000110",
      title: "عضو جدید حلقه",
      body: "سارا نعمتی به حلقه شما پیوست.",
      targetType: "circle",
      targetId: "seed-circle-02",
      read: true,
      readAt: ago(1),
      createdAt: ago(2),
    },
    {
      id: "seed-notif-09",
      user: "09120000110",
      type: "appeal_decision",
      actor: "09120000101",
      title: "نتیجه اعتراض شما",
      body: "نتیجه اعتراض شما ثبت شد.",
      targetType: "appeal",
      read: false,
      createdAt: ago(2),
    },
    {
      id: "seed-notif-10",
      user: "09120000103",
      type: "benefit_report_resolved",
      actor: "09120000101",
      title: "گزارش مزیت بررسی شد",
      body: "گزارش شما درباره یک مزیت بررسی شد.",
      targetType: "benefit_provider",
      read: true,
      readAt: ago(1),
      createdAt: ago(2),
    },
    {
      id: "seed-notif-11",
      user: "09120000104",
      type: "problem_answer",
      actor: "09120000105",
      title: "پاسخ جدید",
      body: "سعید جعفری به مسئله مورد نظر پاسخ داد.",
      targetType: "problem",
      targetId: "seed-problem-07",
      read: true,
      readAt: ago(15),
      createdAt: ago(16),
    },
    {
      id: "seed-notif-12",
      user: "09120000108",
      type: "circle_join_accepted",
      actor: "09120000109",
      title: "عضو جدید حلقه",
      body: "کاوه ابراهیمی به حلقه شما پیوست.",
      targetType: "circle",
      targetId: "seed-circle-03",
      read: false,
      createdAt: ago(2),
    },
    {
      id: "seed-notif-13",
      user: "09120000112",
      type: "problem_answer",
      actor: "09120000101",
      title: "پاسخ جدید به مسئله شما",
      body: "امید رستمی به مسئله شما پاسخ داد.",
      targetType: "problem",
      targetId: "seed-problem-12",
      read: false,
      createdAt: ago(1),
    },
  ];

  await createRows(
    "Notification",
    notifDefs.map((n) => ({
      id: n.id,
      userId: users.get(n.user)!,
      type: n.type,
      actorId: n.actor ? users.get(n.actor)! : null,
      title: n.title,
      body: n.body ?? null,
      targetType: n.targetType ?? null,
      targetId: n.targetId ?? null,
      read: n.read,
      readAt: n.readAt ?? null,
      createdAt: n.createdAt,
    })),
  );

  const prefTypes = [
    "problem_answer",
    "solution_selected",
    "cooperation_offer",
    "cooperation_message",
    "circle_invite",
  ];
  const prefRows: Record<string, unknown>[] = [];
  for (const phone of ["09120000101", "09120000103", "09120000105"]) {
    for (const type of prefTypes) {
      prefRows.push({
        id: `seed-np-${phone}-${type}`,
        userId: users.get(phone)!,
        type,
        enabled: true,
        updatedAt: ago(1),
      });
    }
  }
  await createRows("NotificationPreference", prefRows);
}

// ------------------------------------------------------------------- audit ---

async function seedAudit(users: Map<string, string>) {
  const entries = [
    ...demoPhones.map((phone) => ({
      actor: phone,
      action: "auth.signin",
      entityType: "User",
      entityId: null,
      createdAt: ago(2),
    })),
    { actor: "09120000103", action: "profile.update", entityType: "User", entityId: null, createdAt: ago(4) },
    { actor: "09120000105", action: "profile.update", entityType: "User", entityId: null, createdAt: ago(5) },
    { actor: "09120000106", action: "problem.create", entityType: "Problem", entityId: "seed-problem-01", createdAt: ago(2, 3) },
    { actor: "09120000107", action: "problem.create", entityType: "Problem", entityId: "seed-problem-06", createdAt: ago(4) },
    { actor: "09120000103", action: "experience.create", entityType: "Experience", entityId: "seed-exp-01", createdAt: ago(16) },
    { actor: "09120000107", action: "experience.create", entityType: "Experience", entityId: "seed-exp-02", createdAt: ago(12) },
    { actor: "09120000104", action: "circle.create", entityType: "Circle", entityId: "seed-circle-01", createdAt: ago(30) },
    { actor: "09120000107", action: "peer.cooperation.goal", entityType: "PeerCooperation", entityId: "seed-peer-coop-01", createdAt: ago(7) },
    { actor: "09120000101", action: "interaction.follow", entityType: "Follow", entityId: null, createdAt: ago(3) },
    { actor: "09120000101", action: "membership.approve", entityType: "MembershipRequest", entityId: "seed-mr-verified", createdAt: ago(20) },
    { actor: "09120000105", action: "experience.reuse", entityType: "ExperienceReuse", entityId: "seed-exp-reuse-01", createdAt: ago(2) },
  ];

  let index = 0;
  for (const e of entries) {
    index += 1;
    await upsertRow(
      "AuditLog",
      `seed-audit-${String(index).padStart(2, "0")}`,
      {
        actorId: users.get(e.actor)!,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId ?? null,
        details: null,
        ip: "::1",
        createdAt: e.createdAt,
      },
    );
  }
}

// ------------------------------------------------------------------- main ----

async function main() {
  console.log("Seeding demo data into the configured database …");

  const users = await seedUsers();
  console.log(`  users: ${users.size}`);

  const ref = await seedProblems(users);
  const experienceIds = await seedExperiences(
    users,
    ref.problemIds,
    ref.answerIds,
  );
  await seedInteractions(users, ref.problemIds, experienceIds);
  await seedCircles(users);
  await seedPeer(users);
  await seedAcademy(users, ref.problemIds);
  await seedBenefits(users);
  await seedCampaigns(users);
  await seedTools(users);
  await seedGovernance(users);
  await seedNotifications(users);
  await seedAudit(users);

  const summary = [
    "User",
    "Problem",
    "ProblemAnswer",
    "Experience",
    "Circle",
    "CircleMembership",
    "PeerHelpRequest",
    "PeerCooperation",
    "Course",
    "Lesson",
    "BenefitProvider",
    "BudgetProposal",
    "Campaign",
    "Tool",
    "Notification",
    "Appeal",
    "MembershipRequest",
    "ContentReport",
    "AuditLog",
    "Session",
    "Tag",
    "Skill",
    "Follow",
    "SavedItem",
    "ProfessionalThanks",
  ];
  console.log("\nRow counts:");
  for (const name of summary) {
    const n = await model(name).count();
    console.log(`  ${name.padEnd(20)} ${n}`);
  }

  console.log("\nDemo users (phone / role / name):");
  const usersList = await prisma.user.findMany({
    where: { phone: { in: demoPhones } },
    select: { phone: true, role: true, displayName: true },
    orderBy: { phone: "asc" },
  });
  for (const row of usersList) {
    console.log(`  ${row.phone}  ${row.role.padEnd(20)} ${row.displayName ?? ""}`);
  }

  console.log("\nSeed complete (idempotent: existing rows were kept).");
}

async function run() {
  try {
    await main();
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});