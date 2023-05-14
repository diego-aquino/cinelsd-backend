import Piscina from 'piscina';
import path from 'node:path';

async function main() {
  const piscina = new Piscina({
    filename: path.resolve(__dirname, 'worker.ts'),
  });

  await Promise.all([
    piscina.run({}, { name: 'exportNormalizedTitles' }),
    piscina.run({}, { name: 'exportNormalizedMainActors' }),
    piscina.run({}, { name: 'exportNormalizedActors' }),
  ]);
}

main();
