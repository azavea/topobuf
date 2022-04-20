# Topobuf

[![Build Status](https://app.travis-ci.com/azavea/topobuf.svg?branch=main)](https://travis-ci.org/azavea/topobuf)

Topobuf is a compact binary encoding for topological data.

Topobuf provides _lossless_[^1] compression of [TopoJSON](https://github.com/topojson/topojson) data into [protocol buffers](https://developers.google.com/protocol-buffers/).
Advantages over using JSON-based formats alone:

- **Very compact**: typically makes TopoJSON 2-3 times smaller.
- Smaller even when comparing gzipped sizes: 20-30% for TopoJSON.
- Can store topology objects too large for `JSON.stringify` / `JSON.parse`
- Can accommodate any TopoJSON data, including extensions with arbitrary properties.

#### Sample compression sizes
|                       | normal   | gzipped |
|-----------------------|----------|---------|
| pa-census-blocks.json | 280 MB   | 44 MB   |
| pa-census-blocks.pbf  | 114 MB   | 35 MB   |
| us-zips.json          | 15.02 MB | 3.19 MB |
| us-zips.pbf           | 4.85 MB  | 2.72 MB |
| idaho.json            | 1.9 MB   | 612 KB  |
| idaho.pbf             | 567 KB   | 479 KB  |


## Install

```bash
npm install topobuf
```

## API

### encode

```js
var buffer = topobuf.encode(topojson, new Pbf());
```

Given a TopoJSON object and a [Pbf](https://github.com/mapbox/pbf) object to write to,
returns a Topobuf as a `Buffer` object in Node or `UInt8Array` object in browsers.

### decode

```js
var topojson = topobuf.decode(new Pbf(data));
```

Given a [Pbf](https://github.com/mapbox/pbf) object with topobuf data, return a TopoJSON object.

## See more

This library is based on [`geobuf`](https://github.com/mapbox/geobuf) by Mapbox, which provides similar functionality for GeoJSON

[^1]: When using [quantized TopoJSON](https://github.com/topojson/topojson-client/blob/master/README.md#quantize) - _nearly lossless_ otherwise
