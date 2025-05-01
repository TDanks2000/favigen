import { promises as fsp } from "fs";

// Ensure the directory exists, recursively create if not
export async function ensureDir(dir: string): Promise<void> {
	await fsp.mkdir(dir, { recursive: true });
}

// Check if a path exists (returns true or false)
export async function pathExists(p: string): Promise<boolean> {
	try {
		await fsp.stat(p);
		return true;
	} catch {
		return false;
	}
}

// Typed version of writeFile (from fs.promises)
export const writeFile = fsp.writeFile;

// Typed version of stat (from fs.promises)
export const stat = fsp.stat;

export async function writeJson<T>(
	filePath: string,
	obj: T,
	options?: { spaces?: number },
): Promise<void> {
	const spaces = options?.spaces ?? 0;
	const data = JSON.stringify(obj, null, spaces);
	await fsp.writeFile(filePath, data, "utf8");
}
