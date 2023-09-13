import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).optional().default('development'),

  PORT: z.coerce.number(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string().optional(),

  REDIS_MOVIE_DATABASE: z.coerce.number(),
  REDIS_MOVIE_MAIN_ACTORS_DATABASE: z.coerce.number(),
  REDIS_ACTOR_DATABASE: z.coerce.number(),
});

export const environment = environmentSchema.parse(process.env);
