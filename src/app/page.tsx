"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sparkles,
  Trophy,
  Play,
  RotateCcw,
  Square,
  Home,
  User,
  Clock,
  CheckCircle2,
  HelpCircle,
  Gamepad2,
} from "lucide-react";

// 과일 아이템 목록 (8종 -> 4x4 총 16장)
interface FruitItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgGlass: string;
}

const FRUITS: FruitItem[] = [
  { id: "apple", name: "사과", emoji: "🍎", color: "text-red-500", bgGlass: "bg-red-500/15 border-red-500/30" },
  { id: "banana", name: "바나나", emoji: "🍌", color: "text-amber-500", bgGlass: "bg-amber-500/15 border-amber-500/30" },
  { id: "grapes", name: "포도", emoji: "🍇", color: "text-purple-500", bgGlass: "bg-purple-500/15 border-purple-500/30" },
  { id: "watermelon", name: "수박", emoji: "🍉", color: "text-emerald-500", bgGlass: "bg-emerald-500/15 border-emerald-500/30" },
  { id: "strawberry", name: "딸기", emoji: "🍓", color: "text-rose-500", bgGlass: "bg-rose-500/15 border-rose-500/30" },
  { id: "orange", name: "오렌지", emoji: "🍊", color: "text-orange-500", bgGlass: "bg-orange-500/15 border-orange-500/30" },
  { id: "peach", name: "복숭아", emoji: "🍑", color: "text-pink-500", bgGlass: "bg-pink-500/15 border-pink-500/30" },
  { id: "pineapple", name: "파인애플", emoji: "🍍", color: "text-yellow-500", bgGlass: "bg-yellow-500/15 border-yellow-500/30" },
];

interface CardState {
  instanceId: number;
  fruit: FruitItem;
  isFlipped: boolean;
  isMatched: boolean;
}

interface RankingItem {
  rank: number;
  name: string;
  score: number;
  finishtime: string;
}

