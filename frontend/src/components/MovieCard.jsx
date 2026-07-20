import React from 'react';
import { Play, Star, Film, Tv } from 'lucide-react';

export default function MovieCard({ item, onClick }) {
  const { title, poster, rating, type, provider, slug } = item;

  const displayPoster = poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer glass-card rounded-2xl overflow-hidden glass-card-hover border border-slate-800/80 transition-all duration-300"
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] w-full overflow-hidden bg-slate-900 relative">
        <img
          src={displayPoster}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Badges Top */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {rating && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-bold shadow-md">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{rating}</span>
            </div>
          )}

          <div className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
            {type === 'series' ? 'Serie' : 'Peli'}
          </div>
        </div>

        {/* Center Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info Bottom */}
      <div className="p-3.5">
        <h3 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-amber-400 transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
          <span className="capitalize">{provider || 'pelisplus'}</span>
          {type === 'series' ? (
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Tv className="w-3 h-3" /> Serie
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Film className="w-3 h-3" /> HD
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
