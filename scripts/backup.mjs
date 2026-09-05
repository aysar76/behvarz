#!/usr/bin/env node
/**
 * Backup script for the SQLite database.
 *
 * Uses better-sqlite3's online backup API (a consistent snapshot even while
 * the app is running). Usage:
 *
 *   node scripts/backup.mjs [--out <dir>] [--db <path>]
 *
 * - `--out` defaults to `./backups`
 * - `--db`  defaults to the value of DATABASE_URL (file: prefix allowed) or
 *           `./dev.db`
 */
import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

function parseArgs(argv) {
  const args = { out: "backups" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--db") args.db = argv[++i];
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

mkdirSync(args.out, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = join(args.out, `behvarz-${timestamp}.db`);

const db = new Database(dbPath, { readonly: true });
try {
  await db.backup(dest);
} finally {
  db.close();
}

console.log(`Backup written to ${dest}`);
