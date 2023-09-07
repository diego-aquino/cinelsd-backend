import fastify from 'fastify';
import { RedisClientOptions, createClient } from 'redis';
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

const environment = environmentSchema.parse(process.env);

export async function initializeRedisClient(options?: RedisClientOptions) {
  const client = createClient(options);

  client.on('error', (error) => {
    console.error('[redis]', error);
  });

  await client.connect();

  return client;
}

async function initializeRedisClients(options: {
  host: string;
  port: number;
  password?: string;
  movieDatabase: number;
  movieMainActorsDatabase: number;
  actorDatabase: number;
}) {
  const redisURL = `redis://${options.host}:${options.port}`;

  const [movies, mainActors, actors] = await Promise.all([
    initializeRedisClient({ url: redisURL, password: options.password, database: options.movieDatabase }),
    initializeRedisClient({ url: redisURL, password: options.password, database: options.movieMainActorsDatabase }),
    initializeRedisClient({ url: redisURL, password: options.password, database: options.actorDatabase }),
  ]);

  const redis = { movies, mainActors, actors };
  return redis;
}

async function startServer() {
  const server = fastify({
    logger: true,
    disableRequestLogging: environment.NODE_ENV !== 'development',
  });

  const redis = await initializeRedisClients({
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
    password: environment.REDIS_PASSWORD,
    movieDatabase: environment.REDIS_MOVIE_DATABASE,
    movieMainActorsDatabase: environment.REDIS_MOVIE_MAIN_ACTORS_DATABASE,
    actorDatabase: environment.REDIS_ACTOR_DATABASE,
  });

  const getMovieByIdSchema = z.object({ movieId: z.string() });

  server.get('/movies/:movieId', async (request, reply) => {
    const { movieId } = getMovieByIdSchema.parse(request.params);

    const stringifiedMovie = await redis.movies.get(movieId);

    reply.header('Content-Type', 'application/json');
    reply.send(stringifiedMovie);
  });

  const getMovieMainActorsSchema = z.object({ movieId: z.string() });

  server.get('/movie-main-actors/:movieId', async (request, reply) => {
    const { movieId } = getMovieMainActorsSchema.parse(request.params);

    const stringifiedMovieMainActors = await redis.mainActors.get(movieId);

    reply.header('Content-Type', 'application/json');
    reply.send(stringifiedMovieMainActors);
  });

  const getActorByIdSchema = z.object({ actorId: z.string() });

  server.get('/actors/:actorId', async (request, reply) => {
    const { actorId } = getActorByIdSchema.parse(request.params);

    const stringifiedActor = await redis.actors.get(actorId);

    reply.header('Content-Type', 'application/json');
    reply.send(stringifiedActor);
  });

  await server.listen({ host: '::', port: environment.PORT });
}

startServer();
