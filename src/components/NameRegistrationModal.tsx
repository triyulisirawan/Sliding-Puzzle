import React, { useState } from 'react';
import { Sparkles, Trophy, UserCheck } from 'lucide-react';
import { AVATARS, PlayerProfile } from '../types/game';
import { soundManager } from '../lib/sound';

interface NameRegistrationModalProps {
  isOpen: boolean;
  player: PlayerProfile;
  onSubmitName: (newName: string, avatar: string) => void;
  onCancel?: () => void;
}

export const NameRegistrationModal: React.FC<NameRegistrationModalProps> = ({
  isOpen,
  player,
  onSubmitName,
  onCancel,
}) => {
  const [nameInput, setNameInput] = useState(
    player.displayName === 'Pemain Cilik' ? '' : player.displayName
  );
  const [selectedAvatar, setSelectedAvatar] = useState(player.avatar || '🐰');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();

    if (!cleanName) {
      setErrorMsg('Mohon isi nama kamu terlebih dahulu ya! 😊');
      return;
    }

    if (cleanName.length < 2) {
      setErrorMsg('Nama minimal 2 karakter.');
      return;
    }

    setErrorMsg('');
    soundManager.playClick();
    onSubmitName(cleanName, selectedAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-4 border-amber-500 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 border-b-4 border-amber-500 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-2xl border-2 border-amber-600 flex items-center justify-center text-xl shadow-xs">
            ✍️
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-950 leading-tight">
              Tulis Namamu Dulu Yuk!
            </h2>
            <p className="text-xs font-extrabold text-amber-900">
              Diwajibkan untuk pencatatan skor & rekor global 🏆
            </p>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name Input Field */}
          <div>
            <label className="block text-sm font-black text-amber-950 mb-1">
              Nama Lengkap / Panggilan Kamu: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              maxLength={25}
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Contoh: Budi TK A / Ani SD 2"
              className="w-full bg-white border-3 border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200 rounded-2xl px-4 py-3 font-extrabold text-amber-950 text-base outline-none transition-all placeholder:text-slate-400 shadow-inner"
            />
            {errorMsg && (
              <p className="text-xs font-black text-rose-600 mt-1.5 flex items-center gap-1 animate-pulse">
                ⚠️ {errorMsg}
              </p>
            )}
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-black text-amber-950 mb-1.5">
              Pilih Maskot Favoritmu:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((item) => {
                const isSelected = selectedAvatar === item.emoji;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedAvatar(item.emoji);
                    }}
                    className={`relative aspect-square rounded-2xl border-3 flex flex-col items-center justify-center p-1.5 transition-all transform active:scale-95 ${
                      isSelected
                        ? 'bg-amber-200 border-amber-600 ring-3 ring-amber-400 scale-105'
                        : 'bg-white border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[10px] font-black text-amber-900 truncate w-full text-center mt-0.5">
                      {item.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-b-4 border-emerald-700 text-white font-black text-base py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" /> Simpan Nama & Mulai Bermain!
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onCancel();
                }}
                className="w-full text-xs font-extrabold text-amber-800 hover:text-amber-950 py-1"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
