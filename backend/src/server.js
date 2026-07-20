const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const contentRoutes = require("./routes/content.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
const PORT = process.env.PORT || 3002;

// Confiar en el reverse proxy de Nginx para obtener la IP real del cliente y evitar errores de rate limit
app.set("trust proxy", 1);

// Validar que JWT_SECRET exista en entorno
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET no está definido en las variables de entorno (.env)");
  process.exit(1);
}

// Middleware de Créditos PeliApi
app.use((req, res, next) => {
  res.setHeader("X-Engine-Author", "FxxMorgan (PeliApi)");
  next();
});

// Configuración CORS dinámica y universal (Garantiza acceso desde VPS IP, dominios, proxies y apps móviles/escritorio)
app.use(
  cors({
    origin: (origin, callback) => {
      // Devolver true permite que el navegador acepte cualquier origen con credentials: true
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// Limitar tamaño del body para prevenir DoS
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Rate limiting global para auth (fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // máximo 30 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
});

// Rutas API v1
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/user", userRoutes);

// Ruta Health Check
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "online", app: "MoonPelis API", time: new Date() });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("[Express Server Error]", err.message || err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Error interno del servidor",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`===============================================`);
  console.log(`🎬 MoonPelis Backend iniciado exitosamente!`);
  console.log(`📡 Escuchando en todas las interfaces: 0.0.0.0:${PORT}`);
  console.log(`🔓 CORS: Dinámico e Ilimitado (Credentials Enabled)`);
  console.log(`✨ Motor Scraper & Resolvedor por FxxMorgan (PeliApi)`);
  console.log(`===============================================`);
});
