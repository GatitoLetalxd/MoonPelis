import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, LogOut, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExpiredNoticeModal() {
  const { expiredState, logout } = useAuth();
  const navigate = useNavigate();

  if (!expiredState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full max-w-md glass-modal rounded-3xl p-8 border border-rose-500/30 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white font-heading">
            Acceso Expirado
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tu período de membresía o tiempo de acceso temporal ha finalizado.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
          Contacta al administrador del sistema para renovar tus días de acceso a MoonPelis.
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Volver al Login</span>
        </button>
      </div>
    </div>
  );
}
