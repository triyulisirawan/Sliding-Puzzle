import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { AVATARS, PlayerProfile } from '../types/game';
import { soundManager } from '../lib/sound';

interface AvatarSelectorModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newAvatar: string, newName: string) => void;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  player,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(player.avatar);
  const [nameInput, setNameInput] = useState(player.displayName);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim() || 'Pemain Cilik';
    soundManager.playClick();
    onSave(selectedAvatar, cleanName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-4 border-amber-500 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all scale-100">
        {/* Modal Header */}
        <div className="bg-amber-400 p-4 border-b-4 border-amber-500 flex items-center justify-between">
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-900" /> Profil Pemain Cilik
          </h2>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-9 h-9 bg-amber-100 hover:bg-white border-2 border-amber-600 rounded-full flex items-center justify-center text-amber-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Nickname Input */}
          <div>
            <label className="block text-sm font-black text-amber-950 mb-1.5">
              Nama Panggilan Kamu:
            </label>
            <input
              type="text"
              maxLength={20}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Contoh: Budi Ceria"
              className="w-full bg-white border-3 border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200 rounded-2xl px-4 py-2.5 font-extrabold text-amber-950 text-base outline-none transition-all"
            />
          </div>

          {/* Avatar Options */}
          <div>
            <label className="block text-sm font-black text-amber-950 mb-2">
              Pilih Karakter Maskot:
            </label>
            <div className="grid grid-cols-4 gap-2.5">
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
                    className={`relative aspect-square rounded-2xl border-3 flex flex-col items-center justify-center p-2 transition-all transform active:scale-95 ${
                      isSelected
                        ? 'bg-amber-200 border-amber-600 ring-4 ring-amber-300 scale-105'
                        : 'bg-white border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <span className="text-3xl mb-1">{item.emoji}</span>
                    <span className="text-[10px] font-black text-amber-900 truncate w-full text-center">
                      {item.name.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-b-4 border-emerald-700 text-white font-black text-lg py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" /> Simpan Profil
          </button>
        </form>
      </div>
    </div>
  );
};
