import fastify, { FastifyInstance } from 'fastify';

import { environment } from '@/config/environment';
import RedisClient from '@/database/redis/RedisClient';
import ActorController from '@/controllers/actors/ActorController';
import MovieController from '@/controllers/movies/MovieController';
import MovieMainActorController from '@/controllers/movieMainActors/MovieMainActorController';

export interface ServerContext {
  redis: RedisClient;
}

class Server {
  private server: FastifyInstance;
  private context: ServerContext;

  constructor() {
    this.server = fastify({
      logger: true,
      disableRequestLogging: environment.NODE_ENV !== 'development',
    });

    this.context = this.createContext();
    this.createControllers();
  }

  private createContext(): ServerContext {
    const redisClient = new RedisClient({
      host: environment.REDIS_HOST,
      port: environment.REDIS_PORT,
      password: environment.REDIS_PASSWORD,
      movieDatabase: environment.REDIS_MOVIE_DATABASE,
      movieMainActorsDatabase: environment.REDIS_MOVIE_MAIN_ACTORS_DATABASE,
      actorDatabase: environment.REDIS_ACTOR_DATABASE,
    });

    return {
      redis: redisClient,
    };
  }

  private createControllers() {
    new MovieController(this.context).registerRoutes(this.server);
    new MovieMainActorController(this.context).registerRoutes(this.server);
    new ActorController(this.context).registerRoutes(this.server);
  }

  async start(port: number) {
    await this.context.redis.start();
    await this.server.listen({ host: '0.0.0.0', port });
  }

  async stop() {
    await this.server.close();
    await this.context.redis.stop();
  }
}

export default Server;
