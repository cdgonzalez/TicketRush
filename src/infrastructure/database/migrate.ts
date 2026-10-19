import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { env } from "../../config/env";

async function migrate() {
  const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
  });

  const sqlPath = path.resolve(__dirname, "../../../001_intial_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Running database migration: 001_intial_schema.sql...");
  await pool.query(sql);
  console.log("Migration completed successfully.");
  await pool.end();
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}

export { migrate };
