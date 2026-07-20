const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { invalidateUserCache } = require("../middlewares/auth.middleware");

// SEC-08: Lista blanca de avatares válidos (del 1 al 26)
const VALID_AVATARS = Array.from({ length: 30 }, (_, i) => [
  `avatar${i + 1}.png`,
  `avatar_${String(i + 1).padStart(2, "0")}.png`,
  `avatar_${i + 1}.png`,
]).flat();

/**
 * Actualizar contraseña del usuario activo
 */
async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Ingresa tu contraseña actual y la nueva." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
    }

    const userRes = await query(`SELECT password FROM users WHERE id = $1`, [userId]);
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta." });
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);

    await query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, userId]);

    return res.json({ message: "Contraseña actualizada con éxito." });
  } catch (err) {
    console.error("[Update Password Error]", err);
    return res.status(500).json({ error: "Error cambiando contraseña." });
  }
}

/**
 * Actualizar avatar del usuario
 */
async function updateAvatar(req, res) {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;

    if (!avatar) {
      return res.status(400).json({ error: "El avatar es requerido." });
    }

    if (!VALID_AVATARS.includes(avatar)) {
      return res.status(400).json({ error: "Avatar no válido. Selecciona uno de los disponibles." });
    }

    await query(`UPDATE users SET avatar = $1 WHERE id = $2`, [avatar, userId]);
    return res.json({ message: "Avatar actualizado correctamente.", avatar });
  } catch (err) {
    console.error("[Update Avatar Error]", err);
    return res.status(500).json({ error: "Error actualizando avatar." });
  }
}

/**
 * Obtener favoritos del usuario
 */
async function getFavorites(req, res) {
  try {
    const userId = req.user.id;
    const resFavs = await query(
      `SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.json({ favorites: resFavs.rows });
  } catch (err) {
    console.error("[Get Favorites Error]", err);
    return res.status(500).json({ error: "Error obteniendo favoritos." });
  }
}

/**
 * Verificar si un contenido está en favoritos
 */
async function checkFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { contentId } = req.params;

    const check = await query(
      `SELECT id FROM favorites WHERE user_id = $1 AND content_id = $2`,
      [userId, contentId]
    );

    return res.json({ isFavorite: check.rowCount > 0 });
  } catch (err) {
    console.error("[Check Favorite Error]", err);
    return res.status(500).json({ error: "Error verificando favorito." });
  }
}

/**
 * Agregar/Remover Favorito (Toggle)
 */
async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { content_id, title, poster, type, provider } = req.body;

    if (!content_id || !title) {
      return res.status(400).json({ error: "ID de contenido y título son requeridos." });
    }

    const check = await query(
      `SELECT id FROM favorites WHERE user_id = $1 AND content_id = $2`,
      [userId, content_id]
    );

    if (check.rowCount > 0) {
      await query(`DELETE FROM favorites WHERE user_id = $1 AND content_id = $2`, [
        userId,
        content_id,
      ]);
      return res.json({ message: "Eliminado de favoritos.", isFavorite: false });
    } else {
      await query(
        `INSERT INTO favorites (user_id, content_id, title, poster, type, provider)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, content_id, title, poster, type || "movie", provider || "pelisplus"]
      );
      return res.json({ message: "Añadido a favoritos.", isFavorite: true });
    }
  } catch (err) {
    console.error("[Toggle Favorite Error]", err);
    return res.status(500).json({ error: "Error gestionando favorito." });
  }
}

/**
 * Obtener historial de reproducción
 */
async function getWatchHistory(req, res) {
  try {
    const userId = req.user.id;
    const resHist = await query(
      `SELECT * FROM watch_history WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20`,
      [userId]
    );
    return res.json({ history: resHist.rows });
  } catch (err) {
    console.error("[Get History Error]", err);
    return res.status(500).json({ error: "Error obteniendo historial de reproducción." });
  }
}

/**
 * Actualizar historial de reproducción
 */
