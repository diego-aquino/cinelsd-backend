import { ServerContext } from '@/server';
import { FastifyInstance } from 'fastify';

abstract class Controller {
  constructor(protected context: ServerContext) {}

  protected abstract registerRoutes(server: FastifyInstance): Controller;
}

export default Controller;
