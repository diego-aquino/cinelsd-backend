import { ServerContext } from '@/server';
import { FastifyInstance } from 'fastify';

abstract class Controller {
  constructor(protected context: ServerContext) {}

  abstract registerRoutes(server: FastifyInstance): Promise<void> | void;
}

export default Controller;
