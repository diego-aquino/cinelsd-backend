import { RawActor, Actor, RawMainActor, MainActor, RawTitle, Title, RedisClient } from '../types';
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

let numberOfExportedEntities = 0;

async function exportNormalizedEntity<RawEntity, Entity>(task: ExportNormalizedEntityTask<RawEntity, Entity>) {
  const { client, key, writeStream, normalizeEntity } = task;

  const stringifiedRawEntity = await client.get(key);
  if (stringifiedRawEntity === null) {
    return;
  }

  const rawEntity = parseStringifiedRawEntity<RawEntity>(stringifiedRawEntity);
  const normalizedEntity = normalizeEntity(rawEntity);
  await writeToStream(writeStream, JSON.stringify(normalizedEntity) + '\n');

  numberOfExportedEntities++;
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

export async function exportNormalizedTitles() {
  const client = await initializeClient({ database: 1 });

  await exportNormalizedEntitiesToFile<RawTitle, Title>(client, './local/titles.txt', (rawTitle) => ({
    id: rawTitle.tconst,
    primaryTitle: rawTitle.primaryTitle,
    averageRating: rawTitle.averageRating,
    numberOfVotes: rawTitle.numVotes,
    startYear: Number(rawTitle.startYear),
    lengthInMinutes: rawTitle.runtimeMinutes ? Number(rawTitle.runtimeMinutes) : null,
    genres: rawTitle.genres,
  }));

  await client.disconnect();
}

export async function exportNormalizedMainActors() {
  const client = await initializeClient({ database: 2 });

  await exportNormalizedEntitiesToFile<RawMainActor, MainActor>(client, './local/main-actors.txt', (rawMainActor) => ({
    id: rawMainActor.tconst,
    actors: rawMainActor.actors.map((rawActor) => ({
      id: rawActor.nconst,
      ordering: rawActor.ordering,
      category: rawActor.category,
      characters: rawActor.characters.split(','),
    })),
  }));

  await client.disconnect();
}

export async function exportNormalizedActors() {
  const client = await initializeClient({ database: 3 });

  await exportNormalizedEntitiesToFile<RawActor, Actor>(client, './local/actors.txt', (rawActor) => ({
    id: rawActor.nconst,
    primaryName: rawActor.primaryName,
    titles: rawActor.knownForTitles.split(','),
  }));

  await client.disconnect();
}
