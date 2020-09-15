import Path from "./mod.ts";
import { WINDOWS_SEPS } from "./Path.ts";

const winPath = new Path("C:\\Users\\Test\\Documents/myFile.v1.txt", WINDOWS_SEPS);
console.log(winPath.elements);
console.log(winPath.toString());
console.log(winPath.ext);
console.log(winPath.exists);

const nixPath = new Path("/etc/passwd");
console.log(nixPath.elements);
console.log(nixPath.toString());
console.log(nixPath.ext);
console.log(nixPath.exists);
