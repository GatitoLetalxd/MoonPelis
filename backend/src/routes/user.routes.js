const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/user.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { adminMiddleware } = require("../middlewares/admin.middleware");

// Rutas de Usuario Autenticado
router.put("/password", authMiddleware, updatePassword);
router.put("/avatar", authMiddleware, updateAvatar);

router.get("/favorites", authMiddleware, getFavorites);
router.get("/favorites/check/:contentId", authMiddleware, checkFavorite);
router.post("/favorites/toggle", authMiddleware, toggleFavorite);

router.get("/history", authMiddleware, getWatchHistory);
router.post("/history", authMiddleware, updateWatchHistory);

// Rutas de Administración Completa (Replicadas de LunielAnime)
router.get("/admin/stats", authMiddleware, adminMiddleware, getAdminStats);
router.get("/admin/users", authMiddleware, adminMiddleware, getAdminUsers);
router.post("/admin/users", authMiddleware, adminMiddleware, createAdminUser);
router.patch("/admin/users/:userId", authMiddleware, adminMiddleware, updateAdminUser);
router.patch("/admin/users/:userId/ban", authMiddleware, adminMiddleware, banAdminUser);
router.patch("/admin/users/:userId/unban", authMiddleware, adminMiddleware, unbanAdminUser);
router.delete("/admin/users/:userId", authMiddleware, adminMiddleware, deleteAdminUser);

// Rutas legacy de compatibilidad
router.post("/admin/grant-access", authMiddleware, adminMiddleware, grantAccessTime);
router.put("/admin/users/:userId/ban", authMiddleware, adminMiddleware, toggleBanUser);

module.exports = router;
