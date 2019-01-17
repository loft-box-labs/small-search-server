var readline = require("readline");
import * as lunr from "lunr";

const CONTEXT_DISPLAY_LENGTH = 100;

export function searchRepl(urlToText: { [url: string]: string }) {
  const searchIndex = lunr(function() {
    this.ref("url");
    this.field("text");
    this.metadataWhitelist = ["position"];

    for (let [url, text] of Object.entries(urlToText)) {
      this.add({
        url,
        text
      });
    }
  });

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  console.log("Search: ");
  rl.on("line", function(line) {
    const matching = searchIndex.search(line);

    console.log("Results: ");
    matching.forEach(match => {
      const allText = urlToText[match.ref];

      console.log(match.ref);
      console.log("------------------------------");
      console.log(JSON.stringify(match.matchData.metadata));
      for (let [matchText, metadata] of Object.entries(
        match.matchData.metadata
      )) {
        metadata.text.position.forEach((pos: [number, number]) => {
          const charsBefore = console.log(
            "\x1b[33m%s\x1b[0m",
            `...${allText.substr(
              Math.max(pos[0] - CONTEXT_DISPLAY_LENGTH, 0),
              CONTEXT_DISPLAY_LENGTH * 2
            )}...`
          );
        });
        console.log("\n");
      }

      console.log("Search: ");
    });
  });
}
