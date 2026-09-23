import React from 'react';
import { Play, Star, Sparkles, Users, Award, Unlock } from 'lucide-react';
import { GAME_LEVELS, GameLevelConfig, PlayerProfile } from '../types/game';
import { soundManager } from '../lib/sound';

interface LevelSelectorProps {
  player: PlayerProfile;
  levelStars: Record<number, number>; // levelId -> stars count
  onSelectLevel: (level: GameLevelConfig) => void;
  onOpenMultiplayer: () => void;
  onOpenLeaderboard: () => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  player,
  levelStars,
  onSelectLevel,
  onOpenMultiplayer,
  onOpenLeaderboard,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-fade-in">
      {/* Hero Banner for Kids */}
      <div className="relative bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 border-4 border-amber-600 rounded-3xl p-6 sm:p-8 text-amber-950 shadow-xl overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-300/40 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-12 top-2 text-6xl opacity-20 select-none pointer-events-none">
          🧩
        </div>

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-100 border-2 border-amber-600 rounded-full px-3 py-1 text-xs font-black text-amber-900 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Petualangan Geser Angka</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Halo {player.avatar} {player.displayName}! Siap Mengurutkan Angka?
          </h2>

          <p className="text-sm sm:text-base font-bold text-amber-900/90 leading-relaxed">
            Pilih level favoritmu secara bebas! Mulai dari Level 1 (3x3: urutkan 1-8), Level 2 (4x4: urutkan 1-15), hingga Level 3 (5x5: urutkan 1-24)!
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMultiplayer();
              }}
              className="bg-sky-500 hover:bg-sky-400 active:scale-95 border-b-4 border-sky-700 text-white font-black px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <Users className="w-5 h-5" /> Tanding Online 1v1
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLeaderboard();
              }}
              className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 border-b-4 border-amber-600 text-amber-950 font-black px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <Award className="w-5 h-5 text-amber-800" /> Papan Peringkat Global
            </button>
          </div>
        </div>
      </div>

      {/* Level Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
            <span>🗺️</span> Pilih Level Permainan
          </h3>
          <div className="text-xs sm:text-sm font-black text-emerald-800 bg-emerald-100 border-2 border-emerald-300 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xs">
            <Unlock className="w-4 h-4 text-emerald-600" /> Semua Level Terbuka Bebas!
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_LEVELS.map((level) => {
            const starsEarned = levelStars[level.id] || 0;

            return (
              <div
                key={level.id}
                className={`relative rounded-3xl border-4 p-5 flex flex-col justify-between transition-all transform duration-200 shadow-md ${level.cardBg} ${level.borderBg} hover:-translate-y-1 hover:shadow-xl`}
              >
                {/* Level Badge & Stars */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-white/80 border border-current text-amber-900 shadow-xs">
                    {level.badge}
                  </span>
                  
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= starsEarned
                            ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title & Info */}
                <div className="space-y-1.5 mb-4">
                  <h4 className="text-lg font-black text-slate-800 leading-tight">
                    {level.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-600">
                    {level.subtitle}
                  </p>
                  <div className="inline-block mt-1 bg-white/60 border border-slate-300 rounded-lg px-2 py-0.5 text-[11px] font-black text-slate-700">
                    Grid {level.gridSize}x{level.gridSize} • Urutkan {level.targetNumbersCount} Angka
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onSelectLevel(level);
                  }}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-white text-base shadow-md transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${level.themeColor} active:scale-95 border-b-4 border-black/20 hover:brightness-105`}
                >
                  <Play className="w-5 h-5 fill-current" /> Main Sekarang
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
