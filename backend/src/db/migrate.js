const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function migrate() {
  const dbName = process.env.DB_NAME || "moonpelis";
  const user = process.env.DB_USERNAME || "postgres";
  const password = process.env.DB_PASSWORD || "1234";
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 5432;

  console.log(`[Migración] Conectando a PostgreSQL para verificar base de datos '${dbName}'...`);

  const rootClient = new Client({ host, port, user, password, database: "postgres" });

  try {
    await rootClient.connect();
    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`[Migración] Creando base de datos '${dbName}'...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[Migración] Base de datos '${dbName}' creada con éxito.`);
    } else {
      console.log(`[Migración] La base de datos '${dbName}' ya existe.`);
    }
  } catch (err) {
    console.error("[Migración Error] Falló al verificar o crear la base de datos:", err.message);
  } finally {
    await rootClient.end();
  }

  // Ejecutar script SQL de esquema
  const dbClient = new Client({ host, port, user, password, database: dbName });
  try {
    await dbClient.connect();
    const schemaPath = path.join(__dirname, "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");
    await dbClient.query(sql);
    console.log("[Migración] Esquema SQL aplicado exitosamente.");
  } catch (err) {
    console.error("[Migración Error] Falló al aplicar el esquema SQL:", err.message);
  } finally {
    await dbClient.end();
  }
}

migrate();
