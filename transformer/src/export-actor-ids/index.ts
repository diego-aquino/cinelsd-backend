import { initializeClient } from '../utils/redis';

import { withTrackedTime } from '../utils/time';
import { roundByDecimals } from '../utils/numbers';
import { createWriteStream } from 'node:fs';
import { closeWriteStream } from '../utils/streams';

async function main() {
  const actorClient = await initializeClient({ database: 3 });

  let numberOfExportedActors = 0;

  const elapsedTimeInSeconds = await withTrackedTime(async () => {
    const writeStream = createWriteStream('./actors.txt');

    for await (const actorId of actorClient.scanIterator({ MATCH: '*' })) {
      writeStream.write(`"${actorId}"\n`);
      numberOfExportedActors++;
    }

    await closeWriteStream(writeStream);
  });

  console.log(`Exported ${numberOfExportedActors} actor IDs in ${roundByDecimals(elapsedTimeInSeconds, 2)}s.`);

  await actorClient.disconnect();
}

main();
