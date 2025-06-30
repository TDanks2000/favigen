import { promises as fsp } from "fs";
import path from "path";

/**
 * Ensures a directory exists, creating it recursively if needed
 * @param dir - Directory path to ensure
 * @throws Error if directory creation fails
 */
export async function ensureDir(dir: string): Promise<void> {
	if (!dir || typeof dir !== "string") {
		throw new Error("Directory path must be a non-empty string");
	}
	try {
		await fsp.mkdir(dir, { recursive: true });
	} catch (error) {
		throw new Error(`Failed to create directory '${dir}': ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Checks if a path exists on the filesystem
 * @param p - Path to check
 * @returns Promise resolving to true if path exists, false otherwise
 */
export async function pathExists(p: string): Promise<boolean> {
	if (!p || typeof p !== "string") {
		return false;
	}
	try {
		await fsp.stat(p);
		return true;
	} catch {
		return false;
	}
}

/**
 * Checks if a path exists and is a file
 * @param filePath - Path to check
 * @returns Promise resolving to true if path is a file, false otherwise
 */
export async function isFile(filePath: string): Promise<boolean> {
	try {
		const stats = await fsp.stat(filePath);
		return stats.isFile();
	} catch {
		return false;
	}
}

/**
 * Checks if a path exists and is a directory
 * @param dirPath - Path to check
 * @returns Promise resolving to true if path is a directory, false otherwise
 */
export async function isDirectory(dirPath: string): Promise<boolean> {
	try {
		const stats = await fsp.stat(dirPath);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Gets file size in bytes
 * @param filePath - Path to file
 * @returns Promise resolving to file size in bytes
 * @throws Error if file doesn't exist or can't be accessed
 */
export async function getFileSize(filePath: string): Promise<number> {
	try {
		const stats = await fsp.stat(filePath);
		return stats.size;
	} catch (error) {
		throw new Error(`Failed to get file size for '${filePath}': ${error instanceof Error ? error.message : String(error)}`);
	}
}

export const writeFile = fsp.writeFile;
export const readFile = fsp.readFile;
export const stat = fsp.stat;

/**
 * Writes an object to a JSON file with proper formatting and error handling
 * @param filePath - Path where to write the JSON file
 * @param obj - Object to serialize to JSON
 * @param options - Formatting options
 * @throws Error if JSON serialization or file writing fails
 */
export async function writeJson<T>(
	filePath: string,
	obj: T,
	options?: { spaces?: number; ensureDir?: boolean },
): Promise<void> {
	if (!filePath || typeof filePath !== "string") {
		throw new Error("File path must be a non-empty string");
	}

	const spaces = options?.spaces ?? 0;
	
	try {
		// Ensure directory exists if requested
		if (options?.ensureDir) {
			const dir = path.dirname(filePath);
			await ensureDir(dir);
		}

		const data = JSON.stringify(obj, null, spaces);
		await fsp.writeFile(filePath, data, "utf8");
	} catch (error) {
		if (error instanceof Error && error.message.includes("JSON.stringify")) {
			throw new Error(`Failed to serialize object to JSON: ${error.message}`);
		}
		throw new Error(`Failed to write JSON file '${filePath}': ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Reads and parses a JSON file
 * @param filePath - Path to JSON file
 * @returns Promise resolving to parsed JSON object
 * @throws Error if file doesn't exist, can't be read, or contains invalid JSON
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
	if (!filePath || typeof filePath !== "string") {
		throw new Error("File path must be a non-empty string");
	}

	try {
		const data = await fsp.readFile(filePath, "utf8");
		return JSON.parse(data) as T;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error(`Invalid JSON in file '${filePath}': ${error.message}`);
		}
		throw new Error(`Failed to read JSON file '${filePath}': ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Safely writes data to a file with backup creation
 * @param filePath - Path to write to
 * @param data - Data to write
 * @param options - Write options
 */
export async function safeWriteFile(
	filePath: string,
	data: string | Buffer,
	options?: { backup?: boolean; encoding?: BufferEncoding },
): Promise<void> {
	if (!filePath || typeof filePath !== "string") {
		throw new Error("File path must be a non-empty string");
	}

	try {
		// Create backup if file exists and backup is requested
		if (options?.backup && await pathExists(filePath)) {
			const backupPath = `${filePath}.backup`;
			await fsp.copyFile(filePath, backupPath);
		}

		await fsp.writeFile(filePath, data, options?.encoding || "utf8");
	} catch (error) {
		throw new Error(`Failed to write file '${filePath}': ${error instanceof Error ? error.message : String(error)}`);
	}
}
