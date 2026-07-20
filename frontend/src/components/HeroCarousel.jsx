import React, { useState, useEffect } from 'react';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const FEATURED_FALLBACKS = [
  {
    title: 'Avatar: El Camino del Agua',
    slug: 'avatar-el-camino-del-agua',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    description: 'Ambientada más de una década después de los acontecimientos de la primera película, Avatar narra la historia de la familia Sully.',
    rating: '8.8',
    type: 'movie',
    provider: 'pelisplus',
  },
  {
    title: 'Oppenheimer',
    slug: 'oppenheimer',
    backdrop: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&auto=format&fit=crop&q=80',
    description: 'La historia del físico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.',
    rating: '8.9',
    type: 'movie',
    provider: 'pelisplus',
  },
  {
    title: 'Dune: Parte Dos',
    slug: 'dune-parte-dos',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    description: 'Paul Atreides se une a Chani y a los Fremen mientras busca la venganza contra los conspiradores que destruyeron a su familia.',
    rating: '9.0',
    type: 'movie',
    provider: 'pelisplus',
  },
];

export default function HeroCarousel({ items = [], onSelect }) {
  const slides = items.length > 0 ? items.slice(0, 5) : FEATURED_FALLBACKS;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[currentIndex] || slides[0];

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] rounded-3xl overflow-hidden glass-card border border-slate-800 shadow-2xl mb-12">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={current.backdrop || current.poster}
          alt={current.title}
          className="w-full h-full object-cover object-center transition-all duration-700 scale-105"
        />
        {/* Gradients for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
      </div>

      {/* Content Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-end pb-12 pt-20">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              Destacado Pelis
            </span>
            {current.rating && (
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{current.rating} IMDb</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none font-heading drop-shadow-md">
            {current.title}
          </h1>

          {current.description && (
            <p className="text-slate-300 text-sm sm:text-base line-clamp-2 leading-relaxed">
              {current.description}
            </p>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => onSelect(current)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              <span>Ver Ahora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Nav Arrows */}
      <button
        onClick={() => setCurrentIndex((currentIndex - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-modal flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-950 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => setCurrentIndex((currentIndex + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-modal flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-950 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Carousel Dots */}
      <div className="absolute bottom-4 right-8 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-amber-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
