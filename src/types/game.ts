export interface GameLevelConfig {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  gridSize: number; // e.g. 2 for 2x2, 3 for 3x3, 4 for 4x4
  targetNumbersCount: number; // e.g. 3 for 2x2, 8 for 3x3, 15 for 4x4
  themeColor: string;
  cardBg: string;
  borderBg: string;
  minMovesFor3Stars: number;
  targetTimeSeconds: number;
  unlockedByDefault?: boolean;
}

export interface TileItem {
  id: string; // unique ID for key animations
  value: number; // 0 represents empty space, 1..N represent number tiles
  correctIndex: number; // expected position index (0-based) for this tile value
  isTargetNumber: boolean; // whether this number is part of the level's target sequence
}

export interface PlayerProfile {
  uid: string;
  displayName: string;
  avatar: string;
  highestLevelUnlocked: number;
  totalStars: number;
  totalScore: number;
  isNameCustomized?: boolean; // track if player has typed their own name
}

export interface LeaderboardRecord {
  id: string;
  userId: string;
  playerName: string;
  playerAvatar: string;
  level: number;
  gridSize: number;
  score: number;
  moves: number;
  timeSeconds: number;
  createdAt: string;
}

export interface MultiplayerPlayerState {
  id: string;
  name: string;
  avatar: string;
  progressPercent: number;
  moves: number;
  timeSeconds: number;
  isFinished: boolean;
  tilesSummary?: number[];
}

export interface MultiplayerRoomState {
  id: string;
  roomCode: string;
  status: 'waiting' | 'playing' | 'finished';
  level: number;
  gridSize: number;
  maxNumber: number;
  initialBoard: string; // JSON stringified tile numbers array
  host: MultiplayerPlayerState;
  guest?: MultiplayerPlayerState;
  isBotMatch?: boolean;
  winnerId?: string;
  createdAt: string;
}

export const AVATARS = [
  { id: 'rabbit', emoji: '🐰', name: 'Kelinci Ceria', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'cat', emoji: '🐱', name: 'Kucing Imut', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'bear', emoji: '🐻', name: 'Beruang Pintar', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'lion', emoji: '🦁', name: 'Singa Berani', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'dino', emoji: '🦖', name: 'Dino Jagoan', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { id: 'panda', emoji: '🐼', name: 'Panda Lucu', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'fox', emoji: '🦊', name: 'Rubah Cerdas', color: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'elephant', emoji: '🐘', name: 'Gajah Cerdik', color: 'bg-blue-100 text-blue-700 border-blue-300' },
];

export const GAME_LEVELS: GameLevelConfig[] = [
  {
    id: 1,
    title: 'Level 1: Urutkan 1, 2, 3',
    subtitle: 'Kotak 2x2 Pemula (Urutkan 1, 2, 3)',
    badge: '🌱 Pemula 2x2',
    gridSize: 2, // 2x2 grid (4 cells total: 1, 2, 3 + empty slot)
    targetNumbersCount: 3,
    themeColor: 'from-emerald-400 to-teal-500',
    cardBg: 'bg-emerald-50 border-emerald-200',
    borderBg: 'border-emerald-400',
    minMovesFor3Stars: 6,
    targetTimeSeconds: 30,
    unlockedByDefault: true,
  },
  {
    id: 2,
    title: 'Level 2: Urutkan 1 sampai 8',
    subtitle: 'Kotak 3x3 Klasik (Urutkan 1-8)',
    badge: '🧩 Klasik 3x3',
    gridSize: 3, // 3x3 grid (9 cells total: 1..8 + empty slot)
    targetNumbersCount: 8,
    themeColor: 'from-amber-400 to-orange-500',
    cardBg: 'bg-amber-50 border-amber-200',
    borderBg: 'border-amber-400',
    minMovesFor3Stars: 22,
    targetTimeSeconds: 60,
    unlockedByDefault: true,
  },
  {
    id: 3,
    title: 'Level 3: Urutkan 1 sampai 15',
    subtitle: 'Kotak 4x4 Tantangan (Urutkan 1-15)',
    badge: '🚀 Tantangan 4x4',
    gridSize: 4, // 4x4 grid (16 cells total: 1..15 + empty slot)
    targetNumbersCount: 15,
    themeColor: 'from-purple-400 to-indigo-500',
    cardBg: 'bg-purple-50 border-purple-200',
    borderBg: 'border-purple-400',
    minMovesFor3Stars: 45,
    targetTimeSeconds: 120,
    unlockedByDefault: true,
  },
];
