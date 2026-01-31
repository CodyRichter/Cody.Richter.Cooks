import { UAParser } from "ua-parser-js";

const parser = new UAParser();

/**
 * Get the device operating system for the current user.
 * This will return MacOS, Windows, Linux, iOS, Android, or Unknown.
 */
export function getOperatingSystem() {
  return parser.getOS().name || "Unknown";
}
