var topobuf = require("../"),
  Pbf = require("pbf"),
  test = require("tap").test,
  fs = require("fs");

var files = ["airports", "multi-line", "props", "no-transform", "simple", "us-states"];
for (var i = 0; i < files.length; i++) {
  test(
    "roundtrip TopoJSON: " + files[i],
    roundtripTest(getJSON(files[i] + ".topo.json"))
  );
}

function roundtripTest(geojson) {
  return function (t) {
    var resp = topobuf.decode(new Pbf(topobuf.encode(geojson, new Pbf())));
    t.same(resp, geojson);
    t.end();
  };
}

function getJSON(name) {
  return JSON.parse(fs.readFileSync(__dirname + "/fixtures/" + name));
}
