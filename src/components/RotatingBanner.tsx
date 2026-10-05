import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Settings,
  Megaphone,
} from 'lucide-react';
import { Banner } from '../types';
import { fetchBanners } from '../services/bannerService';
import { useAuth } from '../context/AuthContext';

interface RotatingBannerProps {
  onNavigate?: (page: any) => void;
  className?: string;
  intervalMs?: number;
}

export const RotatingBanner: React.FC<RotatingBannerProps> = ({
  onNavigate,
  className = '',
  intervalMs = 5000,
}) => {
  const { isAdmin } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadActiveBanners = async () => {
    try {
      const active = await fetchBanners(true);
      setBanners(active);
    } catch (e) {
      console.warn('Error loading active banners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveBanners();

    // Listen for custom event when banners are edited in admin panel
    const handleBannerUpdate = () => {
      loadActiveBanners();
    };
    window.addEventListener('volley_banners_updated', handleBannerUpdate);
    return () => {
      window.removeEventListener('volley_banners_updated', handleBannerUpdate);
    };
  }, []);

  // Auto rotation effect
  useEffect(() => {
    if (banners.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused, intervalMs]);

  if (loading || banners.length === 0) {
    return null;
  }

  const current = banners[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = () => {
    if (!current.linkUrl) return;

    if (current.linkUrl.startsWith('#')) {
      const targetPage = current.linkUrl.substring(1);
      if (onNavigate && targetPage) {
        onNavigate(targetPage as any);
      }
    } else {
      window.open(current.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getBadgeStyle = (colore?: string) => {
    switch (colore) {
      case 'amber':
        return 'bg-amber-400 text-slate-950 border-amber-300';
      case 'emerald':
        return 'bg-emerald-500 text-white border-emerald-400';
      case 'purple':
        return 'bg-purple-500 text-white border-purple-400';
      case 'rose':
        return 'bg-rose-500 text-white border-rose-400';
      case 'indigo':
        return 'bg-indigo-500 text-white border-indigo-400';
      case 'blue':
      default:
        return 'bg-blue-600 text-white border-blue-400';
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full rounded-3xl overflow-hidden shadow-lg border border-slate-800/20 bg-slate-950 group select-none ${className}`}
    >
      {/* Banner Background & Image */}
      <div className="relative h-44 sm:h-52 md:h-56 w-full overflow-hidden flex items-center">
        {current.immagineUrl ? (
          <>
            <img
              src={current.immagineUrl}
              alt={current.titolo}
              className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-all duration-700 brightness-75 group-hover:scale-100"
            />
            {/* Deep overlay gradients for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950" />
        )}

        {/* Content Box */}
        <div
          onClick={handleBannerClick}
          className={`relative z-10 p-5 sm:p-7 md:p-8 max-w-3xl flex flex-col justify-between h-full ${
            current.linkUrl ? 'cursor-pointer' : ''
          }`}
        >
          {/* Top Badge & Admin quick link */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border ${getBadgeStyle(
                current.badgeColore
              )} flex items-center gap-1.5`}
            >
              <Megaphone size={12} />
              <span>{current.badgeTesto || 'COMUNICAZIONE'}</span>
            </span>

            <span className="text-[11px] text-slate-300 font-medium hidden sm:inline-block">
              Spazio Ufficiale Volley Coach
            </span>
          </div>

          {/* Titles */}
          <div className="space-y-1.5 my-auto">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md tracking-tight line-clamp-2">
              {current.titolo}
            </h2>
            {current.sottotitolo && (
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-normal max-w-2xl line-clamp-2 drop-shadow">
                {current.sottotitolo}
              </p>
            )}
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center gap-3 pt-2">
            {current.linkUrl && (
              <button
                type="button"
                onClick={handleBannerClick}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <span>{current.linkTesto || 'Scopri di più'}</span>
                <ExternalLink size={14} />
              </button>
            )}

            {/* Slide Counter badge */}
            {banners.length > 1 && (
              <span className="text-[11px] font-bold text-slate-400 bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-slate-700/50">
                {currentIndex + 1} / {banners.length}
              </span>
            )}
          </div>
        </div>

        {/* Admin Quick Edit Button */}
        {isAdmin && onNavigate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('admin');
            }}
            className="absolute top-3 right-3 z-20 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold border border-amber-400/40 backdrop-blur-sm transition flex items-center gap-1.5 shadow-md"
            title="Gestisci i banner dal pannello amministratore"
          >
            <Settings size={13} />
            <span className="hidden sm:inline">Gestisci Banner</span>
          </button>
        )}

        {/* Previous / Next Arrow Controls */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition opacity-80 hover:opacity-100 hover:scale-105"
              title="Banner precedente"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition opacity-80 hover:opacity-100 hover:scale-105"
              title="Prossimo banner"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators Dots at the Bottom */}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/70 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-sm">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 bg-amber-400'
                  : 'w-2 bg-slate-600 hover:bg-slate-400'
              }`}
              title={`Vai al banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
