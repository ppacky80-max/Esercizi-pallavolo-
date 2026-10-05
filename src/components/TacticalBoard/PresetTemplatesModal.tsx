import React, { useState } from 'react';
import {
  PRESET_TACTICAL_TEMPLATES,
  PresetTacticalTemplate,
} from '../../utils/presetTacticalTemplates';
import {
  X,
  Layers,
  Sparkles,
  Check,
  Search,
  BookOpen,
  Filter,
} from 'lucide-react';
import { TacticalBoardData } from '../../types';

interface PresetTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: PresetTacticalTemplate) => void;
}

export const PresetTemplatesModal: React.FC<PresetTemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const categories = ['all', 'Ricezione', 'Attacco', 'Difesa', 'Battuta'];

  const filtered = PRESET_TACTICAL_TEMPLATES.filter((tmpl) => {
    const matchesCat = selectedCategory === 'all' || tmpl.sottocategoria === selectedCategory;
    const matchesSearch =
      tmpl.titolo.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.descrizione.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Libreria Schemi Preimpostati</h3>
              <p className="text-xs text-slate-400">
                16 schemi tattici regolamentari FIPAV pronti all'uso e completamente modificabili
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Tutti gli Schemi' : cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Cerca schema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-slate-800/70 border border-slate-750 hover:border-blue-500/70 rounded-2xl p-4 transition flex flex-col justify-between gap-3 group hover:bg-slate-800"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/60">
                    {tmpl.sottocategoria}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      tmpl.livello === 'Base'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : tmpl.livello === 'Intermedio'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}
                  >
                    {tmpl.livello}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white group-hover:text-blue-300 transition">
                  {tmpl.titolo}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {tmpl.descrizione}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-750/80">
                <span className="text-[11px] text-slate-500 font-mono">
                  {tmpl.data.scenes?.length || 1} fase/i • R{tmpl.rotazioneConsigliata}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    onLoadTemplate(tmpl);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  <span>Carica Schema</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
