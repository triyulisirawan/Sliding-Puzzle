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
  deleteDoc,
} from 'firebase/firestore';
import {
  Users,
  Copy,
  Check,
  Zap,
  Bot,
  ArrowLeft,
  Sparkles,
  Timer,
  Footprints,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GAME_LEVELS, GameLevelConfig, PlayerProfile, TileItem } from '../types/game';
import {
  generateSolvableBoard,
  getMovableTileIndices,
  checkVictoryCondition,
  calculateProgressPercentage,
} from '../utils/puzzle';
import { soundManager } from '../lib/sound';

interface MultiplayerViewProps {
  player: PlayerProfile;
  onBack: () => void;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({ player, onBack }) => {
  const [viewState, setViewState] = useState<'lobby' | 'creating' | 'joining' | 'matchmaking' | 'playing'>('lobby');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<GameLevelConfig>(GAME_LEVELS[0]);

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

  // Matchmaking Timer
  const [queueTimer, setQueueTimer] = useState(0);
  const matchmakingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to Firestore Room Changes
  useEffect(() => {
    if (!roomId) return;
    const path = `multiplayer_rooms/${roomId}`;

    const unsubscribe = onSnapshot(
      doc(db, path),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoomData(data);

          // Sync current level from room data
          const roomLvl = GAME_LEVELS.find((l) => l.id === data.level) || GAME_LEVELS[0];
          setSelectedLevel(roomLvl);

          // Populate board if board is currently empty and initialBoard exists
          if (data.initialBoard) {
            try {
              const values: number[] = JSON.parse(data.initialBoard);
              setBoard((prevBoard) => {
                if (prevBoard.length > 0) return prevBoard; // keep existing board if active
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
          // Bot increments progress realistically every 2-3 seconds
          const inc = Math.floor(Math.random() * 15) + 10;
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

  // Create Room
  const handleCreateRoom = async () => {
    soundManager.playClick();
    const code = generateRoomCode();
    const newRoomId = `room_${Date.now()}`;
    const initialTiles = generateSolvableBoard(selectedLevel, 60);
    const tileValues = initialTiles.map((t) => t.value);

    const roomPayload = {
      roomCode: code,
      status: 'waiting',
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

  // Join Room by Code
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

      if (data.status !== 'waiting') {
        alert('Ruang ini sudah penuh atau permainan telah dimulai.');
        return;
      }

      // Sync level & parse initial board for guest
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

      // Update Guest & set room status to playing
      await updateDoc(doc(db, 'multiplayer_rooms', roomDoc.id), {
        guestId: player.uid,
        guestName: player.displayName,
        guestAvatar: player.avatar,
        status: 'playing',
      });

      setRoomId(roomDoc.id);
      setIsHost(false);
      setViewState('playing');
    } catch (err) {
      console.error('Error joining room:', err);
    }
  };

  // Quick Online Matchmaking
  const handleStartMatchmaking = async () => {
    soundManager.playClick();
    setViewState('matchmaking');
    setQueueTimer(0);

    const queueId = `queue_${player.uid}`;
    try {
      await setDoc(doc(db, 'matchmaking_queue', queueId), {
        userId: player.uid,
        playerName: player.displayName,
        playerAvatar: player.avatar,
        level: selectedLevel.id,
        status: 'waiting',
        createdAt: new Date().toISOString(),
      });

      // Search for waiting opponents
      const q = query(
        collection(db, 'matchmaking_queue'),
        where('status', '==', 'waiting')
      );
      const snap = await getDocs(q);

      const waitingOpponent = snap.docs.find((d) => d.data().userId !== player.uid);

      if (waitingOpponent) {
        // Found real opponent!
        const oppData = waitingOpponent.data();
        const code = generateRoomCode();
        const newRoomId = `room_${Date.now()}`;
        const initialTiles = generateSolvableBoard(selectedLevel, 60);

        await setDoc(doc(db, 'multiplayer_rooms', newRoomId), {
          roomCode: code,
          status: 'playing',
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
          guestId: oppData.userId,
          guestName: oppData.playerName,
          guestAvatar: oppData.playerAvatar,
          guestProgress: 0,
          guestMoves: 0,
          guestTime: 0,
          guestFinished: false,
          isBotMatch: false,
          winnerId: '',
          createdAt: new Date().toISOString(),
        });

        // Clean up queue
        await deleteDoc(doc(db, 'matchmaking_queue', queueId));

        setRoomId(newRoomId);
        setIsHost(true);
        setBoard(initialTiles);
        setViewState('playing');
        return;
      }

      // Start 8-second countdown timer to spawn AI Bot if no real player joins
      matchmakingIntervalRef.current = setInterval(() => {
        setQueueTimer((prev) => {
          if (prev >= 8) {
            if (matchmakingIntervalRef.current) clearInterval(matchmakingIntervalRef.current);
            spawnBotMatch();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Matchmaking error:', err);
    }
  };

  // Spawn Bot Match Fallback
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

  // Handle Tile Click in Multiplayer
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

      const newMoves = moves + 1;
      const newProgress = calculateProgressPercentage(updatedBoard, selectedLevel.targetNumbersCount);
      const isWin = checkVictoryCondition(updatedBoard, selectedLevel.targetNumbersCount);

      setBoard(updatedBoard);
      setMoves(newMoves);

      if (isWin) {
        setIsFinished(true);
        soundManager.playWin();
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

  // Render Opponent Data
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Top Header */}
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
          <Users className="w-5 h-5 text-sky-600" /> Mode Multiplayer Online
        </h2>

        <div className="w-20" />
      </div>

      {/* Lobby View */}
      {viewState === 'lobby' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-400 border-2 border-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                🏠
              </div>
              <h3 className="text-xl font-black text-amber-950">
                Buat Ruang (Main Saja)
              </h3>
              <p className="text-xs font-bold text-amber-900/90 leading-relaxed">
                Buat ruang permainan baru dan bagikan kode 5-digit ke temanmu untuk bertanding langsung!
              </p>

              {/* Level Selector */}
              <div className="space-y-1.5 pt-2">
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
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-b-4 border-emerald-700 text-white font-black text-base py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Buat Ruang Sekarang
            </button>
          </div>

          {/* Join / Matchmaking Card */}
          <div className="bg-sky-100 border-4 border-sky-500 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sky-400 border-2 border-sky-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                ⚡
              </div>
              <h3 className="text-xl font-black text-sky-950">
                Gabung atau Cari Lawan
              </h3>

              {/* Join Code Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-sky-950 block">Masukkan Kode Ruang Teman:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: TK882"
                    className="flex-1 bg-white border-2 border-sky-300 focus:border-sky-500 rounded-xl px-3 py-2 font-black uppercase text-sky-950 tracking-wider text-base outline-none"
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="bg-sky-500 hover:bg-sky-400 active:scale-95 border-b-4 border-sky-700 text-white font-black px-4 py-2 rounded-xl text-sm shadow-sm"
                  >
                    Gabung
                  </button>
                </div>
              </div>

              <div className="relative border-t-2 border-sky-200 my-3 text-center">
                <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-2 relative -top-2.5">
                  ATAU
                </span>
              </div>

              {/* Matchmaking Button */}
              <button
                onClick={handleStartMatchmaking}
                className="w-full bg-purple-500 hover:bg-purple-400 active:scale-95 border-b-4 border-purple-700 text-white font-black text-base py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 text-yellow-300" /> Cari Lawan Acak Online
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creating Waiting Room State */}
      {viewState === 'creating' && (
        <div className="bg-amber-100 border-4 border-amber-500 rounded-3xl p-8 text-center space-y-6 max-w-lg mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-amber-400 border-4 border-amber-600 rounded-full flex items-center justify-center text-4xl mx-auto animate-pulse">
            🏠
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-amber-950">
              Ruang Tandingan Siap!
            </h3>
            <p className="text-xs font-bold text-amber-800">
              Bagikan kode berikut kepada temanmu agar bisa bergabung:
            </p>
          </div>

          {/* Room Code Display Box */}
          <div className="bg-white border-3 border-amber-400 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <span className="text-3xl sm:text-4xl font-black tracking-widest text-amber-950">
              {roomData?.roomCode}
            </span>
            <button
              onClick={copyRoomCode}
              className="bg-amber-400 hover:bg-amber-300 border-2 border-amber-600 font-black px-3 py-1.5 rounded-xl text-xs text-amber-950 flex items-center gap-1.5 shadow-xs"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Tersalin!' : 'Salin Kode'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-900 bg-amber-200/80 rounded-xl p-3 border border-amber-300">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            Menunggu teman masuk ke ruang...
          </div>

          <button
            onClick={spawnBotMatch}
            className="bg-sky-500 hover:bg-sky-400 border-b-4 border-sky-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Bot className="w-4 h-4" /> Teman belum ada? Tantang Bot AI!
          </button>
        </div>
      )}

      {/* Matchmaking Searching State */}
      {viewState === 'matchmaking' && (
        <div className="bg-purple-100 border-4 border-purple-500 rounded-3xl p-8 text-center space-y-6 max-w-lg mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-purple-400 border-4 border-purple-600 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">
            ⚡
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-purple-950">
              Mencari Lawan Online...
            </h3>
            <p className="text-xs font-bold text-purple-800">
              Sistem sedang menghubungkanmu dengan pemain lain ({queueTimer}s)
            </p>
          </div>

          <button
            onClick={spawnBotMatch}
            className="bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 text-white font-black px-5 py-3 rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Bot className="w-5 h-5" /> Main Sekarang Lawan Bot AI 🤖
          </button>
        </div>
      )}

      {/* Active Multiplayer Playing State */}
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

          {/* Puzzle Board Container */}
          <div className="bg-amber-200/80 border-4 border-amber-600 rounded-3xl p-4 shadow-xl max-w-xl mx-auto flex justify-center">
            {board.length === 0 ? (
              <div className="text-center p-8 text-amber-950 font-black">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Menyiapkan Papan Permainan...
              </div>
            ) : (
              <div
                className="grid gap-2 sm:gap-3 w-full"
                style={{
                  gridTemplateColumns: `repeat(${currentGridSize}, minmax(0, 1fr))`,
                  maxWidth: currentGridSize === 2 ? '280px' : currentGridSize === 3 ? '340px' : '100%',
                }}
              >
                {board.map((tile, idx) => {
                  const isEmpty = tile.value === 0;
                  const isTarget = tile.isTargetNumber;
                  const isCorrectPosition = isTarget && idx === tile.value - 1;

                  const fontSizeClass =
                    currentGridSize === 2
                      ? 'text-3xl sm:text-5xl font-black'
                      : currentGridSize === 3
                      ? 'text-xl sm:text-3xl font-black'
                      : 'text-lg sm:text-2xl font-black';

                  return (
                    <button
                      key={tile.id || `mp-tile-${idx}`}
                      disabled={isEmpty || isFinished}
                      onClick={() => handleTileClick(idx)}
                      className={`relative aspect-square rounded-2xl border-3 sm:border-4 flex items-center justify-center font-black transition-all transform active:scale-95 shadow-md ${fontSizeClass} ${
                        isEmpty
                          ? 'bg-amber-300/40 border-amber-400/50 shadow-inner'
                          : isCorrectPosition
                          ? 'bg-emerald-400 border-emerald-600 text-white ring-2 ring-emerald-300'
                          : isTarget
                          ? 'bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300'
                          : 'bg-white border-amber-300 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      {!isEmpty && tile.value}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Chat Reaction Buttons */}
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

          {/* Victory / Defeat Overlay Banner */}
          {(isFinished || roomData?.status === 'finished') && (
            <div className="bg-amber-400 border-4 border-amber-600 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fade-in">
              <span className="text-5xl">
                {roomData?.winnerId === player.uid ? '🏆' : '👏'}
              </span>
              <h3 className="text-2xl font-black text-amber-950">
                {roomData?.winnerId === player.uid
                  ? 'Selamat! Kamu Menang Tandingan ini! 🎉'
                  : `Hebat! ${opponent.name} Menang Pertandingan!`}
              </h3>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setViewState('lobby');
                    setIsFinished(false);
                    setBoard([]);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 text-white font-black px-5 py-2.5 rounded-2xl text-sm shadow-md"
                >
                  Main Lagi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
