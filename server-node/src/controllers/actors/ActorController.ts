import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import Controller from '@/controllers/Controller';

const getActorByIdSchema = z.object({
  actorId: z.string(),
});

class ActorController extends Controller {
  registerRoutes(server: FastifyInstance) {
    server.get('/actors/:actorId', this.getById.bind(this));
    return this;
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { actorId } = getActorByIdSchema.parse(request.params);

    const stringifiedActor = await this.context.redis.actors.getStringifiedById(actorId);

    reply.header('Content-Type', 'application/json');
    await reply.send(stringifiedActor);
  }
}

export default ActorController;
