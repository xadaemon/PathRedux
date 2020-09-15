import {Path} from "./Path.ts";

const winPath = new Path("C:\\Users\\Test\\Documents/myFile.v1.txt", ["\\", "/"]);
console.log(winPath.elements);
console.log(winPath.toString());
console.log(winPath.ext);
console.log(winPath.exists);
