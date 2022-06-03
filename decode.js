'use strict';

module.exports = decode;

var keys, values, lengths, dim, e, transformed, names, prevP;

var geometryTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString',
                      'Polygon', 'MultiPolygon', 'GeometryCollection'];

function decode(pbf) {
    dim = 2;
    e = Math.pow(10, 6);
    transformed = false;
    lengths = null;

    keys = [];
    values = [];
    var obj = pbf.readFields(readDataField, {});
    keys = null;

    return obj;
}

function readDataField(tag, obj, pbf) {
    if (tag === 1) keys.push(pbf.readString());
    else if (tag === 2) dim = pbf.readVarint();
    else if (tag === 3) e = Math.pow(10, pbf.readVarint());

    else if (tag === 4) readTopology(pbf, obj);
}

function readGeometry(pbf, geom) {
    return pbf.readMessage(readGeometryField, geom);
}

function readTopology(pbf, topology) {
    topology.type = 'Topology';
    topology.objects = {};
    topology.arcs = [];
    names = [];
    prevP = new Array(dim);
    pbf.readMessage(readTopologyField, topology);
    names = null;
    prevP = null;
    return topology;
}

function readTopologyField(tag, topology, pbf) {
    if (tag === 1) {
        topology.transform = pbf.readMessage(readTransformField, {scale: [], translate: []});
        transformed = true;
    }
    else if (tag === 2) names.push(pbf.readString());
    else if (tag === 3) topology.objects[names.shift()] = pbf.readMessage(readGeometryField, {});

    else if (tag === 4) lengths = pbf.readPackedVarint();
    else if (tag === 5) topology.arcs = readArcs(pbf);

    else if (tag === 13) values.push(readValue(pbf));
    else if (tag === 15) readProps(pbf, topology);
}

function readGeometryField(tag, geom, pbf) {
    if (tag === 1) geom.type = geometryTypes[pbf.readVarint()];

    else if (tag === 2) lengths = pbf.readPackedVarint();
    else if (tag === 3) readCoords(geom, pbf, geom.type);
    else if (tag === 4) {
        geom.geometries = geom.geometries || [];
        geom.geometries.push(readGeometry(pbf, {}));
    }

    else if (tag === 11) geom.id = pbf.readString();
    else if (tag === 12) geom.id = pbf.readSVarint();

    else if (tag === 13) values.push(readValue(pbf));
    else if (tag === 14) geom.properties = readProps(pbf, {});
    else if (tag === 15) readProps(pbf, geom);
}

function readCoords(geom, pbf, type) {
    if (type === 'Point') geom.coordinates = readPoint(pbf);
    else if (type === 'MultiPoint') geom.coordinates = readLine(pbf, true);
    else if (type === 'LineString') geom.arcs = readLine(pbf);
    else if (type === 'MultiLineString' || type === 'Polygon') geom.arcs = readMultiLine(pbf);
    else if (type === 'MultiPolygon') geom.arcs = readMultiPolygon(pbf);
}

function readValue(pbf) {
    var end = pbf.readVarint() + pbf.pos,
        value = null;

    while (pbf.pos < end) {
        var val = pbf.readVarint(),
            tag = val >> 3;

        if (tag === 1) value = pbf.readString();
        else if (tag === 2) value = pbf.readDouble();
        else if (tag === 3) value = pbf.readVarint();
        else if (tag === 4) value = -pbf.readVarint();
        else if (tag === 5) value = pbf.readBoolean();
        else if (tag === 6) value = JSON.parse(pbf.readString());
    }
    return value;
}

function readProps(pbf, props) {
    var end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) props[keys[pbf.readVarint()]] = values[pbf.readVarint()];
    values = [];
    return props;
}

function readTransformField(tag, tr, pbf) {
    if (tag === 1) tr.scale[0] = pbf.readDouble();
    else if (tag === 2) tr.scale[1] = pbf.readDouble();
    else if (tag === 3) tr.translate[0] = pbf.readDouble();
    else if (tag === 4) tr.translate[1] = pbf.readDouble();
}

function readPoint(pbf) {
    var end = pbf.readVarint() + pbf.pos,
        coords = [];
    while (pbf.pos < end) coords.push(transformCoord(pbf.readSVarint()));
    return coords;
}

function readLinePart(pbf, end, len, isMultiPoint) {
    var i = 0,
        coords = len ? new Array(len) : [],
        p, d;

    if (!isMultiPoint) {
        p = 0;
        while (len ? i < len : pbf.pos < end) {
            p += pbf.readSVarint();
            coords[i] = p;
            i++;
        }

    } else {
        for (d = 0; d < dim; d++) prevP[d] = 0;

        while (len ? i < len : pbf.pos < end) {
            p = new Array(dim);
            for (d = 0; d < dim; d++) {
                prevP[d] += pbf.readSVarint();
                p[d] = transformCoord(prevP[d]);
            }
            coords[i] = p;
            i++;
        }
    }

    return coords;
}

function readLine(pbf, isMultiPoint) {
    return readLinePart(pbf, pbf.readVarint() + pbf.pos, null, isMultiPoint);
}

function readMultiLine(pbf) {
    var end = pbf.readVarint() + pbf.pos;
    if (!lengths) return [readLinePart(pbf, end)];

    var len = lengths.length,
        coords = new Array(len);
    for (var i = 0; i < len; i++) coords[i] = readLinePart(pbf, end, lengths[i]);
    lengths = null;
    return coords;
}

function readMultiPolygon(pbf) {
    var end = pbf.readVarint() + pbf.pos;
    if (!lengths) return [[readLinePart(pbf, end)]];

    var len = lengths[0];
    var coords = new Array(len);
    var j = 1;
    for (var i = 0; i < len; i++) {
        var rlen = lengths[j],
            rings = new Array(rlen);
        for (var k = 0; k < rlen; k++) rings[k] = readLinePart(pbf, end, lengths[j + 1 + k]);
        j += lengths[j] + 1;
        coords[i] = rings;
    }
    lengths = null;
    return coords;
}

function readArcs(pbf) {
    var len = lengths.length,
        lines = new Array(len),
        end = pbf.readVarint() + pbf.pos;

    for (var i = 0; i < len; i++) {
        var rlen = lengths[i],
            ring = new Array(rlen);
        for (var j = 0; j < rlen; j++) {
            var p = new Array(dim);
            for (var d = 0; d < dim && pbf.pos < end; d++) p[d] = transformCoord(pbf.readSVarint());
            ring[j] = p;
        }
        lines[i] = ring;
    }

    return lines;
}

function transformCoord(x) {
    return transformed ? x : x / e;
}
