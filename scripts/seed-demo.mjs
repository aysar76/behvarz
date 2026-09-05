#!/usr/bin/env node
/**
 * Seed demo data: 10 test users + content so every page of the app is "active".
 *
 * Uses better-sqlite3 directly (same as backup.mjs / restore.mjs). It is
 * idempotent: it only creates content when the demo users have no content yet,
 * so it is safe to run more than once.
 *
 *   node scripts/seed-demo.mjs [--db <path>]
 *
 * `--db` defaults to DATABASE_URL (file: prefix allowed) or `./dev.db`.
 *
 * Login: users are created by phone; sign in at `/auth` with one of the demo
 * phones and use the dev OTP code shown in the UI/logs.
 */
import Database from "better-sqlite3";
import { statSync } from "node:fs";
import { randomBytes } from "node:crypto";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--db") args.db = argv[++i];
  }
  return args;
}

function resolveDbPath(raw) {
  if (!raw) return "./dev.db";
  return raw.replace(/^file:/, "");
}

const args = parseArgs(process.argv);
const dbPath = resolveDbPath(args.db ?? process.env.DATABASE_URL);

if (!statSync(dbPath).isFile()) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// ---------------------------------------------------------------- helpers ---

let seq = 0;
function uid(prefix = "c") {
  seq += 1;
  return (
    prefix +
    Date.now().toString(36) +
    seq.toString(36).padStart(4, "0") +
    randomBytes(3).toString("hex")
  );
}

function dt(date) {
  return new Date(date).toISOString().replace("Z", "+00:00");
}

const DAY = 86400000;
const HOUR = 3600000;
const nowMs = Date.now();
const ago = (days, hours = 0) => dt(nowMs - days * DAY - hours * HOUR);
const ahead = (days) => dt(nowMs + days * DAY);

/**
 * Insert a row into `table`. Missing keys are omitted (NULL / DB default).
 * Uses `INSERT OR IGNORE` so join rows / re-runs never duplicate.
 */
