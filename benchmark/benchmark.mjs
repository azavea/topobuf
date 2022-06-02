import { suite, FORMAT_MD } from "@thi.ng/bench";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import fetch from "node-fetch";
import path from "path";
import Pbf from "pbf";
import { fileURLToPath } from "url";

import * as topobuf from "../index.js";

const __filename = fileURLToPath(import.meta.url);

const states = {
  de: "DE/2021-08-13T09:33:21.756Z",
  nj: "NJ/2021-09-28T15:16:51.806Z",
  pa: "PA/2021-08-13T13:08:34.609Z",
};

const filepath = state =>
  path.join(path.dirname(__filename), `${state}-topo.json`);

const data = await Promise.all(
  Object.keys(states).map(state =>
    existsSync(filepath(state))
      ? readFile(filepath(state), { encoding: "utf-8" }).then(raw => [
          state,
          raw,
        ])
      : fetch(
          `https://global-districtbuilder-dev-us-east-1.s3.amazonaws.com/regions/US/${states[state]}/topo.json`
        )
          .then(resp => resp.text())
          .then(raw =>
            writeFile(filepath(state), raw, { encoding: "utf-8" }).then(
              () => raw
            )
          )
          .then(raw => [state, raw])
  )
);

suite(
  data.flatMap(([state, raw]) => {
    // Create serialized data to use in benchmark
    const json = JSON.parse(raw);
    const buf = topobuf.encode(json, new Pbf());

    // Benchmark tests
    function runDecode() {
      topobuf.decode(new Pbf(buf));
    }

    function runParse() {
      JSON.parse(raw);
    }
    return [
      { title: `topobuf&nbsp;${state}`, fn: runDecode },
      { title: `JSON.parse&nbsp;${state}`, fn: runParse },
    ];
  }),
  {
    format: FORMAT_MD,
    warmup: 5,
    iter: 100,
  }
);
