import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { Play, RotateCcw, Trophy, Users, ArrowLeft, Award, Sparkles, Check, Clock } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GAME_LEVELS, GameLevelConfig, PlayerProfile, TileItem, LEVEL_0_MASCOTS } from '../types/game';
import { getLevel0TileStyle } from '../utils/level0Picture';
import {
  generateSolvableBoard,
  getMovableTileIndices,
  checkVictoryCondition,
  calculateProgressPercentage,
  calculateStarsAndScore,
} from '../utils/puzzle';
import { soundManager } from '../lib/sound';
import { VictoryYouTubeAudio } from './VictoryYouTubeAudio';

interface IFPGameModeProps {
  currentUser: PlayerProfile;
  onBack: () => void;
}

interface IFPPlayer {
  id: number;
  name: string;
  avatar: string;
  board: TileItem[];
  moves: number;
  timeSeconds: number;
  isFinished: boolean;
  finishRank?: number;
  score: number;
}

const DEFAULT_AVATARS = ['🐰', '🦁', '🐼', '🦊', '🐸', '🐯', '🦄', '🐨'];

export const IFPGameMode: React.FC<IFPGameModeProps> = ({ currentUser, onBack }) => {
  const [playerCount, setPlayerCount] = useState<number>(2); // 2, 3, or 4 players
  const [selectedLevel, setSelectedLevel] = useState<GameLevelConfig>(GAME_LEVELS[0]);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'finished'>('setup');

  const [players, setPlayers] = useState<IFPPlayer[]>([
    { id: 1, name: currentUser.displayName || 'Pemain 1', avatar: currentUser.avatar || '🐰', board: [], moves: 0, timeSeconds: 0, isFinished: false, score: 0 },
    { id: 2, name: 'Pemain 2', avatar: '🦁', board: [], moves: 0, timeSeconds: 0, isFinished: false, score: 0 },
    { id: 3, name: 'Pemain 3', avatar: '🐼', board: [], moves: 0, timeSeconds: 0, isFinished: false, score: 0 },
    { id: 4, name: 'Pemain 4', avatar: '🦊', board: [], moves: 0, timeSeconds: 0, isFinished: false, score: 0 },
  ]);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [finishOrder, setFinishOrder] = useState<number[]>([]);
  const [isSavingLeaderboard, setIsSavingLeaderboard] = useState(false);

  // Timer Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  // Update players list when playerCount changes
  const handlePlayerCountChange = (count: number) => {
    soundManager.playClick();
    setPlayerCount(count);
  };

  // Update individual player name or avatar
  const handleUpdatePlayerInfo = (id: number, field: 'name' | 'avatar', value: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Start IFP Match
  const handleStartIFP = () => {
    soundManager.playClick();
    setTimerSeconds(0);
    setFinishOrder([]);

    // Generate unique randomized board for EACH active player
    const initializedPlayers = players.slice(0, playerCount).map((p) => {
      const uniqueBoard = generateSolvableBoard(selectedLevel, 50);
      return {
        ...p,
        board: uniqueBoard,
        moves: 0,
        timeSeconds: 0,
        isFinished: false,
        finishRank: undefined,
        score: 0,
      };
    });

    setPlayers(initializedPlayers);
    setGameState('playing');
  };

  // Handle Tile Click for a specific IFP Player
  const handleTileClick = (playerId: number, clickedIdx: number) => {
    const targetPlayer = players.find((p) => p.id === playerId);
    if (!targetPlayer || targetPlayer.isFinished || gameState !== 'playing') return;

    const board = targetPlayer.board;
    const emptyIdx = board.findIndex((t) => t.value === 0);
    const cols = selectedLevel.gridCols || selectedLevel.gridSize;
    const rows = selectedLevel.gridRows || selectedLevel.gridSize;
    const movables = getMovableTileIndices(emptyIdx, cols, rows);

    if (movables.includes(clickedIdx)) {
      soundManager.playSlide();

      const updatedBoard = [...board];
      [updatedBoard[clickedIdx], updatedBoard[emptyIdx]] = [
        updatedBoard[emptyIdx],
        updatedBoard[clickedIdx],
      ];

      // Check if tile landed in correct position
      const movedValue = updatedBoard[emptyIdx].value;
      if (movedValue > 0 && movedValue <= selectedLevel.targetNumbersCount) {
        if (emptyIdx === movedValue - 1) {
          soundManager.playCorrectSpot();
        }
      }

      const newMoves = targetPlayer.moves + 1;
      const isWin = checkVictoryCondition(updatedBoard, selectedLevel.targetNumbersCount);

      let newRank = targetPlayer.finishRank;
      let isPlayerFinished: boolean = targetPlayer.isFinished;
      let calculatedScore = targetPlayer.score;

      if (isWin && !isPlayerFinished) {
        soundManager.playWin();
        isPlayerFinished = true;
        const currentFinishCount = finishOrder.length + 1;
        newRank = currentFinishCount;
        setFinishOrder((prev) => [...prev, playerId]);

        const { score } = calculateStarsAndScore(selectedLevel, newMoves, timerSeconds);
        calculatedScore = score;
      }

      // Update state for this player
      setPlayers((prev) => {
        const nextPlayers = prev.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              board: updatedBoard,
              moves: newMoves,
              timeSeconds: isPlayerFinished ? (p.timeSeconds || timerSeconds) : timerSeconds,
              isFinished: isPlayerFinished,
              finishRank: newRank,
              score: calculatedScore,
            };
          }
          return p;
        });

        // Check if all active players finished
        const activePlayers = nextPlayers.slice(0, playerCount);
        const allDone = activePlayers.every((p) => p.isFinished);

        if (allDone) {
          setGameState('finished');
          saveResultsToGlobalLeaderboard(activePlayers);
        }

        return nextPlayers;
      });
    }
  };

  // Force End IFP Match early (Teacher control)
  const handleEndMatchEarly = () => {
    soundManager.playClick();
    const activePlayers = players.slice(0, playerCount).map((p) => {
      if (!p.isFinished) {
        const { score } = calculateStarsAndScore(selectedLevel, p.moves || 10, timerSeconds || 10);
        return {
          ...p,
          timeSeconds: timerSeconds,
          score: Math.floor(score * 0.5), // partial score if forced end
        };
      }
      return p;
    });

    setPlayers(activePlayers);
    setGameState('finished');
    saveResultsToGlobalLeaderboard(activePlayers);
  };

  // Save all player scores to Global Leaderboard in Firestore
  const saveResultsToGlobalLeaderboard = async (finalPlayers: IFPPlayer[]) => {
    setIsSavingLeaderboard(true);
    const path = 'leaderboard';

    try {
      const promises = finalPlayers.map((p) =>
        addDoc(collection(db, path), {
          userId: `ifp_${p.name.replace(/\s+/g, '_')}_${Date.now()}`,
          playerName: `${p.name} (IFP)`,
          playerAvatar: p.avatar,
          level: selectedLevel.id,
          gridSize: selectedLevel.gridSize,
          score: p.score || 10,
          moves: p.moves || 0,
          timeSeconds: p.timeSeconds || timerSeconds,
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(promises);
      console.log('Saved all IFP scores to Global Leaderboard');
    } catch (err) {
      console.error('Error saving IFP scores to leaderboard:', err);
    } finally {
      setIsSavingLeaderboard(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-4 animate-fade-in">
      <VictoryYouTubeAudio isPlaying={gameState === 'finished'} />

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between bg-white border-3 border-amber-400 rounded-2xl p-3 shadow-md">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-amber-600 px-3 py-1.5 rounded-xl font-black text-amber-950 text-xs sm:text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <h2 className="text-lg sm:text-xl font-black text-amber-950 flex items-center gap-2">
          🖥️ Mode IFP (Layar Sentuh Kelas / Smartboard)
        </h2>

        {gameState === 'playing' ? (
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 border-2 border-amber-500 rounded-xl px-3 py-1 font-black text-amber-950 text-xs sm:text-sm flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-700 animate-spin" /> {formatTime(timerSeconds)}
            </div>
            <button
              onClick={handleEndMatchEarly}
              className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-rose-700 shadow-xs"
            >
              Selesaikan
            </button>
          </div>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* SETUP STATE */}
      {gameState === 'setup' && (
        <div className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <span className="text-4xl sm:text-5xl">🖥️</span>
            <h3 className="text-2xl font-black text-amber-950">
              Pengaturan Mode IFP Kelas
            </h3>
            <p className="text-xs sm:text-sm font-bold text-amber-900/90 max-w-xl mx-auto">
              Mainkan puzzle langsung di 1 layar sentuh besar (Smartboard/IFP) sampai 4 pemain secara bersamaan dengan papan acak berbeda tiap pemain!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Count & Level Selection */}
            <div className="bg-white border-3 border-amber-300 rounded-2xl p-4 space-y-4 shadow-inner">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-amber-950 block">
                  1. Jumlah Pemain Bertanding:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => handlePlayerCountChange(count)}
                      className={`py-2.5 rounded-xl font-black text-sm border-2 transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        playerCount === count
                          ? 'bg-amber-500 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                          : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <Users className="w-4 h-4" /> {count} Pemain
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs sm:text-sm font-black text-amber-950 block">
                  2. Pilih Level Tandingan:
                </label>
                <div className="space-y-2">
                  {GAME_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedLevel(lvl);
                      }}
                      className={`w-full text-left p-3 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-between transition-all ${
                        selectedLevel.id === lvl.id
                          ? 'bg-amber-200 border-amber-600 text-amber-950 ring-2 ring-amber-400'
                          : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      <div>
                        <div className="font-black">{lvl.title}</div>
                        <div className="text-[11px] font-bold text-amber-800">{lvl.subtitle}</div>
                      </div>
                      <span className="bg-amber-400 text-amber-950 px-2 py-1 rounded-lg text-xs font-black">
                        {lvl.gridSize}x{lvl.gridSize}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Players Customization */}
            <div className="bg-white border-3 border-amber-300 rounded-2xl p-4 space-y-3 shadow-inner">
              <label className="text-xs sm:text-sm font-black text-amber-950 block">
                3. Nama & Profil Pemain Bertanding:
              </label>

              <div className="space-y-2.5">
                {players.slice(0, playerCount).map((p, idx) => (
                  <div key={p.id} className="bg-amber-50 border-2 border-amber-200 rounded-xl p-2.5 space-y-2">
                    <div className="text-xs font-black text-amber-900 flex items-center justify-between">
                      <span>Pemain #{idx + 1}</span>
                    </div>

                    <div className="flex gap-2">
                      {/* Avatar Picker */}
                      <select
                        value={p.avatar}
                        onChange={(e) => handleUpdatePlayerInfo(p.id, 'avatar', e.target.value)}
                        className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-xl outline-none"
                      >
                        {DEFAULT_AVATARS.map((av) => (
                          <option key={av} value={av}>
                            {av}
                          </option>
                        ))}
                      </select>

                      {/* Name Input */}
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdatePlayerInfo(p.id, 'name', e.target.value)}
                        placeholder={`Nama Pemain ${idx + 1}`}
                        className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1 font-bold text-amber-950 text-xs sm:text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartIFP}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-b-4 border-emerald-700 text-white font-black text-lg sm:text-xl py-3.5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5"
          >
            <Play className="w-6 h-6 fill-current" /> Mulai Tandingan IFP Sekarang
          </button>
        </div>
      )}

      {/* PLAYING STATE (Multi-grid Side-by-Side IFP Screen) */}
      {gameState === 'playing' && (
        <div
          className={`grid gap-3 sm:gap-4 ${
            playerCount === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : playerCount === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {players.slice(0, playerCount).map((p, pIdx) => {
            const progress = calculateProgressPercentage(p.board, selectedLevel.targetNumbersCount);
            return (
              <div
                key={p.id}
                className={`bg-amber-100 border-4 rounded-3xl p-3 shadow-lg space-y-2 flex flex-col justify-between ${
                  p.isFinished ? 'border-emerald-500 bg-emerald-50/90' : 'border-amber-500'
                }`}
              >
                {/* Player Header */}
                <div className="bg-white border-2 border-amber-300 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{p.avatar}</span>
                    <div className="truncate">
                      <div className="text-xs font-black text-amber-950 truncate">{p.name}</div>
                      <div className="text-[10px] font-bold text-amber-800">
                        {p.isFinished ? `Selesai (${p.finishRank === 1 ? '🥇 Juara 1' : `Peringkat ${p.finishRank}`})` : `Langkah: ${p.moves}`}
                      </div>
                    </div>
                  </div>

                  <span className="bg-amber-400 text-amber-950 text-xs font-black px-2 py-1 rounded-lg shrink-0">
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-amber-200 rounded-full h-2.5 border border-amber-300 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Interactive Touch Puzzle Grid with Smooth Animated Sliding Tiles */}
                <div className="bg-amber-200/80 border-3 border-amber-500 rounded-2xl p-2 shadow-inner flex justify-center items-center my-auto min-h-[220px]">
                  <div className="relative aspect-square w-full max-w-[280px]">
                    {/* Static Background Grid Slots */}
                    {Array.from({ length: selectedLevel.gridSize * selectedLevel.gridSize }).map((_, slotIdx) => {
                      const r = Math.floor(slotIdx / selectedLevel.gridSize);
                      const c = slotIdx % selectedLevel.gridSize;
                      const percent = 100 / selectedLevel.gridSize;
                      return (
                        <div
                          key={`ifp-slot-${r}-${c}`}
                          className="absolute p-1"
                          style={{
                            width: `${percent}%`,
                            height: `${percent}%`,
                            left: `${c * percent}%`,
                            top: `${r * percent}%`,
                          }}
                        >
                          <div className="w-full h-full rounded-xl bg-amber-300/40 border border-amber-400/50 shadow-inner" />
                        </div>
                      );
                    })}

                    {/* Interactive Sliding Tiles */}
                    {p.board.map((tile, tIdx) => {
                      if (tile.value === 0) return null;

                      const cols = selectedLevel.gridCols || selectedLevel.gridSize;
                      const rows = selectedLevel.gridRows || selectedLevel.gridSize;
                      const row = Math.floor(tIdx / cols);
                      const col = tIdx % cols;
                      const colPercent = 100 / cols;
                      const rowPercent = 100 / rows;
                      const isTarget = tile.isTargetNumber;
                      const isCorrectPos = isTarget && tIdx === tile.value - 1;
                      const mascot = selectedLevel.id === 0 ? LEVEL_0_MASCOTS[tile.value] : null;
                      const isLevel0 = selectedLevel.id === 0;
                      const tileStyle = isLevel0 ? getLevel0TileStyle(tile.value, cols, rows) : {};

                      return (
                        <div
                          key={tile.id || `ifp-tile-${p.id}-${tile.value}`}
                          className={`absolute tile-slide-transition ${isLevel0 ? 'p-0.5' : 'p-1'}`}
                          style={{
                            width: `${colPercent}%`,
                            height: `${rowPercent}%`,
                            left: `${col * colPercent}%`,
                            top: `${row * rowPercent}%`,
                          }}
                        >
                          <button
                            disabled={p.isFinished}
                            onClick={() => handleTileClick(p.id, tIdx)}
                            style={tileStyle}
                            className={`w-full h-full flex items-center justify-center font-black text-sm sm:text-base md:text-lg transition-transform duration-150 transform active:scale-95 shadow-sm touch-manipulation cursor-pointer relative overflow-hidden ${
                              isLevel0
                                ? isCorrectPos
                                  ? 'rounded-lg border-2 border-emerald-500 ring-2 ring-emerald-400'
                                  : 'rounded-lg border-2 border-amber-500/80 ring-1 ring-amber-300/60'
                                : isCorrectPos
                                ? 'rounded-xl border-2 sm:border-3 bg-emerald-400 border-emerald-600 text-white'
                                : isTarget
                                ? 'rounded-xl border-2 sm:border-3 bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300'
                                : 'rounded-xl border-2 sm:border-3 bg-white border-amber-300 text-slate-700'
                            }`}
                          >
                            {isLevel0 ? (
                              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                                <div className={`absolute inset-0 transition-colors ${
                                  isCorrectPos ? 'bg-emerald-500/10' : 'bg-black/15'
                                }`} />
                                <span className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] z-10 select-none">
                                  {tile.value}
                                </span>
                                <div className="absolute top-0.5 left-0.5 bg-black/60 text-white px-1 py-0.2 rounded-md text-[9px] font-black z-10">
                                  #{tile.value}
                                </div>
                              </div>
                            ) : (
                              tile.value
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {p.isFinished && (
                  <div className="bg-emerald-500 text-white text-center text-xs font-black p-2 rounded-xl border border-emerald-700 animate-bounce">
                    🎉 Selesai dalam {p.timeSeconds}s!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FINISHED LEADERBOARD RECAP STATE */}
      {gameState === 'finished' && (
        <div className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-6 text-center space-y-5 shadow-2xl max-w-xl mx-auto animate-fade-in">
          <div className="w-16 h-16 bg-amber-400 border-4 border-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-md animate-bounce">
            🏆
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-amber-950">
              Hasil Tandingan IFP Kelas!
            </h3>
            <p className="text-xs font-bold text-amber-800">
              Semua skor telah direkap dan otomatis masuk ke Papan Peringkat Global!
            </p>
          </div>

          {/* Podium / Leaderboard Table */}
          <div className="space-y-2">
            {players
              .slice(0, playerCount)
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((p, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 font-black ${
                      rank === 1
                        ? 'bg-amber-300 border-amber-600 shadow-md ring-2 ring-amber-400'
                        : 'bg-white border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                      <span className="text-2xl">{p.avatar}</span>
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-black text-amber-950">{p.name}</div>
                        <div className="text-[10px] font-bold text-amber-800">
                          {p.moves} Langkah • {p.timeSeconds}s
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600">+{p.score} Poin</div>
                      <div className="text-[10px] font-bold text-amber-800">Global Leaderboard</div>
                    </div>
                  </div>
                );
              })}
          </div>

          {isSavingLeaderboard && (
            <div className="text-xs font-extrabold text-amber-900 animate-pulse">
              💾 Menyimpan poin ke Papan Peringkat Global...
            </div>
          )}

          {/* Play Again Buttons */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleStartIFP}
              className="bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Main Lagi IFP
            </button>

            <button
              onClick={() => setGameState('setup')}
              className="bg-amber-400 hover:bg-amber-300 border-b-4 border-amber-600 text-amber-950 font-black px-5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md flex items-center gap-1.5"
            >
              Ubah Pengaturan Pemain
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
