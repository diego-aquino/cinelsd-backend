import Piscina from 'piscina';
import path from 'node:path';

async function main() {
  const piscina = new Piscina({
    filename: path.resolve(__dirname, 'worker.ts'),
  });

  await Promise.all([
    piscina.run({}, { name: 'importNormalizedMovies' }),
    piscina.run({}, { name: 'importNormalizedMovieMainActors' }),
    piscina.run({}, { name: 'importNormalizedActors' }),
  ]);
}

main();
