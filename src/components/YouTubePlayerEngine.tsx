import React from 'react';
import { Youtube, Music, Play, Pause, Settings, Volume2, VolumeX } from 'lucide-react';
import { extractYouTubeId } from './YouTubeMusicModal';
import { soundManager } from '../lib/sound';

interface YouTubePlayerEngineProps {
  youtubeUrl: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onOpenModal: () => void;
}

export const YouTubePlayerEngine: React.FC<YouTubePlayerEngineProps> = ({
  youtubeUrl,
  isPlaying,
  setIsPlaying,
  onOpenModal,
}) => {
  const videoId = extractYouTubeId(youtubeUrl);

  return (
    <>
      {/* Hidden YouTube IFrame Engine */}
      {videoId && isPlaying && (
        <div className="fixed -bottom-96 -right-96 opacity-0 pointer-events-none w-1 h-1 overflow-hidden">
          <iframe
            width="200"
            height="200"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1`}
            title="YouTube Background Music"
            allow="autoplay; encrypted-media"
          />
        </div>
      )}

      {/* Floating Mini Player Controls Widget */}
      <div className="fixed bottom-3 right-3 z-40 bg-white/95 backdrop-blur-md border-3 border-red-500 rounded-2xl p-2.5 shadow-xl flex items-center gap-2.5 animate-fade-in max-w-xs">
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenModal();
          }}
          className="w-10 h-10 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl flex items-center justify-center font-black shadow-sm transition-all relative group"
          title="Pengaturan Musik Guru"
        >
          <Music className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-black text-slate-800 truncate leading-tight flex items-center gap-1">
            <Youtube className="w-3.5 h-3.5 text-red-600 inline shrink-0" />
            <span>Musik Guru</span>
          </div>
          <div className="text-[10px] font-extrabold text-slate-500 truncate">
            {isPlaying ? '🎵 Sedang Memutar' : '⏸️ Dihentikan'}
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            setIsPlaying(!isPlaying);
          }}
          className={`p-2 rounded-xl border-2 font-black text-xs transition-all active:scale-95 ${
            isPlaying
              ? 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200'
              : 'bg-emerald-100 border-emerald-400 text-emerald-950 hover:bg-emerald-200'
          }`}
          title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenModal();
          }}
          className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 active:scale-95"
          title="Buka Musik YouTube Guru"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
