import React, { useState, useEffect } from 'react';
import {
  Squadra,
  Atleta,
  Allenamento,
  CATEGORIE_SQUADRA_PREDEFINITE,
  GIORNI_SETTIMANA,
  Stagione,
  SistemaDiGioco,
  SISTEMI_DI_GIOCO,
} from '../types';
import { fetchTeams, saveTeam, deleteTeam, archiveTeam, duplicateTeam } from '../services/teamService';
import { fetchPlayers } from '../services/playerService';
import { fetchWorkouts } from '../services/workoutService';
import { fetchSeasons, saveSeason, setActiveSeason, toggleArchiveSeason } from '../services/seasonService';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Copy,
  Archive,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  Settings,
  X,
  User,
  Upload,
  Image as ImageIcon,
  Dumbbell,
  Volleyball,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';

interface TeamsViewProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [teams, setTeams] = useState<Squadra[]>([]);
  const [workouts, setWorkouts] = useState<Allenamento[]>([]);
  const [playersMap, setPlayersMap] = useState<Record<string, number>>({});
  const [seasons, setSeasons] = useState<Stagione[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab view: Attive vs Archiviate
  const [showArchived, setShowArchived] = useState(false);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Squadra | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<string>('U16');
  const [customCategoria, setCustomCategoria] = useState('');
  const [stagione, setStagione] = useState('2026/2027');
  const [allenatore, setAllenatore] = useState('');
  const [viceallenatore, setViceallenatore] = useState('');
  const [palestra, setPalestra] = useState('');
  const [giorniAllenamento, setGiorniAllenamento] = useState<string[]>(['Lunedì', 'Mercoledì', 'Venerdì']);
  const [oraInizio, setOraInizio] = useState('18:30');
  const [oraFine, setOraFine] = useState('20:30');
  const [note, setNote] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [sistemaDiGioco, setSistemaDiGioco] = useState<SistemaDiGioco>('5-1');
  const [sistemaPersonalizzatoNome, setSistemaPersonalizzatoNome] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Squadra | null>(null);

  // Duplicate modal
  const [duplicateTarget, setDuplicateTarget] = useState<Squadra | null>(null);
  const [dupSeason, setDupSeason] = useState('2027/2028');
  const [dupPlayers, setDupPlayers] = useState(true);

  // Seasons Management Modal
  const [isSeasonsModalOpen, setIsSeasonsModalOpen] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, sList, pList, wList] = await Promise.all([
        fetchTeams(coachId, true),
        fetchSeasons(coachId),
        fetchPlayers(coachId),
        fetchWorkouts(coachId),
      ]);
      setTeams(tList);
      setSeasons(sList);
      setWorkouts(wList);

      // Map player counts per team
      const pCount: Record<string, number> = {};
      pList.forEach((p) => {
        pCount[p.teamId] = (pCount[p.teamId] || 0) + 1;
      });
      setPlayersMap(pCount);
    } catch (e) {
      console.warn('Errore caricamento squadre:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [coachId]);

  const openCreateModal = () => {
    setEditingTeam(null);
    setNome('');
    setCategoria('U16');
    setCustomCategoria('');
    const activeSeason = seasons.find((s) => s.attiva)?.nome || '2026/2027';
    setStagione(activeSeason);
    setSistemaDiGioco('5-1');
    setSistemaPersonalizzatoNome('');
    setAllenatore(currentUser?.displayName || 'Coach Volley');
    setViceallenatore('');
    setPalestra('Palestra Comunale - Campo Principale');
    setGiorniAllenamento(['Lunedì', 'Mercoledì', 'Venerdì']);
    setOraInizio('18:30');
    setOraFine('20:30');
    setNote('');
    setLogoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Squadra) => {
    setEditingTeam(t);
    setNome(t.nome);
    const isPredef = CATEGORIE_SQUADRA_PREDEFINITE.includes(t.categoria as any);
    if (isPredef) {
      setCategoria(t.categoria);
      setCustomCategoria('');
    } else {
      setCategoria('Personalizzata');
      setCustomCategoria(t.categoria);
    }
    setStagione(t.stagione || '2026/2027');
    setSistemaDiGioco(t.sistemaDiGioco || '5-1');
    setSistemaPersonalizzatoNome(t.sistemaPersonalizzatoNome || '');
    setAllenatore(t.allenatore || '');
    setViceallenatore(t.viceallenatore || '');
    setPalestra(t.palestra || '');
    setGiorniAllenamento(t.giorniAllenamento || ['Lunedì', 'Mercoledì']);
    setOraInizio(t.oraInizio || '18:30');
    setOraFine(t.oraFine || '20:30');
    setNote(t.note || '');
    setLogoUrl(t.logoUrl || '');
    setIsModalOpen(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const finalCategoria = categoria === 'Personalizzata' ? (customCategoria.trim() || 'Personalizzata') : categoria;

    await saveTeam(
      {
        coachId,
        nome: nome.trim(),
        categoria: finalCategoria,
        stagione: stagione.trim(),
        sistemaDiGioco,
        sistemaPersonalizzatoNome: sistemaDiGioco === 'Personalizzato' ? sistemaPersonalizzatoNome.trim() : undefined,
        allenatore: allenatore.trim(),
        viceallenatore: viceallenatore.trim(),
        palestra: palestra.trim(),
        giorniAllenamento,
        oraInizio,
        oraFine,
        note: note.trim(),
        logoUrl: logoUrl.trim() || undefined,
        archiviata: editingTeam?.archiviata || false,
      },
      editingTeam?.id
    );

    setIsModalOpen(false);
    await loadData();
  };

  const handleToggleGiorni = (giorno: string) => {
    setGiorniAllenamento((prev) =>
      prev.includes(giorno) ? prev.filter((g) => g !== giorno) : [...prev, giorno]
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteTeam(deleteTarget.id);
    setDeleteTarget(null);
    await loadData();
  };

  const handleToggleArchive = async (team: Squadra) => {
    await archiveTeam(team.id, !team.archiviata, coachId);
    await loadData();
  };

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateTarget) return;
    const newId = await duplicateTeam(
      duplicateTarget.id,
      dupSeason.trim(),
      `${duplicateTarget.nome} (${dupSeason.trim()})`,
      dupPlayers,
      coachId
    );
    setDuplicateTarget(null);
    await loadData();
    onNavigate('team_detail', newId);
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName.trim()) return;
    await saveSeason({
      coachId,
      nome: newSeasonName.trim(),
      attiva: false,
      archiviata: false,
    });
    setNewSeasonName('');
    const updated = await fetchSeasons(coachId);
    setSeasons(updated);
  };

  const handleSetActiveSeason = async (sId: string) => {
    await setActiveSeason(coachId, sId);
    const updated = await fetchSeasons(coachId);
    setSeasons(updated);
  };

  const handleToggleArchiveSeason = async (s: Stagione) => {
    await toggleArchiveSeason(coachId, s.id, !s.archiviata);
    const updated = await fetchSeasons(coachId);
    setSeasons(updated);
  };

  // Filtered teams based on showArchived toggle
  const displayedTeams = teams.filter((t) => (showArchived ? t.archiviata : !t.archiviata));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      
      {/* HEADER DELLA PAGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestione Squadre
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organizza gruppi squadra, atleti, orari di palestra e storico stagionale
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSeasonsModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          >
            <Calendar size={15} />
            <span>Gestione Stagioni</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 transition flex items-center gap-2"
          >
            <Plus size={16} />
            <span>NUOVA SQUADRA</span>
          </button>
        </div>
      </div>

      {/* TABS SQUADRE ATTIVE / ARCHIVIATE */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            !showArchived
              ? 'bg-blue-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={16} />
          <span>Squadre Attive ({teams.filter((t) => !t.archiviata).length})</span>
        </button>

        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            showArchived
              ? 'bg-slate-800 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Archive size={16} />
          <span>Squadre Archiviate ({teams.filter((t) => t.archiviata).length})</span>
        </button>
      </div>

      {/* LISTA CARD SQUADRE */}
      {displayedTeams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <Users size={48} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            {showArchived
              ? 'Nessuna squadra archiviata'
              : 'Non hai ancora creato nessuna squadra'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {showArchived
              ? 'Le squadre archiviate delle passate stagioni appariranno qui.'
              : 'Crea subito la tua prima squadra (es. Under 16, Prima Squadra, Serie D) per inserire atleti e pianificare allenamenti dedicati.'}
          </p>
          {!showArchived && (
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
            >
              Crea Nuova Squadra
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTeams.map((team) => {
            const playerCount = playersMap[team.id] || 0;

            return (
              <div
                key={team.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  {/* Top Header with Badges & Logo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.nome}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
                          {team.categoria.slice(0, 3)}
                        </div>
                      )}
                      <div>
                        <h3
                          onClick={() => onNavigate('team_detail', team.id)}
                          className="text-base font-black text-slate-900 group-hover:text-blue-600 cursor-pointer transition line-clamp-1"
                        >
                          {team.nome}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Users size={13} className="text-blue-600" />
                          <span className="font-bold text-slate-700">{playerCount}</span>
                          <span>{playerCount === 1 ? 'atleta' : 'atleti'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        {team.categoria}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Sistema {team.sistemaDiGioco || '5-1'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {team.stagione}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {team.allenatore && (
                      <div className="flex items-center gap-2 truncate">
                        <User size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">Coach: <strong>{team.allenatore}</strong></span>
                      </div>
                    )}
                    {team.palestra && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{team.palestra}</span>
                      </div>
                    )}
                    {(team.giorniAllenamento && team.giorniAllenamento.length > 0) && (
                      <div className="flex items-center gap-2 truncate">
                        <Clock size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {team.giorniAllenamento.join(', ')} {team.oraInizio ? `(${team.oraInizio} - ${team.oraFine})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('team_detail', team.id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Dettaglio Squadra</span>
                    <ArrowRight size={14} />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(team)}
                      title="Modifica squadra"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setDuplicateTarget(team);
                        setDupSeason('2027/2028');
                        setDupPlayers(true);
                      }}
                      title="Duplica squadra per nuova stagione"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(team)}
                      title={team.archiviata ? 'Ripristina squadra' : 'Archivia squadra'}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(team)}
                      title="Elimina squadra"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE NUOVA / MODIFICA SQUADRA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {editingTeam ? 'Modifica Squadra' : 'Crea Nuova Squadra'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Squadra *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Es. Under 16 Femminile Volley Azzurra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {CATEGORIE_SQUADRA_PREDEFINITE.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Stagione Sportiva *
                  </label>
                  <input
                    type="text"
                    required
                    value={stagione}
                    onChange={(e) => setStagione(e.target.value)}
                    placeholder="2026/2027"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Sistema di Gioco (Versione 5 - Punto 1) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                  <span>Sistema di Gioco della Squadra *</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Modificabile in qualsiasi momento</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SISTEMI_DI_GIOCO.map((sys) => (
                    <button
                      key={sys}
                      type="button"
                      onClick={() => setSistemaDiGioco(sys)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-0.5 border ${
                        sistemaDiGioco === sys
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{sys}</span>
                      <span className={`text-[9px] font-normal ${sistemaDiGioco === sys ? 'text-blue-100' : 'text-slate-400'}`}>
                        {sys === '5-1' ? '1 P, 1 O, 2 S, 2 C' : sys === '4-2' ? '2 P, 2 S, 2 C' : sys === '6-2' ? '2 P penetraz.' : 'Libero'}
                      </span>
                    </button>
                  ))}
                </div>

                {sistemaDiGioco === 'Personalizzato' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={sistemaPersonalizzatoNome}
                      onChange={(e) => setSistemaPersonalizzatoNome(e.target.value)}
                      placeholder="Specifica nome sistema personalizzato (es. 4-2 Minivolley, Beach, S3...)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {categoria === 'Personalizzata' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Specifica Categoria Libera *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategoria}
                    onChange={(e) => setCustomCategoria(e.target.value)}
                    placeholder="Es. Minivolley S3 White, Misto Open, ..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Allenatore
                  </label>
                  <input
                    type="text"
                    value={allenatore}
                    onChange={(e) => setAllenatore(e.target.value)}
                    placeholder="Nome e cognome"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Viceallenatore
                  </label>
                  <input
                    type="text"
                    value={viceallenatore}
                    onChange={(e) => setViceallenatore(e.target.value)}
                    placeholder="Nome e cognome"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Palestra di Riferimento
                </label>
                <input
                  type="text"
                  value={palestra}
                  onChange={(e) => setPalestra(e.target.value)}
                  placeholder="Es. Palestra Scuola Media Dante Alighieri"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Giorni Abituali di Allenamento
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GIORNI_SETTIMANA.map((g) => {
                    const selected = giorniAllenamento.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => handleToggleGiorni(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          selected
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ora Inizio Abituale
                  </label>
                  <input
                    type="time"
                    value={oraInizio}
                    onChange={(e) => setOraInizio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ora Fine Abituale
                  </label>
                  <input
                    type="time"
                    value={oraFine}
                    onChange={(e) => setOraFine(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Logo / Foto Squadra (Opzionale)
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative group">
                      <img
                        src={logoUrl}
                        alt="Logo squadra"
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                        title="Rimuovi logo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <ImageIcon size={22} />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition">
                      <Upload size={14} />
                      <span>Carica Logo da dispositivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Oppure inserisci URL immagine (https://...)"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Note Squadra
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Informazioni societarie, referenti o obiettivi stagionali..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  {editingTeam ? 'Aggiorna Squadra' : 'Crea Squadra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DUPLICA SQUADRA */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-2">
              Duplica Squadra: {duplicateTarget.nome}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Crea rapidamente una nuova squadra indipendente per una nuova stagione sportiva.
            </p>

            <form onSubmit={handleDuplicate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nuova Stagione Sportiva
                </label>
                <input
                  type="text"
                  required
                  value={dupSeason}
                  onChange={(e) => setDupSeason(e.target.value)}
                  placeholder="2027/2028"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={dupPlayers}
                  onChange={(e) => setDupPlayers(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Duplica anche gli atleti associati nella nuova squadra</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicateTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Duplica Squadra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE GESTIONE STAGIONI */}
      {isSeasonsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Gestione Stagioni Sportive
              </h3>
              <button
                type="button"
                onClick={() => setIsSeasonsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <form onSubmit={handleCreateSeason} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  placeholder="Es. 2027/2028"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Aggiungi
                </button>
              </form>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {seasons.map((s) => {
                  const teamCount = teams.filter((t) => t.stagione === s.nome).length;
                  const workoutCount = workouts.filter((w) => w.stagione === s.nome).length;

                  return (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{s.nome}</span>
                          {s.attiva ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                              Attiva
                            </span>
                          ) : s.archiviata ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Archiviata
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Inattiva
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {teamCount} {teamCount === 1 ? 'squadra' : 'squadre'} • {workoutCount} {workoutCount === 1 ? 'allenamento' : 'allenamenti'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!s.attiva && (
                          <button
                            onClick={() => handleSetActiveSeason(s.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                          >
                            Attiva
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleArchiveSeason(s)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          {s.archiviata ? 'Ripristina' : 'Archivia'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSeasonsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CONFERMA ELIMINAZIONE SQUADRA */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Elimina Squadra"
        message={`Sei sicuro di voler eliminare la squadra "${deleteTarget?.nome}"? L'operazione non elimina gli allenamenti o gli esercizi creati.`}
        confirmText="Elimina Squadra"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};