export default function MemoryGamePage() {
  // 화면 상태: "entry"(이름 입력 화면) | "playing"(게임 화면)
  const [gameState, setGameState] = useState<"entry" | "playing">("entry");
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");

  // 랭킹 데이터 상태
  const [top3Rankings, setTop3Rankings] = useState<RankingItem[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState<boolean>(false);

  // 게임 진행 상태
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]); // instanceId 배열 (최대 2장)
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [moves, setMoves] = useState<number>(0);

  // 시간 측정
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalTime, setFinalTime] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef<boolean>(false); // 중복 완료 및 중복 저장 방지용 ref

  // 카드 덱 생성 함수 (랜덤 셔플)

  const generateShuffledCards = useCallback((): CardState[] => {
    const deck: CardState[] = [];
    let idCounter = 0;

    // 8개 과일 * 2장 = 16장
    FRUITS.forEach((fruit) => {
      deck.push({
        instanceId: idCounter++,
        fruit,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        instanceId: idCounter++,
        fruit,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Fisher-Yates 셔플 알고리즘
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }, []);

  // 타이머 제어
  useEffect(() => {
    if (isGameActive && !isPaused && !isCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGameActive, isPaused, isCompleted]);

  // 초 포맷팅 함수
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) {
      return `${mins}분 ${secs < 10 ? `0${secs}` : secs}초`;
    }
    return `${secs}초`;
  };

  // 게임 시작 (이름 입력 완료 시)
  const handleStartGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) {
      alert("이름을 입력해주세요!");
      return;
    }
    setPlayerName(trimmed);
    setGameState("playing");
    initNewGame(true);
  };

  // 새로운 판 초기화
  const initNewGame = (autoStart: boolean = false) => {
    isCompletedRef.current = false;
    const newCards = generateShuffledCards();
    setCards(newCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setElapsedSeconds(0);
    setIsCompleted(false);
    setFinalTime("");
    setIsPaused(!autoStart);
    setIsGameActive(autoStart);
  };

  // 시작 / 계속하기
  const handlePlayOrResume = () => {
    if (!isGameActive) {
      setIsGameActive(true);
      setIsPaused(false);
    } else if (isPaused) {
      setIsPaused(false);
    }
  };

  // 일시 멈춤
  const handlePauseGame = () => {
    if (isGameActive && !isCompleted) {
      setIsPaused(true);
    }
  };

  // 다시 시작
  const handleRestart = () => {
    initNewGame(true);
  };

  // 처음으로 (이름 입력 화면으로 이동)
  const handleBackToEntry = () => {
    isCompletedRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsGameActive(false);
    setIsPaused(false);
    setIsCompleted(false);
    setGameState("entry");
  };


  // 카드 클릭 처리
  const handleCardClick = (clickedCard: CardState) => {
    if (!isGameActive || isPaused || isCompleted) return;
    if (clickedCard.isFlipped || clickedCard.isMatched) return;
    if (flippedCards.length >= 2) return;

    const newFlipped = [...flippedCards, clickedCard.instanceId];
    setFlippedCards(newFlipped);

    setCards((prev) =>
      prev.map((c) =>
        c.instanceId === clickedCard.instanceId ? { ...c, isFlipped: true } : c
      )
    );

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.instanceId === firstId);
      const secondCard = clickedCard;

      if (firstCard && firstCard.fruit.id === secondCard.fruit.id) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.instanceId === firstId || c.instanceId === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFlippedCards([]);
          setMatchedPairs((p) => {
            const nextPair = p + 1;
            if (nextPair === 8) {
              // React 18/19 StrictMode에서 상태 업데이터가 2번 실행되더라도 단 1회만 실행 보장
              if (!isCompletedRef.current) {
                isCompletedRef.current = true;
                setTimeout(() => {
                  handleGameComplete();
                }, 0);
              }
            }
            return nextPair;
          });
        }, 400);

      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.instanceId === firstId || c.instanceId === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  // 구글 앱스 스크립트 웹 앱 URL (환경 변수 또는 설정값)
  const GOOGLE_SCRIPT_URL =
    process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ||
    process.env.NEXT_PUBLIC_GAS_WEBAPP_URL ||
    "";
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // 상위 3명 랭킹 가져오기 함수
  const fetchTop3Rankings = useCallback(async () => {
    setIsLoadingRankings(true);
    try {
      const res = await fetch("/api/rankings");
      if (res.ok) {
        const data = await res.json();
        if (data.top3 && Array.isArray(data.top3)) {
          setTop3Rankings(data.top3);
        }
      }
    } catch (err) {
      console.error("랭킹 조회 실패:", err);
    } finally {
      setIsLoadingRankings(false);
    }
  }, []);

  // 구글 시트에 게임 결과 저장
  const saveResultToGoogleSheet = async (data: {
    name: string;
    score: number;
    finishtime: string;
  }) => {
    if (!GOOGLE_SCRIPT_URL) {
      console.log("구글 앱스 스크립트 URL(NEXT_PUBLIC_GOOGLE_SCRIPT_URL)이 설정되지 않아 로컬 기록만 완료되었습니다:", data);
      return;
    }

    setSaveStatus("saving");
    try {
      // 깔끔한 "YYYY-MM-DD HH:mm:ss" 형식의 타임스탬프 생성
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const kstTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const payload = {
        timestamp: kstTime,
        name: data.name,
        score: data.score,
        finishtime: data.finishtime,
      };

      // Google Apps Script에 데이터 전송
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      setSaveStatus("saved");

      // 저장 완료 후 구글 시트에 반영될 시간을 살짝 두고 최신 랭킹 조회
      setTimeout(() => {
        fetchTop3Rankings();
      }, 1000);
    } catch (err) {
      console.error("구글 시트 저장 실패:", err);
      setSaveStatus("error");
    }
  };


  // 게임 완료 처리
  const handleGameComplete = () => {
    setIsCompleted(true);
    setIsGameActive(false);
    const recorded = formatTime(elapsedSeconds);
    setFinalTime(recorded);

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    // 게임 성공 시에만 구글 시트에 저장
    saveResultToGoogleSheet({
      name: playerName,
      score: moves,
      finishtime: recorded,
    });
  };


  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors duration-300">
      {/* 부드럽고 차분한 배경 블러 그라디언트 오브 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-200/35 dark:bg-indigo-950/20 blur-[120px]" />
        <div className="absolute top-[30%] -right-[15%] w-[450px] h-[450px] rounded-full bg-indigo-200/30 dark:bg-purple-950/20 blur-[130px]" />
        <div className="absolute -bottom-[15%] left-[25%] w-[500px] h-[500px] rounded-full bg-emerald-200/30 dark:bg-emerald-950/15 blur-[120px]" />
      </div>

      {/* 상단 네비게이션 바 (공통) */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-sm flex items-center justify-center text-lg">
            🎮
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
            카드 맞추기 게임
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {gameState === "playing" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToEntry}
              className="h-9 px-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white/90 dark:hover:bg-zinc-800/90 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-sm text-xs font-medium"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              처음으로
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6">
        {gameState === "entry" ? (
          /* 1. 사용자 이름 입력 화면 */
          <div className="w-full max-w-sm sm:max-w-md mx-auto">
            <div className="p-7 sm:p-9 rounded-3xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-center space-y-6">
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/80 to-purple-500/80 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20 text-white">
                  🍎
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    카드 맞추기 게임
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1.5">
                    4×4 카드에 숨겨진 8쌍의 과일을 찾아 맞춰보세요!
                  </p>
                </div>
              </div>

              <form onSubmit={handleStartGame} className="space-y-4 pt-2">
                <div className="text-left space-y-2">
                  <label
                    htmlFor="playerName"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    플레이어 이름
                  </label>
                  <Input
                    id="playerName"
                    type="text"
                    placeholder="이름이나 닉네임을 입력하세요"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="h-12 text-base px-4 rounded-xl bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md border border-slate-200/80 dark:border-zinc-700 focus-visible:ring-indigo-500 transition-all"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  게임 시작하기
                </Button>
              </form>

              <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>총 16장의 카드 (8쌍의 과일 랜덤 배치)</span>
              </div>
            </div>
          </div>
        ) : (
          /* 2. 게임 플레이 화면 */
          <div className="w-full max-w-lg mx-auto flex flex-col gap-4 sm:gap-5">
            {/* 상태 대시보드 바 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {playerName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-none"
                    >
                      {matchedPairs} / 8 쌍
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    시도 횟수: {moves}회
                  </p>
                </div>
              </div>

              {/* 타이머 */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 font-mono text-sm sm:text-base font-semibold shadow-xs">
                <Clock
                  className={`w-4 h-4 ${
                    isGameActive && !isPaused ? "text-indigo-600 dark:text-indigo-400 animate-spin" : "text-slate-400"
                  }`}
                />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex items-center justify-center gap-2">
              {!isGameActive || isPaused ? (
                <Button
                  onClick={handlePlayOrResume}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium text-sm transition-all"
                  disabled={isCompleted}
                >
                  <Play className="w-4 h-4 mr-1.5 fill-current" />
                  {isPaused ? "계속하기" : "게임 시작"}
                </Button>
              ) : (
                <Button
                  onClick={handlePauseGame}
                  variant="outline"
                  className="h-10 px-4 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white/90 dark:hover:bg-zinc-800/90 backdrop-blur-md border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400 text-sm font-medium"
                >
                  <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  잠깐 멈춤
                </Button>
              )}

              <Button
                onClick={handleRestart}
                variant="outline"
                className="h-10 px-4 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white/90 dark:hover:bg-zinc-800/90 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-200 text-sm font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                다시 시작
              </Button>
            </div>

            {/* 일시 정지 안내 메시지 */}
            {isPaused && !isCompleted && isGameActive && (
              <div className="text-center py-2 px-3 rounded-xl bg-amber-500/15 backdrop-blur-md border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium animate-pulse">
                ⏸ 게임이 일시 멈춤 상태입니다. [계속하기]를 눌러 다시 시작하세요.
              </div>
            )}

            {/* 4x4 반투명 유리(Glassmorphism) 카드 그리드 */}
            <div className="w-full aspect-square max-w-[420px] mx-auto p-3 sm:p-4 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 w-full h-full">
                {cards.map((card) => {
                  const showFront = card.isFlipped || card.isMatched;

                  return (
                    <div
                      key={card.instanceId}
                      className="perspective-1000 w-full h-full cursor-pointer select-none"
                      onClick={() => handleCardClick(card)}
                    >
                      <div
                        className={`relative w-full h-full duration-500 transform-style-3d rounded-2xl transition-transform ${
                          showFront ? "rotate-y-180" : ""
                        }`}
                      >
                        {/* 카드 뒷면 (Glassmorphism 반투명 유리 질감) */}
                        <div
                          className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center rounded-2xl transition-all ${
                            !isGameActive || isPaused
                              ? "bg-slate-200/50 dark:bg-zinc-800/40 border border-white/40 dark:border-white/5 opacity-50 cursor-not-allowed"
                              : "bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-700/70 border border-white/80 dark:border-white/15 backdrop-blur-md shadow-sm hover:shadow-md hover:scale-[1.03]"
                          }`}
                        >
                          <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-zinc-500" />
                        </div>

                        {/* 카드 앞면 (과일 표시) */}
                        <div
                          className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center rounded-2xl border backdrop-blur-xl transition-all shadow-sm ${
                            card.isMatched
                              ? "bg-emerald-500/20 border-emerald-400/80 ring-2 ring-emerald-400/30 dark:bg-emerald-500/25 dark:border-emerald-400/60"
                              : `${card.fruit.bgGlass}`
                          }`}
                        >
                          <span className="text-3xl sm:text-4xl filter drop-shadow-sm transform transition-transform hover:scale-110">
                            {card.fruit.emoji}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold mt-1 text-slate-700 dark:text-zinc-200">
                            {card.fruit.name}
                          </span>
                          {card.isMatched && (
                            <CheckCircle2 className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 게임 완료 축하 모달 */}
        {isCompleted && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-7 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-3xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Trophy className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  축하합니다, {playerName}님! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                  모든 과일 카드 짝을 성공적으로 맞추셨습니다!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 px-4 bg-slate-100/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/5">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> 소요 시간
                  </span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {finalTime}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-slate-200 dark:border-zinc-700">
                  <span className="text-xs text-slate-500 dark:text-zinc-400">시도 횟수</span>
                  <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {moves}회
                  </span>
                </div>
              </div>

              {/* 구글 시트 저장 상태 표시 */}
              {GOOGLE_SCRIPT_URL && (
                <div className="text-xs text-center font-medium">
                  {saveStatus === "saving" && (
                    <span className="text-slate-500 animate-pulse">📊 구글 스프레드시트에 저장하는 중...</span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="text-emerald-600 dark:text-emerald-400">✓ 구글 스프레드시트에 저장 완료!</span>
                  )}
                  {saveStatus === "error" && (
                    <span className="text-rose-500">⚠ 구글 시트 저장 중 문제가 발생했습니다.</span>
                  )}
                </div>
              )}

              {/* 🏆 명예의 전당: 상위 3위 랭킹 (종료시간 오름차순) */}
              <div className="space-y-2 text-left pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    명예의 전당 (종료시간 TOP 3)
                  </h4>
                  {isLoadingRankings && (
                    <span className="text-[11px] text-slate-400 animate-pulse">랭킹 갱신 중...</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {top3Rankings.length > 0 ? (
                    top3Rankings.map((item, idx) => {
                      const medalEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
                      const medalBg =
                        idx === 0
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                          : idx === 1
                          ? "bg-slate-500/10 border-slate-400/30 text-slate-900 dark:text-slate-200"
                          : "bg-orange-500/10 border-orange-500/30 text-orange-950 dark:text-orange-200";

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${medalBg} transition-all`}
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <span className="text-sm">{medalEmoji}</span>
                            <span className="font-bold">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                              {item.score}회 시도
                            </span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {item.finishtime}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-3 text-xs text-slate-400 dark:text-zinc-500 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                      {isLoadingRankings ? "랭킹 데이터를 불러오는 중입니다..." : "등록된 랭킹 기록이 없습니다."}
                    </div>
                  )}
                </div>
              </div>




              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  onClick={handleRestart}
                  size="lg"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  한 판 더 하기
                </Button>
                <Button
                  onClick={handleBackToEntry}
                  variant="outline"
                  size="lg"
                  className="rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-slate-200 dark:border-zinc-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  처음으로
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 하단 푸터 (Copyright 표기) */}
      <footer className="relative z-10 w-full text-center py-4 px-4 border-t border-slate-200/40 dark:border-zinc-800/50 bg-white/30 dark:bg-zinc-950/30 backdrop-blur-md">
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
          Copyright INU 카드 맞추기 게임 by 윤병윤
        </p>
      </footer>
    </div>
  );
}
