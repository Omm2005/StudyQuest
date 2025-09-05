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
    //@ts-ignore
      ? selectedIndex === lastTurn.correctIndex
      : undefined;

  const isFinalStage = stage >= maxStages;

  const system = `
You are StoryQuest, a game engine that writes short, punchy branching
story-quiz stages. Each stage continues the plot, then asks one multiple-choice
question with 2–4 options and exactly ONE correct answer.

Rules:
- Strictly output a JSON object that conforms to the provided schema.
- Keep "story" ~60–120 words, present-tense, vivid but not purple.
- If ` + '`answerWasCorrect`' + ` is true, reward the player in the narrative; if false, add a setback.
- Reflect the consequences from the previous choice in the new "story".
- "question" must be grounded in the story or the topic/theme (never trivia out of nowhere).
- Make options plausible; only one is correct.
- Set "stage" to the stage you're generating now.
- If this is the final stage (isFinalStage = true), set "isGameOver": true and include an "ending" that wraps the plot.
- Otherwise "isGameOver": false and omit "ending".
- Absolutely NEVER include extra fields or text outside JSON.
`.trim();

  const user = `
Topic: ${topic}
Theme: ${theme}
Generate stage #${stage}.
isFinalStage: ${isFinalStage ? 'true' : 'false'}
answerWasCorrect (for the PREVIOUS stage, if any): ${
    answerWasCorrect === undefined ? 'undefined' : String(answerWasCorrect)
  }

Context for continuity:
${
  lastTurn
    ? `LastTurn.story: ${lastTurn.story}
LastTurn.question: ${lastTurn.question}
LastTurn.options: ${lastTurn.options.map((o, i) => `[${i}] ${o}`).join(' | ')}
LastTurn.correctIndex: ${lastTurn.correctIndex}
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
