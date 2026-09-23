import React, { useState, useEffect } from 'react';
import { X, Music, Play, Pause, Volume2, VolumeX, Youtube, Sparkles, Check, ExternalLink } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface YouTubeMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
}

export const PRESET_YOUTUBE_TRACKS = [
  {
    title: '🎶 Musik Belajar & Santai TK/SD',
    url: 'https://www.youtube.com/watch?v=eqwR1xWU0FQ&t=68s',
    id: '5qap5aO4i9A',
    description: 'Lofi cilik lembut untuk melatih konsentrasi',
  },
  {
    title: '🌸 Musik Klasik Mozart Anak Pintar',
    url: 'https://www.youtube.com/watch?v=Ex_aWeTDwNA',
    id: 'jgpJVI3tDbY',
    description: 'Instrumen otak kanan untuk kecerdasan & fokus',
  },
  {
    title: '🌳 Suara Alam & Seruling Ceria',
    url: 'https://www.youtube.com/watch?v=h_YQgl4KZ_E',
    id: 'eKFTSSKCzWA',
    description: 'Suara musik ceria kelas',
  },
  {
    title: '🧩 Latar Instrumental Ceria',
    url: 'https://www.youtube.com/watch?v=68jD0M9pb4c',
    id: '1ZYbU874c4E',
    description: 'Musik riang penunjang aktivitas permainan',
  },
];

// Helper to extract YouTube Video ID from any URL or string
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url.trim().length === 11 ? url.trim() : null;
}

export const YouTubeMusicModal: React.FC<YouTubeMusicModalProps> = ({
  isOpen,
  onClose,
  youtubeUrl,
  setYoutubeUrl,
  isPlaying,
  setIsPlaying,
  volume,
  setVolume,
}) => {
  const [inputUrl, setInputUrl] = useState(youtubeUrl);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setInputUrl(youtubeUrl);
  }, [youtubeUrl]);

  if (!isOpen) return null;

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const extractedId = extractYouTubeId(inputUrl);
    if (!extractedId) {
      setErrorMsg('Link YouTube tidak valid. Mohon masukkan link YouTube yang benar.');
      return;
    }

    setErrorMsg('');
    soundManager.playClick();
    setYoutubeUrl(inputUrl);
    setIsPlaying(true);
  };

  const handleSelectPreset = (presetUrl: string) => {
    soundManager.playClick();
    setInputUrl(presetUrl);
    setYoutubeUrl(presetUrl);
    setIsPlaying(true);
    setErrorMsg('');
  };

  const videoId = extractYouTubeId(youtubeUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-4 border-amber-500 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-500 to-amber-500 p-4 border-b-4 border-amber-600 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-md">
              <Youtube className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Pemutar Musik Latar (YouTube Guru)
              </h2>
              <p className="text-xs font-bold text-amber-100">
                Putar lagu/instrumen pilihan guru saat anak bermain
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 border border-white/40 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Custom Link Input Form */}
          <form onSubmit={handleApplyUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-black text-amber-950 mb-1 flex items-center justify-between">
                <span>Masukkan Link YouTube Pilihan Guru:</span>
                <span className="text-red-600 font-extrabold text-[11px] flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5" /> Video / Music URL
                </span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 bg-white border-2 border-amber-300 focus:border-red-500 focus:ring-3 focus:ring-red-200 rounded-2xl px-3.5 py-2.5 font-bold text-amber-950 text-xs sm:text-sm outline-none transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 active:scale-95 border-b-4 border-red-800 text-white font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" /> Putar Link
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs font-black text-rose-600 mt-1 animate-pulse">
                  ⚠️ {errorMsg}
                </p>
              )}
            </div>
          </form>

          {/* Quick Presets for Teacher */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-amber-950 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-600" /> Pilihan Musik Rekomendasi Guru:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_YOUTUBE_TRACKS.map((track) => {
                const isSelected = videoId === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSelectPreset(track.url)}
                    className={`text-left p-3 rounded-2xl border-2 transition-all transform active:scale-95 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-100 border-red-500 ring-2 ring-red-300 shadow-md'
                        : 'bg-white border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xs font-black text-amber-950 leading-tight">
                        {track.title}
                      </span>
                      {isSelected && (
                        <span className="bg-red-500 text-white rounded-full p-0.5 text-[10px]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-amber-800/80 mt-1">
                      {track.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Control Toolbar */}
          <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setIsPlaying(!isPlaying);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md transition-all active:scale-95 border-b-4 ${
                    isPlaying
                      ? 'bg-amber-500 border-amber-700 hover:bg-amber-600'
                      : 'bg-emerald-500 border-emerald-700 hover:bg-emerald-600'
                  }`}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <div>
                  <div className="text-xs font-black text-amber-950">
                    Status: {isPlaying ? '🎵 Musik Sedang Berputar' : '⏸️ Dihentikan Sementara'}
                  </div>
                  <div className="text-[11px] font-extrabold text-amber-800">
                    Video ID: {videoId || 'Belum Dipilih'}
                  </div>
                </div>
              </div>

              {videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-black text-red-600 hover:underline flex items-center gap-1 bg-white border border-red-300 rounded-lg px-2 py-1"
                >
                  Buka YouTube <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-amber-100 p-3 border-t-2 border-amber-300 flex justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="bg-amber-400 hover:bg-amber-300 border-2 border-amber-600 text-amber-950 font-black px-5 py-2 rounded-xl text-xs shadow-xs"
          >
            Selesai & Lanjutkan Bermain
          </button>
        </div>
      </div>
    </div>
  );
};
