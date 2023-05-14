export async function withTrackedTime(callback: () => Promise<void> | void) {
  const initialTime = Date.now();

  await callback();

  const elapsedTime = Date.now() - initialTime;
  const elapsedTimeInSeconds = elapsedTime / 1000;
  return elapsedTimeInSeconds;
}
