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
  doesScreenshotExist
} from "./urls";

var app = express();

app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.all("*", (req, res, next) => {
  console.log(req.method + " " + req.url);
  next();
});

app.get("/api/autocomplete", async function(req, res) {
  const query = req.query.query;
  const result = await autocomplete(query);

  res.status(200).json({
    result
  });
});

app.get("/api/search", async function(req, res) {
  const query = req.query.query;
  const start = parseInt(req.query.start, 10);

  res.status(200).json({
    result: await search(query, start ? start : 0, 15)
  });
});

app.get("/api/urls", function(req, res) {
  res.status(200).json({
    urls: getUrls()
  });
});

app.get("/api/screenshot", async function(req, res) {
  const url = req.query.url;
  res.sendFile(getUrlScreenshotPath(url));
});

app.delete("/api/urls", async function(req, res) {
  const url = req.query.url;
  await deleteUrl(url);

  res.status(200).json({
    success: true
  });
});

app.post("/api/urls", async function(req, res) {
  const url = req.body.url;
  const title = req.body.title;
  const description = req.body.description;

  if (typeof url !== "string") {
    res.status(400).send("Url in wrong format");
    return;
  }

  const success = await addOrSetUrl(url, title, description);
  res.status(200).json(success);
});

// start app ===============================================
app.listen(3000, () => {
  console.log("Express server listening on port %d.", 3000);
});
