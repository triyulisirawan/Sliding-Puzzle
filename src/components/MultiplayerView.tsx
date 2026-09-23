import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import {
  Users,
  Copy,
  Check,
  Bot,
  ArrowLeft,
  Sparkles,
  Youtube,
  Play,
  RotateCcw,
  Monitor,
  Globe,
  Award,
  Crown,
  Clock,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GAME_LEVELS, GameLevelConfig, PlayerProfile, TileItem } from '../types/game';
import {
  generateSolvableBoard,
  getMovableTileIndices,
  checkVictoryCondition,
  calculateProgressPercentage,
  calculateStarsAndScore,
} from '../utils/puzzle';
import { soundManager } from '../lib/sound';
import { VictoryYouTubeAudio } from './VictoryYouTubeAudio';
import { IFPGameMode } from './IFPGameMode';

interface MultiplayerViewProps {
  player: PlayerProfile;
  onBack: () => void;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({ player, onBack }) => {
  // Mode selection: 'session' (Mode Sesi) vs 'ifp' (Mode IFP)
  const [multiplayerMode, setMultiplayerMode] = useState<'session' | 'ifp'>('session');

  // Mode Sesi Internal State
  const [viewState, setViewState] = useState<'lobby' | 'creating' | 'playing'>('lobby');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<GameLevelConfig>(GAME_LEVELS[0]);
  const [maxPlayers, setMaxPlayers] = useState<number>(4); // Max players setting for Mode Sesi

  // Active Room State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [isHost, setIsHost] = useState<boolean>(true);

  // Local Player Puzzle State
  const [board, setBoard] = useState<TileItem[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [chatReaction, setChatReaction] = useState<string | null>(null);
  const [isSavedToGlobal, setIsSavedToGlobal] = useState(false);

  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to Firestore Room Changes in Mode Sesi
  useEffect(() => {
    if (!roomId) return;
    const path = `multiplayer_rooms/${roomId}`;

    const unsubscribe = onSnapshot(
      doc(db, path),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoomData(data);

          // Sync level
          const roomLvl = GAME_LEVELS.find((l) => l.id === data.level) || GAME_LEVELS[0];
          setSelectedLevel(roomLvl);

          // Populate board if empty and initialBoard exists
          if (data.initialBoard) {
            try {
              const values: number[] = JSON.parse(data.initialBoard);
              setBoard((prevBoard) => {
                if (prevBoard.length > 0) return prevBoard;
                return values.map((v, idx) => ({
                  id: `mp-tile-${idx}-${v}`,
                  value: v,
                  correctIndex: v > 0 ? v - 1 : roomLvl.gridSize * roomLvl.gridSize - 1,
                  isTargetNumber: v >= 1 && v <= roomLvl.targetNumbersCount,
                }));
              });
            } catch (err) {
              console.error('Error parsing room board:', err);
            }
          }

          // If room status changes to playing, switch view state
          if (data.status === 'playing' && viewState !== 'playing') {
            setViewState('playing');
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [roomId, viewState]);

  // Timer Ticker during active game
  useEffect(() => {
    if (viewState === 'playing' && !isFinished && roomData?.status === 'playing') {
      const interval = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [viewState, isFinished, roomData?.status]);

  // AI Bot Opponent Progress Simulation
  useEffect(() => {
    if (viewState === 'playing' && roomData?.isBotMatch && roomData?.status === 'playing' && !isFinished) {
      botIntervalRef.current = setInterval(() => {
        setRoomData((prevRoom: any) => {
          if (!prevRoom) return prevRoom;
          const currentBotProg = prevRoom.guest?.progressPercent || 0;
          if (currentBotProg >= 100) {
            if (botIntervalRef.current) clearInterval(botIntervalRef.current);
            return prevRoom;
          }
          const inc = Math.floor(Math.random() * 12) + 8;
          const nextProg = Math.min(100, currentBotProg + inc);
          const botFinished = nextProg >= 100;

          return {
            ...prevRoom,
            guest: {
              ...prevRoom.guest,
              progressPercent: nextProg,
              moves: (prevRoom.guest?.moves || 0) + 1,
              isFinished: botFinished,
            },
            status: botFinished ? 'finished' : prevRoom.status,
            winnerId: botFinished ? prevRoom.guest.id : prevRoom.winnerId,
          };
        });
      }, 2500);

      return () => {
        if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      };
    }
  }, [viewState, roomData?.isBotMatch, roomData?.status, isFinished]);

  // Generate 5-digit Room Code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TK';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Mode Sesi: Create Room with Max Players
  const handleCreateRoom = async () => {
    soundManager.playClick();
    const code = generateRoomCode();
    const newRoomId = `room_${Date.now()}`;
    const initialTiles = generateSolvableBoard(selectedLevel, 60);
    const tileValues = initialTiles.map((t) => t.value);

    const roomPayload = {
      roomCode: code,
      status: 'waiting',
      maxPlayers: maxPlayers,
      level: selectedLevel.id,
      gridSize: selectedLevel.gridSize,
      maxNumber: selectedLevel.targetNumbersCount,
      initialBoard: JSON.stringify(tileValues),
      hostId: player.uid,
      hostName: player.displayName,
      hostAvatar: player.avatar,
      hostProgress: 0,
      hostMoves: 0,
      hostTime: 0,
      hostFinished: false,
      guestId: '',
      guestName: '',
      guestAvatar: '',
      guestProgress: 0,
      guestMoves: 0,
      guestTime: 0,
      guestFinished: false,
      isBotMatch: false,
      winnerId: '',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'multiplayer_rooms', newRoomId), roomPayload);
      setRoomId(newRoomId);
      setIsHost(true);
      setBoard(initialTiles);
      setViewState('creating');
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  // Host starts the match manually from Halaman Host
  const handleHostStartMatch = async () => {
    if (!roomId) return;
    soundManager.playClick();
    try {
      await updateDoc(doc(db, 'multiplayer_rooms', roomId), {
        status: 'playing',
      });
      setViewState('playing');
    } catch (err) {
      console.error('Error starting match as host:', err);
    }
  };

  // Mode Sesi: Join Room by Code
  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) return;
    soundManager.playClick();
    const code = roomCodeInput.trim().toUpperCase();

    try {
      const q = query(collection(db, 'multiplayer_rooms'), where('roomCode', '==', code));
      const snap = await getDocs(q);

      if (snap.empty) {
        alert('Kode ruang tidak ditemukan! Silakan periksa kembali.');
        return;
      }

      const roomDoc = snap.docs[0];
      const data = roomDoc.data();

      if (data.status === 'finished') {
        alert('Sesi pertandingan di ruang ini telah selesai.');
        return;
      }

      // Sync level & board
      const levelObj = GAME_LEVELS.find((l) => l.id === data.level) || GAME_LEVELS[0];
      setSelectedLevel(levelObj);

      if (data.initialBoard) {
        try {
          const values: number[] = JSON.parse(data.initialBoard);
          const parsed: TileItem[] = values.map((v, idx) => ({
            id: `mp-tile-${idx}-${v}`,
            value: v,
            correctIndex: v > 0 ? v - 1 : levelObj.gridSize * levelObj.gridSize - 1,
            isTargetNumber: v >= 1 && v <= levelObj.targetNumbersCount,
          }));
          setBoard(parsed);
        } catch (err) {
          console.error('Error parsing board on join:', err);
        }
      }

      // Join as Guest
      await updateDoc(doc(db, 'multiplayer_rooms', roomDoc.id), {
        guestId: player.uid,
        guestName: player.displayName,
        guestAvatar: player.avatar,
      });

      setRoomId(roomDoc.id);
      setIsHost(false);
      setViewState(data.status === 'playing' ? 'playing' : 'creating');
    } catch (err) {
      console.error('Error joining room:', err);
    }
  };

  // Spawn Bot Match Fallback for Host
  const spawnBotMatch = async () => {
    const bots = [
      { name: 'Dino Cerdas', avatar: '🦖' },
      { name: 'Kelinci Cepat', avatar: '🐰' },
      { name: 'Singa Tangkas', avatar: '🦁' },
      { name: 'Panda Pintar', avatar: '🐼' },
    ];
    const chosenBot = bots[Math.floor(Math.random() * bots.length)];

    const code = generateRoomCode();
    const newRoomId = `bot_room_${Date.now()}`;
    const initialTiles = generateSolvableBoard(selectedLevel, 60);

    const roomPayload = {
      roomCode: code,
      status: 'playing',
      maxPlayers: maxPlayers,
      level: selectedLevel.id,
      gridSize: selectedLevel.gridSize,
      maxNumber: selectedLevel.targetNumbersCount,
      initialBoard: JSON.stringify(initialTiles.map((t) => t.value)),
      hostId: player.uid,
      hostName: player.displayName,
      hostAvatar: player.avatar,
      hostProgress: 0,
      hostMoves: 0,
      hostTime: 0,
      hostFinished: false,
      guestId: 'bot_ai_001',
      guestName: chosenBot.name,
      guestAvatar: chosenBot.avatar,
      guestProgress: 0,
      guestMoves: 0,
      guestTime: 0,
      guestFinished: false,
      isBotMatch: true,
      winnerId: '',
      createdAt: new Date().toISOString(),
    };

    setRoomData(roomPayload);
    setRoomId(newRoomId);
    setIsHost(true);
    setBoard(initialTiles);
    setViewState('playing');
  };

  // Save Player Score to Global Leaderboard in Firestore
  const saveToGlobalLeaderboard = async (finalScore: number, finalMoves: number, finalSecs: number) => {
    if (isSavedToGlobal) return;
    try {
      setIsSavedToGlobal(true);
      await addDoc(collection(db, 'leaderboard'), {
        userId: player.uid,
        playerName: `${player.displayName} (Mode Sesi)`,
        playerAvatar: player.avatar,
        level: selectedLevel.id,
        gridSize: selectedLevel.gridSize,
        score: finalScore,
        moves: finalMoves,
        timeSeconds: finalSecs,
        createdAt: new Date().toISOString(),
      });
      console.log('Saved Session Mode score to Global Leaderboard');
    } catch (err) {
      console.error('Error saving session score to leaderboard:', err);
    }
  };

  // Handle Tile Click in Mode Sesi
  const handleTileClick = async (clickedIdx: number) => {
    if (isFinished || roomData?.status !== 'playing') return;

    const emptyIdx = board.findIndex((t) => t.value === 0);
    const movables = getMovableTileIndices(emptyIdx, selectedLevel.gridSize);

    if (movables.includes(clickedIdx)) {
      soundManager.playSlide();

      const updatedBoard = [...board];
      [updatedBoard[clickedIdx], updatedBoard[emptyIdx]] = [
        updatedBoard[emptyIdx],
        updatedBoard[clickedIdx],
      ];

      // Correct spot sound
      const movedTileValue = updatedBoard[emptyIdx].value;
      if (movedTileValue > 0 && movedTileValue <= selectedLevel.targetNumbersCount) {
        if (emptyIdx === movedTileValue - 1) {
          soundManager.playCorrectSpot();
        }
      }

      const newMoves = moves + 1;
      const newProgress = calculateProgressPercentage(updatedBoard, selectedLevel.targetNumbersCount);
      const isWin = checkVictoryCondition(updatedBoard, selectedLevel.targetNumbersCount);

      setBoard(updatedBoard);
      setMoves(newMoves);

      if (isWin) {
        setIsFinished(true);
        soundManager.playWin();

        const { score } = calculateStarsAndScore(selectedLevel, newMoves, timeSeconds);
        saveToGlobalLeaderboard(score, newMoves, timeSeconds);
      }

      // Sync progress to Firestore
      if (roomId && !roomData?.isBotMatch) {
        try {
          const updateObj: Record<string, any> = {};
          if (isHost) {
            updateObj.hostProgress = newProgress;
            updateObj.hostMoves = newMoves;
            updateObj.hostTime = timeSeconds;
            if (isWin) {
              updateObj.hostFinished = true;
              updateObj.status = 'finished';
              updateObj.winnerId = player.uid;
            }
          } else {
            updateObj.guestProgress = newProgress;
            updateObj.guestMoves = newMoves;
            updateObj.guestTime = timeSeconds;
            if (isWin) {
              updateObj.guestFinished = true;
              updateObj.status = 'finished';
              updateObj.winnerId = player.uid;
            }
          }
          await updateDoc(doc(db, 'multiplayer_rooms', roomId), updateObj);
        } catch (err) {
          console.error('Error updating move in room:', err);
        }
      }
    }
  };

  const copyRoomCode = () => {
    if (roomData?.roomCode) {
      navigator.clipboard.writeText(roomData.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getOpponentInfo = () => {
    if (isHost) {
      return {
        name: roomData?.guestName || 'Menunggu Lawan...',
        avatar: roomData?.guestAvatar || '❓',
        progress: roomData?.guestProgress || 0,
        moves: roomData?.guestMoves || 0,
        isFinished: roomData?.guestFinished || false,
      };
    } else {
      return {
        name: roomData?.hostName || 'Tuan Rumah',
        avatar: roomData?.hostAvatar || '🏠',
        progress: roomData?.hostProgress || 0,
        moves: roomData?.hostMoves || 0,
        isFinished: roomData?.hostFinished || false,
      };
    }
  };

  const opponent = getOpponentInfo();
  const myProgress = calculateProgressPercentage(board, selectedLevel.targetNumbersCount);
  const currentGridSize = roomData?.gridSize || selectedLevel.gridSize;
  const isGameFinished = isFinished || roomData?.status === 'finished';

  if (multiplayerMode === 'ifp') {
    return (
      <IFPGameMode
        currentUser={player}
        onBack={() => setMultiplayerMode('session')}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <VictoryYouTubeAudio isPlaying={isGameFinished} />

      {/* Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between bg-white border-3 border-amber-400 rounded-2xl p-3 shadow-md gap-2">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-amber-600 px-3 py-1.5 rounded-xl font-black text-amber-950 text-xs sm:text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        {/* Sub-mode Toggle Tabs */}
        <div className="flex items-center bg-amber-100 p-1 rounded-xl border border-amber-300">
          <button
            onClick={() => {
              soundManager.playClick();
              setMultiplayerMode('session');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all bg-amber-500 text-white shadow-xs"
          >
            <Globe className="w-4 h-4" /> Mode Sesi (Online)
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setMultiplayerMode('ifp');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all text-amber-950 hover:bg-amber-200"
          >
            <Monitor className="w-4 h-4" /> Mode IFP (Smartboard)
          </button>
        </div>

        <div className="hidden sm:block w-16" />
      </div>

      {/* Mode Sesi: Lobby View */}
      {viewState === 'lobby' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Host Session Card */}
          <div className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-400 border-2 border-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                🏠
              </div>
              <div>
                <h3 className="text-xl font-black text-amber-950">
                  Adakan Pertandingan (Host)
                </h3>
                <p className="text-xs font-bold text-amber-900/90 leading-relaxed mt-1">
                  Atur jumlah maksimal pemain, buat kode ruang otomatis, dan masuk ke Halaman Host untuk memimpin jalannya tandingan!
                </p>
              </div>

              {/* Max Players Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-amber-950 block">Maksimal Pemain Sesi:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2, 4, 6, 8].map((count) => (
                    <button
                      key={count}
                      onClick={() => setMaxPlayers(count)}
                      className={`py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                        maxPlayers === count
                          ? 'bg-amber-500 text-white border-amber-700 shadow-xs'
                          : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {count} Pemain
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-amber-950 block">Pilih Level Tandingan:</label>
                <select
                  value={selectedLevel.id}
                  onChange={(e) => {
                    const lvl = GAME_LEVELS.find((l) => l.id === Number(e.target.value));
                    if (lvl) setSelectedLevel(lvl);
                  }}
                  className="w-full bg-white border-2 border-amber-400 rounded-xl px-3 py-2 font-extrabold text-amber-950 text-sm outline-none"
                >
                  {GAME_LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.gridSize}x{l.gridSize})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-b-4 border-emerald-700 text-white font-black text-base py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-5 h-5" /> Buat Kode Ruang & Masuk Halaman Host
            </button>
          </div>

          {/* Join Session Card */}
          <div className="bg-sky-100 border-4 border-sky-500 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sky-400 border-2 border-sky-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                🔑
              </div>
              <div>
                <h3 className="text-xl font-black text-sky-950">
                  Gabung Sesi Pertandingan
                </h3>
                <p className="text-xs font-bold text-sky-900/90 leading-relaxed mt-1">
                  Masukkan kode ruang yang diberikan oleh Host untuk bergabung ke dalam sesi pertandingan online!
                </p>
              </div>

              {/* Join Code Input */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-sky-950 block">Masukkan Kode Ruang 5-Digit:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: TK882"
                    className="flex-1 bg-white border-2 border-sky-300 focus:border-sky-500 rounded-xl px-3 py-2.5 font-black uppercase text-sky-950 tracking-wider text-base outline-none"
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="bg-sky-500 hover:bg-sky-400 active:scale-95 border-b-4 border-sky-700 text-white font-black px-5 py-2.5 rounded-xl text-sm shadow-sm"
                  >
                    Gabung
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Sesi: Host Control Page & Waiting Room State */}
      {viewState === 'creating' && (
        <div className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-6 sm:p-8 text-center space-y-6 max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 bg-amber-400 border-4 border-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-md">
            👑
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-amber-950">
              {isHost ? 'Halaman Host Pertandingan' : 'Menunggu Host Memulai Pertandingan'}
            </h3>
            <p className="text-xs font-bold text-amber-800">
              Kode Ruang Otomatis Dibuat. Bagikan kode ini ke pemain lain:
            </p>
          </div>

          {/* Room Code Display Box */}
          <div className="bg-white border-3 border-amber-400 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div className="text-left">
              <span className="text-xs font-black text-amber-800 block">Kode Ruang:</span>
              <span className="text-2xl sm:text-3xl font-black tracking-widest text-amber-950">
                {roomData?.roomCode}
              </span>
            </div>
            <button
              onClick={copyRoomCode}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-amber-600 font-black px-3 py-1.5 rounded-xl text-xs text-amber-950 flex items-center gap-1.5 shadow-xs"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Tersalin!' : 'Salin Kode'}
            </button>
          </div>

          {/* Joined Players Status */}
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 space-y-2 text-left shadow-xs">
            <div className="text-xs font-black text-amber-950 flex items-center justify-between border-b pb-2">
              <span>Peserta Bergabung (Maks {roomData?.maxPlayers || maxPlayers} Pemain)</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">
                {roomData?.guestName ? '2 / 2 Siap' : '1 / 2 Bergabung'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-extrabold text-amber-900">
              <div className="flex items-center justify-between bg-amber-50 p-2 rounded-xl border border-amber-200">
                <span className="flex items-center gap-2">
                  <span>{player.avatar}</span> {player.displayName} (Host)
                </span>
                <span className="text-emerald-600 font-bold">Siap 👑</span>
              </div>

              <div className="flex items-center justify-between bg-amber-50 p-2 rounded-xl border border-amber-200">
                <span className="flex items-center gap-2">
                  <span>{roomData?.guestAvatar || '❓'}</span>{' '}
                  {roomData?.guestName || 'Menunggu Peserta Masuk...'}
                </span>
                <span className={roomData?.guestName ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {roomData?.guestName ? 'Bergabung' : 'Menunggu...'}
                </span>
              </div>
            </div>
          </div>

          {/* Host Action Controls */}
          {isHost ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={handleHostStartMatch}
                className="w-full bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 text-white font-black text-base py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> Mulai Pertandingan Sekarang
              </button>

              <button
                onClick={spawnBotMatch}
                className="bg-sky-500 hover:bg-sky-400 border-b-4 border-sky-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <Bot className="w-4 h-4" /> Tambahkan Bot AI
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-900 bg-amber-200/80 rounded-xl p-3 border border-amber-300">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              Menunggu Host menekan tombol Mulai Pertandingan...
            </div>
          )}
        </div>
      )}

      {/* Mode Sesi: Active Match Playing State */}
      {viewState === 'playing' && (
        <div className="space-y-5">
          {/* Status Header & Scoreboard */}
          <div className="grid grid-cols-2 gap-3">
            {/* My Status */}
            <div className="bg-emerald-100 border-3 border-emerald-500 rounded-2xl p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <span className="text-xl">{player.avatar}</span> {player.displayName} (Kamu)
                </span>
                <span className="text-emerald-700">{myProgress}%</span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-3 border border-emerald-400 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${myProgress}%` }}
                />
              </div>
              <div className="text-[11px] font-extrabold text-emerald-800 flex justify-between">
                <span>Langkah: {moves}</span>
                <span>Waktu: {timeSeconds}s</span>
              </div>
            </div>

            {/* Opponent Status */}
            <div className="bg-sky-100 border-3 border-sky-500 rounded-2xl p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-sky-950">
                <span className="flex items-center gap-1.5">
                  <span className="text-xl">{opponent.avatar}</span> {opponent.name}
                </span>
                <span className="text-sky-700">{opponent.progress}%</span>
              </div>
              <div className="w-full bg-sky-200 rounded-full h-3 border border-sky-400 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${opponent.progress}%` }}
                />
              </div>
              <div className="text-[11px] font-extrabold text-sky-800 flex justify-between">
                <span>Langkah: {opponent.moves}</span>
                <span>Status: {opponent.isFinished ? 'Selesai 🏁' : 'Bertanding ⚡'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Puzzle Board with Smooth Animated Sliding Tiles */}
          <div className="bg-amber-200/80 border-4 border-amber-600 rounded-3xl p-3 sm:p-4 shadow-xl max-w-xl mx-auto flex justify-center">
            {board.length === 0 ? (
              <div className="text-center p-8 text-amber-950 font-black">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Menyiapkan Papan Permainan...
              </div>
            ) : (
              <div
                className="relative aspect-square w-full"
                style={{
                  maxWidth: currentGridSize === 3 ? '340px' : currentGridSize === 4 ? '400px' : '440px',
                }}
              >
                {/* Static Background Grid Slots */}
                {Array.from({ length: currentGridSize * currentGridSize }).map((_, slotIdx) => {
                  const r = Math.floor(slotIdx / currentGridSize);
                  const c = slotIdx % currentGridSize;
                  const percent = 100 / currentGridSize;
                  return (
                    <div
                      key={`mp-slot-${r}-${c}`}
                      className="absolute p-1 sm:p-1.5"
                      style={{
                        width: `${percent}%`,
                        height: `${percent}%`,
                        left: `${c * percent}%`,
                        top: `${r * percent}%`,
                      }}
                    >
                      <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-amber-300/40 border-2 border-amber-400/50 shadow-inner" />
                    </div>
                  );
                })}

                {/* Interactive Sliding Tiles */}
                {board.map((tile, idx) => {
                  if (tile.value === 0) return null;

                  const row = Math.floor(idx / currentGridSize);
                  const col = idx % currentGridSize;
                  const percent = 100 / currentGridSize;
                  const isTarget = tile.isTargetNumber;
                  const isCorrectPosition = isTarget && idx === tile.value - 1;

                  const fontSizeClass =
                    currentGridSize === 3
                      ? 'text-xl sm:text-3xl font-black'
                      : currentGridSize === 4
                      ? 'text-lg sm:text-2xl font-black'
                      : 'text-base sm:text-xl font-black';

                  return (
                    <div
                      key={tile.id || `mp-tile-${tile.value}`}
                      className="absolute p-1 sm:p-1.5 tile-slide-transition"
                      style={{
                        width: `${percent}%`,
                        height: `${percent}%`,
                        left: `${col * percent}%`,
                        top: `${row * percent}%`,
                      }}
                    >
                      <button
                        disabled={isFinished}
                        onClick={() => handleTileClick(idx)}
                        className={`w-full h-full rounded-2xl sm:rounded-3xl border-3 sm:border-4 flex items-center justify-center font-black transition-transform duration-150 transform active:scale-95 shadow-md cursor-pointer ${fontSizeClass} ${
                          isCorrectPosition
                            ? 'bg-emerald-400 border-emerald-600 text-white ring-2 ring-emerald-300'
                            : isTarget
                            ? 'bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300'
                            : 'bg-white border-amber-300 text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        {tile.value}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Chat Reactions */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['Hebat! 👏', 'Ayo! 🚀', 'Hampir Selesai! ⭐', 'Haha! 😄'].map((msg) => (
              <button
                key={msg}
                onClick={() => {
                  soundManager.playClick();
                  setChatReaction(msg);
                  setTimeout(() => setChatReaction(null), 2500);
                }}
                className="bg-white hover:bg-amber-100 border-2 border-amber-400 rounded-xl px-2.5 py-1 text-xs font-black text-amber-950 shadow-xs active:scale-95"
              >
                {msg}
              </button>
            ))}
          </div>

          {chatReaction && (
            <div className="text-center text-xs font-black text-amber-950 bg-amber-300 border border-amber-500 rounded-xl p-2 max-w-xs mx-auto animate-bounce">
              💬 {player.displayName}: "{chatReaction}"
            </div>
          )}

          {/* Victory / Defeat Overlay Banner & Global Leaderboard Sync Notification */}
          {isGameFinished && (
            <div className="bg-amber-400 border-4 border-amber-600 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fade-in">
              <span className="text-5xl">
                {roomData?.winnerId === player.uid ? '🏆' : '👏'}
              </span>
              <h3 className="text-2xl font-black text-amber-950">
                {roomData?.winnerId === player.uid
                  ? 'Selamat! Kamu Menang Sesi Pertandingan ini! 🎉'
                  : `Hebat! ${opponent.name} Menang Pertandingan!`}
              </h3>

              <div className="bg-emerald-100 border-2 border-emerald-500 rounded-2xl p-2.5 text-xs font-black text-emerald-950 max-w-sm mx-auto shadow-inner">
                ✨ Poin pertandingan otomatis disimpan ke Papan Peringkat Global!
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setViewState('lobby');
                    setIsFinished(false);
                    setIsSavedToGlobal(false);
                    setBoard([]);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 text-white font-black px-5 py-2.5 rounded-2xl text-sm shadow-md"
                >
                  Main Sesi Lagi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
