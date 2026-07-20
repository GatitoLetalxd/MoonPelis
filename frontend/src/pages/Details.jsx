import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PlayerModal from '../components/PlayerModal';
import api from '../services/api';
import { Play, Star, Heart, ArrowLeft, Loader2, Tv, Film, Calendar, Users } from 'lucide-react';

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

export default function Details() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider') || 'pelisplus';
  const type = searchParams.get('type') || 'movie';
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Estados para reproductor modal
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  // UX-05: Scroll al inicio al montar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    fetchDetails();
    checkFavoriteStatus();
  }, [slug, provider, type]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const cleanSlug = slug.replace(/^(pelisplus|repelishd)_/, '');
      const res = await api.get(`/content/info/${cleanSlug}`, {
        params: { provider, type },
      });
      setContent(res.data);
      if (res.data?.seasons && Array.isArray(res.data.seasons) && res.data.seasons.length > 0) {
        setSelectedSeason(res.data.seasons[0].number || 1);
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setLoading(false);
    }
  };

  // PERF-02: Usar endpoint dedicado para verificar favorito
  const checkFavoriteStatus = async () => {
    try {
      const cleanSlug = slug.replace(/^(pelisplus|repelishd)_/, '');
      const res = await api.get(`/user/favorites/check/${encodeURIComponent(cleanSlug)}`);
      setIsFavorite(res.data.isFavorite);
    } catch (e) {
      // Ignore
    }
  };

  const handleToggleFavorite = async () => {
    if (!content) return;
    try {
      const cleanSlug = slug.replace(/^(pelisplus|repelishd)_/, '');
      const res = await api.post('/user/favorites/toggle', {
        content_id: cleanSlug,
        title: content.title,
        poster: content.poster,
        type: content.type || type,
        provider,
      });
      setIsFavorite(res.data.isFavorite);
    } catch (err) {
      console.error('Error toggle favorito:', err);
    }
  };

  const handlePlayClick = (season = 1, episode = 1) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    setShowPlayer(true);
  };

  // Normalizador seguro de temporadas
  const getSeasonsList = () => {
    if (!content?.seasons) return [];
    if (Array.isArray(content.seasons)) {
      return content.seasons;
    }
    if (typeof content.seasons === 'object') {
      return Object.entries(content.seasons).map(([key, val]) => ({
        number: parseInt(key, 10),
        name: `Temporada ${key}`,
        episodes: Array.isArray(val) ? val : [],
      }));
    }
    return [];
  };

  const seasonsList = getSeasonsList();
  const currentSeasonObj =
    seasonsList.find((s) => Number(s.number) === Number(selectedSeason)) || seasonsList[0];
  const currentEpisodes = currentSeasonObj?.episodes || [];

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl glass-card text-xs font-bold text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver atrás
        </button>

        {loading ? (
          <div className="min-h-[450px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
            <p className="text-sm font-semibold">Cargando sinopsis e información cinemática...</p>
          </div>
        ) : !content ? (
          <div className="glass-card rounded-3xl p-12 text-center text-rose-400">
            No se pudo obtener información para esta película o serie.
          </div>
        ) : (
          <div className="space-y-12">
            {/* Banner e Información Superior */}
            <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 p-6 sm:p-10 flex flex-col md:flex-row gap-8">
              {/* Poster Image */}
              <div className="w-full md:w-72 flex-shrink-0 aspect-[2/3] rounded-2xl overflow-hidden glass-card border border-slate-700/80 shadow-2xl relative">
                {/* BUG-03: onError previene bucle infinito */}
                <img
                  src={content.poster || FALLBACK_POSTER}
                  alt={content.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_POSTER;
                  }}
                />
              </div>

              {/* Details Content */}
              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
                      {content.type === 'series' ? 'Serie TV' : 'Película HD'}
                    </span>
                    {content.rating && (
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span>{content.rating}</span>
                      </div>
                    )}
                    <span className="text-xs text-slate-400 font-semibold uppercase">
                      Servidor: {provider}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading leading-tight">
                    {content.title}
                  </h1>
                </div>

                {/* Acciones principales */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => handlePlayClick(selectedSeason, 1)}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base flex items-center gap-3 shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                    <span>Reproducir Ahora</span>
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    className={`px-6 py-4 rounded-2xl border font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                      isFavorite
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'glass-card border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{isFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}</span>
                  </button>
                </div>

                {/* Sinopsis */}
                <div className="space-y-2 border-t border-slate-800/80 pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Sinopsis
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {content.synopsis || content.description || 'Sin sinopsis disponible.'}
                  </p>
                </div>

                {/* Reparto y Géneros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {content.genres && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Géneros:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(content.genres)
                          ? content.genres.map((g, idx) => {
                              const label = typeof g === 'object' ? g.name || g.slug || '' : String(g);
                              return (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                                >
                                  {label}
                                </span>
                              );
                            })
                          : <span className="text-slate-300">{typeof content.genres === 'object' ? JSON.stringify(content.genres) : String(content.genres)}</span>}
                      </div>
                    </div>
                  )}

                  {content.cast && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Reparto Principal:
                      </span>
                      <p className="text-slate-300 font-semibold line-clamp-2">
                        {Array.isArray(content.cast)
                          ? content.cast.map((c) => (typeof c === 'object' ? c.name || String(c) : String(c))).join(', ')
                          : String(content.cast)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Temporadas y Episodios si es Serie */}
            {content.type === 'series' && seasonsList.length > 0 && (
              <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <Tv className="w-6 h-6 text-cyan-500" />
                  <h2 className="text-xl font-bold text-white font-heading">
                    Temporadas y Episodios
                  </h2>
                </div>

                {/* Selector de Temporada */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {seasonsList.map((sObj, idx) => {
                    const sNum = sObj.number || idx + 1;
                    const isActive = Number(selectedSeason) === Number(sNum);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSeason(sNum)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'glass-card border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sObj.name || `Temporada ${sNum}`}
                      </button>
                    );
                  })}
                </div>

                {/* Grid de Episodios */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {currentEpisodes.map((ep, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePlayClick(selectedSeason, ep.number || idx + 1)}
                      className="p-3 rounded-2xl glass-card border border-slate-800 hover:border-cyan-500/40 text-left transition-all hover:scale-105 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-cyan-400">
                        <span>Episodio {ep.number || idx + 1}</span>
                        <Play className="w-3.5 h-3.5 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                        {ep.title || `Capítulo ${ep.number || idx + 1}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BUG-02: Pasar initialSeason e initialEpisode al PlayerModal */}
      {showPlayer && content && (
        <PlayerModal
          item={{
            ...content,
            slug: slug.replace(/^(pelisplus|repelishd)_/, ''),
            provider,
          }}
          initialSeason={selectedSeason}
          initialEpisode={selectedEpisode}
          onClose={() => setShowPlayer(false)}
        />
      )}

      <Footer />
    </div>
  );
}
