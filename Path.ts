// Copryright 2020 Matheus Xavier all rights reserved. MIT licensed
import { _determineSeparators } from "./_separator.ts";

const LINUX_SEPS = ['/'];
const WINDOWS_SEPS = ['\\', '/'];

/**
 * this class represents a filesystem path, and allows for easy manipulation of said path
 */
export class Path {
  private pathElements: string[];
  private separators: string[];

  /**
   * 
   * @param path initialiize this instance with a path if passed
   * @param separators not needed most of the time
   */
  constructor(path?: string, separators?: string[]) {
    this.separators = separators || _determineSeparators();
    if (path) {
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
   * @returns the stored path structure as a string
   * the preferred system separator will be used
   */
  public toString(): string {
    return this.pathElements.join(this.separators[0]);
  }

  public push(e: string) {
    this.pathElements.push(e);
  }

  public pop(): string | undefined {
    return this.pathElements.pop();
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
    } catch (e) {
      // do not hide permission errors from the user
      if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
      }
      return false;
    }
    return true
  }

  /**
   * rquest the inner representation of the path inside the class
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
}
