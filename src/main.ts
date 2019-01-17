import * as fs from "fs";
import * as express from "express";
import * as bodyParser from "body-parser";
import {
  getUrls,
  search,
  autocomplete,
  deleteUrl,
  addOrSetUrl,
  getUrlScreenshotPath,
  load
} from "./urls";

/* some URLs that I like to index

https://en.wikipedia.org/wiki/Red_panda
https://en.wikipedia.org/wiki/Himalayas
https://en.wikipedia.org/wiki/Mountain
https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/
https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/
https://news.ycombinator.com

*/

async function run() {
  await load();

  var app = express();

  app.use(bodyParser.json()); // parse application/json
  app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  app.all("*", (req, res, next) => {
    console.log(req.method + " " + req.url);
    if (!req.get("Origin")) return next();

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
    res.set("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");

    if ("OPTIONS" == req.method) return res.send(200);
    next();
  });

  // very simple query autocompleter that's based on queries in the pages
  app.get("/api/autocomplete", async function(req, res) {
    const query = req.query.query;
    const result = await autocomplete(query);

    res.status(200).json({
      result
    });
  });

  // searches through website content and returns matches. format has a text snippet and the location of the query in
  // the snippet (if you want to highlight, for example)
  app.get("/api/search", async function(req, res) {
    const query = req.query.query;
    const start = parseInt(req.query.start, 10);

    res.status(200).json({
      result: await search(query, isNaN(start) ? start : 0, 15)
    });
  });

  // gets all URLs with metadata
  app.get("/api/urls", function(req, res) {
    res.status(200).json({
      urls: getUrls()
    });
  });

  // removes a URL from our set
  app.delete("/api/urls", async function(req, res) {
    const url = req.query.url;
    await deleteUrl(url);

    res.status(200).json({
      success: true
    });
  });

  /*
  add or update a URL with POST -- if the url exists and one or both of title/description is not undefined, it will
  perform an update, otherwise it will perform an insert

  this can take time to load and crawl a site! sometimes 3+ seconds. the request will hang while loading, so
  you may want to build around that in the UI
  */
  app.post("/api/urls", async function(req, res) {
    const url = req.body.url;
    const title = req.body.title;
    const description = req.body.description;

    if (typeof url !== "string") {
      res.status(400).send("Url in wrong format");
      return;
    }

    try {
      const success = await addOrSetUrl(url, title, description);
      res.status(200).json(success);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: e.message });
    }
  });

  // screenshots take time to post -- will return 404 for a bit and then will 200
  // with file data (can be shoved into an <img> tag) when the screenshot is ready
  app.get("/api/screenshot", async function(req, res) {
    const url = req.query.url;
    res.sendFile(getUrlScreenshotPath(url));
  });

  // start app ===============================================
  app.listen(4000, () => {
    console.log("Express server listening on port %d.", 4000);
  });
}

run().catch(e => console.error(e));
