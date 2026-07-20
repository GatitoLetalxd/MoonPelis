const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const bcrypt = require("bcryptjs");
const { query } = require("./index");

async function seedAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@moonpelis.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const existing = await query(`SELECT * FROM users WHERE username = $1 OR email = $2`, [
      adminUsername,
      adminEmail,
    ]);

    if (existing.rowCount > 0) {
      console.log(`[Seed] El usuario administrador '${adminUsername}' ya existe.`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 año

    await query(
      `INSERT INTO users (username, email, password, role, avatar, expires_at)
       VALUES ($1, $2, $3, 'admin', 'avatar_01.png', $4)`,
      [adminUsername, adminEmail, hash, expiresAt]
    );

    console.log(`===============================================`);
    console.log(`[Seed] Administrador inicial creado con éxito!`);
    console.log(`Usuario: ${adminUsername}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Contraseña: ${adminPassword}`);
    console.log(`===============================================`);
  } catch (err) {
    console.error("[Seed Error] Error creando administrador:", err.message);
  }
}

seedAdmin();
