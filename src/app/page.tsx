'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function QueryPage() {
  const router = useRouter();
  const [topic, setTopic] = React.useState('');
  const [theme, setTheme] = React.useState('');
  const [maxStages, setMaxStages] = React.useState(10);

  const canPlay = Boolean(topic && theme);

  const goToGame = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams({
      topic,
      theme,
      maxStages: String(maxStages),
    });
    router.push(`/game?${sp.toString()}`);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>StoryQuest — Setup</CardTitle>
          <CardDescription>Choose a topic and theme, then jump into the game.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={goToGame} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Space Exploration"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Input
                id="theme"
                placeholder="e.g., Hopeful, Mystery, Comedy…"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxStages">Max stages (1–10)</Label>
              <Input
                id="maxStages"
                type="number"
                min={1}
                max={10}
                value={maxStages}
                onChange={(e) => {
                  const n = parseInt(e.target.value || '10', 10);
                  const clamped = Number.isFinite(n) ? Math.min(Math.max(n, 1), 10) : 10;
                  setMaxStages(clamped);
                }}
                className="w-28"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={!canPlay} className={cn(!canPlay && 'opacity-60')}>
                Start Game
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}