import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroCarousel from '../components/HeroCarousel';
import MovieCard from '../components/MovieCard';
import api from '../services/api';
import { Film, Tv, Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const GENRES = [
  { id: '', name: 'Todos los Géneros' },
  { id: 'accion', name: 'Acción' },
  { id: 'animacion', name: 'Animación' },
  { id: 'comedia', name: 'Comedia' },
  { id: 'drama', name: 'Drama' },
  { id: 'ciencia-ficcion', name: 'Ciencia Ficción' },
  { id: 'terror', name: 'Terror' },
  { id: 'romance', name: 'Romance' },
  { id: 'suspenso', name: 'Suspenso' },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Filtros
  const [selectedType, setSelectedType] = useState('movie');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('pelisplus');

  // UX-05: Scroll al inicio al montar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // BUG-04: useEffect separado para búsqueda (no depende de filtros)
  useEffect(() => {
    if (queryParam) {
      fetchSearchResults(queryParam);
    }
  }, [queryParam]);

  // BUG-04: useEffect separado para catálogo (solo se ejecuta sin búsqueda)
  useEffect(() => {
    if (!queryParam) {
      fetchCatalog(1);
    }
  }, [queryParam, selectedType, selectedGenre, selectedProvider]);

  const fetchSearchResults = async (query) => {
    try {
      setLoading(true);
      const res = await api.get('/content/search', { params: { q: query } });
      setItems(res.data.results || []);
      setHasNextPage(false);
    } catch (err) {
      console.error('Error buscando contenido:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async (targetPage = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/content/catalog', {
        params: {
          type: selectedType,
          genre: selectedGenre,
          page: targetPage,
          provider: selectedProvider,
        },
      });
      setItems(res.data.items || []);
      setPage(res.data.page || 1);
      setHasNextPage(res.data.hasNextPage || false);
    } catch (err) {
      console.error('Error obteniendo catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchCatalog(newPage);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col">
      <Navbar onSearch={(q) => setSearchParams({ q })} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        {/* Banner Carrusel cuando no hay búsqueda activa */}
        {!queryParam && (
          <HeroCarousel
            items={items}
            onSelect={(item) => navigate(`/details/${item.slug || item.id}?provider=${item.provider || 'pelisplus'}&type=${item.type || 'movie'}`)}
          />
        )}

        {/* Header y Filtros del Catálogo */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-heading">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <span>{queryParam ? `Resultados para "${queryParam}"` : 'Catálogo de Estrenos'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {queryParam ? `Se encontraron ${items.length} coincidencias` : 'Explora miles de películas y series en alta definición'}
            </p>
          </div>

          {!queryParam && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* UX-04: cursor-pointer en los botones del switcher */}
              <div className="flex p-1 rounded-2xl glass-card border border-slate-800">
                <button
                  onClick={() => { setSelectedType('movie'); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedType === 'movie'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-4 h-4" /> Películas
                </button>
                <button
                  onClick={() => { setSelectedType('series'); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedType === 'series'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-4 h-4" /> Series
                </button>
              </div>

              {/* Provider Selector */}
              <select
                value={selectedProvider}
                onChange={(e) => { setSelectedProvider(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-2xl glass-card border border-slate-800 text-xs font-semibold text-slate-200 bg-slate-900/80 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="pelisplus">Servidor: PelisPlus</option>
                <option value="repelishd">Servidor: RePelisHD</option>
              </select>

              {/* Genre Selector */}
              <select
                value={selectedGenre}
                onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-2xl glass-card border border-slate-800 text-xs font-semibold text-slate-200 bg-slate-900/80 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {GENRES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Grid de Películas */}
        {loading ? (
          <div className="min-h-[350px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            <p className="text-sm font-semibold">Cargando catálogo cinematográfico...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="min-h-[300px] glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
            <Film className="w-12 h-12 text-slate-600" />
            <h3 className="text-lg font-bold text-slate-300">No se encontraron resultados</h3>
            <p className="text-xs text-slate-500">Prueba con otra palabra clave o cambia de servidor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {items.map((item, idx) => (
              <MovieCard
                key={item.id || idx}
                item={item}
                onClick={() =>
                  navigate(
                    `/details/${item.slug || item.id}?provider=${item.provider || selectedProvider}&type=${item.type || selectedType}`
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {!queryParam && !loading && items.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2.5 rounded-xl glass-card border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            <span className="text-xs font-bold text-cyan-400 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              Página {page}
            </span>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNextPage}
              className="px-4 py-2.5 rounded-xl glass-card border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
