import React, { useState, useEffect } from 'react';
import {
  Squadra,
  Atleta,
  Allenamento,
  Esercizio,
  RuoloAtleta,
  RUOLI_ATLETA,
  EventoCalendario,
} from '../types';
import { fetchTeamById, saveTeam, archiveTeam, duplicateTeam } from '../services/teamService';
import {
  fetchPlayers,
  savePlayer,
  deletePlayer,
  checkDuplicateJerseyNumber,
} from '../services/playerService';
import { fetchWorkouts, updateWorkoutStatus } from '../services/workoutService';
import { fetchEvents } from '../services/eventService';
import { fetchExercises } from '../services/exerciseService';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Users,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Search,
  Filter,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Eye,
  Copy,
  Archive,
  Star,
  Printer,
  FileText,
  User,
  Activity,
  Layers,
  Upload,
  Image as ImageIcon,
  Swords,
  RotateCw,
  Trophy,
  ArrowRight,
  X,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';
import { generaPdfAllenamentoCompleto } from '../utils/pdfGenerator';

interface TeamDetailViewProps {
  teamId: string;
  onNavigate: (page: ActivePage, entityId?: string) => void;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({ teamId, onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [team, setTeam] = useState<Squadra | null>(null);
  const [players, setPlayers] = useState<Atleta[]>([]);
  const [workouts, setWorkouts] = useState<Allenamento[]>([]);
  const [teamEvents, setTeamEvents] = useState<EventoCalendario[]>([]);
  const [exercises, setExercises] = useState<Esercizio[]>([]);
  const [loading, setLoading] = useState(true);

  // Active section tab (Requirement 4)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'players' | 'workouts' | 'calendar' | 'exercises' | 'stats' | 'notes'
  >('players');

  // Player Form Modal
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Atleta | null>(null);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [numeroMaglia, setNumeroMaglia] = useState<number | string>(1);
  const [ruoloPrincipale, setRuoloPrincipale] = useState<RuoloAtleta>('Schiacciatore');
  const [ruoloSecondario, setRuoloSecondario] = useState<RuoloAtleta | ''>('');
  const [dataNascita, setDataNascita] = useState('');
  const [altezza, setAltezza] = useState<number | string>('');
  const [notePlayer, setNotePlayer] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [jerseyWarning, setJerseyWarning] = useState<string | null>(null);
  const [forceJerseySave, setForceJerseySave] = useState(false);

  // View Player Card Modal
  const [viewingPlayer, setViewingPlayer] = useState<Atleta | null>(null);

  // Delete Player Modal
  const [deletePlayerTarget, setDeletePlayerTarget] = useState<Atleta | null>(null);

  // Filters for players
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Team Edit & Duplicate Modal
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [dupSeason, setDupSeason] = useState('2027/2028');
  const [dupPlayers, setDupPlayers] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, pData, wData, eData, evData] = await Promise.all([
        fetchTeamById(teamId),
        fetchPlayers(coachId, teamId),
        fetchWorkouts(coachId),
        fetchExercises(coachId),
        fetchEvents(coachId),
      ]);
      setTeam(tData);
      setPlayers(pData);
      setExercises(eData);

      // Filter workouts associated with this team
      const teamWks = wData.filter(
        (w) => w.teamId === teamId || (tData && w.squadra === tData.nome)
      );
      setWorkouts(teamWks);

      // Filter custom events associated with this team (Requirement 4 & 15)
      const teamEvs = evData.filter(
        (ev) => ev.teamId === teamId || (tData && ev.teamNome === tData.nome)
      );
      setTeamEvents(teamEvs);
    } catch (e) {
      console.warn('Errore caricamento dettagli squadra:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamId, coachId]);

  // Open Player Modal
  const openNewPlayerModal = () => {
    setEditingPlayer(null);
    setNome('');
    setCognome('');
    // Calculate next available jersey number
    const usedNumbers = new Set(players.map((p) => p.numeroMaglia));
    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
      nextNum++;
    }
    setNumeroMaglia(nextNum);
    setRuoloPrincipale('Schiacciatore');
    setRuoloSecondario('');
    setDataNascita('');
    setAltezza('');
    setNotePlayer('');
    setFotoUrl('');
    setJerseyWarning(null);
    setForceJerseySave(false);
    setIsPlayerModalOpen(true);
  };

  const openEditPlayerModal = (p: Atleta) => {
    setEditingPlayer(p);
    setNome(p.nome);
    setCognome(p.cognome);
    setNumeroMaglia(p.numeroMaglia);
    setRuoloPrincipale(p.ruoloPrincipale);
    setRuoloSecondario(p.ruoloSecondario || '');
    setDataNascita(p.dataNascita || '');
    setAltezza(p.altezza || '');
    setNotePlayer(p.note || '');
    setFotoUrl(p.fotoUrl || '');
    setJerseyWarning(null);
    setForceJerseySave(false);
    setIsPlayerModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim() || !numeroMaglia) return;

    const num = Number(numeroMaglia);

    // Check duplicate jersey number
    if (!forceJerseySave) {
      const isDup = await checkDuplicateJerseyNumber(coachId, teamId, num, editingPlayer?.id);
      if (isDup) {
        setJerseyWarning(
          `Attenzione: il numero ${num} è già assegnato a un altro atleta di questa squadra. Vuoi confermare comunque l'assegnazione?`
        );
        setForceJerseySave(true);
        return;
      }
    }

    const birthYear = dataNascita ? new Date(dataNascita).getFullYear() : undefined;

    await savePlayer(
      {
        coachId,
        teamId,
        nome: nome.trim(),
        cognome: cognome.trim(),
        numeroMaglia: num,
        ruoloPrincipale,
        ruoloSecondario: (ruoloSecondario as RuoloAtleta) || undefined,
        dataNascita: dataNascita || undefined,
        annoNascita: birthYear,
        altezza: altezza ? Number(altezza) : undefined,
        note: notePlayer.trim(),
        fotoUrl: fotoUrl.trim() || undefined,
      },
      editingPlayer?.id
    );

    setIsPlayerModalOpen(false);
    await loadData();
  };

