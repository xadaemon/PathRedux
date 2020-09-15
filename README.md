# PathRedux
Better path handling for deno. This lib handles paths in a more dynamic and practical fashion

examples:
```ts
import {Path} from "https://deno.land/x/path/Path.ts";

const winPath = new Path("C:\\Users\\Test\\Documents/myFile.v1.txt", ["\\", "/"]);
console.log(winPath.elements);
console.log(winPath.toString());
console.log(winPath.ext);
console.log(winPath.exists);
```

# Features
* Handles windows acceptance of `\\` or `/` as separators
* On linux `\\` is treated as escaped charachters correctly
* Easily manipulate paths by pushing/poping or like an array
* Get file extensions with ease and correctly
* Make assertions about a path
