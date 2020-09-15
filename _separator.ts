// Copryright 2020 Matheus Xavier all rights reserved. MIT licensed

export function _determineSeparators(): string[] {
  switch (Deno.build.os) {
    case "linux":
    case "darwin":
      return ["/"];
      break;
    case "windows":
      // windows can have either / or \ as path separators so we account for that
      // also takes into account window's preference for \
      return ["\\", "/"];
      break;
    default:
      throw Error("unexpected platform");
  }
}
