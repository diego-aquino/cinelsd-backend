import { initializeClient } from '../../utils/redis';
import fastq from 'fastq';
import os from 'os';

import { Actor, RedisClient } from '../../types';
import { withTrackedTime } from '../../utils/time';
import { roundByDecimals } from '../../utils/numbers';

interface CineLSDClients {
  movies: RedisClient;
  movieMainActors: RedisClient;
  actors: RedisClient;
}

interface ReferenceCheckTask {
  clients: CineLSDClients;
  actorKey: string;
}

interface ReferenceCheckTaskResult {
  numberOfRemovedActors: number;
  numberOfRemovedReferences: number;
}

async function removeBrokenMovieReferencesByActor(task: ReferenceCheckTask): Promise<ReferenceCheckTaskResult> {
  const { clients, actorKey } = task;

  const stringifiedActor = await clients.actors.get(actorKey);
  if (!stringifiedActor) {
    console.error(`Actor not found with key ${actorKey}.`);
    return { numberOfRemovedActors: 0, numberOfRemovedReferences: 0 };
  }

  const actor = JSON.parse(stringifiedActor) as Actor;
  const initialNumberOfMovies = actor.movies.length;

  const actorMovieResults = await Promise.all(
    actor.movies.map(async (movieId) => {
      const results = await Promise.all([clients.movies.get(movieId), clients.movieMainActors.get(movieId)]);
      return {
        id: movieId,
        exists: results.every((result) => result !== null),
      };
    }),
  );

  const existentMovieIds = actorMovieResults
    .filter((movieResult) => movieResult.exists)
    .map((movieResult) => movieResult.id);

  const finalNumberOfMovies = existentMovieIds.length;
  const numberOfReferenceToRemove = initialNumberOfMovies - finalNumberOfMovies;

  let numberOfRemovedActors = 0;

  if (numberOfReferenceToRemove > 0) {
    if (finalNumberOfMovies > 0) {
      actor.movies = existentMovieIds;
      const stringifiedUpdatedActor = JSON.stringify(actor);
      await clients.actors.set(actorKey, stringifiedUpdatedActor);
    } else {
      await clients.actors.del(actorKey);
      numberOfRemovedActors = 1;
    }
  }

  return {
    numberOfRemovedActors,
    numberOfRemovedReferences: numberOfReferenceToRemove,
  };
}

async function removeBrokenMovieReferences(clients: CineLSDClients) {
  const concurrency = os.cpus().length;
  const queue: fastq.queueAsPromised<ReferenceCheckTask> = fastq.promise(
    removeBrokenMovieReferencesByActor,
    concurrency,
  );

  const taskPromises: Promise<ReferenceCheckTaskResult>[] = [];
  let totalNumberOfRemovedReferences = 0;
  let totalNumberOfRemovedActors = 0;

  const elapsedTimeInSeconds = await withTrackedTime(async () => {
    for await (const actorKey of clients.actors.scanIterator({ MATCH: '*' })) {
      const taskPromise = queue.push({ clients, actorKey });
      taskPromises.push(taskPromise);
    }

    for (const taskResult of await Promise.all(taskPromises)) {
      totalNumberOfRemovedReferences += taskResult.numberOfRemovedReferences;
      totalNumberOfRemovedActors += taskResult.numberOfRemovedActors;
    }
  });

  const numberOfCheckedActors = taskPromises.length;

  console.log(
    `Checked ${numberOfCheckedActors} actors and removed ${totalNumberOfRemovedActors} actors and ${totalNumberOfRemovedReferences} broken references in ${roundByDecimals(
      elapsedTimeInSeconds,
      2,
    )}s.`,
  );
}

async function main() {
  const [movieClient, movieMainActorsClient, actorClient] = await Promise.all([
    initializeClient({ database: 1 }),
    initializeClient({ database: 2 }),
    initializeClient({ database: 3 }),
  ]);

  await removeBrokenMovieReferences({
    movies: movieClient,
    movieMainActors: movieMainActorsClient,
    actors: actorClient,
  });

  await Promise.all([movieClient.disconnect(), movieMainActorsClient.disconnect(), actorClient.disconnect()]);
}

main();
