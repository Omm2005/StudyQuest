import { google } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { GameTurnSchema, GameRequestSchema, type GameRequest } from './schema';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(req: Request) {
  const raw = await req.json();
  const parsed = GameRequestSchema.parse(raw) as GameRequest;

  const { topic, theme, stage, selectedIndex, lastTurn, maxStages } = parsed;

  const answerWasCorrect =
    typeof selectedIndex === 'number' && lastTurn
      ? selectedIndex === lastTurn.correctIndex
      : undefined;
  const isEndingStage = stage > maxStages;

  const system = `
You are StoryQuest, a game engine that writes short, punchy branching story-quiz stages.

Output rules (IMPORTANT):
- Strictly output a JSON object matching the provided schema.
- Keep "story" ~60–120 words, present-tense, vivid but not purple.
- Use "stage" equal to the stage you're generating now.

Branching logic:
- If this is a normal question stage (stage <= maxStages):
  - Continue the plot from the previous turn.
  - If answerWasCorrect is true, reward the player in the narrative; if false, add a setback.
  - Ask exactly ONE grounded question in "question".
  - Provide 2–4 plausible "options" with exactly ONE correct answer; set "correctIndex".
  - Set "isGameOver": false and omit "ending".

- If this is the ending stage (stage > maxStages):
  - This stage is purely a wrap-up note. Do NOT ask a question.
  - Provide a satisfying "ending" that resolves the plot based on the previous choice's outcome.
  - MUST set: "isGameOver": true.
  - MUST set: "question": null or omit, "options": [], and omit "correctIndex".

Never include extra fields or text outside JSON.
`.trim();

  const user = `
Topic: ${topic}
Theme: ${theme}

Generate stage #${stage}.
isEndingStage: ${isEndingStage ? 'true' : 'false'}
answerWasCorrect (for the PREVIOUS stage, if any): ${
    answerWasCorrect === undefined ? 'undefined' : String(answerWasCorrect)
  }

Context for continuity:
${
  lastTurn
    ? `LastTurn.stage: ${lastTurn.stage}
LastTurn.story: ${lastTurn.story}
LastTurn.question: ${lastTurn.question ?? '(none)'}
LastTurn.options: ${
        Array.isArray(lastTurn.options)
          ? lastTurn.options.map((o, i) => `[${i}] ${o}`).join(' | ')
          : '(none)'
      }
LastTurn.correctIndex: ${/* @ts-ignore */ lastTurn.correctIndex ?? '(none)'}
Player selected index: ${selectedIndex}`
    : '(No previous turn — this is the first stage.)'
}
`.trim();

  const result = streamObject({
    model: google('gemini-2.5-flash'),
    schema: GameTurnSchema,
    system,
    prompt: user,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
