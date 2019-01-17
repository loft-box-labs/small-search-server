import * as puppeteer from "puppeteer";
import * as path from "path";
import * as cheerio from "cheerio";
import * as crypto from "crypto";
import * as fs from "fs";
import fetch from "node-fetch";
import { PrefixTree } from "./prefixSearch";

const browserPromise: Promise<puppeteer.Browser> = puppeteer.launch();

const urls: {
  [k: string]: {
    content: string;
    description: string;
    title: string;
  };
} = {};
const prefixTree = new PrefixTree();

function processText(str: string): string {
  return str.replace(/\s+/g, " ");
}

function getAllTextNodes(root: Cheerio) {
  return root.text();
}

async function sleep(ms: number) {
  await new Promise<void>((resolve, reject) => setTimeout(resolve, ms));
}

export function getUrlScreenshotPath(url: string) {
  return path.resolve(
    path.join(
      __dirname,
      "..",
      "screenshots",
      `${crypto
        .createHash("md5")
        .update(url)
        .digest("hex")}.png`
    )
  );
}

export async function doesScreenshotExist(url: string) {
  const path = getUrlScreenshotPath(url);
  return new Promise<boolean>((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

async function clearScreenshot(url: string) {
  return new Promise<void>((resolve, reject) => {
    fs.unlink(getUrlScreenshotPath(url), err => {
      resolve();
    });
  });
}

async function screenshot(url: string) {
  await sleep(Math.random() * 8000 + 3000);
  const browser = await browserPromise;
  const page = await browser.newPage();
  await new Promise<void>((resolve, reject) => {
    fs.mkdir("screenshots", err => {
      if (err && err.code !== "EEXIST") {
        reject(err);
        return;
      }
      resolve();
    });
  });
  await page.goto(url);
  await page.screenshot({ path: getUrlScreenshotPath(url) });
  console.log(`Screenshotted ${url}`);
}

export async function addOrSetUrl(
  url: string,
  title: string | undefined,
  description: string | undefined
) {
  if (url in urls) {
    const delay = Math.random() * 3000 + 1000;
    await sleep(delay);

    const val = urls[url];
    if (Boolean(title)) {
      val.title = title;
    }
    if (Boolean(description)) {
      val.description = description;
    }
    return {
      ok: true
    };
  }

  await clearScreenshot(url);

  const delay = Math.random() * 7000 + 2000;
  await sleep(delay);

  try {
    screenshot(url).catch(e => console.error(e));

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Response got bad status: ${
          response.status
        } (${response.statusText.substr(0, 512)})`
      );
    }

    const rawHtml = processText(await response.text());
    const parsed = cheerio.load(rawHtml);

    const text = getAllTextNodes(parsed.root());
    urls[url] = {
      content: text,
      title: Boolean(title) ? title : "",
      description: Boolean(description) ? description : ""
    };

    const words = text.split(" ");
    words.forEach(word => prefixTree.add(word));
  } catch (e) {
    console.error(e);
    return {
      ok: false
    };
  }

  return {
    ok: true
  };
}

export async function deleteUrl(url: string) {
  const delay = Math.random() * 2000 + 1000;
  await sleep(delay);
  delete urls[url];
}

export function getUrls() {
  const out: { [k: string]: { description: string; title: string } } = {};
  Object.keys(urls).forEach(url => {
    out[url] = {
      description: urls[url].description,
      title: urls[url].title
    };
  });
  return out;
}

interface IQueryResult {
  queryPosition: [number, number];
  snippet: string;
  url: string;
}

export async function search(
  query: string,
  start: number,
  max: number
): Promise<IQueryResult[]> {
  const delay = Math.random() * 3000 + 1000;
  await sleep(delay);

  let numFound = 0;

  const results: IQueryResult[] = [];
  Object.keys(urls).forEach(url => {
    const page = urls[url];
    const content = page.content;

    let searchIndex: number = 0;
    while (true) {
      if (results.length >= max) {
        return;
      }

      searchIndex = content.indexOf(query, searchIndex);
      if (searchIndex === -1) {
        break;
      }

      const startIndex = Math.max(0, searchIndex - 100);
      const endIndex = Math.min(content.length, searchIndex + 100);
      searchIndex += query.length;

      numFound++;
      if (numFound >= start) {
        results.push({
          queryPosition: [searchIndex - startIndex, endIndex - startIndex],
          snippet: content.substr(startIndex, endIndex - startIndex),
          url
        });
      }
    }
  });

  return results;
}

export async function autocomplete(query: string) {
  return prefixTree.autocomplete(query);
}
