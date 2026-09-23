import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Trophy, X, Medal, Filter, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { LeaderboardRecord, PlayerProfile, GAME_LEVELS } from '../types/game';
import { soundManager } from '../lib/sound';

interface LeaderboardModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  player,
  isOpen,
  onClose,
}) => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number>(0); // 0 = All levels
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  // Auto-clean any legacy 2x2 and legacy Level 2 (3x3) records from Firestore
  const cleanLegacyRecordsFromFirestore = async () => {
    try {
      setIsCleaning(true);
      const path = 'leaderboard';
      
      // Query 1: gridSize == 2
      const q1 = query(collection(db, path), where('gridSize', '==', 2));
      const snap1 = await getDocs(q1);

      // Query 2: level == 2 AND gridSize == 3
      const q2 = query(collection(db, path), where('level', '==', 2), where('gridSize', '==', 3));
      const snap2 = await getDocs(q2);

      const deletePromises: Promise<void>[] = [];
      snap1.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, path, docSnap.id)).catch(() => {}));
      });
      snap2.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, path, docSnap.id)).catch(() => {}));
      });

      if (deletePromises.length > 0) {
        await Promise.allSettled(deletePromises);
      }
    } catch {
      // Silently ignore if user is unauthenticated or rules restrict bulk delete
    } finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Run legacy cleanup whenever leaderboard opens
    cleanLegacyRecordsFromFirestore();

    setIsLoading(true);
    const path = 'leaderboard';

    try {
      let q;
      if (selectedLevelFilter === 0) {
        q = query(collection(db, path), orderBy('score', 'desc'), limit(50));
      } else {
        q = query(
          collection(db, path),
          where('level', '==', selectedLevelFilter),
          orderBy('score', 'desc'),
          limit(30)
        );
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: LeaderboardRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const recLevel = data.level || 1;
            const gSize = data.gridSize || 4;

            const isLegacy2x2 = gSize <= 2;
            const isLegacyLvl2_3x3 = recLevel === 2 && gSize === 3;

            // Exclude old 2x2 records and old Level 2 (3x3) records
            if (!isLegacy2x2 && !isLegacyLvl2_3x3) {
              list.push({
                id: docSnap.id,
                userId: data.userId || '',
                playerName: data.playerName || 'Pemain Cilik',
                playerAvatar: data.playerAvatar || '🐰',
                level: recLevel,
                gridSize: gSize,
                score: data.score || 0,
                moves: data.moves || 0,
                timeSeconds: data.timeSeconds || 0,
                createdAt: data.createdAt || '',
              });
            }
          });
          setRecords(list);
          setIsLoading(false);
        },
        (error) => {
          setIsLoading(false);
          handleFirestoreError(error, OperationType.GET, path);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching leaderboard:', error);
    }
  }, [isOpen, selectedLevelFilter]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-50 border-4 border-amber-500 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-amber-400 p-4 border-b-4 border-amber-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-900" />
            <h2 className="text-xl font-black text-amber-950">
              Papan Peringkat Global
            </h2>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-9 h-9 bg-amber-100 hover:bg-white border-2 border-amber-600 rounded-full flex items-center justify-center text-amber-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Filter Bar */}
        <div className="bg-amber-200/80 p-3 border-b-2 border-amber-300 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-1 text-xs font-black text-amber-900 shrink-0 pr-1">
            <Filter className="w-3.5 h-3.5" /> Filter Level:
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedLevelFilter(0);
            }}
            className={`px-3 py-1 rounded-full text-xs font-black shrink-0 transition-all border ${
              selectedLevelFilter === 0
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            Semua Level
          </button>
          {GAME_LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => {
                soundManager.playClick();
                setSelectedLevelFilter(lvl.id);
              }}
              className={`px-3 py-1 rounded-full text-xs font-black shrink-0 transition-all border ${
                selectedLevelFilter === lvl.id
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              Lvl {lvl.id} ({lvl.gridSize}x{lvl.gridSize})
            </button>
          ))}
        </div>

        {/* Leaderboard Table Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <p className="text-sm font-extrabold text-amber-900">
                Memuat Rekor Tertinggi...
              </p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <span className="text-4xl">🌟</span>
              <p className="text-base font-black text-amber-950">
                Belum ada rekor untuk filter ini!
              </p>
              <p className="text-xs font-bold text-amber-800">
                Jadilah pemain pertama yang mencatatkan rekor terbaikmu di sini!
              </p>
            </div>
          ) : (
            records.map((rec, index) => {
              const rank = index + 1;
              const isCurrentPlayer = rec.userId === player.uid;

              let rankBadge = (
                <span className="font-black text-xs text-amber-900 w-6 text-center">
                  #{rank}
                </span>
              );

              if (rank === 1) {
                rankBadge = <span className="text-xl">🥇</span>;
              } else if (rank === 2) {
                rankBadge = <span className="text-xl">🥈</span>;
              } else if (rank === 3) {
                rankBadge = <span className="text-xl">🥉</span>;
              }

              return (
                <div
                  key={rec.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                    isCurrentPlayer
                      ? 'bg-amber-200 border-amber-600 ring-2 ring-amber-400 font-extrabold'
                      : rank <= 3
                      ? 'bg-white border-amber-400 shadow-xs'
                      : 'bg-white/80 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {rankBadge}
                    </div>
                    <span className="text-2xl shrink-0">{rec.playerAvatar}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1">
                        {rec.playerName}
                        {isCurrentPlayer && (
                          <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Kamu
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-amber-800">
                        Level {rec.level} ({rec.gridSize}x{rec.gridSize}) • {rec.moves} langkah • {formatTime(rec.timeSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-emerald-600">
                      {rec.score} Poin
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-amber-100 p-3 border-t-2 border-amber-300 text-center text-xs font-bold text-amber-900 shrink-0">
          ✨ Skor diperbarui secara otomatis dan tersimpan secara online di Firebase!
        </div>
      </div>
    </div>
  );
};
