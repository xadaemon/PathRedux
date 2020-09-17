// Copyright 2020 Matheus Xavier all rights reserved. MIT licensed
import { _determineSeparators } from "./_separator.ts";
import Hashids from "./hashids.ts";

export const LINUX_SEPS = ["/"];
export const WINDOWS_SEPS = ["\\", "/"];

/**
 * this class represents a filesystem path, and allows for easy manipulation of said path
 */
export class Path {
  private pathElements: string[];
  private separators: string[];
  public trailingSlash: boolean = false;

  /**
   * Construct a path object
   * @param path initialize this instance with a path if passed
   * @param separators not needed most of the time allows for 
   */
  constructor(path?: string, separators?: string[]) {
    this.separators = separators || _determineSeparators();
    if (path) {
      this.trailingSlash = path[0] === "/";
      this.pathElements = Path.explodePath(this.separators, path);
    } else {
      this.pathElements = new Array<string>();
    }
  }

  /**
   * explodes a string into an array of strings
   * @param separators a list of valid separators for the host system
   * @param pathString the path to be exploded as a string
   */
  private static explodePath(
    separators: string[],
    pathString: string,
  ): string[] {
    const exploded = pathString.split("");
    const pathElements = new Array<string>();
    let currentElement = "";
    for (let charAt = 0; charAt < exploded.length; charAt++) {
      let char = exploded[charAt];
      if (separators.indexOf(char) === -1) {
        currentElement = currentElement + char;
      } else {
        if (currentElement) {
          pathElements.push(currentElement);
          currentElement = "";
        }
      }
    }
    pathElements.push(currentElement);
    return pathElements;
  }

  /**
   * render this path object as a string
   * @returns the stored path structure as a string
   * using the preferred system separator.
   */
  public toString(prefix?: string, suffix?: string): string {
    let path = this.pathElements.join(this.separators[0]);
    prefix = prefix || "";
    suffix = suffix || "";
    path = prefix.concat(path.concat(suffix));
    return this.trailingSlash ? "/".concat(path) : path;
  }

  /**
   * push a path fragment onto the end of this Path
   * @param e a string denoting a Path fragment
   */
  public push(e: string): Path {
    let pe = Path.explodePath(this.separatorList, e);
    pe.forEach((e) => this.pathElements.push(e));
    return this;
  }

  public pop(): Path {
    this.pathElements.pop();
    return this;
  }

  /**
   * finds the first valid node walking a path from the right
   * @param ignoreFiles if set files will be ignored on the resolution
   * @returns a new Path object with a Path object until the valid node
   */
  public findLastValidNode(ignoreFiles?: boolean): Path {
    let strRepr = this.toString();
    const np = new Path(strRepr);
    if (ignoreFiles) {
      while (!np.exists && !np.isFile) {
        np.pop();
      }
    } else {
      while (!np.exists) {
        np.pop();
      }
    }
    return np;
  }

  /**
   * takes the diff between Path x and Path y
   * @param x 
   * @param y
   * @returns elements in x but not in y
   */
  public static diff(x: Path, y: Path): string[] {
    const xRepr = x.elements;
    const yRepr = y.elements;
    let res = xRepr.filter((e) => {
      return yRepr.indexOf(e) === -1;
    });
    return res;
  }

  /**
   * returns the extension or null the dot will not be stripped
   * dotfiles are considered extensionless
   */
  get ext(): string | null {
    const lastElem = this.pathElements[this.pathElements.length - 1];
    const dotIndex = lastElem.split("").lastIndexOf(".");
    if (dotIndex !== 0 && dotIndex !== -1) {
      return lastElem.substr(dotIndex);
    } else {
      return null;
    }
  }

  /**
   * Checks if the path exists
   * ```ts
   * const path = new Path("/home/test/text.txt");
   * path.exists;
   * ```
   * requires: --allow-read flag
   */
  get exists(): boolean {
    try {
      Deno.statSync(this.toString());
      return true;
    } catch (e) {
      // do not hide permission errors from the user
      if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
      }
      return false;
    }
  }

  get isFile(): boolean {
    try {
      return Deno.statSync(this.toString()).isFile;
    } catch (e) {
      // do not hide permission errors from the user
      if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
      }
      return false;
    }
  }

  get isDir(): boolean {
    try {
      return Deno.statSync(this.toString()).isDirectory;
    } catch (e) {
      // do not hide permission errors from the user
      if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
      }
      return false;
    }
  }

  get isSymlink(): boolean {
    try {
      return Deno.statSync(this.toString()).isSymlink;
    } catch (e) {
      // do not hide permission errors from the user
      if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
      }
      return false;
    }
  }

  /**
   * request the inner representation of the path inside the class
   */
  get elements(): string[] {
    return this.pathElements;
  }

  /**
   * set the inner representation of the path inside the class
   */
  set elements(e: string[]) {
    this.pathElements = e;
  }

  set separatorList(sl: string[]) {
    this.separators = sl;
  }

  get separatorList(): string[] {
    return this.separators;
  }

  public static fromCWD(): Path {
    return new Path(Deno.cwd());
  }

  /**
   * @param path the desired path
   * @param parents whether or not to create the structure needed to achieve the final path
   * @returns `true` on success and `false` on failure
   * 
   */
  public mkDirSync(parents: boolean): boolean {
    // if the path already exists and is a dir there is nothing to do
    if (this.exists && this.isDir) {
      return true;
    }
    // find the last part of the path that is valid
    let vp = this.findLastValidNode();
    // take the diff between the valid path and the desired path
    let needs = Path.diff(this, vp);
    // create the needed paths
    for (let i = 0; i < needs.length; i++) {
      vp.push(needs[i]);
      Deno.mkdirSync(vp.toString());
    }
    return true;
  }

  public async mkDir(path: Path, parents: boolean): Promise<boolean> {
    // if the path already exists and is a dir there is nothing to do
    if (this.exists && this.isDir) {
      return true;
    }
    // find the last part of the path that is valid
    let vp = this.findLastValidNode();
    // take the diff between the valid path and the desired path
    let needs = Path.diff(this, vp);
    // create the needed paths
    for (let i = 0; i < needs.length; i++) {
      vp.push(needs[i]);
      await Deno.mkdir(vp.toString());
    }
    return true;
  }
  /**
   * Generate a new random folder name with it's path set to the system temporary folder
   * @param rngScalar 
   * @param prefix 
   * @param suffix 
   * @param joinChar 
   */
  public static genTmpPath(
    rngScalar: number = 4096,
    prefix: string = "",
    suffix: string = "",
    joinChar: string = ".",
    tmpDir?: string
  ): Path {
    const rn = Math.floor(Math.random() * rngScalar);
    const hsi = new Hashids(rn.toString(), 10);
    let tempPath;
    prefix = prefix ? prefix + joinChar : "";
    suffix = suffix ? joinChar + suffix : "";
    if (!tmpDir) {
      switch (Deno.build.os) {
        case "windows":
          tempPath = Deno.env.get("TMP") || Deno.env.get("TEMP");
          break;
        case "darwin":
        case "linux":
          tempPath = Deno.env.get("TMPDIR") || "/tmp";
          break;
        default:
          throw new Error("could not determine the system's temporary folder path, you can try specifying a tmpDir param");
      }
    } else {
      tempPath = tmpDir;
    }
    let pt = new Path(tempPath);
    return pt.push(prefix + hsi.encode(rn) + suffix);
  }
}
