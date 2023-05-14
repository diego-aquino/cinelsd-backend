import { ReadStream, WriteStream } from 'node:fs';

export function writeToStream(stream: WriteStream, value: Buffer | string): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.write(value, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function closeWriteStream(stream: WriteStream): Promise<void> {
  return new Promise((resolve) => {
    stream.end('', resolve);
  });
}

export function closeReadStream(stream: ReadStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
