import os from 'os';
import fastq from 'fastq';
import { createReadStream } from 'node:fs';
import readline from 'node:readline/promises';

import { initializeClient } from '../utils/redis';
import { closeReadStream } from '../utils/streams';
import { withTrackedTime } from '../utils/time';
import { roundByDecimals } from '../utils/numbers';
import { Actor, MovieMainActors, RedisClient, Movie } from '../types';

interface ImportNormalizedEntityTask<Entity> {
  client: RedisClient;
  entity: Entity;
}

async function importNormalizedEntity<Entity extends { id: string }>(task: ImportNormalizedEntityTask<Entity>) {
  const { client, entity } = task;
  const stringifiedEntity = JSON.stringify(entity);
  await client.set(entity.id, stringifiedEntity);
}

async function importNormalizedEntitiesFromFile<Entity extends { id: string }>(client: RedisClient, fileName: string) {
  const readStream = createReadStream(fileName);
  readStream.on('error', (error) => console.error(error));

  const entityReader = readline.createInterface({ input: readStream });

  type Task = ImportNormalizedEntityTask<Entity>;
  const concurrency = os.cpus().length;
  const queue: fastq.queueAsPromised<Task> = fastq.promise(importNormalizedEntity, concurrency);

  const taskPromises: Promise<void>[] = [];

  const elapsedTimeInSeconds = await withTrackedTime(async () => {
    for await (const stringifiedEntity of entityReader) {
      const entity = JSON.parse(stringifiedEntity) as Entity;
      const taskPromise = queue.push({ client, entity });
      taskPromises.push(taskPromise);
    }

    await Promise.all(taskPromises);
    await closeReadStream(readStream);
  });

  const numberOfImportedEntities = taskPromises.length;

  console.log(
    `Imported ${numberOfImportedEntities} entities from ${fileName} in ${roundByDecimals(elapsedTimeInSeconds, 2)}s.`,
  );
}

export async function importNormalizedMovies() {
  const client = await initializeClient({ database: 1 });
  await importNormalizedEntitiesFromFile<Movie>(client, './local/movies.txt');
  await client.disconnect();
}

export async function importNormalizedMovieMainActors() {
  const client = await initializeClient({ database: 2 });
  await importNormalizedEntitiesFromFile<MovieMainActors>(client, './local/movie-main-actors.txt');
  await client.disconnect();
}

export async function importNormalizedActors() {
  const client = await initializeClient({ database: 3 });
  await importNormalizedEntitiesFromFile<Actor>(client, './local/actors.txt');
  await client.disconnect();
}
