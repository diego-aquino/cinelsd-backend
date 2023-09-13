import { environment } from './config/environment';
import Server from './server';

const server = new Server();
server.start(environment.PORT);

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
