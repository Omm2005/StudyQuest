'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Status, StatusIndicator } from './ui/kibo-ui/status';

export default function QueryComponent() {
  const router = useRouter();
  const [topic, setTopic] = React.useState('');
  const [theme, setTheme] = React.useState('');
  const [maxStages, setMaxStages] = React.useState(10);

  const canPlay = Boolean(topic && theme);

  const goToGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlay) {
      toast.error('Please provide both Topic and Theme.');
      return;
    }

    const sp = new URLSearchParams({
      topic,
      theme,
      maxStages: String(maxStages),
    });

    const initPromise = new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        clearTimeout(t);
        resolve();
      }, 600);
    });

    try {
      await toast.promise(initPromise, {
        loading: 'Initializing session…',
        success: 'Launching game…',
        error: 'Initialization failed.',
      });
      router.push(`/game?${sp.toString()}`);
    } catch {
      console.log('Failed to initialize game');
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Status className="gap-4 rounded-full px-2 py-1 text-sm" status="online" variant="ghost">
              <StatusIndicator />
            </Status>
            <span className="font-mono text-xs tracking-wider text-muted-foreground">
              STORYQUEST / ROBOTIC INTERFACE
            </span>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            MONOCHROME
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16">
        <Card className="border-foreground/40 border-dashed bg-card text-card-foreground">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-mono text-lg tracking-[0.2em]">
              SETUP // PARAMETERS
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Provide required fields to initialize scenario.
            </CardDescription>
          </CardHeader>

          <form onSubmit={goToGame}>
            <CardContent className="py-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="topic" className="font-mono text-xs tracking-widest text-foreground/80">
                  TOPIC
                </Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Newton's Law"
                  autoComplete="off"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  required
                />
              </div>

              <div className="h-5" />

              <div className="flex flex-col gap-2">
                <Label htmlFor="theme" className="font-mono text-xs tracking-widest text-foreground/80">
                  THEME
                </Label>
                <Input
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="DND, Space Exploration, Cyberpunk, etc."
                  autoComplete="off"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  required
                />
              </div>

              <Separator className="my-6" />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex min-w-0 flex-1 flex-col">
                  <Label className="font-mono text-xs tracking-widest text-foreground/80">
                    MAX STAGES (1–10)
                  </Label>
                  <p id="maxStagesHint" className="mt-1 text-xs text-muted-foreground">
                    Total question stages before the final ending note.
                  </p>
                </div>

                <div className="flex w-full sm:w-40">
                  <Input
                    id="maxStages"
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={maxStages}
                    onChange={(e) => {
                      const n = parseInt(e.target.value || '10', 10);
                      const clamped = Number.isFinite(n) ? Math.min(Math.max(n, 1), 10) : 10;
                      setMaxStages(clamped);
                    }}
                    aria-describedby="maxStagesHint"
                    className="w-full border-input bg-background text-center font-mono text-foreground focus-visible:ring-ring"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col-reverse items-start justify-between gap-4 border-t border-border py-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Status
                  className="gap-4 rounded-full px-2 py-1 text-sm"
                  status={topic && theme ? 'online' : 'offline'}
                  variant="ghost"
                >
                  <StatusIndicator />
                </Status>
                <span className="font-mono tracking-widest">
                  REQUIREMENTS: TOPIC + THEME • RANGE: 1–10
                </span>
              </div>
              <Button
                type="submit"
                disabled={!canPlay}
                variant="outline"
                className={cn(
                  'font-mono tracking-widest hover:bg-muted hover:text-foreground',
                  !canPlay && 'opacity-50'
                )}
              >
                ► INITIATE
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-mono tracking-widest">BUILD: 0001</span>
          <span className="font-mono tracking-widest">CHANNEL: MONO/ROBOTIC</span>
        </div>
      </div>
    </main>
  );
}
