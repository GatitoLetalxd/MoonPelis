import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { X, Play, Server, Loader2, AlertTriangle, Maximize2 } from 'lucide-react';

export default function PlayerModal({ item, initialSeason = 1, initialEpisode = 1, onClose }) {
  const [servers, setServers] = useState([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [selectedServer, setSelectedServer] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  // Estados para series
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (item) {
      fetchServers();
    }
  }, [item, selectedSeason, selectedEpisode]);

  const fetchServers = async () => {
    try {
      setLoadingServers(true);
      setError(null);
      const provider = item.provider || 'pelisplus';
      const slug = item.slug || item.id?.replace(/^(pelisplus|repelishd)_/, '');

      const params = { provider, type: item.type || 'movie' };
      if (item.type === 'series') {
        params.season = selectedSeason;
        params.episode = selectedEpisode;
      }

      const res = await api.get(`/content/servers/${slug}`, { params });
      const serverList = res.data.servers || [];

      setServers(serverList);

      if (serverList.length > 0) {
        const first = serverList[0];
        setSelectedServer(first);
        setStreamUrl(first.url || '');
      } else {
        setSelectedServer(null);
        setStreamUrl('');
      }

      // Guardar en historial
      try {
        await api.post('/user/history', {
          content_id: slug,
          title: item.title,
          poster: item.poster || '',
          season: item.type === 'series' ? selectedSeason : null,
          episode: item.type === 'series' ? selectedEpisode : null,
          provider,
        });
      } catch (_) {
        // Ignore
      }
    } catch (err) {
      console.error('Error cargando servidores:', err);
      setError('No se pudieron obtener los servidores de video para este contenido.');
    } finally {
      setLoadingServers(false);
    }
  };

  const handleServerClick = (srv) => {
    setSelectedServer(srv);
    setStreamUrl(srv.url || '');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Cerrar al hacer click en el backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl glass-modal rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 font-bold">
              <Play className="w-4 h-4 fill-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 line-clamp-1">
                {item.title}
              </h2>
              <p className="text-xs text-slate-400">
                {item.type === 'series'
                  ? `Temporada ${selectedSeason} • Episodio ${selectedEpisode}`
                  : 'Película HD'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              title="Pantalla Completa"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pantalla Completa</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {loadingServers ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
              <p className="text-sm font-semibold">Cargando servidores de streaming...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-rose-400 p-6 text-center">
              <AlertTriangle className="w-10 h-10" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : streamUrl && streamUrl.trim() !== '' ? (
            <div className="relative w-full h-full">
              <iframe
                src={`/api/v1/content/proxy/embed?url=${encodeURIComponent(streamUrl)}`}
                title={item.title}
                className="w-full h-full border-0"
                allowFullScreen
                referrerPolicy="origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <div className="text-slate-500 text-sm font-medium">
              No hay reproductor activo disponible.
            </div>
          )}
        </div>

        {/* Controls and Selectors Bottom */}
        <div className="p-5 bg-slate-950/90 border-t border-slate-800 space-y-4 overflow-y-auto max-h-48">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Servidores Disponibles</span>
            </div>
          </div>

          {loadingServers ? (
            <div className="text-xs text-slate-500 animate-pulse">Obteniendo enlaces...</div>
          ) : servers.length === 0 ? (
            <div className="text-xs text-slate-500">No se encontraron servidores externos.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {servers.map((srv, idx) => {
                const isActive = selectedServer?.url === srv.url;
                return (
                  <button
                    key={idx}
                    onClick={() => handleServerClick(srv)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{srv.server || `Opción ${idx + 1}`}</span>
                    {srv.lang && (
                      <span className="text-[10px] opacity-75 font-normal">({srv.lang})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
