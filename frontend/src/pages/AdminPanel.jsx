import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import {
  Shield, Users, UserPlus, Calendar, Activity, Ban, Heart,
  Search, Loader2, Check, AlertCircle, Sparkles, Edit, Trash2, X, Plus, Clock
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'cyan' }) {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 flex flex-col gap-2 shadow-xl`}>
      <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-700/60 text-current">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-black text-white mt-1 font-heading">{value ?? '—'}</p>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl px-4 animate-in fade-in duration-200">
      <div className="glass-modal border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6">
        <p className="text-white text-base font-semibold text-center">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-colors cursor-pointer"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Filtros y Búsqueda
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modales y Toasts
  const [modal, setModal] = useState(null); // { type: 'ban'|'unban'|'delete', userId, username }
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null); // { text, type: 'success' | 'error' }

  // Formulario de Crear Usuario
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'user', durationDays: '30', customDays: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Formulario de Editar Usuario
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', password: '', role: 'user', expires_at: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');

  // Debounce para la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const res = await api.get('/user/admin/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async (targetPage = 1) => {
    try {
      setIsLoadingUsers(true);
      const params = { page: targetPage, limit: 15 };
      if (filter) params.filter = filter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await api.get('/user/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.data.users);
        setPagination(res.data.data.pagination);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleAction = async () => {
    if (!modal) return;
    setActionLoading(modal.userId);
    const { type, userId } = modal;
    setModal(null);
    try {
      let res;
      if (type === 'ban') {
        res = await api.patch(`/user/admin/users/${userId}/ban`);
      } else if (type === 'unban') {
        res = await api.patch(`/user/admin/users/${userId}/unban`);
      } else if (type === 'delete') {
        res = await api.delete(`/user/admin/users/${userId}`);
      }

      if (res.data.success) {
        showToast(res.data.message || 'Acción completada con éxito');
        fetchUsers(pagination.page);
        fetchStats();
      } else {
        showToast(res.data.message || 'Error al procesar la acción', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error de conexión', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);

    const parsedDays = createForm.durationDays === 'custom'
      ? parseInt(createForm.customDays, 10) || 0
      : parseInt(createForm.durationDays, 10);

    const payload = {
      username: createForm.username,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
      durationDays: createForm.role === 'admin' ? 0 : parsedDays,
    };

    try {
      const res = await api.post('/user/admin/users', payload);
      if (res.data.success) {
        showToast(`Usuario '@${createForm.username}' creado con éxito`);
        setCreateForm({ username: '', email: '', password: '', role: 'user', durationDays: '30', customDays: '' });
        setShowCreateForm(false);
        fetchUsers(1);
        fetchStats();
      } else {
        setCreateError(res.data.message || 'Error al crear el usuario');
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error de conexión al servidor');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');
    setIsEditing(true);

    const payload = {
      username: editForm.username,
      email: editForm.email,
      role: editForm.role,
      expires_at: editForm.role === 'admin' || !editForm.expires_at ? null : new Date(editForm.expires_at).toISOString(),
    };

    if (editForm.password && editForm.password.trim().length > 0) {
      payload.password = editForm.password;
    }

    try {
      const res = await api.patch(`/user/admin/users/${editingUser.id}`, payload);
      if (res.data.success) {
        showToast(`Usuario '@${editForm.username}' actualizado correctamente`);
        setEditingUser(null);
        fetchUsers(pagination.page);
        fetchStats();
      } else {
        setEditError(res.data.message || 'Error al actualizar usuario');
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setIsEditing(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getExpirationStatus = (user) => {
    if (user.role === 'admin') return { text: 'Ilimitado', style: 'text-amber-400 font-bold' };
    if (!user.expires_at) return { text: 'Ilimitado', style: 'text-cyan-400 font-bold' };

    const expiry = new Date(user.expires_at);
    const now = new Date();

    if (expiry < now) {
      return { text: 'Expirado', style: 'text-rose-400 font-bold' };
    }

    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return { text: 'Expira hoy/mañana', style: 'text-amber-400 font-semibold animate-pulse' };
    }

    return { text: `Expira en ${diffDays}d`, style: diffDays <= 5 ? 'text-amber-400 font-semibold' : 'text-cyan-400' };
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        {/* Header Admin */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white font-heading flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span>Panel de Administración</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gestión completa de usuarios, suscripciones y estadísticas de MoonPelis.
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{showCreateForm ? 'Cancelar' : '+ Nuevo Usuario'}</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 glass-modal border border-cyan-500/30 text-white text-xs font-semibold px-5 py-3.5 rounded-2xl shadow-2xl animate-in fade-in flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Confirm Modal */}
        {modal && (
          <ConfirmModal
            message={
              modal.type === 'ban'
                ? `¿Suspender la cuenta de @${modal.username}? No podrá iniciar sesión.`
                : modal.type === 'unban'
                ? `¿Reactivar la cuenta de @${modal.username}?`
                : `¿Eliminar permanentemente a @${modal.username}? Esta acción no se puede deshacer.`
            }
            onConfirm={handleAction}
            onCancel={() => setModal(null)}
          />
        )}

        {/* Formulario de Crear Usuario */}
        {showCreateForm && (
          <form onSubmit={handleCreateUser} className="glass-card rounded-3xl p-6 border border-cyan-500/20 mb-8 space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <span>Crear Nuevo Usuario</span>
            </h2>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{createError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="ej. johndoe"
                  value={createForm.username}
                  onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo</label>
                <input
                  type="email"
                  required
                  placeholder="ej. john@email.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {createForm.role === 'user' && (
                <>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duración del Acceso</label>
                    <select
                      value={createForm.durationDays}
                      onChange={(e) => setCreateForm((f) => ({ ...f, durationDays: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="7">7 Días</option>
                      <option value="30">30 Días (1 Mes)</option>
                      <option value="60">60 Días (2 Meses)</option>
                      <option value="90">90 Días (3 Meses)</option>
                      <option value="180">180 Días (6 Meses)</option>
                      <option value="365">365 Días (1 Año)</option>
                      <option value="0">Ilimitado</option>
                      <option value="custom">Días Personalizados</option>
                    </select>
                  </div>

                  {createForm.durationDays === 'custom' && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Número de Días</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Ej. 45"
                        value={createForm.customDays}
                        onChange={(e) => setCreateForm((f) => ({ ...f, customDays: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isCreating ? 'Creando Usuario...' : 'Guardar Nuevo Usuario'}
            </button>
          </form>
        )}

        {/* Stats Grid */}
        {isLoadingStats ? (
          <div className="flex items-center justify-center py-10 text-cyan-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <StatCard icon={Users} label="Total usuarios" value={stats?.total_users} color="cyan" />
            <StatCard icon={UserPlus} label="Nuevos hoy" value={stats?.new_today} color="blue" />
            <StatCard icon={Calendar} label="Esta semana" value={stats?.new_this_week} color="emerald" />
            <StatCard icon={Activity} label="Activos (7d)" value={stats?.active_last_week} color="amber" />
            <StatCard icon={Ban} label="Suspendidos" value={stats?.total_banned} color="rose" />
            <StatCard icon={Heart} label="Favoritos totales" value={stats?.total_favorites} color="purple" />
          </div>
        )}

        {/* Tabla de Usuarios */}
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl mb-12">
          {/* Controls Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 gap-4 flex-wrap bg-slate-900/60">
            <div className="flex items-center gap-4 flex-1 min-w-[280px]">
              <h2 className="text-sm font-bold text-white font-heading whitespace-nowrap">
                Usuarios Encontrados ({pagination.total})
              </h2>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar usuario o correo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {[
                { id: '', label: 'Todos' },
                { id: 'banned', label: 'Suspendidos' },
                { id: 'admin', label: 'Admins' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filter === f.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-16 text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-16">No se encontraron usuarios coincidentes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 uppercase tracking-wider text-[10px] text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4 hidden md:table-cell">Email</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Rol</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Registro</th>
                    <th className="px-6 py-4 hidden md:table-cell">Vencimiento</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => {
                    const status = getExpirationStatus(u);

                    return (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <img src={getAvatarUrl(u.avatar)} alt={u.username} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{u.username}</p>
                            <p className="text-[11px] text-slate-500 md:hidden">{u.email}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{u.email}</td>

                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span
                            className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] border ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-500 hidden lg:table-cell">{formatDate(u.created_at)}</td>

                        <td className="px-6 py-4 hidden md:table-cell font-semibold">
                          <span className={status.style}>{status.text}</span>
                        </td>

                        <td className="px-6 py-4">
                          {u.is_banned ? (
                            <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                              Suspendido
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                              Activo
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {actionLoading === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditForm({
                                    username: u.username,
                                    email: u.email,
                                    password: '',
                                    role: u.role,
                                    expires_at: u.expires_at ? u.expires_at.split('T')[0] : '',
                                  });
                                  setEditError('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 font-bold text-[11px] transition-all cursor-pointer"
                              >
                                Editar
                              </button>

                              {u.is_banned ? (
                                <button
                                  onClick={() => setModal({ type: 'unban', userId: u.id, username: u.username })}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  Reactivar
                                </button>
                              ) : (
                                u.role !== 'admin' && (
                                  <button
                                    onClick={() => setModal({ type: 'ban', userId: u.id, username: u.username })}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 font-bold text-[11px] transition-all cursor-pointer"
                                  >
                                    Suspender
                                  </button>
                                )
                              )}

                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => setModal({ type: 'delete', userId: u.id, username: u.username })}
                                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-slate-800">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchUsers(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pagination.page === p
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Editar Usuario */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-lg glass-modal rounded-3xl p-8 border border-cyan-500/20 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">
                      Editar Usuario: @{editingUser.username}
                    </h3>
                    <p className="text-xs text-slate-400">{editingUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingUser(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</label>
                    <input
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nueva Contraseña (Opcional)</label>
                    <input
                      type="password"
                      placeholder="Dejar en blanco para no cambiar"
                      value={editForm.password}
                      onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Ajuste de Membresía */}
                {editForm.role === 'user' && (
                  <div className="space-y-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                    <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>Modificar Tiempo de Acceso</span>
                    </label>

                    {/* Presets Rápida */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          now.setDate(now.getDate() + 7);
                          setEditForm((f) => ({ ...f, expires_at: now.toISOString().split('T')[0] }));
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        +7 Días
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          now.setDate(now.getDate() + 30);
                          setEditForm((f) => ({ ...f, expires_at: now.toISOString().split('T')[0] }));
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        +30 Días
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, expires_at: '' }))}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Ilimitado
                      </button>
                    </div>

                    {/* Selector de Meses */}
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const now = new Date();
                        if (val === '2m') now.setMonth(now.getMonth() + 2);
                        else if (val === '3m') now.setMonth(now.getMonth() + 3);
                        else if (val === '4m') now.setMonth(now.getMonth() + 4);
                        else if (val === '6m') now.setMonth(now.getMonth() + 6);
                        else if (val === '1y') now.setFullYear(now.getFullYear() + 1);
                        setEditForm((f) => ({ ...f, expires_at: now.toISOString().split('T')[0] }));
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700/60 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="">➕ Añadir meses / año...</option>
                      <option value="2m">+2 Meses</option>
                      <option value="3m">+3 Meses</option>
                      <option value="4m">+4 Meses</option>
                      <option value="6m">+6 Meses</option>
                      <option value="1y">+1 Año</option>
                    </select>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Fecha de Expiración Exacta</label>
                      <input
                        type="date"
                        value={editForm.expires_at}
                        onChange={(e) => setEditForm((f) => ({ ...f, expires_at: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isEditing ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
