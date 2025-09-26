import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join("prisma", "migrations");
const lockFile = join(migrationsDir, "migration_lock.toml");
const schemaPath = join("prisma", "schema.prisma");
const outputPath = join("prisma", "d1-migration.sql");

const hasLock = existsSync(lockFile);

const args = [
  "prisma",
  "migrate",
  "diff",
  hasLock ? "--from-migrations" : "--from-empty",
  hasLock ? migrationsDir : undefined,
  "--to-schema-datamodel",
  schemaPath,
  "--script",
].filter(Boolean) as string[];

const result = spawnSync("npx", args, { encoding: "utf8" });

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || "\n");
  process.exit(result.status ?? 1);
}

const sql = result.stdout.trim();

if (!sql) {
  if (existsSync(outputPath)) {
    unlinkSync(outputPath);
  }
  console.log("No schema changes detected; skipped writing prisma/d1-migration.sql");
  process.exit(0);
}

writeFileSync(outputPath, `${sql}\n`);

console.log(`Wrote Cloudflare D1 migration script to ${outputPath}`);
console.log(
  "Apply with: wrangler d1 execute <DB_NAME> --remote --file prisma/d1-migration.sql"
);
