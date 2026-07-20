-- Habilitar extensión pgcrypto para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(32) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(10) NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  avatar      VARCHAR(100) NOT NULL DEFAULT 'avatar_01.png',
  is_banned   BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ
);

-- Tabla de Favoritos / Watchlist
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id  TEXT NOT NULL,
  title       TEXT NOT NULL,
  poster      TEXT,
  type        VARCHAR(20) DEFAULT 'movie', -- 'movie' | 'series'
  provider    VARCHAR(32) DEFAULT 'pelisplus',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_id)
);

-- Tabla de Historial de Reproducción
CREATE TABLE IF NOT EXISTS watch_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id   TEXT NOT NULL,
  title        TEXT NOT NULL,
  poster       TEXT,
  season       INT,
  episode      INT,
  provider     VARCHAR(32) DEFAULT 'pelisplus',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
