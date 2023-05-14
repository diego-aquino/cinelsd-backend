import { initializeClient } from '../utils/redis';
import { createReadStream } from 'node:fs';
import readline from 'node:readline/promises';
import fastq from 'fastq';
import os from 'os';

import { Actor, MainActor, RedisClient, Title } from '../types';
import { closeReadStream } from '../utils/streams';

let numberOfImportedEntities = 0;

interface ImportNormalizedEntityTask<Entity> {
  client: RedisClient;
  entity: Entity;
}

async function importNormalizedEntity<Entity extends { id: string }>(task: ImportNormalizedEntityTask<Entity>) {
  const { client, entity } = task;
  const stringifiedTitle = JSON.stringify(entity);
  await client.set(entity.id, stringifiedTitle);

  const savedEntity = await client.get(entity.id);
  if (savedEntity === null) {
    throw new Error(`Failed to save entity ${entity.id}.`);
  }

  numberOfImportedEntities++;
}

async function importNormalizedEntitiesFromFile<Entity extends { id: string }>(client: RedisClient, fileName: string) {
  const readStream = createReadStream(fileName);
  readStream.on('error', (error) => console.error(error));

  const entityReader = readline.createInterface({ input: readStream });

  type Task = ImportNormalizedEntityTask<Entity>;
  const concurrency = os.cpus().length;
  const queue: fastq.queue<Task> = fastq.promise(importNormalizedEntity, concurrency);

  const initialTime = Date.now();

  for await (const stringifiedEntity of entityReader) {
    const entity = JSON.parse(stringifiedEntity) as Entity;
    queue.push({ client, entity });
  }

  while (queue.length() > 0) {
    await queue.drain();
  }
  await closeReadStream(readStream);

  const elapsedTime = Date.now() - initialTime;
  const elapsedTimeInSeconds = elapsedTime / 1000;
  const roundedElapsedTimeInSeconds = Math.round(elapsedTimeInSeconds * 100) / 100;
  console.log(`Imported ${numberOfImportedEntities} entities from ${fileName} in ${roundedElapsedTimeInSeconds}s.`);
}

export async function importNormalizedTitles() {
  const client = await initializeClient({ database: 1 });
  await importNormalizedEntitiesFromFile<Title>(client, './titles.txt');
  await client.disconnect();
}

export async function importNormalizedMainActors() {
  const client = await initializeClient({ database: 2 });
  await importNormalizedEntitiesFromFile<MainActor>(client, './main-actors.txt');
  await client.disconnect();
}

export async function importNormalizedActors() {
  const client = await initializeClient({ database: 3 });
  await importNormalizedEntitiesFromFile<Actor>(client, './actors.txt');
  await client.disconnect();
}
