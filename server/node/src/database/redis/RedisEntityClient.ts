import { createClient as createRedisClient } from 'redis';

abstract class RedisEntityClient {
  protected client: ReturnType<typeof createRedisClient>;

  constructor(
    redisURL: string,
    options: {
      password?: string;
      database: number;
    },
  ) {
    this.client = createRedisClient({
      url: redisURL,
      password: options.password,
      database: options.database,
    });
  }

  async start() {
    await this.client.connect();
  }

  async stop() {
    await this.client.disconnect();
  }
}

export default RedisEntityClient;
