/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

import * as React from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { GameTurnSchema } from '../api/game/schema';
import { useSession, signOut } from 'next-auth/react';

const ClientTurnSchema = GameTurnSchema; // for typing on the client

export default function Page() {
  const [topic, setTopic] = React.useState('');
  const [theme, setTheme] = React.useState('');
  const [maxStages, setMaxStages] = React.useState(10);
  const [currentStage, setCurrentStage] = React.useState<number | null>(null);
  const [lastTurnSnapshot, setLastTurnSnapshot] = React.useState<
    z.infer<typeof ClientTurnSchema> | undefined
  >(undefined);

  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? 'User';

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/game',
    schema: ClientTurnSchema,
  });

  // Keep a snapshot of the latest completed turn when loading stops
  React.useEffect(() => {
    if (!isLoading && object?.stage) {
      setLastTurnSnapshot(object);
      setCurrentStage(object.stage);
    }
  }, [isLoading, object]);

  const startGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStage(1);
    setLastTurnSnapshot(undefined);
    submit({
      topic,
      theme,
      stage: 1,
      maxStages,
    });
  };

  const pickOption = (idx: number) => {
    if (!object || isLoading) return;
    const nextStage = (object.stage ?? 1) + 1;

    // pass the turn snapshot + selectedIndex so the server can branch
    submit({
      topic,
      theme,
      stage: nextStage,
      selectedIndex: idx,
      lastTurn: object, // send what we currently have on screen
      maxStages,
    });
  };

  const canPlay = Boolean(topic && theme);

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Welcome, {userName}</div>
        {!!session && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: 'bg-background',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        )}
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        StoryQuest — Streaming Branching Quiz
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        Give me a topic + theme. You&apos;ll get up to 10 stages. Each turn:
        read the story, answer a question, and the plot adapts.
      </p>

      <form onSubmit={startGame} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Topic (e.g., Space Exploration)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <input
          placeholder="Theme (e.g., Hopeful, Mystery, Comedy...)"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          Max stages:
          <input
            type="number"
            min={1}
            max={10}
            value={maxStages}
            onChange={(e) => setMaxStages(parseInt(e.target.value || '10', 10))}
            style={{ width: 70, padding: 6, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </label>
        <button
          type="submit"
          disabled={!canPlay || isLoading}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #111',
            background: '#111',
            color: '#fff',
            fontWeight: 600,
            cursor: canPlay && !isLoading ? 'pointer' : 'not-allowed',
          }}
        >
          {currentStage ? 'Restart' : 'Start'}
        </button>
      </form>

      {/* Game panel */}
      {object?.stage && (
        <section
          style={{
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            background: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Stage {object.stage}</strong>
            {isLoading ? (
              <em>streaming…</em>
            ) : object.isGameOver ? (
              <span>🎉 game over</span>
            ) : null}
          </div>

          {/* Story streams in as object.story fills */}
          <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{object.story ?? ''}</p>

          {!object.isGameOver && (
            <>
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>{object.question ?? ''}</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {(object.options ?? []).map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => pickOption(idx)}
                    disabled={isLoading}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      background: '#fff',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}. {opt ?? ''}
                  </button>
                ))}
              </div>
            </>
          )}

          {object.isGameOver && (
            <div style={{ marginTop: 16 }}>
              <h3>Ending</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{object.ending ?? ''}</p>
            </div>
          )}
        </section>
      )}

      {/* Controls / status */}
      <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        {isLoading && (
          <button onClick={() => stop()} style={{ padding: '6px 10px', borderRadius: 6 }}>
            Stop stream
          </button>
        )}
        {error && <span style={{ color: 'crimson' }}>{String(error)}</span>}
      </div>
    </main>
  )
}