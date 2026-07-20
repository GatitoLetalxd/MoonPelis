const jwt = require("jsonwebtoken");
const { query } = require("../db");

// Caché en memoria simple con TTL (PERF-01)
const userCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

function getCachedUser(userId) {
  const entry = userCache.get(userId);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.user;
  }
  userCache.delete(userId);
  return null;
}

function setCachedUser(userId, user) {
  userCache.set(userId, { user, ts: Date.now() });
}

async function authMiddleware(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: "No autorizado. Token no proporcionado." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[Auth Middleware] JWT_SECRET no definido");
      return res.status(500).json({ error: "Error de configuración del servidor." });
    }

    const decoded = jwt.verify(token, secret);

    // PERF-01: Intentar caché antes de consultar la BD
    let user = getCachedUser(decoded.id);

    if (!user) {
      const userRes = await query(
        `SELECT id, username, email, role, avatar, is_banned, expires_at FROM users WHERE id = $1`,
        [decoded.id]
      );

      if (userRes.rowCount === 0) {
        return res.status(401).json({ error: "Usuario no encontrado." });
      }

      user = userRes.rows[0];
      setCachedUser(decoded.id, user);
    }

    if (user.is_banned) {
      return res.status(403).json({ error: "Cuenta suspendida por el administrador." });
    }

    // Comprobar suscripción/acceso
    if (user.role !== "admin" && user.expires_at) {
      const now = new Date();
      const expires = new Date(user.expires_at);
      if (now > expires) {
        return res.status(403).json({
          code: "SUBSCRIPTION_EXPIRED",
          error: "Tu suscripción ha expirado. Contacta al administrador para renovar tu acceso.",
          expiresAt: user.expires_at,
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

// Exportar también para invalidar caché tras cambios de admin (ban, grant)
function invalidateUserCache(userId) {
  userCache.delete(userId);
}

module.exports = { authMiddleware, invalidateUserCache };
