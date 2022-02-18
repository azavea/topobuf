import Pbf = require('pbf');
import { Topology } from "topojson-specification";

export function decode(pbf: Pbf): Topology;
export function encode(obj: Topology, pbf: Pbf): Uint8Array;