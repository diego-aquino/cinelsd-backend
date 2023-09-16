import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import Controller from '@/controllers/Controller';

const getMovieMainActorsSchema = z.object({
  movieId: z.string(),
});

class MovieMainActorController extends Controller {
  registerRoutes(server: FastifyInstance) {
    server.get('/movie-main-actors/:movieId', this.getByMovieId.bind(this));
  }

  async getByMovieId(request: FastifyRequest, reply: FastifyReply) {
    const { movieId } = getMovieMainActorsSchema.parse(request.params);

    const stringifiedMovieMainActors = await this.context.redis.movieMainActors.getStringifiedById(movieId);

    reply.header('Content-Type', 'application/json');
    await reply.send(stringifiedMovieMainActors);
  }
}

export default MovieMainActorController;
