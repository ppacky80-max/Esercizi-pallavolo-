import React, { useEffect, useState, useMemo } from 'react';
import {
  Allenamento,
  EventoCalendario,
  Squadra,
  TipoEventoCalendario,
  StatoAllenamento,
} from '../types';
import { fetchWorkouts } from '../services/workoutService';
import { fetchEvents, saveEvent, deleteEvent } from '../services/eventService';
import { fetchTeams } from '../services/teamService';
import { fetchSeasons } from '../services/seasonService';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Users,
  MapPin,
  Trophy,
  Swords,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';

interface CalendarViewProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

interface UnifiedEvent {
  id: string;
  sourceType: 'workout' | 'custom_event';
  tipo: TipoEventoCalendario;
  titolo: string;
  squadra?: string;
  teamId?: string;
  stagione?: string;
  data: string; // YYYY-MM-DD
  oraInizio: string;
  oraFine: string;
  luogo?: string;
  avversario?: string;
  note?: string;
  stato: StatoAllenamento;
  rawWorkout?: Allenamento;
  rawEvent?: EventoCalendario;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [workouts, setWorkouts] = useState<Allenamento[]>([]);
  const [customEvents, setCustomEvents] = useState<EventoCalendario[]>([]);
  const [teams, setTeams] = useState<Squadra[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters (Requirement 14)
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterSeason, setFilterSeason] = useState('all');
  const [filterType, setFilterType] = useState<string>('all');