function insert(table, data) {
  const keys = Object.keys(data);
  if (keys.length === 0) return undefined;
  const cols = keys.map((k) => `\`${k}\``).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => {
    const v = data[k];
    if (v === undefined) return null;
    if (v === true) return 1;
    if (v === false) return 0;
    return v;
  });
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${placeholders})`,
  );
  let info;
  try {
    info = stmt.run(...values);
  } catch (err) {
    err.message = `${err.message} (table=${table}, data=${JSON.stringify(data)})`;
    throw err;
  }
  return info.lastInsertRowid;
}

const demoPhones = Array.from(
  { length: 10 },
  (_, i) => `091200001${String(i + 1).padStart(2, "0")}`,
);
const DEMO_PHONE_LIKE = "091200001%";

const hasDemoContent = (table, column) =>
  db
    .prepare(
      `SELECT COUNT(*) AS n FROM ${table} WHERE ${column} IN (SELECT id FROM User WHERE phone LIKE '${DEMO_PHONE_LIKE}')`,
    )
    .get().n > 0;

const demoUserIds = () =>
  db
    .prepare(`SELECT id, phone FROM User WHERE phone LIKE '${DEMO_PHONE_LIKE}'`)
    .all()
    .map((row) => ({ id: row.id, phone: row.phone }));

// ---------------------------------------------------------------- users -----

function seedUsers() {
  const users = [
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
  ];

  for (const user of users) {
    const existing = db
      .prepare("SELECT id FROM User WHERE phone = ?")
      .get(user.phone);
    if (existing) continue;

    const userId = uid("c");
    insert("User", {
      id: userId,
      phone: user.phone,
      role: user.role,
      membershipStatus: user.membershipStatus,
      displayName: user.displayName,
      province: user.province,
      city: user.city,
      workYears: user.workYears,
      bio: user.bio,
      visibility: "public",
      onboardingCompleted: 1,
      willingToHelp: 1,
      allowDataContribution: 1,
      accountStatus: "active",
      createdAt: ago(30),
      updatedAt: ago(1),
    });
    // a session per user so the pilot "session/return" metric counts them.
    insert("Session", {
      id: uid("s"),
      userId,
      tokenHash: randomBytes(32).toString("hex"),
      expiresAt: ahead(30),
      ip: "::1",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
      createdAt: ago(2),
    });

    const userSkills = db.prepare("SELECT id FROM Skill ORDER BY name").all();
    const userInterests = db.prepare("SELECT id FROM Interest ORDER BY name").all();
    insert("UserSkill", {
      userId,
      skillId: userSkills[seq % userSkills.length].id,
    });
    insert("UserSkill", {
      userId,
      skillId: userSkills[(seq + 2) % userSkills.length].id,
    });
    insert("UserInterest", {
      userId,
      interestId: userInterests[seq % userInterests.length].id,
    });
    insert("UserInterest", {
      userId,
      interestId: userInterests[(seq + 1) % userInterests.length].id,
    });
  }

  const skills = ["آموزش سلامت", "تغذیه", "بهداشت روان", "آمار و گزارش‌گیری"];
  const interests = ["همکاری شبکه", "آموزش شهروندی", "مستندسازی تجربه"];
  for (const name of skills) {
    if (db.prepare("SELECT 1 FROM Skill WHERE name = ?").get(name)) continue;
    insert("Skill", { id: uid("k"), name });
  }
  for (const name of interests) {
    if (db.prepare("SELECT 1 FROM Interest WHERE name = ?").get(name)) continue;
    insert("Interest", { id: uid("i"), name });
  }

  // pending membership requests so the admin memberships page is active
  for (const phone of ["09120000109", "09120000110"]) {
    const userId = db.prepare("SELECT id FROM User WHERE phone = ?").get(phone).id;
    const pending = db
      .prepare("SELECT 1 FROM MembershipRequest WHERE userId = ? AND status = 'pending'")
      .get(userId);
    if (pending) continue;
    insert("MembershipRequest", {
      id: uid("mr"),
      userId,
      status: "pending",
      note: "درخواست تأیید هویت حرفه‌ای و عضویت رسمی",
      createdAt: ago(3),
    });
  }
  const verifiedUser = db
    .prepare("SELECT id FROM User WHERE phone = '09120000103'")
    .get();
  const verifiedExisting = db
    .prepare("SELECT 1 FROM MembershipRequest WHERE userId = ? AND status = 'verified'")
    .get(verifiedUser.id);
  if (!verifiedExisting) {
    insert("MembershipRequest", {
      id: uid("mr"),
      userId: verifiedUser.id,
      status: "verified",
      reviewedBy: db.prepare("SELECT id FROM User WHERE phone = '09120000101'").get().id,
      reviewedAt: ago(20),
      createdAt: ago(25),
    });
  }

  return demoUserIds();
}

// --------------------------------------------------------------- problems ----

function seedProblems(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  const ensureTag = (name) => {
    const existing = db.prepare("SELECT id FROM Tag WHERE name = ?").get(name);
    if (existing) return existing.id;
    const id = uid("t");
    insert("Tag", { id, name, isActive: 1 });
    return id;
  };

  const problems = [
    {
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
    },
    {
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
      author: "09120000106",
      title: "طرح باغچه سبزیجات برای آموزش تغذیه سالم",
      description:
        "می‌خواهم باغچه کوچکی در محوطه خانه بهداشت بزنم تا برای آموزش تغذیه سالم استفاده شود.",
      barrierType: "other",
      urgency: "low",
      status: "open",
      isDraft: 1,
      tags: ["آموزش"],
      createdAt: ago(2),
    },
  ];

  const problemIds = {};
  for (const p of problems) {
    const id = uid("p");
    insert("Problem", {
      id,
      authorId: u(p.author),
      title: p.title,
      description: p.description,
      context: p.context ?? null,
      barrierType: p.barrierType,
      actionsTaken: p.actionsTaken ?? null,
      expectedOutcome: p.expectedOutcome ?? null,
      urgency: p.urgency,
      isAnonymous: 0,
      status: p.status,
      isDraft: p.isDraft ?? 0,
      needsReview: p.author === "09120000109" ? 1 : 0,
      moderation: "visible",
      conclusion: p.conclusion ?? null,
      resultOutcome: p.resultOutcome ?? null,
      publishedAt: p.isDraft ? null : p.createdAt,
      solvedAt: p.solved ? p.createdAt : null,
      createdAt: p.createdAt,
      updatedAt: p.createdAt,
    });
    problemIds[p.title] = id;
    for (const tag of p.tags ?? []) {
      insert("ProblemTag", { problemId: id, tagId: ensureTag(tag) });
    }
    // status history for public-status flow
    if (p.solved) {
      insert("ProblemStatusChange", {
        id: uid("ps"),
        problemId: id,
        from: "open",
        to: "discussing",
        changedBy: u(p.author),
        createdAt: ago(12),
      });
      insert("ProblemStatusChange", {
        id: uid("ps"),
        problemId: id,
        from: "discussing",
        to: "solved",
        changedBy: u(p.author),
        createdAt: p.createdAt,
      });
    } else if (p.status === "discussing") {
      insert("ProblemStatusChange", {
        id: uid("ps"),
        problemId: id,
        from: "open",
        to: "discussing",
        changedBy: u(p.author),
        createdAt: p.createdAt,
      });
    }
  }

  const answers = [
    {
      problem: "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت",
      author: "09120000103",
      body: "ما همین مشکل را داشتیم؛ با تهیه فرم یکپارچه اکسل و چاپ ماهانه از مرکز، ثبت یک‌باره شد. می‌توانم نمونه را در اختیارتان بگذارم.",
    },
    {
      problem: "کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت",
      author: "09120000105",
      body: "پیشنهاد می‌کنم با واحد آمار، زمان تحویل فرم‌ها را در قرارداد ماهانه قید کنید تا دیرکرد کمتر شود.",
    },
    {
      problem: "ساماندهی آموزش همگانی دیابت در روستاهای دورافتاده",
      author: "09120000102",
      body: "تجربه برگزاری جلسات کوتاه ۲۰ دقیقه‌ای همراه با نمونه‌های واقعی را در بانک تجربه ثبت کرده‌ام؛ می‌توانید اجرا کنید.",
    },
    {
      problem: "استقبال کم روستاییان از واکسیناسیون آنفلوانزا",
      author: "09120000107",
      body: "با پیگیری تلفنی خانوارها و گفت‌وگوی چهره‌به‌چهره در زمان حضور در خانه بهداشت، پوشش به شکل محسوسی بالا رفت.",
      selected: true,
    },
    {
      problem: "شیوه برخورد با خانواده‌های نگران درباره واکسن",
      author: "09120000102",
      body: "گفت‌وگوی آرام، شنیدن نگرانی بدون قضاوت، و ارائه آمار ساده از پوشش واکسیناسیون مؤثر است. جزوه گفتگو را می‌توانم بفرستم.",
    },
    {
      problem: "نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر",
      author: "09120000105",
      body: "چک‌لیست پیگیری هفتگی و ثبت در پرونده، کمک زیادی کرد؛ تجربه کامل آن را در بانک تجربه منتشر کرده‌ام.",
      selected: true,
    },
  ];

  const answerIds = {};
  for (const a of answers) {
    const id = uid("a");
    insert("ProblemAnswer", {
      id,
      problemId: problemIds[a.problem],
      authorId: u(a.author),
      body: a.body,
      isClarificationRequest: 0,
      isSelectedSolution: a.selected ? 1 : 0,
      moderation: "visible",
      needsReview: 0,
      helpfulCount: 0,
      thanksCount: 0,
      createdAt: ago(3),
      updatedAt: ago(3),
    });
    answerIds[a.problem + "@" + a.author] = id;
    if (a.selected) {
      db.prepare("UPDATE Problem SET selectedAnswerId = ? WHERE id = ?").run(
        id,
        problemIds[a.problem],
      );
    }
  }

  // helpful marks + thanks on answers
  insert("ProblemAnswerHelpful", {
    answerId: answerIds["کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت@09120000103"],
    userId: u("09120000106"),
    createdAt: ago(2),
  });
  insert("ProblemAnswerHelpful", {
    answerId: answerIds["استقبال کم روستاییان از واکسیناسیون آنفلوانزا@09120000107"],
    userId: u("09120000102"),
    createdAt: ago(13),
  });
  insert("ProblemAnswerHelpful", {
    answerId: answerIds["استقبال کم روستاییان از واکسیناسیون آنفلوانزا@09120000107"],
    userId: u("09120000104"),
    createdAt: ago(13),
  });
  insert("ProblemAnswerHelpful", {
    answerId: answerIds["نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر@09120000105"],
    userId: u("09120000104"),
    createdAt: ago(17),
  });

  const thanksTargets = [
    {
      userId: u("09120000106"),
      targetType: "answer",
      targetId: answerIds["کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت@09120000103"],
      answerId: answerIds["کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت@09120000103"],
      receivedById: u("09120000103"),
    },
    {
      userId: u("09120000102"),
      targetType: "answer",
      targetId: answerIds["استقبال کم روستاییان از واکسیناسیون آنفلوانزا@09120000107"],
      answerId: answerIds["استقبال کم روستاییان از واکسیناسیون آنفلوانزا@09120000107"],
      receivedById: u("09120000107"),
    },
  ];
  for (const t of thanksTargets) {
    insert("ProfessionalThanks", { id: uid("th"), ...t, createdAt: ago(2) });
  }

  return { users, problemIds, answerIds };
}

// ------------------------------------------------------------ experiences ----

function seedExperiences(users, ref) {
  const u = (phone) => users.find((row) => row.phone === phone).id;
  const ensureTag = (name) => {
    const existing = db.prepare("SELECT id FROM Tag WHERE name = ?").get(name);
    if (existing) return existing.id;
    const id = uid("t");
    insert("Tag", { id, name, isActive: 1 });
    return id;
  };

  const experiences = [
    {
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
      author: "09120000106",
      slug: "payesh-ghad-vazn-kodakan-dar-madreseh",
      title: "پایش قد و وزن کودکان در مدرسه",
      situation: "دسترسی به کودکان در خانه دشوار بود.",
      action: "هماهنگی با مدرسه برای پایش منظم قد و وزن.",
      result: "پایش منظم و ارجاع موارد نیازمند پیگیری.",
      status: "under_review",
      publishedAt: ago(3),
      needsReview: 1,
      tags: ["بهداشت مادر و کودک"],
    },
    {
      author: "09120000102",
      slug: "draft-rosh-e-jadid-sabt-shekayat",
      title: "روش جدید ثبت و پیگیری شکایت‌های مراجعان",
      situation: "شکایت‌ها ثبت نمی‌شد و پیگیری وجود نداشت.",
      status: "user_generated",
      isDraft: 1,
      createdAt: ago(2),
      tags: ["مدیریت پرونده"],
    },
  ];

  const experienceIds = {};
  for (const e of experiences) {
    const id = uid("e");
    const sourceProblemId = e.sourceProblemTitle
      ? ref.problemIds[e.sourceProblemTitle]
      : null;
    insert("Experience", {
      id,
      authorId: u(e.author),
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
      isDraft: e.isDraft ?? 0,
      needsReview: e.needsReview ?? 0,
      moderation: "visible",
      thanksCount: 0,
      sourceProblemId,
      publishedAt: e.isDraft ? null : e.publishedAt,
      reviewedAt: e.reviewedAt ?? null,
      createdAt: e.publishedAt ?? e.createdAt,
      updatedAt: e.publishedAt ?? e.createdAt,
    });
    experienceIds[e.slug] = id;
    for (const tag of e.tags ?? []) {
      insert("ExperienceTag", { experienceId: id, tagId: ensureTag(tag) });
    }
    if (e.referenceAnswerKey) {
      const answerId = ref.answerIds[e.referenceAnswerKey];
      if (answerId) {
        insert("ExperienceReference", {
          id: uid("er"),
          experienceId: id,
          answerId,
          createdAt: e.publishedAt,
        });
      }
    }
  }

  // reuses of experiences by OTHER users (unique experienceId+userId)
  const reuses = [
    { experience: "goftegoo-moaser-ba-khanevadehaye-negaran", user: "09120000103", outcome: "successful", summary: "در دو خانواده اجرا شد و نتیجه خوبی گرفتیم." },
    { experience: "moraghebat-az-madaran-bardar-porkhatar", user: "09120000102", outcome: "partial", summary: "چک‌لیست را اجرا کردم؛ برخی موارد نیاز به بومی‌سازی داشت." },
    { experience: "checklist-sobhaneh-parvandeh-salamat", user: "09120000105", outcome: "successful", summary: "چک‌لیست صبحگاهی را شروع کردم؛ خیلی کمک کرد." },
    { experience: "jalesat-amoozesh-hamgani-diyabet", user: "09120000106", outcome: "successful", summary: "بسته آموزشی را در روستای خودم اجرا کردم." },
  ];
  for (const r of reuses) {
    insert("ExperienceReuse", {
      id: uid("eru"),
      experienceId: experienceIds[r.experience],
      userId: u(r.user),
      outcome: r.outcome,
      summary: r.summary,
      createdAt: ago(2),
      updatedAt: ago(2),
    });
  }

  // professional thanks received on experiences
  const expThanks = [
    { user: "09120000105", experience: "checklist-sobhaneh-parvandeh-salamat", receivedBy: "09120000103" },
    { user: "09120000101", experience: "checklist-sobhaneh-parvandeh-salamat", receivedBy: "09120000103" },
    { user: "09120000103", experience: "goftegoo-moaser-ba-khanevadehaye-negaran", receivedBy: "09120000107" },
    { user: "09120000102", experience: "moraghebat-az-madaran-bardar-porkhatar", receivedBy: "09120000104" },
  ];
  for (const t of expThanks) {
    const expId = experienceIds[t.experience];
    insert("ProfessionalThanks", {
      id: uid("th"),
      userId: u(t.user),
      targetType: "experience",
      targetId: expId,
      experienceId: expId,
      receivedById: u(t.receivedBy),
      createdAt: ago(1),
    });
  }

  return experienceIds;
}

// ------------------------------------------------------ interactions ---------

function seedInteractions(users, ref, experienceIds) {
  const u = (phone) => users.find((row) => row.phone === phone).id;
  const tagId = (name) =>
    db.prepare("SELECT id FROM Tag WHERE name = ?").get(name).id;

  const follows = [
    { user: "09120000101", targetType: "tag", targetId: () => tagId("واکسیناسیون") },
    { user: "09120000101", targetType: "tag", targetId: () => tagId("مدیریت پرونده") },
    { user: "09120000101", targetType: "user", targetId: () => u("09120000103") },
    { user: "09120000102", targetType: "tag", targetId: () => tagId("غربالگری") },
    { user: "09120000102", targetType: "user", targetId: () => u("09120000104") },
    { user: "09120000103", targetType: "tag", targetId: () => tagId("بهداشت مادر و کودک") },
    { user: "09120000103", targetType: "user", targetId: () => u("09120000102") },
    { user: "09120000104", targetType: "tag", targetId: () => tagId("واکسیناسیون") },
    { user: "09120000105", targetType: "tag", targetId: () => tagId("آموزش همگانی") },
    { user: "09120000105", targetType: "user", targetId: () => u("09120000107") },
    { user: "09120000106", targetType: "tag", targetId: () => tagId("دیابت") },
    { user: "09120000107", targetType: "tag", targetId: () => tagId("مدیریت پرونده") },
    { user: "09120000108", targetType: "tag", targetId: () => tagId("آموزش") },
    { user: "09120000109", targetType: "tag", targetId: () => tagId("تجهیزات") },
    { user: "09120000110", targetType: "tag", targetId: () => tagId("غربالگری") },
  ];
  for (const f of follows) {
    insert("Follow", {
      id: uid("f"),
      userId: u(f.user),
      targetType: f.targetType,
      targetId: f.targetId(),
      createdAt: ago(3),
    });
  }

  const saved = [
    { user: "09120000101", targetType: "problem", targetId: ref.problemIds["کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت"] },
    { user: "09120000101", targetType: "experience", targetId: experienceIds["goftegoo-moaser-ba-khanevadehaye-negaran"] },
    { user: "09120000102", targetType: "problem", targetId: ref.problemIds["راهکاری برای کاهش مراجعه‌های تکراری جهت تکمیل پرونده سلامت"] },
    { user: "09120000102", targetType: "experience", targetId: experienceIds["checklist-sobhaneh-parvandeh-salamat"] },
    { user: "09120000105", targetType: "problem", targetId: ref.problemIds["شیوه برخورد با خانواده‌های نگران درباره واکسن"] },
    { user: "09120000106", targetType: "experience", targetId: experienceIds["moraghebat-az-madaran-bardar-porkhatar"] },
  ];
  for (const s of saved) {
    insert("SavedItem", {
      id: uid("sv"),
      userId: u(s.user),
      targetType: s.targetType,
      targetId: s.targetId,
      createdAt: ago(2),
    });
  }
}

// ---------------------------------------------------------------- circles ----

function seedCircles(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  const circles = [
    {
      id: uid("ci"),
      name: "حلقه ارتقای سلامت روستا",
      description: "گروه کوچک بهورزان برای آموزش همگانی و ارتقای سلامت جامعه.",
      topic: "آموزش همگانی",
      province: "خراسان رضوی",
      facilitator: "09120000104",
      members: ["09120000104", "09120000101", "09120000102", "09120000105", "09120000106"],
      createdAt: ago(30),
    },
    {
      id: uid("ci"),
      name: "حلقه مدیریت پرونده‌های سلامت",
      description: "هم‌فکری برای بهبود فرآیندهای پرونده و آمار.",
      topic: "فرآیند",
      province: "تهران",
      facilitator: "09120000101",
      members: ["09120000101", "09120000103", "09120000107", "09120000108"],
      createdAt: ago(22),
    },
    {
      id: uid("ci"),
      name: "حلقه بهورزان جوان",
      description: "فضای هم‌آموزی برای بهورزان تازه‌کار.",
      topic: "مهارت‌های ارتباطی",
      province: "یزد",
      facilitator: "09120000108",
      members: ["09120000108", "09120000109", "09120000110", "09120000102"],
      createdAt: ago(12),
    },
  ];

  for (const c of circles) {
    insert("Circle", {
      id: c.id,
      name: c.name,
      description: c.description,
      topic: c.topic,
      province: c.province,
      capacity: 12,
      status: "active",
      facilitatorId: u(c.facilitator),
      createdAt: c.createdAt,
      updatedAt: c.createdAt,
    });
    for (const member of c.members) {
      insert("CircleMembership", {
        id: uid("cm"),
        circleId: c.id,
        userId: u(member),
        role: member === c.facilitator ? "facilitator" : "member",
        status: "active",
        joinedAt: c.createdAt,
      });
    }
  }

  // pending join requests
  insert("CircleJoinRequest", {
    id: uid("cj"),
    circleId: circles[1].id,
    userId: u("09120000110"),
    message: "علاقه‌مند به یادگیری مدیریت پرونده هستم.",
    status: "pending",
    createdAt: ago(1),
  });
  insert("CircleJoinRequest", {
    id: uid("cj"),
    circleId: circles[2].id,
    userId: u("09120000105"),
    message: "می‌خواهم تجربه‌ام را با بهورزان جوان به اشتراک بگذارم.",
    status: "pending",
    createdAt: ago(2),
  });

  // pending invites
  insert("CircleInvite", {
    id: uid("cv"),
    circleId: circles[0].id,
    userId: u("09120000109"),
    invitedById: u("09120000104"),
    message: "دعوت به حلقه ارتقای سلامت روستا",
    status: "pending",
    createdAt: ago(1),
  });
  insert("CircleInvite", {
    id: uid("cv"),
    circleId: circles[1].id,
    userId: u("09120000106"),
    invitedById: u("09120000101"),
    message: "دعوت به حلقه مدیریت پرونده‌ها",
    status: "pending",
    createdAt: ago(2),
  });

  // meetings
  insert("CircleMeeting", {
    id: uid("cmt"),
    circleId: circles[0].id,
    title: "برنامه‌ریزی آموزش دیابت",
    agenda: "مرور بسته آموزشی و زمان‌بندی جلسات",
    scheduledAt: ahead(3),
    createdById: u("09120000104"),
    createdAt: ago(1),
    updatedAt: ago(1),
  });
  insert("CircleMeeting", {
    id: uid("cmt"),
    circleId: circles[1].id,
    title: "بازبینی چک‌لیست پرونده",
    agenda: "بازبینی نهایی چک‌لیست و تقسیم کار",
    scheduledAt: ahead(5),
    createdById: u("09120000101"),
    createdAt: ago(1),
    updatedAt: ago(1),
  });
}

// ------------------------------------------------------------------ peer -----

function seedPeer(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  const requests = [
    {
      id: uid("pr"),
      requester: "09120000106",
      title: "بهترین روش پیگیری مادران باردار غایب",
      description: "چند مادر باردار چند جلسه مراجعه نکرده‌اند؛ دنبال روش مؤثر پیگیری هستم.",
      barrierType: "knowledge",
      tags: ["بهداشت مادر و کودک"],
      province: "کرمان",
      status: "open",
      createdAt: ago(4),
    },
    {
      id: uid("pr"),
      requester: "09120000109",
      title: "آموزش گروهی فشار خون به سالمندان",
      description: "برای گروه سالمندان، روش آموزش ساده و جذاب می‌خواهم.",
      barrierType: "knowledge",
      tags: ["آموزش همگانی", "غربالگری"],
      province: "خوزستان",
      status: "open",
      createdAt: ago(3),
    },
    {
      id: uid("pr"),
      requester: "09120000107",
      title: "برخورد با سوءتغذیه کودکان",
      description: "چند کودک دچار سوءتغذیه شناسایی شده‌اند؛ تجربه همکاران را می‌خواهم.",
      barrierType: "community",
      tags: ["بهداشت مادر و کودک"],
      province: "گیلان",
      status: "matched",
      createdAt: ago(10),
    },
    {
      id: uid("pr"),
      requester: "09120000103",
      title: "جمع‌آوری و ثبت آمار ماهانه",
      description: "فرآیند ثبت آمار ماهانه زمان‌بر است؛ دنبال راهکار هستم.",
      barrierType: "process",
      tags: ["مدیریت پرونده"],
      province: "اصفهان",
      status: "completed",
      createdAt: ago(20),
    },
    {
      id: uid("pr"),
      requester: "09120000110",
      title: "برنامه ایمن‌سازی تکمیلی",
      description: "هماهنگی برنامه ایمن‌سازی تکمیلی در منطقه سخت است.",
      barrierType: "process",
      tags: ["واکسیناسیون"],
      province: "کرمانشاه",
      status: "closed",
      createdAt: ago(25),
    },
  ];

  const requestIds = {};
  for (const r of requests) {
    insert("PeerHelpRequest", {
      id: r.id,
      requesterId: u(r.requester),
      title: r.title,
      description: r.description,
      barrierType: r.barrierType,
      tags: JSON.stringify(r.tags),
      province: r.province,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.createdAt,
    });
    requestIds[r.title] = r.id;
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
  for (const o of offers) {
    insert("PeerOffer", {
      id: uid("po"),
      helpRequestId: requestIds[o.helpRequest],
      helperId: u(o.helper),
      initiator: o.initiator,
      message: o.message,
      status: o.status,
      createdAt: o.createdAt,
      respondedAt: o.respondedAt ?? null,
    });
  }

  const cooperations = [
    {
      id: uid("pc"),
      helpRequest: "برخورد با سوءتغذیه کودکان",
      requester: "09120000107",
      helper: "09120000105",
      goal: "برنامه پیگیری منظم وزن کودکان سوءتغذیه",
      status: "active",
      createdAt: ago(7),
    },
    {
      id: uid("pc"),
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
      id: uid("pc"),
      requester: "09120000110",
      helper: "09120000101",
      goal: "هماهنگی برنامه ایمن‌سازی تکمیلی",
      status: "closed",
      closedAt: ago(15),
      createdAt: ago(22),
    },
  ];
  for (const c of cooperations) {
    insert("PeerCooperation", {
      id: c.id,
      helpRequestId: c.helpRequest ? requestIds[c.helpRequest] : null,
      requesterId: u(c.requester),
      helperId: u(c.helper),
      goal: c.goal,
      status: c.status,
      outcomeSummary: c.outcomeSummary ?? null,
      requesterRating: c.requesterRating ?? null,
      helperRating: c.helperRating ?? null,
      completedAt: c.completedAt ?? null,
      closedAt: c.closedAt ?? null,
      createdAt: c.createdAt,
      updatedAt: c.completedAt ?? c.closedAt ?? c.createdAt,
    });
  }

  // thread-based messages in the active cooperation
  insert("PeerMessage", {
    id: uid("pm"),
    cooperationId: cooperations[0].id,
    senderId: u("09120000107"),
    body: "سلام؛ هفته گذشته وزن سه کودک را ثبت کردم و برنامه را شروع کردیم.",
    createdAt: ago(5),
  });
  insert("PeerMessage", {
    id: uid("pm"),
    cooperationId: cooperations[0].id,
    senderId: u("09120000105"),
    body: "عالی است. لطفاً نتیجه هر هفته را در همین گفتگو ثبت کنید تا بررسی کنیم.",
    createdAt: ago(4),
  });
}

// --------------------------------------------------------------- academy -----

function seedAcademy(users, ref) {
  const u = (phone) => users.find((row) => row.phone === phone).id;
  const tagId = (name) => {
    const existing = db.prepare("SELECT id FROM Tag WHERE name = ?").get(name);
    if (existing) return existing.id;
    const id = uid("t");
    insert("Tag", { id, name, isActive: 1 });
    return id;
  };

  const course1 = {
    id: uid("co"),
    slug: "barname-gharbal-feshar-diyabet",
    title: "برنامه غربالگری فشار خون و دیابت",
    description: "شناسایی افراد در معرض خطر، پیگیری و ارجاع به‌موقع در برنامه غربالگری.",
    level: "beginner",
    status: "published",
    owner: "09120000102",
    emoji: "🩺",
    publishedAt: ago(15),
    tags: ["غربالگری", "دیابت"],
    relatedProblemTitle: "ساماندهی آموزش همگانی دیابت در روستاهای دورافتاده",
    lessons: [
      {
        title: "شناسایی افراد در معرض خطر",
        summary: "معیارهای غربالگری و ابزار اندازه‌گیری",
        body: "در این درس معیارهای اصلی شناسایی افراد در معرض خطر فشار خون و دیابت را مرور می‌کنیم و نحوه استفاده از دستگاه فشارسنج و گلوکومتر را می‌آموزیم.",
        order: 1,
        quiz: [
          {
            question: "معیار اصلی تشخیص فشار خون بالا در غربالگری چیست؟",
            options: [
              { text: "فشار سیستول بالای ۱۲۰" },
              { text: "فشار سیستول بالای ۱۴۰ در دو نوبت" },
              { text: "فشار دیاستول بالای ۸۰ در یک نوبت" },
              { text: "تنها بر اساس سن" },
            ],
            correctIndex: 1,
            explanation: "فشار سیستول بالای ۱۴۰ در دو نوبت جداگانه معیار اصلی است.",
          },
          {
            question: "کدام گروه در اولویت غربالگری دیابت قرار دارد؟",
            options: [
              { text: "فقط افراد علامت‌دار" },
              { text: "افراد دارای سابقه خانوادگی و اضافه‌وزن" },
              { text: "کودکان زیر ۵ سال" },
              { text: "همه افراد به‌طور تصادفی" },
            ],
            correctIndex: 1,
            explanation: "سابقه خانوادگی و اضافه‌وزن از عوامل خطر اصلی هستند.",
          },
        ],
      },
      {
        title: "پیگیری و ارجاع به‌موقع",
        summary: "ثبت نتایج و پیگیری موارد مشکوک",
        body: "نحوه ثبت نتایج در پرونده، پیگیری موارد مشکوک و ارجاع به‌موقع به پزشک را تمرین می‌کنیم.",
        order: 2,
        quiz: [],
      },
    ],
  };

  const course2 = {
    id: uid("co"),
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
        title: "اصول گفت‌وگوی مؤثر",
        summary: "شنیدن فعال و پیام رسا",
        body: "در این درس اصول گفت‌وگوی مؤثر، شنیدن فعال و انتقال پیام سلامت به زبان ساده را می‌آموزیم.",
        order: 1,
        quiz: [
          {
            question: "اولین قدم در گفت‌وگو با خانواده نگران چیست؟",
            options: [
              { text: "ارائه سریع توصیه" },
              { text: "شنیدن نگرانی بدون قضاوت" },
              { text: "انجام کارهای دیگر به‌طور همزمان" },
              { text: "قانع‌کردن با اصرار" },
            ],
            correctIndex: 1,
            explanation: "شنیدن نگرانی بدون قضاوت، پایه اعتماد است.",
          },
        ],
      },
    ],
  };

  const draftCourse = {
    id: uid("co"),
    slug: "amoozesh-salamat-dar-roosta",
    title: "آموزش سلامت در روستا",
    description: "پیش‌نویس دوره آموزش سلامت برای مناطق روستایی.",
    level: "beginner",
    status: "draft",
    owner: "09120000101",
    emoji: "📚",
    createdAt: ago(2),
    lessons: [],
  };

  const courses = [course1, course2];
  for (const c of courses) {
    insert("Course", {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      level: c.level,
      status: c.status,
      ownerId: u(c.owner),
      version: 1,
      reviewedAt: c.publishedAt,
      emoji: c.emoji,
      isPaid: 0,
      relatedProblemId: c.relatedProblemTitle
        ? ref.problemIds[c.relatedProblemTitle]
        : null,
      publishedAt: c.publishedAt,
      createdAt: c.publishedAt,
      updatedAt: c.publishedAt,
    });
    for (const tag of c.tags) {
      insert("CourseTag", { courseId: c.id, tagId: tagId(tag) });
    }
    for (const lesson of c.lessons) {
      const lessonId = uid("l");
      insert("Lesson", {
        id: lessonId,
        courseId: c.id,
        title: lesson.title,
        summary: lesson.summary,
        body: lesson.body,
        contentType: "text",
        durationMinutes: 15,
        order: lesson.order,
        isOptional: 0,
        createdAt: c.publishedAt,
        updatedAt: c.publishedAt,
      });
      lesson._id = lessonId;
      for (const [qi, q] of lesson.quiz.entries()) {
        insert("CourseQuizQuestion", {
          id: uid("q"),
          lessonId,
          question: q.question,
          options: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? null,
          order: qi,
        });
      }
    }
  }
  insert("Course", {
    id: draftCourse.id,
    slug: draftCourse.slug,
    title: draftCourse.title,
    description: draftCourse.description,
    level: draftCourse.level,
    status: draftCourse.status,
    ownerId: u(draftCourse.owner),
    version: 1,
    emoji: draftCourse.emoji,
    isPaid: 0,
    publishedAt: null,
    createdAt: draftCourse.createdAt,
    updatedAt: draftCourse.createdAt,
  });

  // enrollments + progress + quiz attempts + field applications
  const enrollments = {
    [course1.id]: ["09120000103", "09120000105", "09120000106", "09120000107", "09120000108", "09120000109", "09120000110"],
    [course2.id]: ["09120000102", "09120000104", "09120000105", "09120000106"],
  };
  for (const [courseId, phones] of Object.entries(enrollments)) {
    for (const phone of phones) {
      insert("CourseEnrollment", {
        id: uid("en"),
        courseId,
        userId: u(phone),
        enrolledAt: ago(8),
      });
    }
  }

  // progress on course1 lessons for a few users
  const lesson1 = course1.lessons[0]._id;
  const lesson2 = course1.lessons[1]._id;
  const progressRows = [
    { lessonId: lesson1, user: "09120000103", status: "completed", quizPassed: 1, completedAt: ago(5) },
    { lessonId: lesson2, user: "09120000103", status: "in_progress", quizPassed: 0, completedAt: null },
    { lessonId: lesson1, user: "09120000105", status: "in_progress", quizPassed: 0, completedAt: null },
    { lessonId: lesson1, user: "09120000106", status: "completed", quizPassed: 1, completedAt: ago(4) },
  ];
  for (const p of progressRows) {
    insert("LessonProgress", {
      id: uid("lp"),
      lessonId: p.lessonId,
      userId: u(p.user),
      status: p.status,
      quizPassed: p.quizPassed,
      completedAt: p.completedAt,
      createdAt: ago(7),
      updatedAt: p.completedAt ?? ago(5),
    });
  }

  const attempts = [
    { lessonId: lesson1, user: "09120000103", score: 2, total: 2, passed: 1, createdAt: ago(5) },
    { lessonId: lesson1, user: "09120000105", score: 1, total: 2, passed: 0, createdAt: ago(5) },
    { lessonId: lesson1, user: "09120000106", score: 2, total: 2, passed: 1, createdAt: ago(4) },
  ];
  for (const a of attempts) {
    insert("QuizAttempt", {
      id: uid("qa"),
      lessonId: a.lessonId,
      userId: u(a.user),
      score: a.score,
      total: a.total,
      passed: a.passed ? 1 : 0,
      createdAt: a.createdAt,
    });
  }

  const fieldApps = [
    { lessonId: lesson1, courseId: course1.id, user: "09120000103", summary: "در جلسه غربالگری این هفته اجرا شد.", outcome: "successful", createdAt: ago(3) },
    { lessonId: lesson2, courseId: course1.id, user: "09120000106", summary: "پیگیری موارد مشکوک شروع شد.", outcome: "partial", createdAt: ago(2) },
  ];
  for (const a of fieldApps) {
    insert("FieldApplication", {
      id: uid("fa"),
      lessonId: a.lessonId,
      courseId: a.courseId,
      userId: u(a.user),
      summary: a.summary,
      outcome: a.outcome,
      createdAt: a.createdAt,
    });
  }

  return { course1, course2 };
}

// --------------------------------------------------------------- benefits ----

function seedBenefits(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  const providers = [
    {
      id: uid("bp"),
      name: "مرکز آموزش ضمن خدمت بهورزان",
      category: "education",
      description: "دوره‌های کوتاه آموزش ضمن خدمت برای بهورزان عضو جامعه.",
      terms: "ثبت‌نام از طریق جامعه و رزرو آنلاین",
      logoEmoji: "🎓",
      isSponsored: 0,
      status: "approved",
      createdBy: "09120000101",
      publishedAt: ago(20),
    },
    {
      id: uid("bp"),
      name: "تأمین لوازم بهداشتی روستایی",
      category: "equipment",
      description: "تأمین اقلام پایه بهداشتی با شرایط ویژه برای اعضا.",
      terms: "تحویل از انبار مرکزی با معرفی‌نامه جامعه",
      logoEmoji: "🧰",
      isSponsored: 0,
      status: "approved",
      createdBy: "09120000101",
      publishedAt: ago(18),
    },
    {
      id: uid("bp"),
      name: "باشگاه سلامت و بیمه تکمیلی",
      category: "insurance",
      description: "بسته بیمه تکمیلی سلامت با پوشش‌های ویژه اعضای شبکه.",
      terms: "ویژه اعضای تأییدشده؛ شرایط در سایت اعلام شده است.",
      logoEmoji: "🛡️",
      isSponsored: 1,
      status: "approved",
      createdBy: "09120000101",
      publishedAt: ago(12),
    },
    {
      id: uid("bp"),
      name: "همکاری با داروخانه‌های منتخب",
      category: "retail",
      description: "پیش‌نویس ارائه‌دهنده در انتظار تکمیل اطلاعات.",
      terms: "در حال بررسی",
      isSponsored: 0,
      status: "draft",
      createdBy: "09120000101",
      publishedAt: null,
      createdAt: ago(2),
    },
  ];

  const providerIds = {};
  for (const p of providers) {
    insert("BenefitProvider", {
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      terms: p.terms,
      logoEmoji: p.logoEmoji,
      isSponsored: p.isSponsored,
      status: p.status,
      createdById: u(p.createdBy),
      publishedAt: p.publishedAt,
      createdAt: p.publishedAt ?? p.createdAt,
      updatedAt: p.publishedAt ?? p.createdAt,
    });
    providerIds[p.name] = p.id;
  }

  const usages = [
    { provider: "مرکز آموزش ضمن خدمت بهورزان", user: "09120000103", satisfaction: 5, note: "دوره کاربردی و مفید بود." },
    { provider: "مرکز آموزش ضمن خدمت بهورزان", user: "09120000105", satisfaction: 4, note: "محتوا خوب بود؛ زمان کوتاه بود." },
    { provider: "تأمین لوازم بهداشتی روستایی", user: "09120000106", satisfaction: 4, note: "اقلام به‌موقع رسید." },
    { provider: "تأمین لوازم بهداشتی روستایی", user: "09120000107", satisfaction: 5 },
    { provider: "باشگاه سلامت و بیمه تکمیلی", user: "09120000109", satisfaction: 3, note: "فرآیند ثبت‌نام طولانی بود." },
    { provider: "باشگاه سلامت و بیمه تکمیلی", user: "09120000110", satisfaction: 4 },
  ];
  for (const usage of usages) {
    insert("BenefitUsage", {
      id: uid("bu"),
      providerId: providerIds[usage.provider],
      userId: u(usage.user),
      note: usage.note ?? null,
      satisfaction: usage.satisfaction,
      createdAt: ago(4),
    });
  }

  const reports = [
    { provider: "باشگاه سلامت و بیمه تکمیلی", reporter: "09120000104", reason: "misleading", note: "توضیحات پوشش‌ها شفاف نیست.", createdAt: ago(2) },
    { provider: "تأمین لوازم بهداشتی روستایی", reporter: "09120000102", reason: "issue_service", note: "تأخیر در تحویل یک مورد", createdAt: ago(3) },
  ];
  for (const r of reports) {
    insert("BenefitReport", {
      id: uid("br"),
      providerId: providerIds[r.provider],
      reporterId: u(r.reporter),
      reason: r.reason,
      note: r.note,
      status: "pending",
      createdAt: r.createdAt,
    });
  }

  // participatory budget
  const proposals = [
    {
      id: uid("bpr"),
      author: "09120000101",
      title: "خرید ترازوی دیجیتال برای پایگاه‌ها",
      description: "تجهیز پایگاه‌های سلامت به ترازوی دیجیتال دقیق برای اندازه‌گیری کودک.",
      category: "equipment",
      amountEstimate: "۱۵ میلیون تومان",
      status: "voting",
      createdAt: ago(9),
    },
    {
      id: uid("bpr"),
      author: "09120000104",
      title: "دوره آموزش احیای قلبی و ریوی",
      description: "برگزاری دوره عملی احیای قلبی برای همه بهورزان استان.",
      category: "training",
      amountEstimate: "۸ میلیون تومان",
      status: "under_review",
      createdAt: ago(6),
    },
    {
      id: uid("bpr"),
      author: "09120000105",
      title: "تأمین ملزومات آموزش سلامت",
      description: "خرید ملزومات پایه برای اتاق آموزش خانه‌های بهداشت.",
      category: "equipment",
      amountEstimate: "۵ میلیون تومان",
      status: "approved",
      createdAt: ago(14),
    },
    {
      id: uid("bpr"),
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
      id: uid("bpr"),
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
    insert("BudgetProposal", {
      id: p.id,
      authorId: u(p.author),
      title: p.title,
      description: p.description,
      category: p.category,
      amountEstimate: p.amountEstimate,
      status: p.status,
      implementedAt: p.implementedAt ?? null,
      createdAt: p.createdAt,
      updatedAt: p.implementedAt ?? p.createdAt,
    });
  }

  const votingProposalId = proposals.find((p) => p.status === "voting").id;
  const voterPhones = ["09120000102", "09120000103", "09120000105", "09120000106", "09120000107", "09120000108", "09120000109", "09120000110"];
  for (const phone of voterPhones) {
    insert("BudgetProposalVote", {
      id: uid("bv"),
      proposalId: votingProposalId,
      userId: u(phone),
      createdAt: ago(7),
    });
  }

  const implemented = proposals.find((p) => p.status === "implemented");
  insert("BudgetImplementation", {
    id: uid("bi"),
    proposalId: implemented.id,
    summary: "تعمیر سقف و رفع رطوبت با همکاری واحد پشتیبانی انجام شد.",
    expenses: JSON.stringify([
      { item: "مصالح", amount: "۱۲ میلیون تومان" },
      { item: "دستمزد", amount: "۸ میلیون تومان" },
    ]),
    reportedById: u("09120000106"),
    createdAt: implemented.implementedAt,
  });
}

// -------------------------------------------------------------- campaigns ----

function seedCampaigns(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  const campaigns = [
    {
      id: uid("cp"),
      family: "learning",
      title: "چالش ثبت تجربه‌های میدانی",
      description: "تجربه‌های واقعی خود را از میدان ثبت و به اشتراک بگذارید تا دانش جامعه غنی‌تر شود.",
      status: "active",
      startsAt: ago(2),
      endsAt: ahead(20),
      createdBy: "09120000101",
      publishedAt: ago(2),
      participants: ["09120000102", "09120000103", "09120000104", "09120000105", "09120000106"],
    },
    {
      id: uid("cp"),
      family: "cooperation",
      title: "همکاری در برنامه غربالگری",
      description: "هم‌افزایی بهورزان برای اجرای بهتر برنامه‌های غربالگری استانی.",
      status: "active",
      startsAt: ago(5),
      endsAt: ahead(15),
      createdBy: "09120000101",
      publishedAt: ago(5),
      participants: ["09120000102", "09120000105", "09120000107", "09120000109"],
    },
    {
      id: uid("cp"),
      family: "innovation",
      title: "بهسازی خانه بهداشت",
      description: "ارائه ایده‌های ساده برای بهبود فضا و کارایی خانه‌های بهداشت.",
      status: "active",
      startsAt: ago(3),
      endsAt: ahead(10),
      createdBy: "09120000101",
      publishedAt: ago(3),
      participants: ["09120000104", "09120000108", "09120000110"],
    },
    {
      id: uid("cp"),
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

  for (const c of campaigns) {
    insert("Campaign", {
      id: c.id,
      family: c.family,
      title: c.title,
      description: c.description,
      status: c.status,
      startsAt: c.startsAt ?? null,
      endsAt: c.endsAt ?? null,
      isOptional: 1,
      createdById: u(c.createdBy),
      publishedAt: c.publishedAt,
      createdAt: c.publishedAt ?? c.createdAt,
      updatedAt: c.publishedAt ?? c.createdAt,
    });
    for (const phone of c.participants) {
      insert("CampaignParticipation", {
        id: uid("cpart"),
        campaignId: c.id,
        userId: u(phone),
        createdAt: c.publishedAt,
      });
    }
  }
}

// ------------------------------------------------------------------ tools ----

function seedTools(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  const tools = [
    {
      id: uid("to"),
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
      id: uid("to"),
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
      id: uid("to"),
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
      id: uid("to"),
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

  for (const t of tools) {
    insert("Tool", {
      id: t.id,
      slug: t.slug,
      kind: t.kind,
      title: t.title,
      summary: t.summary,
      body: t.body,
      status: t.publishedAt ? "published" : "draft",
      version: 1,
      reviewedAt: t.publishedAt ?? null,
      tags: JSON.stringify(t.tags),
      createdById: u(t.createdBy),
      publishedAt: t.publishedAt,
      createdAt: t.publishedAt ?? t.createdAt,
      updatedAt: t.publishedAt ?? t.createdAt,
    });
  }
}

// --------------------------------------------------------------- reporting ---

function seedGovernance(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  // content reports for the moderation queue
  const reports = [
    { reporter: "09120000107", problemTitle: "راهکاری برای کاهش مراجعه‌های تکراری جهت تکمیل پرونده سلامت", reason: "نامربوط", note: "پاسخ کوتاه و بدون جزئیات", createdAt: ago(1) },
    { reporter: "09120000109", experienceSlug: "payesh-ghad-vazn-kodakan-dar-madreseh", reason: "اطلاعات ناقص", note: "نتیجه نهایی ثبت نشده است", createdAt: ago(2) },
  ];
  const problemId = (title) =>
    db.prepare("SELECT id FROM Problem WHERE title = ?").get(title)?.id;
  const experienceId = (slug) =>
    db.prepare("SELECT id FROM Experience WHERE slug = ?").get(slug)?.id;
  for (const r of reports) {
    insert("ContentReport", {
      id: uid("cr"),
      reporterId: u(r.reporter),
      problemId: r.problemTitle ? problemId(r.problemTitle) : null,
      experienceId: r.experienceSlug ? experienceId(r.experienceSlug) : null,
      reason: r.reason,
      note: r.note,
      status: "pending",
      createdAt: r.createdAt,
    });
  }

  // appeals
  const appealProblemId = problemId("کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت");
  const appeals = [
    { user: "09120000106", targetType: "problem", targetId: appealProblemId, reason: "اعتراض به مخفی‌سازی اشتباه مسئله", status: "pending", createdAt: ago(2) },
    { user: "09120000110", targetType: "account", targetId: "09120000110", reason: "درخواست رفع محدودیت حساب", status: "pending", createdAt: ago(3) },
    { user: "09120000103", targetType: "experience", targetId: "n/a", reason: "اعتراض به تصمیم ناظر درباره یک تجربه", status: "approved", decisionNote: "پس از بازبینی، اعتراض پذیرفته شد.", decidedBy: "09120000101", decidedAt: ago(4), createdAt: ago(8) },
  ];
  for (const a of appeals) {
    insert("Appeal", {
      id: uid("ap"),
      userId: u(a.user),
      targetType: a.targetType,
      targetId: a.targetId,
      reason: a.reason,
      status: a.status,
      decisionNote: a.decisionNote ?? null,
      decidedBy: a.decidedBy ? u(a.decidedBy) : null,
      decidedAt: a.decidedAt ?? null,
      createdAt: a.createdAt,
    });
  }

  // sensitive terms
  for (const term of ["پورسانت", "معاوضه"]) {
    if (db.prepare("SELECT 1 FROM SensitiveTerm WHERE term = ?").get(term)) continue;
    insert("SensitiveTerm", {
      id: uid("st"),
      term,
      description: "واژه مرتبط با فعالیت‌های غیرحرفه‌ای",
      isActive: 1,
      createdById: u("09120000101"),
      createdAt: ago(30),
    });
  }

  // moderation decision history
  const decisions = [
    { moderator: "09120000101", targetType: "user", targetId: u("09120000110"), action: "warn", reason: "استفاده از واژه‌های نامناسب", createdAt: ago(6) },
    { moderator: "09120000108", targetType: "user", targetId: u("09120000109"), action: "lift", reason: "بازگشت وضعیت عادی پس از توضیح", createdAt: ago(5) },
  ];
  for (const d of decisions) {
    insert("ModerationDecision", {
      id: uid("md"),
      moderatorId: u(d.moderator),
      targetType: d.targetType,
      targetId: d.targetId,
      action: d.action,
      reason: d.reason,
      createdAt: d.createdAt,
    });
  }
}

// ------------------------------------------------------------ notifications ---

function seedNotifications(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;
  const problemId = (title) =>
    db.prepare("SELECT id FROM Problem WHERE title = ?").get(title)?.id;
  const circleId = (name) =>
    db.prepare("SELECT id FROM Circle WHERE name = ?").get(name)?.id;
  const coopId = db.prepare("SELECT id FROM PeerCooperation LIMIT 1").get()?.id;

  const notifications = [
    { user: "09120000106", type: "problem_answer", actor: "09120000103", title: "پاسخ جدید به مسئله شما", body: "بهرام کاظمی به مسئله شما پاسخ داد.", targetType: "problem", targetId: problemId("کمبود فرم‌های چاپی غربالگری فشار خون در خانه بهداشت"), read: 0, createdAt: ago(2, 4) },
    { user: "09120000106", type: "cooperation_offer", actor: "09120000102", title: "پیشنهاد همیاری جدید", body: "لیلا صادقی برای درخواست همیاری شما پیشنهاد داد.", targetType: "cooperation", targetId: coopId, read: 0, createdAt: ago(1, 2) },
    { user: "09120000102", type: "solution_selected", actor: "09120000107", title: "راهکار شما انتخاب شد", body: "پاسخ شما به‌عنوان راهکار مسئله انتخاب شد.", targetType: "problem", targetId: problemId("استقبال کم روستاییان از واکسیناسیون آنفلوانزا"), read: 1, readAt: ago(12), createdAt: ago(13) },
    { user: "09120000105", type: "circle_meeting", actor: "09120000104", title: "جلسه جدید حلقه", body: "جلسه «برنامه‌ریزی آموزش دیابت» ثبت شد.", targetType: "circle", targetId: circleId("حلقه ارتقای سلامت روستا"), read: 0, createdAt: ago(1) },
    { user: "09120000106", type: "circle_invite", actor: "09120000101", title: "دعوت به حلقه", body: "شما به حلقه «حلقه مدیریت پرونده‌های سلامت» دعوت شدید.", targetType: "circle", targetId: circleId("حلقه مدیریت پرونده‌های سلامت"), read: 0, createdAt: ago(2) },
    { user: "09120000107", type: "cooperation_message", actor: "09120000105", title: "پیام جدید در همکاری", body: "سعید جعفری پیام جدیدی ارسال کرد.", targetType: "cooperation", targetId: coopId, read: 0, createdAt: ago(4) },
    { user: "09120000109", type: "budget_proposal_reviewed", actor: "09120000101", title: "بررسی پیشنهاد بودجه", body: "پیشنهاد بودجه شما بررسی شد.", targetType: "budget_proposal", read: 0, createdAt: ago(3) },
    { user: "09120000101", type: "circle_join_accepted", actor: "09120000110", title: "عضو جدید حلقه", body: "سارا نعمتی به حلقه شما پیوست.", targetType: "circle", targetId: circleId("حلقه مدیریت پرونده‌های سلامت"), read: 1, readAt: ago(1), createdAt: ago(2) },
    { user: "09120000110", type: "appeal_decision", actor: "09120000101", title: "نتیجه اعتراض شما", body: "نتیجه اعتراض شما ثبت شد.", targetType: "appeal", read: 0, createdAt: ago(2) },
    { user: "09120000103", type: "benefit_report_resolved", actor: "09120000101", title: "گزارش مزیت بررسی شد", body: "گزارش شما درباره یک مزیت بررسی شد.", targetType: "benefit_provider", read: 1, readAt: ago(1), createdAt: ago(2) },
    { user: "09120000104", type: "problem_answer", actor: "09120000105", title: "پاسخ جدید", body: "سعید جعفری به مسئله مورد نظر پاسخ داد.", targetType: "problem", targetId: problemId("نبود راهنمای واحد برای مراقبت از مادران باردار پرخطر"), read: 1, readAt: ago(15), createdAt: ago(16) },
    { user: "09120000108", type: "circle_join_accepted", actor: "09120000109", title: "عضو جدید حلقه", body: "کاوه ابراهیمی به حلقه شما پیوست.", targetType: "circle", targetId: circleId("حلقه بهورزان جوان"), read: 0, createdAt: ago(2) },
  ];

  for (const n of notifications) {
    insert("Notification", {
      id: uid("n"),
      userId: u(n.user),
      type: n.type,
      actorId: n.actor ? u(n.actor) : null,
      title: n.title,
      body: n.body ?? null,
      targetType: n.targetType ?? null,
      targetId: n.targetId ?? null,
      read: n.read ? 1 : 0,
      readAt: n.readAt ?? null,
      createdAt: n.createdAt,
    });
  }

  // a few notification preferences (non-empty settings page)
  const types = ["problem_answer", "solution_selected", "cooperation_offer", "cooperation_message", "circle_invite"];
  for (const phone of ["09120000101", "09120000103", "09120000105"]) {
    for (const type of types) {
      insert("NotificationPreference", {
        id: uid("np"),
        userId: u(phone),
        type,
        enabled: 1,
        updatedAt: ago(1),
      });
    }
  }
}

// ------------------------------------------------------------------ audit ----

function seedAudit(users) {
  const u = (phone) => users.find((row) => row.phone === phone).id;

  const entries = [
    ...demoPhones.map((phone) => ({
      actor: phone,
      action: "auth.signin",
      entityType: "User",
      entityId: null,
      createdAt: ago(2),
    })),
    { actor: "09120000103", action: "profile.update", entityType: "User", createdAt: ago(4) },
    { actor: "09120000105", action: "profile.update", entityType: "User", createdAt: ago(5) },
    { actor: "09120000106", action: "problem.create", entityType: "Problem", createdAt: ago(2, 3) },
    { actor: "09120000107", action: "problem.create", entityType: "Problem", createdAt: ago(4) },
    { actor: "09120000103", action: "experience.create", entityType: "Experience", createdAt: ago(16) },
    { actor: "09120000107", action: "experience.create", entityType: "Experience", createdAt: ago(12) },
    { actor: "09120000104", action: "circle.create", entityType: "Circle", createdAt: ago(30) },
    { actor: "09120000107", action: "peer.cooperation.goal", entityType: "PeerCooperation", createdAt: ago(7) },
    { actor: "09120000101", action: "interaction.follow", entityType: "Follow", createdAt: ago(3) },
    { actor: "09120000101", action: "membership.approve", entityType: "MembershipRequest", createdAt: ago(20) },
    { actor: "09120000105", action: "experience.reuse", entityType: "ExperienceReuse", createdAt: ago(2) },
  ];

  for (const e of entries) {
    insert("AuditLog", {
      id: uid("al"),
      actorId: u(e.actor),
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId ?? null,
      ip: "::1",
      createdAt: e.createdAt,
    });
  }
}

// --------------------------------------------------------------- main -------

function main() {
  console.log(`Seeding demo data into ${dbPath} …`);

  const users = seedUsers();
  console.log(`  users: ${users.length}`);

  if (!hasDemoContent("Problem", "authorId")) {
    const ref = seedProblems(users);
    const experienceIds = seedExperiences(users, ref);
    seedInteractions(users, ref, experienceIds);
    seedCircles(users);
    seedPeer(users);
    seedAcademy(users, ref);
    seedBenefits(users);
    seedCampaigns(users);
    seedTools(users);
    seedGovernance(users);
    seedNotifications(users);
    seedAudit(users);
    console.log("  content: created");
  } else {
    console.log("  content: already present, skipping (idempotent seed)");
  }

  const summary = [
    ["User", "User"],
    ["Problem", "Problem"],
    ["ProblemAnswer", "ProblemAnswer"],
    ["Experience", "Experience"],
    ["Circle", "Circle"],
    ["CircleMembership", "CircleMembership"],
    ["PeerHelpRequest", "PeerHelpRequest"],
    ["PeerCooperation", "PeerCooperation"],
    ["Course", "Course"],
    ["Lesson", "Lesson"],
    ["BenefitProvider", "BenefitProvider"],
    ["BudgetProposal", "BudgetProposal"],
    ["Campaign", "Campaign"],
    ["Tool", "Tool"],
    ["Notification", "Notification"],
    ["Appeal", "Appeal"],
    ["MembershipRequest", "MembershipRequest"],
    ["ContentReport", "ContentReport"],
    ["AuditLog", "AuditLog"],
    ["Session", "Session"],
  ];
  console.log("\nRow counts:");
  for (const [table] of summary) {
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get();
    console.log(`  ${table.padEnd(20)} ${n}`);
  }

  console.log("\nDemo users (phone / role / name):");
  for (const row of db
    .prepare(
      `SELECT phone, role, displayName FROM User WHERE phone LIKE '${DEMO_PHONE_LIKE}' ORDER BY phone`,
    )
    .all()) {
    console.log(`  ${row.phone}  ${row.role.padEnd(20)} ${row.displayName}`);
  }

  console.log("\nSeed complete.");
}

const runSeed = db.transaction(() => {
  main();
});
runSeed();
db.close();