import fastify from 'fastify';
import crypto from 'crypto';

const SERVER_NAME = crypto.randomUUID();
const PORT = Number(process.env.PORT);

async function startServer() {
  const app = fastify({ logger: true });

  app.get('/', async () => {
    return { serverName: SERVER_NAME };
  });

  await app.listen({ host: '0.0.0.0', port: PORT });
}

startServer();
