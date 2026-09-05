#!/usr/bin/env node
/**
 * Restore script for the SQLite database.
 *
 * Restores a backup file created by `scripts/backup.mjs` to a target path.
 * The application must be stopped before restoring (it holds the file lock).
 * Usage:
 *
 *   node scripts/restore.mjs <backup-file> [--db <path>]
 *
 * - `<backup-file>` is the path to a `behvarz-*.db` backup file
 * - `--db` defaults to the value of DATABASE_URL (file: prefix allowed) or
 *   `./dev.db`
 */
import { copyFileSync, existsSync } from "node:fs";
import Database from "better-sqlite3";

function parseArgs(argv) {
  const args = { db: process.env.DATABASE_URL };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--db") args.db = argv[++i];
    else positional.push(argv[i]);
  }
  args.source = positional[0];
  return args;
}

function resolveDbPath(raw) {
  if (!raw) return "./dev.db";
  return raw.replace(/^file:/, "");
}

const args = parseArgs(process.argv);

if (!args.source) {
  console.error("Usage: node scripts/restore.mjs <backup-file> [--db <path>]");
  process.exit(1);
}
if (!existsSync(args.source)) {
  console.error(`Backup file not found: ${args.source}`);
  process.exit(1);
}

const targetPath = resolveDbPath(args.db);

if (!existsSync(targetPath)) {
  console.error(`Target database not found: ${targetPath}`);
  process.exit(1);
}

console.log(`Restoring ${args.source} -> ${targetPath}`);

// Integrity-check the backup file before replacing the live database.
const db = new Database(args.source, { readonly: true });
try {
  const result = db.pragma("integrity_check", { simple: true });
  if (result !== "ok") {
    console.error(`Backup failed integrity check: ${result}`);
    process.exit(1);
  }
} finally {
  db.close();
}

copyFileSync(args.source, targetPath);
console.log("Restore completed.");
