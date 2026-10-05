import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  Sparkles,
  Tag,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  ShieldCheck,
  Flame,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { VolleyNews, CategoriaNews, CATEGORIE_NEWS } from '../types';
import { fetchNews, saveNews, deleteNews } from '../services/newsService';
import { useAuth } from '../context/AuthContext';

interface DashboardNewsProps {
  onNavigate?: (page: any, entityId?: string) => void;
  readOnly?: boolean;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  className?: string;
}

export const DashboardNews: React.FC<DashboardNewsProps> = ({
  onNavigate,
  readOnly = false,
  title,
  subtitle,
  badgeLabel,
  className = '',
}) => {
  const { currentUser, isAdmin } = useAuth();

  const [newsList, setNewsList] = useState<VolleyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');

  // Modal states
  const [readingNews, setReadingNews] = useState<VolleyNews | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<VolleyNews | null>(null);

  // Form states (Admin only)
  const [formTitolo, setFormTitolo] = useState('');
  const [formEstratto, setFormEstratto] = useState('');
  const [formContenuto, setFormContenuto] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaNews>('Curiosità');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formData, setFormData] = useState('');
  const [formInEvidenza, setFormInEvidenza] = useState(false);
  const [formTag, setFormTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAllNews = async () => {
    setLoading(true);
    try {
      const items = await fetchNews();
      setNewsList(items);
    } catch (err) {
      console.warn('Errore caricamento news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllNews();
  }, []);

  const handleOpenCreate = () => {
    setEditingNews(null);
    setFormTitolo('');
    setFormEstratto('');
    setFormContenuto('');
    setFormCategoria('Curiosità');
    setFormImageUrl('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80');
    setFormData(new Date().toISOString().split('T')[0]);
    setFormInEvidenza(false);
    setFormTag('Pallavolo, Curiosità');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: VolleyNews, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNews(item);
    setFormTitolo(item.titolo);
    setFormEstratto(item.estratto || '');
    setFormContenuto(item.contenuto);
    setFormCategoria(item.categoria);
    setFormImageUrl(item.imageUrl || '');
    setFormData(item.data);
    setFormInEvidenza(Boolean(item.inEvidenza));
    setFormTag((item.tag || []).join(', '));
    setIsEditorOpen(true);
  };

  const handleDelete = async (newsId: string, titolo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Sei sicuro di voler eliminare la notizia "${titolo}"?`)) {
      return;
    }
    try {
      await deleteNews(newsId);
      setNewsList((prev) => prev.filter((n) => n.id !== newsId));
      setStatusMessage({ type: 'success', text: 'Notizia eliminata con successo.' });
      setTimeout(() => setStatusMessage(null), 3000);
      if (readingNews?.id === newsId) {
        setReadingNews(null);
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Errore durante l\'eliminazione della notizia.' });
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitolo.trim() || !formContenuto.trim()) {
      setStatusMessage({ type: 'error', text: 'Inserisci titolo e contenuto per la notizia.' });
      return;
    }

    setSaving(true);
    try {
      const tagArray = formTag
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const saved = await saveNews({
        id: editingNews ? editingNews.id : undefined,
        titolo: formTitolo,
        estratto: formEstratto,
        contenuto: formContenuto,
        categoria: formCategoria,
        imageUrl: formImageUrl,
        data: formData || new Date().toISOString().split('T')[0],
        inEvidenza: formInEvidenza,
        tag: tagArray.length > 0 ? tagArray : ['Pallavolo'],
        autore: currentUser?.displayName || 'Amministrazione Volley Coach',
        creatoDaAdminUid: currentUser?.uid || 'admin',
      });

      if (editingNews) {
        setNewsList((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
        setStatusMessage({ type: 'success', text: 'Notizia aggiornata con successo!' });
      } else {
        setNewsList((prev) => [saved, ...prev]);
        setStatusMessage({ type: 'success', text: 'Nuova notizia pubblicata con successo!' });
      }

      setIsEditorOpen(false);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.warn('Errore salvataggio notizia:', err);
      setStatusMessage({ type: 'error', text: 'Errore durante il salvataggio della notizia.' });
    } finally {
      setSaving(false);
    }
  };

  // Filtered news
  const filteredNews = newsList.filter((item) => {
    if (selectedCategory === 'Tutte') return true;
    return item.categoria === selectedCategory;
  });

  const getCategoryBadgeColor = (cat: CategoriaNews) => {
    switch (cat) {
      case 'Curiosità':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Notizie':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Tattica & Tecnica':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Regolamento':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'Aggiornamenti':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const canManage = !readOnly && isAdmin;

  return (
    <section className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6 ${className}`}>
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 font-bold">
              <Newspaper size={20} />
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {title || 'News & Curiosità della Pallavolo'}
            </h3>
            {canManage && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                <ShieldCheck size={12} />
                <span>Pannello Admin</span>
              </span>
            )}
            {readOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200/80">
                <Sparkles size={11} className="text-amber-500" />
                <span>{badgeLabel || 'Lettura Libera a Tutti'}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {subtitle ||
              "Notizie federali, curiosità storiche, chiarimenti regolamentari e spunti tecnici aggiornati curati esclusivamente dall'amministrazione."}
          </p>
        </div>

        {/* Admin Action Button: Only visible to Administrator when NOT readOnly! */}
        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            title="Inserisci e pubblica una nuova notizia o curiosità (Solo Amministratore)"
          >
            <Plus size={16} />
            <span>SCRIVI NOTIZIA O CURIOSITÀ</span>
          </button>
        )}
      </div>

      {/* Status notification toast */}
      {statusMessage && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. CATEGORY FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {['Tutte', ...CATEGORIE_NEWS].map((cat) => {
          const count =
            cat === 'Tutte'
              ? newsList.length
              : newsList.filter((n) => n.categoria === cat).length;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. NEWS CARDS GRID */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Caricamento notizie e curiosità in corso...
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
          <BookOpen className="mx-auto text-slate-400" size={32} />
          <h4 className="text-sm font-bold text-slate-700">Nessuna notizia in questa categoria</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {canManage
              ? 'Come amministratore puoi cliccare sul pulsante "Scrivi Notizia o Curiosità" per pubblicare il primo articolo.'
              : 'Non ci sono ancora notizie o curiosità per la categoria selezionata.'}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Aggiungi Prima Notizia</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              onClick={() => setReadingNews(item)}
              className="group bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              <div>
                {/* News Image Header with Fallback */}
                {item.imageUrl && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200">
                    <img
                      src={item.imageUrl}
                      alt={item.titolo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        // Hide image container on broken image link
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {item.inEvidenza && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                        <Flame size={12} />
                        <span>In Evidenza</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4 sm:p-5 space-y-2.5">
                  {/* Category & Date Line */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadgeColor(
                        item.categoria
                      )}`}
                    >
                      {item.categoria}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar size={12} />
                      {item.data}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                    {item.titolo}
                  </h4>

                  {/* Excerpt */}
                  {item.estratto && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {item.estratto}
                    </p>
                  )}

                  {/* Tags */}
                  {item.tag && item.tag.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {item.tag.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-200/80"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-white/60 flex items-center justify-between text-xs">
                <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-1">
                  <span>Leggi tutto</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                </span>

                {/* Admin Management Buttons */}
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(item, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Modifica notizia (Solo Admin)"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, item.titolo, e)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Elimina notizia (Solo Admin)"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 4. MODAL: LETTURA COMPLETA NOTIZIA */}
      {readingNews && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            
            {/* Header Image if available */}
            {readingNews.imageUrl && (
              <div className="relative aspect-[21/9] w-full bg-slate-900 overflow-hidden">
                <img
                  src={readingNews.imageUrl}
                  alt={readingNews.titolo}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReadingNews(null)}
                  className="absolute top-3 right-3 p-1.5 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full transition"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-4">
              
              {!readingNews.imageUrl && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReadingNews(null)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Badges line */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getCategoryBadgeColor(
                      readingNews.categoria
                    )}`}
                  >
                    {readingNews.categoria}
                  </span>
                  {readingNews.inEvidenza && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                      In Evidenza
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User size={13} />
                    {readingNews.autore}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {readingNews.data}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {readingNews.titolo}
              </h2>

              {/* Excerpt */}
              {readingNews.estratto && (
                <div className="p-3 bg-slate-50 border-l-4 border-amber-400 rounded-r-xl text-xs sm:text-sm font-medium text-slate-700 italic">
                  {readingNews.estratto}
                </div>
              )}

              {/* Full Content */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3 pt-2">
                {readingNews.contenuto}
              </div>

              {/* Tags */}
              {readingNews.tag && readingNews.tag.length > 0 && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <Tag size={14} className="text-slate-400" />
                  {readingNews.tag.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Pubblicato dall'Amministrazione Volley Coach
                </span>
                <button
                  type="button"
                  onClick={() => setReadingNews(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Chiudi Lettura
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: SCRIVI / MODIFICA NOTIZIA (SOLO AMMINISTRATORE) */}
      {isEditorOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-6">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingNews ? 'Modifica Notizia / Curiosità' : 'Scrivi Nuova Notizia o Curiosità'}
                  </h3>
                  <span className="text-[11px] text-amber-800 font-semibold">
                    Funzionalità riservata esclusivamente all'Amministratore
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 space-y-4 text-xs">
              
              {/* Titolo */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titolo Notizia / Curiosità *
                </label>
                <input
                  type="text"
                  required
                  value={formTitolo}
                  onChange={(e) => setFormTitolo(e.target.value)}
                  placeholder="Es. Curiosità: Perché la palla da volley è tricolore?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Categoria & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as CategoriaNews)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {CATEGORIE_NEWS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Data Pubblicazione
                  </label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Estratto / Riassunto */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sommario Breve (per l'anteprima nella card)
                </label>
                <textarea
                  rows={2}
                  value={formEstratto}
                  onChange={(e) => setFormEstratto(e.target.value)}
                  placeholder="Una o due frasi che catturano l'attenzione del coach..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-y"
                />
              </div>

              {/* Contenuto Completo */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contenuto Completo dell'Articolo *
                </label>
                <textarea
                  rows={6}
                  required
                  value={formContenuto}
                  onChange={(e) => setFormContenuto(e.target.value)}
                  placeholder="Scrivi qui il testo completo, spiegazioni tattiche, aneddoti, curiosità e dettagli tecnici..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-y"
                />
              </div>

              {/* Immagine URL con preset rapidi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider">
                    URL Immagine di Copertina (Opzionale)
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-400">Preset:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormImageUrl(
                          'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80'
                        )
                      }
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Pallone
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormImageUrl(
                          'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1200&q=80'
                        )
                      }
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Campo
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormImageUrl(
                          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'
                        )
                      }
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Azione
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Tag & In Evidenza */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tag (separati da virgola)
                  </label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="Tattica, Regolamento, Libero"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formInEvidenza}
                      onChange={(e) => setFormInEvidenza(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                    <span className="ml-2 font-bold text-slate-800 text-xs">
                      Metti in Evidenza
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <span>Salvataggio...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{editingNews ? 'Aggiorna Notizia' : 'Pubblica Notizia'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
};
