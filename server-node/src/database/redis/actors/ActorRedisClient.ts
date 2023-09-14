import RedisEntityClient from '../RedisEntityClient';

class ActorClient extends RedisEntityClient {
  getStringifiedById(actorId: string) {
    return this.client.get(actorId);
  }
}

export default ActorClient;
