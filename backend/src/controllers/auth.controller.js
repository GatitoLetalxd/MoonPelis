const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET;

// SEC-05: Cookie options centralizadas
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  };
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    const existing = await query(
      `SELECT id FROM users WHERE username = $1 OR email = $2`,
      [username, email]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({ error: "El usuario o correo electrónico ya está registrado." });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días iniciales

    const insertRes = await query(
      `INSERT INTO users (username, email, password, role, avatar, expires_at)
       VALUES ($1, $2, $3, 'user', 'avatar_01.png', $4)
       RETURNING id, username, email, role, avatar, expires_at, created_at`,
      [username, email, passwordHash, expiresAt]
    );

    const user = insertRes.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: "30d",
    });

    // SEC-03: Token solo en cookie httpOnly, NO en body
    res.cookie("token", token, getCookieOptions());

    return res.json({ message: "Usuario registrado con éxito.", user });
  } catch (err) {
    console.error("[Auth Register Error]", err);
    return res.status(500).json({ error: "Error en el servidor al registrar usuario." });
  }
}

async function login(req, res) {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: "Ingresa tu usuario/correo y contraseña." });
    }

    const userRes = await query(
      `SELECT * FROM users WHERE username = $1 OR email = $1`,
      [usernameOrEmail]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const user = userRes.rows[0];

    if (user.is_banned) {
      return res.status(403).json({ error: "Esta cuenta ha sido suspendida por el administrador." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    // Actualizar última fecha visto
    await query(`UPDATE users SET last_seen = NOW() WHERE id = $1`, [user.id]);

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: "30d",
    });

    // SEC-03: Token solo en cookie httpOnly, NO en body
    res.cookie("token", token, getCookieOptions());

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      expires_at: user.expires_at,
      created_at: user.created_at,
    };

    return res.json({ message: "Sesión iniciada correctamente.", user: userData });
  } catch (err) {
    console.error("[Auth Login Error]", err);
    return res.status(500).json({ error: "Error interno en inicio de sesión." });
  }
}

async function logout(req, res) {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  return res.json({ message: "Sesión cerrada correctamente." });
}

async function getMe(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, logout, getMe };
