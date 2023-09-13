import ActorClient from './actors/ActorRedisClient';
import MovieMainActorClient from './movieMainActors/MovieMainActorRedisClient';
import MovieClient from './movies/MovieRedisClient';

class RedisClient {
  movies: MovieClient;
  movieMainActors: MovieMainActorClient;
  actors: ActorClient;

  constructor(options: {
    host: string;
    port: number;
    password?: string;
    movieDatabase: number;
    movieMainActorsDatabase: number;
    actorDatabase: number;
  }) {
    const redisURL = `redis://${options.host}:${options.port}`;

    this.movies = new MovieClient(redisURL, {
      password: options.password,
      database: options.movieDatabase,
    });

    this.movieMainActors = new MovieMainActorClient(redisURL, {
      password: options.password,
      database: options.movieMainActorsDatabase,
    });

    this.actors = new ActorClient(redisURL, {
      password: options.password,
      database: options.actorDatabase,
    });
  }

  async start() {
    await Promise.all([this.movies.start(), this.movieMainActors.start(), this.actors.start()]);
  }

  async stop() {
    await Promise.all([this.movies.stop(), this.movieMainActors.stop(), this.actors.stop()]);
  }
}

export default RedisClient;
