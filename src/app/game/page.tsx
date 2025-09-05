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
    if (!object?.stage) return;

    setTurns((prev) => {
      const idx = prev.findIndex((t) => t.stage === object.stage);
      if (idx === -1) return [...prev, object].sort((a, b) => a.stage - b.stage);
      const next = [...prev];
      next[idx] = object;
      return next;
    });

    setPendingStage((p) => (p === object.stage ? null : p));
  }, [object]);

  const restart = () => {
    if (!topic || !theme) {
      router.push('/');
      return;
    }
    setTurns([]);
    setSelections({});
    setPendingStage(1);
    submit({
      topic,
      theme,
      stage: 1,
      maxStages: maxStagesFromUrl,
    });
  };

  const pickOption = (idx: number) => {
    const base = latestTurn ?? object;
    if (!base || isLoading) return;

    setSelections((prev) => ({ ...prev, [base.stage]: idx }));

    const nextStage = (base.stage ?? 1) + 1;
    setPendingStage(nextStage);
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
    const reveal = picked !== undefined && correct !== undefined;

    const isCorrect = reveal && correct === idx;
    const isWrongPicked = reveal && wasPicked && correct !== idx;

    return (
      <Button
        key={idx}
        onClick={() => (interactive ? pickOption(idx) : undefined)}
        disabled={!interactive || (interactive && picked !== undefined) || isLoading}
        variant="outline"
        className={cn(
          'justify-start text-left',
          isCorrect && 'border-green-600 dark:border-green-600 bg-green-50 dark:bg-green-950',
          isWrongPicked && 'border-red-600 dark:border-red-600 bg-red-50 dark:bg-red-950',
          !interactive && 'pointer-events-none opacity-100' // keep visible for history
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

  // Only ONE skeleton at initial load
  const showInitialSkeleton = turns.length === 0 && pendingStage === 1 && isLoading;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">StoryQuest — Game</h1>
          <p className="text-sm text-muted-foreground">
            Topic: <span className="font-medium">{topic || '—'}</span> • Theme:{' '}
            <span className="font-medium">{theme || '—'}</span> • Max stages:{' '}
            <span className="font-medium">{maxStagesFromUrl}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/')}>
            Change Setup
          </Button>
          <Button onClick={restart}>Restart</Button>
        </div>
      </div>

      <Separator className="mb-4" />

      {showInitialSkeleton && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stage 1</CardTitle>
              <Badge variant="secondary">loading…</Badge>
            </div>
            <CardDescription>Preparing your first turn…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-4 w-[90%]" />
            <div className="pt-2 space-y-2">
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
            <Card key={turn.stage}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Stage {turn.stage}</CardTitle>
                  {isLatest && isLoading && pendingStage === turn.stage ? (
                    <Badge variant="secondary">streaming…</Badge>
                  ) : isLatest && turn.isGameOver ? (
                    <Badge>🎉 game over</Badge>
                  ) : !isLatest ? (
                    <Badge variant="outline">history</Badge>
                  ) : null}
                </div>
                {turn.question && (
                  <CardDescription className="mt-1">{turn.question}</CardDescription>
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
                  <p className="leading-relaxed whitespace-pre-wrap">{turn.story ?? ''}</p>
                )}

                <div className="grid gap-2">
                  {(turn.options ?? []).map((_opt: any, idx: any) =>
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
                    <h3 className="mb-1 text-lg font-semibold">Ending</h3>
                    <p className="whitespace-pre-wrap">{turn.ending}</p>
                  </div>
                )}

                {reveal && (
                  <div className="pt-1 text-xs text-muted-foreground">
                    <span className="mr-3 inline-flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-sm bg-green-500/20 ring-1 ring-green-600" />
                      correct
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-sm bg-red-500/20 ring-1 ring-red-600" />
                      your wrong pick
                    </span>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Stage {pendingStage}</CardTitle>
                  <Badge variant="secondary">loading next…</Badge>
                </div>
                <CardDescription>Generating the next stage…</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-4 w-[70%]" />
                <Skeleton className="h-4 w-[90%]" />
                <div className="pt-2 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {isLoading && (
          <Button variant="secondary" onClick={() => stop()}>
            Stop stream
          </Button>
        )}
        {error && <p className="text-sm text-red-600">{String(error)}</p>}
      </div>
    </main>
  );
}
