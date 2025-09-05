import { z } from 'zod';

export const GameTurnSchema = z.object({
  stage: z.number(),
  story: z.string().optional(),
  question: z.string().optional(),
  options: z.array(z.string().nullable()).optional(),
  correctIndex: z.number().int().optional(),
  isGameOver: z.boolean().optional(),
  ending: z.string().optional(),
});

export type GameTurn = z.infer<typeof GameTurnSchema>;
