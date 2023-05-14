import { RawActor, Actor, RawMainActor, MainActor, RawTitle, Title, RedisClient } from '../types';
import { initializeClient } from '../utils/redis';
import { WriteStream, createWriteStream } from 'node:fs';
import fastq from 'fastq';
import os from 'os';
import { closeWriteStream, writeToStream } from '../utils/streams';

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
  const queue: fastq.queue<Task> = fastq.promise(exportNormalizedEntity, concurrency);

  const initialTime = Date.now();

  for await (const key of client.scanIterator({ MATCH: '*' })) {
    queue.push({ client, key, writeStream, normalizeEntity });
  }

  while (queue.length() > 0) {
    await queue.drain();
  }
  await closeWriteStream(writeStream);

  const elapsedTime = Date.now() - initialTime;
  const elapsedTimeInSeconds = elapsedTime / 1000;
  const roundedElapsedTimeInSeconds = Math.round(elapsedTimeInSeconds * 100) / 100;
  console.log(`Exported ${numberOfExportedEntities} entities to ${fileName} in ${roundedElapsedTimeInSeconds}s.`);
}

export async function exportNormalizedTitles() {
  const client = await initializeClient({ database: 1 });

  await exportNormalizedEntitiesToFile<RawTitle, Title>(client, './titles.txt', (rawTitle) => ({
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

  await exportNormalizedEntitiesToFile<RawMainActor, MainActor>(client, './main-actors.txt', (rawMainActor) => ({
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

  await exportNormalizedEntitiesToFile<RawActor, Actor>(client, './actors.txt', (rawActor) => ({
    id: rawActor.nconst,
    primaryName: rawActor.primaryName,
    titles: rawActor.knownForTitles.split(','),
  }));

  await client.disconnect();
}
