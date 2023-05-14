import { RedisClientOptions, createClient } from 'redis';

export async function initializeClient(options?: RedisClientOptions) {
  const client = createClient(options);

  client.on('error', (error) => {
    console.error('[redis]', error);
  });

  await client.connect();

  return client;
}
