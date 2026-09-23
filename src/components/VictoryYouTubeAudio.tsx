import React from 'react';

interface VictoryYouTubeAudioProps {
  isPlaying: boolean;
}

export const VictoryYouTubeAudio: React.FC<VictoryYouTubeAudioProps> = ({ isPlaying }) => {
  if (!isPlaying) return null;

  return (
    <div className="fixed -bottom-96 -right-96 opacity-0 pointer-events-none w-1 h-1 overflow-hidden z-0">
      <iframe
        width="200"
        height="200"
        src="https://www.youtube.com/embed/yoI8zWA8ySo?autoplay=1&enablejsapi=1"
        title="Musik Kemenangan YouTube"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
};
