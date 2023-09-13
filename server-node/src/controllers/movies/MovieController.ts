import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import Controller from '@/controllers/Controller';

const getMovieByIdSchema = z.object({
  movieId: z.string(),
});

class MovieController extends Controller {
  registerRoutes(server: FastifyInstance) {
    server.get('/movies/:movieId', this.getById.bind(this));
    return this;
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { movieId } = getMovieByIdSchema.parse(request.params);

    const stringifiedMovie = await this.context.redis.movies.getStringifiedById(movieId);

    reply.header('Content-Type', 'application/json');
    await reply.send(stringifiedMovie);
  }
}

export default MovieController;
