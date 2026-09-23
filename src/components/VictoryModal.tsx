import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Trophy, ArrowRight, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import { GameLevelConfig, PlayerProfile } from '../types/game';
import { calculateStarsAndScore } from '../utils/puzzle';
import { soundManager } from '../lib/sound';

interface VictoryModalProps {
  level: GameLevelConfig;
  moves: number;
  timeSeconds: number;
  player: PlayerProfile;
  isOpen: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onViewLeaderboard: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  moves,
  timeSeconds,
  player,
  isOpen,
  onNextLevel,
  onReplay,
  onViewLeaderboard,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.playWin();
      // Launch celebratory confetti burst!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { stars, score } = calculateStarsAndScore(level, moves, timeSeconds);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-4 border-amber-500 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-center p-6 space-y-5 transform transition-all scale-100">
        {/* Top Trophy Icon */}
        <div className="mx-auto w-20 h-20 bg-amber-400 border-4 border-amber-600 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">
          🏆
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-amber-950">
            Hore! Kamu Berhasil! 🎉
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-800">
            {level.title} Selesai dengan Sempurna!
          </p>
        </div>

        {/* Stars Earned */}
        <div className="flex items-center justify-center gap-2 py-1">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-10 h-10 transition-transform ${
                s <= stars
                  ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-md'
                  : 'text-slate-300 scale-90'
              }`}
            />
          ))}
        </div>

        {/* Score & Stats Breakdown */}
        <div className="bg-white border-3 border-amber-300 rounded-2xl p-4 space-y-3 shadow-inner">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-b border-amber-100 pb-2">
            <span>Waktu Penyelesaian</span>
            <span className="text-amber-950 font-black text-sm">{formatTime(timeSeconds)}</span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-b border-amber-100 pb-2">
            <span>Jumlah Langkah</span>
            <span className="text-amber-950 font-black text-sm">{moves} Langkah</span>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-amber-800 pt-1">
            <span className="font-black text-sm">Total Skor Kamu</span>
            <span className="text-emerald-600 font-black text-xl">+{score} Poin</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => {
              soundManager.playClick();
              onNextLevel();
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-b-4 border-emerald-700 text-white font-black text-lg py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Lanjut Level Berikutnya <ArrowRight className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onReplay();
              }}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 border-b-4 border-amber-600 text-amber-950 font-black text-sm py-2.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Ulang Level
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onViewLeaderboard();
              }}
              className="bg-yellow-300 hover:bg-yellow-200 active:scale-95 border-b-4 border-amber-600 text-amber-950 font-black text-sm py-2.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-800" /> Lihat Ranking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