  // New Event Modal (Requirement 15)
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [eventType, setEventType] = useState<TipoEventoCalendario>('Allenamento');
  const [eventTitle, setEventTitle] = useState('');
  const [eventTeamId, setEventTeamId] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('18:00');
  const [eventEndTime, setEventEndTime] = useState('20:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventOpponent, setEventOpponent] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  // Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wData, eData, tData, sData] = await Promise.all([
        fetchWorkouts(coachId),
        fetchEvents(coachId),
        fetchTeams(coachId, true),
        fetchSeasons(coachId),
      ]);
      setWorkouts(wData);
      setCustomEvents(eData);
      setTeams(tData);
      setSeasons(sData.map((s) => s.nome));
    } catch (e) {
      console.warn('Errore caricamento calendario:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [coachId]);

  // Combine workouts and custom events into a unified list
  const unifiedEvents: UnifiedEvent[] = useMemo(() => {
    const list: UnifiedEvent[] = [];

    // Map workouts
    workouts.forEach((w) => {
      list.push({
        id: `wk_${w.id}`,
        sourceType: 'workout',
        tipo: 'Allenamento',
        titolo: w.titolo,
        squadra: w.squadra,
        teamId: w.teamId,
        stagione: w.stagione,
        data: w.data,
        oraInizio: w.oraInizio,
        oraFine: w.oraFine,
        luogo: w.palestra,
        note: w.note,
        stato: w.stato || 'Programmato',
        rawWorkout: w,
      });
    });

    // Map custom events
    customEvents.forEach((ev) => {
      list.push({
        id: `ev_${ev.id}`,
        sourceType: 'custom_event',
        tipo: ev.tipo,
        titolo: ev.titolo,
        squadra: ev.teamNome,
        teamId: ev.teamId,
        stagione: ev.stagione,
        data: ev.data,
        oraInizio: ev.oraInizio,
        oraFine: ev.oraFine,
        luogo: ev.luogo,
        avversario: ev.avversario,
        note: ev.note,
        stato: ev.stato || 'Programmato',
        rawEvent: ev,
      });
    });

    // Apply filters (Requirement 14)
    return list.filter((item) => {
      if (filterTeam !== 'all') {
        if (item.teamId !== filterTeam && item.squadra !== filterTeam) return false;
      }
      if (filterSeason !== 'all') {
        if (item.stagione && item.stagione !== filterSeason) return false;
      }
      if (filterType !== 'all') {
        if (item.tipo !== filterType) return false;
      }
      return true;
    });
  }, [workouts, customEvents, filterTeam, filterSeason, filterType]);

  // Events map by date 'YYYY-MM-DD'
  const eventsByDate = useMemo(() => {
    const map: Record<string, UnifiedEvent[]> = {};
    unifiedEvents.forEach((ev) => {
      if (!map[ev.data]) map[ev.data] = [];
      map[ev.data].push(ev);
    });
    // Sort events within the same day by start time
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));
    });
    return map;
  }, [unifiedEvents]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthDays = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    monthDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    monthDays.push(d);
  }

  // Week calculations (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sun
    const diff = curr.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Monday
    const monday = new Date(curr.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  }, [currentDate]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Open New Event Modal
  const openNewEvent = () => {
    setEventType('Allenamento');
    setEventTitle('');
    setEventTeamId(teams.length > 0 ? teams[0].id : '');
    setEventDate(currentDate.toISOString().split('T')[0]);
    setEventStartTime('18:00');
    setEventEndTime('20:00');
    setEventLocation('');
    setEventOpponent('');
    setEventNotes('');
    setIsNewEventModalOpen(true);
  };

  // Handle Event Submit (Requirement 15)
  const handleSaveNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (eventType === 'Allenamento') {
      setIsNewEventModalOpen(false);
      onNavigate('new_workout');
      return;
    }

    const selTeam = teams.find((t) => t.id === eventTeamId);
    await saveEvent({
      coachId,
      tipo: eventType,
      titolo: eventTitle.trim() || `${eventType} ${selTeam ? selTeam.nome : ''}`,
      teamId: eventTeamId || undefined,
      teamNome: selTeam ? selTeam.nome : undefined,
      stagione: selTeam?.stagione,
      data: eventDate,
      oraInizio: eventStartTime,
      oraFine: eventEndTime,
      luogo: eventLocation.trim() || undefined,
      avversario: eventOpponent.trim() || undefined,
      note: eventNotes.trim() || undefined,
      stato: 'Programmato',
    });

    setIsNewEventModalOpen(false);
    await loadData();
  };

  const handleDeleteEvent = async (ev: UnifiedEvent) => {
    if (ev.sourceType === 'custom_event' && ev.rawEvent) {
      await deleteEvent(ev.rawEvent.id, coachId);
      setSelectedEvent(null);
      await loadData();
    }
  };

  // Status color styles (Requirement 24)
  const getEventBadgeStyle = (tipo: TipoEventoCalendario, stato: StatoAllenamento) => {
    if (stato === 'Annullato') {
      return 'bg-red-50 text-red-700 border-red-200 line-through opacity-75';
    }
    if (stato === 'Completato') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
    switch (tipo) {
      case 'Partita':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Torneo':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'Allenamento':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      
      {/* HEADER CALENDARIO */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon size={22} className="text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Calendario Allenamenti & Partite
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Pianificazione temporale completa con vista Mese, Settimana e Giorno
          </p>
        </div>

        {/* View Mode Switcher (Month, Week, Day - Requirement 12) & New Event Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'month'
                  ? 'bg-white text-blue-700 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mese
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'week'
                  ? 'bg-white text-blue-700 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Settimana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'day'
                  ? 'bg-white text-blue-700 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Giorno
            </button>
          </div>

          <button
            onClick={openNewEvent}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>NUOVO EVENTO</span>
          </button>
        </div>
      </div>

      {/* BARRA FILTRI CALENDARIO (Requirement 14) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Filter size={14} /> Filtra:
          </span>

          {/* Squadra */}
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tutte le Squadre</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.categoria})
              </option>
            ))}
          </select>

          {/* Stagione */}
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tutte le Stagioni</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Tipo Attività (Requirement 14) */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tutti i Tipi di Attività</option>
            <option value="Allenamento">🏐 Allenamenti</option>
            <option value="Partita">⚔️ Partite</option>
            <option value="Torneo">🏆 Tornei</option>
            <option value="Altro">📌 Altro</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Allenamento</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Partita</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Torneo</span>
          </span>
        </div>
      </div>

      {/* CONTROLLI DATA E TITOLO PERIODO */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            {viewMode === 'month' && `${monthNames[month]} ${year}`}
            {viewMode === 'week' &&
              `Settimana dal ${currentWeekDays[0].getDate()} ${
                monthNames[currentWeekDays[0].getMonth()]
              } al ${currentWeekDays[6].getDate()} ${
                monthNames[currentWeekDays[6].getMonth()]
              } ${year}`}
            {viewMode === 'day' &&
              `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${year}`}
          </h3>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
          >
            Oggi
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 1. VISTA MENSILE (Month View) */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2.5 text-xs font-black text-slate-600 uppercase">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Gio</span>
            <span>Ven</span>
            <span>Sab</span>
            <span>Dom</span>
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {monthDays.map((dayNum, idx) => {
              if (dayNum === null) {
                return (
                  <div
                    key={`empty_${idx}`}
                    className="h-28 sm:h-36 bg-slate-50/40 p-2 border-slate-100"
                  />
                );
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const dayEvents = eventsByDate[dateStr] || [];

              return (
                <div
                  key={`day_${dayNum}`}
                  className={`h-28 sm:h-36 p-1.5 sm:p-2 flex flex-col justify-between transition hover:bg-slate-50/60 overflow-hidden ${
                    isToday ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white font-black shadow-sm'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Events list */}
                  <div className="space-y-1 overflow-y-auto flex-1 max-h-24">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (ev.sourceType === 'workout' && ev.rawWorkout) {
                            onNavigate('edit_workout', ev.rawWorkout.id);
                          } else {
                            setSelectedEvent(ev);
                          }
                        }}
                        className={`p-1 sm:p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer truncate transition hover:scale-[1.02] shadow-xs ${getEventBadgeStyle(
                          ev.tipo,
                          ev.stato
                        )}`}
                        title={`${ev.squadra ? ev.squadra + ': ' : ''}${ev.titolo} (${ev.oraInizio}-${ev.oraFine})`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate font-black">{ev.oraInizio}</span>
                          <span className="text-[9px] uppercase font-bold opacity-75">
                            {ev.tipo === 'Allenamento' ? 'All' : ev.tipo}
                          </span>
                        </div>
                        <div className="truncate text-[10px]">
                          {ev.squadra ? `${ev.squadra} • ` : ''}{ev.titolo}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. VISTA SETTIMANALE (Week View) */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-3 text-xs font-black text-slate-700 uppercase divide-x divide-slate-100">
            {currentWeekDays.map((d, i) => {
              const dStr = d.toISOString().split('T')[0];
              const isToday = dStr === todayStr;
              const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

              return (
                <div key={dStr} className={`py-1 ${isToday ? 'text-blue-600' : ''}`}>
                  <span className="block text-[11px] text-slate-400">{dayNames[i]}</span>
                  <span className={`inline-block font-black text-sm mt-0.5 ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full leading-7' : ''}`}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[420px]">
            {currentWeekDays.map((d) => {
              const dStr = d.toISOString().split('T')[0];
              const isToday = dStr === todayStr;
              const dayEvents = eventsByDate[dStr] || [];

              return (
                <div
                  key={dStr}
                  className={`p-2 space-y-2 flex flex-col ${
                    isToday ? 'bg-blue-50/20' : ''
                  }`}
                >
                  {dayEvents.length === 0 ? (
                    <div className="text-center text-slate-300 text-[11px] pt-8">
                      -
                    </div>
                  ) : (
                    dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (ev.sourceType === 'workout' && ev.rawWorkout) {
                            onNavigate('edit_workout', ev.rawWorkout.id);
                          } else {
                            setSelectedEvent(ev);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer shadow-xs transition hover:shadow-sm ${getEventBadgeStyle(
                          ev.tipo,
                          ev.stato
                        )}`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-black mb-1">
                          <span>{ev.oraInizio} - {ev.oraFine}</span>
                          <span className="text-[10px] uppercase">{ev.tipo}</span>
                        </div>
                        <h4 className="font-bold text-xs line-clamp-2">{ev.titolo}</h4>
                        {ev.squadra && (
                          <span className="text-[10px] block opacity-80 mt-1 truncate">
                            {ev.squadra}
                          </span>
                        )}
                        {ev.luogo && (
                          <span className="text-[10px] block opacity-70 truncate">
                            📍 {ev.luogo}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VISTA GIORNALIERA (Day View) */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">
                Programma del giorno
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {currentDate.getDate()} {monthNames[currentDate.getMonth()]} {year}
              </h3>
            </div>

            <button
              onClick={openNewEvent}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              + Aggiungi Attività
            </button>
          </div>

          {(() => {
            const curStr = currentDate.toISOString().split('T')[0];
            const dayEvents = eventsByDate[curStr] || [];

            if (dayEvents.length === 0) {
              return (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <CalendarIcon size={36} className="mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Nessuna attività programmata per questo giorno.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      if (ev.sourceType === 'workout' && ev.rawWorkout) {
                        onNavigate('edit_workout', ev.rawWorkout.id);
                      } else {
                        setSelectedEvent(ev);
                      }
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${getEventBadgeStyle(
                      ev.tipo,
                      ev.stato
                    )}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{ev.oraInizio} - {ev.oraFine}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/70">
                          {ev.tipo}
                        </span>
                        {ev.squadra && (
                          <span className="text-xs font-bold opacity-80">
                            {ev.squadra}
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-base">{ev.titolo}</h4>
                      {ev.luogo && <p className="text-xs opacity-75">📍 {ev.luogo}</p>}
                      {ev.note && <p className="text-xs opacity-75 italic line-clamp-1">{ev.note}</p>}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-bold underline">Vedi Dettagli &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODALE NUOVO EVENTO (Requirement 15) */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                Pianifica Nuovo Evento Calendario
              </h3>
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNewEvent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo di Attività *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Allenamento', 'Partita', 'Torneo', 'Altro'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setEventType(t)}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition ${
                        eventType === t
                          ? 'bg-blue-600 text-white shadow-sm font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {eventType === 'Allenamento' ? (
                <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-2">
                  <p className="font-bold">
                    Vuoi creare una seduta di allenamento con la lavagna tattica e gli esercizi?
                  </p>
                  <p className="text-blue-800">
                    Cliccando su procedi verrai reindirizzato al Costruttore di Allenamento per definire tempi, schemi e categorie.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Titolo Evento *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder={
                        eventType === 'Partita'
                          ? 'Es. Gara di Campionato FIPAV'
                          : eventType === 'Torneo'
                          ? 'Es. Torneo di Primavera'
                          : 'Es. Riunione Tecnica Staff'
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Squadra Coinvolta
                      </label>
                      <select
                        value={eventTeamId}
                        onChange={(e) => setEventTeamId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="">Nessuna / Tutte</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome} ({t.categoria})
                          </option>
                        ))}
                      </select>
                    </div>

                    {eventType === 'Partita' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Squadra Avversaria
                        </label>
                        <input
                          type="text"
                          value={eventOpponent}
                          onChange={(e) => setEventOpponent(e.target.value)}
                          placeholder="Es. Volley Club Bergamo"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Data Evento *
                      </label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Ora Inizio
                      </label>
                      <input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Ora Fine
                      </label>
                      <input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Luogo o Palestra
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Es. Palasport Comunale - Via Olimpica"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Note e Istruzioni
                    </label>
                    <textarea
                      rows={2}
                      value={eventNotes}
                      onChange={(e) => setEventNotes(e.target.value)}
                      placeholder="Orario di convocazione, colore maglia, arbitro..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  {eventType === 'Allenamento' ? 'Vai a Crea Allenamento' : 'Salva Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DETTAGLIO EVENTO CALENDARIO */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              &times;
            </button>

            <div className="pb-4 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {selectedEvent.tipo}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                {selectedEvent.titolo}
              </h3>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-slate-400" />
                <span>Data: <strong>{selectedEvent.data}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span>Orario: <strong>{selectedEvent.oraInizio} - {selectedEvent.oraFine}</strong></span>
              </div>
              {selectedEvent.squadra && (
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span>Squadra: <strong>{selectedEvent.squadra}</strong></span>
                </div>
              )}
              {selectedEvent.avversario && (
                <div className="flex items-center gap-2">
                  <Swords size={14} className="text-slate-400" />
                  <span>Avversario: <strong>{selectedEvent.avversario}</strong></span>
                </div>
              )}
              {selectedEvent.luogo && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span>Luogo: <strong>{selectedEvent.luogo}</strong></span>
                </div>
              )}
              {selectedEvent.note && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-slate-700">
                  <span className="font-bold block mb-1">Note:</span>
                  {selectedEvent.note}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {selectedEvent.sourceType === 'custom_event' && (
                <button
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>Elimina</span>
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
