import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#050814]/80 backdrop-blur-md py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/30">
            <img src="/images/logo.png" alt="MoonPelis" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-bold text-slate-300 font-heading">
            Moon<span className="text-cyan-400">Pelis</span> — Streaming Cinema
          </span>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span>Desarrollado con</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>para cinéfilos.</span>
        </div>
      </div>
    </footer>
  );
}
