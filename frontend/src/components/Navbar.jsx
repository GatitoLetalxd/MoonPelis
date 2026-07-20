import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User, LogOut, Shield, Clock, ChevronDown, X } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/?q=${encodeURIComponent(query.trim())}`);
      }
      setMobileSearchOpen(false);
    }
  };

  const calculateDaysLeft = () => {
    if (!user) return null;
    if (user.role === 'admin') return { text: 'Acceso Ilimitado', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    if (!user.expires_at) return { text: '30 Días', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };

    const now = new Date();
    const expires = new Date(user.expires_at);
    const diffMs = expires - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: 'Expirado', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
    if (diffDays <= 3) {
      return { text: `${diffDays}d restantes`, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
    return { text: `${diffDays}d restantes`, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  };

  const daysInfo = calculateDaysLeft();

  return (
    <nav className="sticky top-0 z-40 w-full glass-card border-b border-cyan-500/15 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo Imagen Oficial */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer flex-shrink-0">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden glass-card border border-cyan-500/30 group-hover:border-cyan-400 group-hover:scale-105 transition-all duration-300 shadow-lg shadow-cyan-500/20">
            <img
              src="/images/logo.png"
              alt="MoonPelis Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading">
              Moon<span className="text-gradient-cyan">Pelis</span>
            </span>
            <span className="block text-[9px] sm:text-[10px] uppercase tracking-widest text-cyan-400/80 font-bold -mt-1">
              Cinema Streaming
            </span>
          </div>
        </Link>

        {/* Buscador Desktop */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar películas, series o géneros..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
        </form>

        {/* Menú Derecha */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Botón de Búsqueda Móvil */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer"
            title="Buscar"
          >
            {mobileSearchOpen ? <X className="w-5 h-5 text-rose-400" /> : <Search className="w-5 h-5 text-cyan-400" />}
          </button>

          {daysInfo && (
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${daysInfo.color}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{daysInfo.text}</span>
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 border border-slate-800 transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-900 flex items-center justify-center">
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="hidden sm:inline text-sm font-semibold text-slate-200">
                  {user.username}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 glass-modal rounded-2xl border border-cyan-500/20 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/30 flex-shrink-0">
                      <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-100 truncate">{user.username}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Mi Perfil y Avatares</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors font-semibold cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Panel de Admin</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-slate-800/80 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>

      {/* Buscador Desplegable en Versión Móvil */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-4 pt-1 border-t border-slate-800/80 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar películas, series o géneros..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-cyan-500/40 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-lg shadow-cyan-500/10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </nav>
  );
}
