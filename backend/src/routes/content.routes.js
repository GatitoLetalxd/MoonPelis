const express = require("express");
const router = express.Router();
const {
  searchContent,
  getCatalog,
  getContentInfo,
  getContentServers,
  resolveStream,
} = require("../controllers/content.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

// Las peticiones de contenido requieren estar autenticado con membresía válida
router.get("/search", authMiddleware, searchContent);
router.get("/catalog", authMiddleware, getCatalog);
router.get("/info/:slug", authMiddleware, getContentInfo);
router.get("/servers/:slug", authMiddleware, getContentServers);

// Resolver de stream directo con caché de 2 horas (admite GET y POST)
router.get("/resolve", authMiddleware, resolveStream);
router.post("/resolve", authMiddleware, resolveStream);

module.exports = router;
