import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lightbulb, RotateCcw, Undo2, ArrowLeft, Timer, Footprints, CheckCircle2, Sparkles, Trophy } from 'lucide-react';
import { GameLevelConfig, TileItem, PlayerProfile } from '../types/game';
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
  const [board, setBoard] = useState<TileItem[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [history, setHistory] = useState<TileItem[][]>([]);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize fresh puzzle
  const initGame = useCallback(() => {
    const newBoard = generateSolvableBoard(level, 60);
    setBoard(newBoard);
    setMoves(0);
    setTimeSeconds(0);
    setIsTimerRunning(true);
    setHistory([]);
    setHintIndex(null);
  }, [level]);

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
    const movables = getMovableTileIndices(emptyIdx, level.gridSize);

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
      if (movedTileValue > 0 && movedTileValue <= level.targetNumbersCount) {
        if (emptyIdx === movedTileValue - 1) {
          soundManager.playCorrectSpot();
        }
      }

      // Check victory
      if (checkVictoryCondition(updatedBoard, level.targetNumbersCount)) {
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

      const emptyRow = Math.floor(emptyIdx / level.gridSize);
      const emptyCol = emptyIdx % level.gridSize;

      let targetIdx = -1;
      if (e.key === 'ArrowUp' && emptyRow < level.gridSize - 1) {
        targetIdx = (emptyRow + 1) * level.gridSize + emptyCol;
      } else if (e.key === 'ArrowDown' && emptyRow > 0) {
        targetIdx = (emptyRow - 1) * level.gridSize + emptyCol;
      } else if (e.key === 'ArrowLeft' && emptyCol < level.gridSize - 1) {
        targetIdx = emptyRow * level.gridSize + (emptyCol + 1);
      } else if (e.key === 'ArrowRight' && emptyCol > 0) {
        targetIdx = emptyRow * level.gridSize + (emptyCol - 1);
      }

      if (targetIdx !== -1) {
        e.preventDefault();
        handleTileClick(targetIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, isTimerRunning, level.gridSize]);

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
    const recommendedIdx = findHintTileIndex(board, level);
    setHintIndex(recommendedIdx);
  };

  const progressPercent = calculateProgressPercentage(board, level.targetNumbersCount);

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
            Grid {level.gridSize}x{level.gridSize}
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
            Tugas Utama: Urutkan Angka 1 sampai {level.targetNumbersCount}!
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

      {/* Puzzle Board Container */}
      <div className="bg-amber-200/80 border-4 border-amber-600 rounded-3xl p-3 sm:p-5 shadow-xl flex justify-center">
        <div
          className="grid gap-2 sm:gap-3 w-full"
          style={{
            gridTemplateColumns: `repeat(${level.gridSize}, minmax(0, 1fr))`,
            maxWidth: level.gridSize === 2 ? '300px' : level.gridSize === 3 ? '360px' : '100%',
          }}
        >
          {board.map((tile, idx) => {
            const isEmpty = tile.value === 0;
            const isTarget = tile.isTargetNumber;
            const isCorrectPosition = isTarget && idx === tile.value - 1;
            const isHint = hintIndex === idx;

            // Font size calculation for 2x2 up to 9x9
            const fontSizeClass =
              level.gridSize === 2
                ? 'text-4xl sm:text-6xl font-black'
                : level.gridSize >= 7
                ? 'text-xs sm:text-sm font-black'
                : level.gridSize >= 5
                ? 'text-base sm:text-xl font-black'
                : 'text-xl sm:text-3xl font-black';

            return (
              <button
                key={tile.id || `idx-${idx}`}
                disabled={isEmpty}
                onClick={() => handleTileClick(idx)}
                className={`relative aspect-square rounded-2xl sm:rounded-3xl border-3 sm:border-4 flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-md select-none focus:outline-none ${
                  isEmpty
                    ? 'bg-amber-300/40 border-amber-400/50 shadow-inner'
                    : isCorrectPosition
                    ? 'bg-emerald-400 border-emerald-600 text-white ring-2 ring-emerald-300'
                    : isTarget
                    ? 'bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300'
                    : 'bg-white border-amber-300 text-slate-700 hover:bg-amber-50'
                } ${isHint ? 'ring-4 ring-purple-500 scale-105 animate-bounce' : ''}`}
              >
                {!isEmpty && (
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
            );
          })}
        </div>
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
