import { benchmark } from "@thi.ng/bench";
import fs from "fs";
import path from 'path';
import Pbf from "pbf";
import { fileURLToPath } from 'url';
import { deserialize, serialize } from "v8";

import * as topobuf from "../index.js";


const __filename = fileURLToPath(import.meta.url);

// Create serialized data to use in benchmark
const json = JSON.parse(fs.readFileSync(path.dirname(__filename) + "/fixtures/de-census-blocks.json"));
fs.writeFileSync(path.dirname(__filename) + "/fixtures/de-census-blocks.pbf", topobuf.encode(json, new Pbf()));
fs.writeFileSync(path.dirname(__filename) + "/fixtures/de-census-blocks.buf", serialize(json));

function getJSON(name) {
  return JSON.parse(fs.readFileSync(path.dirname(__filename) + "/fixtures/" + name));
}

// Benchmark tests
function runDecode() {
  topobuf.decode(new Pbf(fs.readFileSync(path.dirname(__filename) + "/fixtures/de-census-blocks.pbf")));
}

function runDecodeV8() {
  deserialize(fs.readFileSync(path.dirname(__filename) + "/fixtures/de-census-blocks.buf"));
}

function runParse() {
  getJSON("de-census-blocks.json")
}

benchmark(runDecode, { title: "decode de census blocks (topobuf)", iter: 100, warmup: 5 });
benchmark(runDecodeV8, { title: "decode de census blocks (v8)", iter: 100, warmup: 5 });
benchmark(runParse, { title: "JSON.parse", iter: 100, warmup: 5 });