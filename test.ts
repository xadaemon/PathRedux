import { Path, WINDOWS_SEPS } from "./mod.ts";
import {
  assertEquals,
  assertArrayContains,
} from "https://deno.land/std@0.69.0/testing/asserts.ts";

Deno.test({
  name: "path explosion",
  fn: () => {
    let path: Path;
    if (Deno.build.os === "windows") {
      path = new Path("C:\\etc\\test\\.dotfolder\\test.cfg");
    } else {
      path = new Path("/etc/test/.dotfolder/test.cfg");
    }
    assertArrayContains(
      path.elements,
      ["etc", "test", ".dotfolder", "test.cfg"],
      "Path does not match the expected result"
    );
  },
});

Deno.test({
  name: "path rendering",
  fn: () => {
    let path: Path;
    let expects: string;
    if (Deno.build.os === "windows") {
      path = new Path("C:\\etc\\test\\.dotfolder\\test.cfg");
      expects = "C:\\etc\\test\\.dotfolder\\test.cfg";
    } else {
      path = new Path("/etc/test/.dotfolder/test.cfg");
      expects = "/etc/test/.dotfolder/test.cfg";
    }
    assertEquals(
      path.toString(),
      expects,
      "Path does not match the expected result"
    );
  },
});
