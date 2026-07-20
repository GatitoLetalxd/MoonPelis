import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Lock, Heart, History, Check, AlertCircle, Sparkles, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl, ALL_AVATARS } from '../utils/avatar';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('avatars'); // 'avatars' | 'favorites' | 'history' | 'security'
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);

  // Selección de Avatar
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar1.png');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const [avatarError, setAvatarError] = useState(null);

  // Formulario de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.avatar) {
      setSelectedAvatar(user.avatar);
    }
    fetchUserData();
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      const [favRes, histRes] = await Promise.all([
        api.get('/user/favorites'),
        api.get('/user/history'),
      ]);
      setFavorites(favRes.data.favorites || []);
      setHistory(histRes.data.history || []);
    } catch (e) {
      console.error('Error cargando datos de perfil:', e);
    }
  };

  const handleSaveAvatar = async (avatarId) => {
    const targetAvatar = avatarId || selectedAvatar;
    
    // Actualización visual INSTANTÁNEA (Optimista)
    setSelectedAvatar(targetAvatar);
    setUser((prev) => (prev ? { ...prev, avatar: targetAvatar } : prev));

    setSavingAvatar(true);
    setAvatarMsg(null);
    setAvatarError(null);
    try {
      const res = await api.put('/user/avatar', { avatar: targetAvatar });
      setAvatarMsg(res.data.message || 'Avatar actualizado correctamente.');
    } catch (err) {
      setAvatarError(err.response?.data?.error || 'Error al actualizar el avatar.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    try {
      const res = await api.put('/user/password', { currentPassword, newPassword });
      setMsg(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error cambiando contraseña.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        {/* User Card Header */}
        <div className="glass-card rounded-3xl p-8 border border-slate-800 mb-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl">
          <div className="relative w-24 h-24 rounded-3xl overflow-hidden glass-card border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/20 flex-shrink-0">
            <img
              src={getAvatarUrl(user.avatar)}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-bold text-white font-heading">{user.username}</h1>
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>

          <div className="glass-card px-5 py-3 rounded-2xl border border-slate-800 text-center sm:text-right space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Membresía / Acceso
            </span>
            <p className="text-xs font-bold text-cyan-400">
              {user.role === 'admin'
                ? 'Ilimitado (Administrador)'
                : user.expires_at
                ? `Vence: ${new Date(user.expires_at).toLocaleDateString()}`
                : '30 Días'}
            </p>
          </div>
        </div>

        {/* Tabs Nav */}
        <div className="flex border-b border-slate-800 mb-8 gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('avatars')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'avatars'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Galería de Avatares
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'favorites'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4" /> Mis Favoritos ({favorites.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" /> Historial de Reproducción
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" /> Seguridad y Clave
          </button>
        </div>

        {/* Tab Avatares */}
        {activeTab === 'avatars' && (
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>Personaliza tu Avatar</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Elige entre los 26 avatares cinematográficos para tu perfil.
                  </p>
                </div>

                {avatarMsg && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{avatarMsg}</span>
                  </div>
                )}

                {avatarError && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{avatarError}</span>
                  </div>
                )}
              </div>

              {/* Grid de 26 Avatares */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 pt-2">
                {ALL_AVATARS.map((av) => {
                  const isSelected = selectedAvatar === av.id || getAvatarUrl(user.avatar) === av.url;
                  return (
                    <button
                      key={av.id}
                      onClick={() => handleSaveAvatar(av.id)}
                      disabled={savingAvatar}
                      className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer aspect-square ${
                        isSelected
                          ? 'border-cyan-400 ring-4 ring-cyan-500/30 scale-105 shadow-xl shadow-cyan-500/30'
                          : 'border-slate-800 hover:border-cyan-500/60 hover:scale-105'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg font-bold">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Favoritos */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center text-slate-400 text-sm">
                Aún no has añadido películas o series a tus favoritos.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {favorites.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={{
                      ...item,
                      slug: item.content_id,
                      poster: item.poster,
                    }}
                    onClick={() => navigate(`/details/${item.content_id}?provider=${item.provider}&type=${item.type}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Historial */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center text-slate-400 text-sm">
                Tu historial de reproducción está vacío.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/details/${item.content_id}?provider=${item.provider}`)}
                    className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {item.poster && (
                        <img src={item.poster} alt={item.title} className="w-10 h-14 object-cover rounded-lg" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{item.title}</h4>
                        <p className="text-xs text-slate-400">
                          {item.season ? `Temporada ${item.season} • Episodio ${item.episode}` : 'Película'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-slate-500">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Seguridad */}
        {activeTab === 'security' && (
          <div className="max-w-md mx-auto glass-card rounded-3xl p-8 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white font-heading">Cambiar Contraseña</h3>

            {msg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{msg}</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                Actualizar Contraseña
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
