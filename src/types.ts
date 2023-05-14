import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export interface RawTitle {
  tconst: string;
  primaryTitle: string;
  averageRating: number;
  numVotes: number;
  startYear: `${number}`;
  runtimeMinutes?: `${number}`;
  genres: string;
}

export interface Title {
  id: string;
  primaryTitle: string;
  averageRating: number;
  numberOfVotes: number;
  lengthInMinutes: number | null;
  startYear: number;
  genres: string;
}

export interface RawMainActor {
  tconst: string;
  actors: {
    tconst: string;
    ordering: number;
    nconst: string;
    category: string;
    characters: string;
  }[];
}

export interface MainActor {
  id: string;
  actors: {
    id: string;
    ordering: number;
    category: string;
    characters: string[];
  }[];
}

export interface RawActor {
  nconst: string;
  primaryName: string;
  knownForTitles: string;
}

export interface Actor {
  id: string;
  primaryName: string;
  titles: string[];
}