  const confirmDeletePlayer = async () => {
    if (!deletePlayerTarget) return;
    await deletePlayer(deletePlayerTarget.id, coachId);
    setDeletePlayerTarget(null);
    await loadData();
  };

  const handleToggleArchive = async () => {
    if (!team) return;
    const newArch = !team.archiviata;
    await archiveTeam(team.id, newArch, coachId);
    setTeam({ ...team, archiviata: newArch });
  };

  const handleDuplicateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    const newId = await duplicateTeam(team.id, dupSeason, `${team.nome} (${dupSeason})`, dupPlayers, coachId);
    setIsDuplicateModalOpen(false);
    onNavigate('team_detail', newId);
  };

  const handleStatusChange = async (wId: string, newStato: any) => {
    await updateWorkoutStatus(wId, newStato, coachId);
    await loadData();
  };

  // Filtered players
  const filteredPlayers = players.filter((p) => {
    const fullName = `${p.nome} ${p.cognome}`.toLowerCase();
    const matchesSearch = fullName.includes(playerSearch.toLowerCase()) || p.numeroMaglia.toString() === playerSearch;
    const matchesRole = selectedRole === 'all' || p.ruoloPrincipale === selectedRole || p.ruoloSecondario === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Calculate exercises used by this team across all workouts
  const exercisesUsedMap = new Map<
    string,
    { id: string; titolo: string; categoria: string; count: number; lastDate: string }
  >();

  workouts.forEach((w) => {
    (w.esercizi || []).forEach((ex) => {
      const exId = ex.originalExerciseId || ex.id;
      const existing = exercisesUsedMap.get(exId);
      if (existing) {
        existing.count += 1;
        if (w.data > existing.lastDate) {
          existing.lastDate = w.data;
        }
      } else {
        exercisesUsedMap.set(exId, {
          id: exId,
          titolo: ex.titolo,
          categoria: ex.categoria,
          count: 1,
          lastDate: w.data,
        });
      }
    });
  });

  const exercisesUsedList = Array.from(exercisesUsedMap.values()).sort(
    (a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate)
  );

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Caricamento dettagli squadra in corso...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Squadra non trovata</h3>
        <button
          onClick={() => onNavigate('teams')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Torna all'elenco squadre
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      
      {/* HEADER SQUADRA */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <button
              onClick={() => onNavigate('teams')}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition flex-shrink-0"
              title="Torna alle Squadre"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-full font-black text-xs uppercase tracking-wide">
                  {team.categoria}
                </span>
                <span className="px-3 py-1 bg-white/15 text-blue-200 rounded-full font-bold text-xs">
                  {team.stagione}
                </span>
                {team.archiviata && (
                  <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full font-bold text-[10px]">
                    Archiviata
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {team.nome}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200/90 pt-1">
                <div className="flex items-center gap-1.5">
                  <RotateCw size={14} className="text-amber-400" />
                  <span>Sistema: <strong className="text-amber-300">{team.sistemaDiGioco || '5-1'}</strong></span>
                </div>
                {team.allenatore && (
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-amber-400" />
                    <span>All: <strong>{team.allenatore}</strong></span>
                  </div>
                )}
                {team.palestra && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-400" />
                    <span>{team.palestra}</span>
                  </div>
                )}
                {(team.oraInizio || (team.giorniAllenamento && team.giorniAllenamento.length > 0)) && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" />
                    <span>
                      {team.giorniAllenamento?.join(', ')} {team.oraInizio ? `(${team.oraInizio} - ${team.oraFine})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => onNavigate('rotations')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5"
            >
              <RotateCw size={15} />
              <span>Rotazioni (P1-P6)</span>
            </button>

            <button
              onClick={() => onNavigate('new_workout')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Dumbbell size={15} />
              <span>Crea Allenamento</span>
            </button>

            <button
              onClick={() => setIsDuplicateModalOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Duplica Squadra per Nuova Stagione"
            >
              <Copy size={15} />
              <span className="hidden sm:inline">Duplica</span>
            </button>

            <button
              onClick={handleToggleArchive}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title={team.archiviata ? 'Ripristina squadra' : 'Archivia squadra'}
            >
              <Archive size={15} />
              <span className="hidden sm:inline">{team.archiviata ? 'Ripristina' : 'Archivia'}</span>
            </button>
          </div>
        </div>

        {/* TABS DI NAVIGAZIONE INTERNA (Requirement 4) */}
        <div className="mt-8 flex gap-2 overflow-x-auto border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'overview'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Activity size={16} />
            <span>Panoramica</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'players'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users size={16} />
            <span>Atleti ({players.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'workouts'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Dumbbell size={16} />
            <span>Allenamenti ({workouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Calendar size={16} />
            <span>Calendario ({workouts.length + teamEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'exercises'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ClipboardList size={16} />
            <span>Esercizi Utilizzati ({exercisesUsedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'stats'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers size={16} />
            <span>Statistiche</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'notes'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText size={16} />
            <span>Note</span>
          </button>
        </div>
      </div>

      {/* SEZIONE 1: ATLETI */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Cerca atleta per nome o numero..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">Tutti i Ruoli</option>
                {RUOLI_ATLETA.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openNewPlayerModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>NUOVO ATLETA</span>
            </button>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <Users size={40} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">
                Nessun atleta presente in questa squadra
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Aggiungi le tue giocatrici o i tuoi giocatori con numero di maglia, ruolo, altezza e note tecniche.
              </p>
              <button
                onClick={openNewPlayerModal}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Aggiungi il Primo Atleta</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-16 text-center">Maglia</th>
                      <th className="py-3 px-4">Nome e Cognome</th>
                      <th className="py-3 px-4">Ruolo Principale</th>
                      <th className="py-3 px-4">Ruolo Secondario</th>
                      <th className="py-3 px-4 text-center">Anno Nascita</th>
                      <th className="py-3 px-4 text-center">Altezza</th>
                      <th className="py-3 px-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3 px-4 text-center">
                          <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-sm">
                            {p.numeroMaglia}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            {p.fotoUrl ? (
                              <img
                                src={p.fotoUrl}
                                alt={`${p.nome} ${p.cognome}`}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                              />
                            ) : null}
                            <span>
                              {p.cognome} {p.nome}
                            </span>
                            {p.note && (
                              <span
                                title={p.note}
                                className="w-2 h-2 rounded-full bg-amber-400"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">
                            {p.ruoloPrincipale}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {p.ruoloSecondario ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {p.ruoloSecondario}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">
                          {p.annoNascita || (p.dataNascita ? p.dataNascita.split('-')[0] : '-')}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-semibold">
                          {p.altezza ? `${p.altezza} cm` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingPlayer(p)}
                              title="Visualizza Scheda Atleta"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditPlayerModal(p)}
                              title="Modifica Atleta"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeletePlayerTarget(p)}
                              title="Elimina Atleta"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEZIONE 2: ALLENAMENTI SQUADRA */}
      {activeTab === 'workouts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Sedute di Allenamento ({workouts.length})
            </h3>
            <button
              onClick={() => onNavigate('new_workout')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} />
              <span>Nuovo Allenamento</span>
            </button>
          </div>

          {workouts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <Dumbbell size={36} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">
                Nessun allenamento programmato per questa squadra
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea una seduta indicando data, orari e aggiungendo esercizi con la lavagna tattica.
              </p>
              <button
                onClick={() => onNavigate('new_workout')}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Crea Seduta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workouts.map((wk) => (
                <div
                  key={wk.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-400 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          wk.stato === 'Completato'
                            ? 'bg-emerald-100 text-emerald-800'
                            : wk.stato === 'Annullato'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {wk.stato || 'Programmato'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{wk.data}</span>
                    </div>

                    <h4
                      onClick={() => onNavigate('edit_workout', wk.id)}
                      className="font-black text-base text-slate-900 group-hover:text-emerald-600 cursor-pointer transition line-clamp-1"
                    >
                      {wk.titolo}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {wk.oraInizio} - {wk.oraFine}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600">
                        {wk.esercizi?.length || 0} esercizi
                      </span>
                    </div>

                    {wk.obiettivo && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong>Obiettivo:</strong> {wk.obiettivo}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {wk.stato !== 'Completato' && (
                        <button
                          onClick={() => handleStatusChange(wk.id, 'Completato')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                        >
                          Segna Completato
                        </button>
                      )}
                      {wk.stato === 'Completato' && (
                        <button
                          onClick={() => handleStatusChange(wk.id, 'Programmato')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                        >
                          Riapri
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => generaPdfAllenamentoCompleto(wk)}
                        title="Stampa PDF"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => onNavigate('edit_workout', wk.id)}
                        title="Modifica"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEZIONE CALENDARIO SQUADRA (Requirement 4 & 12) */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <span>Calendario e Impegni: {team.nome}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tutti gli allenamenti, le partite, i tornei e gli eventi in programma per questa squadra
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('new_workout')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} />
                <span>Pianifica Allenamento</span>
              </button>

              <button
                onClick={() => onNavigate('calendar')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Calendario Generale</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {workouts.length === 0 && teamEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <Calendar size={40} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">
                Nessun impegno in calendario per questa squadra
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pianifica una sessione di allenamento o crea una partita per visualizzarla nel calendario.
              </p>
              <button
                onClick={() => onNavigate('new_workout')}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Pianifica Primo Allenamento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                ...workouts.map((w) => ({
                  id: `wk_${w.id}`,
                  entityId: w.id,
                  type: 'Allenamento' as const,
                  title: w.titolo,
                  date: w.data,
                  startTime: w.oraInizio,
                  endTime: w.oraFine,
                  location: w.palestra,
                  status: w.stato || 'Programmato',
                  opponent: undefined,
                  isWorkout: true,
                })),
                ...teamEvents.map((ev) => ({
                  id: `ev_${ev.id}`,
                  entityId: ev.id,
                  type: ev.tipo,
                  title: ev.titolo,
                  date: ev.data,
                  startTime: ev.oraInizio,
                  endTime: ev.oraFine,
                  location: ev.luogo,
                  status: ev.stato || 'Programmato',
                  opponent: ev.avversario,
                  isWorkout: false,
                })),
              ]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            item.type === 'Partita'
                              ? 'bg-purple-100 text-purple-800'
                              : item.type === 'Torneo'
                              ? 'bg-amber-100 text-amber-800'
                              : item.type === 'Allenamento'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.type}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Completato'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'Annullato'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {item.status}
                        </span>

                        <span className="text-xs font-bold text-slate-700">
                          {item.date}
                        </span>
                      </div>

                      <h4
                        onClick={() => {
                          if (item.isWorkout) onNavigate('edit_workout', item.entityId);
                          else onNavigate('calendar');
                        }}
                        className="font-black text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition"
                      >
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {item.startTime} - {item.endTime}
                        </span>
                        {item.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {item.location}
                            </span>
                          </>
                        )}
                        {item.opponent && (
                          <>
                            <span>•</span>
                            <span>vs <strong>{item.opponent}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {item.isWorkout ? (
                        <button
                          onClick={() => onNavigate('edit_workout', item.entityId)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <span>Apri Allenamento</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate('calendar')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <span>Vedi in Calendario</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SEZIONE 3: ESERCIZI UTILIZZATI DALLA SQUADRA */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Esercizi Utilizzati negli Allenamenti
              </h3>
              <p className="text-xs text-slate-500">
                Frequenza d'uso e storico delle esercitazioni svolte con questa squadra
              </p>
            </div>
            <button
              onClick={() => onNavigate('exercises')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Archivio Generale
            </button>
          </div>

          {exercisesUsedList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <ClipboardList size={36} className="mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-800">
                Nessun esercizio ancora registrato negli allenamenti
              </h4>
              <p className="text-xs text-slate-500">
                Crea il tuo primo allenamento per questa squadra per tracciare la frequenza degli esercizi!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercisesUsedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('edit_exercise', item.id)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.categoria}
                      </span>
                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {item.count} {item.count === 1 ? 'utilizzo' : 'utilizzi'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                      {item.titolo}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Ultimo: <strong>{item.lastDate}</strong></span>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
                      Vedi scheda &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEZIONE 4: PANORAMICA & STATISTICHE VELOCI */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Dati Squadra</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                  Categoria
                </span>
                <span className="font-bold text-slate-800 text-sm">{team.categoria}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                  Stagione Sportiva
                </span>
                <span className="font-bold text-slate-800 text-sm">{team.stagione}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                  Staff Tecnico
                </span>
                <span className="font-bold text-slate-800">
                  All: {team.allenatore || 'Non assegnato'}
                </span>
                {team.viceallenatore && (
                  <span className="text-slate-600 block">Vice: {team.viceallenatore}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                  Palestra
                </span>
                <span className="font-bold text-slate-800">{team.palestra || 'Palestra non specificata'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Riepilogo Attività</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <span className="block text-2xl font-black text-blue-700">{players.length}</span>
                <span className="text-[11px] font-semibold text-slate-500">Atleti Registrati</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <span className="block text-2xl font-black text-emerald-700">{workouts.length}</span>
                <span className="text-[11px] font-semibold text-slate-500">Allenamenti</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-2xl">
                <span className="block text-2xl font-black text-purple-700">{exercisesUsedList.length}</span>
                <span className="text-[11px] font-semibold text-slate-500">Esercizi Unici</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl">
                <span className="block text-2xl font-black text-amber-700">
                  {workouts.filter((w) => w.stato === 'Completato').length}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Completati</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Orari di Allenamento</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Giorni:</strong>{' '}
                {team.giorniAllenamento && team.giorniAllenamento.length > 0
                  ? team.giorniAllenamento.join(', ')
                  : 'Nessun giorno impostato'}
              </p>
              <p>
                <strong>Orario consueto:</strong>{' '}
                {team.oraInizio ? `${team.oraInizio} - ${team.oraFine}` : 'Non specificato'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('new_workout')}
              className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
            >
              Pianifica Seduta
            </button>
          </div>
        </div>
      )}

      {/* SEZIONE 5: STATISTICHE SQUADRA */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-black text-lg text-slate-900">
            Distribuzione Ruoli della Squadra
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {RUOLI_ATLETA.map((ruolo) => {
              const count = players.filter((p) => p.ruoloPrincipale === ruolo).length;
              return (
                <div key={ruolo} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="block text-2xl font-black text-slate-900">{count}</span>
                  <span className="text-xs font-semibold text-slate-500">{ruolo}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-slate-800 mb-3">Statistiche Altezza</h4>
            {players.filter((p) => p.altezza).length > 0 ? (
              <div className="flex gap-6 text-xs text-slate-600">
                <div>
                  <span className="block font-bold text-base text-slate-900">
                    {Math.round(
                      players.reduce((acc, p) => acc + (p.altezza || 0), 0) /
                        (players.filter((p) => p.altezza).length || 1)
                    )}{' '}
                    cm
                  </span>
                  <span>Altezza Media</span>
                </div>
                <div>
                  <span className="block font-bold text-base text-slate-900">
                    {Math.max(...players.map((p) => p.altezza || 0))} cm
                  </span>
                  <span>Altezza Massima</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Nessuna altezza inserita per gli atleti.</p>
            )}
          </div>
        </div>
      )}

      {/* SEZIONE 6: NOTE SOCIETARIE */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900">Note e Direttive Tecniche Squadra</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {team.note || 'Nessuna nota presente per questa squadra. Puoi modificarla dalle impostazioni della squadra.'}
          </p>
        </div>
      )}

      {/* MODALE NUOVO / MODIFICA ATLETA */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {editingPlayer ? 'Modifica Scheda Atleta' : 'Aggiungi Nuovo Atleta'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPlayerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {jerseyWarning && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{jerseyWarning}</span>
              </div>
            )}

            <form onSubmit={handleSavePlayer} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Giulia"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    placeholder="Rossi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Numero Maglia *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={99}
                    value={numeroMaglia}
                    onChange={(e) => {
                      setNumeroMaglia(e.target.value);
                      setJerseyWarning(null);
                      setForceJerseySave(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center text-blue-700 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ruolo Principale *
                  </label>
                  <select
                    required
                    value={ruoloPrincipale}
                    onChange={(e) => setRuoloPrincipale(e.target.value as RuoloAtleta)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {RUOLI_ATLETA.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ruolo Secondario
                  </label>
                  <select
                    value={ruoloSecondario}
                    onChange={(e) => setRuoloSecondario(e.target.value as RuoloAtleta)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="">Nessuno</option>
                    {RUOLI_ATLETA.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data di Nascita
                  </label>
                  <input
                    type="date"
                    value={dataNascita}
                    onChange={(e) => setDataNascita(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Altezza (cm)
                  </label>
                  <input
                    type="number"
                    min={120}
                    max={230}
                    value={altezza}
                    onChange={(e) => setAltezza(e.target.value)}
                    placeholder="178"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Foto Atleta (Opzionale)
                </label>
                <div className="flex items-center gap-3">
                  {fotoUrl ? (
                    <div className="relative group">
                      <img
                        src={fotoUrl}
                        alt="Foto atleta"
                        className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoUrl('')}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                        title="Rimuovi foto"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <User size={22} />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition">
                      <Upload size={13} />
                      <span>Carica Foto da dispositivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={fotoUrl}
                      onChange={(e) => setFotoUrl(e.target.value)}
                      placeholder="Oppure inserisci URL immagine (https://...)"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Note Tecniche o Mediche (Privato)
                </label>
                <textarea
                  rows={2}
                  value={notePlayer}
                  onChange={(e) => setNotePlayer(e.target.value)}
                  placeholder="Note sulle caratteristiche dell'atleta o accorgimenti..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  {forceJerseySave ? 'Conferma e Salva' : 'Salva Atleta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SCHEDA ATLETA (VISUALIZZA) */}
      {viewingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 relative">
            <button
              onClick={() => setViewingPlayer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              &times;
            </button>

            <div className="text-center pb-6 border-b border-slate-100">
              {viewingPlayer.fotoUrl ? (
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <img
                    src={viewingPlayer.fotoUrl}
                    alt={`${viewingPlayer.nome} ${viewingPlayer.cognome}`}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-600 shadow-md mx-auto"
                  />
                  <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                    {viewingPlayer.numeroMaglia}
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-3">
                  {viewingPlayer.numeroMaglia}
                </div>
              )}
              <h3 className="text-xl font-black text-slate-900">
                {viewingPlayer.nome} {viewingPlayer.cognome}
              </h3>
              <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-xs">
                {viewingPlayer.ruoloPrincipale}
              </span>
            </div>

            <div className="py-4 space-y-3 text-xs">
              {viewingPlayer.ruoloSecondario && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Ruolo Secondario:</span>
                  <span className="font-bold text-slate-800">{viewingPlayer.ruoloSecondario}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Anno di Nascita:</span>
                <span className="font-bold text-slate-800">
                  {viewingPlayer.annoNascita || viewingPlayer.dataNascita || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Altezza:</span>
                <span className="font-bold text-slate-800">
                  {viewingPlayer.altezza ? `${viewingPlayer.altezza} cm` : '-'}
                </span>
              </div>
              {viewingPlayer.note && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Note Tecniche:</span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                    {viewingPlayer.note}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const p = viewingPlayer;
                  setViewingPlayer(null);
                  openEditPlayerModal(p);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Modifica Scheda
              </button>
              <button
                onClick={() => setViewingPlayer(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DUPLICA SQUADRA */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-2">
              Duplica Squadra per Nuova Stagione
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Crea rapidamente una nuova squadra indipendente mantenendo le impostazioni societarie.
            </p>

            <form onSubmit={handleDuplicateTeam} className="space-y-4">
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
                <span>Duplica anche gli atleti ({players.length}) nella nuova squadra</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Crea Nuova Squadra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PLAYER MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletePlayerTarget)}
        title="Elimina Atleta"
        message={`Sei sicuro di voler eliminare ${deletePlayerTarget?.nome} ${deletePlayerTarget?.cognome} (Maglia #${deletePlayerTarget?.numeroMaglia}) da questa squadra?`}
        confirmText="Elimina Atleta"
        onConfirm={confirmDeletePlayer}
        onCancel={() => setDeletePlayerTarget(null)}
      />

    </div>
  );
};
