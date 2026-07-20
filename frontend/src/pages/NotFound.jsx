import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Film, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 max-w-md">
        <div className="w-24 h-24 rounded-3xl overflow-hidden glass-card border border-cyan-500/30 mx-auto shadow-2xl shadow-cyan-500/20 p-2">
          <img src="/images/logo.png" alt="MoonPelis" className="w-full h-full object-cover rounded-2xl" />
        </div>

        <div className="space-y-2">
          <h1 className="text-8xl font-black text-gradient-cyan font-heading">404</h1>
          <h2 className="text-2xl font-bold text-white font-heading">Página no encontrada</h2>
          <p className="text-sm text-slate-400">
            La escena que buscas no existe en nuestro catálogo cinematográfico.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Ir al Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
