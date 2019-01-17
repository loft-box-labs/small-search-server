import * as fs from "fs";
import { CrawlUrls } from "./crawler";
import { searchRepl } from "./searcher";
import { readFileAsPromise } from "./util";

async function main(filename: string) {
  let urls: string[];
  try {
    urls = (await readFileAsPromise(filename)).split("\n");
  } catch (e) {
    console.error("There was a problem reading the urls file");
    console.error(e);
    process.exit(1);
  }

  const crawledUrls = await CrawlUrls(urls);
  searchRepl(crawledUrls);
}

if (process.argv.length !== 3) {
  console.error(`Usage: ${process.argv[1]} [urls file]`);
  process.exit(1);
}
main(process.argv[2]);
