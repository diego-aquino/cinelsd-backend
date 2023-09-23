import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).optional().default('development'),

  PORT: z.coerce.number().int().positive(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_PASSWORD: z.string().optional(),

  REDIS_MOVIE_DATABASE: z.coerce.number().int().positive(),
  REDIS_MOVIE_MAIN_ACTORS_DATABASE: z.coerce.number().int().positive(),
  REDIS_ACTOR_DATABASE: z.coerce.number().int().positive(),
});

const environment = environmentSchema.parse(process.env);

export default environment;
