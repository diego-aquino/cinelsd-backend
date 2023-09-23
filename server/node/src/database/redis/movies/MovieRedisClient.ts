import RedisEntityClient from '../RedisEntityClient';

class MovieClient extends RedisEntityClient {
  getStringifiedById(movieId: string) {
    return this.client.get(movieId);
  }
}

export default MovieClient;
