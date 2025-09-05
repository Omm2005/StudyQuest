'use client';

import * as React from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameTurnSchema, type GameTurn } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
type SelectionMap = Record<number, number>;

export default function GamePage() {
  const router = useRouter();
  const sp = useSearchParams();

  const topic = sp.get('topic') ?? '';
  const theme = sp.get('theme') ?? '';
  const maxStagesFromUrl = (() => {
    const n = parseInt(sp.get('maxStages') ?? '10', 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), 10) : 10;
  })();

  const [turns, setTurns] = React.useState<GameTurn[]>([]);
  const [selections, setSelections] = React.useState<SelectionMap>({});
  const [pendingStage, setPendingStage] = React.useState<number | null>(null);
  const [shakeMap, setShakeMap] = React.useState<Record<string, boolean>>({});

  const endOfThreadRef = React.useRef<HTMLDivElement | null>(null);

  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const isNearBottom = React.useCallback(() => {
    if (typeof window === 'undefined') return false;
    const doc = document.documentElement;
    const scrolled = window.scrollY + window.innerHeight;
    const threshold = doc.scrollHeight - 240;
    return scrolled >= threshold;
  }, []);

  const scrollToBottom = React.useCallback(() => {
    if (!endOfThreadRef.current) return;
    endOfThreadRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [prefersReducedMotion]);

  const fireConfetti = React.useCallback(
    async (x = 0.5, y = 0.35) => {
      if (prefersReducedMotion) return;
      try {
        // @ts-ignore
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 120, spread: 70, origin: { x, y } });
      } catch {
        console.log('Failed to load confetti');
      }
    },
    [prefersReducedMotion]
  );

  // @ts-ignore
  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/game',
    schema: GameTurnSchema,
  });

  const latestTurn = turns.length ? turns[turns.length - 1] : undefined;
  const latestStage = latestTurn?.stage ?? 0;

  React.useEffect(() => {
    if (!topic || !theme) router.replace('/');
  }, [topic, theme, router]);

  React.useEffect(() => {
    if (!topic || !theme) return;
    if (turns.length > 0) return;
    setPendingStage(1);
    submit({ topic, theme, stage: 1, maxStages: maxStagesFromUrl });
  }, [topic, theme, maxStagesFromUrl]);

  React.useEffect(() => {
    if (typeof object?.stage !== 'number') return;

    setTurns((prev) => {
      const idx = prev.findIndex((t) => t.stage === object.stage);
      if (idx === -1) return [...prev, object as GameTurn].sort((a, b) => a.stage - b.stage);
      const next = [...prev];
      next[idx] = object as GameTurn;
      return next;
    });

    setPendingStage((p) => (p === object.stage ? null : p));

    if (isNearBottom()) requestAnimationFrame(scrollToBottom);
  }, [object, isNearBottom, scrollToBottom]);

  const restart = React.useCallback(() => {
    if (!topic || !theme) {
      router.push('/');
      return;
    }
    setTurns([]);
    setSelections({});
    setShakeMap({});
    setPendingStage(1);
    submit({ topic, theme, stage: 1, maxStages: maxStagesFromUrl });
  }, [router, submit, theme, topic, maxStagesFromUrl]);

  const pickOption = (
    idx: number,
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const base = latestTurn ?? object;
    if (!base || isLoading) return;

    const correctIdx = (base as GameTurn).correctIndex;
    const isCorrect = typeof correctIdx === 'number' && idx === correctIdx;

    if (isCorrect) {
      const x = e ? e.clientX / window.innerWidth : 0.5;
      const y = e ? e.clientY / window.innerHeight : 0.35;
      void fireConfetti(x, y);
    } else {
      const key = `${Number(base.stage)}-${idx}`;
      setShakeMap((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setShakeMap((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 500);
    }

    setSelections((prev) => ({ ...prev, [Number(base.stage)]: idx }));

    const nextStage = (base.stage ?? 1) + 1;
    setPendingStage(nextStage);
    requestAnimationFrame(scrollToBottom);

    submit({
      topic,
      theme,
      stage: nextStage,
      selectedIndex: idx,
      lastTurn: base,
      maxStages: maxStagesFromUrl,
    });
  };

  const renderOption = (
    turn: GameTurn,
    idx: number,
    interactive: boolean,
    picked: number | undefined
  ) => {
    const label = turn.options?.[idx] ?? '';
    const correct = turn.correctIndex;
    const wasPicked = picked === idx;
    const reveal = picked !== undefined && typeof correct === 'number';

    const isCorrect = reveal && correct === idx;
    const isWrongPicked = reveal && wasPicked && correct !== idx;

    const shakeKey = `${turn.stage}-${idx}`;
    const shouldShake = shakeMap[shakeKey];

    return (
      <Button
        key={idx}
        onClick={(e) => (interactive ? pickOption(idx, e) : undefined)}
        disabled={!interactive || (interactive && picked !== undefined) || isLoading}
        variant="outline"
        className={cn(
          'justify-start text-left transition-transform font-mono tracking-wide hover:bg-muted',
          'w-full min-h-12 sm:min-h-10 py-3 sm:py-2 text-sm sm:text-base',
          'rounded-xl sm:rounded-lg',
          'aria-pressed:ring-2 aria-pressed:ring-ring',
          isCorrect && 'ring-1 ring-green-600',
          isWrongPicked && '!ring-1 !ring-red-600',
          shouldShake && 'sq-shake',
          !interactive && 'pointer-events-none opacity-100'
        )}
        aria-pressed={wasPicked}
        aria-label={`Option ${String.fromCharCode(65 + idx)}${
          reveal ? (isCorrect ? ' (correct)' : wasPicked ? ' (your choice, incorrect)' : '') : ''
        }`}
        title={
          reveal
            ? isCorrect
              ? 'Correct answer'
              : wasPicked
              ? 'Your choice (incorrect)'
              : 'Other option'
            : interactive
            ? 'Choose this option'
            : 'Previous stage'
        }
      >
        <span className="mr-2 font-mono">{String.fromCharCode(65 + idx)}.</span>
        <span className="whitespace-pre-line">{label}</span>
      </Button>
    );
  };

  const showInitialSkeleton = turns.length === 0 && pendingStage === 1 && isLoading;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Sticky meta bar (mobile friendly) */}
      <div
        className={cn(
          'sticky top-0 z-30 border-b border-border/60 bg-background/80 supports-[backdrop-filter]:backdrop-blur',
          'px-4 sm:px-6 lg:px-8 py-2 sm:py-3'
        )}
        role="region"
        aria-label="Game meta"
      >
        <div className="mx-auto w-full max-w-4xl flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <Badge variant="outline" className="rounded-md">Topic: {topic || '—'}</Badge>
            <Badge variant="outline" className="rounded-md">Theme: {theme || '—'}</Badge>
            {latestStage > 0 && (
              <Badge className="rounded-md" variant="secondary">Stage {latestStage}</Badge>
            )}
            {isLoading && <Badge variant="secondary" className="rounded-md">generating…</Badge>}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {isLoading && (
              <Button size="sm" variant="secondary" onClick={() => stop()} aria-label="Stop streaming">
                Stop
              </Button>
            )}
            <Button size="sm" onClick={restart} aria-label="Restart game">Restart</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 lg:mt-8 pb-[env(safe-area-inset-bottom)]">
        {showInitialSkeleton && (
          <Card className="mb-4 border-border bg-card text-card-foreground">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono tracking-widest text-base sm:text-lg">Stage 1</CardTitle>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">loading…</Badge>
              </div>
              <CardDescription className="text-muted-foreground">Preparing your first turn…</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-[88%]" />
              <Skeleton className="h-4 w-[72%]" />
              <Skeleton className="h-4 w-[92%]" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:gap-5">
          {turns.map((turn) => {
            const isLatest = turn.stage === latestStage;
            const picked = selections[turn.stage];

            return (
              <Card key={turn.stage} className="border-border bg-card text-card-foreground">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="font-mono tracking-widest text-base sm:text-lg">
                      Stage {turn.stage}
                    </CardTitle>
                    {isLatest && isLoading && pendingStage === turn.stage ? (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">streaming…</Badge>
                    ) : isLatest && turn.isGameOver ? (
                      <Badge className="text-[10px] sm:text-xs">🎉 game over</Badge>
                    ) : !isLatest ? (
                      <Badge variant="outline" className="text-[10px] sm:text-xs">history</Badge>
                    ) : null}
                  </div>
                  {turn.question && (
                    <CardDescription className="mt-1 text-muted-foreground text-sm sm:text-base">
                      {turn.question == 'null' ? '' : turn.question}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-5">
                  {isLatest && isLoading && pendingStage === turn.stage ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[92%]" />
                      <Skeleton className="h-4 w-[82%]" />
                      <Skeleton className="h-4 w-[74%]" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base">{turn.story ?? ''}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {(turn.options ?? []).map((_, idx) =>
                      renderOption(
                        turn,
                        idx,
                        isLatest && selections[turn.stage] === undefined,
                        picked
                      )
                    )}
                  </div>

                  {turn.isGameOver && turn.ending && (
                    <div className="pt-2">
                      <Separator className="my-2" />
                      <h3 className="mb-1 font-mono text-sm sm:text-base tracking-widest">ENDING</h3>
                      <p className="whitespace-pre-wrap text-[15px] sm:text-base">{turn.ending}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {pendingStage !== null && turns.length > 0 && pendingStage === latestStage + 1 && isLoading && (
            <Card className="border-border bg-card text-card-foreground">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono tracking-widest text-base sm:text-lg">
                    Stage {pendingStage}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">loading next…</Badge>
                </div>
                <CardDescription className="text-muted-foreground">Generating the next stage…</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-[88%]" />
                <Skeleton className="h-4 w-[72%]" />
                <Skeleton className="h-4 w-[92%]" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div ref={endOfThreadRef} className="h-px scroll-mt-24" aria-hidden />

        <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 supports-[backdrop-filter]:backdrop-blur px-4 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          <div className="mx-auto max-w-4xl flex items-center gap-2">
            {isLoading && (
              <Button variant="secondary" className="flex-1" onClick={() => stop()} aria-label="Stop streaming">
                Stop
              </Button>
            )}
            <Button className="flex-[1.2]" onClick={restart} aria-label="Restart game">
              Restart
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{String(error)}</p>}
        </div>
      </div>

      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes sq-shake {
            0%, 100% { transform: translateX(0); }
            15% { transform: translateX(-6px); }
            30% { transform: translateX(6px); }
            45% { transform: translateX(-5px); }
            60% { transform: translateX(5px); }
            75% { transform: translateX(-3px); }
            90% { transform: translateX(3px); }
          }
          .sq-shake { animation: sq-shake 450ms cubic-bezier(.36,.07,.19,.97) both; }
        }
      `}</style>
    </main>
  );
}
