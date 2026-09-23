import React from 'react';
import { Volume2, VolumeX, Trophy, Users, HelpCircle, Sparkles, UserCheck } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { soundManager } from '../lib/sound';

interface HeaderProps {
  player: PlayerProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAvatarModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenMultiplayer: () => void;
  onOpenHowToPlay: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  soundEnabled,
  onToggleSound,
  onOpenAvatarModal,
  onOpenLeaderboard,
  onOpenMultiplayer,
  onOpenHowToPlay,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-amber-400 border-b-4 border-amber-600 shadow-md px-3 py-2 sm:px-6 sm:py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl border-2 border-amber-600 flex items-center justify-center text-2xl shadow-inner transform group-hover:scale-105 transition-transform">
            🧩
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-amber-950 tracking-tight leading-none flex items-center gap-1">
              Angka Geser <span className="text-white drop-shadow-[0_2px_0_rgba(180,83,9,1)]">Ceria</span>
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-amber-900 opacity-90 hidden sm:block">
              Puzzle Angka untuk Anak TK & SD
            </p>
          </div>
        </button>

        {/* Player Profile Badge & Stats */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAvatarModal();
            }}
            className="flex items-center gap-1.5 bg-amber-100 hover:bg-white border-2 border-amber-600 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm transition-all focus:outline-none"
            title="Ubah Profil & Nama"
          >
            <span className="text-xl sm:text-2xl">{player.avatar}</span>
            <div className="text-left hidden md:block">
              <div className="text-xs font-extrabold text-amber-950 truncate max-w-[100px]">
                {player.displayName}
              </div>
              <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Ubah Profil
              </div>
            </div>
          </button>

          {/* Stars Count */}
          <div className="flex items-center gap-1 bg-yellow-200 border-2 border-amber-600 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 font-black text-amber-950 text-xs sm:text-sm shadow-sm">
            <span className="text-base sm:text-lg">⭐</span>
            <span>{player.totalStars}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLeaderboard();
              }}
              className="p-2 sm:p-2.5 bg-yellow-300 hover:bg-yellow-200 active:scale-95 border-2 border-amber-700 rounded-xl font-bold text-amber-950 shadow-sm transition-all focus:outline-none flex items-center gap-1"
              title="Papan Skor Global"
            >
              <Trophy className="w-4 h-4 text-amber-800" />
              <span className="hidden lg:inline text-xs font-black">Peringkat</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMultiplayer();
              }}
              className="p-2 sm:p-2.5 bg-sky-400 hover:bg-sky-300 active:scale-95 border-2 border-sky-700 rounded-xl font-bold text-white shadow-sm transition-all focus:outline-none flex items-center gap-1"
              title="Main Multiplayer & Online"
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline text-xs font-black">Multiplayer</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenHowToPlay();
              }}
              className="p-2 sm:p-2.5 bg-emerald-400 hover:bg-emerald-300 active:scale-95 border-2 border-emerald-700 rounded-xl font-bold text-white shadow-sm transition-all focus:outline-none"
              title="Cara Bermain"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onToggleSound();
                soundManager.playClick();
              }}
              className="p-2 sm:p-2.5 bg-amber-200 hover:bg-amber-100 border-2 border-amber-700 rounded-xl text-amber-900 shadow-sm transition-all focus:outline-none"
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
