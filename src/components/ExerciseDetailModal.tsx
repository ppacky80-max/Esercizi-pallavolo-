import React from 'react';
import { Esercizio } from '../types';
import {
  X,
  Clock,
  Users,
  Printer,
  Sparkles,
  User,
  Shield,
  Layers,
  Copy,
  Plus,
  BookOpen,
  Info,
} from 'lucide-react';
import { generaPdfSingoloEsercizio } from '../utils/pdfGenerator';

interface ExerciseDetailModalProps {
  exercise: Esercizio | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onAddToWorkout?: (ex: Esercizio) => void;
  onDuplicate?: (ex: Esercizio) => void;
  onEdit?: (ex: Esercizio) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  currentUserId,
  onAddToWorkout,
  onDuplicate,
  onEdit,
}) => {
  if (!isOpen || !exercise) return null;

  const isAuthor = Boolean(
    currentUserId && exercise.coachId && exercise.coachId === currentUserId
  );

  const previewImage = exercise.boardPreviewUrl || exercise.imageUrl;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50 gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {exercise.categoria}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  exercise.difficolta === 'Base'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : exercise.difficolta === 'Intermedio'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                Difficoltà: {exercise.difficolta}
              </span>

              {/* Authorship badge */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                <User size={12} className="text-slate-400" />
                <span>
                  {isAuthor
                    ? 'Autore: Tu'
                    : `Autore: ${exercise.authorName || 'Altro Coach'}`}
                </span>
                {!isAuthor && (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded ml-1 border border-amber-200">
                    Sola lettura
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {exercise.titolo}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition flex-shrink-0"
            title="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Durata</span>
                <strong className="text-slate-800">{exercise.durata} min</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Giocatori</span>
                <strong className="text-slate-800">{exercise.minPlayers} - {exercise.maxPlayers}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Categoria</span>
                <strong className="text-slate-800 truncate block max-w-[90px]">{exercise.categoria}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Schema</span>
                <strong className="text-slate-800">
                  {exercise.boardData || exercise.schemaTatticoId ? 'Presente' : 'Nessuno'}
                </strong>
              </div>
            </div>
          </div>

          {/* Tactical Board / Image Preview if available */}
          {previewImage && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" />
                <span>Schema Grafico / Lavagna Tattica</span>
              </h4>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner flex items-center justify-center p-1">
                <img
                  src={previewImage}
                  alt={exercise.titolo}
                  className="w-full max-h-64 object-contain rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Obiettivo Didattico */}
          {exercise.obiettivo && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Obiettivo dell'Esercizio
              </h4>
              <p className="text-xs text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100 leading-relaxed font-medium">
                {exercise.obiettivo}
              </p>
            </div>
          )}

          {/* Materiale */}
          {exercise.materiale && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Materiale Necessario
              </h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {exercise.materiale}
              </p>
            </div>
          )}

          {/* Descrizione Svolgimento */}
          {exercise.descrizione && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Descrizione Dettagliata dello Svolgimento
              </h4>
              <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                {exercise.descrizione}
              </div>
            </div>
          )}

          {/* Note del Coach */}
          {exercise.note && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info size={14} className="text-amber-600" />
                <span>Note e Accorgimenti per l'Allenatore</span>
              </h4>
              <p className="text-xs text-amber-900 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 leading-relaxed italic">
                {exercise.note}
              </p>
            </div>
          )}

          {/* Shared Read-Only Notice if not author */}
          {!isAuthor && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Shield size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Esercizio Condiviso:</strong> Questo esercizio è stato condiviso da{' '}
                <strong>{exercise.authorName || 'un altro allenatore'}</strong> ed è visibile in sola lettura.
                Non puoi modificarlo o eliminarlo, ma puoi duplicarlo per creare una tua copia personale.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => generaPdfSingoloEsercizio(exercise)}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-sm"
              title="Stampa Scheda PDF"
            >
              <Printer size={15} />
              <span>PDF</span>
            </button>

            {onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  onDuplicate(exercise);
                  onClose();
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-sm"
                title="Crea una copia personale dell'esercizio"
              >
                <Copy size={15} />
                <span>Duplica</span>
              </button>
            )}

            {isAuthor && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(exercise);
                  onClose();
                }}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-200"
              >
                <span>Modifica</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onAddToWorkout && (
              <button
                type="button"
                onClick={() => {
                  onAddToWorkout(exercise);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Plus size={15} />
                <span>Aggiungi all'Allenamento</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
