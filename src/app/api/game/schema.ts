import { z } from 'zod';

export const GameTurnSchema = z.object({
  stage: z.number().int().min(1).max(10),
  story: z.string().min(1).describe('Narrative for this stage (~60–120 words).'),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  correctIndex: z.number().int().min(0),
  isGameOver: z.boolean(),
  ending: z.string().optional(),
});

export type GameTurn = z.infer<typeof GameTurnSchema>;

export const GameRequestSchema = z.object({
  topic: z.string().min(1),
  theme: z.string().min(1),
  stage: z.number().int().min(1).max(10), 
  selectedIndex: z.number().int().optional(),
  lastTurn: GameTurnSchema.optional(),
  maxStages: z.number().int().min(1).max(10).default(10),
});

export type GameRequest = z.infer<typeof GameRequestSchema>;
