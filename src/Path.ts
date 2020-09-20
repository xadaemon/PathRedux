// Copyright 2020 Matheus Xavier all rights reserved. MIT licensed
import { _determineSeparators } from "./_separator.ts";
import Hashids from "./_hashids.ts";

/** unix style separators constant */
export const UNIX_SEPS = ["/"];
/** @deprecated will be removed on 3.0.0 in favor of UNIX_SEPS*/
export const LINUX_SEPS = UNIX_SEPS;
/** windows style separators constant */
export const WINDOWS_SEPS = ["\\", "/"];

/**
 * this class represents a filesystem path, and allows for easy manipulation of said path
 */
export class Path {
  private pathElements: string[];
  private separators: string[];
  public trailingSlash: boolean = false;

  /**
   * construct a path object already with a path or empty
   * @param path initialize this instance with a path if passed
   * @param separators not needed most of the time, allows for overriding of the separators
   * separators are an array where the 0th element is the preferred separator
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
   * @return the stored path structure as a string
   * using the preferred system separator.
   */
  public toString(prefix: string = "", suffix: string = "", separator?: string): string {
    let path = this.pathElements.join(separator || this.separators[0]);
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

  /**
   * removes an element from the end of this path and returns the path to allow for chaining
   * @deprecated the naming on this method is unfortunate and it's considered deprecated in favor of `del`
   */
  public pop(): Path {
    return this.del();
  }

  /**
   * removes an element from the end of this path and returns the path to allow for chaining
   */
  public del(): Path {
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
        np.del();
      }
    } else {
      while (!np.exists) {
        np.del();
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
   * create the specified path if parents is true any needed paths will be created
   * @param path the desired path
   * @param parents whether or not to create the structure needed to achieve the final path
   * @returns `true` on success and `false` on failure
   * 
   */
  public mkDirSync(parents: boolean = false): boolean {
    if (!parents) {
      Deno.mkdirSync(this.toString());
    }
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

  public async mkDir(parents: boolean = false): Promise<boolean> {
    if (!parents) {
      await Deno.mkdir(this.toString());
    }
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
   * remove self
   * @return true if success false otherwise
   */
  public async rm(recursive: boolean = false): Promise<void> {
    await Deno.remove(this.toString(), { recursive });
    return;
  }


  /**
   * remove self sync
   * @return true if success false otherwise
   */
  public rmSync(recursive: boolean = false): void {
    Deno.removeSync(this.toString(), { recursive });
  }


  /**
   * Generate a new random folder name with it's path set to the system temporary folder
   * @param rngScalar 
   * @param prefix 
   * @param suffix 
   * @param joinChar 
   * @deprecated slated for removal on v3.0.0
   */
  public static genTmpPath(
    rngScalar: number = 4096,
    prefix: string = "",
    suffix: string = "",
    joinChar: string = ".",
    tmpDir?: string
  ): Path {
    return Path.makeTmpDir({ rngScalar, prefix, suffix, joinChar, tmpDir });
  }


  public static getTmpPath(): Path {
    let tempPath: string | undefined;
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
    return new Path(tempPath);
  }


  /**
   * Generate a new random folder name with it's path set to the system temporary folder
   * @param rngScalar 
   * @param prefix 
   * @param suffix 
   * @param joinChar 
   */
  public static makeTmpDir(
    { rngScalar = 4096, prefix = "", suffix = "", joinChar = ".", tmpDir }: { rngScalar?: number; prefix?: string; suffix?: string; joinChar?: string; tmpDir?: string; } = {}): Path {
    const rn = Math.floor(Math.random() * rngScalar);
    const hsi = new Hashids(rn.toString(), 10);
    let pt;
    prefix = prefix ? prefix + joinChar : "";
    suffix = suffix ? joinChar + suffix : "";
    if (!tmpDir) {
      pt = Path.getTmpPath();
    } else {
      pt = new Path(tmpDir);
    }
    return pt.push(prefix + hsi.encode(rn) + suffix);
  }
}
