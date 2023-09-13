import RedisEntityClient from '../RedisEntityClient';

class MovieMainActorClient extends RedisEntityClient {
  getStringifiedById(movieMainActorId: string) {
    return this.client.get(movieMainActorId);
  }
}

export default MovieMainActorClient;
