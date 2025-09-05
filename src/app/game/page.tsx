// app/game/page.tsx
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

  // track which specific option should shake: key = `${stage}-${idx}`
  const [shakeMap, setShakeMap] = React.useState<Record<string, boolean>>({});

  // ----- Auto-scroll helpers -----
  const endOfThreadRef = React.useRef<HTMLDivElement | null>(null);

  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const isNearBottom = React.useCallback(() => {
    if (typeof window === 'undefined') return false;
    const doc = document.documentElement;
    const scrolled = window.scrollY + window.innerHeight;
    const threshold = doc.scrollHeight - 200; 
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
      try {
        //@ts-ignore
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 120, spread: 70, origin: { x, y } });
      } catch {
        console.log('Failed to load confetti');
      }
    },
    []
  );

  //@ts-ignore
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
    submit({
      topic,
      theme,
      stage: 1,
      maxStages: maxStagesFromUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (isNearBottom()) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [object, isNearBottom, scrollToBottom]);

  const restart = () => {
    if (!topic || !theme) {
      router.push('/');
      return;
    }
    setTurns([]);
    setSelections({});
    setShakeMap({});
    setPendingStage(1);
    submit({
      topic,
      theme,
      stage: 1,
      maxStages: maxStagesFromUrl,
    });
  };

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
          isCorrect && 'ring-1 ring-green-600',
          isWrongPicked && 'ring-1 ring-red-600',
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
        <span>{label}</span>
      </Button>
    );
  };

  const showInitialSkeleton = turns.length === 0 && pendingStage === 1 && isLoading;

  return (
    <main className="min-h-screen bg-background text-foreground mt-10">

      <div className="mx-auto max-w-3xl px-6">
        {showInitialSkeleton && (
          <Card className="mb-4 border-border bg-card text-card-foreground">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono tracking-widest">Stage 1</CardTitle>
                <Badge variant="secondary">loading…</Badge>
              </div>
              <CardDescription className="text-muted-foreground">
                Preparing your first turn…
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-[90%]" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        )}


        <div className="grid gap-4">
          {turns.map((turn) => {
            const isLatest = turn.stage === latestStage;
            const picked = selections[turn.stage];
            const reveal = picked !== undefined && turn.correctIndex !== undefined;

            return (
              <Card key={turn.stage} className="border-border bg-card text-card-foreground">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-mono tracking-widest">
                      Stage {turn.stage}
                    </CardTitle>
                    {isLatest && isLoading && pendingStage === turn.stage ? (
                      <Badge variant="secondary">streaming…</Badge>
                    ) : isLatest && turn.isGameOver ? (
                      <Badge>🎉 game over</Badge>
                    ) : !isLatest ? (
                      <Badge variant="outline">history</Badge>
                    ) : null}
                  </div>
                  {turn.question && (
                    <CardDescription className="mt-1 text-muted-foreground">
                      {turn.question == "null" ? '' : turn.question}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {isLatest && isLoading && pendingStage === turn.stage ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[70%]" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{turn.story ?? ''}</p>
                  )}

                  <div className="grid gap-2">
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
                      <h3 className="mb-1 font-mono text-base tracking-widest">ENDING</h3>
                      <p className="whitespace-pre-wrap">{turn.ending}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {pendingStage !== null &&
            turns.length > 0 &&
            pendingStage === latestStage + 1 &&
            isLoading && (
              <Card className="border-border bg-card text-card-foreground">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-mono tracking-widest">
                      Stage {pendingStage}
                    </CardTitle>
                    <Badge variant="secondary">loading next…</Badge>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Generating the next stage…
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-[85%]" />
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-4 w-[90%]" />
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <div ref={endOfThreadRef} className="h-px scroll-mt-24" aria-hidden />

        <div className="mt-4 flex items-center gap-3">
          {isLoading && (
            <Button variant="secondary" onClick={() => stop()}>
              Stop stream
            </Button>
          )}
          {error && <p className="text-sm text-destructive">{String(error)}</p>}
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
          .sq-shake {
            animation: sq-shake 450ms cubic-bezier(.36,.07,.19,.97) both;
          }
        }
      `}</style>
    </main>
  );
}
