import React from 'react';
import { X, Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-4 border-amber-500 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-amber-400 p-4 border-b-4 border-amber-500 flex items-center justify-between">
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-900" /> Cara Bermain Mudah
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
        <div className="p-5 space-y-4 text-slate-800 text-sm font-bold">
          <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border-2 border-amber-200">
            <span className="text-2xl">1️⃣</span>
            <div>
              <div className="text-amber-950 font-black">Tugas Utama</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Geser kotak angka agar tersusun berurutan dari pojok kiri atas (1, 2, 3...).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border-2 border-amber-200">
            <span className="text-2xl">2️⃣</span>
            <div>
              <div className="text-amber-950 font-black">Cara Menggeser Kotak</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Sentuh atau klik kotak angka yang berada di sebelah ruang kosong untuk menggesernya.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border-2 border-amber-200">
            <span className="text-2xl">3️⃣</span>
            <div>
              <div className="text-amber-950 font-black">Bantuan & Undoing</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Tekan tombol <span className="text-purple-700 font-extrabold">Bantuan 💡</span> jika bingung, atau <span className="text-amber-800 font-extrabold">Urungkan ↩️</span> untuk membatalkan langkah.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border-2 border-amber-200">
            <span className="text-2xl">4️⃣</span>
            <div>
              <div className="text-amber-950 font-black">Multiplayer Online</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Tantang temanmu dengan kode ruang atau bertanding dengan pemain online secara real-time!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 active:scale-95 border-b-4 border-amber-600 text-amber-950 font-black text-base py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Saya Mengerti, Siap Bermain!
          </button>
        </div>
      </div>
    </div>
  );
};
