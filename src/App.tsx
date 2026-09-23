import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, ensureAuth, handleFirestoreError, OperationType } from './lib/firebase';
import { Header } from './components/Header';
import { LevelSelector } from './components/LevelSelector';
import { GameBoard } from './components/GameBoard';
import { VictoryModal } from './components/VictoryModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AvatarSelectorModal } from './components/AvatarSelectorModal';
import { NameRegistrationModal } from './components/NameRegistrationModal';
import { MultiplayerView } from './components/MultiplayerView';
import { HowToPlayModal } from './components/HowToPlayModal';
import { YouTubeMusicModal } from './components/YouTubeMusicModal';
import { YouTubePlayerEngine } from './components/YouTubePlayerEngine';
import { GAME_LEVELS, GameLevelConfig, PlayerProfile } from './types/game';
import { calculateStarsAndScore } from './utils/puzzle';
import { soundManager } from './lib/sound';

export default function App() {
  // Player state
  const [player, setPlayer] = useState<PlayerProfile>({
    uid: 'guest_local',
    displayName: 'Pemain Cilik',
    avatar: '🐰',
    highestLevelUnlocked: 7, // All levels unlocked
    totalStars: 0,
    totalScore: 0,
    isNameCustomized: false,
  });

  // Sound & View state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeView, setActiveView] = useState<'levels' | 'playing' | 'multiplayer'>('levels');
  const [currentLevel, setCurrentLevel] = useState<GameLevelConfig>(GAME_LEVELS[0]);

  // YouTube Background Music State
  const [youtubeUrl, setYoutubeUrl] = useState<string>(() => {
    return localStorage.getItem('guru_yt_music_url') || 'https://www.youtube.com/watch?v=5qap5aO4i9A';
  });
  const [isYouTubePlaying, setIsYouTubePlaying] = useState<boolean>(false);
  const [youtubeVolume, setYoutubeVolume] = useState<number>(80);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);

  // Stars per level
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});

  // Pending action when name registration is required
  const [pendingAction, setPendingAction] = useState<{
    type: 'level' | 'multiplayer';
    level?: GameLevelConfig;
  } | null>(null);

  // Victory result state
  const [lastGameStats, setLastGameStats] = useState<{ moves: number; timeSeconds: number } | null>(null);

  // Modals state
  const [isNameRegModalOpen, setIsNameRegModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);

  // Save YouTube URL to localStorage
  useEffect(() => {
    if (youtubeUrl) {
      localStorage.setItem('guru_yt_music_url', youtubeUrl);
    }
  }, [youtubeUrl]);

  // Initialize Firebase Auth & Load Profile
  useEffect(() => {
    ensureAuth()
      .then(async (user) => {
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            const isCustomized = data.isNameCustomized || (data.displayName && data.displayName !== 'Pemain Cilik');
            setPlayer((prev) => ({
              ...prev,
              uid: user.uid,
              displayName: data.displayName || prev.displayName,
              avatar: data.avatar || prev.avatar,
              highestLevelUnlocked: 7, // all levels unlocked
              totalStars: data.totalStars || prev.totalStars,
              totalScore: data.totalScore || prev.totalScore,
              isNameCustomized: isCustomized,
            }));
          } else {
            // Create user profile in Firestore
            await setDoc(userRef, {
              uid: user.uid,
              displayName: player.displayName,
              avatar: player.avatar,
              highestLevel: 7,
              totalStars: 0,
              totalScore: 0,
              isNameCustomized: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setPlayer((prev) => ({ ...prev, uid: user.uid }));
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setPlayer((prev) => ({ ...prev, uid: user.uid }));
        }
      })
      .catch((err) => {
        console.error('Auth initialization caught:', err);
      });
  }, []);

  // Save updated profile
  const handleSaveProfile = async (newAvatar: string, newName: string) => {
    const isCustom = newName !== 'Pemain Cilik' && newName.trim().length > 0;
    setPlayer((prev) => ({
      ...prev,
      avatar: newAvatar,
      displayName: newName,
      isNameCustomized: isCustom,
    }));

    if (player.uid) {
      try {
        await setDoc(
          doc(db, 'users', player.uid),
          {
            displayName: newName,
            avatar: newAvatar,
            isNameCustomized: isCustom,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error saving profile:', err);
      }
    }
  };

  // Handle name registration submission before starting game
  const handleNameRegistrationSubmit = async (newName: string, avatar: string) => {
    await handleSaveProfile(avatar, newName);
    setIsNameRegModalOpen(false);

    // Proceed to pending target
    if (pendingAction) {
      if (pendingAction.type === 'level' && pendingAction.level) {
        setCurrentLevel(pendingAction.level);
        setActiveView('playing');
      } else if (pendingAction.type === 'multiplayer') {
        setActiveView('multiplayer');
      }
      setPendingAction(null);
    }
  };

  // Check if player name is registered before starting game
  const handleLevelSelectRequest = (level: GameLevelConfig) => {
    if (!player.isNameCustomized || player.displayName === 'Pemain Cilik') {
      setPendingAction({ type: 'level', level });
      setIsNameRegModalOpen(true);
    } else {
      setCurrentLevel(level);
      setActiveView('playing');
    }
  };

  const handleMultiplayerRequest = () => {
    if (!player.isNameCustomized || player.displayName === 'Pemain Cilik') {
      setPendingAction({ type: 'multiplayer' });
      setIsNameRegModalOpen(true);
    } else {
      setActiveView('multiplayer');
    }
  };

  // Handle victory in single player game
  const handleGameVictory = async (moves: number, timeSeconds: number) => {
    setLastGameStats({ moves, timeSeconds });

    const { stars, score } = calculateStarsAndScore(currentLevel, moves, timeSeconds);

    // Update level stars
    const currentStarsForLevel = levelStars[currentLevel.id] || 0;
    const newStarsForLevel = Math.max(currentStarsForLevel, stars);

    const updatedLevelStars = {
      ...levelStars,
      [currentLevel.id]: newStarsForLevel,
    };
    setLevelStars(updatedLevelStars);

    // Calculate total stars across levels
    const totalStarsCount = Object.values(updatedLevelStars).reduce((a, b) => a + b, 0);

    const newTotalScore = player.totalScore + score;

    setPlayer((prev) => ({
      ...prev,
      totalStars: totalStarsCount,
      totalScore: newTotalScore,
    }));

    setIsVictoryModalOpen(true);

    // Save score to global leaderboard in Firebase
    if (player.uid) {
      const path = 'leaderboard';
      try {
        await addDoc(collection(db, path), {
          userId: player.uid,
          playerName: player.displayName,
          playerAvatar: player.avatar,
          level: currentLevel.id,
          gridSize: currentLevel.gridSize,
          score: score,
          moves: moves,
          timeSeconds: timeSeconds,
          createdAt: new Date().toISOString(),
        });

        // Update user stats in users collection
        await setDoc(
          doc(db, 'users', player.uid),
          {
            totalStars: totalStarsCount,
            totalScore: newTotalScore,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const handleNextLevel = () => {
    setIsVictoryModalOpen(false);
    const nextLvl = GAME_LEVELS.find((l) => l.id === currentLevel.id + 1);
    if (nextLvl) {
      setCurrentLevel(nextLvl);
      setActiveView('playing');
    } else {
      setActiveView('levels');
    }
  };

  const handleReplayLevel = () => {
    setIsVictoryModalOpen(false);
    setActiveView('playing');
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-800 font-['Fredoka',sans-serif] flex flex-col pb-12">
      {/* Top Navigation Header */}
      <Header
        player={player}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundManager.enabled = !soundEnabled;
          setSoundEnabled(!soundEnabled);
        }}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenMultiplayer={handleMultiplayerRequest}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenYouTubeMusic={() => setIsYouTubeModalOpen(true)}
        onGoHome={() => setActiveView('levels')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full pt-2">
        {activeView === 'levels' && (
          <LevelSelector
            player={player}
            levelStars={levelStars}
            onSelectLevel={handleLevelSelectRequest}
            onOpenMultiplayer={handleMultiplayerRequest}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        )}

        {activeView === 'playing' && (
          <GameBoard
            level={currentLevel}
            player={player}
            onVictory={handleGameVictory}
            onBackToLevels={() => setActiveView('levels')}
          />
        )}

        {activeView === 'multiplayer' && (
          <MultiplayerView
            player={player}
            onBack={() => setActiveView('levels')}
          />
        )}
      </main>

      {/* Background YouTube Music Engine & Mini Floating Widget */}
      <YouTubePlayerEngine
        youtubeUrl={youtubeUrl}
        isPlaying={isYouTubePlaying}
        setIsPlaying={setIsYouTubePlaying}
        onOpenModal={() => setIsYouTubeModalOpen(true)}
      />

      {/* YouTube Music Selection Modal */}
      <YouTubeMusicModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        youtubeUrl={youtubeUrl}
        setYoutubeUrl={setYoutubeUrl}
        isPlaying={isYouTubePlaying}
        setIsPlaying={setIsYouTubePlaying}
        volume={youtubeVolume}
        setVolume={setYoutubeVolume}
      />

      {/* Mandatory Name Registration Modal */}
      <NameRegistrationModal
        isOpen={isNameRegModalOpen}
        player={player}
        onSubmitName={handleNameRegistrationSubmit}
        onCancel={() => {
          setIsNameRegModalOpen(false);
          setPendingAction(null);
        }}
      />

      {/* Modals */}
      <AvatarSelectorModal
        player={player}
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={handleSaveProfile}
      />

      <LeaderboardModal
        player={player}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {lastGameStats && (
        <VictoryModal
          level={currentLevel}
          moves={lastGameStats.moves}
          timeSeconds={lastGameStats.timeSeconds}
          player={player}
          isOpen={isVictoryModalOpen}
          onNextLevel={handleNextLevel}
          onReplay={handleReplayLevel}
          onViewLeaderboard={() => {
            setIsVictoryModalOpen(false);
            setIsLeaderboardOpen(true);
          }}
        />
      )}
    </div>
  );
}