async function updateWatchHistory(req, res) {
  try {
    const userId = req.user.id;
    const { content_id, title, poster, season, episode, provider } = req.body;

    if (!content_id || !title) {
      return res.status(400).json({ error: "Datos insuficientes para el historial." });
    }

    await query(
      `INSERT INTO watch_history (user_id, content_id, title, poster, season, episode, provider, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id, content_id)
       DO UPDATE SET season = EXCLUDED.season, episode = EXCLUDED.episode, updated_at = NOW()`,
      [userId, content_id, title, poster, season || null, episode || null, provider || "pelisplus"]
    );

    return res.json({ message: "Historial actualizado." });
  } catch (err) {
    console.error("[Update History Error]", err);
    return res.status(500).json({ error: "Error actualizando historial." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MÉTODOS EXCLUSIVOS DE ADMINISTRADOR (REPLICADOS DE LUNIELANIME)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estadísticas generales de la plataforma (Admin)
 */
async function getAdminStats(req, res) {
  try {
    const totalUsersRes = await query(`SELECT COUNT(*) FROM users`);
    const newTodayRes = await query(`SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE`);
    const newThisWeekRes = await query(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`);
    const activeLastWeekRes = await query(`SELECT COUNT(*) FROM users WHERE last_seen >= NOW() - INTERVAL '7 days'`);
    const totalBannedRes = await query(`SELECT COUNT(*) FROM users WHERE is_banned = TRUE`);
    const totalFavoritesRes = await query(`SELECT COUNT(*) FROM favorites`);

    return res.json({
      success: true,
      data: {
        total_users: parseInt(totalUsersRes.rows[0].count, 10),
        new_today: parseInt(newTodayRes.rows[0].count, 10),
        new_this_week: parseInt(newThisWeekRes.rows[0].count, 10),
        active_last_week: parseInt(activeLastWeekRes.rows[0].count, 10),
        total_banned: parseInt(totalBannedRes.rows[0].count, 10),
        total_favorites: parseInt(totalFavoritesRes.rows[0].count, 10),
      },
    });
  } catch (err) {
    console.error("[Admin Stats Error]", err);
    return res.status(500).json({ success: false, message: "Error al obtener estadísticas de admin." });
  }
}

/**
 * Obtener usuarios paginados con búsqueda y filtro (Admin)
 */
async function getAdminUsers(req, res) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "15", 10);
    const offset = (page - 1) * limit;
    const filter = req.query.filter || "";
    const search = req.query.search || "";

    let whereClause = [];
    let params = [];

    if (filter === "banned") {
      whereClause.push(`is_banned = TRUE`);
    } else if (filter === "admin") {
      whereClause.push(`role = 'admin'`);
    }

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClause.push(`(username ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    const whereStr = whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";

    const countRes = await query(`SELECT COUNT(*) FROM users ${whereStr}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const pages = Math.ceil(total / limit) || 1;

    const queryParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const usersRes = await query(
      `SELECT id, username, email, role, avatar, is_banned, expires_at, created_at, last_seen
       FROM users ${whereStr}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      queryParams
    );

    return res.json({
      success: true,
      data: {
        users: usersRes.rows,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (err) {
    console.error("[Admin Get Users Error]", err);
    return res.status(500).json({ success: false, message: "Error obteniendo usuarios." });
  }
}

/**
 * Crear nuevo usuario directamente desde el panel (Admin)
 */
async function createAdminUser(req, res) {
  try {
    const { username, email, password, role, durationDays } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email y contraseña son requeridos." });
    }

    const existing = await query(`SELECT id FROM users WHERE username = $1 OR email = $2`, [username, email]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ success: false, message: "El usuario o correo electrónico ya está registrado." });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    let expiresAt = null;
    const days = parseInt(durationDays || "0", 10);
    if (role !== "admin" && days > 0) {
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const insertRes = await query(
      `INSERT INTO users (username, email, password, role, avatar, expires_at)
       VALUES ($1, $2, $3, $4, 'avatar1.png', $5)
       RETURNING id, username, email, role, avatar, expires_at, created_at`,
      [username, email, passwordHash, role || "user", expiresAt]
    );

    return res.json({ success: true, message: `Usuario @${username} creado exitosamente.`, user: insertRes.rows[0] });
  } catch (err) {
    console.error("[Admin Create User Error]", err);
    return res.status(500).json({ success: false, message: "Error al crear usuario." });
  }
}

/**
 * Actualizar información y membresía de un usuario (Admin)
 */
async function updateAdminUser(req, res) {
  try {
    const { userId } = req.params;
    const { username, email, password, role, expires_at } = req.body;

    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }

    let updates = [];
    let params = [userId];

    if (username) {
      params.push(username);
      updates.push(`username = $${params.length}`);
    }
    if (email) {
      params.push(email);
      updates.push(`email = $${params.length}`);
    }
    if (role) {
      params.push(role);
      updates.push(`role = $${params.length}`);
    }
    if (expires_at !== undefined) {
      params.push(expires_at ? new Date(expires_at) : null);
      updates.push(`expires_at = $${params.length}`);
    }
    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      params.push(hash);
      updates.push(`password = $${params.length}`);
    }

    if (updates.length > 0) {
      await query(`UPDATE users SET ${updates.join(", ")} WHERE id = $1`, params);
      invalidateUserCache(userId);
    }

    return res.json({ success: true, message: `Usuario @${username || userRes.rows[0].username} actualizado correctamente.` });
  } catch (err) {
    console.error("[Admin Update User Error]", err);
    return res.status(500).json({ success: false, message: "Error al actualizar el usuario." });
  }
}

/**
 * Banear usuario (Admin)
 */
async function banAdminUser(req, res) {
  try {
    const { userId } = req.params;
    const userRes = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    if (userRes.rows[0].role === "admin") return res.status(400).json({ success: false, message: "No es posible suspender a una cuenta administradora." });

    await query(`UPDATE users SET is_banned = TRUE WHERE id = $1`, [userId]);
    invalidateUserCache(userId);
    return res.json({ success: true, message: "Usuario suspendido correctamente." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error suspendiendo usuario." });
  }
}

/**
 * Desbanear usuario (Admin)
 */
async function unbanAdminUser(req, res) {
  try {
    const { userId } = req.params;
    await query(`UPDATE users SET is_banned = FALSE WHERE id = $1`, [userId]);
    invalidateUserCache(userId);
    return res.json({ success: true, message: "Cuenta de usuario reactivada." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error reactivando usuario." });
  }
}

/**
 * Eliminar usuario permanentemente (Admin)
 */
async function deleteAdminUser(req, res) {
  try {
    const { userId } = req.params;
    const userRes = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    if (userRes.rows[0].role === "admin") return res.status(400).json({ success: false, message: "No es posible eliminar a una cuenta administradora." });

    await query(`DELETE FROM users WHERE id = $1`, [userId]);
    invalidateUserCache(userId);
    return res.json({ success: true, message: "Usuario eliminado permanentemente." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error eliminando usuario." });
  }
}

/**
 * Compatibilidad legacy: Otorgar tiempo de acceso
 */
async function grantAccessTime(req, res) {
  try {
    const { userId, days } = req.body;

    if (!userId || days === undefined) {
      return res.status(400).json({ error: "Se requiere userId y cantidad de días." });
    }

    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays < 1) {
      return res.status(400).json({ error: "Los días deben ser un número positivo (mínimo 1)." });
    }

    const userRes = await query(`SELECT expires_at FROM users WHERE id = $1`, [userId]);

    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    let currentExpires = userRes.rows[0].expires_at ? new Date(userRes.rows[0].expires_at) : new Date();
    const now = new Date();

    let baseDate = currentExpires > now ? currentExpires : now;
    let newExpires = new Date(baseDate.getTime() + numDays * 24 * 60 * 60 * 1000);

    await query(`UPDATE users SET expires_at = $1 WHERE id = $2`, [newExpires, userId]);

    invalidateUserCache(userId);

    return res.json({
      message: `Acceso extendido por ${numDays} días exitosamente.`,
      expires_at: newExpires,
    });
  } catch (err) {
    console.error("[Grant Access Error]", err);
    return res.status(500).json({ error: "Error al modificar la membresía del usuario." });
  }
}

/**
 * Compatibilidad legacy: Toggle Ban
 */
async function toggleBanUser(req, res) {
  try {
    const { userId } = req.params;
    const userRes = await query(`SELECT is_banned, role FROM users WHERE id = $1`, [userId]);

    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (userRes.rows[0].role === "admin") {
      return res.status(400).json({ error: "No es posible suspender a una cuenta administradora." });
    }

    const newBanStatus = !userRes.rows[0].is_banned;
    await query(`UPDATE users SET is_banned = $1 WHERE id = $2`, [newBanStatus, userId]);

    invalidateUserCache(userId);

    return res.json({
      message: newBanStatus ? "Usuario suspendido." : "Usuario reactivado.",
      is_banned: newBanStatus,
    });
  } catch (err) {
    console.error("[Toggle Ban Error]", err);
    return res.status(500).json({ error: "Error modificando estado de cuenta." });
  }
}

module.exports = {
  updatePassword,
  updateAvatar,
  getFavorites,
  checkFavorite,
  toggleFavorite,
  getWatchHistory,
  updateWatchHistory,
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  banAdminUser,
  unbanAdminUser,
  deleteAdminUser,
  grantAccessTime,
  toggleBanUser,
};
