import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export interface RawMovie {
  tconst: string;
  primaryTitle: string;
  averageRating: number;
  numVotes: number;
  startYear: `${number}`;
  runtimeMinutes?: `${number}`;
  genres: string;
}

export interface Movie {
  id: string;
  title: string;
  averageRating: number;
  numberOfVotes: number;
  lengthInMinutes: number | null;
  startYear: number;
  genres: string[];
}

interface RawMovieMainActor {
  tconst: string;
  ordering: number;
  nconst: string;
  category: string;
  characters: string;
}

export interface RawMovieMainActors {
  tconst: string;
  actors: RawMovieMainActor[];
}

interface MovieMainActor {
  id: string;
  ordering: number;
  category: string;
  characters: string[];
}

export interface MovieMainActors {
  id: string;
  actors: MovieMainActor[];
}

export interface RawActor {
  nconst: string;
  primaryName: string;
  knownForTitles: string;
}

export interface Actor {
  id: string;
  name: string;
  movies: string[];
}
