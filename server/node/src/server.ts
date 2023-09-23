import fastify, { FastifyInstance } from 'fastify';

import environment from '@/config/environment';
import RedisClient from '@/database/redis/RedisClient';
import ActorController from '@/controllers/actors/ActorController';
import MovieController from '@/controllers/movies/MovieController';
import MovieMainActorController from '@/controllers/movieMainActors/MovieMainActorController';
import Controller from '@/controllers/Controller';

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
    const controllers: Controller[] = [
      new MovieController(this.context),
      new MovieMainActorController(this.context),
      new ActorController(this.context),
    ];

    for (const controller of controllers) {
      controller.registerRoutes(this.server);
    }
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
