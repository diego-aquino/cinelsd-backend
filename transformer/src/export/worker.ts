import { RawActor, Actor, RawMovieMainActors, MovieMainActors, RawMovie, Movie, RedisClient } from '../types';
import { initializeClient } from '../utils/redis';
import { WriteStream, createWriteStream } from 'node:fs';
import fastq from 'fastq';
import os from 'os';
import { closeWriteStream, writeToStream } from '../utils/streams';
import { roundByDecimals } from '../utils/numbers';
import { withTrackedTime } from '../utils/time';

function parseStringifiedRawEntity<ParsedValue>(stringifiedRawEntity: string) {
  return eval(`(${stringifiedRawEntity})`) as ParsedValue;
}

interface ExportNormalizedEntityTask<RawEntity, Entity> {
  client: RedisClient;
  key: string;
  writeStream: WriteStream;
  normalizeEntity: (rawEntity: RawEntity) => Entity;
}

async function exportNormalizedEntity<RawEntity, Entity>(task: ExportNormalizedEntityTask<RawEntity, Entity>) {
  const { client, key, writeStream, normalizeEntity } = task;

  const stringifiedRawEntity = await client.get(key);
  if (stringifiedRawEntity === null) {
    return;
  }

  const rawEntity = parseStringifiedRawEntity<RawEntity>(stringifiedRawEntity);
  const normalizedEntity = normalizeEntity(rawEntity);
  await writeToStream(writeStream, JSON.stringify(normalizedEntity) + '\n');
}

async function exportNormalizedEntitiesToFile<RawEntity, Entity>(
  client: RedisClient,
  fileName: string,
  normalizeEntity: (rawEntity: RawEntity) => Entity,
) {
  const writeStream = createWriteStream(fileName);
  writeStream.on('error', (error) => console.error(error));

  type Task = ExportNormalizedEntityTask<RawEntity, Entity>;

  const concurrency = os.cpus().length;
  const queue: fastq.queueAsPromised<Task> = fastq.promise(exportNormalizedEntity, concurrency);

  const taskPromises: Promise<void>[] = [];

  const elapsedTimeInSeconds = await withTrackedTime(async () => {
    for await (const key of client.scanIterator({ MATCH: '*' })) {
      const taskPromise = queue.push({ client, key, writeStream, normalizeEntity });
      taskPromises.push(taskPromise);
    }

    await Promise.all(taskPromises);
    await closeWriteStream(writeStream);
  });

  const numberOfExportedEntities = taskPromises.length;

  console.log(
    `Exported ${numberOfExportedEntities} entities to ${fileName} in ${roundByDecimals(elapsedTimeInSeconds, 2)}s.`,
  );
}

export async function exportNormalizedMovies() {
  const client = await initializeClient({ database: 1 });

  await exportNormalizedEntitiesToFile<RawMovie, Movie>(client, './local/movies.txt', (rawMovie) => ({
    id: rawMovie.tconst,
    title: rawMovie.primaryTitle,
    averageRating: rawMovie.averageRating,
    numberOfVotes: rawMovie.numVotes,
    startYear: Number(rawMovie.startYear),
    lengthInMinutes: rawMovie.runtimeMinutes ? Number(rawMovie.runtimeMinutes) : null,
    genres: rawMovie.genres.split(','),
  }));

  await client.disconnect();
}

export async function exportNormalizedMovieMainActors() {
  const client = await initializeClient({ database: 2 });

  await exportNormalizedEntitiesToFile<RawMovieMainActors, MovieMainActors>(
    client,
    './local/movie-main-actors.txt',
    (rawMovieMainActors) => ({
      id: rawMovieMainActors.tconst,
      actors: rawMovieMainActors.actors.map((rawActor) => ({
        id: rawActor.nconst,
        ordering: rawActor.ordering,
        category: rawActor.category,
        characters: /\N/.test(rawActor.characters) ? [] : (JSON.parse(rawActor.characters) as string[]),
      })),
    }),
  );

  await client.disconnect();
}

export async function exportNormalizedActors() {
  const client = await initializeClient({ database: 3 });

  await exportNormalizedEntitiesToFile<RawActor, Actor>(client, './local/actors.txt', (rawActor) => ({
    id: rawActor.nconst,
    name: rawActor.primaryName,
    movies: rawActor.knownForTitles.split(','),
  }));

  await client.disconnect();
}
