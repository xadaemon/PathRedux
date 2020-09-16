import Path from "./mod.ts";
import { genTmpPath } from "./mod.js";

const path = genTmpPath();
console.log(path.toString());
