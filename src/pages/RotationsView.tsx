import React, { useState, useEffect, useRef } from 'react';
import {
  Squadra,
  Atleta,
  SistemaDiGioco,
  PosizioneCampo,
  RuoloAtleta,
  SISTEMI_DI_GIOCO,
  POSIZIONI_CAMPO,
  GiocatoreInRotazione,
  AzioneRotazione,
  AZIONI_ROTAZIONE,
  BoardItem,
} from '../types';
import { fetchTeams } from '../services/teamService';
import { fetchPlayers } from '../services/playerService';
import { saveTacticalScheme } from '../services/tacticalSchemeService';
import { useAuth } from '../context/AuthContext';
import { VolleyBoard } from '../components/TacticalBoard/VolleyBoard';
import {
  getDefault51Lineup,
} from '../utils/volleyballTactics';
import {
  VOLLEYBALL_ROTATIONS,
  getRotationPhaseTactics,
  PlayerInfo,
} from '../utils/volleyballRotationsTactics';
import {
  RotateCw,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Sparkles,
  Sliders,
  Play,
  Pause,
  ArrowRight,
  Info,
  Zap,
  Flame,
  ArrowLeftRight,
  Eye,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';

interface RotationsViewProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
}

export const RotationsView: React.FC<RotationsViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [teams, setTeams] = useState<Squadra[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teamPlayers, setTeamPlayers] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tactical setup
  const [sistema, setSistema] = useState<SistemaDiGioco>('5-1');
  const [rotazione, setRotazione] = useState<number>(1); // 1 = P1, 2 = P2, 3 = P3, 4 = P4, 5 = P5, 6 = P6
  const [activePhase, setActivePhase] = useState<AzioneRotazione>('base');
  const [liberoAttivo, setLiberoAttivo] = useState<boolean>(true);
  const [showFipavGuidelines, setShowFipavGuidelines] = useState<boolean>(true);
  // Di default: visualizza la nomenclatura dei ruoli (P, S1, S2, C1, C2, L, O) anziché i numeri
  const [displayMode, setDisplayMode] = useState<'ruolo' | 'numero'>('ruolo');

  // Autoplay / Sequence Stepper state
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lineup state (roles P, O, S1, S2, C1, C2, L)
  const [lineup, setLineup] = useState<Record<string, GiocatoreInRotazione>>(getDefault51Lineup());

  // Current interactive items on the whiteboard
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);

  // Save as tactical scheme status
  const [schemeTitle, setSchemeTitle] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load coach teams
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const tList = await fetchTeams(coachId);
        setTeams(tList);
        if (tList.length > 0) {
          const firstTeam = tList[0];
          setSelectedTeamId(firstTeam.id);
          if (firstTeam.sistemaDiGioco) {
            setSistema(firstTeam.sistemaDiGioco);
          }
        }
      } catch (e) {
        console.warn('Errore caricamento squadre per rotazioni:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, [coachId]);

  // Load players when team changes and auto-assign to lineup
  useEffect(() => {
    if (!selectedTeamId) return;
    const loadTeamData = async () => {
      try {
        const pList = await fetchPlayers(coachId, selectedTeamId);
        setTeamPlayers(pList);

        if (pList.length >= 6) {
          const p = pList.find((pl) => pl.ruoloPrincipale === 'Palleggiatore') || pList[0];
          const o = pList.find((pl) => pl.ruoloPrincipale === 'Opposto') || pList[1];
          const spikers = pList.filter((pl) => pl.ruoloPrincipale === 'Schiacciatore');
          const s1 = spikers[0] || pList[2];
          const s2 = spikers[1] || pList[3];
          const middles = pList.filter((pl) => pl.ruoloPrincipale === 'Centrale');
          const c1 = middles[0] || pList[4];
          const c2 = middles[1] || pList[5];
          const lib = pList.find((pl) => pl.ruoloPrincipale === 'Libero') || {
            nome: 'Libero',
            numeroMaglia: 2,
            ruoloPrincipale: 'Libero' as RuoloAtleta,
          };

          setLineup(
            getDefault51Lineup({
              palleggiatore: { nome: `${p.nome} ${p.cognome || ''}`.trim(), numero: p.numeroMaglia },
              opposto: { nome: `${o.nome} ${o.cognome || ''}`.trim(), numero: o.numeroMaglia },
              schiacciatore1: { nome: `${s1.nome} ${s1.cognome || ''}`.trim(), numero: s1.numeroMaglia },
              schiacciatore2: { nome: `${s2.nome} ${s2.cognome || ''}`.trim(), numero: s2.numeroMaglia },
              centrale1: { nome: `${c1.nome} ${c1.cognome || ''}`.trim(), numero: c1.numeroMaglia },
              centrale2: { nome: `${c2.nome} ${c2.cognome || ''}`.trim(), numero: c2.numeroMaglia },
              libero: { nome: `${lib.nome} ${(lib as any).cognome || ''}`.trim(), numero: lib.numeroMaglia },
            })
          );
        }
      } catch (err) {
        console.warn('Errore caricamento atleti team:', err);
      }
    };
    loadTeamData();
  }, [selectedTeamId, coachId]);

  // Compute current tactical rotation data & items for whiteboard
  const currentTactics = getRotationPhaseTactics(
    rotazione,
    activePhase,
    lineup as Record<string, PlayerInfo>,
    showFipavGuidelines,
    displayMode
  );

  // Sync boardItems whenever rotation, phase, lineup, fipav guidelines or displayMode change
  useEffect(() => {
    setBoardItems(currentTactics.items);
  }, [rotazione, activePhase, lineup, showFipavGuidelines, displayMode]);

  // Sequence Autoplay Handler (cycles through: Base -> Ricezione -> Attacco -> Cambio)
  useEffect(() => {
    if (!isPlayingSequence) {
      if (sequenceTimerRef.current) clearInterval(sequenceTimerRef.current);
      return;
    }

    const phasesOrder: AzioneRotazione[] = ['base', 'servizio', 'ricezione', 'attacco', 'cambio'];
    sequenceTimerRef.current = setInterval(() => {
      setActivePhase((prev) => {
        const curIdx = phasesOrder.indexOf(prev);
        const nextIdx = (curIdx + 1) % phasesOrder.length;
        return phasesOrder[nextIdx];
      });
    }, 2800);

    return () => {
      if (sequenceTimerRef.current) clearInterval(sequenceTimerRef.current);
    };
  }, [isPlayingSequence]);

  // Handle Rotation change (P1 to P6)
  const handleSelectRotation = (rNum: number) => {
    setRotazione(Math.max(1, Math.min(6, rNum)));
  };

  const handleNextRot = () => {
    setRotazione((prev) => (prev === 6 ? 1 : prev + 1));
  };

  const handlePrevRot = () => {
    setRotazione((prev) => (prev === 1 ? 6 : prev - 1));
  };

  // Quick player lineup assignment change
  const handleUpdateLineupPlayer = (
    roleKey: string,
    field: 'nome' | 'numero',
    val: string | number
  ) => {
    setLineup((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [field]: val,
      },
    }));
  };

  // Save current rotation as a Tactical Scheme
  const handleSaveAsScheme = async () => {
    setIsSaving(true);
    try {
      const currentRotData = VOLLEYBALL_ROTATIONS[rotazione];
      const title =
        schemeTitle.trim() ||
        `${currentRotData?.title || `Rotazione P${rotazione}`} - Fase ${activePhase.toUpperCase()} (${
          teams.find((t) => t.id === selectedTeamId)?.nome || 'Squadra'
        })`;

      const boardDataObj = {
        items: boardItems,
        sistemaDiGioco: sistema,
        rotazione,
        liberoAttivo,
        displayMode: displayMode === 'ruolo' ? ('ruolo' as const) : ('numero' as const),
        courtView: 'intero' as const,
        netView: 'dall_alto' as const,
        situazione:
          activePhase === 'ricezione'
            ? ('Ricezione battuta avversaria' as const)
            : activePhase === 'servizio'
            ? ('Battuta' as const)
            : activePhase === 'attacco'
            ? ('Attacco' as const)
            : ('Situazione personalizzata' as const),
        showZoneNumbers: true,
        version: 2,
      };

      await saveTacticalScheme({
        coachId,
        titolo: title,
        categoria:
          activePhase === 'ricezione'
            ? 'Ricezione'
            : activePhase === 'servizio'
            ? 'Battuta'
            : activePhase === 'attacco'
            ? 'Attacco'
            : 'Cambio palla',
        sistemaDiGioco: sistema,
        rotazione,
        teamId: selectedTeamId || undefined,
        teamNome: teams.find((t) => t.id === selectedTeamId)?.nome,
        descrizione: `${currentTactics.phaseData.title}. ${currentTactics.phaseData.description} - Regole: ${currentTactics.phaseData.overlapRules}`,
        boardData: JSON.stringify(boardDataObj),
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.warn('Errore salvataggio schema da rotazioni:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for Phase Icon
  const getPhaseIcon = (phaseId: AzioneRotazione) => {
    switch (phaseId) {
      case 'base':
        return <Shield size={16} className="text-emerald-500" />;
      case 'servizio':
        return <Zap size={16} className="text-amber-500" />;
      case 'ricezione':
        return <Eye size={16} className="text-blue-500" />;
      case 'attacco':
        return <Flame size={16} className="text-red-500" />;
      case 'cambio':
        return <ArrowLeftRight size={16} className="text-purple-500" />;
      default:
        return <Sparkles size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <RotateCw size={26} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  SCHEDA ROTAZIONI PALLAVOLO (P1 - P6)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  FIVB / FIPAV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualizzazione su lavagna tattica interattiva: rotazioni dalla <strong>P1 alla P6</strong> nelle 5 azioni chiave (<strong>Base, Servizio, Ricezione, Attacco, Cambio</strong>).
              </p>
            </div>
          </div>
        </div>

        {/* Squadra Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <span className="text-xs font-bold text-slate-600 pl-2">Squadra:</span>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {teams.length === 0 ? (
              <option value="">Nessuna squadra creata</option>
            ) : (
              teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.categoria}) - {t.sistemaDiGioco || '5-1'}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* TOP CONTROLS: 1. SELECT ROTATION (P1 to P6) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Seleziona Rotazione (Posizione del Palleggiatore)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevRot}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Rotazione precedente"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Rotazione Attiva: P{rotazione}
            </span>
            <button
              type="button"
              onClick={handleNextRot}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Rotazione successiva"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 6 Large Interactive Badges: P1, P2, P3, P4, P5, P6 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((rNum) => {
            const rotData = VOLLEYBALL_ROTATIONS[rNum];
            const isSelected = rotazione === rNum;
            return (
              <button
                key={rNum}
                type="button"
                onClick={() => handleSelectRotation(rNum)}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-600 shadow-lg shadow-blue-500/25 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xl font-black tracking-tight ${
                        isSelected ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      P{rNum}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-blue-900/60 text-blue-200' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {rNum === 1 ? 'R1' : rNum === 2 ? 'R6' : rNum === 3 ? 'R5' : rNum === 4 ? 'R4' : rNum === 5 ? 'R3' : 'R2'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {rNum <= 3 && rNum >= 2 ? '1ª Linea' : rNum === 4 ? '1ª Linea' : '2ª Linea'}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold leading-snug">
                    {rNum === 1
                      ? 'P in Posto 1'
                      : rNum === 2
                      ? 'P in Posto 2'
                      : rNum === 3
                      ? 'P in Posto 3'
                      : rNum === 4
                      ? 'P in Posto 4'
                      : rNum === 5
                      ? 'P in Posto 5'
                      : 'P in Posto 6'}
                  </h4>
                  <p
                    className={`text-[10px] line-clamp-1 mt-0.5 ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {rNum === 1
                      ? 'Difesa dx / Battuta'
                      : rNum === 2
                      ? 'A rete dx / Zero cambi'
                      : rNum === 3
                      ? 'A rete centro'
                      : rNum === 4
                      ? 'A rete sx / Switch'
                      : rNum === 5
                      ? 'Difesa sx / Diagonale'
                      : 'Difesa centro / Dritto'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP CONTROLS: 2. SELECT ACTION / PHASE (Base, Servizio, Ricezione, Attacco, Cambio) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Azioni Principali della Rotazione
            </h2>
          </div>

          {/* Sequenza Autoplay / Stepper Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlayingSequence(!isPlayingSequence)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                isPlayingSequence
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Avvia o metti in pausa l'animazione sequenziale delle 5 fasi"
            >
              {isPlayingSequence ? (
                <>
                  <Pause size={14} />
                  <span>Pausa Sequenza</span>
                </>
              ) : (
                <>
                  <Play size={14} className="text-blue-600 fill-blue-600" />
                  <span>Avvia Sequenza Fasi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5 Action Tabs: Base, Servizio, Ricezione, Attacco, Cambio */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {AZIONI_ROTAZIONE.map((act) => {
            const isSelected = activePhase === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  setIsPlayingSequence(false);
                  setActivePhase(act.id);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/50'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-white shadow-sm'
                  }`}
                >
                  {getPhaseIcon(act.id)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wide">
                      {act.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] block truncate ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {act.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN VIEW: Left Live Tactical Whiteboard (7 cols), Right Tactical Insights & Lineup (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tactical Whiteboard (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-mono font-bold text-xs">
                  {`P${rotazione}`}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {`FASE: ${activePhase.toUpperCase()}`}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {currentTactics.phaseData.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Nomenclatura Ruoli vs Numeri */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setDisplayMode('ruolo')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    displayMode === 'ruolo'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Visualizza di default la nomenclatura ufficiale dei ruoli (P, S1, S2, C1, C2, L, O) anziché i numeri"
                >
                  <span>Nomenclatura (P, S1, S2, C1, C2, L, O)</span>
                  {displayMode === 'ruolo' && <span className="text-[10px] bg-blue-400 text-blue-950 font-black px-1.5 py-0.2 rounded-full uppercase">Predefinito</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('numero')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    displayMode === 'numero'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Visualizza i numeri di maglia (#) degli atleti"
                >
                  Numeri (#)
                </button>
              </div>

              {/* Toggle Linee FIPAV 7.4 */}
              <button
                type="button"
                onClick={() => setShowFipavGuidelines(!showFipavGuidelines)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                  showFipavGuidelines
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Mostra/nascondi le linee guida tratteggiate di rispetto delle sovrapposizioni FIPAV (Regola 7.4)"
              >
                <ShieldCheck size={14} className={showFipavGuidelines ? 'text-white' : 'text-emerald-400'} />
                <span>Linee FIPAV 7.4 {showFipavGuidelines ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Tactical Board component */}
          <VolleyBoard
            externalItems={boardItems}
            onBoardItemsChange={(newItems) => setBoardItems(newItems)}
            initialSystem={sistema}
            teamRoster={teamPlayers}
          />

          {/* Legenda Elementi sulla Lavagna */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <span className="font-bold text-slate-800">Legenda Ruoli & Segni:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-600 inline-block" />
                <strong>P</strong> (Palleggiatore)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 inline-block" />
                <strong>O</strong> (Opposto)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block" />
                <strong>S1/S2</strong> (Schiacciatori)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
                <strong>C1/C2</strong> (Centrali)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block" />
                <strong>L</strong> (Libero)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Details, Overlap Rules & Lineup (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tactical Details Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info size={16} className="text-blue-600" />
                Dettagli Tattici: P{rotazione} • {activePhase.toUpperCase()}
              </h3>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {currentTactics.phaseData.description}
            </p>

            {/* Punti Chiave dell'azione */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Punti Chiave dell'Azione:
              </h4>
              <ul className="space-y-1.5">
                {currentTactics.phaseData.keyPoints.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Regola di Sovrapposizione FIPAV (Regola 7.4) */}
            <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                  <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>Regola 7.4 FIPAV (Fallo di Posizione):</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  CONFORME FIPAV
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {currentTactics.phaseData.overlapRules}
              </p>
              <div className="text-[10px] text-amber-800/80 pt-1 border-t border-amber-200/60 flex items-center gap-1">
                <span>• Relazioni obbligatorie al tocco di battuta: 4 con 5, 3 con 6, 2 con 1; laterali 4-3-2 e 5-6-1.</span>
              </div>
            </div>

            {/* Movimento di Cambio Posizioni / Switch */}
            <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                <ArrowLeftRight size={15} className="text-purple-600 flex-shrink-0" />
                <span>Transizione e Switch Ruoli:</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                {currentTactics.phaseData.switchDetails}
              </p>
            </div>
          </div>

          {/* Roster & Jersey Numbers customization */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                Personalizzazione Atleti & Numeri
              </h3>
              <span className="text-[10px] text-slate-500">
                Sincronizzato live sulla lavagna
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(lineup).map(([code, pMeta]) => {
                const isLib = code === 'L';
                return (
                  <div
                    key={code}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      isLib
                        ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] ${
                          isLib
                            ? 'bg-amber-500 text-slate-950'
                            : code.startsWith('P')
                            ? 'bg-cyan-600 text-white'
                            : code.startsWith('O')
                            ? 'bg-purple-600 text-white'
                            : code.startsWith('C')
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {code}
                      </span>
                      <input
                        type="text"
                        value={pMeta.nome}
                        onChange={(e) => handleUpdateLineupPlayer(code, 'nome', e.target.value)}
                        className="bg-transparent border-b border-slate-300 text-[11px] text-slate-700 outline-none w-20 truncate"
                        placeholder="Nome"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">#</span>
                      <input
                        type="text"
                        value={pMeta.numero}
                        maxLength={3}
                        onChange={(e) => handleUpdateLineupPlayer(code, 'numero', e.target.value)}
                        className="w-8 px-1 py-0.5 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save as Tactical Scheme */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Save size={14} /> Salva nell'Archivio Schemi Tattici
            </h3>
            <p className="text-[11px] text-slate-300">
              Salva la rotazione <strong>P{rotazione}</strong> (fase <strong>{activePhase.toUpperCase()}</strong>) come schema tattico personalizzato.
            </p>
            <input
              type="text"
              value={schemeTitle}
              onChange={(e) => setSchemeTitle(e.target.value)}
              placeholder={`Es. Rotazione P${rotazione} - ${activePhase.toUpperCase()} 5-1`}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleSaveAsScheme}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/30"
            >
              {isSaving ? (
                <span>Salvataggio in corso...</span>
              ) : isSaved ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  <span>Schema Salvato con Successo!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Salva come Schema Tattico</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
