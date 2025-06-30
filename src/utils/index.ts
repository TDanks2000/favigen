/**
 * Utility functions for the favigen package
 * Provides file system operations, color formatting, and PNG to ICO conversion
 */

import * as colors from "./colors";

// Re-export all utilities
export * from "./fileSystem";
export * from "./pngToIco";

// Export colors as both named export and namespace
export { colors };

// Export commonly used file system functions with aliases for convenience
export {
	ensureDir as createDir,
	isDirectory as isDirType,
	isFile as isFileType,
	pathExists as exists,
	readJson as loadJson,
	safeWriteFile as safeSave,
	writeJson as saveJson,
} from "./fileSystem";

// Export PNG to ICO functions with aliases
export {
	encodeIco as createIco,
	getIcoInfo as inspectIco,
	isValidIco as validateIco,
	pngToIco as convertPngToIco,
} from "./pngToIco";

/**
 * Utility type for color functions
 */
export type ColorFunction = (text: string) => string;

/**
 * Utility type for file system write options
 */
export type WriteOptions = {
	spaces?: number;
	ensureDir?: boolean;
	backup?: boolean;
	encoding?: BufferEncoding;
};

/**
 * Common file extensions and their MIME types
 */
export const MIME_TYPES = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".json": "application/json",
	".xml": "application/xml",
	".html": "text/html",
	".css": "text/css",
	".js": "application/javascript",
	".ts": "application/typescript",
} as const;

/**
 * Common image sizes for favicons
 */
export const FAVICON_SIZES = {
	SMALL: [16, 32],
	MEDIUM: [48, 64],
	LARGE: [128, 256],
	APPLE_TOUCH: [180],
	ANDROID: [192, 512],
	WINDOWS: [70, 150, 310],
	ALL: [16, 32, 48, 64, 128, 180, 192, 256, 512],
} as const;

/**
 * Version information
 */
export const VERSION = "1.0.0";

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
	name: "favigen",
	version: VERSION,
	description:
		"Generate favicon.ico, assorted PNG icons, webmanifest, and browserconfig",
	author: "Favigen Team",
} as const;
