import Piscina from 'piscina';
import path from 'node:path';

async function main() {
  const piscina = new Piscina({
    filename: path.resolve(__dirname, 'worker.ts'),
    maxThreads: 1,
  });

  await Promise.all([
    piscina.run({}, { name: 'importNormalizedTitles' }),
    piscina.run({}, { name: 'importNormalizedMainActors' }),
    piscina.run({}, { name: 'importNormalizedActors' }),
  ]);
}

main();
