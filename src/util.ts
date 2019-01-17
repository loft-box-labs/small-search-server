import * as fs from "fs";

export function readFileAsPromise(filename: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.toString());
    });
  });
}

export function doesFileExist(filename: string): Promise<Boolean> {
  return new Promise<Boolean>((resolve, reject) => {
    fs.exists(filename, exists => resolve(exists));
  });
}
