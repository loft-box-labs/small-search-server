import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { PrefixTree } from "./prefixSearch";

const FETCH_ERROR_RATE = 0.2;
const DELAY_MS = 8000;

const urls: { [k: string]: string } = {};
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

export async function addUrl(url: string) {
  const delay = Math.random() * DELAY_MS + 2000;
  await sleep(delay);

  if (Math.random() <= FETCH_ERROR_RATE) {
    return false;
  }

  try {
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
    urls[url] = text;

    const words = text.split(" ");
    words.forEach(word => prefixTree.add(word));
  } catch (e) {
    console.error(e);
    return false;
  }

  return true;
}

export async function deleteUrl(url: string) {
  const delay = Math.random() * 2000 + 1000;
  await sleep(delay);
  delete urls[url];
}

export function getUrls(): string[] {
  return Object.keys(urls);
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
    const content = urls[url];

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
