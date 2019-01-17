import fetch from "node-fetch";
let PromiseThrottler = require("promise-throttle");
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import { doesFileExist, readFileAsPromise } from "./util";
import * as lunr from "lunr";

type UrlData = { [url: string]: string };

const CacheDir = "cached";

function processText(str: string): string {
  return str.replace(/\s+/g, " ");
}

async function crawlUrl(url: string) {
  const hashedUrl = crypto
    .createHash("md5")
    .update(url)
    .digest("hex");

  const cachePath = path.join(CacheDir, hashedUrl);
  const cacheExists = await doesFileExist(cachePath);
  if (cacheExists) {
    console.log(`Reading ${url} from cache`);
    return readFileAsPromise(cachePath);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Response got bad status: ${
        response.status
      } (${response.statusText.substr(0, 512)})`
    );
  }
  const text = processText(await response.text());

  return new Promise<string>((resolve, reject) => {
    fs.writeFile(cachePath, text, err => {
      if (err) {
        reject(err);
        return;
      }
      resolve(text);
    });
  });
}

async function getAllTextNodes(root: Cheerio) {
  return root.text();
}

export async function CrawlUrls(
  urls: string[]
): Promise<{ [url: string]: string }> {
  const cacheDirExists = await doesFileExist(CacheDir);
  if (!cacheDirExists) {
    await new Promise<void>((resolve, reject) =>
      fs.mkdir(CacheDir, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      })
    );
  }

  const throttler = new PromiseThrottler({
    requestsPerSecond: 50,
    promiseImplementation: Promise
  });

  const allData = await Promise.all(
    urls.map(async url => {
      const rawHtml = await throttler.add(() => crawlUrl(url));
      const parsed = cheerio.load(rawHtml);

      return getAllTextNodes(parsed.root());
    })
  );

  const retMap: { [url: string]: string } = {};
  allData.forEach((text, i) => (retMap[urls[i]] = text));

  return retMap;
}
