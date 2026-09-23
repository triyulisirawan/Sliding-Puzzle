import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Lightbulb, RotateCcw, Undo2, ArrowLeft, Timer, Footprints, CheckCircle2, Sparkles, Trophy } from 'lucide-react';
import { GameLevelConfig, TileItem, PlayerProfile, LEVEL_0_MASCOTS } from '../types/game';
import { LEVEL_0_LION_URL, LEVEL_0_ELEPHANT_URL, getLevel0TileStyle } from '../utils/level0Picture';
import {
  generateSolvableBoard,
  getMovableTileIndices,
  checkVictoryCondition,
  calculateProgressPercentage,
  findHintTileIndex,
} from '../utils/puzzle';
import { soundManager } from '../lib/sound';

interface GameBoardProps {
  level: GameLevelConfig;
  player: PlayerProfile;
  onVictory: (moves: number, timeSeconds: number) => void;
  onBackToLevels: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  level,
  player,
  onVictory,
  onBackToLevels,
}) => {
  const [level0Grid, setLevel0Grid] = useState<'2x2' | '3x2'>('3x2');
  const [board, setBoard] = useState<TileItem[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [history, setHistory] = useState<TileItem[][]>([]);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute active level configuration dynamically
  const activeLevelConfig = useMemo(() => {
    if (level.id === 0) {
      if (level0Grid === '2x2') {
        return {
          ...level,
          subtitle: 'Kotak 2x2 Singa Lucu 🦁 (Urutkan angka 1-3)',
          gridCols: 2,
          gridRows: 2,
          targetNumbersCount: 3,
        };
      } else {
        return {
          ...level,
          subtitle: 'Kotak 3x2 Gajah Lucu 🐘 (Urutkan angka 1-5)',
          gridCols: 3,
          gridRows: 2,
          targetNumbersCount: 5,
        };
      }
    }
    return level;
  }, [level, level0Grid]);

  // Initialize fresh puzzle
  const initGame = useCallback(() => {
    const newBoard = generateSolvableBoard(activeLevelConfig, 60);
    setBoard(newBoard);
    setMoves(0);
    setTimeSeconds(0);
    setIsTimerRunning(true);
    setHistory([]);
    setHintIndex(null);
  }, [activeLevelConfig]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer Ticker
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Handle Tile Slide
  const handleTileClick = (clickedIdx: number) => {
    const emptyIdx = board.findIndex((t) => t.value === 0);
    const cols = activeLevelConfig.gridCols || activeLevelConfig.gridSize;
    const rows = activeLevelConfig.gridRows || activeLevelConfig.gridSize;
    const movables = getMovableTileIndices(emptyIdx, cols, rows);

    if (movables.includes(clickedIdx)) {
      soundManager.playSlide();

      // Save history for Undo
      setHistory((prev) => [...prev, board.map((t) => ({ ...t }))]);

      // Swap tile and empty cell
      const updatedBoard = [...board];
      [updatedBoard[clickedIdx], updatedBoard[emptyIdx]] = [
        updatedBoard[emptyIdx],
        updatedBoard[clickedIdx],
      ];

      setBoard(updatedBoard);
      setMoves((m) => m + 1);
      setHintIndex(null);

      // Check if newly placed tile is in correct spot
      const movedTileValue = updatedBoard[emptyIdx].value;
      if (movedTileValue > 0 && movedTileValue <= activeLevelConfig.targetNumbersCount) {
        if (emptyIdx === movedTileValue - 1) {
          soundManager.playCorrectSpot();
        }
      }

      // Check victory
      if (checkVictoryCondition(updatedBoard, activeLevelConfig.targetNumbersCount)) {
        setIsTimerRunning(false);
        soundManager.playWin();
        setTimeout(() => {
          onVictory(moves + 1, timeSeconds);
        }, 400);
      }
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTimerRunning) return;
      const emptyIdx = board.findIndex((t) => t.value === 0);
      if (emptyIdx === -1) return;

      const cols = activeLevelConfig.gridCols || activeLevelConfig.gridSize;
      const rows = activeLevelConfig.gridRows || activeLevelConfig.gridSize;

      const emptyRow = Math.floor(emptyIdx / cols);
      const emptyCol = emptyIdx % cols;

      let targetIdx = -1;
      if (e.key === 'ArrowUp' && emptyRow < rows - 1) {
        targetIdx = (emptyRow + 1) * cols + emptyCol;
      } else if (e.key === 'ArrowDown' && emptyRow > 0) {
        targetIdx = (emptyRow - 1) * cols + emptyCol;
      } else if (e.key === 'ArrowLeft' && emptyCol < cols - 1) {
        targetIdx = emptyRow * cols + (emptyCol + 1);
      } else if (e.key === 'ArrowRight' && emptyCol > 0) {
        targetIdx = emptyRow * cols + (emptyCol - 1);
      }

      if (targetIdx !== -1) {
        e.preventDefault();
        handleTileClick(targetIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, isTimerRunning, activeLevelConfig]);

  // Undo last move
  const handleUndo = () => {
    if (history.length === 0) return;
    soundManager.playClick();
    const previousBoard = history[history.length - 1];
    setBoard(previousBoard);
    setHistory((prev) => prev.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
    setHintIndex(null);
  };

  // Show Hint
  const handleShowHint = () => {
    soundManager.playHint();
    const recommendedIdx = findHintTileIndex(board, activeLevelConfig);
    setHintIndex(recommendedIdx);
  };

  const progressPercent = calculateProgressPercentage(board, activeLevelConfig.targetNumbersCount);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-5 animate-fade-in">
      {/* Top Navigation & Level Banner */}
      <div className="flex items-center justify-between gap-3 bg-white/90 border-3 border-amber-400 rounded-2xl p-3 shadow-md">
        <button
          onClick={() => {
            soundManager.playClick();
            onBackToLevels();
          }}
          className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-amber-600 px-3 py-1.5 rounded-xl font-black text-amber-950 text-xs sm:text-sm transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Pilih Level
        </button>

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black text-amber-950 leading-tight">
            {level.title}
          </h2>
          <p className="text-[11px] sm:text-xs font-bold text-amber-800">
            Grid {(level.gridCols || level.gridSize)}x{(level.gridRows || level.gridSize)}
          </p>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            initGame();
          }}
          className="flex items-center gap-1.5 bg-rose-100 hover:bg-rose-200 border-2 border-rose-500 px-3 py-1.5 rounded-xl font-black text-rose-950 text-xs sm:text-sm transition-all active:scale-95"
          title="Ulang dari awal"
        >
          <RotateCcw className="w-4 h-4 text-rose-600" /> Ulang
        </button>
      </div>

      {/* Target Task & Progress Indicator */}
      <div className="bg-amber-100 border-3 border-amber-400 rounded-2xl p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm font-black text-amber-950">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Tugas Utama: Urutkan Angka 1 sampai {activeLevelConfig.targetNumbersCount}!
          </span>
          <span className="text-amber-800 font-extrabold">{progressPercent}% Selesai</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-amber-200 rounded-full h-3.5 border-2 border-amber-500 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Game Stats Bar: Timer & Moves */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky-100 border-3 border-sky-400 rounded-2xl p-2.5 flex items-center justify-center gap-2 shadow-xs">
          <Timer className="w-5 h-5 text-sky-600" />
          <div>
            <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wide">Waktu</div>
            <div className="text-lg font-black text-sky-950 leading-none">{formatTime(timeSeconds)}</div>
          </div>
        </div>

        <div className="bg-purple-100 border-3 border-purple-400 rounded-2xl p-2.5 flex items-center justify-center gap-2 shadow-xs">
          <Footprints className="w-5 h-5 text-purple-600" />
          <div>
            <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wide">Langkah</div>
            <div className="text-lg font-black text-purple-950 leading-none">{moves}</div>
          </div>
        </div>
      </div>

      {/* Level 0 Grid Mode Selector Toggle Bar */}
      {level.id === 0 && (
        <div className="flex items-center justify-center gap-2 bg-amber-100/90 p-1.5 rounded-2xl border-2 border-amber-300 shadow-xs">
          <button
            onClick={() => setLevel0Grid('2x2')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              level0Grid === '2x2'
                ? 'bg-amber-500 text-white shadow-md scale-105 border border-amber-600'
                : 'bg-white/80 text-amber-900 hover:bg-white border border-amber-200'
            }`}
          >
            <span className="text-base sm:text-lg">🦁</span>
            <span>Grid 2x2</span>
            <span className="text-[10px] opacity-90 font-bold">(Angka 1-3)</span>
          </button>

          <button
            onClick={() => setLevel0Grid('3x2')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              level0Grid === '3x2'
                ? 'bg-emerald-500 text-white shadow-md scale-105 border border-emerald-600'
                : 'bg-white/80 text-emerald-900 hover:bg-white border border-emerald-200'
            }`}
          >
            <span className="text-base sm:text-lg">🐘</span>
            <span>Grid 3x2</span>
            <span className="text-[10px] opacity-90 font-bold">(Angka 1-5)</span>
          </button>
        </div>
      )}

      {/* Level 0 Target Picture Preview Header */}
      {level.id === 0 && (
        <div className="bg-emerald-100/90 border-2 border-emerald-400 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between shadow-xs mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse shrink-0" />
            <div>
              <span className="text-xs sm:text-sm font-black text-emerald-950 block">
                {level0Grid === '2x2' ? 'Puzzle Gambar Singa Lucu 🦁' : 'Puzzle Gambar Gajah Lucu 🐘'}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-800">
                {level0Grid === '2x2'
                  ? 'Geser 3 potongan gambar agar membentuk 1 Singa utuh!'
                  : 'Geser 5 potongan gambar agar membentuk 1 Gajah utuh!'}
              </span>
            </div>
          </div>
          <div className="shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl border-2 border-emerald-500 overflow-hidden shadow-xs relative bg-white">
            <img
              src={level0Grid === '2x2' ? LEVEL_0_LION_URL : LEVEL_0_ELEPHANT_URL}
              alt={level0Grid === '2x2' ? 'Singa Lucu' : 'Gajah Lucu'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Puzzle Board Container with Smooth Animated Sliding Tiles */}
      <div className="bg-amber-200/80 border-4 border-amber-600 rounded-3xl p-3 sm:p-4 shadow-xl flex justify-center">
        {(() => {
          const cols = activeLevelConfig.gridCols || activeLevelConfig.gridSize;
          const rows = activeLevelConfig.gridRows || activeLevelConfig.gridSize;
          const colPercent = 100 / cols;
          const rowPercent = 100 / rows;

          const fontSizeClass =
            cols === 3 && rows === 2
              ? 'text-3xl sm:text-5xl font-black'
              : cols === 2 && rows === 2
              ? 'text-4xl sm:text-6xl font-black'
              : cols === 2
              ? 'text-4xl sm:text-6xl font-black'
              : cols >= 7
              ? 'text-xs sm:text-sm font-black'
              : cols >= 5
              ? 'text-base sm:text-xl font-black'
              : 'text-xl sm:text-3xl font-black';

          return (
            <div
              className="relative w-full"
              style={{
                maxWidth: cols === 2 && rows === 2 ? '300px' : cols === 3 && rows === 2 ? '360px' : cols === 3 ? '360px' : '440px',
                aspectRatio: `${cols} / ${rows}`,
              }}
            >
              {/* Static Background Grid Slots */}
              {Array.from({ length: cols * rows }).map((_, slotIdx) => {
                const r = Math.floor(slotIdx / cols);
                const c = slotIdx % cols;
                const isLevel0 = level.id === 0;
                return (
                  <div
                    key={`slot-${r}-${c}`}
                    className={`absolute ${isLevel0 ? 'p-0.5' : 'p-1 sm:p-1.5'}`}
                    style={{
                      width: `${colPercent}%`,
                      height: `${rowPercent}%`,
                      left: `${c * colPercent}%`,
                      top: `${r * rowPercent}%`,
                    }}
                  >
                    <div className={`w-full h-full bg-amber-300/40 border-2 border-amber-400/50 shadow-inner ${
                      isLevel0 ? 'rounded-lg sm:rounded-xl' : 'rounded-2xl sm:rounded-3xl'
                    }`} />
                  </div>
                );
              })}

              {/* Interactive Sliding Tiles */}
              {board.map((tile, idx) => {
                if (tile.value === 0) return null; // Empty cell rendered by static background

                const row = Math.floor(idx / cols);
                const col = idx % cols;
                const isTarget = tile.isTargetNumber;
                const isCorrectPosition = isTarget && idx === tile.value - 1;
                const isHint = hintIndex === idx;
                const isLevel0 = level.id === 0;
                const tileStyle = isLevel0 ? getLevel0TileStyle(tile.value, cols, rows) : {};

                return (
                  <div
                    key={tile.id || `tile-num-${tile.value}`}
                    className={`absolute tile-slide-transition ${isLevel0 ? 'p-0.5' : 'p-1 sm:p-1.5'}`}
                    style={{
                      width: `${colPercent}%`,
                      height: `${rowPercent}%`,
                      left: `${col * colPercent}%`,
                      top: `${row * rowPercent}%`,
                    }}
                  >
                    <button
                      onClick={() => handleTileClick(idx)}
                      style={tileStyle}
                      className={`w-full h-full flex flex-col items-center justify-center font-black transition-transform duration-150 transform active:scale-95 shadow-md select-none focus:outline-none cursor-pointer relative overflow-hidden ${
                        isLevel0
                          ? isCorrectPosition
                            ? 'rounded-lg sm:rounded-xl border-2 border-emerald-500 ring-2 ring-emerald-400/80 shadow-md'
                            : 'rounded-lg sm:rounded-xl border-2 border-amber-500/80 ring-1 ring-amber-300/60'
                          : isCorrectPosition
                          ? 'rounded-2xl sm:rounded-3xl bg-emerald-400 border-3 sm:border-4 border-emerald-600 text-white ring-2 ring-emerald-300'
                          : isTarget
                          ? 'rounded-2xl sm:rounded-3xl bg-amber-400 border-3 sm:border-4 border-amber-600 text-amber-950 hover:bg-amber-300'
                          : 'rounded-2xl sm:rounded-3xl bg-white border-3 sm:border-4 border-amber-300 text-slate-700 hover:bg-amber-50'
                      } ${isHint ? 'ring-4 ring-purple-500 scale-105 animate-bounce' : ''}`}
                    >
                      {isLevel0 ? (
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                          {/* Subtle tint overlay so the picture background stays clean and transparent behind big numbers */}
                          <div className={`absolute inset-0 transition-colors ${
                            isCorrectPosition ? 'bg-emerald-500/10' : 'bg-black/15 hover:bg-black/5'
                          }`} />

                          {/* BIG NUMBER IN THE CENTER */}
                          <span className={`${fontSizeClass} font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] z-10 select-none scale-110 tracking-tight`}>
                            {tile.value}
                          </span>

                          {/* Top-left small badge for extra clarity */}
                          <div className={`absolute top-1 left-1 px-1.5 py-0.2 rounded-md text-[10px] sm:text-xs font-black shadow-md border z-10 ${
                            isCorrectPosition
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-amber-500 text-amber-950 border-amber-300'
                          }`}>
                            #{tile.value}
                          </div>

                          {/* Checkmark badge top-right when correctly positioned */}
                          {isCorrectPosition && (
                            <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md border border-white z-10">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <span className={fontSizeClass}>{tile.value}</span>

                          {/* Green checkmark badge if correctly placed in target position */}
                          {isCorrectPosition && (
                            <div className="absolute top-1 right-1 bg-white text-emerald-600 rounded-full p-0.5 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Controls: Hint & Undo */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleShowHint}
          className="bg-purple-500 hover:bg-purple-400 active:scale-95 border-b-4 border-purple-700 text-white font-black px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm"
        >
          <Lightbulb className="w-4 h-4 text-yellow-300" /> Bantuan 💡
        </button>

        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className={`font-black px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm border-b-4 ${
            history.length > 0
              ? 'bg-amber-400 hover:bg-amber-300 border-amber-600 text-amber-950 active:scale-95'
              : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" /> Urungkan ↩️
        </button>
      </div>
    </div>
  );
};
